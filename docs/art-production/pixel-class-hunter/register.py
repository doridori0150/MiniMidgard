"""Register individually imagegen-authored poses; no procedural pose synthesis."""
from raster import *
import json, math
R=Path(__file__).resolve().parent
CID='hunter_male_p2'; HAIR='hunter_swept_crop_p2'; BG=(36,49,61,255)
HP=[tuple(bytes.fromhex(x))+(255,) for x in ['faf0d7','e1cdb8','b49b91','49342f']]
BP=HP+[tuple(bytes.fromhex(x))+(255,) for x in ['30252b','493337','624638','86533a','a7744c','ca9360','efc18a','fff0d1','ffdeb0','f4bc91','d68b70','a55651','ddd9cc','fffdf8','a5ac83','7a8957','56633e','35452f','203529','f5d58e','d1a348','735231','547a3b','294324']]
# Landmarks checked against originals: center of torso, floor, hair lower edge,
# bow grip and extremities. All coordinates refer to original generated PNG.
DATA={
'idle_0':(620,1252,820,(864,1004),(891,740),(800,1204)),
'idle_1':(620,1253,820,(864,1004),(890,740),(800,1204)),
'idle_2':(620,1251,820,(864,1004),(890,740),(800,1204)),
'walk_0':(638,1249,820,(866,1000),(890,734),(800,1180)),
'walk_1':(638,1242,825,(866,1000),(884,734),(800,1180)),
'walk_2':(642,1240,808,(868,987),(890,724),(775,1180)),
'walk_3':(636,1242,812,(868,990),(890,732),(785,1188)),
'walk_4':(634,1239,812,(865,986),(889,731),(795,1190)),
'walk_5':(626,1234,819,(869,999),(897,748),(800,1185)),
'walk_6':(627,1246,820,(865,1000),(890,747),(792,1190)),
'walk_7':(625,1247,811,(858,974),(879,735),(790,1150)),
'attack_0':(616,1250,820,(920,867),(900,540),(905,1107)),
'attack_1':(616,1251,820,(979,874),(937,550),(955,1135)),
'attack_2':(616,1251,817,(979,874),(937,551),(955,1136)),
'attack_3':(608,1225,816,(984,841),(923,510),(975,1108)),
'attack_4':(616,1226,820,(1021,847),(955,510),(989,1110)),
'attack_5':(616,1226,818,(991,939),(953,660),(958,1181)),
'attack_6':(620,1235,820,(873,1016),(886,765),(833,1210)),
'hurt_0':(642,1234,815,(877,902),(850,630),(861,1098)),
'hurt_1':(634,1233,790,(875,1003),(902,730),(818,1190)),
'dead_kneel':(628,1228,900,(908,960),(895,687),(842,1150)),
'dead_floor':(588,1154,1110,(750,1095),(1132,1070),(565,1090)),
'sit_0':(622,1246,846,(860,999),(887,721),(850,1130)),
'cast_0':(620,1248,820,(865,1001),(888,741),(800,1203)),
'cast_1':(620,1247,820,(865,1001),(888,741),(800,1203)),
'sky_draw':(623,1223,805,(1021,704),(901,382),(1039,981)),
'sky_release':(623,1220,812,(1024,702),(896,382),(1037,984)),
'power_draw_fix':(586,1226,819,(1049,823),(985,455),(1025,1125)),
'power_release':(586,1205,814,(1076,822),(1004,453),(1046,1118)),
'falcon_raise':(620,1253,820,(865,1004),(890,750),(800,1208)),
'falcon_point':(620,1252,812,(867,1007),(894,754),(800,1209)),
'scout':(620,1251,820,(864,1002),(890,748),(800,1209)),
'whistle':(620,1235,819,(878,1012),(889,765),(833,1211)),
'trap_crouch':(643,1244,879,(915,1014),(946,747),(848,1210)),
'trap_place':(641,1243,940,(923,997),(964,720),(838,1206)),
}
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{HAIR}/{n}_back.png','front':f'hair/{HAIR}/{n}_front.png','weapon':f'weapons/bow/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 o=blank(128,120)
 for k in ('back','body','weapon','grip','front'):paste(o,ls[k])
 return o

def register(n,s):
 src=read(R/f'authored/{n}.png'); cx,floor,hairbottom,g,tip,bot=s
 scale=48/889
 # Slight source framing variation is removed using measured standing height.
 if n.startswith(('idle','walk','attack','cast','falcon')) or n in ('scout','whistle','hurt_1','sky_draw','sky_release'):
  top=min(y for y in range(250,550) for x in range(250,850) if get(src,x,y)[3]>=220)
  scale=48/(floor-top)
 ls={k:blank(128,120) for k in paths(n)}
 def pt(q):return [round((q[0]-cx)*scale+64),round((q[1]-floor)*scale+112)]
 gp=pt(g)
 for y in range(120):
  sy=round((y+.5-112)/scale+floor)
  for x in range(128):
   sx=round((x+.5-64)/scale+cx);p=get(src,sx,sy)
   if p[3]<220:continue
   # Skin/cream cloth/brown glove are protected from bow extraction.
   glove=abs(sx-g[0])<67 and abs(sy-g[1])<54
   if n=='dead_floor':weapon=sy>1070 and sx>520 and not glove
   else:weapon=sx>g[0]-45 and not glove
   # Authored grey/olive string is split even where it crosses torso.
   string=(abs(p[0]-p[1])<30 and 20<p[0]<165 and -5<p[1]-p[2]<45 and sx>min(g[0]-240,tip[0]) and sy>tip[1] and sy<bot[1] and not glove)
   hair=(sy<hairbottom and p[0]>90 and 0<=p[0]-p[1]<39 and 0<=p[1]-p[2]<46)
   if n=='dead_floor':hair=hair and sx<535
   if n=='scout' and sy>600 and sx<690:hair=False
   if n=='falcon_raise' and sy>600 and sx<475:hair=False
   # Cream sleeve stays body even when raised beside head.
   if n.startswith('sky') and sx>780 and sy>690:hair=False
   if glove:kind='grip';palette=BP
   elif weapon or string:kind='weapon';palette=BP
   elif hair:kind='front';palette=HP
   else:kind='body';palette=BP
   put(ls[kind],x,y,nearest(p,palette))
 # Coverage-sample the thin AUTHORED string; nearest-center can miss subpixel lines.
 # Only neutral string pixels inside the reviewed string corridor are accepted.
 draw={'attack_1':(638,915),'attack_2':(549,850),'attack_3':(510,811),'power_draw_fix':(460,803),'sky_draw':(579,799)}
 aa=(tip[0]-25,tip[1]+40);bb=(bot[0]-25,bot[1]-20)
 segments=[(aa,draw[n]),(draw[n],bb)] if n in draw else [(aa,bb)]
 def distance(p,a,b):
  vx=b[0]-a[0];vy=b[1]-a[1];t=max(0,min(1,((p[0]-a[0])*vx+(p[1]-a[1])*vy)/(vx*vx+vy*vy)))
  return math.hypot(p[0]-a[0]-t*vx,p[1]-a[1]-t*vy)
 for y in range(120):
  sy=(y+.5-112)/scale+floor
  for x in range(128):
   sx=(x+.5-64)/scale+cx
   if min(distance((sx,sy),a,b) for a,b in segments)>24:continue
   samples=[]
   for oy in (-.4,-.2,0,.2,.4):
    for ox in (-.4,-.2,0,.2,.4):
     p=get(src,round(sx+ox/scale),round(sy+oy/scale))
     if p[3]>=220 and 60<p[0]<175 and 0<=p[0]-p[1]<22 and 0<=p[1]-p[2]<28:samples.append(p)
   if len(samples)>=3 and not get(ls['grip'],x,y)[3]:
    put(ls['weapon'],x,y,(165,172,131,255))
    # Prevent hair overlays from hiding a string crossing the fringe.
    put(ls['front'],x,y,T)
 # Underlying hand stays available for unarmed composition, grip overlays bow.
 paste(ls['body'],ls['grip'])
 # Concealed bow continuity under the extracted hand, following authored axis.
 a=pt(tip);b=pt(bot);vx=b[0]-a[0];vy=b[1]-a[1];l=math.hypot(vx,vy)
 for t in range(-2,3):put(ls['weapon'],round(gp[0]+t*vx/l),round(gp[1]+t*vy/l),(115,82,49,255))
 for k,p in paths(n).items():save(ls[k],R/p)
 final=compose(ls);save(final,R/f'composite/{n}.png')
 return {'grip':gp,'tip':pt(tip),'bounds':bounds(final),'scale':scale,'source':f'authored/{n}.png'}
if __name__=='__main__':
 (R/'verification').mkdir(exist_ok=True)
 stats={}
 for n,s in DATA.items():stats[n]=register(n,s);print(n,stats[n],flush=True)
 (R/'verification/registration.json').write_text(json.dumps(stats,indent=2))
