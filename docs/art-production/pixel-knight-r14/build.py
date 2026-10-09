"""R14 packaging of individually generated frames; never writes outside R14.
No image generation here: registration, nearest-palette sampling, layer separation,
fixed R13 head registration and exports only. Python standard library.
"""
from pathlib import Path
import json, math, copy, zipfile
from raster import *
R=Path(__file__).resolve().parent
OLD=R.with_name('pixel-knight-r13')
CID='knight_female_p2'; STYLE='braided_bob_p2'; SIZE=(128,120)
BG=(37,49,62,255)
HK=[tuple(bytes.fromhex(c))+(255,) for c in ['faf0d7','e1cdb8','b49b91','49342f']]
BP=[tuple(bytes.fromhex(c))+(255,) for c in ['2e222b','49333b','65505a','fffdf8','fff0d1','ffe1ba','f4bc91','d68b70','a55651','583419','8c5529','e9e9ed','c4c3cf','9493a3','626274','3f4257','f5d58e','c69a58','916137','5e4140','467080','2d5365','193744','122935','dbf3ff','99cdef']]
# Source top / ground / neck-x / target height / neck-x / grip / blade tip.
SPECS=[
 [656,1133,640,47,64,[685,953],[953,916]],
 [693,1136,625,46,63,[661,981],[907,981]],
 [721,1138,692,44,67,[775,980],[1040,980]],
 [720,1141,736,44,69,[864,969],[1180,969]],
 [708,1140,677,45,68,[695,972],[948,972]],
 [706,1142,646,47,65,[715,1010],[882,1088]],
]
HEAD_X=[(495,796),(476,769),(535,837),(575,871),(517,814),(504,786)]
TIMES=[80,90,40,130,70,70,80]
def dump(path,value):
 (R/path).parent.mkdir(parents=True,exist_ok=True)
 (R/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','weapon':f'weapons/sword/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 out=blank(*SIZE)
 for k in ('back','body','weapon','grip','front'):paste(out,ls[k])
 return out
def normalize(i):
 src=read(R/f'generated/attack_{i}.png')
 top,ground,cx,height,tx,sg,st=SPECS[i];scale=height/(ground-top)
 def point(p):return [round((p[0]-cx)*scale+tx),round((p[1]-ground)*scale+112)]
 im=blank(*SIZE)
 for y in range(120):
  sy=round((y+.5-112)/scale+ground)
  for x in range(128):
   sx=round((x+.5-tx)/scale+cx);p=get(src,sx,sy)
   if p[3]>=200:put(im,x,y,nearest(p,BP))
 # Registration locks the exact approved R13 face and four-key hair palette.
 # Independently generated bodies retain their individually authored motion.
 dy=48-height;dx=tx-64
 hx0=math.floor((HEAD_X[i][0]-cx)*scale+tx)
 hx1=math.ceil((HEAD_X[i][1]-cx)*scale+tx)
 for y in range(90+dy):
  for x in range(hx0,hx1):
   # Preserve the rear shoulder where it passes below the lower-left hair edge.
   shoulder=y>=86+dy and x<tx-7 and get(im,x,y) in BP[:3]+BP[11:16]+BP[20:24]
   if not shoulder:put(im,x,y,T)
 ls={k:blank(*SIZE) for k in paths('')}
 ls['body']=im
 for k in ('body','back','front'):
  ref=read(OLD/paths('idle_0')[k]);head=blank(*SIZE)
  for y in range(64,90):
   for x in range(47,80):put(head,x,y,get(ref,x,y))
  paste(ls[k],head,dx,dy)
 g=point(sg);tip=point(st)
 ux=tip[0]-g[0];uy=tip[1]-g[1];length=math.hypot(ux,uy);ux/=length;uy/=length
 # Separate authored weapon beyond glove; retain metallic glove in body/grip.
 for y in range(120):
  for x in range(128):
   along=(x-g[0])*ux+(y-g[1])*uy;cross=abs(-(x-g[0])*uy+(y-g[1])*ux)
   if along>=2 and cross<=4:
    p=get(im,x,y)
    if p[3]:put(ls['weapon'],x,y,p);put(im,x,y,T)
   elif -2<=along<2 and cross<=2:
    p=get(im,x,y)
    if p[3]:put(ls['grip'],x,y,p)
 # Match R13 blade reach by resampling along its authored longitudinal axis.
 old=ls['weapon'];weapon=blank(*SIZE)
 for y in range(120):
  for x in range(128):
   ax=x-g[0];ay=y-g[1];along=ax*ux+ay*uy;cross=-ax*uy+ay*ux
   oldalong=along if along<=4 else 4+(along-4)*(length-4)/17
   if along<=22:
    put(weapon,x,y,get(old,round(g[0]+oldalong*ux-cross*uy),round(g[1]+oldalong*uy+cross*ux)))
 ls['weapon']=weapon
 # Equipped glove overlays the hilt, also allowing removal of the sword layer.
 paste(ls['weapon'],ls['grip'])
 return ls,g,[round(g[0]+21*ux),round(g[1]+21*uy)],{'headOffset':[dx,dy],'sourceScale':scale}
def export():
 m=json.loads((OLD/'manifest.json').read_text());c=m['characters'][CID]
 anim={'frames':[f'attack_{i}' for i in range(7)],'durations':TIMES,'duration':sum(TIMES),'loop':False,'hitFrame':3}
 m['animations']['attack']=copy.deepcopy(anim);c['animations']['attack']=copy.deepcopy(anim)
 stats={}
 for i in range(7):
  n=f'attack_{i}';p=paths(n)
  if i<6:ls,g,t,stat=normalize(i)
  else:
   ls={k:read(OLD/v) for k,v in paths('idle_0').items()}
   g=[72,100];t=[90,111];stat={'headOffset':[0,0],'exactIdleReturn':True}
  for k,v in p.items():save(ls[k],R/v)
  c['frames'][n]={'image':p['body'],'head':{'point':[0,0],'pose':n,'basePose':'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':p['grip']}
  m['hair'][STYLE]['poses'][n]={'front':p['front'],'back':p['back'],'pivot':[0,0]}
  m['weapons']['sword']['frames'][CID][n]=p['weapon']
  final=compose(ls);save(final,R/f'composite/{n}.png');save(final,R/f'normalized/{n}.png')
  stats[n]={**stat,'bounds':bounds(final),'grip':g,'tip':t,'layers':{k:sum(p[3]>0 for p in im[2]) for k,im in ls.items()}}
 dump('manifest.json',m);dump('verification/attack_metrics.json',stats)
 frames=[]
 for n in anim['frames']:
  bg=blank(*SIZE,BG);paste(bg,read(R/f'composite/{n}.png'));frames.append(bg)
 gif(frames,TIMES,R/'attack_1x.gif');gif([resize(f,512,480) for f in frames],TIMES,R/'attack_4x.gif')
 sheet=blank(1536,672,BG)
 for i,f in enumerate(frames):
  x=i%4*384;y=i//4*336
  paste(sheet,resize(crop(f,(20,32,116,116)),384,336),x,y);number(sheet,x+10,y+10,i,3);number(sheet,x+62,y+10,TIMES[i],3)
 save(sheet,R/'attack_contact_sheet.png');save(sheet,R/'attack_review.png')
 sheet=blank(1920,6*336,BG)
 for i,n in enumerate(c['frames']):
  im=blank(*SIZE,BG);paste(im,read(R/f'composite/{n}.png'))
  paste(sheet,resize(crop(im,(20,32,116,116)),384,336),i%5*384,i//5*336);number(sheet,i%5*384+10,i//5*336+10,i,3)
 save(sheet,R/'contact_sheet.png')
 # Comparison starts both attacks together. R13 holds idle for the remaining
 # 130ms instead of slowing its original 430ms attack to match R14's 560ms.
 oldm=json.loads((OLD/'manifest.json').read_text());oldanim=oldm['animations']['attack']
 def ends(ds):
  n=0;out=[0]
  for d in ds:n+=d;out.append(n)
  return out
 oe=ends(oldanim['durations']);ne=ends(TIMES);events=sorted(set(oe+ne));comparison=[];ds=[]
 for a,b in zip(events,events[1:]):
  oi=next((j for j in range(6) if a<oe[j+1]),None);ni=next(j for j in range(7) if a<ne[j+1])
  left=read(OLD/f"composite/{'idle_0' if oi is None else 'attack_'+str(oi)}.png")
  pair=blank(768,360,BG)
  paste(pair,resize(crop(left,(20,32,116,116)),384,336),0,24)
  paste(pair,resize(crop(frames[ni],(20,32,116,116)),384,336),384,24)
  number(pair,12,5,13,3);number(pair,396,5,14,3)
  comparison.append(pair);ds.append(b-a)
 gif(comparison,ds,R/'attack_r13_vs_r14.gif')
 with zipfile.ZipFile(R/f'{CID}_runtime.zip','w',zipfile.ZIP_DEFLATED) as z:
  z.write(R/'manifest.json','manifest.json')
  for d in ('body','hair','weapons','grips','composite'):
   for f in sorted((R/d).rglob('*.png')):z.write(f,f.relative_to(R))
 print(json.dumps(stats,ensure_ascii=False,indent=2))
if __name__=='__main__':export()
