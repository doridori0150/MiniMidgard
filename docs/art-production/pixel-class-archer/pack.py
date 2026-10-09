"""Register and separate individually authored imagegen frames; no procedural poses.

Nearest-neighbour raster export follows the Knight r15 asset packing workflow.
Only this directory is written. The canonical idle head is preserved at integer
offsets on upright frames to lock identity and low-resolution pixel density.
"""
from pathlib import Path
import json, math
from raster import *
R=Path(__file__).resolve().parent
CID='archer_male_p2'; STYLE='swept_crop_p2'; SIZE=(128,120)
BG=(37,49,62,255)
HK=[tuple(bytes.fromhex(c))+(255,) for c in ['faf0d7','e1cdb8','b49b91','49342f']]
BP=[tuple(bytes.fromhex(c))+(255,) for c in ['30252b','493337','624638','86533a','a7744c','ca9360','efc18a','fff0d1','ffdeb0','f4bc91','d68b70','a55651','ddd9cc','fffdf8','a5ac83','7a8957','56633e','35452f','203529','f5d58e','d1a348','a67b36','735231']]
ANIMS={
 'idle':([280,280,280],True),
 'walk':([100]*6,True),
 'attack':([100,120,140,40,70,70,60],False),
 'hurt':([80,160],False),
 'dead':([100,160,1000],False),
 'sit':([1000],False),
}
def dump(path,data):
 p=R/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','weapon':f'weapons/bow/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 out=blank(*SIZE)
 for k in ('back','body','weapon','grip','front'):paste(out,ls[k])
 return out
def opaque(src):
 return [src[0],src[1],[p[:3]+(255,) if p[3]>=220 else T for p in src[2]]]
def sample(name,spec):
 src=opaque(read(R/f'sources/{name}.png'))
 box=spec.get('box') or bounds(src)
 x0,y0,x1,y1=box; height=spec.get('height',48)
 scale=height/(y1-y0);w=round((x1-x0)*scale)
 im=resize(crop(src,box),w,height)
 out=blank(*SIZE);px,py=spec.get('place',[48,112-height]);paste(out,im,px,py)
 # Coverage-sample only authored thin string pixels. A subpixel source line
 # must survive native export; no line geometry or animation is synthesized.
 for poly in spec.get('stringPolys',[]):
  for y in range(max(0,int(min(q[1] for q in poly))),min(120,math.ceil(max(q[1] for q in poly)))):
   for x in range(max(0,int(min(q[0] for q in poly))),min(128,math.ceil(max(q[0] for q in poly)))):
    if not inside(x+.5,y+.5,poly):continue
    sx0=x0+(x-px)*(x1-x0)/w;sy0=y0+(y-py)*(y1-y0)/height
    sx1=x0+(x+1-px)*(x1-x0)/w;sy1=y0+(y+1-py)*(y1-y0)/height
    candidates=[]
    for sy in range(math.ceil(sy0),math.ceil(sy1)):
     for sx in range(math.ceil(sx0),math.ceil(sx1)):
      p=get(src,sx,sy)
      if p[3] and p[0]<145 and p[1]<115 and p[0]>=p[1]:candidates.append(((sx-(sx0+sx1)/2)**2+(sy-(sy0+sy1)/2)**2,p))
    if len(candidates)>=max(2,(sx1-sx0)*(sy1-sy0)*.025):put(out,x,y,min(candidates,key=lambda q:q[0])[1])
 return out,{'sourceBounds':box,'sampleScale':scale,'normalizedWidth':w}
def split_hair(im,polys):
 front=blank(*SIZE);back=blank(*SIZE);body=blank(*SIZE)
 for y in range(120):
  for x in range(128):
   p=get(im,x,y)
   if not p[3]:continue
   if any(inside(x+.5,y+.5,poly) for poly in polys):
    put(front,x,y,nearest(p,HK))
   else:put(body,x,y,nearest(p,BP))
 return body,front,back
def frame(name,spec,base=None):
 raw,info=sample(name,spec)
 authored=[raw[0],raw[1],raw[2][:]]
 weapon=blank(*SIZE)
 for y in range(120):
  for x in range(128):
   p=get(raw,x,y)
   protected=any(inside(x+.5,y+.5,poly) for poly in spec.get('armPolys',[]))
   in_weapon=any(inside(x+.5,y+.5,poly) for poly in spec['weaponPolys'])
   in_string=any(inside(x+.5,y+.5,poly) for poly in spec.get('stringPolys',[])) and p[0]<145 and p[1]<115 and p[0]>=p[1]
   if p[3] and (in_weapon or in_string) and not protected:
    put(weapon,x,y,nearest(p,BP));put(raw,x,y,T)
 if base and spec.get('headLock',True):
  # Keep source weapon/arms above the neck; the generated head alone is masked.
  head=spec['sourceHead']
  for y in range(120):
   for x in range(128):
    if inside(x+.5,y+.5,head):put(raw,x,y,T)
  body,front,back=split_hair(raw,[])
  dx,dy=spec.get('headOffset',[0,0])
  for k,target in [('body',body),('front',front),('back',back)]:
   h=crop(base[k],(0,0,128,spec.get('headCropBottom',89)));paste(target,h,dx,dy)
 else:body,front,back=split_hair(raw,spec.get('hairPolys',[]))
 ls={'body':body,'front':front,'back':back,'weapon':weapon,'grip':blank(*SIZE)}
 # Green pixels at the arrow/string boundary belong to the tunic, not the bow.
 for y in range(120):
  for x in range(128):
   p=get(weapon,x,y)
   if p[3] and p[1]>p[0]:put(body,x,y,p);put(weapon,x,y,T)
 # Restore an authored drawing hand at cheek level above the canonical head.
 for y in range(120):
  for x in range(128):
   if any(inside(x+.5,y+.5,poly) for poly in spec.get('armPolys',[])):
    p=get(authored,x,y)
    if p[3]:put(body,x,y,nearest(p,BP))
 g=spec['grip']
 for y in range(g[1]-2,g[1]+2):
  for x in range(g[0]-1,g[0]+2):
   p=get(authored,x,y)
   if p[3]:
    p=nearest(p,BP);put(ls['grip'],x,y,p)
    # Underlying finger remains on body for unarmed display.
    put(body,x,y,p)
 info.update({'bounds':bounds(compose(ls)),'grip':g,'headOffset':spec.get('headOffset',[0,0])})
 return ls,info
def export():
 specs=json.loads((R/'spec.json').read_text());ls0=None;metrics={}
 anims={a:{'frames':[f'{a}_{i}' for i in range(len(ds))],'durations':ds,'duration':sum(ds),'loop':loop,**({'hitFrame':3} if a=='attack' else {}),**({'holdLast':True} if a in ('dead','sit') else {})} for a,(ds,loop) in ANIMS.items()}
 c={'class':'archer','gender':'male','bodyHeight':48,'headHeight':25,'proportion':2,'defaultWeapon':'bow','defaultHair':STYLE,'hairStyles':[STYLE],'animations':anims,'frames':{}}
 m={'schema':'minimidgard.pixel/1','canvas':{'size':list(SIZE),'origin':[64,112],'bodyHeight':48},'animations':anims,'hairKeys':['#faf0d7','#e1cdb8','#b49b91','#49342f'],'characters':{CID:c},'hair':{STYLE:{'gender':'male','style':'swept_crop','proportion':'p2','pivot':[0,0],'poses':{}}},'weapons':{'bow':{'frames':{CID:{}}}}}
 names=[]
 for a,anim in anims.items():
  frames=[]
  for n in anim['frames']:
   if n not in specs:continue
   ls,info=frame(n,specs[n],ls0)
   if n=='idle_0':ls0={k:[v[0],v[1],v[2][:]] for k,v in ls.items()}
   for k,p in paths(n).items():save(ls[k],R/p)
   final=compose(ls);save(final,R/f'composite/{n}.png');metrics[n]=info;names.append(n)
   g=specs[n]['grip'];t=specs[n]['tip']
   c['frames'][n]={'image':paths(n)['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if n=='dead_2' else 'up'},'weapon':{'z':'front','visible':True,'hand':'far','anatomicalHand':'left','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':paths(n)['grip']}
   m['hair'][STYLE]['poses'][n]={'front':paths(n)['front'],'back':paths(n)['back'],'pivot':[0,0]}
   m['weapons']['bow']['frames'][CID][n]=paths(n)['weapon']
   bg=blank(*SIZE,BG);paste(bg,final);frames.append(bg)
  if frames:
   ds=anim['durations'][:len(frames)]
   gif(frames,ds,R/f'{a}_1x.gif');gif([resize(f,512,480) for f in frames],ds,R/f'{a}_4x.gif')
   sheet=blank(384*min(4,len(frames)),360*math.ceil(len(frames)/4),BG)
   for i,f in enumerate(frames):
    x=i%4*384;y=i//4*360;paste(sheet,resize(crop(f,(16,32,112,120)),384,352),x,y+8);number(sheet,x+8,y+8,i,2)
   save(sheet,R/f'{a}_contact_sheet.png')
 dump('manifest.json',m);dump('verification/frame_metrics.json',metrics)
 sheet=blank(384*5,360*math.ceil(len(names)/5),BG)
 for i,n in enumerate(names):
  f=read(R/f'composite/{n}.png');x=i%5*384;y=i//5*360
  paste(sheet,resize(crop(f,(16,32,112,120)),384,352),x,y+8);number(sheet,x+8,y+8,i,2)
 save(sheet,R/'contact_sheet.png')
 # Three unchanged reference heroes at the same native scale and ground line.
 compare=blank(384,120,BG)
 for i,p in enumerate([R.parent/'pixel-hero-r12/composite/idle_0.png',R.parent/'pixel-knight-r15/composite/idle_0.png',R/'composite/idle_0.png']):paste(compare,read(p),i*128,0)
 save(compare,R/'comparison_1x.png');save(resize(compare,1536,480),R/'comparison_4x.png')
 print(json.dumps({'frames':len(names),'names':names}))
if __name__=='__main__':export()
