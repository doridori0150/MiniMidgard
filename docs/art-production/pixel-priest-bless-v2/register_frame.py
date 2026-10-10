"""Deterministic export of imagegen arm patch; approved head/lower body locked."""
from raster import *
import sys,json,math,shutil
R=Path(__file__).resolve().parent
S=R.parent/'pixel-class-priest'
CID='priest_female_p2';HID='priest_crown_braid_p2'
BP=[tuple(bytes.fromhex(s))+(255,) for s in ['30232c','49323e','644252','805366','a36a7d','faf0d7','e1cdb8','c4ae92','9c8277','694f4b','ffe4c0','f8c8a2','eaa180','bb765c','623f32','432c27','795139','a47449','cfaa67','f5d990','36333c','595462','898591','b9b6bc','e9e6e4','164f58','398a8f','80c6c2']]
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{HID}/{n}_back.png','front':f'hair/{HID}/{n}_front.png','mace':f'weapons/mace/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def compose(ls):
 o=blank(128,120)
 for k in ['back','body','mace','grip','front']:paste(o,ls[k])
 return o
def run(i):
 n=f'skill_bless_{i}';spec=json.loads((R/'registration.json').read_text())[str(i)]
 raw=read(R/f'authored/{n}.png');ls={k:read(S/p) for k,p in paths('skill_bless_0').items()}
 ls['grip']=blank(128,120);ls['mace']=blank(128,120)
 # Head, hair, boots, hem remain exact approved pixels. Only arm/torso patch changes.
 for y in range(88,101):
  for x in range(40,90):put(ls['body'],x,y,T)
 scale=48/550
 cx,top=spec['cx'],spec['top']
 for y in range(88,112):
  for x in range(40,90):
   sx=round(cx+(x+.5-64)/scale);sy=round(top+(y+.5-64)/scale);p=get(raw,sx,sy)
   if p[3]<220:continue
   weapon=inside(sx,sy,spec['weapon'])
   hand=inside(sx,sy,spec['hands']) and p[0]-p[1]>22 and p[1]-p[2]>12 and p[0]>145
   if hand:put(ls['grip'],x,y,nearest(p,BP));put(ls['body'],x,y,nearest(p,BP))
   elif weapon:put(ls['mace'],x,y,nearest(p,BP))
   elif y<101:put(ls['body'],x,y,nearest(p,BP))
 for k,p in paths(n).items():save(ls[k],R/p)
 out=compose(ls);save(out,R/f'composite/{n}.png')
 prev=read(R/f'composite/skill_bless_{i-1}.png');sheet=blank(1024,480,(36,49,61,255));paste(sheet,resize(prev,512,480));paste(sheet,resize(out,512,480),512,0);save(sheet,R/f'verification/transition_{i-1}_{i}.png')
 grid(out,R/f'verification/{n}_grid.png')
 print(n,'bounds',bounds(out),'uniform scale',scale)
if __name__=='__main__':run(int(sys.argv[1]))
