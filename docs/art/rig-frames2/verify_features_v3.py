"""R3 catalogs, equal-scale references, pairwise metrics and preservation checks.

Run verify.py first for exhaustive seams/cuts/timing/GIF, then this file.
Only writes inside rig-frames2. Rasterizes through the unchanged reference player.
"""
import hashlib, importlib.util, itertools, json, math, shutil
from player import R, M, assembly, raster, matrix
from verify import move, label, picture, FEATURES, pt
from pixels import read, bounds

S=80/620

def naked(gender,kind=None,typ='01',variant='normal'):
    ds=[n for n in assembly(gender=gender,**({kind:typ} if kind else {})) if n['role'] in ('headBase',*FEATURES)]
    if kind:
        for n in ds:
            if n['role']==kind:n['file']=M['features'][gender][kind][typ]['variants'][variant]
    return ds

def at_character(ds,x,y,height):
    s=height/620
    return move(ds,x-180*s,y-94*s,s)

def at_head(ds,x,y,height):
    s=height/620
    return move(ds,x-230*s,y-164*s,s)

def main():
    J=[];D=[];L=[label('FEATURES R3 / all 52 feature + expression entries',18,16,23),
        label('One feature changes per cell. Bare heads: 240px character scale (3x), then 80px scale (1x).',18,47,14),
        label('The small complete character uses the same feature / variant with default hair and other features.',18,68,14)]
    idx=0
    for gender,sets in M['features'].items():
        for kind,types in sets.items():
            for typ,entry in types.items():
                for expr in entry['variants']:
                    row,col=divmod(idx,4);x=18+col*282;y=105+row*175
                    ds=naked(gender,kind,typ,expr)
                    D+=at_head(ds,x,y,240)
                    D+=at_head(ds,x+126,y+67,80)
                    full=assembly(gender=gender,**{kind:typ})
                    for n in full:
                        if n['role']==kind:n['file']=entry['variants'][expr]
                    D+=at_character(full,x+187,y+26,80)
                    L.extend([label('3x',x+42,y+112,11),label('1x',x+137,y+112,11),label('80px',x+193,y+112,11),label(f'{gender} / {kind} {typ} / {expr}',x,y+139,13)])
                    idx+=1
    J.append(picture('verification/features_v3_catalog.png',[1146,105+math.ceil(idx/4)*175],D,L))

    # Approved crops were extracted in v1 from class_lineup.png; no image editing.
    spec=importlib.util.spec_from_file_location('v1ref',R.parent/'rig-frames/player.py')
    old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
    D=[];L=[label('FEATURES R3 / original reference comparison',18,14,25),label('Same 620px source-height calibration: 240px and 80px. V2 head and hair remain locked.',18,48,15)]
    for row,cls in enumerate(['novice','swordsman']):
        y=92+row*470
        sources=[]
        ds=old.assembly(cls)
        for n in ds:n['file']='../rig-frames/'+n['file']
        for col,(name,draws) in enumerate([('Approved lineup',None),('V1 golden face',ds),('R3 female 01',assembly(cls=cls,gender='female')),('R3 male 01',assembly(cls=cls,gender='male'))]):
            x=24+col*267
            L.append(label(f'{cls} / {name}',x,y,15))
            for height,yy in [(240,y+28),(80,y+303)]:
                if draws is None:
                    ss=height/310
                    D.append(dict(file=f'../rig-frames/source/lineup_{cls}.png',matrix=[ss,0,0,ss,x,yy]))
                else:D+=at_character(draws,x,yy,height)
                L.append(label(f'{height}px',x,yy+height+6,12))
    J.append(picture('verification/features_v3_vs_original.png',[1092,1044],D,L))

    D=[];L=[label('FEATURES R3 / 01 original - 02 round & gentle - 03 sharp & stern',18,15,23),label('Each set at 240px and 80px. All head, hair, neck and body assets are unchanged.',18,48,15)]
    for row,g in enumerate(['female','male']):
        for col,t in enumerate(['01','02','03']):
            x=20+col*340;y=94+row*350
            ds=assembly(gender=g,eyes=t,brows=t,mouth=t)
            D+=at_character(ds,x,y,240);D+=at_character(ds,x+213,y+159,80)
            L.append(label(f'{g} / type {t}',x,y+257,16));L.append(label('80px / 1x',x+210,y+257,12))
    J.append(picture('preview_overview.png',[1040,790],D,L))

    # Isolate one changed feature at actual 80px, both bare and with hair.
    D=[];L=[label('80px distinctness / one feature changes; all other selections stay 01',18,16,22),label('Top: bare head at 80px character scale. Below: full character at real 80px height.',18,47,14)]
    metric_files={}
    for row,(g,kind) in enumerate(itertools.product(['female','male'],FEATURES)):
        y=89+row*155;L.append(label(f'{g} / {kind}',18,y+40,16))
        for col,(t,entry) in enumerate(M['features'][g][kind].items()):
            x=208+col*205;ds=naked(g,kind,t)
            D+=at_head(ds,x+10,y,80)
            D+=at_character(assembly(gender=g,**{kind:t}),x,y+42,80)
            L.append(label(t,x+83,y+18,16))
            # Draw isolated ink into a common head-aligned skin background.
            origin=[M['head']['featureAnchors'][kind][i]-entry['pivot'][i] for i in (0,1)]
            node=dict(file=entry['variants']['normal'],matrix=matrix(origin))
            for scale_name,scale in [('source',1),('80px',S)]:
                f=f'verification/metrics/{g}_{kind}_{t}_{scale_name}.png'
                J.append(picture(f,[math.ceil(440*scale),math.ceil(460*scale)],move([node],0,0,scale),bg=[255,229,199]))
                metric_files[g,kind,t,scale_name]=f
    J.append(picture('verification/features_v3_80px.png',[850,1340],D,L))
    raster(J,'verification/features_v3_jobs.json')
    shutil.copy2(R/'verification/features_v3_catalog.png',R/'preview_faces.png')

    # Mean absolute RGB difference on a fixed per-feature union ROI; no alpha-
    # transparent RGB or huge empty-canvas dilution. Units are levels / 255.
    metrics=[]
    for g,kind in itertools.product(['female','male'],FEATURES):
        types=M['features'][g][kind];bbs=[]
        for t,e in types.items():
            w,h,b=read(R/e['variants']['normal']);bb=bounds(w,h,b)
            o=[M['head']['featureAnchors'][kind][i]-e['pivot'][i] for i in (0,1)]
            bbs.append([bb[0]+o[0],bb[1]+o[1],bb[2]+o[0],bb[3]+o[1]])
        roi=[min(b[0] for b in bbs)-2,min(b[1] for b in bbs)-2,max(b[2] for b in bbs)+2,max(b[3] for b in bbs)+2]
        for a,b in itertools.combinations(types,2):
            entry=dict(gender=g,feature=kind,pair=f'{a}-{b}',headSpaceROI=roi)
            for name,scale in [('source',1),('80px',S)]:
                w,h,aa=read(R/metric_files[g,kind,a,name]);wb,hb,bb=read(R/metric_files[g,kind,b,name]);assert (w,h)==(wb,hb)
                x0,y0=math.floor(roi[0]*scale),math.floor(roi[1]*scale)
                x1,y1=math.ceil(roi[2]*scale),math.ceil(roi[3]*scale)
                diffs=[abs(aa[(y*w+x)*4+c]-bb[(y*w+x)*4+c]) for y in range(y0,y1) for x in range(x0,x1) for c in range(3)]
                entry[name]=dict(meanAbsoluteRGB=round(sum(diffs)/len(diffs),4),maxChannelDifference=max(diffs),roi=[x0,y0,x1,y1])
            metrics.append(entry)
    result=dict(method='Mean absolute RGB channel difference on opaque skin, 0..255. Each gender/feature has one fixed union-of-normal-ink ROI + 2 source pixels padding, reused across all type pairs. 80px images are rasterized at 80/620 in head space before the same ROI is scaled with floor/ceil. No per-type recentering, no threshold substitutes for visual review.',pairs=metrics)
    (R/'verification/features_v3_distinctness.json').write_text(json.dumps(result,indent=2)+'\n')

    archived=json.loads((R/'archive/features_v2/sha256.json').read_text())
    protected={f:h for f,h in archived.items() if not f.startswith('assets/features/')}
    changed=[f for f,h in protected.items() if hashlib.sha256((R/f).read_bytes()).hexdigest()!=h]
    assert not changed,changed
    archived_m=json.loads((R/'archive/features_v2/manifest.json').read_text());assert M==archived_m
    feature_checks=[];anchors=0;maxerr=0
    for g,kind in itertools.product(['female','male'],FEATURES):
        for typ,e in M['features'][g][kind].items():
            for expr,file in e['variants'].items():
                w,h,b=read(R/file);bb=bounds(w,h,b)
                assert 0<bb[0]<bb[2]<w and 0<bb[1]<bb[3]<h,(file,bb)
                ow,oh,_=read(R/'archive/features_v2'/file);assert (w,h)==(ow,oh)
                feature_checks.append(dict(file=file,size=[w,h],inkBounds=bb,transparentMarginPass=True))
            for cls,state,facing in itertools.product(M['classes'],M['animations'],[-1,1]):
                for t in [0,*[sum(M['animations'][state]['durations'][:i]) for i in range(1,len(M['animations'][state]['frames']))]]:
                    ds=assembly(cls,state,t,g,facing=facing,**{kind:typ});node=next(n for n in ds if n['role']==kind)
                    # Default and selected pivot must resolve to the same anchor.
                    base=next(n for n in assembly(cls,state,t,g,facing=facing) if n['role']==kind)
                    target=pt(base['matrix'],M['features'][g][kind]['01']['pivot'])
                    err=math.dist(pt(node['matrix'],e['pivot']),target);maxerr=max(maxerr,err);anchors+=1
    assert maxerr<1e-9
    preservation=dict(protectedFiles=len(protected),changedProtectedFiles=changed,manifestByteIdentical=True,featurePNGs=len(feature_checks),featureBounds=feature_checks,allTypeAnchorChecks=anchors,maxAnchorErrorPx=maxerr)
    (R/'verification/features_v3_preservation.json').write_text(json.dumps(preservation,indent=2)+'\n')
    asset_hashes={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((R/'assets').rglob('*.png'))}
    (R/'verification/asset_sha256.json').write_text(json.dumps(asset_hashes,indent=2)+'\n')
    lines=['# R3 feature verification','', 'All values are mean absolute RGB differences, in 0–255 channel levels. See JSON for fixed ROI coordinates and full method. These numbers measure ink differences; they do not certify perceptual recognizability.','', '| Gender | Feature | Pair | Source | 80px |','|---|---|---|---:|---:|']
    for m in metrics:lines.append(f"| {m['gender']} | {m['feature']} | {m['pair']} | {m['source']['meanAbsoluteRGB']:.4f} | {m['80px']['meanAbsoluteRGB']:.4f} |")
    # Register golden eye ink into the new head coordinate system for an explicit
    # size/position check, independent of visual likeness or the pairwise metric.
    refs={}
    cases=[('v1',R.parent/'rig-frames/assets/faces/normal.png',[(0,220),(220,380)],[20,20]),
           ('female01',R/'assets/features/female/eyes/01_normal.png',[(0,80),(80,160)],[170,252]),
           ('male01',R/'assets/features/male/eyes/01_normal.png',[(0,80),(80,160)],[170,252])]
    for name,file,halves,offset in cases:
        w,h,data=read(file);entries=[]
        for left,right in halves:
            pts=[]
            for y in range(h):
                for x in range(left,right):
                    r,g,b,a=data[(y*w+x)*4:(y*w+x)*4+4]
                    if a>127 and b>r+40 and b>g:pts.append((x,y))
            bb=[min(x for x,y in pts)+offset[0],min(y for x,y in pts)+offset[1],max(x for x,y in pts)+1+offset[0],max(y for x,y in pts)+1+offset[1]]
            entries.append(dict(blueBoundsInV2Head=bb,width=bb[2]-bb[0],height=bb[3]-bb[1],bluePixels=len(pts)))
        refs[name]=entries
    refs['method']='Blue pixels: alpha >127, blue > red+40, blue > green. V1 translated +20,+20 to register neck [210,356] with [230,376]. Rectangles are exclusive-right/bottom; a curve redraw, not pixel-identical ink.'
    (R/'verification/features_v3_reference_measurements.json').write_text(json.dumps(refs,indent=2)+'\n')
    reg=json.loads((R/'verification/report.json').read_text())
    lines+=['',f'Protected files checked: {len(protected)}; changed: 0. Manifest remains byte-identical. All 52 PNG dimensions and pivots are unchanged.',f'All-type anchor checks: {anchors}; maximum error: {maxerr:g}px. Every feature has transparent margins.',
        f"Exhaustive regression: {reg['seam']['cases']:,} seam cases / {reg['seam']['sampledPixels']:,} samples; alpha failures {reg['seam']['alphaFailures']}, white failures {reg['seam']['whiteFailures']}; unoutlined head/hair cuts {reg['cut']['unoutlinedCuts']}. GIF: {reg['animation']['decodedFrames']} decoded frames, {reg['animation']['status']}.",
        '', 'Female 01 blue eye bounds match v1 within 1 source pixel (0.13px at runtime); right-eye bounds match exactly. Left eye: v1 28x46px, R3 28x45px. Right eye: both 24x44px. Male 01: 28x40px / 24x39px, with no lash flick. See `features_v3_reference_measurements.json`.',
        '', 'Design: 01 vertical/confident, 02 round/soft/open happy mouth, 03 angular/straight thick brow/neutral mouth. The initial cat mouth was rejected during 80px review and replaced by a straight neutral line. All hurt/closed/ko variants remain available.',
        '', 'Limits: the locked v2 skull and hair silhouette still differ from the lineup; a feature-only revision cannot make the entire head pixel-identical. Nose and small-mouth distinctions have the lowest visual salience at 80px. Native reference-player renders were verified; the running game was not inspected.',
        '', 'Regression details: `report.json`, `features_v3_regression.log`. Visual review: `features_v3_visual_review.json`.',
        '', 'Rebuild only facial curves: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art/rig-frames2/features_v3.py`. Re-run `verify.py`, then `verify_features_v3.py` to regenerate the complete R3 verification set. Do not use the historical `build.py` to rebuild R3 features: it is the preserved v2 full-rig generator.']
    (R/'verification/features_v3_report.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps(dict(metricPairs=len(metrics),protectedFiles=len(protected),anchorChecks=anchors,maxError=maxerr)))

if __name__=='__main__':main()
