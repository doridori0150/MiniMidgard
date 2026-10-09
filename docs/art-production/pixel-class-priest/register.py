"""Nearest-neighbour registration and semantic separation of imagegen originals.
No procedural character drawing or generated intermediate poses.
"""
from raster import *
import json, math, sys
R=Path(__file__).resolve().parent
CID='priest_female_p2'; HAIR='priest_crown_braid_p2'; BG=(36,49,61,255)
HK=['faf0d7','e1cdb8','b49b91','49342f']
HP=[tuple(bytes.fromhex(s))+(255,) for s in HK]
BP=[tuple(bytes.fromhex(s))+(255,) for s in ['30232c','49323e','644252','805366','a36a7d','faf0d7','e1cdb8','c4ae92','9c8277','694f4b','ffe4c0','f8c8a2','eaa180','bb765c','623f32','432c27','795139','a47449','cfaa67','f5d990','36333c','595462','898591','b9b6bc','e9e6e4','164f58','398a8f','80c6c2']]
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{HAIR}/{n}_back.png','front':f'hair/{HAIR}/{n}_front.png','mace':f'weapons/mace/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def layers(n):return {k:read(R/p) for k,p in paths(n).items()}
def compose(ls):
 out=blank(128,120)
 for k in ('back','body','mace','grip','front'):paste(out,ls[k])
 return out
def register(n,s):
 src=read(R/f'authored/{n}.png');ls={k:blank(128,120) for k in paths(n)}
 top,neck,ground=s['top'],s['neck'],s['ground'];ty=s.get('ty',64);cx=s.get('cx',640);tx=s.get('tx',64)
 hs=s['scale'] if 'scale' in s else 24/(neck-top)
 bs=s['scale'] if 'scale' in s else (112-ty-24)/(ground-neck)
 def pt(p):return [round((p[0]-cx)*hs+tx),round(ty+(p[1]-top)*hs if p[1]<=neck else ty+24+(p[1]-neck)*bs)]
 def srcpt(x,y):return round(cx+(x+.5-tx)/hs),round(top+(y+.5-ty)/hs if y+.5<ty+24 else neck+(y+.5-ty-24)/bs)
 g=pt(s['grip']);t=pt(s['tip']);sg=s['grip'];st=s['tip'];vx=st[0]-sg[0];vy=st[1]-sg[1];length=math.hypot(vx,vy);ux=vx/length;uy=vy/length
 hp=s.get('hair',[(cx-320,top-2),(cx+240,top-2),(cx+240,neck),(cx-320,neck)])
 fp=s.get('face',[(cx-100,top+190),(cx+175,top+180),(cx+175,neck),(cx-100,neck)])
 for y in range(120):
  for x in range(128):
   sx,sy=srcpt(x,y);p=get(src,sx,sy)
   if p[3]<220:continue
   skin=p[0]-p[1]>22 and p[1]-p[2]>12 and p[0]>145
   along=(sx-sg[0])*ux+(sy-sg[1])*uy;cross=abs(-(sx-sg[0])*uy+(sy-sg[1])*ux)
   hand=abs(sx-sg[0])<s.get('handRadius',38) and abs(sy-sg[1])<s.get('handRadius',38) and skin
   weapon=(along>-37 and along<length and cross<32) or math.dist((sx,sy),st)<s.get('maceRadius',82)
   weapon|=any(inside(sx,sy,q) for q in s.get('smear',[]))
   if hand:k='grip';pal=BP
   elif weapon:k='mace';pal=BP
   elif inside(sx,sy,hp):
    warm_skin=p[0]-p[1]>35 and p[1]-p[2]>22 and p[0]>145
    eye_dark=max(p[:3])<110
    eye_white=min(p[:3])>220
    facial=warm_skin or (inside(sx,sy,fp) and (eye_dark or eye_white))
    k='body' if facial else ('back' if sx<cx-155 and sy>top+220 else 'front');pal=BP if facial else HP
   else:k='body';pal=BP
   put(ls[k],x,y,nearest(p,pal))
 # Concealed continuation under the gripped fingers, for clean weapon removal.
 for yy in range(120):
  for xx in range(128):
   p=get(ls['grip'],xx,yy)
   if p[3]:put(ls['body'],xx,yy,p);put(ls['mace'],xx,yy,(105,72,49,255))
 for k,p in paths(n).items():save(ls[k],R/p)
 out=compose(ls);save(out,R/f'composite/{n}.png')
 preview=blank(512,480,BG);paste(preview,resize(out,512,480));save(preview,R/f'verification/{n}_4x.png')
 return {'grip':g,'tip':t,'headScale':hs,'bodyScale':bs,'bounds':bounds(out),'headOffset':[tx-64,ty-64]}
if __name__=='__main__':
 specs=json.loads((R/'registration.json').read_text());names=sys.argv[1:] or list(specs)
 stats=json.loads((R/'verification/registration.json').read_text()) if (R/'verification/registration.json').exists() else {}
 for n in names:stats[n]=register(n,specs[n]);print(n,stats[n])
 (R/'verification/registration.json').write_text(json.dumps(stats,indent=2))
