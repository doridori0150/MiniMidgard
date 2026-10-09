from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent
f=ImageFont.truetype('/Library/Fonts/Lato-Regular.ttf',18)
review={}
for n,k in [('idle',4),('walk',8),('attack',8)]:
 out=Image.new('RGB',(432*4,400*((k+3)//4)),'white');d=ImageDraw.Draw(out);frames=[]
 for i in range(k):
  im=Image.open(p/f'frames/{n}_{i+1:02}_3x.png');out.paste(im,((i%4)*432,(i//4)*400),im);d.text(((i%4)*432+12,(i//4)*400+370),f'{n} {i+1}',font=f,fill='black')
  small=Image.open(p/f'frames/{n}_{i+1:02}_1x.png');assert small.mode=='RGBA' and small.size==(144,120)
  b=small.getchannel('A').point(lambda v:255 if v>64 else 0).getbbox(); assert b and b[0]>0 and b[2]<144 and b[1]>0 and b[3]<120
  frames.append({'frame':i+1,'alpha64Bounds1x':b,'sha256':hashlib.sha256((p/f'frames/{n}_{i+1:02}_1x.png').read_bytes()).hexdigest()})
 out.save(p/f'sources/{n}_qa.png');review[n]=frames
assert len(list((p/'frames').glob('*_1x.png')))==20
assert len(list((p/'frames').glob('*_3x.png')))==20
for n in ['r7_idle.png','r7_walk.png','r7_attack.png','r7_idle.gif','r7_walk.gif','r7_attack.gif','r7_compare_walk.png','FRAMES.json','PROMPTS.json','NOTES.md']: assert (p/n).exists(),n
review['walkMeasuredCrownDisplacementRelativeToFrame1Px']=[x['alpha64Bounds1x'][1]-review['walk'][0]['alpha64Bounds1x'][1] for x in review['walk']]
review['walkExpectedCrownDisplacementPx']=[0,2,0,-1.5,0,2,0,-1.5]
review['strictPoseTableMatch']=False
review['reason']='Generated pose approximation remains: walk 2 down bob is about 4 px instead of 2 px; angles and secondary-motion lag are not quantitatively locked. See NOTES.md.'
(p/'VISUAL_REVIEW.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
print('20 poses / 40 RGBA PNGs; all required outputs present; no clipping at alpha > 64. Strict pose match remains false.')
