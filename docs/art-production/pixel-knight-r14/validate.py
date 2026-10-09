"""Validate exported R14 and hash preservation against R13 (read only)."""
from build import *
import hashlib
m=json.loads((R/'manifest.json').read_text());old=json.loads((OLD/'manifest.json').read_text())
c=m['characters'][CID];checks=[];preserved=[];report={}
def ck(v,label):
 if not v:raise AssertionError(label)
 checks.append(label)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
ck(m['schema']=='minimidgard.pixel/1','schema')
ck(m['canvas']==old['canvas'],'unchanged canvas/origin')
ck(c['animations']==m['animations'],'animation tables agree')
ck(len(c['frames'])==26,'26 total frames')
ck(m['animations']['attack']['hitFrame']==3,'contact hitFrame 3')
ck(m['animations']['attack']['durations']==TIMES,'planned timing')
ck(m['animations']['attack']['duration']==560,'560ms')
for a,anim in old['animations'].items():
 if a=='attack':continue
 ck(m['animations'][a]==anim,'unchanged animation '+a)
 for n in anim['frames']:
  ck(c['frames'][n]==old['characters'][CID]['frames'][n],'unchanged frame metadata '+n)
  ck(m['hair'][STYLE]['poses'][n]==old['hair'][STYLE]['poses'][n],'unchanged hair metadata '+n)
  ck(m['weapons']['sword']['frames'][CID][n]==old['weapons']['sword']['frames'][CID][n],'unchanged weapon metadata '+n)
  for p in list(paths(n).values())+[f'composite/{n}.png']:
   ck(sha(R/p)==sha(OLD/p),'unchanged pixels '+p);preserved.append(p)
 for suffix in ('1x.gif','4x.gif','contact_sheet.png'):
  p=f'{a}_{suffix}';ck(sha(R/p)==sha(OLD/p),'unchanged preview '+p);preserved.append(p)
for n,f in c['frames'].items():
 ls={k:read(R/p) for k,p in paths(n).items()}
 for k,im in ls.items():
  ck(im[:2]==list(SIZE),'dimensions '+n+'/'+k)
  ck(all(p[3] in (0,255) for p in im[2]),'binary alpha '+n+'/'+k)
  ck(bool(bounds(im)),'nonempty '+n+'/'+k)
  if k in ('front','back'):ck({p for p in im[2] if p[3]}<=set(HK),'hair palette '+n+'/'+k)
  else:ck(not(set(im[2])&set(HK)),'no hair-key contamination '+n+'/'+k)
 im=compose(ls);ck(im==read(R/f'composite/{n}.png'),'layer reconstruction '+n)
 b=bounds(im);ck(0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,'no canvas clipping '+n)
 g=f['weapon']['gripPoint'];t=f['weapon']['tipPoint']
 ck(20<=math.dist(g,t)<=22,'blade reach '+n)
 ck(f['weapon']['hand']=='near','same declared hand '+n)
 ck(any(a[3] and b[3] and d[3] for a,b,d in zip(ls['body'][2],ls['weapon'][2],ls['grip'][2])),'glove-hilt overlap '+n)
 figure=blank(*SIZE)
 for k in ('back','body','front'):paste(figure,ls[k])
 pts={(i%128,i//128) for i,p in enumerate(figure[2]) if p[3]};components=[]
 while pts:
  q=[pts.pop()];count=0
  while q:
   x,y=q.pop();count+=1
   for dx in (-1,0,1):
    for dy in (-1,0,1):
     p=(x+dx,y+dy)
     if p in pts:pts.remove(p);q.append(p)
  components.append(count)
 if n.startswith('attack_') and n!='attack_6':ck(len(components)==1,'connected body and head '+n)
 if n=='attack_6':ck(sorted(components,reverse=True)==report['idle_0']['components'],'idle return retains original component topology')
 report[n]={'bounds':b,'components':sorted(components,reverse=True),'sha256':sha(R/f'composite/{n}.png')}
for k,p in paths('attack_6').items():ck(read(R/p)==read(OLD/paths('idle_0')[k]),'exact idle return '+k)
metrics=json.loads((R/'verification/attack_metrics.json').read_text())
for i in range(6):
 n=f'attack_{i}';dx,dy=metrics[n]['headOffset']
 for k in ('front','back'):
  shifted=blank(*SIZE);paste(shifted,read(OLD/paths('idle_0')[k]),dx,dy)
  ck(read(R/paths(n)[k])==shifted,'fixed approved hair '+n+'/'+k)
 ck(bounds(read(R/f'composite/{n}.png'))[3]==112,'ground line '+n)
for i in (1,2,3,4):ck(c['frames'][f'attack_{i}']['weapon']['angleDegrees']==0,'horizontal thrust '+str(i))
reach=[c['frames'][f'attack_{i}']['weapon']['tipPoint'][0] for i in range(7)]
ck(reach.index(max(reach))==3,'max reach is contact frame')
decoded=json.loads((R/'verification/gif_decode.json').read_text());ck(len(decoded)==13,'13 independently decoded GIFs')
for f in decoded:
 if f['file']=='attack_r13_vs_r14.gif':
  ck(round(sum(f['durations']))==560,'comparison preserves real timing')
  ck(all(x==[768,360] for x in f['sizes']),'comparison size');continue
 a,scale=f['file'].removesuffix('.gif').split('_');anim=m['animations'][a]
 ck(f['frames']==len(anim['frames']),'GIF frame count '+f['file'])
 ck(all(abs(x-y)<.01 for x,y in zip(f['durations'],anim['durations'])),'GIF timings '+f['file'])
 ck(all(x==([128,120] if scale=='1x' else [512,480]) for x in f['sizes']),'GIF size '+f['file'])
with zipfile.ZipFile(R/f'{CID}_runtime.zip') as z:
 ck(json.loads(z.read('manifest.json'))==m,'runtime zip manifest')
 for n in c['frames']:
  for p in paths(n).values():ck(z.read(p)==(R/p).read_bytes(),'runtime zip asset '+p)
ck(not (R/'source').exists(),'no copied R13 source directory')
dump('verification/validation.json',{'passed':True,'checksPassed':len(checks),'nonAttackFilesPreserved':len(preserved),'preservedFiles':preserved,'frames':report,'attackTipX':reach,'limitations':'GIF는 Apple ImageIO로 디코딩 검사. 페이지는 직접 열었으나 브라우저 미지원으로 실시간 GIF 재생 검수는 못 했으며 첨부 분해표를 시각 참고. 게임 적용 범위 아님.'})
print(json.dumps({'passed':True,'checksPassed':len(checks),'nonAttackFilesPreserved':len(preserved)},ensure_ascii=False))
