"""R15 asset integrity, preservation and decoded GIF validation."""
from build import *
import hashlib
m=json.loads((R/'manifest.json').read_text());old=json.loads((OLD/'manifest.json').read_text())
c=m['characters'][CID];checks=[];preserved=[];report={}
def ck(v,label):
 if not v:raise AssertionError(label)
 checks.append(label)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
ck(m['schema']=='minimidgard.pixel/1','schema unchanged')
ck(m['canvas']==old['canvas'],'canvas and origin unchanged')
ck(c['animations']==m['animations'],'animation tables agree')
ck(len(c['frames'])==27,'27 total frames')
ck(m['animations']['attack']['hitFrame']==3,'hit on landing smear frame 3')
ck(m['animations']['attack']['durations']==TIMES,'planned timing')
ck(m['animations']['attack']['duration']==660,'660ms total')
ck(not m['animations']['attack']['loop'],'runtime attack does not loop')
for k,v in old['characters'][CID].items():
 if k not in ('frames','animations'):ck(c[k]==v,'unchanged character '+k)
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
 ck(20<=math.dist(g,t)<=22,'declared blade reach '+n)
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
 report[n]={'bounds':b,'bodyBounds':bounds(figure),'bodyComponents':sorted(components,reverse=True),'sha256':sha(R/f'composite/{n}.png')}
for k,p in paths('attack_7').items():ck(read(R/p)==read(OLD/paths('idle_0')[k]),'exact idle return '+k)
metrics=json.loads((R/'verification/attack_metrics.json').read_text())
for i in range(7):
 n=f'attack_{i}';dx,dy=metrics[n]['headOffset']
 for k in ('front','back'):
  shifted=blank(*SIZE);paste(shifted,read(OLD/paths('idle_0')[k]),dx,dy)
  ck(read(R/paths(n)[k])==shifted,'fixed approved hair '+n+'/'+k)
 ck(report[n]['bodyBounds'][3]==112,'feet ground line '+n)
ck(metrics['attack_3']['bounds'][2]>metrics['attack_2']['bounds'][2],'smear lands farther forward')
ck(metrics['attack_3']['bounds'][3]>metrics['attack_2']['bounds'][3],'smear lands lower')
ck(metrics['attack_5']['headOffset'][1]>=8,'deep low held posture')
ck(TIMES[4]+TIMES[5]>TIMES[2]+TIMES[3],'hold longer than sweep')
ck(all(c['frames'][f'attack_{i}']['weapon']['tipPoint'][0]<c['frames'][f'attack_{i}']['weapon']['gripPoint'][0] for i in (0,1)),'blade behind in windup')
ck(all(c['frames'][f'attack_{i}']['weapon']['tipPoint'][1]>c['frames'][f'attack_{i}']['weapon']['gripPoint'][1] for i in (2,3,4,5,6)),'blade forward-down through cut and recovery')
# Independent Apple ImageIO decoding verifies exported streams, not only manifest.
decoded=json.loads((R/'verification/gif_decode.json').read_text());ck(len(decoded)==13,'13 independently decoded GIFs')
for f in decoded:
 if f['file']=='attack_r14_vs_r15.gif':
  ck(round(sum(f['durations']))==660,'comparison actual timing')
  ck(all(x==[1024,420] for x in f['sizes']),'comparison dimensions');continue
 a,scale=f['file'].removesuffix('.gif').split('_');anim=m['animations'][a]
 ck(f['frames']==len(anim['frames']),'GIF frame count '+f['file'])
 ck(all(abs(x-y)<.01 for x,y in zip(f['durations'],anim['durations'])),'GIF timing '+f['file'])
 ck(all(x==([128,120] if scale=='1x' else [512,480]) for x in f['sizes']),'GIF dimensions '+f['file'])
for p,h in json.loads((R/'verification/r14_before_hashes.json').read_text()).items():
 ck(sha(OLD/p)==h,'R14 source untouched '+p)
ck(not (R/'generated').exists() and not (R/'normalized').exists(),'excluded directories absent')
ck(not list(R.glob('*.zip')),'no zip copied or generated')
ck(len(json.loads((R/'PROMPTS.json').read_text()))==8,'7 adopted frames plus 1 rejected hand attempt documented')
dump('verification/validation.json',{'passed':True,'checksPassed':len(checks),'nonAttackFilesPreserved':len(preserved),'preservedFiles':preserved,'frames':report,'hitWindowMs':[270,310],'totalMs':660,'sourcePreserved':True,'limitations':'제공된 실제 RO 프레임 분해표로 시각 참고. 렌더러 웹 접근 실패 및 연결 브라우저 없음. GIF는 Apple ImageIO로 독립 디코딩, 접촉 시트로 시각 검수. 게임 적용 범위 아님.'})
print(json.dumps({'passed':True,'checksPassed':len(checks),'nonAttackFilesPreserved':len(preserved)},ensure_ascii=False))
