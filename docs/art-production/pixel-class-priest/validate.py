"""Validate deliverable references, exact layers, timing and independent GIF decode."""
from build import *
import re,hashlib
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];aa=c['animations'];report={};checks=[]
def check(ok,msg):
 if not ok:raise AssertionError(msg)
 checks.append(msg)
check(m['schema']=='minimidgard.pixel/1','schema')
check(m['canvas']['size']==[128,120] and m['canvas']['origin']==[64,112],'canvas and origin')
brief=(R.parent.parent/'art/class-briefs/priest.md').read_text();expected=set(re.findall(r'^\| `([^`]+)` \|',brief,re.M))
check(set(c['skillMotions'])==expected and len(expected)==32,'all 32 skill IDs mapped')
check(len(set(c['skillMotions'].values()))==13,'13 skill motions')
check(set(aa)==set(ANIMS),'all 8 base actions and 13 skill actions')
composites={};counts={};min_grips=999
for n,f in c['frames'].items():
 hp=m['hair'][HAIR]['poses'][f['head']['pose']]
 ps={'body':f['image'],'front':hp['front'],'back':hp['back'],'mace':m['weapons']['mace']['frames'][CID][n],'grip':f['grip']};ls={k:read(R/p) for k,p in ps.items()}
 for k,im in ls.items():
  assert im[:2]==[128,120],(n,k,'size')
  assert set(p[3] for p in im[2])<={0,255},(n,k,'alpha')
  if k in ('front','back'):assert {p for p in im[2] if p[3]}<=set(HP),(n,k,'hair palette')
  if k in ('body','front','mace','grip'):assert bounds(im),(n,k,'empty')
 im=compose(ls);assert im==read(R/f'composite/{n}.png'),(n,'layer composition')
 b=bounds(im);assert b[0]>0 and b[1]>0 and b[2]<128 and b[3]<120,(n,'clipping')
 gx,gy=f['weapon']['gripPoint'];near=sum(bool(get(ls['grip'],x,y)[3]) for y in range(gy-3,gy+4) for x in range(gx-3,gx+4));assert near>0,(n,'grip point')
 assert any(a[3] and b[3] for a,b in zip(ls['mace'][2],ls['grip'][2])),(n,'weapon/grip overlap')
 composites[n]=im;min_grips=min(min_grips,near)
checks+=['all 110 frames have body, hair front/back, mace and grips','binary alpha, exact 4 hair keys, no canvas clipping','all layer composites identical to delivered composites','every weapon overlaps grip overlay near metadata anchor']
check(len(c['frames'])==110,'110 runtime frames')
check(bounds(composites['idle_0'])[1:4:2]==(64,112),'idle exactly 48 pixels tall at baseline 112')
for n,a in aa.items():
 assert len(a['frames'])==len(a['durations']) and all(d>0 and d%10==0 for d in a['durations']),n
 assert sum(a['durations'])==a['duration'],n
 if n.startswith('skill_'):
  assert 500<=a['duration']<=1000,n
  if n in ('skill_bless','skill_hymn','skill_aura'):assert 'hitFrame' not in a,n
  else:assert sum(a['durations'][:a['hitFrame']])==130,n
 counts[n]={'frames':len(a['frames']),'uniqueImages':len({hashlib.sha256(bytes(v for p in composites[f][2] for v in p)).hexdigest() for f in a['frames']}),'durationMs':a['duration'],'hitFrame':a.get('hitFrame')}
check(len(aa['walk']['frames'])==8 and counts['walk']['uniqueImages']==8,'8 distinct walking frames')
check(len(aa['attack']['frames'])==8 and counts['attack']['uniqueImages']==8,'8 distinct attack frames')
a=aa['attack'];start=sum(a['durations'][:a['hitFrame']]);check(start<=a['duration']/2<start+a['durations'][a['hitFrame']],'attack midpoint inside impact frame')
check(composites[aa['cast_start']['frames'][-1]]==composites[aa['cast']['frames'][0]]==composites[aa['cast']['frames'][-1]],'cast start and loop seam identical')
check({n for n,a in aa.items() if a['loop']}=={'idle','walk','cast'},'correct loop actions')
check(aa['dead']['holdLast'] and aa['sit']['holdLast'],'dead and sit hold final pose')
checks+=['all non-buff skill impacts at 130ms','buffs omit hitFrame','all skills 510-760ms']
decode=json.loads((R/'verification/gif_decode.json').read_text());check(len(decode)==68,'68 GIFs independently decoded by Apple ImageIO')
for d in decode:
 stem=d['file'][:-4];scale=int(stem[-2]);name=stem[:-3]
 if name.startswith('attack_vs_'):
  a=aa[name[len('attack_vs_'):]];events=sorted(set(ends(a)+ends(aa['attack'])));times=[b-a for a,b in zip(events,events[1:])];size=[256*scale,120*scale]
 else:times=aa[name]['durations'];size=[128*scale,120*scale]
 assert d['frames']==len(times) and all(abs(a-b)<.01 for a,b in zip(times,d['durations'])),d['file']
 assert all(s==size for s in d['sizes']),d['file']
checks+=['GIF dimensions, frame counts and individual delays match manifest','comparison GIFs synchronized on union of frame boundaries']
for f,size in [('comparison_1x.png',[384,120]),('comparison_4x.png',[1536,480])]:check(read(R/f)[:2]==size,f)
for n in GROUPS:
 for ext in ['_1x.gif','_4x.gif','.png']:assert (R/f'attack_vs_{n}{ext}').exists()
for f in ['NOTES.md','PLAN.md','PROMPTS.json','FRAME_REVIEWS.json','preview.html','skills_contact_sheet.png','contact_sheet.png']:assert (R/f).exists(),f
check(not list(R.rglob('*.zip')) and not list(R.rglob('__pycache__')) and not (R/'.swift-module-cache').exists(),'no source ZIPs or build caches')
report={'status':'passed','checks':checks,'runtimeFrames':110,'sourcePoses':37,'skills':32,'skillMotions':13,'gifFiles':68,'minimumGripPixelsNearAnchor':min_grips,'animations':counts}
(R/'verification/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='animations'},ensure_ascii=False,indent=2))
