"""Pack individually imagegen-authored frames; nearest sampling and layer separation only.
No procedural character drawing. All output stays in this production folder.
"""
from pathlib import Path
import json, math, hashlib
from raster import *
R=Path(__file__).resolve().parent
CID='acolyte_female_p2'; STYLE='side_bun_p2'; SIZE=(128,120)
BG=(37,49,62,255)
def palette(s):return [tuple(bytes.fromhex(x))+(255,) for x in s.split()]
HK=palette('faf0d7 e1cdb8 b49b91 49342f')
BP=palette('33232b 54353a 795352 fff8e8 ebd9be c7b39e 9a8278 ffe4c0 f7c49e e99c7c b76450 502b23 864b2a b77d49 f2ce77 c69a4b 896331 963f4b 712d3d 492632 d8dee7 a6aebb 747b8e 4b5162 fffff6')
FX=palette('73523f 987457 b99375 d6b698 f4ddba fff6d7')
SK=palette('ffe4c0 f7c49e e99c7c b76450')
TIMES={'idle':[240]*3,'walk':[90]*6,'attack':[90,150,60,50,160,80,70],'cast':[160,200,220,180],'hurt':[90,170],'dead':[100,140,1000],'sit':[1000]}
# source character top/neck/ground (excluding mace), neck x, target head top,
# source grip, source metal-head centre, head polygon. Geometry inspected per source.
S={
'idle_0':[470,777,1094,638,64,[658,897],[784,984]],
'idle_1':[471,777,1095,638,64,[659,880],[784,973]],
'idle_2':[474,779,1096,640,64,[660,925],[790,999]],
'walk_0':[472,780,1098,640,64,[737,913],[822,982]],
'walk_1':[465,772,1096,640,63,[735,901],[828,973]],
'walk_2':[475,780,1091,640,64,[737,905],[835,969]],
'walk_3':[476,780,1092,643,65,[670,890],[816,971]],
'walk_4':[467,773,1093,638,63,[673,884],[809,976]],
'walk_5':[471,778,1091,648,64,[736,911],[824,979]],
'attack_0':[472,779,1103,628,64,[770,635],[785,462]],
'attack_1':[491,779,1105,630,65,[699,513],[504,442]],
'attack_2':[501,786,1102,650,66,[866,641],[995,526]],
'attack_3':[549,828,1103,687,69,[837,983],[1006,1065]],
'attack_4':[548,828,1103,687,69,[840,981],[1010,1069]],
'attack_5':[507,782,1099,667,66,[661,884],[784,979]],
'cast_0':[498,787,1106,646,65,[654,852],[786,997]],
'cast_1':[494,783,1105,642,65,[655,844],[787,993]],
'cast_2':[499,785,1106,641,66,[654,848],[785,998]],
'cast_3':[490,780,1108,642,65,[655,850],[787,1000]],
'hurt_0':[543,816,1100,607,66,[758,929],[839,964]],
'hurt_1':[521,801,1099,615,65,[760,925],[841,974]],
'dead_0':[597,864,1105,625,72,[711,1004],[789,1061]],
'dead_1':[682,985,1067,520,82,[615,1025],[747,1037]],
'dead_2':[708,1017,1038,475,87,[684,1009],[834,1017]],
'sit_0':[463,850,1139,662,72,[695,1002],[855,1089]],
}
# Head masks follow authored head outline, separating it from lifted sleeves/mace.
HEAD={
'attack_0':[(410,620),(447,512),(569,472),(657,472),(737,524),(751,600),(735,649),(744,685),(735,743),(695,780),(578,780),(493,765),(416,711)],
'attack_1':[(389,638),(435,540),(507,496),(638,489),(670,510),(709,569),(735,620),(735,706),(694,768),(591,786),(509,767),(412,744)],
'attack_2':[(436,650),(465,549),(580,500),(673,500),(756,557),(794,628),(795,722),(750,794),(650,796),(521,777),(436,724)],
'attack_3':[(489,678),(522,606),(633,547),(716,550),(789,600),(837,664),(851,783),(811,840),(730,845),(633,819),(536,789),(490,747)],
'attack_4':[(489,678),(522,606),(633,547),(716,550),(789,600),(837,664),(851,783),(811,840),(730,845),(633,819),(536,789),(490,747)],
'dead_1':[(222,866),(242,747),(321,683),(412,682),(453,706),(501,689),(548,748),(555,829),(520,842),(498,912),(468,964),(402,987),(360,1008),(268,1004),(221,939)],
'dead_2':[(137,895),(175,785),(272,708),(359,710),(402,734),(447,718),(506,787),(509,855),(466,870),(450,949),(411,989),(333,1014),(248,1035),(166,1036),(137,966)],
}
def headpoly(n):
 if n in HEAD:return HEAD[n]
 top,neck,ground,cx,*_=S[n]
 # Every remaining pose has a clean horizontal hair/neck boundary.
 return [(cx-245,top-2),(cx+170,top-2),(cx+190,neck-10),(cx+112,neck+9),(cx-60,neck-7),(cx-240,neck-7)]
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','weapon':f'weapons/mace/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 out=blank(*SIZE)
 for k in ['back','body','weapon','grip','front']:paste(out,ls[k])
 return out
def dump(p,v):(R/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def normalize(n):
 src=read(R/f'sources/{n}.png')
 top,neck,ground,cx,ty,sg,st=S[n]
 # Head stays 24px. Lower-body size follows the planned pose instead of rescaling the whole canvas.
 hs=24/(neck-top);bs=(112-(ty+24))/(ground-neck)
 if n.startswith('dead_') and n!='dead_0':
  hs=bs=0.076 if n=='dead_1' else 0.071
  ty=112-(ground-top)*hs
 sxscale=hs
 tx=64
 if n in ('attack_3','attack_4'):tx=68
 if n=='attack_5':tx=66
 if n=='hurt_0':tx=61
 if n=='hurt_1':tx=62
 if n=='dead_1':tx=58
 if n=='dead_2':tx=53
 def point(p):return [round((p[0]-cx)*sxscale+tx),round(ty+(p[1]-top)*hs if p[1]<=neck else ty+24+(p[1]-neck)*bs)]
 def unpoint(x,y):
  sy=top+(y+.5-ty)/hs if y+.5<=ty+24 else neck+(y+.5-ty-24)/bs
  if n in ('dead_1','dead_2'):sy=ground+(y+.5-112)/hs
  return round(cx+(x+.5-tx)/sxscale),round(sy)
 g=point(sg);t=point(st)
 if n in ('dead_1','dead_2'):
  g=[round((sg[0]-cx)*hs+tx),round(112+(sg[1]-ground)*hs)]
  t=[round((st[0]-cx)*hs+tx),round(112+(st[1]-ground)*hs)]
 ls={k:blank(*SIZE) for k in paths(n)}
 vx,vy=st[0]-sg[0],st[1]-sg[1];length=math.hypot(vx,vy);ux,uy=vx/length,vy/length
 hp=headpoly(n)
 for y in range(120):
  for x in range(128):
   sx,sy=unpoint(x,y);p=get(src,sx,sy)
   if p[3]<220:continue
   # Original weapon and smear masks, with skin hand reserved for grip overlay.
   along=(sx-sg[0])*ux+(sy-sg[1])*uy;cross=abs(-(sx-sg[0])*uy+(sy-sg[1])*ux)
   metal=math.dist((sx,sy),st)<88
   shaft=along>15 and along<length and cross<28
   effect=(n=='attack_2' and sy<500) or (n=='attack_2' and sx<450 and sy<637) or (n=='attack_2' and sx>800 and sy<573)
   effect|=(n=='attack_3' and (sy<535 or sx>900 or (sx>855 and sy<900)) and not metal and not shaft)
   skin=p[0]-p[1]>18 and p[1]-p[2]>12 and p[0]>160
   ishand=abs(sx-sg[0])<40 and abs(sy-sg[1])<43 and skin
   if effect:layer='weapon';pal=FX
   elif (metal or shaft) and not ishand:layer='weapon';pal=BP
   elif inside(sx,sy,hp):
    # Warm skin and dark facial marks stay in body; only hair is tintable.
    # Semantic face/ear regions take precedence: ivory hair can be as warm as skin.
    facial=False
    if n in ('dead_1','dead_2'):
     facepoly=([(294,828),(447,846),(467,880),(442,946),(357,965),(302,924)] if n=='dead_1' else [(217,872),(370,898),(418,875),(418,955),(364,984),(258,976)])
     facial|=inside(sx,sy,facepoly)
     facial|=skin and ((478<sx<505 and 779<sy<832) if n=='dead_1' else (424<sx<457 and 805<sy<864))
    elif n.startswith('hurt'):
     facial|=inside(sx,sy,[(cx-78,top+85),(cx+8,top+57),(cx+72,top+152),(cx+32,neck-37),(cx-68,neck-27),(cx-93,neck-88)])
    else:
     facial|=inside(sx,sy,[(cx+21,top+100),(cx+60,top+100),(cx+67,top+173),(cx+80,top+180),(cx+80,neck-64),(cx+54,neck-25),(cx-12,neck-25),(cx-40,neck-62),(cx-43,top+192),(cx-2,top+181),(cx+10,top+157)])
    if n not in ('dead_1','dead_2'):
     facial|=skin and cx-140<sx<cx-92 and neck-103<sy<neck-35
    layer='body' if facial else ('back' if sx<cx-92 else 'front');pal=BP if facial else HK
   else:layer='body';pal=BP
   col=nearest(p,pal);put(ls[layer],x,y,col)
   if ishand:
    put(ls['grip'],x,y,nearest(p,BP));put(ls['body'],x,y,nearest(p,BP))
 # Duplicate authored hand edge over the weapon hilt exactly as runtime expects.
 for y in range(g[1]-1,g[1]+2):
  for x in range(g[0]-1,g[0]+2):
   c=get(ls['grip'],x,y)
   if c[3]:put(ls['weapon'],x,y,c)
 return ls,g,t,{'sourceTop':top,'sourceNeck':neck,'sourceGround':ground,'headScale':hs,'bodyScale':bs,'headTop':ty,'sourceGrip':sg,'sourceMaceCenter':st}
def main():
 (R/'verification').mkdir(exist_ok=True)
 m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':{},'hairKeys':['#faf0d7','#e1cdb8','#b49b91','#49342f'],'characters':{},'hair':{STYLE:{'gender':'female','style':'side_bun','proportion':'p2','pivot':[0,0],'poses':{}}},'weapons':{'mace':{'frames':{CID:{}}}}}
 c={'class':'acolyte','gender':'female','bodyHeight':48,'headHeight':24,'proportion':2,'defaultWeapon':'mace','defaultHair':STYLE,'hairStyles':[STYLE],'animations':{},'frames':{}};m['characters'][CID]=c
 stats={};allframes=[]
 for action,ds in TIMES.items():
  names=[f'{action}_{i}' for i in range(len(ds))]
  a={'frames':names,'durations':ds,'duration':sum(ds),'loop':action in ('idle','walk','cast')}
  if action=='attack':a['hitFrame']=3
  if action in ('dead','sit'):a['holdLast']=True
  m['animations'][action]=a;c['animations'][action]=a
  frames=[]
  for n in names:
   source='idle_0' if n=='attack_6' else n
   ls,g,t,metric=normalize(source);ps=paths(n)
   for k,p in ps.items():save(ls[k],R/p)
   out=compose(ls);save(out,R/f'composite/{n}.png')
   frame=blank(*SIZE,BG);paste(frame,out);frames.append(frame);allframes.append((n,frame))
   c['frames'][n]={'image':ps['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if action=='dead' else 'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':ps['grip']}
   m['hair'][STYLE]['poses'][n]={'front':ps['front'],'back':ps['back'],'pivot':[0,0]};m['weapons']['mace']['frames'][CID][n]=ps['weapon']
   stats[n]={**metric,'bounds':bounds(out),'grip':g,'maceCenter':t,'layerPixels':{k:sum(p[3]>0 for p in im[2]) for k,im in ls.items()}}
  gif(frames,ds,R/f'{action}_1x.gif');gif([resize(f,512,480) for f in frames],ds,R/f'{action}_4x.gif')
  sheet=blank(min(4,len(frames))*384,math.ceil(len(frames)/4)*288,BG)
  for i,f in enumerate(frames):
   x=i%4*384;y=i//4*288;paste(sheet,resize(crop(f,(16,32,112,120)),384,352),x,y-64)
   number(sheet,x+10,y+8,i,2);number(sheet,x+50,y+8,ds[i],2)
  save(sheet,R/f'{action}_contact_sheet.png')
 sheet=blank(5*256,math.ceil(len(allframes)/5)*256,BG)
 for i,(n,f) in enumerate(allframes):
  x=i%5*256;y=i//5*256;paste(sheet,resize(f,256,240),x,y+16);number(sheet,x+8,y+4,i,2)
 save(sheet,R/'contact_sheet.png')
 pair=blank(384,120,BG)
 for i,im in enumerate([read(R.with_name('pixel-hero-r12')/'composite/idle_0.png'),read(R.with_name('pixel-knight-r15')/'composite/idle_0.png'),read(R/'composite/idle_0.png')]):paste(pair,im,i*128,0)
 save(pair,R/'comparison_1x.png');save(resize(pair,1536,480),R/'comparison_4x.png')
 dump('manifest.json',m);dump('verification/frame_metrics.json',stats);dump('spec.json',{'sourceGeometry':S,'headMasks':HEAD,'tool':'image_gen.imagegen','frameOrder':[n for n,_ in allframes],'comparisonOrder':['cookie_r12','knight_r15',CID]})
 print('Exported',len(allframes),'frames,',len(TIMES),'actions')
if __name__=='__main__':main()
