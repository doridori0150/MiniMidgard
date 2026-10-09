"""Register imagegen-authored poses and split layers; no procedural character drawing."""
from pathlib import Path
import json,math
from raster import *
R=Path(__file__).resolve().parent
OLD=R.with_name('pixel-knight-r15');CID='knight_female_p2';STYLE='knight_braided_bob_p2';SZ=(128,120);BG=(37,49,62,255)
BP=[tuple(bytes.fromhex(c))+(255,) for c in ['2e222b','49333b','65505a','fffdf8','fff0d1','ffe1ba','f4bc91','d68b70','a55651','583419','8c5529','e9e9ed','c4c3cf','9493a3','626274','3f4257','f5d58e','c69a58','916137','5e4140','467080','2d5365','193744','122935','dbf3ff','99cdef']]
FX=[tuple(bytes.fromhex(c))+(255,) for c in ['666079','8c86a6','aaa4c0','c5c1d8','e6e3f0','fffdf8']]
# cx, neck, ground, target neck x, head dy, source grip, tip, polygon removing generated head
SPECS={
'enchant_ready_fix':[650,879,1142,64,0,[861,887],[863,651],[(547,652),(689,648),(744,694),(762,786),(749,864),(705,884),(638,877),(576,888),(503,865),(506,784)]],
'enchant_hold_fix':[642,874,1140,64,0,[850,887],[850,652],[(544,650),(685,646),(741,692),(758,787),(744,854),(703,876),(635,874),(575,887),(501,865),(502,784)]],

'guard_hold':[640,907,1121,63,4,[688,938],[840,773],[(550,685),(690,680),(747,729),(775,830),(750,884),(691,909),(595,913),(493,893),(495,824)]],
'enchant_ready':[650,879,1142,64,0,[758,879],[762,639],[(546,650),(686,643),(733,679),(744,822),(729,886),(659,874),(577,888),(505,865),(505,786)]],
'enchant_hold':[650,875,1143,64,0,[758,886],[762,641],[(542,650),(688,643),(735,679),(744,822),(728,866),(658,875),(576,882),(503,861),(505,783)]],
'taunt_ready':[651,832,1097,63,0,[755,967],[920,1069],[(544,605),(682,599),(747,658),(779,751),(766,815),(723,839),(650,828),(576,838),(502,814),(504,736)]],
'taunt_call':[652,814,1088,63,0,[774,949],[939,1051],[(543,604),(670,594),(745,660),(771,737),(761,799),(711,816),(651,811),(573,832),(501,802),(504,727)]],
'rise_hit':[683,893,1122,68,4,[847,791],[1070,557],[(577,660),(734,653),(796,708),(824,798),(805,861),(752,881),(685,887),(598,909),(519,873),(522,791)]],
'charge_ready':[742,967,1132,66,7,[549,1010],[774,1014],[(629,745),(785,739),(852,796),(880,892),(852,960),(821,976),(742,961),(677,960),(586,944),(584,889)]] ,

'cleave_ready':[699,907,1130,64,1,[573,738],[444,608],[(607,682),(770,675),(843,728),(865,872),(832,920),(805,920),(788,897),(641,897),(601,858)]],
'cleave_hit':[704,865,1084,69,5,[804,943],[987,1068],[(582,634),(758,628),(842,675),(862,817),(836,874),(800,882),(774,851),(637,856),(543,824),(543,750)]],
'thrust_ready':[658,900,1140,62,2,[584,963],[865,984],[(550,663),(710,659),(779,719),(804,817),(779,898),(730,923),(634,892),(516,879),(517,803)]],
'thrust_hit':[685,935,1143,69,5,[837,947],[1090,947],[(596,715),(735,710),(801,758),(825,850),(797,934),(725,951),(646,927),(547,919),(547,855)]],
'throw_ready':[691,918,1134,62,1,[507,721],[736,679],[(600,704),(744,697),(809,745),(831,865),(814,912),(786,927),(669,905),(624,917),(566,854),(567,797)]],
'throw_release':[691,870,1127,68,3,[951,750],[1010,718],[(590,669),(747,664),(805,708),(836,798),(809,855),(734,878),(650,865),(573,866),(536,816),(536,773)]],
'throw_catch':[674,879,1130,66,2,[832,854],[1005,715],[(567,667),(705,660),(774,710),(801,794),(795,865),(753,886),(665,873),(590,872),(536,841),(535,787)]],
'guard_ready':[643,887,1126,63,3,[688,920],[842,752],[(553,665),(696,661),(758,732),(778,824),(743,875),(687,891),(596,898),(493,877),(495,805)]],
}
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{STYLE}/{n}_back.png','front':f'hair/{STYLE}/{n}_front.png','sword':f'weapons/sword/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def layers(n,root=R):return {k:read(root/v) for k,v in paths(n).items()}
def compose(ls,weapon='sword'):
 out=blank(*SZ)
 for k in ('back','body',weapon,'grip','front'):paste(out,ls[k])
 return out

def norm(n):
 src=read(R/f'authored/{n}.png');cx,neck,ground,tx,dy,sg,st,mask=SPECS[n];scale=(112-89-dy)/(ground-neck)
 ls={k:blank(*SZ) for k in paths(n)};ux=st[0]-sg[0];uy=st[1]-sg[1];length=math.hypot(ux,uy);ux/=length;uy/=length
 def pt(p):return [round((p[0]-cx)*scale+tx),round((p[1]-ground)*scale+112)]
 g=pt(sg);tip=pt(st);invisible=n=='throw_release'
 for y in range(120):
  sy=round((y+.5-112)/scale+ground)
  for x in range(128):
   sx=round((x+.5-tx)/scale+cx);p=get(src,sx,sy)
   if p[3]<200:continue
   along=(sx-sg[0])*ux+(sy-sg[1])*uy;cross=abs(-(sx-sg[0])*uy+(sy-sg[1])*ux)
   blade=not invisible and along>9 and cross<36
   effect=(n=='cleave_hit' and sx>886 and sy>900) or (n=='rise_hit' and ((sx>885 and sy>730) or (sx>1020 and sy>480) or (sy>1115 and sx>770)))
   if blade or effect:put(ls['sword'],x,y,nearest(p,FX if effect else BP))
   elif not inside(sx,sy,mask):put(ls['body'],x,y,nearest(p,BP))
 # Lock original face and hair at integer translation.
 for k in ('body','back','front'):
  path=paths('idle_0')[k].replace(STYLE,'braided_bob_p2');ref=read(OLD/path)
  for y in range(64,90):
   for x in range(47,80):
    p=get(ref,x,y)
    if p[3]:put(ls[k],x+tx-64,y+dy,p)
 # Authored glove over the weapon, same overlay compatible with sword and spear.
 if not invisible:
  for y in range(g[1]-2,g[1]+3):
   for x in range(g[0]-2,g[0]+3):
    p=get(ls['body'],x,y)
    if p[3]:put(ls['grip'],x,y,p)
 for k,p in paths(n).items():save(ls[k],R/p)
 save(compose(ls),R/f'composite/{n}.png')
 return {'grip':g,'tip':tip,'headOffset':[tx-64,dy],'sourceScale':scale,'visible':not invisible}
if __name__=='__main__':
 stats={}
 for n in SPECS:
  if (R/f'authored/{n}.png').exists():stats[n]=norm(n)
 (R/'verification/registration.json').write_text(json.dumps(stats,indent=2))
 sheet=blank(128*4*4,120*4*((len(stats)+3)//4),BG)
 for i,n in enumerate(stats):paste(sheet,resize(read(R/f'composite/{n}.png'),512,480),i%4*512,i//4*480);number(sheet,i%4*512+10,i//4*480+10,i,3)
 save(sheet,R/'verification/registration.png')
 print(json.dumps(stats))
