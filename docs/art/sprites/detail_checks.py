"""Inspect encoded GIF timing and prove hair tint leaves protected pixels intact."""
from PIL import Image
import json
from player import R,M,render,tint
from verify import board,paste_figure,label

out=board((1150,840),'FINAL DETAIL / 140ms CONTACT + MASKS','Contact is sampled directly by the reference player. Tint comparison includes face, eyes and armor.')
for ci,c in enumerate(M['characters']):
 for j,h in enumerate(['cream','blue','auburn']):
  paste_figure(out,render(character=c,state='attack',time_ms=140,hair=h,headgear=['leaf','hairpin']),160+j*370,400+ci*380,280)
  label(out,(30+j*370,410+ci*380),c+' / '+h)
out.save(R/'verification/contact_and_tints.png')
gif=Image.open(R/'preview_animation.gif');elapsed=0;contact_index=None;durations=[]
for i in range(gif.n_frames):
 gif.seek(i);duration=gif.info['duration'];durations.append(duration)
 if elapsed<=140<elapsed+duration:contact_index=i;gif.convert('RGB').save(R/'verification/gif_at_140ms.png')
 elapsed+=duration
assert elapsed==1600 and contact_index is not None
protected=0
for c in M['characters'].values():
 for f in c['frames'].values():
  im=Image.open(R/f['image']).convert('RGBA');mask=Image.open(R/f['hairMask']);col=tint(im,mask,[.62,.36,.23])
  for a,b,m in zip(im.getdata(),col.getdata(),mask.getdata()):
   if not m:assert a==b;protected+=1
report={'status':'PASS','gifSampleStepMs':20,'gifEncodedFrames':gif.n_frames,'gifTotalMs':elapsed,
 'gifDurationsMs':durations,'gifFrameContaining140ms':contact_index,'protectedPixelsUnchanged':protected,
 'note':'GIF encoder merges repeated identical pictures; duration, not stored frame index, determines time.'}
(R/'verification/detail_checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
