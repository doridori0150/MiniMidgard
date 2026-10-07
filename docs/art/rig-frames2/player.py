"""minimidgard.frames/2 reference player. Assembly is Python stdlib only.
Port select_frame(), matrix(), multiply(), assembly() literally. PNG rendering
uses the included macOS Swift helper; --json is platform independent.
"""
from pathlib import Path
import argparse,json,math,subprocess
R=Path(__file__).resolve().parent
M=json.loads((R/'manifest.json').read_text())
_DEFAULT=object()

def multiply(a,b):
    A,B,C,D,X,Y=a;e,f,g,h,u,v=b
    return [A*e+C*f,B*e+D*f,A*g+C*h,B*g+D*h,A*u+C*v+X,B*u+D*v+Y]

def matrix(point,angle=0,pivot=(0,0)):
    r=math.radians(angle);c=math.cos(r);s=math.sin(r);x,y=point;u,v=pivot
    return [c,s,-s,c,x-c*u+s*v,y-s*u-c*v]

def select_frame(state,time_ms):
    a=M['animations'][state];t=max(0,int(time_ms))
    t=t%a['duration'] if a['loop'] else min(t,a['duration']-1)
    for name,d in zip(a['frames'],a['durations']):
        if t<d:return name
        t-=d
    raise AssertionError('invalid animation duration')

def assembly(cls='novice',state='idle',time_ms=0,gender='female',hair=None,
             eyes=None,brows=None,nose=None,mouth=None,color=None,weapon=_DEFAULT,
             gear=(),facing=1,expression=None):
    cfg=M['classes'][cls];f=cfg['frames'][select_frame(state,time_ms)];h=M['head']
    base=h['bases'][gender] # validate even when a custom hair is supplied
    if hair is None:hair=cfg['defaultHair'][gender]
    style=M['hairStyles'][gender][hair]
    selected=dict(zip(('eyes','brows','nose','mouth'),(eyes,brows,nose,mouth)))
    variants=h['expressionMap'][expression or f['expression']]
    if facing not in (-1,1):raise ValueError('facing must be -1 or 1')
    if weapon is _DEFAULT:weapon=cfg['defaultWeapon']
    if weapon is not None:M['weapons'][weapon]
    tint=M['hairColors'][color if color is not None else cfg['defaultHairColor']]
    result=[]
    def add(file,mat,role,tint=None):
        node=dict(file=file,matrix=mat,role=role)
        if tint is not None:node['tint']=tint
        result.append(node)
    def weapon_draw():
        if weapon is not None and f['weaponVisible']:
            w=M['weapons'][weapon]
            add(w['file'],matrix(f['hand']['point'],f['hand']['angle'],w['grip']),'weapon')
    headmat=matrix(f['neck']['point'],f['neck']['angle'],h['neck'])
    def head(file,role,position=(0,0),tint=None):add(file,multiply(headmat,matrix(position)),role,tint)
    if f['weaponZ']=='behind':weapon_draw()
    head(h['neckLayer'],'neck')
    head(style['back'],'hairBack',tint=tint)
    add(f['body'],matrix(f['bodyPosition']),'body')
    head(base,'headBase')
    for kind in ('eyes','brows','nose','mouth'):
        typ=selected[kind] if selected[kind] is not None else M['defaultFeatures'][gender][kind]
        feature=M['features'][gender][kind][typ]
        pos=[h['featureAnchors'][kind][i]-feature['pivot'][i] for i in (0,1)]
        head(feature['variants'][variants[kind]],kind,pos)
    head(style['front'],'hair',tint=tint)
    for id in gear:
        item=M['headgear'][id];a=h['skullAnchors'][item['anchor']]
        pos=[a[i]+item['offset'][i]-item['pivot'][i] for i in (0,1)]
        head(item['file'],'headgear',pos)
    if f['weaponZ']=='front':
        weapon_draw()
        if weapon is not None and f['weaponVisible'] and 'gripOverlay' in f:
            g=f['gripOverlay'];add(g['file'],matrix(g['position']),'gripOverlay')
    if facing==-1:
        reflection=[-1,0,0,1,2*M['canvas']['origin'][0],0]
        for node in result:node['matrix']=multiply(reflection,node['matrix'])
    return result

def raster(jobs,name='verification/render_jobs.json'):
    (R/name).parent.mkdir(parents=True,exist_ok=True)
    (R/name).write_text(json.dumps(jobs)+'\n')
    if not (R/'.raster').exists():
        subprocess.run(['swiftc','-O','-module-cache-path',str(R/'.swift-cache'),str(R/'raster.swift'),'-o',str(R/'.raster')],check=True)
    subprocess.run([str(R/'.raster'),str(R),name],check=True)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--class',dest='cls',default='novice',choices=M['classes'])
    p.add_argument('--state',default='idle',choices=M['animations']);p.add_argument('--time',type=int,default=0)
    p.add_argument('--gender',default='female',choices=M['head']['bases']);p.add_argument('--hair')
    for kind in ('eyes','brows','nose','mouth'):p.add_argument('--'+kind,choices=['01','02'] if kind=='nose' else ['01','02','03'])
    p.add_argument('--color',choices=M['hairColors']);p.add_argument('--weapon',choices=['none',*M['weapons']])
    p.add_argument('--gear',nargs='*',default=[],choices=M['headgear']);p.add_argument('--facing',type=int,default=1,choices=[-1,1])
    p.add_argument('--expression',choices=M['head']['expressionMap']);p.add_argument('--json',action='store_true')
    p.add_argument('--out',default='verification/player.png');args=vars(p.parse_args())
    out=args.pop('out');as_json=args.pop('json');args['time_ms']=args.pop('time')
    args['weapon']=_DEFAULT if args['weapon'] is None else None if args['weapon']=='none' else args['weapon']
    draws=assembly(**args)
    if as_json:print(json.dumps(draws,indent=2))
    else:
        path=(R/out).resolve()
        if not path.is_relative_to(R):p.error('--out must stay inside rig-frames2')
        raster([dict(op='render',file=out,size=M['canvas']['size'],draws=draws)])
if __name__=='__main__':main()
