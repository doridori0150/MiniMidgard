"""Pack sequential imagegen artwork; nearest sampling, masks, palette and registration.
No character artwork is procedurally drawn. All writes remain in this directory.
"""
from pathlib import Path
import json, math, copy, hashlib
from raster import *
R=Path(__file__).resolve().parent
CID='merchant_female_p2'; STYLE='merchant_tucked_bob_p2'; SIZE=(128,120)
BG=(37,49,62,255)
def pal(hexes):return [tuple(bytes.fromhex(h))+(255,) for h in hexes.split()]
HK=pal('faf0d7 e1cdb8 b49b91 49342f')
BP=pal('30212a 51333a 70504a fff5de ffe3b0 f6c58f d99566 a65e43 8f552d b87842 c69558 593b30 e8c67a c99337 a6742c 735023 527480 385963 27414b 192e39 eeeef4 c8c9d3 9a9ba9 6b6e82 494a5e a03b32')
FX=pal('666079 8c86a6 aaa4c0 c5c1d8 e6e3f0 fffdf8')
TIMES={'idle':[440,280,120],'walk':[90]*6,'attack':[120,180,70,50,180,140,100,60],'hurt':[100,180],'dead':[120,160,1000],'sit':[1000]}
# head bounds, source ground y, source registration x, grip, axe head center.
S={
 'idle_0':[[403,426,823,765],1129,630,[780,950],[865,1050]],
 'idle_1':[[402,420,824,756],1130,630,[785,942],[865,1042]],
 'idle_2':[[402,426,825,756],1131,630,[785,945],[867,1047]],
 'walk_0':[[429,428,849,764],1132,650,[798,953],[893,1037]],
 'walk_1':[[430,409,849,742],1129,650,[799,933],[893,1018]],
 'walk_2':[[430,409,849,742],1124,650,[800,933],[892,1017]],
 'walk_3':[[428,423,849,755],1126,650,[798,949],[889,1030]],
 'walk_4':[[430,413,849,745],1132,650,[801,933],[896,1019]],
 'walk_5':[[431,427,850,762],1141,650,[801,950],[895,1032]],
 'attack_0':[[404,450,799,772],1135,630,[843,660],[790,443]],
 'attack_1':[[401,463,845,787],1136,630,[751,519],[583,377]],
 'attack_2':[[454,520,869,855],1110,630,[785,927],[1024,1017]],
 'attack_3':[[458,615,851,924],1109,630,[770,983],[1050,1087]],
 'attack_4':[[458,615,851,924],1109,630,[770,983],[1050,1087]],
 'attack_5':[[462,638,852,952],1127,630,[772,1016],[1050,1115]],
 'attack_6':[[458,518,839,840],1128,630,[744,950],[882,1070]],
 'hurt_0':[[314,452,723,815],1135,630,[792,911],[872,1009]],
 'hurt_1':[[353,451,752,798],1136,630,[790,930],[872,1030]],
 'dead_0':[[479,543,873,875],1134,650,[777,990],[866,1070]],
 'dead_1':[[291,644,664,979],1128,610,[714,1030],[847,1106]],
 'dead_2':[[193,741,612,1095],1105,610,[722,1075],[904,1092]],
 'sit_0':[[399,510,829,855],1141,630,[802,918],[892,1062]],
}
# Hair silhouette excludes facial skin/eyes. Coordinates from inspected source frames.
FACE={
 'idle_0':[(711,534),(754,598),(760,710),(731,744),(660,747),(608,718),(589,683),(568,703),(538,677),(538,652),(594,646),(638,604)],
 'attack_2':[(767,646),(803,695),(810,786),(763,824),(711,812),(659,776),(635,743),(681,722),(721,688)],
 'attack_3':[(771,726),(799,785),(791,868),(755,902),(708,881),(660,849),(648,810),(703,793),(744,761)],
 'hurt_0':[(587,521),(630,551),(657,626),(654,690),(611,735),(567,750),(514,718),(480,678),(508,650),(545,616)],
 'hurt_1':[(643,536),(677,583),(703,662),(681,713),(643,743),(586,747),(536,715),(512,678),(560,649),(603,600)],
 'dead_0':[(793,696),(812,752),(789,810),(748,846),(696,834),(647,804),(620,767),(695,767),(740,738)],
 'dead_1':[(557,763),(577,810),(576,872),(543,911),(495,933),(451,915),(422,883),(462,871),(501,830)],
 'dead_2':[(451,868),(483,885),(529,933),(548,979),(516,1021),(456,1047),(421,1039),(413,1008),(434,961)],
}
def dump(path,value):
 p=R/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','weapon':f'weapons/axe/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 out=blank(*SIZE)
 for k in ('back','body','weapon','grip','front'):paste(out,ls[k])
 return out
def facepoly(n):
 if n in FACE:return FACE[n]
 if n in ('attack_4','attack_5'):
  h=S[n][0];q=S['attack_3'][0];return [(x+h[0]-q[0],y+h[1]-q[1]) for x,y in FACE['attack_3']]
 if n=='attack_6':
  h=S[n][0];q=S['attack_2'][0];return [(h[0]+(x-q[0])*(h[2]-h[0])/(q[2]-q[0]),h[1]+(y-q[1])*(h[3]-h[1])/(q[3]-q[1])) for x,y in FACE['attack_2']]
 h=S[n][0];q=S['idle_0'][0]
 return [(h[0]+(x-q[0])*(h[2]-h[0])/(q[2]-q[0]),h[1]+(y-q[1])*(h[3]-h[1])/(q[3]-q[1])) for x,y in FACE['idle_0']]
def normalize(n):
 src=read(R/f'sources/{n}.png');h,ground,cx,sg,st=S[n]
 scale=48/703
 # Preserve original head density while allowing pose-specific silhouette movement.
 def point(p):return [round(64+(p[0]-cx)*scale),round(112+(p[1]-ground)*scale)]
 g=point(sg);rawt=point(st);v=[st[0]-sg[0],st[1]-sg[1]];ll=math.hypot(*v);ux,uy=v[0]/ll,v[1]/ll
 ls={k:blank(*SIZE) for k in paths(n)};raw=blank(*SIZE);fpoly=facepoly(n)
 for y in range(120):
  sy=round(ground+(y+.5-112)/scale)
  for x in range(128):
   sx=round(cx+(x+.5-64)/scale);p=get(src,sx,sy)
   if p[3]<220:continue
   along=(sx-sg[0])*ux+(sy-sg[1])*uy;cross=abs(-(sx-sg[0])*uy+(sy-sg[1])*ux)
   effect=n in ('attack_2','attack_3') and (p[2]>p[0]+2 or max(p[:3])-min(p[:3])<35) and (sy<h[1] or sx>h[2]-10)
   # Explicit axe corridor, widening around blade. Hand remains on body.
   axe=along>25 and cross<(80 if along>ll-65 else 32)
   if effect or axe:
    put(raw,x,y,nearest(p,FX if effect else BP));continue
   if abs(sx-sg[0])<=30 and abs(sy-sg[1])<=30:
    put(ls['body'],x,y,nearest(p,BP))
   elif h[0]<=sx<h[2] and h[1]<=sy<h[3] and not inside(sx,sy,fpoly):
    # Right-hand raised sleeve is outside hair silhouette, even beside the head.
    if n in ('attack_0','attack_1') and sx>h[2]-55 and sy>h[1]+160:
     put(ls['body'],x,y,nearest(p,BP))
    else:
     k='back' if sx<h[0]+(h[2]-h[0])*.29 or (sy>h[3]-45 and sx>h[2]-85) else 'front'
     put(ls[k],x,y,nearest(p,HK))
   else:put(ls['body'],x,y,nearest(p,BP))
 # Isolated shaft/blade outline fragments lie outside the narrow source corridor.
 # Transfer these authored pixels to weapon before reach normalization.
 figure=blank(*SIZE)
 for k in ('back','body','front'):paste(figure,ls[k])
 pts={(i%128,i//128) for i,p in enumerate(figure[2]) if p[3]};components=[]
 while pts:
  q=[pts.pop()];component=[]
  while q:
   px,py=q.pop();component.append((px,py))
   for dx in (-1,0,1):
    for dy in (-1,0,1):
     z=(px+dx,py+dy)
     if z in pts:pts.remove(z);q.append(z)
  components.append(component)
 for component in sorted(components,key=len,reverse=True)[1:]:
  if len(component)>8:continue
  for x,y in component:
   put(raw,x,y,nearest(get(figure,x,y),BP))
   for k in ('back','body','front'):put(ls[k],x,y,T)
 # Constant ~10px hand-to-axe-head-center, preserving blade thickness/size.
 rawlen=ll*scale;reach=10
 for y in range(120):
  for x in range(128):
   dx=x-g[0];dy=y-g[1];a=dx*ux+dy*uy;c=-dx*uy+dy*ux
   oa=a if a<=1 else (1+(a-1)*(rawlen-1)/(reach-1) if a<reach else rawlen+a-reach)
   put(ls['weapon'],x,y,get(raw,round(g[0]+oa*ux-c*uy),round(g[1]+oa*uy+c*ux)))
 # Authored grip pixels overlay the haft; only sample existing art, never invent hands.
 for y in range(g[1]-2,g[1]+3):
  for x in range(g[0]-2,g[0]+3):
   p=get(ls['body'],x,y)
   if p[3]:put(ls['grip'],x,y,p)
 # Under the gripping hand, reuse a sampled wooden-haft pixel to ensure connected layer.
 for y in range(g[1]-1,g[1]+2):
  for x in range(g[0]-1,g[0]+2):
   if get(ls['grip'],x,y)[3]:
    sp=get(src,round(sg[0]+ux*40),round(sg[1]+uy*40))
    if sp[3]>=220:put(ls['weapon'],x,y,nearest(sp,BP))
 t=[round(g[0]+reach*ux),round(g[1]+reach*uy)]
 return ls,g,t
def exports():
 anim={}
 for a,ds in TIMES.items():
  anim[a]={'frames':[f'{a}_{i}' for i in range(len(ds))],'durations':ds,'duration':sum(ds),'loop':a in ('idle','walk')}
  if a=='attack':anim[a]['hitFrame']=3
  if a in ('dead','sit'):anim[a]['holdLast']=True
 c={'class':'merchant','gender':'female','bodyHeight':48,'headHeight':24,'proportion':2,'defaultWeapon':'axe','defaultHair':STYLE,'hairStyles':[STYLE],'animations':copy.deepcopy(anim),'frames':{}}
 m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':anim,'hairKeys':['#faf0d7','#e1cdb8','#b49b91','#49342f'],'characters':{CID:c},'hair':{STYLE:{'gender':'female','style':'merchant_tucked_bob','proportion':'p2','pivot':[0,0],'poses':{}}},'weapons':{'axe':{'frames':{CID:{}}}}}
 metrics={};allframes=[]
 for a,an in anim.items():
  preview=[]
  for n in an['frames']:
   ls,g,t=normalize('idle_0' if n=='attack_7' else n)
   ps=paths(n)
   for k,p in ps.items():save(ls[k],R/p)
   im=compose(ls);save(im,R/f'composite/{n}.png');allframes.append((n,im))
   c['frames'][n]={'image':ps['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if a=='dead' else 'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':ps['grip']}
   m['hair'][STYLE]['poses'][n]={'front':ps['front'],'back':ps['back'],'pivot':[0,0]}
   m['weapons']['axe']['frames'][CID][n]=ps['weapon']
   b=blank(*SIZE,BG);paste(b,im);preview.append(b)
   figure=blank(*SIZE)
   for k in ('back','body','front'):paste(figure,ls[k])
   metrics[n]={'bounds':bounds(im),'figureBounds':bounds(figure),'grip':g,'axeHeadCenter':t,'layerPixelCounts':{k:sum(p[3]>0 for p in v[2]) for k,v in ls.items()}}
  gif(preview,an['durations'],R/f'{a}_1x.gif');gif([resize(f,512,480) for f in preview],an['durations'],R/f'{a}_4x.gif')
  sh=blank(384*min(4,len(preview)),336*math.ceil(len(preview)/4),BG)
  for i,f in enumerate(preview):
   x=i%4*384;y=i//4*336;paste(sh,resize(crop(f,(0,16,128,120)),384,312),x,y+24);number(sh,x+8,y+6,i,2);number(sh,x+44,y+6,an['durations'][i],2)
  save(sh,R/f'{a}_contact_sheet.png')
 sheet=blank(5*384,math.ceil(len(allframes)/5)*336,BG)
 for i,(n,f) in enumerate(allframes):
  x=i%5*384;y=i//5*336;paste(sheet,resize(crop(f,(0,16,128,120)),384,312),x,y+24);number(sheet,x+8,y+6,i,2)
 save(sheet,R/'contact_sheet.png')
 comp=blank(384,120,BG)
 for i,p in enumerate([R.with_name('pixel-hero-r12')/'composite/idle_0.png',R.with_name('pixel-knight-r15')/'composite/idle_0.png',R/'composite/idle_0.png']):paste(comp,read(p),i*128,0)
 save(comp,R/'comparison_1x.png');save(resize(comp,1536,480),R/'comparison_4x.png')
 dump('manifest.json',m);dump('verification/frame_metrics.json',metrics)
 dump('spec.json',{'sourceTool':'image_gen.imagegen','scale':48/703,'geometry':S,'faceMasks':FACE,'weaponHeadReach':10,'layerOrder':['back','body','weapon','grip','front'],'normalization':'nearest-neighbor source sampling; four hair keys; palette clamp; registered feet; consistent axe reach','attackReturn':'idle_0 exact layers'})
 print(json.dumps({'frames':len(allframes),'actions':list(anim),'destination':str(R)},ensure_ascii=False))
if __name__=='__main__':exports()
