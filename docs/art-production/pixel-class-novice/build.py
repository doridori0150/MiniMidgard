"""Pack individually imagegen-authored novice frames, using r15 pixel/1 conventions.
Only writes into this folder. No procedural character drawing: authored pixels,
nearest-neighbour registration, palette assignment, head lock, and layer masks.
"""
from pathlib import Path
import json, math, copy, hashlib
from raster import *

R=Path(__file__).resolve().parent
CID='novice_female_p2'; STYLE='novice_short_tail_p2'; SIZE=(128,120)
BG=(37,49,62,255)
def colors(items): return [tuple(bytes.fromhex(x))+(255,) for x in items.split()]
HK=colors('faf0d7 e1cdb8 b49b91 49342f')
BP=colors('30242c 49333b 65505a fffdf8 fff0d1 ffe1ba f4bc91 d68b70 a55651 583419 8c5529 b17a4c d09c6a e9e9ed c4c3cf 9493a3 626274 3f4257 f5d58e c69a58 916137 5e4140 92906b 777653 5c6045 3c4638 d8bd94 99cdef')
FP=colors('30242c 49333b 65505a fffdf8 fff0d1 ffe1ba f4bc91 d68b70 a55651 583419 8c5529')
ANIMS={
 'idle':dict(durations=[420,300,120],loop=True),
 'walk':dict(durations=[90]*6,loop=True),
 'attack':dict(durations=[100,120,60,100,80,60],loop=False,hitFrame=2),
 'hurt':dict(durations=[90,150],loop=False),
 'dead':dict(durations=[100,140,1000],loop=False,holdLast=True),
 'sit':dict(durations=[1000],loop=False,holdLast=True),
}
for a,v in ANIMS.items():v.update(frames=[f'{a}_{i}' for i in range(len(v['durations']))],duration=sum(v['durations']))
# cx, neck, source ground, target neck x/y, source grip, source tip.
SPECS={
 'idle_0':[650,680,1115,64,88,[779,887],[869,957]],
 'idle_1':[650,680,1115,64,87,[778,879],[871,955]],
 'idle_2':[650,680,1115,64,88,[779,887],[869,957]],
 'walk_0':[650,680,1115,64,88,[777,887],[870,958]],
 'walk_1':[650,686,1115,64,89,[780,887],[870,958]],
 'walk_2':[650,686,1112,64,87,[779,887],[870,958]],
 'walk_3':[650,625,1152,64,88,[790,848],[890,920]],
 'walk_4':[650,690,1126,64,89,[776,884],[867,961]],
 'walk_5':[650,686,1115,64,87,[778,868],[881,936]],
 'attack_0':[650,680,1115,64,88,[788,752],[937,687]],
 'attack_1':[650,742,1115,63,91,[787,799],[939,733]],
 'attack_2':[650,765,1115,68,94,[891,798],[1062,806]],
 'attack_3':[650,780,1115,68,95,[895,811],[1062,808]],
 'attack_4':[680,765,1115,66,91,[787,944],[879,1016]],
 'hurt_0':[601,706,1115,62,89,[775,887],[877,957]],
 'hurt_1':[650,700,1115,63,88,[779,889],[878,960]],
 'dead_0':[710,842,1120,66,96,[812,981],[936,1040]],
 'dead_1':[750,1050,1150,70,106,[980,1116],[1155,1133]],
 'dead_2':[800,1120,1150,72,110,[1041,1123],[1215,1132]],
 'sit_0':[650,750,1074,64,96,[785,967],[882,1034]],
}
BASE_FACE=[(737,451),(764,472),(777,511),(780,615),(759,647),(724,665),(631,674),(590,651),(577,625),(548,624),(528,604),(529,577),(566,564),(603,570),(650,543),(683,510),(714,468)]
HEADS={
 'idle_0':dict(cx=650,top=315,neck=680,box=[390,315,855,703],face=BASE_FACE),
 'idle_2':dict(cx=650,top=315,neck=680,box=[390,315,855,703],face=BASE_FACE),
 'hurt_0':dict(cx=601,top=350,neck=706,box=[300,348,789,742],face=[(650,500),(688,515),(700,559),(701,663),(671,695),(588,704),(537,684),(516,656),(488,652),(474,625),(475,603),(519,591),(560,568),(608,538)]),
 'hurt_1':dict(cx=650,top=338,neck=700,box=[391,336,856,716],face=[(737,474),(767,498),(780,534),(776,638),(750,675),(710,695),(621,687),(587,660),(574,636),(547,635),(525,611),(535,588),(566,582),(611,577),(660,544),(706,495)]),
}
def dump(name,data):
 p=R/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def paths(n): return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','weapon':f'weapons/dagger/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 out=blank(*SIZE)
 for k in ('back','body','weapon','grip','front'):paste(out,ls[k])
 return out
def nearest_body(p):return nearest(p,BP)
def head_layers(src,key,tx,ty):
 h=HEADS[key];scale=24/(h['neck']-h['top']);ls={k:blank(*SIZE) for k in ('body','front','back')}
 for y in range(120):
  sy=round((y+.5-ty)/scale+h['neck'])
  for x in range(128):
   sx=round((x+.5-tx)/scale+h['cx']);p=get(src,sx,sy)
   if p[3]<220 or not (h['box'][0]<=sx<h['box'][2] and h['box'][1]<=sy<h['box'][3]):continue
   # Mask excludes the neck/scarf but retains hanging side locks and tail.
   if sy>h['neck']-9 and h['cx']-90<sx<h['cx']+89:continue
   face=inside(sx,sy,h['face'])
   # A face mask can straddle the fringe by a source pixel. Never let the
   # clothes' olive shades participate in facial palette matching.
   if face:put(ls['body'],x,y,nearest(p,FP))
   else:put(ls['back' if sx<h['cx']-120 and sy>h['top']+180 else 'front'],x,y,nearest(p,HK))
 return ls

def normalize(n,base,blink):
 src=read(R/f'sources/{n}.png');s=SPECS[n];cx,neck,ground,tx,ty,sg,st=s
 sxscale=.058 if n!='walk_3' else .053
 syScale=(112-ty)/(ground-neck)
 if n=='dead_0':sxscale=.060;syScale=.060
 if n=='dead_1':sxscale=syScale=.063
 if n=='dead_2':sxscale=.052;syScale=.068
 def xmap(sx):
  if n=='dead_2' and sx>=638:return (638-cx)*sxscale+tx+(sx-638)*.068
  return (sx-cx)*sxscale+tx
 def point(p):return [round(xmap(p[0])),round((p[1]-ground)*syScale+112)]
 def source(x,y):
  split=(638-cx)*sxscale+tx
  sx=(x+.5-split)/.068+638 if n=='dead_2' and x+.5>=split else (x+.5-tx)/sxscale+cx
  return round(sx),round((y+.5-112)/syScale+ground)
 ls={k:blank(*SIZE) for k in paths(n)}
 g=point(sg);t=point(st)
 vx,vy=st[0]-sg[0],st[1]-sg[1];ll=math.hypot(vx,vy);ux,uy=vx/ll,vy/ll
 # For fallen frames, the head is authored tilted; all other poses share the
 # idle head with integer translations, except the two expressive hurt heads.
 fallen=n.startswith('dead')
 for y in range(120):
  for x in range(128):
   sx,sy=source(x,y);p=get(src,sx,sy)
   if p[3]<220:continue
   along=(sx-sg[0])*ux+(sy-sg[1])*uy;cross=abs(-(sx-sg[0])*uy+(sy-sg[1])*ux)
   wp=along>=18 and cross<65
   if n=='attack_2' and sx>=1058 and 765<=sy<=825:wp=True
   if wp:
    put(ls['weapon'],x,y,nearest_body(p));continue
   if not fallen:
    if sy<neck:continue
    if sy<neck+28 and (sx<cx-115 or sx>cx+90):continue
   hair=False
   if fallen:
    head_polys={
     'dead_0':[(617,486),(738,486),(880,571),(941,752),(932,852),(898,897),(862,881),(846,844),(733,846),(684,822),(636,808),(590,773),(523,808),(444,797),(440,685),(500,638),(510,578)],
     'dead_1':[(818,732),(889,748),(994,846),(1048,1015),(1047,1104),(1008,1093),(954,1080),(850,1090),(806,1060),(748,1006),(690,958),(667,926),(626,928),(552,900),(545,827),(590,783),(652,766),(701,782),(740,756)],
     'dead_2':[(637,908),(695,880),(781,878),(845,857),(925,871),(1000,940),(1048,1066),(1045,1132),(967,1132),(902,1120),(842,1100),(806,1077),(764,1035),(742,1008),(685,1000),(642,965)]}
    hair=inside(sx,sy,head_polys[n])
    # Warm orange skin, eyes and mouth remain in the body layer. Hair is
    # less saturated; face polygons exclude its dark eye outlines as well.
    faces={
     'dead_0':[(817,658),(857,704),(852,809),(815,847),(717,838),(663,791),(648,750),(728,745),(770,713)],
     'dead_1':[(951,928),(979,966),(969,1037),(937,1067),(853,1072),(801,1044),(758,988),(806,977),(863,988),(915,959)],
     'dead_2':[(966,1024),(989,1040),(986,1108),(951,1129),(876,1117),(823,1089),(796,1043),(846,1055),(897,1044)]}
    if inside(sx,sy,faces[n]) or (p[0]>p[1]+22 and p[1]>p[2]+26):hair=False
   if hair:put(ls['back' if sx<cx-35 and sy<neck-80 else 'front'],x,y,nearest(p,HK))
   else:put(ls['body'],x,y,nearest_body(p))
 if not fallen:
  key=n if n in ('hurt_0','hurt_1') else ('idle_2' if n=='idle_2' else 'idle_0')
  hs=head_layers(src if key.startswith('hurt') else (blink if key=='idle_2' else base),key,tx,ty)
  for k in ('body','back','front'):paste(ls[k],hs[k])
 # Register the individually authored blades to a constant 10px hand-to-tip
 # reach, just as r15 fixes its sword reach. Keep the hit streak separate.
 original=ls['weapon'];blade=blank(*SIZE);reach=math.dist(g,t)
 ux2=(t[0]-g[0])/reach;uy2=(t[1]-g[1])/reach
 for y in range(120):
  for x in range(128):
   ax=x-g[0];ay=y-g[1];along=ax*ux2+ay*uy2;cross=-ax*uy2+ay*ux2
   if -3<=along<=11 and abs(cross)<=5:
    oa=along if along<=1 else 1+(along-1)*(reach-1)/9
    put(blade,x,y,get(original,round(g[0]+oa*ux2-cross*uy2),round(g[1]+oa*uy2+cross*ux2)))
   elif n=='attack_2' and along>11:put(blade,x,y,get(original,x,y))
 ls['weapon']=blade;t=[round(g[0]+10*ux2),round(g[1]+10*uy2)]
 # Preserve painted hand pixels in body and repeat only those in the grip
 # overlay, keeping hilt behind fingers. Never draw new knuckles or weapons.
 for y in range(g[1]-2,g[1]+3):
  for x in range(g[0]-2,g[0]+3):
   sx,sy=source(x,y);p=get(src,sx,sy)
   if p[3]<220:continue
   # Skin in the authored fist; excludes the dark hilt and metallic blade.
   if p[0]>p[1]+15 and p[1]>p[2]+12 and p[0]>150:
    q=nearest_body(p);put(ls['body'],x,y,q);put(ls['grip'],x,y,q);put(ls['weapon'],x,y,q)
 return ls,g,t,dict(source=s,headMode='authored_fall' if fallen else key,headTarget=[tx,ty],scale=[sxscale,syScale])

def preview_frames(frames,scale=1):
 out=[]
 for im in frames:
  bg=blank(*SIZE,BG);paste(bg,im);out.append(resize(bg,128*scale,120*scale) if scale!=1 else bg)
 return out
def sheet(names,frames,cols=5):
 cellw,cellh=320,280;out=blank(cols*cellw,math.ceil(len(frames)/cols)*cellh,BG)
 for i,im in enumerate(frames):
  x=i%cols*cellw;y=i//cols*cellh
  paste(out,resize(crop(im,(24,52,104,120)),320,272),x,y+8)
  number(out,x+8,y+8,i,2)
 return out
def build():
 base=read(R/'sources/idle_0.png');blink=read(R/'sources/idle_2.png')
 m=dict(schema='minimidgard.pixel/1',canvas=dict(size=[128,120],origin=[64,112],bodyHeight=48),animations=ANIMS,hairKeys=['#faf0d7','#e1cdb8','#b49b91','#49342f'])
 c=dict(class_='novice',gender='female',bodyHeight=48,headHeight=24,proportion=2,defaultWeapon='dagger',defaultHair=STYLE,hairStyles=[STYLE],animations=copy.deepcopy(ANIMS),frames={});c['class']=c.pop('class_')
 m.update(characters={CID:c},hair={STYLE:dict(gender='female',style='short_tail',proportion='p2',pivot=[0,0],poses={})},weapons={'dagger':{'frames':{CID:{}}}})
 stats={};allframes={};saved={}
 for a,anim in ANIMS.items():
  for n in anim['frames']:
   if n=='attack_5':ls,g,t,stat=copy.deepcopy(saved['idle_0']);stat['exactIdleReturn']=True
   else:ls,g,t,stat=normalize(n,base,blink)
   saved[n]=(ls,g,t,stat);ps=paths(n)
   for k,p in ps.items():save(ls[k],R/p)
   c['frames'][n]=dict(image=ps['body'],head=dict(point=[0,0],pose=n,basePose='down' if a=='dead' else 'up'),weapon=dict(z='front',visible=True,hand='near',gripPoint=g,tipPoint=t,angleDegrees=round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)),grip=ps['grip'])
   m['hair'][STYLE]['poses'][n]=dict(front=ps['front'],back=ps['back'],pivot=[0,0])
   m['weapons']['dagger']['frames'][CID][n]=ps['weapon']
   im=compose(ls);allframes[n]=im;save(im,R/f'composite/{n}.png')
   stats[n]={**stat,'bounds':bounds(im),'grip':g,'tip':t,'layers':{k:sum(p[3]>0 for p in im[2]) for k,im in ls.items()}}
   print(n,bounds(im),flush=True)
  frames=[allframes[n] for n in anim['frames']]
  for scale in (1,4):gif(preview_frames(frames,scale),anim['durations'],R/f'{a}_{scale}x.gif')
  save(sheet(anim['frames'],preview_frames(frames),min(len(frames),6)),R/f'{a}_contact_sheet.png')
 save(sheet(list(allframes),preview_frames(list(allframes.values()))),R/'contact_sheet.png')
 refs=[read(R.parent/'pixel-hero-r12/composite/idle_0.png'),read(R.parent/'pixel-knight-r15/composite/idle_0.png'),allframes['idle_0']]
 side=blank(384,120,BG)
 for i,im in enumerate(refs):paste(side,im,i*128,0);number(side,i*128+57,43,i+1)
 save(side,R/'comparison_1x.png');save(resize(side,1536,480),R/'comparison_4x.png')
 dump('manifest.json',m);dump('verification/frame_metrics.json',stats)
 dump('spec.json',dict(sourceTool='image_gen.imagegen',headLock='idle head, integer offsets; authored blink, hurt and fallen expressions',specs=SPECS,animations=ANIMS))
if __name__=='__main__':build()
