"""Register individually imagegen-authored art, separate layers, export pixel/1.
No generated shapes substitute for source artwork. Writes only in this directory.
"""
from pathlib import Path
import json, math, hashlib, struct
from raster import *
R=Path(__file__).resolve().parent
CID='assassin_male_p2'; HAIR='assassin_swept_crop_p2'; SIZE=(128,120)
BG=(37,49,62,255)
def pal(s):return [tuple(bytes.fromhex(c))+(255,) for c in s.split()]
HK=pal('faf0d7 e1cdb8 b49b91 49342f')
BP=pal('211c29 352532 49333b 654451 805165 a5677b 292c42 3a435e 525d7d 748198 452e29 7e4b24 b47d35 e0b765 ffdfa0 fffdf8 fff0d1 ffe1ba f4bc91 d68b70 a55651 413242')
WP=pal('fffdf8 e9e9ed c4c3cf 9493a3 626274 3f4257 e0b765 b47d35 49333b')
FX=pal('666079 8c86a6 aaa4c0 c5c1d8 e6e3f0 fffdf8')
# source neck x/y, ground y; target neck x/body height; source head rectangle;
# source weapon grip/tip. Measured visually from each reviewed source.
S={
'idle_0':[660,650,1185,64,24,[330,142,905,650],[559,808],[750,905]],
'idle_1':[660,640,1185,64,25,[330,137,905,640],[554,803],[750,905]],
'walk_0':[675,635,1187,64,24,[350,136,937,635],[416,799],[563,926]],
'walk_1':[675,650,1194,64,23,[344,150,935,650],[529,844],[685,924]],
'walk_2':[675,650,1203,64,24,[345,150,935,650],[558,843],[727,900]],
'walk_3':[675,650,1205,64,25,[345,151,935,650],[612,819],[781,852]],
'walk_4':[687,646,1197,64,24,[357,145,949,646],[644,822],[815,851]],
'walk_5':[698,640,1196,64,23,[378,142,971,640],[480,775],[615,864]],
'walk_6':[679,631,1198,64,24,[363,123,961,631],[416,792],[417,946]],
'walk_7':[688,620,1212,64,25,[354,111,956,620],[557,801],[711,922]],
'attack_0':[694,672,1180,64,22,[350,154,940,672],[414,774],[587,829]],
'attack_1':[713,650,1181,63,22,[390,145,953,650],[251,477],[91,321]],
'attack_2':[730,666,1188,67,20,[405,155,969,666],[734,775],[977,852]],
'attack_3':[761,704,1154,69,17,[421,202,993,704],[826,854],[1030,978]],
'attack_4':[744,690,1159,69,17,[420,167,988,690],[854,848],[1040,961]],
'attack_5':[715,636,1190,66,22,[370,105,955,636],[505,728],[685,816]],
'hurt_0':[546,590,1180,61,22,[205,123,787,590],[457,852],[554,1019]],
'hurt_1':[748,721,1180,63,20,[470,208,1017,721],[468,863],[535,1019]],
'dead_1':[809,803,1171,66,14,[520,242,1082,803],[525,889],[653,1048]],
'dead_2_fix':[936,855,1157,71,12,[699,304,1195,855],[559,856],[657,1031]],
'dead_3_fix':[800,700,898,64,0,[885,202,1462,791],[686,606],[918,662]],
'sit_0':[665,641,1165,64,15,[330,148,907,641],[559,911],[747,1000]],
'cast_0':[645,642,1193,64,24,[318,128,895,642],[479,845],[627,985]],
'cast_1':[645,639,1195,64,25,[318,126,895,639],[479,845],[627,985]],
'sonic_impact_fix':[734,672,1187,69,19,[405,154,978,672],[847,769],[1126,767]],
'sonic_retract':[734,672,1186,67,20,[411,152,980,672],[662,777],[893,781]],
'sonic_low':[750,706,1178,70,17,[433,187,1007,706],[784,824],[1042,827]],
'grim_down':[702,704,1118,66,15,[408,189,980,704],[558,895],[677,1077]],
'grim_hit':[720,755,1139,66,13,[425,241,992,755],[589,948],[700,1147]],
'scatter_ready':[651,650,1192,64,22,[323,144,902,650],[302,851],[202,1015]],
'scatter_release':[683,659,1190,66,20,[350,169,954,659],[305,831],[206,977]],
'pickup_touch':[767,745,1145,66,14,[477,237,1066,745],[499,842],[697,943]],
'pickup_rise':[765,601,1173,65,19,[499,95,1077,601],[493,782],[710,876]],
'plant_contact':[731,653,1188,68,21,[440,136,1018,653],[432,789],[556,961]],
'detox_palm':[665,642,1194,64,24,[338,134,916,642],[444,856],[546,1003]],
'coat_start':[628,616,1186,64,24,[301,99,887,616],[660,744],[873,746]],
'coat_end':[628,616,1183,64,24,[301,98,887,616],[660,744],[873,746]],
'guard_hold':[640,606,1194,63,23,[314,78,912,606],[780,599],[936,453]],
'hide_low':[710,699,1177,64,14,[397,165,985,699],[560,863],[763,986]],
'roll_tuck':[660,740,1116,61,0,[58,283,656,810],[652,746],[882,791]],
'roll_invert':[650,740,1106,60,0,[139,605,656,1106],[727,785],[926,784]],
'roll_land_fix':[712,839,1184,61,14,[378,321,935,839],[432,812],[628,907]],
 'throw_ready':[640,603,1185,63,23,[339,95,924,603],[254,357],[126,177]],
 'throw_release':[659,610,1189,68,21,[360,115,938,610],[1060,651],[1180,651]],
 'throw_follow_fix':[659,610,1189,68,20,[360,113,938,610],[962,817],[1075,862]],
}
HIDDEN={'throw_release','throw_follow_fix'}
CUSTOM={'dead_3_fix','roll_tuck','roll_invert'}
REJECTED={'dead_2':'무기 손 전환','dead_3':'비율과 발광','sonic_impact':'무기 손 전환','throw_follow':'팔 소속 전환','roll_land':'천 꼬리 중복'}

def dump(n,v):
 p=R/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def unit(a,b):
 d=math.dist(a,b);return ((b[0]-a[0])/d,(b[1]-a[1])/d)
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{HAIR}/{n}_back.png','front':f'hair/{HAIR}/{n}_front.png','katar':f'weapons/katar/{CID}/{n}.png','dagger':f'weapons/dagger/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls,w='katar',visible=True):
 im=blank(*SIZE)
 for k in ('back','body',w,'grip','front'):
  if not visible and k in (w,'grip'):continue
  paste(im,ls[k])
 return im

def facepoly(box,variant='normal'):
 l,t,r,b=box;w=r-l;h=b-t
 # Head-only face/ear/mask keep their skin/cloth colors, independently of hair tint.
 if variant=='roll_invert':
  v=[(.51,.35),(.85,.18),(.95,.40),(.97,.74),(.73,.93),(.40,.95),(.32,.78),(.40,.61)]
 elif variant=='dead_3_fix':
  v=[(.27,.51),(.39,.50),(.46,.65),(.69,.64),(.91,.65),(.91,.91),(.65,1),(.31,.90),(.10,.69)]
 elif variant in ('hurt_1','dead_1','dead_2_fix','pickup_touch','pickup_rise','roll_land_fix'):
  v=[(.64,.43),(.74,.42),(.87,.59),(.96,.71),(.92,.93),(.67,1),(.39,.91),(.29,.74),(.25,.70),(.26,.60),(.37,.63),(.44,.78),(.56,.72)]
 else:
  v=[(.65,.32),(.75,.31),(.81,.41),(.88,.57),(.91,.77),(.82,.88),(.75,1),(.51,1),(.39,.87),(.28,.81),(.22,.69),(.26,.58),(.36,.59),(.41,.77),(.48,.72),(.53,.49)]
 return [(l+x*w,t+y*h) for x,y in v]

def categorize_head(p,x,y,box,name):
 if inside(x,y,facepoly(box,name)):return 'body',nearest(p,BP)
 # Exclude navy mask and saturated peach skin from tintable hair.
 skin=p[0]-p[1]>42 and p[1]-p[2]>12
 navy=p[2]>p[1]+6 and p[0]<135
 if skin or navy:return 'body',nearest(p,BP)
 return 'front',nearest(p,HK)

def compressed_gif(frames,ds,path):
 w,h=frames[0][:2];colors=list(dict.fromkeys(p[:3] for f in frames for p in f[2]));assert len(colors)<=256
 table={p:i for i,p in enumerate(colors)};colors += [(0,0,0)]*(256-len(colors))
 out=bytearray(b'GIF89a'+struct.pack('<HHBBB',w,h,247,0,0)+bytes(v for p in colors for v in p))
 out+=b'!\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00'
 for f,ms in zip(frames,ds):
  vals=[table[p[:3]] for p in f[2]];d={};nxt=258;codes=[256];prefix=vals[0]
  for k in vals[1:]:
   key=(prefix,k)
   if key in d:prefix=d[key];continue
   codes.append(prefix)
   if nxt<510:d[key]=nxt;nxt+=1
   else:codes.append(256);d={};nxt=258
   prefix=k
  codes.extend([prefix,257]);raw=bytearray();acc=bits=0
  for c in codes:
   acc|=c<<bits;bits+=9
   while bits>=8:raw.append(acc&255);acc>>=8;bits-=8
  if bits:raw.append(acc&255)
  out+=b'!\xf9\x04\x08'+struct.pack('<H',ms//10)+b'\0\0'+b','+struct.pack('<HHHHB',0,0,w,h,0)+b'\x08'
  for j in range(0,len(raw),255):block=raw[j:j+255];out.append(len(block));out+=block
  out+=b'\0'
 out+=b';';(R/path).write_bytes(out)

# Explicit frame sequences. Shared recovery/hold poses are listed, not represented as new drawings.
A={}
def anim(name,sources,ds,hit=None,loop=False,hold=False):
 a={'sources':sources,'durations':ds,'duration':sum(ds),'loop':loop}
 if hit is not None:a['hitFrame']=hit
 if hold:a['holdLast']=True
 A[name]=a
anim('idle',['idle_0','idle_1','idle_0'],[240,260,240],loop=True)
anim('walk',[f'walk_{i}' for i in range(8)],[80]*8,loop=True)
anim('attack',[f'attack_{i}' for i in range(6)]+['idle_1','idle_0'],[70,90,60,50,130,90,70,60],3)
anim('hurt',['hurt_0','hurt_1','idle_0'],[80,140,100])
anim('dead',['hurt_1','dead_1','dead_2_fix','dead_3_fix'],[90,120,140,1000],hold=True)
anim('sit',['sit_0'],[1000],hold=True)
anim('cast',['cast_0','cast_1','cast_0'],[160,180,160],loop=True)
sonic=['attack_0','sonic_retract']
for i in range(8):
 sonic.append('sonic_impact_fix' if i%2==0 else 'sonic_low')
 if i<7:sonic.append('sonic_retract')
sonic+=['attack_5','idle_0']
anim('skill_sonic',sonic,[70,60]+[30,30]*7+[60,100,90],2)
anim('skill_grimtooth',['attack_0','grim_down','grim_hit','grim_down','pickup_rise','idle_0'],[60,70,180,100,110,90],2)
anim('skill_envenom',['attack_0','sonic_retract','sonic_impact_fix','sonic_retract','attack_5','idle_0'],[60,70,170,100,100,80],2)
anim('skill_scatter',['idle_0','scatter_ready','scatter_release','plant_contact','scatter_ready','idle_0'],[50,80,140,90,100,90],2)
anim('skill_throw',['attack_0','throw_ready','throw_release','throw_follow_fix','attack_5','idle_0'],[50,80,90,130,130,100],2)
anim('skill_pickup',['cast_0','grim_down','pickup_touch','pickup_rise','scatter_ready','idle_0'],[70,90,140,130,100,80])
anim('skill_plant',['cast_0','scatter_ready','plant_contact','scatter_release','cast_0','idle_0'],[60,70,180,80,100,80],2)
anim('skill_coat',['idle_0','coat_start','coat_end','coat_start','idle_0'],[80,140,190,120,110])
anim('skill_guard',['idle_0','coat_start','guard_hold','coat_start','idle_0'],[70,100,260,100,90])
anim('skill_detox',['cast_0','cast_1','detox_palm','cast_0','idle_0'],[90,90,220,120,90])
anim('skill_hide',['idle_0','cast_0','attack_0','hide_low'],[70,100,100,310],hold=True)
anim('skill_backslide',['attack_0','hide_low','roll_tuck','roll_invert','roll_land_fix','pickup_rise','idle_0'],[70,80,90,90,110,100,100])
MAPPING={
'sonic_blow':'skill_sonic','grimtooth':'skill_grimtooth','envenom':'skill_envenom','sand_attack':'skill_scatter','throw_stone':'skill_throw','find_stone':'skill_pickup','venom_knife':'skill_throw','venom_splasher':'skill_plant','venom_dust':'skill_scatter','enchant_poison':'skill_coat','poison_react':'skill_guard','detoxify':'skill_detox','hiding':'skill_hide','cloaking':'skill_hide','back_slide':'skill_backslide'}

# Drawn weapon artwork is sampled in its own local grip coordinate system.
def weapon_templates():
 out={}
 regions={
  'katar': [[(598,704),(725,696),(740,694),(891,734),(891,750),(740,782),(714,788),(598,783)]],
  'dagger': [[(595,810),(793,931),(790,946),(582,860)],[(599,778),(620,784),(574,884),(553,876)],[(540,797),(583,817),(573,841),(533,822)]]
 }
 for kind,name,g,t,length in [('katar','coat_start',[660,744],[873,746],11),('dagger','dagger_design',[554,810],[781,935],12)]:
  src=read(R/f'sources/{name}.png');u=unit(g,t);v=(-u[1],u[0]);scale=length/math.dist(g,t)
  tex={}
  for yy in range(-4,5):
   for xx in range(-2,length+2):
    sx=round(g[0]+(xx*u[0]+yy*v[0])/scale);sy=round(g[1]+(xx*u[1]+yy*v[1])/scale)
    if not any(inside(sx,sy,poly) for poly in regions[kind]):continue
    p=get(src,sx,sy)
    if p[3]<250:continue
    # Beyond the guard, keep only cool steel; nearby plum armour is not blade art.
    if xx>=4 and (p[2]<p[0]-2 or abs(p[0]-p[1])>18):continue
    tex[xx,yy]=nearest(p,WP)
  out[kind]=tex
 return out

def normalize(name,templates):
 spec=S[name];cx,neck,ground,tx,bh,box,sg,st=spec;l,top,r,b=box
 ls={k:blank(*SIZE) for k in paths('')}
 custom=name in CUSTOM
 scale=(27/(r-l)) if custom else bh/(ground-neck)
 if custom:
  # Whole-body rolled/sideways frames retain authored articulation, not rotated standing art.
  ax={'dead_3_fix':800,'roll_tuck':650,'roll_invert':660}[name]
  transform=lambda x,y:(round((x-ax)*scale+tx),round((y-ground)*scale+112))
  inv=lambda x,y:((x+.5-tx)/scale+ax,(y+.5-112)/scale+ground)
 else:
  transform=lambda x,y:(round((x-cx)*scale+tx),round((y-ground)*scale+112))
  inv=lambda x,y:((x+.5-tx)/scale+cx,(y+.5-112)/scale+ground)
 src=read(R/f'sources/{name}.png');u=unit(sg,st);v=(-u[1],u[0]);length=math.dist(sg,st)
 g=list(transform(*sg));tip=[round(g[0]+11*u[0]),round(g[1]+11*u[1])]
 for y in range(120):
  for x in range(128):
   sx,sy=inv(x,y);p=get(src,round(sx),round(sy))
   if p[3]<250:continue
   # Remove only the measured weapon footprint and authored steel smear from body.
   rel=(sx-sg[0],sy-sg[1]);along=dot(rel,u);cross=dot(rel,v)
   metal=(p[0]>110 and abs(p[0]-p[2])<55) or (p[0]>135 and p[1]>85 and p[1]-p[2]>25)
   inweapon=-75<along<length+35 and abs(cross)<65 and name not in HIDDEN
   effect=name in ('attack_2','attack_3','sonic_impact_fix','sonic_low') and p[2]>p[0]-10 and p[1]>85 and p[0]>100 and sy>280 and not(l<sx<r and top<sy<b)
   if effect and not inweapon:
    # Body metal ornaments are warm; the cool silver/lavender is attached swing art.
    put(ls['katar'],x,y,nearest(p,FX));put(ls['dagger'],x,y,nearest(p,FX));continue
   if inweapon and metal:continue
   inhead=l<=sx<r and top<=sy<b
   if inhead:
    if not custom:continue
    k,q=categorize_head(p,sx,sy,box,name);put(ls[k],x,y,q)
   else:put(ls['body'],x,y,nearest(p,BP))
 if not custom:
  hs=24/(b-top);targetneck=112-bh
  for y in range(targetneck-24,targetneck):
   for x in range(30,101):
    sx=(x+.5-tx)/hs+cx;sy=(y+.5-targetneck)/hs+b
    if not(l<=sx<r and top<=sy<b):continue
    p=get(src,round(sx),round(sy))
    if p[3]<250:continue
    # Prevent a raised weapon in the head rectangle entering the hair layer.
    rel=(sx-sg[0],sy-sg[1]);al=dot(rel,u);cr=dot(rel,v)
    if name=='guard_hold' and -50<al<length+30 and abs(cr)<70:continue
    k,q=categorize_head(p,sx,sy,box,name);put(ls[k],x,y,q)
 # Hair behind the outer ear belongs in back layer; remaining hair stays foreground.
 for y in range(120):
  for x in range(128):
   p=get(ls['front'],x,y)
   if p[3] and x<tx-7 and y>(112-bh-6 if bh else 110):put(ls['back'],x,y,p);put(ls['front'],x,y,T)
 if name not in HIDDEN:
  for kind,tex in templates.items():
   # Inverse sample normalized weapon artwork to maintain constant blade dimensions.
   for y in range(g[1]-16,g[1]+17):
    for x in range(g[0]-16,g[0]+17):
     d=(x-g[0],y-g[1]);p=tex.get((round(dot(d,u)),round(dot(d,v))))
     if p:put(ls[kind],x,y,p)
  # Authored glove interior is copied as a grip overlay, with no brass rails baked in.
  for y in range(g[1]-1,g[1]+2):
   for x in range(g[0]-1,g[0]+2):
    p=get(ls['body'],x,y)
    if p[3] and p[0]<140:put(ls['grip'],x,y,p)
 return ls,{'grip':g,'tip':tip,'angle':round(math.degrees(math.atan2(u[1],u[0])),2),'bodyScale':scale,'headHeight':24 if not custom else None,'source':name,'visible':name not in HIDDEN}

def onbg(im):
 out=blank(*SIZE,BG);paste(out,im);return out

def make_sheet(names,comps,path,cols=6):
 cw,ch=256,164;sheet=blank(cols*cw,math.ceil(len(names)/cols)*ch,BG)
 for i,n in enumerate(names):
  x=i%cols*cw;y=i//cols*ch
  number(sheet,x+8,y+6,i,2)
  paste(sheet,resize(crop(onbg(comps[n]),(0,48,128,120)),256,144),x,y+20)
 save(sheet,R/path)

def export():
 templates=weapon_templates();cache={};metrics={}
 for name in S:
  cache[name],metrics[name]=normalize(name,templates)
  save(compose(cache[name]),R/f'verification/normalized/{name}.png')
  print('packed',name,flush=True)
 m={'schema':'minimidgard.pixel/1','canvas':{'size':list(SIZE),'origin':[64,112],'bodyHeight':48},'hairKeys':['#faf0d7','#e1cdb8','#b49b91','#49342f'],'animations':{},'characters':{},'hair':{HAIR:{'gender':'male','pivot':[0,0],'poses':{}}},'weapons':{w:{'frames':{CID:{}}} for w in ['katar','dagger']}}
 c={'class':'assassin','gender':'male','bodyHeight':48,'headHeight':24,'proportion':2,'defaultWeapon':'katar','defaultHair':HAIR,'hairStyles':[HAIR],'animations':{},'skillMotions':MAPPING,'frames':{}}
 m['characters'][CID]=c;allcomps={};allnames=[];frameinfo={};skillnames=[]
 for action,a in A.items():
  names=[f'{action}_{i}' for i in range(len(a['sources']))]
  aa={k:v for k,v in a.items() if k!='sources'};aa['frames']=names
  c['animations'][action]=aa;m['animations'][action]=aa
  frames=[];daggerframes=[]
  for n,source in zip(names,a['sources']):
   ls=cache[source];p=paths(n);stat=metrics[source]
   for k,path in p.items():save(ls[k],R/path)
   visible=stat['visible'];g=stat['grip'];t=stat['tip']
   c['frames'][n]={'image':p['body'],'head':{'point':[0,0],'pose':n,'basePose':'up'},'weapon':{'z':'front','visible':visible,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':stat['angle']},'grip':p['grip']}
   m['hair'][HAIR]['poses'][n]={'front':p['front'],'back':p['back'],'pivot':[0,0]}
   for w in ['katar','dagger']:m['weapons'][w]['frames'][CID][n]=p[w]
   im=compose(ls);save(im,R/f'composite/{n}.png');save(compose(ls,'dagger'),R/f'composite/dagger/{n}.png')
   allcomps[n]=im;allnames.append(n);frames.append(onbg(im));daggerframes.append(onbg(compose(ls,'dagger')))
   frameinfo[n]={**stat,'bounds':bounds(im),'sourceSha256':hashlib.sha256((R/f'sources/{source}.png').read_bytes()).hexdigest()}
  compressed_gif(frames,a['durations'],action+'_1x.gif');compressed_gif([resize(f,512,480) for f in frames],a['durations'],action+'_4x.gif')
  if action.startswith('skill_'):skillnames.extend(names)
  make_sheet(names,allcomps,action+'_contact_sheet.png',min(6,len(names)))
  # Dagger has its own reviewed weapon playback, particularly important for throw.
  if action in ('idle','walk','attack','skill_throw','skill_coat'):
   compressed_gif(daggerframes,a['durations'],action+'_dagger_1x.gif');compressed_gif([resize(f,512,480) for f in daggerframes],a['durations'],action+'_dagger_4x.gif')
 dump('manifest.json',m);dump('verification/frame_metrics.json',frameinfo);dump('verification/source_specs.json',S)
 dump('FRAME_REVIEWS.json',{'method':'직전 원화를 육안 확인하고 다음 이미지 요청의 previousReview에 기록. 최종 픽셀 시트 추가 검수.','rejected':REJECTED,'authoredSources':list(S),'sequences':{k:a['sources'] for k,a in A.items()},'prompts':'PROMPTS.json'})
 make_sheet([n for n in allnames if not n.startswith('skill_')],allcomps,'contact_sheet.png')
 make_sheet(skillnames,allcomps,'skills_contact_sheet.png',8)
 dump('contact_sheet_index.json',{'base':[n for n in allnames if not n.startswith('skill_')],'skills':skillnames})
 # Preserve animation timing in comparisons, hold idle when the shorter animation ends.
 def pick(a,t):
  acc=0
  for i,d in enumerate(a['durations']):
   acc+=d
   if t<acc:return f"{a['name']}_{i}"
  return f"{a['name']}_{len(a['durations'])-1}" if a.get('holdLast') else 'idle_0'
 attack={**c['animations']['attack'],'name':'attack'}
 for name,a0 in c['animations'].items():
  if not name.startswith('skill_'):continue
  a={**a0,'name':name};ends={0}
  for aa in (attack,a):
   t=0
   for d in aa['durations']:t+=d;ends.add(t)
  ends=sorted(ends);frames=[]
  for t in ends[:-1]:
   im=blank(256,120,BG);paste(im,allcomps[pick(attack,t)]);paste(im,allcomps[pick(a,t)],128,0);frames.append(im)
  ds=[b-a for a,b in zip(ends,ends[1:])]
  compressed_gif(frames,ds,'attack_vs_'+name+'_1x.gif');compressed_gif([resize(f,1024,480) for f in frames],ds,'attack_vs_'+name+'_4x.gif')
  save(resize(frames[min(2,len(frames)-1)],1024,480),R/f'comparisons/attack_vs_{name}.png')
 # Style/size comparison: same canvas and ground, never rescale any hero individually.
 pair=blank(384,120,BG)
 for i,folder in enumerate(['pixel-hero-r12','pixel-knight-r15']):
  ref=R.with_name(folder);mm=json.loads((ref/'manifest.json').read_text());cc=next(iter(mm['characters'].values()));nn=cc.get('animations',mm['animations'])['idle']['frames'][0];f=cc['frames'][nn];style=cc['defaultHair'];hp=mm['hair'][style]['poses'][f['head']['pose']]
  img=blank(*SIZE)
  for pp in [hp.get('back'),f['image'],mm['weapons'][cc['defaultWeapon']]['frames'][next(iter(mm['characters']))][nn],f.get('grip'),hp.get('front')]:
   if pp:paste(img,read(ref/pp))
  paste(pair,img,i*128)
 paste(pair,allcomps['idle_0'],256)
 save(pair,R/'size_comparison_1x.png');save(resize(pair,1536,480),R/'size_comparison_4x.png')
 dump('verification/build_summary.json',{'frames':len(allnames),'baseAnimations':7,'skillAnimations':12,'mappedSkills':len(MAPPING),'authoredAcceptedSources':len(S),'rejectedSources':len(REJECTED),'sourceTool':'image_gen.imagegen','drawnWeapons':['katar','dagger']})
 print('EXPORT COMPLETE',len(allnames))
if __name__=='__main__':export()
