"""Deterministic reference player: stdlib only; radians only inside matrix().
Port select_frame(), matrix(), multiply(), assembly() directly to the game.
Render PNGs on macOS with the supplied raster.swift helper; --json works anywhere.
"""
from pathlib import Path
import argparse, json, math, subprocess
R=Path(__file__).resolve().parent
M=json.loads((R/'manifest.json').read_text())
def multiply(a,b):
    A,B,C,D,X,Y=a; e,f,g,h,u,v=b
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
_DEFAULT=object()
def assembly(cls='novice',state='idle',time_ms=0,hair='01',color=None,weapon=_DEFAULT,gear=(),facing=1,expression=None):
    cfg=M['classes'][cls];f=cfg['frames'][select_frame(state,time_ms)]
    if weapon is _DEFAULT:weapon=cfg['defaultWeapon']
    if weapon is not None and weapon not in M['weapons']:raise KeyError(weapon)
    if color is None:color=cfg['defaultHairColor']
    tint=M['hairColors'][color];h=M['head'];style=M['hairStyles'][hair]
    if facing not in (-1,1):raise ValueError('facing must be -1 or 1')
    result=[]
    def add(file,mat,tint=None):
        node=dict(file=file,matrix=mat)
        if tint is not None:node['tint']=tint
        result.append(node)
    def weapon_draw():
        if weapon is not None and f['weaponVisible']:
            w=M['weapons'][weapon];add(w['file'],matrix(f['hand']['point'],f['hand']['angle'],w['grip']))
    if f['weaponZ']=='behind':weapon_draw()
    add(f['body'],matrix(f['bodyPosition']))
    headmat=matrix(f['neck']['point'],f['neck']['angle'],h['neck'])
    def head(file,position=(0,0),tint=None):add(file,multiply(headmat,matrix(position)),tint)
    head(style['back'],style['position'],tint)
    head(h['base'])
    face=h['faces'][expression or f['expression']];head(face['file'],face['position'])
    head(style['front'],style['position'],tint)
    for id in gear:
        item=M['headgear'][id];a=h['skullAnchors'][item['anchor']]
        p=[a[k]+item['offset'][k]-item['pivot'][k] for k in (0,1)]
        head(item['file'],p)
    if f['weaponZ']=='front':
        weapon_draw()
        if weapon is not None and f['weaponVisible'] and 'gripOverlay' in f:
            g=f['gripOverlay'];add(g['file'],matrix(g['position']))
    if facing==-1:
        reflection=[-1,0,0,1,2*M['canvas']['origin'][0],0]
        for item in result:item['matrix']=multiply(reflection,item['matrix'])
    return result

def raster(jobs,name='verification/render_jobs.json'):
    (R/name).parent.mkdir(parents=True,exist_ok=True)
    (R/name).write_text(json.dumps(jobs,indent=2)+'\n')
    subprocess.run([str(R/'.raster'),str(R),name],check=True)

def main():
    p=argparse.ArgumentParser();p.add_argument('--class',dest='cls',default='novice',choices=list(M['classes']))
    p.add_argument('--state',default='idle',choices=list(M['animations']));p.add_argument('--time',type=int,default=0)
    p.add_argument('--hair',default='01',choices=list(M['hairStyles']));p.add_argument('--color',choices=list(M['hairColors']))
    p.add_argument('--weapon',choices=['none',*M['weapons']]);p.add_argument('--gear',nargs='*',default=[],choices=list(M['headgear']))
    p.add_argument('--facing',type=int,default=1,choices=[-1,1]);p.add_argument('--expression',choices=list(M['head']['faces']))
    p.add_argument('--out',default='verification/player.png');p.add_argument('--json',action='store_true');args=p.parse_args()
    weapon=_DEFAULT if args.weapon is None else None if args.weapon=='none' else args.weapon
    draws=assembly(args.cls,args.state,args.time,args.hair,args.color,weapon,args.gear,args.facing,args.expression)
    if args.json:print(json.dumps(draws,indent=2))
    else:raster([dict(op='render',file=args.out,size=M['canvas']['size'],draws=draws)])
if __name__=='__main__':main()
