"""R13: sequentially generated original knight, deterministic native-pixel cleanup.
Only outputs under this directory; Python standard library, no packages needed.
"""
from pathlib import Path
import json,math,struct,hashlib,zlib
from raster import *
R=Path(__file__).resolve().parent
SIZE=(128,120); CID='knight_female_p2';STYLE='braided_bob_p2'
SPEC=json.loads((R/'spec.json').read_text());SIZES=json.loads((R/'source/sizes.json').read_text())
def rgba(h):return tuple(bytes.fromhex(h))+ (255,)
HK=list(map(rgba,['faf0d7','e1cdb8','b49b91','49342f']))
BP=list(map(rgba,['2e222b','49333b','65505a','fffdf8','fff0d1','ffe1ba','f4bc91','d68b70','a55651','583419','8c5529','e9e9ed','c4c3cf','9493a3','626274','3f4257','f5d58e','c69a58','916137','5e4140','467080','2d5365','193744','122935','dbf3ff','99cdef']))
P=HK+BP
BG=(37,49,62,255)
def dump(p,v):(R/p).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
def source(name):
 w,h=SIZES[name]
 packed=R/f'source/{name}.rgba.zlib'
 raw=zlib.decompress(packed.read_bytes()) if packed.exists() else (R/f'source/{name}.rgba').read_bytes()
 return w,h,raw

def transform(name,x,y):
 top,ground,hip,height,*_=SPEC[name];s=height/(ground-top)
 return ((x-hip)*s+64,(y-ground)*s+112)

def native(name):
 w,h,raw=source(name);top,ground,hip,height,*_=SPEC[name];s=height/(ground-top)
 out=blank(*SIZE)
 for y in range(120):
  sy=int(ground+(y+.5-112)/s)
  if not 0<=sy<h:continue
  for x in range(128):
   sx=int(hip+(x+.5-64)/s)
   if not 0<=sx<w:continue
   i=(sy*w+sx)*4;p=tuple(raw[i:i+4])
   if p[3]<160:continue
   put(out,x,y,nearest(p,P))
 return out

def preview():
 images={name:native(name) for name in SPEC}
 for name,im in images.items():save(im,R/f'normalized/{name}.png')
 sheet=blank(5*256,5*256,BG)
 for i,(name,im) in enumerate(images.items()):
  x=(i%5)*256;y=(i//5)*256
  paste(sheet,resize(im,256,240),x,y+16);number(sheet,x+10,y+6,i,2)
 save(sheet,R/'normalization_review.png')
 if __name__=='__main__':print('native frames',len(images))
 return images
if __name__=='__main__':preview()

# Face polygon and head limits are on the sampled native canvas.
# Body shades never retain the four recolour keys.
def head_region(name,x,y):
 s=SPEC[name];a=transform(name,s[4],s[0]);b=transform(name,s[5],s[6])
 return a[0]-1<=x<=b[0]+1 and a[1]-1<=y<=b[1]
def hair_pixel(name,x,y,p):
 if not head_region(name,x,y):return False
 s=SPEC[name];a=transform(name,s[4],s[0]);b=transform(name,s[5],s[6])
 u=(x-a[0])/(b[0]-a[0]);v=(y-a[1])/(b[1]-a[1])
 face=inside(u,v,[(.62,.30),(.82,.32),(.89,.63),(.83,.91),(.52,.91),(.43,.74),(.51,.58)])
 if name=='hurt_0':face=inside(u,v,[(.57,.29),(.79,.37),(.91,.68),(.65,.85),(.47,.88),(.42,.65)])
 if name in ('dead_2','dead_3'):face=inside(u,v,[(.54,.3),(.73,.42),(.83,.65),(.60,.85),(.45,.87),(.40,.69)])
 # Hair lighter ramp and neutral inner shadows, but not eyes or gold hair clasp.
 if p in HK[:3]:return True
 if not face and p in HK[3:]+[BP[i] for i in (0,1,2,3,8,11,12,13,14,15)]:return True
 return False

def stable_head(images):
 # Keep each individually generated body. Lock the neutral head in idle/walk
 # to the accepted first drawing, preserving bob through integer translation.
 base=images['idle_0'];head=blank(*SIZE)
 for y in range(64,89):
  for x in range(47,80):put(head,x,y,get(base,x,y))
 for name,im in images.items():
  if not name.startswith(('idle_','walk_')):continue
  dy=48-SPEC[name][3]
  s=SPEC[name];a=transform(name,s[4],s[0]);b=transform(name,s[5],s[6])
  for y in range(max(0,int(a[1])-1),89+dy):
   for x in range(max(0,int(a[0])-1),min(128,math.ceil(b[0])+1)):put(im,x,y,T)
  paste(im,head,0,dy)
 return images

def split(name,im):
 layers={k:blank(*SIZE) for k in ('body','front','back','weapon','grip')}
 spec=SPEC[name];g=transform(name,*spec[-4:-2]);tip=transform(name,*spec[-2:]);dx=tip[0]-g[0];dy=tip[1]-g[1];length=math.hypot(dx,dy);ux,uy=dx/length,dy/length
 # Native sword masks follow the authored blade, and isolate generated effects.
 for y in range(120):
  for x in range(128):
   p=get(im,x,y)
   if not p[3]:continue
   along=(x+.5-g[0])*ux+(y+.5-g[1])*uy;cross=abs((x+.5-g[0])*uy-(y+.5-g[1])*ux)
   weapon=(-1.8<=along<=length+1.8 and cross<=2.5) or (-1.8<=along<=3.0 and cross<=3.6)
   fx=name in ('attack_1','attack_2','attack_3') and p in (BP[3],BP[24],BP[25]) and (y<transform(name,spec[4],spec[0])[1]-1 or x>transform(name,spec[5],spec[6])[0]+2)
   if name=='attack_4' and x>tip[0] and y>tip[1]-4:fx=True
   if weapon or fx:put(layers['weapon'],x,y,nearest(p,BP))
   elif hair_pixel('idle_0' if name.startswith(('idle_','walk_')) else name,x,y-(48-spec[3]) if name.startswith(('idle_','walk_')) else y,p):
    q=nearest(p,HK)
    s=SPEC['idle_0'] if name.startswith(('idle_','walk_')) else spec
    mid=transform('idle_0' if name.startswith(('idle_','walk_')) else name,(s[4]+s[5])/2,s[0])[0]
    put(layers['back' if x<mid-3 else 'front'],x,y,q)
   else:put(layers['body'],x,y,nearest(p,BP))
 # Glove pixels remain on body and overlay hilt to keep attachment when equipping.
 gx,gy=map(round,g)
 for y in range(gy-2,gy+2):
  for x in range(gx-2,gx+2):
   p=get(im,x,y)
   if p in [BP[i] for i in (0,1,2,3,11,12,13,14,15)]:
    put(layers['body'],x,y,p);put(layers['grip'],x,y,p)
 # Longitudinal normalization only: grip, crossguard and blade width stay fixed.
 original=layers['weapon'];new=blank(*SIZE);target=21.0;factor=(target-3)/(length-3)
 for y in range(120):
  for x in range(128):
   ax=x-g[0];ay=y-g[1];along=ax*ux+ay*uy;cross=-ax*uy+ay*ux
   oldalong=along if along<=3 else 3+(along-3)/factor
   sx=round(g[0]+oldalong*ux-cross*uy);sy=round(g[1]+oldalong*uy+cross*ux)
   put(new,x,y,get(original,sx,sy))
 layers['weapon']=new
 # Guarantee authored visible knuckles draw over the equipped hilt.
 paste(layers['weapon'],layers['grip'])
 return layers,[gx,gy],[round(g[0]+ux*target),round(g[1]+uy*target)]

def compose(layers):
 out=blank(*SIZE)
 for k in ('back','body','weapon','grip','front'):paste(out,layers[k])
 return out

def package():
 images=stable_head({n:native(n) for n in SPEC})
 times={'idle':[220]*4,'walk':[90]*8,'attack':[110,40,40,40,130,70],'hurt':[80,160],'dead':[80,100,140,1000],'sit':[1000]}
 anim={a:{'frames':[f'{a}_{i}' for i in range(len(ds))],'durations':ds,'duration':sum(ds),'loop':a in ('idle','walk')} for a,ds in times.items()}
 anim['attack']['hitFrame']=4
 for a in ('dead','sit'):anim[a]['holdLast']=True
 c={'class':'knight','gender':'female','bodyHeight':48,'headHeight':25,'proportion':2,'defaultWeapon':'sword','defaultHair':STYLE,'hairStyles':[STYLE],'animations':anim,'frames':{}}
 m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':anim,'hairKeys':['#'+bytes(h[:3]).hex() for h in HK],'characters':{CID:c},'hair':{STYLE:{'gender':'female','style':'braided_bob','proportion':'p2','pivot':[0,0],'poses':{}}},'weapons':{'sword':{'frames':{CID:{}}}}}
 composites={};stats={}
 for n,im in images.items():
  ls,g,t=split(n,im)
  paths={'body':f'body/{CID}/{n}.png','front':f'hair/{STYLE}/{n}_front.png','back':f'hair/{STYLE}/{n}_back.png','weapon':f'weapons/sword/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
  for k,p in paths.items():save(ls[k],R/p)
  c['frames'][n]={'image':paths['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if n.startswith('dead') else 'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':paths['grip']}
  m['hair'][STYLE]['poses'][n]={'front':paths['front'],'back':paths['back'],'pivot':[0,0]}
  m['weapons']['sword']['frames'][CID][n]=paths['weapon']
  final=compose(ls);composites[n]=final;save(final,R/f'composite/{n}.png')
  stats[n]={'bounds':bounds(final),'grip':g,'tip':t,'angle':c['frames'][n]['weapon']['angleDegrees'],'layers':{k:sum(p[3]>0 for p in v[2]) for k,v in ls.items()}}
 dump('manifest.json',m);dump('verification/frame_metrics.json',stats)
 for a,ds in times.items():
  frames=[]
  for n in anim[a]['frames']:
   bg=blank(*SIZE,BG);paste(bg,composites[n]);frames.append(bg)
  gif(frames,ds,R/f'{a}_1x.gif');gif([resize(f,512,480) for f in frames],ds,R/f'{a}_4x.gif')
  cols=min(4,len(frames));sheet=blank(cols*384,math.ceil(len(frames)/cols)*336,BG)
  for i,f in enumerate(frames):
   cell=resize(crop(f,(20,32,116,116)),384,336);paste(sheet,cell,(i%cols)*384,(i//cols)*336);number(sheet,(i%cols)*384+10,(i//cols)*336+10,i,3);number(sheet,(i%cols)*384+62,(i//cols)*336+10,ds[i],3)
  save(sheet,R/f'{a}_contact_sheet.png')
 # All-frame contact sheet with ample overhead/right space and exact pixels.
 sheet=blank(5*384,5*336,BG)
 for i,(n,f) in enumerate(composites.items()):
  bg=blank(*SIZE,BG);paste(bg,f);cell=resize(crop(bg,(20,32,116,116)),384,336);paste(sheet,cell,(i%5)*384,(i//5)*336);number(sheet,(i%5)*384+10,(i//5)*336+10,i,3)
 save(sheet,R/'contact_sheet.png')
 save(resize(composites['idle_0'],512,480),R/'knight_idle_4x.png')
 # Colour-swap and removable-equipment review.
 recolor=blank(4*256,240,BG);frame=c['frames']['idle_0'];hp=m['hair'][STYLE]['poses']['idle_0']
 for i,tint in enumerate([HK,list(map(rgba,['efd3b1','b98559','745042','33232e'])),list(map(rgba,['cedbe8','91a3c0','606b8a','2d3049'])),HK]):
  out=blank(*SIZE)
  for path in [hp['back'],frame['image']]+([] if i==3 else [m['weapons']['sword']['frames'][CID]['idle_0'],frame['grip']])+[hp['front']]:
   layer=read(R/path)
   if path.startswith('hair/'):layer[2]=[tint[HK.index(p)] if p in HK else p for p in layer[2]]
   paste(out,layer)
  paste(recolor,resize(out,256,240),i*256,0)
 save(recolor,R/'verification/recolor_and_unarmed.png')
 print('packaged',len(composites),'frames /',len(times)*2,'GIFs')
if __name__=='__main__':package()
