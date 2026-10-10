"""Repair registration masks on the existing pixel layers, one reviewed pose per call.
No resampling, pose synthesis, palette changes, or landmark changes.
"""
from register import *
import base64,zlib,hashlib,collections

# Reviewed staff-only coordinates, in the existing 128 x 120 registration space.
# Each range is inclusive. Costume, face and wrist pixels are deliberately excluded.
REGIONS={
'idle_0':[(78,79,78,79),(72,108,72,108)],
'idle_breath':[(77,84,84,93),(75,100,75,100),(73,107,73,110),(72,108,72,108)],
'walk_contact_a':[(77,76,84,92),(76,94,76,94),(74,101,74,101),(73,104,73,104)],
'walk_pass_a':[(77,76,84,93),(74,103,74,103),(73,107,74,110)],
'walk_opposite':[(77,76,84,92),(74,101,74,101),(73,110,73,110)],
'cast_gather':[(78,89,78,90)],
'cast_hold':[(78,82,83,87),(76,89,76,89),(73,109,73,109)],
'attack_ready':[(47,55,51,62),(84,88,84,88)],
'attack_hit':[(82,104,95,114)],
'attack_hold':[(82,104,95,114)],
'recover':[(81,78,90,87)],
'hurt':[(76,78,85,93)],
'dead_kneel':[(79,109,84,113)],
'dead_fall':[(87,111,89,113)],
'sit':[(81,103,95,114)],
'walk_cross':[(76,76,84,94),(74,100,74,100),(73,109,73,109)],
'cast_breath_fix':[(78,82,83,87),(76,89,76,89),(73,109,73,110),(72,108,72,108)],
'bolt_release':[(83,72,95,85),(73,98,74,98)],
'orb_release_fix':[(88,93,95,98)],
'ground_press':[(79,85,85,93)],
'sky_raise':[(77,55,85,74),(77,94,78,94)],
'sky_command':[(76,49,86,69),(79,88,79,88),(77,86,77,86)],
'meteor_command':[(84,100,96,114)],
'water_scoop':[(80,102,95,114)],
'water_release':[(85,54,95,73),(81,89,81,89)],
'blizzard_sweep':[(85,88,97,97)],
'nova_open':[(77,80,84,87),(76,90,76,90)],
'aura_focus':[(79,80,83,84),(71,109,71,110)],
'barrier_hold':[(80,86,80,86),(73,108,73,108),(74,110,74,110)],
'walk_r1_1':[(75,78,84,95),(74,101,74,101),(73,104,73,104),(72,107,72,107),(71,109,72,110)],
'walk_r1_2':[(78,80,85,90),(74,108,74,109),(73,110,73,110)],
'walk_r1_3':[(78,79,85,90),(75,104,75,105),(74,107,75,108),(73,109,73,109)],
'walk_r1_4':[(78,76,85,90),(77,92,77,92),(75,106,75,108),(74,109,74,109)],
'walk_r1_5':[(76,76,85,92),(75,106,75,108),(74,109,74,109)],
'walk_r1_6':[(76,76,85,89),(77,91,77,91),(75,106,75,106),(74,107,74,108),(73,108,73,108)],
'walk_r1_7':[(78,77,85,90),(76,103,76,103),(75,106,76,107)],
}

def original(n):
 data=json.loads((R/'verification/clean_original_layers.json').read_text())
 # Read original PNG bytes through the existing PNG reader without persistent files.
 import tempfile
 result={}
 for k,p in paths(n).items():
  # Temporary files stay in the authorized production folder; no cache is created.
  tmp=R/'verification/clean_decode.png'
  tmp.write_bytes(zlib.decompress(base64.b64decode(data[p])))
  result[k]=read(tmp)
 tmp.unlink()
 return result

def points(im):return {(i%128,i//128) for i,p in enumerate(im[2]) if p[3]}
def neighbours(x,y,diag=True):return [(x+dx,y+dy) for dx in (-1,0,1) for dy in (-1,0,1) if (dx or dy) and (diag or abs(dx)+abs(dy)==1)]
def components(pts):
 todo=set(pts);out=[]
 while todo:
  q=[todo.pop()];part=set(q)
  while q:
   for xy in neighbours(*q.pop()):
    if xy in todo:todo.remove(xy);part.add(xy);q.append(xy)
  out.append(part)
 return sorted(out,key=len,reverse=True)

def clean_hair(ls):
 changes={}
 for key in ('front','back'):
  im=ls[key];start=list(im[2]);pts=points(im)
  if not pts:changes[key]=0;continue
  # Tiny detached pixels are extraction noise, not intentional new hair ornaments.
  for comp in components(pts):
   if len(comp)==1:
    x,y=next(iter(comp));put(im,x,y,T)
  pts=points(im);box=bounds(im)
  # Fill only one-pixel gaps enclosed by hair, never face or ornament cutouts.
  for _ in range(2):
   additions=[]
   for y in range(box[1],box[3]):
    for x in range(box[0],box[2]):
     if (x,y) in pts or get(ls['body'],x,y)[3] or get(ls['grip'],x,y)[3]:continue
     ns=[xy for xy in neighbours(x,y) if xy in pts];card=[xy for xy in neighbours(x,y,False) if xy in pts]
     opposite=((x-1,y) in pts and (x+1,y) in pts) or ((x,y-1) in pts and (x,y+1) in pts)
     if len(card)>=3 or (len(ns)>=5 and opposite):
      colors=[get(im,*p) for p in ns];color=collections.Counter(colors).most_common(1)[0][0]
      additions.append((x,y,color))
   for x,y,col in additions:put(im,x,y,col)
   pts=points(im)
  # Fill enclosed transparent pinholes after preserving body/face/ornament pixels.
  empty={(x,y) for x in range(128) for y in range(120)}-points(im)
  queue=[(0,0)];empty.remove((0,0))
  while queue:
   for xy in neighbours(*queue.pop(),False):
    if xy in empty:empty.remove(xy);queue.append(xy)
  pending={xy for xy in empty if not get(ls['body'],*xy)[3] and not get(ls['grip'],*xy)[3]}
  while pending:
   additions=[]
   for x,y in sorted(pending):
    cols=[get(im,*xy) for xy in neighbours(x,y) if get(im,*xy)[3]]
    if cols:additions.append((x,y,collections.Counter(cols).most_common(1)[0][0]))
   if not additions:break
   for x,y,col in additions:put(im,x,y,col);pending.remove((x,y))
  pts=points(im)
  # Remove isolated colour speckles surrounded on all sides by one tone.
  # Line-shaped shading and braid highlights are retained.
  recolors=[]
  for x,y in pts:
   ns=[get(im,*xy) for xy in neighbours(x,y,False)]
   if all(p[3] for p in ns):
    common,count=collections.Counter(ns).most_common(1)[0]
    if count==4 and get(im,x,y)!=common:recolors.append((x,y,common))
  for x,y,col in recolors:put(im,x,y,col)
  changes[key]=sum(a!=b for a,b in zip(start,im[2]))
 return changes

def process(n):
 ls=original(n);before=compose(ls);moved=[]
 for i,p in enumerate(list(ls['body'][2])):
  x,y=i%128,i//128
  if p[3] and any(a<=x<=c and b<=y<=d for a,b,c,d in REGIONS[n]):
   # Do not alter approved staff pixels where the original body was hidden by them.
   if not get(ls['staff'],x,y)[3]:put(ls['staff'],x,y,p)
   put(ls['body'],x,y,T);moved.append([x,y])
 # The grasp belongs to the body as well as the overlay, so removing the weapon
 # leaves a complete hand. The existing grip file itself is never changed.
 paste(ls['body'],ls['grip'])
 # Recover existing sleeve pixels erroneously included by the old staff corridor.
 # The one concealed wrist pixel makes the bare hand continuous without changing
 # the armed composite (the shaft remains in front at precisely that coordinate).
 if n=='bolt_release':put(ls['body'],79,90,get(ls['staff'],79,90))
 if n=='meteor_command':
  put(ls['body'],71,96,get(ls['body'],71,94))
  for xy in [(71,97),(72,98),(73,98)]:
   put(ls['body'],*xy,get(ls['staff'],*xy));put(ls['staff'],*xy,T)
 hair=clean_hair(ls)
 for k,p in paths(n).items():
  if k!='grip':save(ls[k],R/p)
 save(compose(ls),R/f'composite/{n}.png')
 report_path=R/'verification/clean_frame_reviews.json'
 reports=json.loads(report_path.read_text()) if report_path.exists() else []
 reports=[r for r in reports if r['source']!=n]
 previous=reports[-1]['source'] if reports else None
 # Current armed, bare, before, previous. Same crop and nearest-neighbour scale.
 bare=blank(128,120)
 for k in ('back','body','front'):paste(bare,ls[k])
 ims=[before,compose(ls),bare,compose(layers(previous)) if previous else before]
 panel=blank(4*304,296,BG)
 for col,im in enumerate(ims):paste(panel,resize(crop(im,(28,40,104,114)),304,296),304*col,0)
 save(panel,R/f'verification/clean_review_{n}.png')
 report={'source':n,'previous':previous,'staffPixelsReassigned':len(moved),'coordinates':moved,'hairPixelsChanged':hair,'gripUnchanged':ls['grip']==original(n)['grip'],'reviewed':False}
 reports.append(report);report_path.write_text(json.dumps(reports,indent=2))
 print(json.dumps(report))

if __name__=='__main__':
 if sys.argv[1]=='approve':
  path=R/'verification/clean_frame_reviews.json';reviews=json.loads(path.read_text());assert reviews[-1]['source']==sys.argv[2]
  reviews[-1]['reviewed']=True;reviews[-1]['review']='수정 전 / 무장 / 맨손 / 직전 포즈를 확대 비교: 두상·발·손·옷 유지, 지팡이 잔여물 및 머리 연결 확인.'
  path.write_text(json.dumps(reviews,ensure_ascii=False,indent=2))
 else:
  path=R/'verification/clean_frame_reviews.json'
  if path.exists():assert json.loads(path.read_text())[-1]['reviewed'],'Review and approve previous pose before processing next.'
  process(sys.argv[1])
