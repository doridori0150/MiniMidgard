"""Recorded, visually selected pixel cleanup. Operates on painted pixels only.
The spans below were selected from the numbered inspection sheets, not geometry
used to generate a body. Writes the fully expanded edit list for audit/replay.
"""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parent
palettes={k:[tuple(bytes.fromhex(s[1:])) for s in v] for k,v in json.loads((ROOT/'palettes.json').read_text()).items()}
regions={
 'r9a_idle':[(10,19,14,48),(20,20,14,40),(21,21,14,39),(22,22,14,37),(23,23,14,36),(24,24,14,35),(25,25,14,32),(26,35,14,30),(20,25,45,48),(26,35,46,48),(36,36,44,46)],
 'r9a_pose':[(27,33,19,52),(34,34,19,46),(35,35,19,45),(36,36,19,44),(37,37,19,43),(38,38,19,42),(39,39,19,41),(40,40,19,40),(41,41,19,38),(42,47,19,35),(48,50,30,34),(34,41,52,53),(42,50,51,53)],
 'r9b_idle':[(10,16,11,45),(17,19,11,30),(17,19,35,45),(20,23,11,29),(24,25,11,28),(26,27,11,20),(28,31,11,18),(32,35,11,26),(36,37,18,24),(20,25,36,45),(26,32,41,45),(33,34,40,45),(35,37,39,44)],
 'r9b_pose':[(27,32,24,59),(33,36,24,45),(33,36,49,60),(37,39,24,44),(40,43,24,42),(44,47,24,32),(48,50,27,39),(51,53,31,35),(37,43,51,59),(44,49,56,59),(50,53,55,57)],
 'r9c_idle':[(10,15,15,47),(16,18,15,33),(16,18,37,47),(19,22,15,33),(23,25,15,32),(26,27,15,29),(28,34,15,23),(28,31,24,28),(32,35,24,29),(36,37,21,26),(19,25,42,47),(26,31,44,47),(32,36,43,47)],
 'r9c_pose':[(25,31,26,61),(32,33,26,47),(32,33,55,62),(34,37,26,46),(38,39,26,45),(40,43,26,41),(44,46,31,39),(34,39,58,62),(40,43,60,63),(44,48,58,61)],
}
edits={}; images={}
# Narrow the crown selections so they never touch the nearby painted swoosh.
crowns={
 'r9a_pose':[(27,33,40),(28,30,43),(29,28,45),(30,27,47),(31,26,48),(32,25,49),(33,24,50)],
 'r9b_pose':[(27,41,45),(28,36,49),(29,35,52),(30,34,53),(31,33,55),(32,33,56)],
 'r9c_pose':[(25,41,45),(26,38,50),(27,37,52),(28,36,54),(29,35,55),(30,34,57),(31,33,58)],
}
for name,rows in crowns.items():
 regions[name]=[(y,y,x0,x1) for y,x0,x1 in rows]+regions[name][1:]
for name,spans in regions.items():
 key=name[2];palette=palettes[key]
 im=Image.open(ROOT/f'verification/{name}_before.png').convert('RGBA'); images[name]=im.copy(); changes={}
 def setp(x,y,index,reason):
  rgba=(0,0,0,0) if index is None else (*palette[index],255)
  if images[name].getpixel((x,y)) != rgba:
   changes[(x,y)]={'xy':[x,y],'color':index,'reason':reason};images[name].putpixel((x,y),rgba)
 # Reconcile contamination in selected hair clusters with neutral cream ramps.
 remap={0:1,6:3,7:4,8:4,9:5,11:2,12:3,13:5,23:2,24:2,25:3,26:4,29:4,30:3}
 for y0,y1,x0,x1 in spans:
  for y in range(y0,y1+1):
   for x in range(x0,x1+1):
    p=im.getpixel((x,y))
    if not p[3]:continue
    idx=palette.index(p[:3])
    if idx in remap:setp(x,y,remap[idx],'선택한 머리 영역의 피부색/잡색을 중성 크림 3단계로 정리')
    if any(im.getpixel((x+dx,y+dy))[3]==0 for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]):
     setp(x,y,1,'검수한 머리 실루엣의 끊긴 외곽색을 기존 불투명 픽셀 위에서 연결')
 edits[name]=changes

def mark(name,x,y,index,reason):
 palette=palettes[name[2]];im=images[name];rgba=(0,0,0,0) if index is None else (*palette[index],255)
 if im.getpixel((x,y))!=rgba:
  edits[name][(x,y)]={'xy':[x,y],'color':index,'reason':reason};im.putpixel((x,y),rgba)

# Exact eye catchlights selected on the numbered sheets. Keep the painted eye
# silhouette and expression; consolidate cores to compact readable clusters.
eyes={'r9a_idle':[(34,27),(43,27)],'r9a_pose':[(39,43),(47,43)],
      'r9b_idle':[(30,27),(38,28)],'r9b_pose':[(45,45),(53,45)],
      'r9c_idle':[(32,27),(41,27)],'r9c_pose':[(47,41),(55,41)]}
for name,pairs in eyes.items():
 for x,y in pairs:
  for dx,dy,c in [(0,0,13),(1,0,10),(0,1,10),(1,1,10),(0,2,12),(1,2,11)]:mark(name,x+dx,y+dy,c,'2x3 눈 중심과 1px 캐치라이트를 수동 정리')

for name,coords in {
 'r9a_idle':[(35,38),(33,38)],'r9a_pose':[(34,53),(35,53)],
 'r9b_idle':[(28,37),(35,36)],'r9b_pose':[(44,52),(42,53)],
 'r9c_idle':[(33,38),(28,36)],'r9c_pose':[(43,49),(48,48)],
}.items():
 for x,y in coords:mark(name,x,y,13,'은색 흉갑/어깨 갑옷에 불투명한 반사점 복원')

# Remove visibly isolated upper-left hair speck in B idle.
mark('r9b_idle',11,26,None,'머리 끝에서 떨어진 고립 도트 제거')
# C arc continued left beyond the sword. Trim only that generated trailing tail.
im=images['r9c_pose'];p=palettes['c']
for y in range(66,70):
 for x in range(54,78):
  pix=im.getpixel((x,y))
  if pix[3] and pix[:3] in [p[13],p[27],p[28]]:
   mark('r9c_pose',x,y,None,'칼끝을 지난 초승달 잔여 꼬리 제거')
mark('r9c_pose',57,67,None,'재검수에서 확인한 꼬리의 마지막 은백색 고립 픽셀 제거')

# Cool bright rims, no dirty tunic-blue pixel in A swoosh.
im=images['r9a_pose'];p=palettes['a']
for y in range(16,70):
 for x in range(18,80):
  if y<27 or x>55:
   pix=im.getpixel((x,y))
   if pix[3] and pix[:3] in [p[15],p[16]]:
    mark('r9a_pose',x,y,27,'검격 호의 어두운 청색 잡색을 밝은 얼음색 테두리로 통일')

out={name:list(changes.values()) for name,changes in edits.items()}
(ROOT/'pixel_edits.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(ROOT/'verification/hair_selection_spans.json').write_text(json.dumps(regions,indent=2)+'\n')
print({name:len(changes) for name,changes in out.items()})
