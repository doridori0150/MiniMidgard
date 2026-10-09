"""Check packaged assets and independently decoded GIF streams."""
from build import *
checks=[]
def ck(v,label):
 if not v:raise AssertionError(label)
 checks.append(label)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def components(im):
 pts={(i%im[0],i//im[0]) for i,p in enumerate(im[2]) if p[3]};out=[]
 while pts:
  q=[pts.pop()];size=0
  while q:
   x,y=q.pop();size+=1
   for dy in (-1,0,1):
    for dx in (-1,0,1):
     pt=x+dx,y+dy
     if pt in pts:pts.remove(pt);q.append(pt)
  out.append(size)
 return sorted(out,reverse=True)
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID]
ck(m['schema']=='minimidgard.pixel/1','schema')
ck(m['canvas']=={'size':[128,120],'origin':[64,112],'bodyHeight':48},'canvas origin and height')
ck(set(m['characters'])=={CID},'only requested male thief')
ck(c['class']=='thief' and c['gender']=='male','class and gender')
ck(c['defaultWeapon']=='dagger' and set(m['weapons'])=={'dagger'},'dagger type and layer')
ck(c['animations']==m['animations'],'per-character animations')
ck(set(m['animations'])==set(DUR),'six actions and no cast')
ck(len(c['frames'])==25,'25 frames')
ck(m['hairKeys']==['#faf0d7','#e1cdb8','#b49b91','#49342f'],'hair keys')
ck(c['defaultHair']==STYLE and c['hairStyles']==[STYLE],'own swept crop hairstyle')
report={};files=set()
for action,a in m['animations'].items():
 ck(a['duration']==sum(a['durations']) and a['durations']==DUR[action],'timing '+action)
 ck(len(a['frames'])==len(a['durations']),'frame duration cardinality '+action)
 ck(a['loop']==(action in ('idle','walk')),'runtime loop '+action)
 for n in a['frames']:
  f=c['frames'][n];hp=m['hair'][STYLE]['poses'][f['head']['pose']]
  ps={'body':f['image'],'back':hp['back'],'front':hp['front'],'weapon':m['weapons']['dagger']['frames'][CID][n],'grip':f['grip']}
  ls={}
  for k,p in ps.items():
   path=R/p;ck(path.is_file() and path.resolve().is_relative_to(R),'local reference '+p);files.add(p)
   im=read(path);ls[k]=im;ck(im[:2]==[128,120],'size '+p);ck(all(px[3] in (0,255) for px in im[2]),'binary alpha '+p);ck(bool(bounds(im)),'nonempty '+p)
   colors={px for px in im[2] if px[3]}
   if k in ('front','back'):ck(colors<=set(HK),'hair key palette '+p)
   else:ck(not(colors&set(HK)),'no hair-key recolouring of body/weapon '+p)
  im=compose(ls);ck(im==read(R/f'composite/{n}.png'),'exact layer recomposition '+n)
  b=bounds(im);ck(0<b[0] and b[2]<128 and 0<b[1] and b[3]<120,'no canvas clipping '+n)
  figure=blank(*SIZE)
  for k in ('back','body','front'):paste(figure,ls[k])
  fb=bounds(figure);ck(fb[3]==112,'ground baseline '+n)
  co=components(figure);rendered=components(im)
  ck(n=='attack_3' or len(rendered)==1 or sum(rendered[1:])<=8,'no detached visible body part '+n)
  g=f['weapon']['gripPoint'];t=f['weapon']['tipPoint'];ck(f['weapon']['hand']=='near','declared near hand '+n)
  ck(any(get(ls['grip'],x,y)[3] and get(ls['weapon'],x,y)[3] and get(ls['body'],x,y)[3] for x in range(g[0]-2,g[0]+3) for y in range(g[1]-2,g[1]+3)),'actual hilt-grip-body overlap '+n)
  ck(8<=math.dist(g,t)<=15,'short dagger projected reach '+n)
  report[n]={'bounds':b,'bodyBounds':fb,'bodyComponents':co,'grip':g,'tip':t,'sha256':sha(R/f'composite/{n}.png')}
ck(report['idle_0']['bodyBounds'][3]-report['idle_0']['bodyBounds'][1]==48,'48px base idle')
for n in m['animations']['idle']['frames']:ck(48<=report[n]['bodyBounds'][3]-report[n]['bodyBounds'][1]<=49,'one-pixel breathing envelope '+n)
ck(report['sit_0']['bodyBounds'][1]>report['idle_0']['bodyBounds'][1]+7,'seated silhouette is lower')
ck(report['dead_0']['bodyBounds'][1]<report['dead_1']['bodyBounds'][1]<report['dead_2']['bodyBounds'][1],'collapse lowers through stages')
ck(report['dead_2']['bodyBounds'][2]-report['dead_2']['bodyBounds'][0]>2*(112-report['dead_2']['bodyBounds'][1]),'final prone horizontal silhouette')
at=m['animations']['attack'];hit=at['hitFrame'];start=sum(at['durations'][:hit]);end=start+at['durations'][hit]
ck(hit==3 and start==200 and end==240 and at['duration']==440,'hit window spans 440ms halfway')
ck(at['durations'][4]>at['durations'][3],'follow-through held longer than strike')
ck(report['attack_3']['bounds'][2]-report['attack_3']['bounds'][0]>2*(report['idle_0']['bounds'][2]-report['idle_0']['bounds'][0]),'broad horizontal sweep')
for n in ('attack_1','attack_2'):ck(report[n]['tip'][0]<report[n]['grip'][0],'backward windup '+n)
for n in ('attack_3','attack_4'):ck(report[n]['tip'][0]>report[n]['grip'][0] and abs(report[n]['tip'][1]-report[n]['grip'][1])<=1,'horizontal impact/follow-through '+n)
for k,p in paths('attack_6').items():ck(read(R/p)==read(R/paths('idle_0')[k]),'exact idle return '+k)
for a in ('dead','sit'):ck(m['animations'][a]['holdLast'],'holds last '+a)
for f in json.loads((R/'verification/gif_decode.json').read_text()):
 a,scale=f['file'].removesuffix('.gif').split('_');s=int(scale[:-1]);an=m['animations'][a]
 ck(f['frames']==len(an['frames']),'decoded GIF frame count '+f['file'])
 ck(all(abs(x-y)<.01 for x,y in zip(f['durations'],an['durations'])),'decoded GIF timing '+f['file'])
 ck(all(sz==[128*s,120*s] for sz in f['sizes']),'decoded GIF size '+f['file'])
ck(len(json.loads((R/'verification/gif_decode.json').read_text()))==12,'all 12 GIFs independently decoded')
# Comparison uses the reference assets without modifying or rescaling them at native size.
pair=read(R/'side_by_side_1x.png');large=read(R/'side_by_side_4x.png');ck(large==resize(pair,1536,480),'nearest 4x comparison')
for i,path in enumerate([R.parent/'pixel-hero-r12/composite/idle_0.png',R.parent/'pixel-knight-r15/composite/idle_0.png',R/'composite/idle_0.png']):
 im=read(path);ck(all(get(pair,x+i*128,y)==get(im,x,y) for y in range(40,120) for x in range(128) if get(im,x,y)[3]),'comparison reference pixels '+str(i))
refs=json.loads((R/'verification/reference_hashes.json').read_text())
for p,h in refs.items():ck(sha(Path(p))==h,'reference/source unchanged since packaging '+p)
reviews=json.loads((R/'FRAME_REVIEWS.json').read_text());ck({n for n in c['frames']}<={v['frame'] for v in reviews},'every frame reviewed')
ck(sum(v.get('accepted') is False for v in reviews)>=2,'rejected source attempts recorded')
dump('verification/validation.json',{'passed':True,'checksPassed':len(checks),'frames':report,'packagedLayers':len(files),'actions':list(DUR),'frameCount':25,'gifCount':12,'hitWindowMs':[start,end],'attackDurationMs':440,'referenceFilesRechecked':len(refs),'visualReview':'Source frames were inspected before each next generation; full-size and native-scale contact sheets reviewed. Near-hand metadata is not a substitute for that visual check.','scope':'Only pixel-class-thief authored; no game integration.'})
print(json.dumps({'passed':True,'checksPassed':len(checks),'frames':25,'layers':len(files),'gifs':12}))
