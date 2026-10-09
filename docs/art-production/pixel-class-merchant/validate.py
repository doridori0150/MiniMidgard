"""Validate delivered assets and independently decoded preview streams."""
from build import *
checks=[]
def ck(ok,name):
 if not ok:raise AssertionError(name)
 checks.append(name)
def connected(im):
 pts={(i%128,i//128) for i,p in enumerate(im[2]) if p[3]};counts=[]
 while pts:
  q=[pts.pop()];count=0
  while q:
   x,y=q.pop();count+=1
   for dx in (-1,0,1):
    for dy in (-1,0,1):
     p=(x+dx,y+dy)
     if p in pts:pts.remove(p);q.append(p)
  counts.append(count)
 return sorted(counts,reverse=True)
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID]
ck(m['schema']=='minimidgard.pixel/1','schema')
ck(m['canvas']=={'size':[128,120],'origin':[64,112],'bodyHeight':48},'canvas and origin')
ck(set(m['characters'])=={CID},'one female merchant')
ck(set(m['animations'])==set(TIMES),'six actions and no cast')
ck(c['animations']==m['animations'],'per-character animations match')
ck(set(m['hair'])=={STYLE} and STYLE.startswith('merchant_'),'class-prefixed hair')
ck(set(m['weapons'])=={'axe'} and c['defaultWeapon']=='axe','axe layer type')
ck(len(c['frames'])==23,'23 frames')
stats={};hashes={}
for a,an in m['animations'].items():
 ck(an['durations']==TIMES[a] and an['duration']==sum(TIMES[a]),'timing '+a)
 ck(len(an['frames'])==len(an['durations']),'frame-duration pairs '+a)
 ck(an['loop']==(a in ('idle','walk')),'runtime loop '+a)
 for n in an['frames']:
  f=c['frames'][n];ls={k:read(R/p) for k,p in paths(n).items()}
  for k,im in ls.items():
   ck(im[:2]==[128,120],'layer size '+n+'/'+k)
   ck(all(p[3] in (0,255) for p in im[2]),'binary alpha '+n+'/'+k)
   ck(bounds(im) is not None,'nonempty layer '+n+'/'+k)
   if k in ('front','back'):ck({p for p in im[2] if p[3]}<=set(HK),'hair key palette '+n+'/'+k)
   else:ck(not(set(im[2])&set(HK)),'no hair-key contamination '+n+'/'+k)
   p=paths(n)[k];hashes[p]=hashlib.sha256((R/p).read_bytes()).hexdigest()
  im=compose(ls);ck(im==read(R/f'composite/{n}.png'),'exact layer reconstruction '+n)
  b=bounds(im);ck(0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,'no clipping '+n)
  ck(f['weapon']['hand']=='near','same weapon hand declaration '+n)
  ck(f['head']['point']==[0,0] and m['hair'][STYLE]['poses'][n]['pivot']==[0,0],'registered full-canvas pivots '+n)
  ck(m['weapons']['axe']['frames'][CID][n]==paths(n)['weapon'],'weapon file mapping '+n)
  ck(f['image']==paths(n)['body'] and f['grip']==paths(n)['grip'],'body and grip mapping '+n)
  g=f['weapon']['gripPoint']
  overlap=[i for i,(p,q,r) in enumerate(zip(ls['body'][2],ls['weapon'][2],ls['grip'][2])) if p[3] and q[3] and r[3]]
  ck(bool(overlap),'body/haft/grip overlap '+n)
  ck(any(abs(i%128-g[0])<=2 and abs(i//128-g[1])<=2 for i in overlap),'overlap near declared grip '+n)
  figure=blank(*SIZE)
  for k in ('back','body','front'):paste(figure,ls[k])
  components=connected(figure);ck(len(components)==1,'no disconnected body fragments '+n)
  fb=bounds(figure);ck(fb[3]==112,'ground registration '+n)
  if n=='idle_0':ck(fb[3]-fb[1]==48,'idle exact 48px height')
  stats[n]={'bounds':b,'bodyBounds':fb,'bodyComponents':components,'gripOverlapPixels':len(overlap)}
for k,p in paths('attack_7').items():ck(read(R/p)==read(R/paths('idle_0')[k]),'exact idle return '+k)
an=m['animations']['attack'];ck(an['hitFrame']==3,'impact hitFrame')
start=sum(an['durations'][:3]);end=start+an['durations'][3]
ck(.4<=((start+end)/2)/an['duration']<=.6,'hit near middle of attack')
ck(sum(TIMES['attack'][4:6])>sum(TIMES['attack'][2:4]),'heavy hold longer than swing')
ck(all(m['animations'][a]['holdLast'] for a in ('dead','sit')),'dead/sit hold last')
decoded=json.loads((R/'verification/gif_decode.json').read_text());ck(len(decoded)==12,'12 independently decoded GIFs')
for item in decoded:
 a,scale=item['file'].removesuffix('.gif').split('_');an=m['animations'][a]
 ck(item['frames']==len(an['frames']),'decoded frame count '+item['file'])
 ck(all(abs(x-y)<.01 for x,y in zip(item['durations'],an['durations'])),'decoded timing '+item['file'])
 ck(all(x==([128,120] if scale=='1x' else [512,480]) for x in item['sizes']),'decoded dimensions '+item['file'])
small=read(R/'comparison_1x.png');large=read(R/'comparison_4x.png')
ck(small[:2]==[384,120] and large==resize(small,1536,480),'exact 1x/4x comparison')
for i,p in enumerate([R.with_name('pixel-hero-r12')/'composite/idle_0.png',R.with_name('pixel-knight-r15')/'composite/idle_0.png',R/'composite/idle_0.png']):
 bg=blank(*SIZE,BG);paste(bg,read(p));ck(crop(small,(i*128,0,(i+1)*128,120))==bg,'unscaled comparison character '+str(i))
ck(len(list((R/'sources').glob('*rejected*')))==2,'two rejected hand-swap attempts preserved separately')
ck(not list(R.rglob('__pycache__')) and not (R/'.swift-module-cache').exists(),'no build caches')
dump('verification/validation.json',{'passed':True,'checksPassed':len(checks),'frames':stats,'hitWindowMs':[start,end],'attackDurationMs':900,'limitations':'첨부 RO 시트의 자세/리듬을 참고. 레이어·GIF와 크기 비교 검증 완료. 게임 런타임 통합은 요청 범위 밖이므로 실행하지 않음.'})
dump('verification/asset_hashes.json',hashes)
print(json.dumps({'passed':True,'checksPassed':len(checks),'frames':23,'gifs':12,'hitWindowMs':[start,end]},ensure_ascii=False))
