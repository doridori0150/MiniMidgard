"""Rebuild v2 assets from saved imagegen source + unchanged v1 poses. No network.
Python standard library + Swift/CoreGraphics on macOS. See PLAN.md.
"""
from pathlib import Path
import json,subprocess,shutil,math
from pixels import write,read,bounds
R=Path(__file__).resolve().parent
OLD=R.parent/'rig-frames'
INK=[59,40,28];SKIN=[255,229,199];CREAM=[255,243,220];SHADOW=[241,211,172]

def raster(jobs,name='source/build_jobs.json'):
    (R/name).write_text(json.dumps(jobs)+'\n')
    subprocess.run([str(R/'.raster'),str(R),name],check=True)

def vec(file,size,shapes):return dict(op='vector',file=file,size=size,shapes=shapes,supersample=3)
def path(cmds,fill=None,width=5,stroke=INK):
    d=dict(path=cmds)
    if fill is not None:d['fill']=fill
    if stroke is not None:d.update(stroke=stroke,width=width)
    return d

def ellipse(x,y,w,h,fill,stroke=None,width=3):
    d=dict(ellipse=[x,y,w,h],fill=fill)
    if stroke:d.update(stroke=stroke,width=width)
    return d

def main():
    for d in ['source','verification','assets/head','assets/hair','assets/features']: (R/d).mkdir(parents=True,exist_ok=True)
    subprocess.run(['swiftc','-O','-module-cache-path',str(R/'.swift-cache'),str(R/'raster.swift'),'-o',str(R/'.raster')],check=True)
    for d in ['body','equipment','grip']:shutil.copytree(OLD/'assets'/d,R/'assets'/d,dirs_exist_ok=True)
    jobs=[]
    # Clean editable production contours traced from the generated design.
    from source.contours import artwork
    bases,styles=artwork()
    for gender,shapes in bases.items():jobs.append(vec(f'assets/head/{gender}.png',[440,460],shapes))
    for id,(back,front) in styles.items():
        jobs.append(vec(f'assets/hair/{id}.png',[440,460],front))
        jobs.append(vec(f'assets/hair/{id}_back.png',[440,460],back))
    # A full curved neck capsule, behind the body collar and head. Side contour only;
    # curved caps are overlapped, so no horizontal skin cut can be exposed.
    neck=[path([['M',201,341],['C',201,328,251,328,254,343],['C',257,365,260,391,254,412],['C',248,425,209,425,203,411],['C',196,391,198,363,201,341],['Z']],SKIN,5)]
    jobs.append(vec('assets/head/neck.png',[440,460],neck))
    # Small editable native vector sources for facial ink; every feature remains a
    # separate transparent PNG with its own anchor/pivot. Hard shadow only.
    features={}
    for gender in ['female','male']:
        sets={}
        for kind,count,variants,sz,pivot in [('eyes',3,['normal','hurt','closed'],[160,72],[80,30]),('brows',3,['normal','hurt'],[160,40],[80,20]),('nose',2,['normal'],[34,34],[17,17]),('mouth',3,['normal','hurt','ko'],[66,46],[33,23])]:
            sets[kind]={}
            for typ in range(1,count+1):
                files={}
                for variant in variants:
                    shapes=[]
                    if kind=='eyes':
                        for side,cx in enumerate([35,123]):
                            cy=29-(2 if side else 0)
                            if variant=='normal':
                                ww=[22,25,19][typ-1];hh=([39,35,42] if gender=='female' else [27,24,30])[typ-1]
                                shapes.append(ellipse(cx-ww/2,cy-hh/2+5,ww,hh,[26,130,207]))
                                shapes.append(path([['M',cx-ww/2,cy-hh/2+14],['Q',cx,cy-hh/2+11,cx+ww/2,cy-hh/2+14],['L',cx+ww/2,cy-hh/2+5],['Q',cx,cy-hh/2-2,cx-ww/2,cy-hh/2+5],['Z']],[29,99,166],stroke=None))
                                if gender=='female':
                                    shapes.append(path([['M',cx-ww/2-2,cy-hh/2+1],['Q',cx,cy-hh/2-3,cx+ww/2+1,cy-hh/2+1]],width=3.3))
                                    if typ==2:shapes.append(path([['M',cx-ww/2-2,cy-hh/2+1],['L',cx-ww/2-6,cy-hh/2-3]],width=3.2))
                                else:shapes.append(path([['M',cx-ww/2,cy-hh/2+2],['L',cx+ww/2,cy-hh/2+2]],width=3.5))
                            elif variant=='hurt':
                                direction=1 if side==0 else -1;depth=[9,6,12][typ-1]
                                shapes.append(path([['M',cx-direction*10,cy-depth],['L',cx+direction*6,cy],['L',cx-direction*10,cy+depth]],width=4 if gender=='female' else 5))
                            else:shapes.append(path([['M',cx-12,cy-2],['Q',cx,cy+[5,1,8][typ-1],cx+11,cy-2]],width=3.6 if gender=='female' else 4.5))
                    elif kind=='brows':
                        for side,cx in enumerate([35,123]):
                            flip=1 if side==0 else -1
                            if variant=='hurt':cmd=[['M',cx-15*flip,17],['Q',cx,8,cx+14*flip,22]]
                            elif typ==1:cmd=[['M',cx-16*flip,15],['L',cx+13*flip,23]]
                            elif typ==2:cmd=[['M',cx-15,19],['Q',cx,12 if gender=='female' else 17,cx+14,19]]
                            else:cmd=[['M',cx-15*flip,22],['L',cx+13*flip,15]]
                            shapes.append(path(cmd,width=4 if gender=='female' else 7))
                    elif kind=='nose':
                        if typ==1:shapes=[ellipse(16,16,3.3,3.3,INK)]
                        else:shapes=[path([['M',19,12],['L',15,20],['Q',19,23,23,20]],width=2.4)]
                    elif kind=='mouth':
                        if variant=='normal':
                            if typ==1:shapes=[path([['M',23,21],['Q',33,31,43,21]],width=3.2)]
                            elif typ==2:shapes=[path([['M',22,21],['Q',32,25,44,18]],width=3.2)]
                            else:shapes=[path([['M',25,23],['Q',33,20,41,23]],width=3.2)]
                        elif variant=='hurt':
                            if typ==1:shapes=[path([['M',22,27],['Q',33,15,44,26]],width=3.5)]
                            elif typ==2:shapes=[path([['M',23,25],['L',28,21],['L',34,25],['L',42,20]],width=3.3)]
                            else:shapes=[ellipse(27,16,14,17,INK)]
                        else:
                            if typ==1:shapes=[path([['M',25,23],['Q',33,20,42,24]],width=3)]
                            elif typ==2:shapes=[ellipse(28,18,10,12,INK)]
                            else:shapes=[path([['M',24,22],['Q',33,27,42,22]],width=3)]
                    file=f'assets/features/{gender}/{kind}/{typ:02d}_{variant}.png'
                    (R/file).parent.mkdir(parents=True,exist_ok=True)
                    jobs.append(vec(file,sz,shapes));files[variant]=file
                sets[kind][f'{typ:02d}']=dict(pivot=pivot,variants=files)
        features[gender]=sets
    raster(jobs)
    # Local collar skin normalization fixes the inherited pale extraction seam only.
    M=json.loads((OLD/'manifest.json').read_text());patches=[]
    for cls,cfg in M['classes'].items():
        cfg['bodySets']={g:dict(sharedFrames=True,framesRef=f'classes.{cls}.frames') for g in ['female','male']}
        cfg['defaultHair']={'female':'01','male':'02'}
        for name,f in cfg['frames'].items():
            file=f['body'];bw,bh,b=read(R/file);px,py=f['bodyPosition'];nx,ny=f['neck']['point'];changed=0
            for y in range(max(0,ny-py-25),min(bh,ny-py+30)):
                for x in range(max(0,nx-px-60),min(bw,nx-px+60)):
                    k=(y*bw+x)*4;r,g,bl,a=b[k:k+4]
                    # Warm ivory skin, never cool steel or dark collar outline.
                    if a>0 and r>225 and g>207 and bl>176 and r-bl>24:
                        if [r,g,bl]!=SKIN:changed+=1
                        b[k:k+3]=bytes(SKIN)
                    elif cls=='swordsman' and a>0 and r>245 and g>240 and bl>220:
                        # Flatten inherited bright steel rim inside the join ROI.
                        b[k:k+3]=bytes([222,221,219]);changed+=1
            write(R/file,bw,bh,b);patches.append(dict(file=file,recoloredPixels=changed))
    M['schema']='minimidgard.frames/2'
    M['head']=dict(size=[440,460],neck=[230,376],neckLayer='assets/head/neck.png',bases={g:f'assets/head/{g}.png' for g in ['female','male']},featureAnchors={'eyes':[250,282],'brows':[250,251],'nose':[269,310],'mouth':[252,333]},skullAnchors={'crown':[214,100],'brow':[294,243]},expressionMap={'normal':{'eyes':'normal','brows':'normal','nose':'normal','mouth':'normal'},'hurt':{'eyes':'hurt','brows':'hurt','nose':'normal','mouth':'hurt'},'ko':{'eyes':'closed','brows':'hurt','nose':'normal','mouth':'ko'},'blink':{'eyes':'closed','brows':'normal','nose':'normal','mouth':'normal'}})
    M['hairStyles']={'female':{'01':dict(file='assets/hair/female01.png',name='bob with ahoge'),'05':dict(file='assets/hair/female05.png',name='high ponytail')},'male':{'02':dict(file='assets/hair/male02.png',name='short spiky'),'03':dict(file='assets/hair/male03.png',name='short side part')}}
    for gender,styles in M['hairStyles'].items():
        for id,style in styles.items():
            style['front']=style.pop('file');style['back']=f'assets/hair/{gender}{id}_back.png'
    M['features']=features
    M['defaultFeatures']={g:dict(eyes='01',brows='01',nose='01',mouth='01') for g in features}
    M['renderContract'].update(order=['weaponBehind','neck','hairBack','body','headBase','eyes','brows','nose','mouth','hair','headgear','weaponFront','gripOverlay'],headUnitOrder=['headBase','eyes','brows','nose','mouth','hair','headgear'],head='neck uses the same rigid head matrix but renders before body; rear hair is a complete closed silhouette before body; front fringe is a complete closed contour',features='selected types are independent; body expression resolves variant through head.expressionMap; blink explicitly overrides expression',gender='female and male bases, hair and features; bodySets intentionally resolve to shared class frames',unknownIds='error, including unsupported gender/hair pairs; no silent fallback')
    M['verification']={'joinRegion':{'space':'head','polygon':[[208,355],[247,355],[246,399],[208,399]],'note':'Independent chin-to-collar interior corridor; includes overlap with chin and collar. Not derived from assembled alpha.'}}
    (R/'manifest.json').write_text(json.dumps(M,indent=2)+'\n');(R/'source/collar_changes.json').write_text(json.dumps(patches,indent=2)+'\n')
    print('Built v2: 28 shared body frames, 2 bases, 4 complete wigs, 52 feature PNGs.')
if __name__=='__main__':main()
