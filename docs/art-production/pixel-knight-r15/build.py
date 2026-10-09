"""R15: pack individually imagegen-authored frames into the existing pixel schema.
Only writes beside this script. Source artwork is never procedurally redrawn.
Registration, nearest palette sampling, approved head reuse and layer exports.
"""
from pathlib import Path
import json, math, copy
from raster import *
R=Path(__file__).resolve().parent
OLD=R.with_name('pixel-knight-r14')
CID='knight_female_p2'; STYLE='braided_bob_p2'; SIZE=(128,120)
BG=(37,49,62,255)
HK=[tuple(bytes.fromhex(c))+(255,) for c in ['faf0d7','e1cdb8','b49b91','49342f']]
BP=[tuple(bytes.fromhex(c))+(255,) for c in ['2e222b','49333b','65505a','fffdf8','fff0d1','ffe1ba','f4bc91','d68b70','a55651','583419','8c5529','e9e9ed','c4c3cf','9493a3','626274','3f4257','f5d58e','c69a58','916137','5e4140','467080','2d5365','193744','122935','dbf3ff','99cdef']]
FX=[tuple(bytes.fromhex(c))+(255,) for c in ['666079','8c86a6','aaa4c0','c5c1d8','e6e3f0','fffdf8']]
TIMES=[90,120,60,40,60,160,70,60]
# source neck center x/y, sole y, target neck x, head offset y, grip, blade tip.
SPECS=[
 [670,900,1140,64,0,[562,920],[315,744]],
 [692,907,1133,63,2,[566,889],[293,832]],
 [736,867,1111,67,5,[724,900],[1020,1060]],
 [665,891,1123,70,7,[644,934],[1017,1172]],
 [699,943,1148,70,8,[741,1025],[891,1105]],
 [700,951,1148,70,9,[734,1024],[885,1106]],
 [680,902,1145,67,4,[706,992],[819,1094]],
]
# Generated head silhouettes to replace with the exact existing design.
HEADS=[
 [(504,636),(790,636),(817,888),(769,907),(667,893),(639,898),(602,898),(602,910),(564,892),(506,884)],
 [(522,674),(804,674),(828,902),(765,923),(672,910),(630,893),(567,883),(519,886)],
 [(575,613),(846,613),(880,846),(825,875),(710,850),(672,835),(602,849),(548,816),(548,787)],
 [(493,645),(756,645),(795,865),(738,890),(636,870),(592,856),(539,869),(475,835),(465,803)],
 [(539,709),(796,709),(831,914),(795,947),(682,925),(646,912),(590,928),(520,897),(512,861)],
 [(538,722),(795,722),(830,928),(794,951),(680,937),(638,924),(590,939),(519,905),(514,873)],
 [(538,675),(794,675),(828,879),(790,901),(681,886),(634,874),(586,894),(517,863),(515,824)],
]
def dump(path,value):
 (R/path).parent.mkdir(parents=True,exist_ok=True)
 (R/path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','weapon':f'weapons/sword/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 out=blank(*SIZE)
 for k in ('back','body','weapon','grip','front'):paste(out,ls[k])
 return out

def normalize(i):
 src=read(R/f'sources/attack_{i}.png')
 cx,neck,ground,tx,dy,sg,st=SPECS[i]
 scale=(112-(89+dy))/(ground-neck)
 def point(p):return [round((p[0]-cx)*scale+tx),round((p[1]-ground)*scale+112)]
 ls={k:blank(*SIZE) for k in paths('')}; im=ls['body']; weapon=ls['weapon']
 g=point(sg);rawtip=point(st)
 vx=st[0]-sg[0];vy=st[1]-sg[1];length=math.hypot(vx,vy);ux=vx/length;uy=vy/length
 # Sampling and separation: only the imagegen-authored pixels are sampled.
 for y in range(120):
  sy=round((y+.5-112)/scale+ground)
  for x in range(128):
   sx=round((x+.5-tx)/scale+cx);p=get(src,sx,sy)
   if p[3]<220 or inside(sx,sy,HEADS[i]):continue
   along=(sx-sg[0])*ux+(sy-sg[1])*uy;cross=abs(-(sx-sg[0])*uy+(sy-sg[1])*ux)
   blade=along>=12 and cross<=45
   # Distinguish broad lavender smear from armor/cloth by authored location.
   effect=False
   if i==2:
    effect=(sx<580 and sy<921) or (sy>880 and sy<1082 and sx>840) or (inside(sx,sy,[(356,741),(520,801),(1158,1001),(1089,1090),(640,956),(417,842)]))
   if i==3:
    effect=(sx<515 and sy<941) or (sx>716 and sy>941) or (sx>915 and sy>808)
   if effect:put(weapon,x,y,nearest(p,FX))
   elif blade:put(weapon,x,y,nearest(p,BP))
   else:put(im,x,y,nearest(p,BP))
 # Reuse the original face and hair layers at integer offsets, never resize them.
 dx=tx-64
 for k in ('body','back','front'):
  ref=read(OLD/paths('idle_0')[k]);head=blank(*SIZE)
  for y in range(64,90):
   for x in range(47,80):put(head,x,y,get(ref,x,y))
  paste(ls[k],head,dx,dy)
 # Resample actual blade to original 21px reach; preserve broad smear in sweep.
 if i not in (2,3):
  old=weapon;weapon=blank(*SIZE);normlen=math.dist(g,rawtip)
  for y in range(120):
   for x in range(128):
    ax=x-g[0];ay=y-g[1];along=ax*ux+ay*uy;cross=-ax*uy+ay*ux
    oa=along if along<=2 else 2+(along-2)*(normlen-2)/19
    if -3<=along<=22 and abs(cross)<=5:
     put(weapon,x,y,get(old,round(g[0]+oa*ux-cross*uy),round(g[1]+oa*uy+cross*ux)))
  ls['weapon']=weapon
 # The glove is duplicated across hilt and grip to make the connection explicit.
 if i in (2,3):
  for y in range(g[1]-1,g[1]+2):
   for x in range(g[0]-1,g[0]+2):
    sx=round((x+.5-tx)/scale+cx);sy=round((y+.5-112)/scale+ground)
    p=get(src,sx,sy)
    if p[3]>=220:put(im,x,y,nearest(p,BP))
 for y in range(g[1]-2,g[1]+3):
  for x in range(g[0]-2,g[0]+3):
   p=get(im,x,y)
   if p[3]:put(ls['grip'],x,y,p);put(ls['weapon'],x,y,p)
 tip=[round(g[0]+21*ux),round(g[1]+21*uy)]
 return ls,g,tip,{'headOffset':[dx,dy],'sourceScale':scale,'sourceGrip':sg,'sourceTip':st}

def export():
 m=json.loads((OLD/'manifest.json').read_text());c=m['characters'][CID]
 anim={'frames':[f'attack_{i}' for i in range(8)],'durations':TIMES,'duration':sum(TIMES),'loop':False,'hitFrame':3}
 m['animations']['attack']=copy.deepcopy(anim);c['animations']['attack']=copy.deepcopy(anim)
 stats={}
 for i in range(8):
  n=f'attack_{i}';p=paths(n)
  if i<7:ls,g,t,stat=normalize(i)
  else:
   ls={k:read(OLD/v) for k,v in paths('idle_0').items()};g=[72,100];t=[90,111];stat={'headOffset':[0,0],'exactIdleReturn':True}
  for k,v in p.items():save(ls[k],R/v)
  c['frames'][n]={'image':p['body'],'head':{'point':[0,0],'pose':n,'basePose':'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':p['grip']}
  m['hair'][STYLE]['poses'][n]={'front':p['front'],'back':p['back'],'pivot':[0,0]}
  m['weapons']['sword']['frames'][CID][n]=p['weapon']
  final=compose(ls);save(final,R/f'composite/{n}.png')
  stats[n]={**stat,'bounds':bounds(final),'grip':g,'tip':t,'layers':{k:sum(p[3]>0 for p in im[2]) for k,im in ls.items()}}
 dump('manifest.json',m);dump('verification/attack_metrics.json',stats)
 dump('spec.json',{'round':15,'durations':TIMES,'hitFrame':3,'sourceGeometry':SPECS,'headMasks':HEADS,'headLock':'R14 idle_0 face and hair, integer translations only','sourceTool':'image_gen.imagegen','idleReturn':'R14 idle_0','normalizationImplementation':'build.py'})
 frames=[]
 for n in anim['frames']:
  bg=blank(*SIZE,BG);paste(bg,read(R/f'composite/{n}.png'));frames.append(bg)
 gif(frames,TIMES,R/'attack_1x.gif');gif([resize(f,512,480) for f in frames],TIMES,R/'attack_4x.gif')
 sheet=blank(1536,720,BG)
 for i,f in enumerate(frames):
  x=i%4*384;y=i//4*360
  paste(sheet,resize(crop(f,(24,40,120,120)),384,320),x,y+40);number(sheet,x+10,y+10,i,3);number(sheet,x+62,y+10,TIMES[i],3)
 save(sheet,R/'attack_contact_sheet.png');save(sheet,R/'attack_review.png')
 allnames=[n for a in m['animations'].values() for n in a['frames']]
 sheet=blank(1920,6*336,BG)
 for i,n in enumerate(allnames):
  im=blank(*SIZE,BG);paste(im,read(R/f'composite/{n}.png'))
  paste(sheet,resize(crop(im,(0,16,128,120)),384,312),i%5*384,i//5*336+24);number(sheet,i%5*384+10,i//5*336+5,i,3)
 save(sheet,R/'contact_sheet.png');save(sheet,R/'normalization_review.png')
 oldanim=json.loads((OLD/'manifest.json').read_text())['animations']['attack']
 def ends(ds):
  total=0;out=[0]
  for d in ds:total+=d;out.append(total)
  return out
 oe=ends(oldanim['durations']);ne=ends(TIMES);events=sorted(set(oe+ne));comparison=[];ds=[]
 for a,b in zip(events,events[1:]):
  oi=next((j for j in range(len(oldanim['frames'])) if a<oe[j+1]),None);ni=next(j for j in range(8) if a<ne[j+1])
  left=read(OLD/f"composite/{'idle_0' if oi is None else 'attack_'+str(oi)}.png")
  pair=blank(1024,420,BG)
  paste(pair,resize(crop(left,(0,24,128,120)),512,384),0,36)
  paste(pair,resize(crop(frames[ni],(0,24,128,120)),512,384),512,36)
  number(pair,16,10,14,3);number(pair,528,10,15,3)
  comparison.append(pair);ds.append(b-a)
 gif(comparison,ds,R/'attack_r14_vs_r15.gif')
 save(comparison[next(j for j,a in enumerate(events[:-1]) if a==270)],R/'verification/comparison_hit.png')
 print(json.dumps(stats,ensure_ascii=False,indent=2))
if __name__=='__main__':export()
