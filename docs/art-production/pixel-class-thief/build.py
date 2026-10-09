"""Pack individually authored imagegen frames; registration, palette and layer export only.
No procedural character drawing. All writes stay beside this script.
"""
from pathlib import Path
import json, math, copy, hashlib
from raster import *
R=Path(__file__).resolve().parent
CID='thief_male_p2'; STYLE='thief_crop_p2'; SIZE=(128,120); BG=(37,49,62,255)
def pal(s):return [tuple(bytes.fromhex(c))+(255,) for c in s.split()]
HK=pal('faf0d7 e1cdb8 b49b91 49342f')
BP=pal('2e222b 49333b 65505a 583419 8c5529 b57b47 d6a56b e9c797 fff0d1 ffe1ba f4bc91 d68b70 a55651 252937 35475a 506780 74879c b6b5bf 51313f 793848 a34b5d ce7180 c69a58 e9e9ed')
WP=pal('fffdf8 e9e9ed c4c3cf 9493a3 626274 3f4257 49333b e4d0ad')
FX=pal('666079 8c86a6 aaa4c0 c5c1d8 e6e3f0 fffdf8')
# neck x/y, ground y, target neck x, head y offset, head box left/top/right/bottom,
# source grip xy, source blade tip xy. Measured from the inspected sources.
SPECS={
'idle_0':[611,940,1207,64,0,[427,684,737,940],[514,1074],[625,1130]],
'idle_1':[613,934,1209,64,0,[430,679,741,934],[515,1071],[629,1131]],
'idle_2':[613,940,1211,64,0,[432,684,737,940],[514,1074],[627,1135]],
'walk_0':[618,942,1201,65,0,[447,693,739,940],[613,1050],[710,1105]],
'walk_1':[630,952,1202,65,1,[456,704,749,950],[615,1052],[705,1107]],
'walk_2':[619,942,1208,64,0,[446,691,740,940],[497,1050],[575,1119]],
'walk_3':[615,936,1208,64,-1,[439,687,741,936],[478,1050],[555,1110]],
'walk_4':[615,939,1207,64,0,[441,686,740,938],[479,1050],[556,1108]],
'walk_5':[615,944,1211,64,1,[437,693,741,943],[475,1055],[555,1113]],
'walk_6':[615,941,1216,64,0,[434,686,742,940],[685,1040],[772,1097]],
'walk_7':[615,938,1211,64,-1,[437,685,741,938],[688,1050],[769,1099]],
'attack_0':[620,961,1209,64,2,[432,704,746,959],[475,1063],[582,1116]],
'attack_1':[620,960,1209,64,2,[432,704,746,956],[395,1007],[291,1042]],
'attack_2':[680,990,1211,69,5,[499,737,806,986],[353,950],[203,957]],
'attack_3':[658,991,1209,70,6,[475,744,788,988],[864,994],[1002,992]],
'attack_4':[658,996,1211,70,7,[474,750,788,992],[865,995],[1006,1000]],
'attack_5':[626,966,1214,66,3,[452,719,746,961],[548,1029],[650,1092]],
'hurt_0':[585,957,1210,62,0,[389,725,660,960],[550,1073],[650,1126]],
'hurt_1':[578,946,1213,61,0,[362,698,656,948],[544,1064],[659,1129]],
'hurt_2':[585,950,1213,62,0,[382,694,674,950],[536,1065],[640,1118]],
'dead_0':[681,1001,1205,68,0,[561,717,875,992],[568,1110],[650,1192]],
'dead_1':[753,1151,1231,70,0,[667,910,971,1191],[735,1199],[844,1213]],
'dead_2':[772,1184,1241,71,0,[680,981,980,1220],[741,1211],[848,1220]],
'sit_0':[619,1024,1228,64,0,[429,724,783,1012],[566,1109],[652,1180]],
}
DUR={'idle':[200]*3,'walk':[70]*8,'attack':[60,70,70,40,100,60,40],'hurt':[60,100,100],'dead':[100,140,1000],'sit':[1000]}

def dump(n,v):
 p=R/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','weapon':f'weapons/dagger/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 im=blank(*SIZE)
 for k in ['back','body','weapon','grip','front']:paste(im,ls[k])
 return im

def face_poly(box,n):
 l,t,r,b=box;w=r-l;h=b-t
 # Local face/ear contours, retaining eyes and male eyebrows in the body layer.
 if n.startswith('dead'):
  coords=[(.37,.59),(.52,.66),(.72,.51),(.88,.65),(.88,.87),(.65,.99),(.45,.88),(.35,.79),(.25,.78),(.23,.65)]
 elif n.startswith('hurt'):
  coords=[(.58,.25),(.72,.26),(.83,.37),(.94,.56),(.88,.73),(.72,.86),(.56,.88),(.40,.79),(.33,.74),(.32,.63),(.42,.64),(.48,.72),(.52,.52)]
 else:
  coords=[(.75,.34),(.79,.42),(.82,.55),(.86,.61),(.87,.78),(.79,.92),(.67,.97),(.51,.91),(.44,.83),(.38,.82),(.29,.71),(.29,.63),(.37,.63),(.43,.72),(.47,.73),(.49,.61),(.62,.53)]
 return [(l+x*w,t+y*h) for x,y in coords]

def head_pixel(src,sx,sy,box,n):
 p=get(src,round(sx),round(sy))
 if p[3]<220:return None
 l,t,r,b=box
 if not (l<=sx<r and t<=sy<b):return None
 face=inside(sx,sy,face_poly(box,n))
 # Exclude collar, forearm and wrist near the head rectangle from hair recolouring.
 u=(sx-l)/w if False else (sx-l)/(r-l);v=(sy-t)/(b-t)
 nonhair=(p[2]>p[0]+5) or (v>.89 and .30<u<.85)
 if n in ('attack_2','attack_3','attack_4'):
  nonhair=nonhair or (u<.40 and v>.80) or v>.93
 # Warm peach skin never enters recolourable hair; dark face details stay in body.
 skin=p[0]-p[2]>46 and p[0]-p[1]>15
 return ('body',nearest(p,BP)) if face or skin or nonhair else ('front',nearest(p,HK))

def canonical():
 src=read(R/'sources/idle_0.png'); box=SPECS['idle_0'][5];layers={k:blank(*SIZE) for k in ('body','back','front')}
 scale=48/521
 for y in range(64,88):
  for x in range(43,83):
   sx=(x+.5-64)/scale+611;sy=(y+.5-112)/scale+1207
   v=head_pixel(src,sx,sy,box,'idle_0')
   if v:put(layers[v[0]],x,y,v[1])
 # Hair below the ear is the back layer, hidden behind body where appropriate.
 for y in range(83,88):
  for x in range(43,61):
   p=get(layers['front'],x,y)
   if p[3]:put(layers['back'],x,y,p);put(layers['front'],x,y,T)
 return layers

def normalize(n,canon):
 src=read(R/f'sources/{n}.png');cx,neck,ground,tx,dy,box,sg,st=SPECS[n]
 locked=False
 if n=='sit_0':scale=27/(box[2]-box[0])
 else:scale=48/521
 # Keep the authored whole silhouette: one scale, integer ground registration.
 # Pose neck anchors preserve intended center-of-mass displacement.
 def point(p):return [round((p[0]-cx)*scale+tx),round((p[1]-ground)*scale+112)]
 def source(x,y):return [(x+.5-tx)/scale+cx,(y+.5-112)/scale+ground]
 ls={k:blank(*SIZE) for k in paths(n)}
 g=point(sg);tip=point(st);vx,vy=st[0]-sg[0],st[1]-sg[1];length=math.hypot(vx,vy);ux,uy=vx/length,vy/length
 for y in range(120):
  for x in range(128):
   sx,sy=source(x,y);p=get(src,round(sx),round(sy))
   if p[3]<220:continue
   l,t,r,b=box
   # Head silhouette removes generated head, then canonical same-size identity is registered.
   inhead=l<=sx<r and t<=sy<b
   if inhead:
    if locked:continue
    v=head_pixel(src,sx,sy,box,n)
    if v:put(ls[v[0]],x,y,v[1])
    continue
   along=(sx-sg[0])*ux+(sy-sg[1])*uy;cross=abs(-(sx-sg[0])*uy+(sy-sg[1])*ux)
   blade=along>=-5 and along<=length+15 and cross<=31
   # Lavender horizontal sweep, excluding skin/costume; blade remains a separate weapon layer.
   effect=n=='attack_3' and 890<sy<1090 and p[2]>=p[0]-7 and p[2]>p[1] and (sx<480 or sy>1018 or sx>850)
   if effect:put(ls['weapon'],x,y,nearest(p,FX))
   elif blade:put(ls['weapon'],x,y,nearest(p,WP))
   else:put(ls['body'],x,y,nearest(p,BP))
 if locked:
  for k in ('body','back','front'):paste(ls[k],canon[k],tx-64,dy)
 else:
  # Separate back hair pixels by their position behind the ear.
  for y in range(120):
   for x in range(128):
    sx,sy=source(x,y)
    if sx<box[0]+.42*(box[2]-box[0]) and sy>box[1]+.68*(box[3]-box[1]):
     p=get(ls['front'],x,y)
     if p[3]:put(ls['back'],x,y,p);put(ls['front'],x,y,T)
 # Keep original hand pixels on top of weapon hilt as the schema requires.
 for y in range(g[1]-2,g[1]+3):
  for x in range(g[0]-2,g[0]+3):
   p=get(ls['body'],x,y)
   if p[3]:put(ls['grip'],x,y,p)
 # A duplicate of authored grip pixels under its overlay anchors the weapon to the hand.
 paste(ls['weapon'],ls['grip'])
 return ls,{'sourceScale':scale,'sourceGrip':sg,'sourceTip':st,'grip':g,'tip':tip,'headLock':locked,'headOffset':[tx-64,dy] if locked else None}

def previews(m):
 names=[n for a in m['animations'].values() for n in a['frames']]
 sheet=blank(5*384,5*264,BG)
 for i,n in enumerate(names):
  im=read(R/f'composite/{n}.png');x=i%5*384;y=i//5*264
  paste(sheet,resize(crop(im,(0,36,128,120)),384,252),x,y+12);number(sheet,x+6,y+3,i,2)
 save(sheet,R/'contact_sheet.png')
 for a,d in m['animations'].items():
  fs=[]
  for n in d['frames']:
   im=blank(*SIZE,BG);paste(im,read(R/f'composite/{n}.png'));fs.append(im)
  for s in [1,4]:gif([resize(f,128*s,120*s) for f in fs],d['durations'],R/f'{a}_{s}x.gif')
  cols=min(4,len(fs));rows=math.ceil(len(fs)/cols);sh=blank(cols*384,rows*288,BG)
  for i,f in enumerate(fs):
   x=i%cols*384;y=i//cols*288;paste(sh,resize(crop(f,(0,32,128,120)),384,264),x,y+24);number(sh,x+8,y+5,i,2);number(sh,x+42,y+5,d['durations'][i],2)
  save(sh,R/f'{a}_contact_sheet.png')
 # All three sprites share identical canvas and origin: no fit-to-box rescaling.
 pair=blank(384,120,BG)
 refs=[R.parent/'pixel-hero-r12/composite/idle_0.png',R.parent/'pixel-knight-r15/composite/idle_0.png',R/'composite/idle_0.png']
 for i,p in enumerate(refs):paste(pair,read(p),i*128,0);number(pair,i*128+8,8,i+1)
 save(pair,R/'side_by_side_1x.png');save(resize(pair,1536,480),R/'side_by_side_4x.png')

def main():
 canon=None;allls={};stats={}
 for n in SPECS:
  allls[n],stats[n]=normalize(n,canon)
 allls['attack_6']=copy.deepcopy(allls['idle_0']);stats['attack_6']={**stats['idle_0'],'reuse':'idle_0'}
 # Fill only the body hidden by the hit smear from its separately generated no-smear follow-through.
 hit=allls['attack_3'];follow=allls['attack_4']
 for y in range(120):
  for x in range(128):
   if get(hit['weapon'],x,y) in FX and get(follow['body'],x,y)[3]:put(hit['body'],x,y,get(follow['body'],x,y))
 anim={a:{'frames':[f'{a}_{i}' for i in range(len(ds))],'durations':ds,'duration':sum(ds),'loop':a in ('idle','walk')} for a,ds in DUR.items()}
 anim['attack']['hitFrame']=3
 for a in ('dead','sit'):anim[a]['holdLast']=True
 m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':copy.deepcopy(anim),'hairKeys':['#faf0d7','#e1cdb8','#b49b91','#49342f'],'characters':{CID:{'class':'thief','gender':'male','bodyHeight':48,'headHeight':24,'proportion':2,'defaultWeapon':'dagger','defaultHair':STYLE,'hairStyles':[STYLE],'animations':copy.deepcopy(anim),'frames':{}}},'hair':{STYLE:{'gender':'male','style':'swept_crop','proportion':'p2','pivot':[0,0],'poses':{}}},'weapons':{'dagger':{'frames':{CID:{}}}}}
 for a in anim.values():
  for n in a['frames']:
   ls=allls[n];p=paths(n);s=stats[n];g=s['grip'];t=s['tip']
   for k,path in p.items():save(ls[k],R/path)
   im=compose(ls);save(im,R/f'composite/{n}.png')
   m['characters'][CID]['frames'][n]={'image':p['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if n.startswith('dead') else 'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':p['grip']}
   m['hair'][STYLE]['poses'][n]={'front':p['front'],'back':p['back'],'pivot':[0,0]};m['weapons']['dagger']['frames'][CID][n]=p['weapon']
   stats[n].update({'bounds':bounds(im),'layerPixels':{k:sum(p[3]>0 for p in v[2]) for k,v in ls.items()}})
 dump('manifest.json',m);dump('verification/frame_metrics.json',stats);dump('spec.json',{'sourceGeometry':SPECS,'sourceTool':'image_gen.imagegen','headLock':'Authored whole silhouettes retained; fixed 48/521 source scale except larger rendered sit normalized to 27px head width','drawOrder':['back','body','weapon','grip','front'],'normalization':'build.py'})
 previews(m);print('Exported',sum(len(a['frames']) for a in anim.values()),'frames; six actions, 12 GIFs')
if __name__=='__main__':main()
