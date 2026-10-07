"""Exhaustive contract checks and production previews; no external Python packages."""
from pathlib import Path
import json, math, itertools, runpy
from player import M,R,assembly,select_frame,multiply,matrix,raster
BG=[0.867,0.902,0.775]
J=[]
def picture(file,size,draws,labels=(),background=BG):
    j=dict(op='render',file=file,size=size,draws=draws,labels=list(labels))
    if background is not None:j['background']=background
    J.append(j)
def label(text,x,y,size=16):return dict(text=text,at=[x,y],size=size)
def transformed(draws,x,y,scale):
    return [dict(n,matrix=multiply([scale,0,0,scale,x,y],n['matrix'])) for n in draws]
def times(state):
    a=M['animations'][state];t=0
    for d in a['durations']:yield t;t+=d
# Every body frame on two heads, both equipment sets. 56 assembled thumbnails.
D=[];L=[label('PAINTED BODY FRAMES / 2 classes x 14 poses x 2 hairstyles',24,16,23),label('Each pose: hair 01 + leaf + dagger | hair 02 + star pin + sword. Held weapons hidden for cast / sit / dead.',24,48,15)]
row=0
for cls in M['classes']:
    for state in M['animations']:
        y=92+row*235;L.append(label(f'{cls.upper()} / {state}',20,y,17))
        for col,t in enumerate(times(state)):
            x=195+col*370
            for v,(hair,weapon,gear) in enumerate([('01','dagger',['leaf']),('02','sword',['hairpin'])]):
                D+=transformed(assembly(cls,state,t,hair,None,weapon,gear),x+v*174-90,y+10,.235)
            L.append(label(f'{select_frame(state,t)}  @ {t} ms',x-35,y+204,13))
        row+=1
picture('preview_frames.png',[1730,92+row*235],D,L)
# Approved / actual resting assembly at exactly 80 and 240 reference pixels high.
D=[];L=[label('APPROVED LINEUP / FRAME PLAYER',24,18,25),label('Same reference-height scaling. Left: approved source. Right: assembled idle. No headgear.',24,55,16)]
for ci,cls in enumerate(M['classes']):
    y=110+ci*410;L.append(label(cls.upper(),25,y,22))
    ref=f'source/lineup_{cls}.png'
    for height,x in [(240,150),(80,680)]:
        # Source character height is approximately 310 px; ours is 620 master pixels.
        scale=height/620; yy=y+40
        D.append(dict(file=ref,matrix=[height/310,0,0,height/310,x,yy]))
        D+=transformed(assembly(cls),x+210-185*scale,yy-98*scale,scale)
        L.extend([label(f'Lineup / {height}px',x,yy+height+17,15),label(f'Frames / {height}px',x+210,yy+height+17,15)])
picture('preview_vs_lineup.png',[1110,950],D,L)
# Expressions, accessories, and mirrored samples; larger heads make mask mistakes visible.
D=[];L=[label('HEAD / EXPRESSION / EQUIPMENT CHECK',22,17,24)]
for r,cls in enumerate(M['classes']):
    for c,(hair,expr) in enumerate(itertools.product(['01','02'],['normal','hurt','ko'])):
        x=25+c*210;y=62+r*295
        D+=transformed(assembly(cls,'idle',0,hair,None,'sword',['leaf','hairpin'],expression=expr),x-70,y,.34)
        L.append(label(f'{cls}  {hair}  {expr}',x,y+263,13))
picture('preview_heads.png',[1300,670],D,L)
# Animation includes both true attack timing and a static contact reference.
files=[]
for tick in range(80):
    t=tick*40;D=[];L=[label('FRAME ANIMATION / idle 1600ms / walk 720ms / attack 280ms',22,16,20)]
    for ci,cls in enumerate(M['classes']):
        for col,state in enumerate(['idle','walk','attack']):
            # The 280ms attack is followed by 520ms idle recovery for readability.
            phase=t%800;actual=state;tm=t
            if state=='attack':actual='attack' if phase<280 else 'idle';tm=phase if phase<280 else 0
            D+=transformed(assembly(cls,actual,tm,'01' if ci==0 else '02',None,None if state=='walk' else M['classes'][cls]['defaultWeapon'],['leaf'] if ci==0 else ['hairpin']),col*340-25,55+ci*320,.39)
            L.append(label(f'{cls} / {state}'+(f'  {phase}ms' if state=='attack' and phase<280 else ''),col*340+35,345+ci*320,15))
    f=f'verification/animation_frames/{tick:03d}.png';files.append(f);picture(f,[1080,710],D,L)
J.append(dict(op='gif',file='preview_animation.gif',frames=files,delay=.04))
# Source asset alpha bounds, then exact transformed alpha bounding boxes.
assets=set()
for cls in M['classes']:
    for state in M['animations']:
        for t in times(state):
            for hair in M['hairStyles']:
                assets.update(n['file'] for n in assembly(cls,state,t,hair,None,'sword',['leaf','hairpin']))
assets.add(M['weapons']['dagger']['file'])
for file in sorted(assets):
    job=dict(op='analyze',file=file)
    for cfg in M['classes'].values():
        for f in cfg['frames'].values():
            if f['body']==file:
                job['points']=[[f[a]['point'][k]-f['bodyPosition'][k] for k in (0,1)] for a in ['hand','neck']]
    J.append(job)
raster(J,'verification/preview_jobs.json')
bounds={r['file']:r for r in json.loads((R/'verification/raster_report.json').read_text())}
(R/'verification/asset_bounds.json').write_text(json.dumps(bounds,indent=2)+'\n')
def pt(m,p):return [m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]]
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
assert [select_frame('attack',t) for t in [0,99,100,139,140,179,180,279,280,10000]]==['attack_0']*2+['attack_1']*4+['attack_2']*4
assert select_frame('walk',720)==select_frame('walk',0)
assert select_frame('idle',1600)==select_frame('idle',0)
assert select_frame('cast',720)==select_frame('cast',0)
assert select_frame('attack',-1)=='attack_0'
checks=0;fail=[];max_grip=0;max_neck=0;ground=[]
for cls,state in itertools.product(M['classes'],M['animations']):
    for t in times(state):
        f=M['classes'][cls]['frames'][select_frame(state,t)]
        neck=f['neck'];max_neck=max(max_neck,dist(pt(matrix(neck['point'],neck['angle'],M['head']['neck']),M['head']['neck']),neck['point']))
        if state not in ['dead']:
            ground.append(dict(cls=cls,frame=select_frame(state,t),bottom=f['bodyPosition'][1]+bounds[f['body']]['bounds'][3]))
        for hair,weapon,gear,facing in itertools.product(M['hairStyles'],[None,'dagger','sword'],[[],['leaf'],['hairpin'],['leaf','hairpin']],[1,-1]):
            checks+=1
            for n in assembly(cls,state,t,hair,None,weapon,gear,facing):
                b=bounds[n['file']]['bounds'];coords=[pt(n['matrix'],[x,y]) for x,y in itertools.product([b[0],b[2]],[b[1],b[3]])]
                if any(x<-1 or y<-1 or x>1025 or y>801 for x,y in coords):fail.append([cls,state,t,hair,weapon,gear,facing,n['file'],coords])
            if weapon:
                w=M['weapons'][weapon];max_grip=max(max_grip,dist(pt(matrix(f['hand']['point'],f['hand']['angle'],w['grip']),w['grip']),f['hand']['point']))
for cls,wid in itertools.product(M['classes'],M['weapons']):
    f=M['classes'][cls]['frames'][select_frame('attack',140)];w=M['weapons'][wid];a=matrix(f['hand']['point'],f['hand']['angle'],w['grip']);p,q=pt(a,w['grip']),pt(a,w['tip'])
    assert abs(p[1]-q[1])<1e-9 and q[0]>p[0]
assert max_grip<1e-9 and max_neck<1e-9
assert not fail,fail[:3]
grip_samples=[];neck_samples=[]
for cls,cfg in M['classes'].items():
    for name,f in cfg['frames'].items():
        samples=bounds[f['body']]['samples']
        if f['weaponVisible']:
            assert samples[0]['rgba'][3]>.8,(cls,name,'grip outside opaque fist',samples[0])
            grip_samples.append(dict(cls=cls,frame=name,rgba=samples[0]['rgba']))
        neck_samples.append(dict(cls=cls,frame=name,distance=samples[1]['nearestOpaqueDistance']))
assert max(x['distance'] for x in neck_samples)<=16,neck_samples
assert max(abs(x['bottom']-M['canvas']['origin'][1]) for x in ground)<=2,ground
continuity={}
for state in ['idle','walk','cast']:
    points=[M['classes']['novice']['frames'][id]['neck']['point'] for id in M['animations'][state]['frames']]
    continuity[state]=max(dist(a,b) for a,b in zip(points,points[1:]+points[:1]))
report=dict(schema=M['schema'],status='pass',assemblyCases=checks,bodyFrames=28,assetPNGs=len(assets),attack=dict(durationMs=280,hitMs=140,contactIntervalMs=[100,180],bladeForwardDegrees=0),gripTransformMaxErrorPx=max_grip,neckTransformMaxErrorPx=max_neck,loopNeckMaxStepMasterPx=continuity,loopNeckMaxStepAt80Px={k:v*80/620 for k,v in continuity.items()},canvasBoundsFailures=fail,groundMeasurements=ground,gripRasterSamples=grip_samples,neckRasterSamples=neck_samples,checks=['timeline boundaries and clamping','null equipment and both facings','all class/frame/hair/weapon/headgear combinations','nontransparent source bounds transformed into canvas','grip and skull anchor affine identity'],limitations=['Visual likeness is close, not a pixel-identical reconstruction of the full lineup: base skull is generated, face marks and hair silhouette come from approved art.','Idle body is original extraction; breathing is a baked 1.3% vertical expansion, not a second generated pose.','Walk and combat use painted bodies; cloth/armor details vary slightly across generated poses.','Source-approved idle keeps its original soft color variation; generated action frames use a fixed flat palette.','Verification uses alpha-bounding rectangles conservatively; it does not measure aesthetic quality or game-engine behavior.','The game itself is not modified or tested; integration comparison remains for the consuming game.'])
(R/'verification/report.json').write_text(json.dumps(report,indent=2)+'\n')
runpy.run_path(str(R/'verification/check_gif.py'))
print(json.dumps({k:report[k] for k in ['status','assemblyCases','bodyFrames','assetPNGs','attack','loopNeckMaxStepAt80Px']},indent=2))
