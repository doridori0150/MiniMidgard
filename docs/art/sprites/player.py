"""Canonical deterministic reference. Port select_frame / matrix / draw_list / tint.
Pillow is only used by raster(); the contract/math is standard-library Python.
"""
from pathlib import Path
import argparse, json, math
R=Path(__file__).resolve().parent
M=json.loads((R/'manifest.json').read_text())

def select_frame(state,time_ms):
 a=M['animations'][state];t=max(0,math.floor(time_ms))
 t=t%a['duration'] if a['loop'] else min(t,a['duration']-1)
 for name,d in zip(a['frames'],a['durations']):
  if t<d:return name
  t-=d
 raise AssertionError('invalid durations')

def matrix(point,angle=0,pivot=(0,0)):
 r=math.radians(angle);c=math.cos(r);s=math.sin(r);x,y=point;u,v=pivot
 return [c,s,-s,c,x-c*u+s*v,y-s*u-c*v]

def multiply(a,b):
 A,B,C,D,X,Y=a;e,f,g,h,u,v=b
 return [A*e+C*f,B*e+D*f,A*g+C*h,B*g+D*h,A*u+C*v+X,B*u+D*v+Y]

def point(m,p):return [m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]]

DEFAULT=object()
def draw_list(character='novice_female',state='idle',time_ms=0,weapon=DEFAULT,headgear=(),hair=DEFAULT,facing=1):
 c=M['characters'][character];f=c['frames'][select_frame(state,time_ms)]
 if weapon is DEFAULT:weapon=c['defaultWeapon']
 if hair is DEFAULT:hair=c['defaultHairTint']
 if weapon is not None and weapon not in M['weapons']:raise KeyError(weapon)
 if facing not in (-1,1):raise ValueError('facing must be -1 or 1')
 tint=M['hairTints'][hair] if isinstance(hair,str) else hair
 if tint is not None and (len(tint)!=3 or any(not 0<=v<=1 for v in tint)):raise ValueError('RGB multipliers must be in [0,1]')
 out=[]
 def equipped():
  w=M['weapons'][weapon];out.append({'image':w['image'],'matrix':matrix(f['hand']['point'],f['hand']['angle'],w['pivot']),'role':'weapon'})
 visible=weapon is not None and f['hand']['visible']
 if visible and f['hand']['z']=='behind':equipped()
 out.append({'image':f['image'],'matrix':matrix((0,0)),'hairMask':f['hairMask'],'tint':tint,'role':'figure'})
 if visible and f['hand']['z']=='front':
  equipped()
  if 'gripOverlay' in f:out.append({'image':f['gripOverlay'],'matrix':matrix((0,0)),'role':'grip'})
 for key in headgear:
  g=M['headgear'][key];a=f[g['anchor']]
  out.append({'image':g['image'],'matrix':matrix(a['point'],a['angle'],g['pivot']),'role':'headgear'})
 if facing==-1:
  mirror=[-1,0,0,1,2*M['canvas']['origin'][0],0]
  for d in out:d['matrix']=multiply(mirror,d['matrix'])
 return out

def tint(image,mask,rgb):
 from PIL import Image
 if rgb is None:return image.copy()
 channels=image.split();out=[]
 for ch,factor in zip(channels[:3],rgb):
  dark=ch.point([math.floor(v*factor+0.5) for v in range(256)])
  out.append(Image.composite(dark,ch,mask))
 return Image.merge('RGBA',(*out,channels[3]))

def raster(draws,size=None):
 from PIL import Image
 out=Image.new('RGBA',size or M['canvas']['size'])
 for d in draws:
  im=Image.open(R/d['image']).convert('RGBA')
  if d.get('tint') is not None:im=tint(im,Image.open(R/d['hairMask']).convert('L'),d['tint'])
  a,b,c,e,x,y=d['matrix'];det=a*e-b*c
  inverse=(e/det,-c/det,(c*y-e*x)/det,-b/det,a/det,(b*x-a*y)/det)
  layer=im.transform(out.size,Image.Transform.AFFINE,inverse,Image.Resampling.BICUBIC)
  out.alpha_composite(layer)
 return out

def render(**kwargs):return raster(draw_list(**kwargs))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--character',default='novice_female',choices=M['characters'])
 p.add_argument('--state',default='idle',choices=M['animations']);p.add_argument('--time',type=float,default=0)
 p.add_argument('--weapon',choices=['none',*M['weapons']]);p.add_argument('--gear',nargs='*',default=[],choices=M['headgear'])
 p.add_argument('--hair',choices=M['hairTints']);p.add_argument('--facing',type=int,default=1,choices=[-1,1])
 p.add_argument('--json',action='store_true');p.add_argument('--out',default='verification/player.png');a=p.parse_args()
 ds=draw_list(a.character,a.state,a.time,DEFAULT if a.weapon is None else None if a.weapon=='none' else a.weapon,a.gear,DEFAULT if a.hair is None else a.hair,a.facing)
 if a.json:print(json.dumps(ds,indent=2))
 else:
  output=(R/a.out).resolve()
  if not output.is_relative_to(R):raise ValueError('output must remain under docs/art/sprites')
  output.parent.mkdir(parents=True,exist_ok=True);raster(ds).save(output)
