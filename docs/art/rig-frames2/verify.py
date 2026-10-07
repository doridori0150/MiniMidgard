"""Exhaustive pixel QA, reference regression, and production contact sheets.
No third-party Python modules. Every feature combination is actually composited
in the native neck crop; no inference from anchors or opaque bounding boxes.
"""
import json,itertools,math,hashlib,subprocess,importlib.util
from collections import Counter
from player import M,R,assembly,select_frame,matrix,multiply,raster
from pixels import read,bounds
BG=[221,230,198];FEATURES=('eyes','brows','nose','mouth')
def pt(m,p):return [m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]]
def move(ds,x,y,s=1):return [dict(n,matrix=multiply([s,0,0,s,x,y],n['matrix'])) for n in ds]
def label(text,x,y,size=14):return dict(text=text,at=[x,y],size=size)
def picture(file,size,draws,labels=(),bg=BG):
    d=dict(op='render',file=file,size=size,draws=draws,labels=list(labels))
    if bg:d['background']=bg
    return d

def timeline():
    for state,a in M['animations'].items():
        t=0
        for f,d in zip(a['frames'],a['durations']):yield state,t,f;t+=d

def cut_scan(file):
    w,h,b=read(file);runs=[]
    # Four raster directions, BOTH interior-facing and exterior-facing contours.
    for dx,dy in [(1,0),(0,1),(1,1),(1,-1)]:
        for nx,ny in [(-dy,dx),(dy,-dx)]:
            edges=set()
            for y in range(1,h-1):
                for x in range(1,w-1):
                    if b[(y*w+x)*4+3]>127 and b[((y+ny)*w+x+nx)*4+3]<=127:edges.add((x,y))
            for x,y in sorted(edges):
                if (x-dx,y-dy) in edges:continue
                seq=[];xx,yy=x,y
                while (xx,yy) in edges:seq.append((xx,yy));xx+=dx;yy+=dy
                length=len(seq)*math.hypot(dx,dy)
                if length<=12:continue
                dark=sum(b[(v*w+u)*4]<128 for u,v in seq)/len(seq)
                # A continuous dark painted contour is a natural tangent, not an
                # unoutlined alpha slice. All detections are retained for review.
                runs.append(dict(start=[x,y],end=list(seq[-1]),length=round(length,2),outlineFraction=round(dark,3),classification='painted_contour' if dark>=.8 else 'unoutlined_cut'))
    # Follow the complete pixel boundary, then fit straight segments at ANY
    # orientation (<=0.75 px raster stair-step deviation). No slope whitelist.
    edges={}
    def opaque(x,y):return 0<=x<w and 0<=y<h and b[(y*w+x)*4+3]>127
    for y in range(h):
        for x in range(w):
            if not opaque(x,y):continue
            for absent,start,end in [(not opaque(x,y-1),(x,y),(x+1,y)),(not opaque(x+1,y),(x+1,y),(x+1,y+1)),(not opaque(x,y+1),(x+1,y+1),(x,y+1)),(not opaque(x-1,y),(x,y+1),(x,y))]:
                if absent:edges.setdefault(start,[]).append((end,(x,y)))
    def simplify(points,lo,hi):
        if hi-lo<2:return [lo,hi]
        ax,ay=points[lo];bx,by=points[hi];dx,dy=bx-ax,by-ay;length=math.hypot(dx,dy)
        if not length:mid=(lo+hi)//2;return simplify(points,lo,mid)[:-1]+simplify(points,mid,hi)
        dist,index=max((abs(dx*(ay-points[i][1])-(ax-points[i][0])*dy)/length,i) for i in range(lo+1,hi))
        if dist<=.75:return [lo,hi]
        return simplify(points,lo,index)[:-1]+simplify(points,index,hi)
    while edges:
        start=next(iter(edges));p=start;points=[p];inside=[]
        while p in edges:
            q,pixel=edges[p].pop()
            if not edges[p]:del edges[p]
            inside.append(pixel);points.append(q);p=q
            if p==start:break
        if len(points)<3:continue
        indices=simplify(points,0,len(points)-1)
        for lo,hi in zip(indices,indices[1:]):
            a,z=points[lo],points[hi];length=math.dist(a,z)
            if length<=12 or any(x in (0,w) or y in (0,h) for x,y in points[lo:hi+1]):continue
            pixels=inside[lo:hi];dark=sum(b[(y*w+x)*4]<128 for x,y in pixels)/len(pixels)
            runs.append(dict(start=list(a),end=list(z),length=round(length,2),outlineFraction=round(dark,3),classification='painted_contour' if dark>=.8 else 'unoutlined_cut',detector='all-angle contour fit',maxDeviationPx=.75))
    return dict(file=str(file.relative_to(R)) if file.is_relative_to(R) else str(file),runs=runs,unoutlinedCuts=sum(r['classification']=='unoutlined_cut' for r in runs))

def main():
    subprocess.run(['swiftc','-O','-module-cache-path',str(R/'.swift-cache'),str(R/'raster.swift'),'-o',str(R/'.raster')],check=True)
    J=[];batches=[];variants={};case_keys={};anchorchecks=0;maxerr=0;canvasfails=[]
    for gender in M['features']:
        vs=[];keys=[]
        for types in itertools.product(*[M['features'][gender][k] for k in FEATURES]):
            for expr,mapping in M['head']['expressionMap'].items():
                vs.append([dict(role=k,file=M['features'][gender][k][v]['variants'][mapping[k]]) for k,v in zip(FEATURES,types)])
                keys.append(dict(zip(FEATURES,types),expression=expr))
        variants[gender]=vs;case_keys[gender]=keys
    assetbounds={}
    for file in sorted((R/'assets').rglob('*.png')):
        w,h,b=read(file);assetbounds[str(file.relative_to(R))]=dict(size=[w,h],bounds=bounds(w,h,b))
    for cls,gender in itertools.product(M['classes'],M['head']['bases']):
        for hair,(state,t,name),facing in itertools.product(M['hairStyles'][gender],list(timeline()),[1,-1]):
            ds=assembly(cls,state,t,gender,hair,facing=facing)
            f=M['classes'][cls]['frames'][name];hm=matrix(f['neck']['point'],f['neck']['angle'],M['head']['neck'])
            if facing==-1:hm=multiply([-1,0,0,1,800,0],hm)
            neck=pt(hm,M['head']['neck']);cx,cy=map(lambda v:round(v)-80,neck)
            # Raster-center sample set: independent full 39x44 source-pixel corridor.
            samplepts=set()
            for y in range(355,399):
                for x in range(208,247):
                    wx,wy=pt(hm,[x+.5,y+.5]);samplepts.add((math.floor(wx)-cx,math.floor(wy)-cy))
            batches.append(dict(id=f'{cls}/{gender}/{hair}/{name}/{facing}',gender=gender,size=[160,160],draws=move(ds,-cx,-cy),samples=sorted(samplepts)))
            for n in ds:
                bb=assetbounds[n['file']]['bounds'];corners=[pt(n['matrix'],p) for p in itertools.product([bb[0],bb[2]],[bb[1],bb[3]])]
                if any(x<0 or y<0 or x>M['canvas']['size'][0] or y>M['canvas']['size'][1] for x,y in corners):canvasfails.append([cls,gender,hair,name,facing,n['file']])
                role=n['role']
                if role in FEATURES:
                    feat=M['features'][gender][role]['01'];want=pt(hm,M['head']['featureAnchors'][role]);got=pt(n['matrix'],feat['pivot']);maxerr=max(maxerr,math.dist(got,want));anchorchecks+=1
                if role=='weapon':
                    got=pt(n['matrix'],M['weapons'][M['classes'][cls]['defaultWeapon']]['grip']);want=list(f['hand']['point']);want[0]=800-want[0] if facing==-1 else want[0];maxerr=max(maxerr,math.dist(got,want));anchorchecks+=1
            if facing==1:
                fn=f'verification/assembled/{cls}_{gender}_{hair}_{name}.png'
                J.append(picture(fn,M['canvas']['size'],ds,bg=None))
    # Every full feature combination is drawn, sampled, and counted in native code.
    J.insert(0,dict(op='seamBatch',file='verification/seam_pixels.json',batches=batches,variants=variants))
    (R/'verification/feature_cases.json').write_text(json.dumps(case_keys,indent=2)+'\n')
    # All poses, two visibly different independent selections and hairstyles.
    D=[];L=[label('FRAMES / 2 classes x 2 genders x 14 frames x 2 feature combinations',20,15,22)]
    group=0
    for cls,gender in itertools.product(M['classes'],M['head']['bases']):
        for vi,hair in enumerate(M['hairStyles'][gender]):
            yy=60+group*478;L.append(label(f'{cls.upper()} / {gender} / hair {hair} / '+('01-01-01-01' if vi==0 else '02-03-02-02'),20,yy,17))
            for i,(state,t,name) in enumerate(timeline()):
                row,col=divmod(i,7);x=col*210;y=yy+28+row*215
                ds=assembly(cls,state,t,gender,hair,eyes='01' if vi==0 else '02',brows='01' if vi==0 else '03',nose='01' if vi==0 else '02',mouth='01' if vi==0 else '02')
                D+=move(ds,x-8,y,.235);L.append(label(name,x+50,y+210,12))
            group+=1
    J.append(picture('preview_frames.png',[1490,60+group*478],D,L))
    # Every feature type/variant, shown independently on each bare head base.
    D=[];L=[label('FEATURE CATALOG / each type and variant on both bare head bases',20,15,22)];idx=0
    for gender,sets in M['features'].items():
        for kind,types in sets.items():
            for typ,feature in types.items():
                for expr,file in feature['variants'].items():
                    row,col=divmod(idx,7);x=col*205;y=62+row*230
                    ds=[n for n in assembly(gender=gender) if n['role'] in ('headBase',*FEATURES)]
                    for n in ds:
                        if n['role']==kind:n['file']=file
                    # Head only: common world face bbox x~235..520,y~145..450.
                    D+=move(ds,x-91,y-48,.52)
                    L.append(label(f'{gender} / {kind} {typ}',x+8,y+194,12));L.append(label(expr,x+8,y+210,12));idx+=1
    J.append(picture('preview_faces.png',[1455,70+math.ceil(idx/7)*230],D,L))
    # 3x source-resolution neck windows, each frame, class, gender and hairstyle.
    D=[];L=[label('NECK JOIN / 3x SOURCE PIXELS / full chin-to-collar window',20,15,22)];idx=0
    for cls,gender in itertools.product(M['classes'],M['head']['bases']):
        for hair in M['hairStyles'][gender]:
            for state,t,name in timeline():
                f=M['classes'][cls]['frames'][name];nx,ny=f['neck']['point'];file=f'verification/neck_tiles/{cls}_{gender}_{hair}_{name}.png'
                J.append(picture(file,[330,252],move(assembly(cls,state,t,gender,hair),-(nx-55)*3,-(ny-42)*3,3)))
                row,col=divmod(idx,7);x=col*344;y=60+row*282
                D.append(dict(file=file,matrix=matrix([x,y])));L.append(label(f'{cls} {gender} {hair} {name}',x+3,y+257,12));idx+=1
    J.append(picture('verification/neck_closeups.png',[2410,60+math.ceil(idx/7)*282],D,L))
    # Small presentation sample with both genders, all hairstyles and 80px runtime scale.
    D=[];L=[label('V2 / approved pose bodies + distinct heads + selectable facial ink',20,15,23)]
    for i,(cls,gender,hair) in enumerate((c,g,h) for c in M['classes'] for g in M['head']['bases'] for h in M['hairStyles'][g]):
        row,col=divmod(i,4);x=col*280;y=55+row*390;ds=assembly(cls=cls,gender=gender,hair=hair)
        D+=move(ds,x-20,y,.37);D+=move(ds,x+180,y+265,80/620)
        L.append(label(f'{cls} / {gender} / {hair}',x+12,y+309,14))
    J.append(picture('preview_overview.png',[1140,860],D,L))
    files=[]
    for tick in range(80):
        D=[];L=[label('Idle / walk / attack (280 ms + 520 ms idle recovery)',20,14,20)];tm=tick*40
        for row,(cls,gender) in enumerate(itertools.product(M['classes'],M['head']['bases'])):
            for col,state in enumerate(['idle','walk','attack']):
                phase=tm%800;st='idle' if state=='attack' and phase>=280 else state;t=phase if state=='attack' else tm
                D+=move(assembly(cls,st,t,gender),col*285-28,44+row*250,.30)
                L.append(label(f'{cls} {gender} / {state}',col*285+25,266+row*250,13))
        file=f'verification/animation_frames/{tick:03d}.png';files.append(file);J.append(picture(file,[890,1050],D,L))
    J.append(dict(op='gif',file='preview_animation.gif',frames=files,delay=.04))
    # Reproduce original player without writing a single byte to v1.
    spec=importlib.util.spec_from_file_location('v1player',R.parent/'rig-frames/player.py');old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
    baseline=[]
    for hair in ('01','02'):
        ds=old.assembly(hair=hair)
        for n in ds:n['file']='../rig-frames/'+n['file'];n['role']='v1'
        J.append(picture(f'verification/v1_idle_{hair}.png',M['canvas']['size'],ds,bg=None))
        samples=[[x,y] for y in range(433,478) for x in range(378,417)]
        baseline.append(dict(id=f'v1/idle/{hair}',gender='v1',size=M['canvas']['size'],draws=ds,samples=samples))
    J.append(dict(op='seamBatch',file='verification/v1_seam_pixels.json',batches=baseline,variants={'v1':[[]]}))
    # Deliberate transparent and white-strip mutations prove the sampler fails.
    from pixels import write
    for color,name in [([255,255,255,255],'white'),([0,0,0,0],'transparent')]:
        write(R/f'verification/{name}_fixture.png',4,4,bytes(color)*16)
    J.append(dict(op='seamBatch',file='verification/sampler_negative_controls.json',variants={'test':[[]]},batches=[dict(id=k,gender='test',size=[4,4],draws=[dict(file=f'verification/{k}_fixture.png',matrix=matrix([0,0]),role='fixture')],samples=[[x,y] for y in range(4) for x in range(4)]) for k in ('white','transparent')]))
    raster(J,'verification/jobs.json')
    seams=json.loads((R/'verification/seam_pixels.json').read_text());oldseams=json.loads((R/'verification/v1_seam_pixels.json').read_text());negative=json.loads((R/'verification/sampler_negative_controls.json').read_text())
    cuts=[cut_scan(p) for folder in ('hair','head') for p in sorted((R/'assets'/folder).glob('*.png'))]
    oldcuts=[cut_scan(p) for p in sorted((R.parent/'rig-frames/assets/hair').glob('02_*.png'))]
    (R/'verification/cut_edges.json').write_text(json.dumps(dict(v2=cuts,v1=oldcuts),indent=2)+'\n')
    # Independent feature selection, timing, and mirrored anchor identity.
    for state,a in M['animations'].items():
        t=0
        for f,d in zip(a['frames'],a['durations']):assert select_frame(state,t)==f and select_frame(state,t+d-1)==f;t+=d
        assert select_frame(state,-1)==a['frames'][0]
        assert select_frame(state,t)==(a['frames'][0] if a['loop'] else a['frames'][-1])
    independence=0
    for gender in M['features']:
        baseline={n['role']:n['file'] for n in assembly(gender=gender)}
        for kind in FEATURES:
            changed={n['role']:n['file'] for n in assembly(gender=gender,**{kind:'02'})}
            assert [k for k in baseline if baseline[k]!=changed[k]]==[kind];independence+=1
    mutation_pass=negative['alphaFailures']==16 and negative['whiteFailures']==16
    subprocess.run(['swift','-module-cache-path',str(R/'.swift-cache'),str(R/'verification/check_gif.swift'),str(R)],check=True)
    gif=json.loads((R/'verification/gif_report.json').read_text())
    body_preservation=[]
    for cls,cfg in M['classes'].items():
        for name,f in cfg['frames'].items():
            w,h,b=read(R/f['body']);ow,oh,old=read(R.parent/'rig-frames'/f['body']);assert (w,h)==(ow,oh)
            changed=0
            nx,ny=f['neck']['point'];px,py=f['bodyPosition']
            for y in range(h):
                for x in range(w):
                    k=(y*w+x)*4
                    assert b[k+3]==old[k+3],('body alpha changed',cls,name,x,y)
                    if b[k:k+3]!=old[k:k+3]:
                        changed+=1;assert nx-px-60<=x<nx-px+60 and ny-py-25<=y<ny-py+30,('outside collar',cls,name,x,y)
            body_preservation.append(dict(cls=cls,frame=name,changedCollarPixels=changed,poseAndAlphaUnchanged=True))
    (R/'verification/body_preservation.json').write_text(json.dumps(body_preservation,indent=2)+'\n')
    report=dict(schema=M['schema'],status='pass' if not seams['failures'] and maxerr<1e-9 and not canvasfails and not any(c['unoutlinedCuts'] for c in cuts) and mutation_pass else 'fail',bodyFrames=28,bodyGenderSets=4,sharedBodyFrames=True,headBases=2,hairstyles=4,featurePNGs=52,assetPNGs=len(assetbounds),seam=dict(cases=seams['cases'],sampledPixels=seams['sampledPixels'],alphaFailures=seams['alphaFailures'],whiteFailures=seams['whiteFailures'],failedGeometryGroups=sum(g['failedCases']>0 for g in seams['groups']),expressions=list(M['head']['expressionMap']),featureCombinationsPerGender=54,facings=[1,-1],method='Actually render all combinations into 160x160 transparent neck crops using reference player transforms. Sample an independent 39x44 head-space chin-to-collar corridor. Reject alpha<254 or near-white RGB>245/240/220 outside visible cream hair; a separately composited material mask distinguishes hair from neck skin. No bounding-box or cache-based substitution.',details='seam_pixels.json'),cut=dict(thresholdPx=12,directions=['all angles via contour fitting','horizontal/vertical/diagonal exact raster runs'],unoutlinedCuts=sum(c['unoutlinedCuts'] for c in cuts),paintedContourCandidates=sum(len(c['runs'])-c['unoutlinedCuts'] for c in cuts),method='Trace all alpha contours and fit straight segments at arbitrary angles with <=0.75 px raster tolerance; also enumerate exact raster runs; report every run >12 px. A >=80% dark closed painted outline marks a natural contour/tangent, not a raw alpha slice. All candidates kept for inspection.',details='cut_edges.json'),animation=gif,bodyPreservation=dict(frames=len(body_preservation),allAlphaUnchanged=True,allChangesInsideCollar=True),anchors=dict(checks=anchorchecks,maxErrorPx=maxerr,canvasBoundsFailures=canvasfails,featureIndependenceChecks=independence),regression=dict(v1AlphaFailures=oldseams['alphaFailures'],v1WhiteFailures=oldseams['whiteFailures'],v1Hair02UnoutlinedCuts=sum(c['unoutlinedCuts'] for c in oldcuts),samplerNegativeControlsPass=mutation_pass),limitations=['Game integration is not modified or tested; frames/2 requires the new player layer order and feature contract.','Both genders intentionally share each class body pose. Gender difference is in head shape, hair, eyes and brows.','Approved body poses are retained, including their inherited small cloth and armor variation and idle shading. Only local collar skin and the overbright steel rim colors are normalized.','Clean head/hair contours are manually normalized curves based on saved generated art; they are not pixel-identical to approved art.','Cut detection uses 0.75 px contour-fit tolerance and painted-outline classification; tiny or strongly antialiased defects can still require visual review.','Arbitrary extra head rotations outside the provided pose angles are not part of the shipped animation contract.'])
    (R/'verification/report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));assert report['status']=='pass','Inspect verification/report.json and seam/cut detail reports.'
if __name__=='__main__':main()
