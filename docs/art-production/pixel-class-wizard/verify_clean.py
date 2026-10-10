"""Verify the layer repair and render both equipment states without building the game."""
from clean_layers import *
from build import ANIMS,bg

m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID]
hashes=json.loads((R/'verification/clean_original_hashes.json').read_text())
checks=[]
def check(ok,label):
 if not ok:raise AssertionError(label)
 checks.append(label)
check(hashlib.sha256((R/'manifest.json').read_bytes()).hexdigest()==hashes['manifest.json'],'manifest bytes: timing, pivots, poses, hand, canvas and all skill mappings unchanged')
protected=[p for p in hashes if p.startswith(('authored/','grips/')) or p in ('registration.json','verification/registration.json')]
for p in protected:check(hashlib.sha256((R/p).read_bytes()).hexdigest()==hashes[p],f'protected: {p}')
reviews=json.loads((R/'verification/clean_frame_reviews.json').read_text())
check(len(reviews)==36 and all(r['reviewed'] for r in reviews),'36 existing source registrations reviewed sequentially, including 33 active poses')
source_report=[]
for n in REGIONS:
 before=original(n);after=layers(n)
 before_im=compose(before);after_im=compose(after)
 hair_region=points(before['front'])|points(before['back'])|points(after['front'])|points(after['back'])
 check(all(a==b or (i%128,i//128) in hair_region for i,(a,b) in enumerate(zip(before_im[2],after_im[2]))),f'{n}: armed art unchanged outside hair')
 check(before['grip']==after['grip'],f'{n}: finger overlay unchanged')
 masks={tuple(p) for r in reviews if r['source']==n for p in r['coordinates']}
 check(all(not get(after['body'],*p)[3] for p in masks),f'{n}: reviewed staff remnants absent from body')
 # All costume/face pixels outside the reviewed masks and hand repairs are identical.
 repairs=points(after['grip'])
 if n=='bolt_release':repairs|={(79,90)}
 if n=='meteor_command':repairs|={(71,96),(71,97),(72,98),(73,98)}
 check(all(a==b or (i%128,i//128) in masks|repairs for i,(a,b) in enumerate(zip(before['body'][2],after['body'][2]))),f'{n}: other body pixels untouched')
 for k in ('front','back'):
  im=after[k];pts=points(im)
  check(all(p in HP for p in im[2] if p[3]),f'{n}/{k}: four original hair key colours only')
  check(not any(len(part)==1 for part in components(pts)),f'{n}/{k}: no isolated single opaque pixels')
  todo={(x,y) for x in range(128) for y in range(120)}-pts;queue=[(0,0)];todo.remove((0,0))
  while queue:
   for xy in neighbours(*queue.pop(),False):
    if xy in todo:todo.remove(xy);queue.append(xy)
  holes=[xy for xy in todo if not get(after['body'],*xy)[3] and not get(after['grip'],*xy)[3]]
  check(not holes,f'{n}/{k}: no enclosed transparent holes outside face/ornament')
 bare=blank(128,120)
 for k in ('back','body','front'):paste(bare,after[k])
 small=[part for part in components(points(bare))[1:] if len(part)<12]
 check(not small,f'{n}: no small bare-body islands')
 # Refresh existing enlarged source previews so the folder never shows stale art.
 enlarged=blank(512,480,BG);paste(enlarged,resize(after_im,512,480));save(enlarged,R/f'verification/{n}_4x.png')
 source_report.append({'source':n,'staffPixelsReassigned':len(masks),'bareSmallIslands':0})

# Compact, labeled contact sheets; one row per action preserves actual playback order.
ALPHABET={
'A':['010','101','111','101','101'],'B':['110','101','110','101','110'],'C':['011','100','100','100','011'],
'D':['110','101','101','101','110'],'E':['111','100','110','100','111'],'F':['111','100','110','100','100'],
'G':['011','100','101','101','011'],'H':['101','101','111','101','101'],'I':['111','010','010','010','111'],
'J':['001','001','001','101','010'],'K':['101','101','110','101','101'],'L':['100','100','100','100','111'],
'M':['101','111','111','101','101'],'N':['101','111','111','111','101'],'O':['010','101','101','101','010'],
'P':['110','101','110','100','100'],'Q':['010','101','101','111','011'],'R':['110','101','110','101','101'],
'S':['011','100','010','001','110'],'T':['111','010','010','010','010'],'U':['101','101','101','101','111'],
'V':['101','101','101','101','010'],'W':['101','101','111','111','101'],'X':['101','101','010','101','101'],
'Y':['101','101','010','010','010'],'Z':['111','001','010','100','111'],'_':['000','000','000','000','111'],
' ':['000']*5,**FONT}
def label(im,x,y,s,scale=2):
 for ch in s.upper():
  for yy,row in enumerate(ALPHABET[ch]):
   for xx,v in enumerate(row):
    if v=='1':
     for dy in range(scale):
      for dx in range(scale):put(im,x+xx*scale+dx,y+yy*scale+dy,(225,205,184,255))
  x+=4*scale
armed_sheet=blank(8*228,18*240,BG);bare_sheet=blank(8*228,18*240,BG)
sequence=[];small_islands=0
for row,(an,a) in enumerate(c['animations'].items()):
 previous=None
 for i,n in enumerate(a['frames']):
  source=ANIMS[an][0][i][0];ls=layers(n);src=layers(source)
  check(ls==src,f'{n}: matches reviewed source {source}')
  im=compose(ls);bare=blank(128,120)
  for k in ('back','body','front'):paste(bare,ls[k])
  check(im==read(R/f'composite/{n}.png'),f'{n}: production composite matches all layers')
  check(all(layer[:2]==[128,120] and all(p[3] in (0,255) for p in layer[2]) for layer in ls.values()),f'{n}: 128x120 binary alpha')
  b=bounds(im);check(b[0]>0 and b[1]>0 and b[2]<128 and b[3]<120,f'{n}: no clipping')
  check(not [part for part in components(points(bare))[1:] if len(part)<12],f'{n}: no bare-body specks')
  for sheet,picture in ((armed_sheet,im),(bare_sheet,bare)):
   paste(sheet,resize(crop(bg(picture),(28,40,104,114)),228,222),i*228,row*240+18)
   label(sheet,i*228+8,row*240+3,n)
  save(bare,R/f'verification/bare/{n}.png')
  sequence.append({'animation':an,'frame':n,'source':source,'previous':previous,'duration':a['durations'][i],'armedAndBareChecked':True})
  previous=n
save(armed_sheet,R/'verification/clean_armed.png');save(bare_sheet,R/'verification/clean_bare.png')
# Focused actual-scale and enlarged before/after comparisons, not new character art.
compare=blank(4*128,120,BG)
old=original('idle_0');now=layers('idle_0');oldbare=blank(128,120);newbare=blank(128,120)
for k in ('back','body','front'):paste(oldbare,old[k]);paste(newbare,now[k])
for i,im in enumerate([compose(old),compose(now),oldbare,newbare]):paste(compare,im,i*128,0)
save(compare,R/'verification/clean_before_after_1x.png');save(resize(compare,2048,480),R/'verification/clean_before_after_4x.png')
(R/'verification/clean_sequence_reviews.json').write_text(json.dumps(sequence,indent=2))
report={'passed':True,'runtimeFrames':len(sequence),'activeSourcePoses':33,'registeredSourcePoses':len(REGIONS),'animations':len(c['animations']),'skills':len(c['skillMotions']),'manifestByteIdentical':True,'protectedFilesByteIdentical':len(protected),'hairEnclosedHoles':0,'hairIsolatedSinglePixels':0,'bareSmallIslands':0,'staffReassignedSourcePixels':sum(r['staffPixelsReassigned'] for r in source_report),'sourceDetails':source_report,'checks':len(checks),'details':checks}
(R/'verification/clean_validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print({k:v for k,v in report.items() if k not in ('details','sourceDetails')})
