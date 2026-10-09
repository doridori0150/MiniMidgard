"""Validate deliverable dimensions, composition, timing and reference preservation."""
from pack import *
import hashlib
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];checks=[]
def ck(ok,label):
 if not ok:raise AssertionError(label)
 checks.append(label)
ck(m['schema']=='minimidgard.pixel/1','schema')
ck(m['canvas']=={'size':[128,120],'origin':[64,112],'bodyHeight':48},'canvas origin height')
ck(set(m['characters'])=={CID},'one male archer')
ck(set(m['animations'])==set(ANIMS),'six actions without cast')
ck(m['animations']==c['animations'],'per-character animation table')
ck(len(c['frames'])==22,'22 authored frames')
ck(c['gender']=='male' and c['defaultWeapon']=='bow','male and bow')
ck(set(m['weapons'])=={'bow'},'bow layer name')
a=c['animations']['attack'];hit=sum(a['durations'][:a['hitFrame']])
ck(a['hitFrame']==3 and hit==360 and a['duration']==600,'release at 60 percent')
metrics={}
for action,anim in c['animations'].items():
 ck(len(anim['frames'])==len(anim['durations']),action+' timing count')
 ck(sum(anim['durations'])==anim['duration'],action+' timing total')
 ck(anim['loop']==(action in ('idle','walk')),action+' loop behavior')
 for n in anim['frames']:
  f=c['frames'][n];ls={k:read(R/p) for k,p in paths(n).items()}
  for k,im in ls.items():
   ck(im[:2]==[128,120],n+'/'+k+' size')
   ck({p[3] for p in im[2]}<={0,255},n+'/'+k+' binary alpha')
   if k in ('front','back'):ck({p for p in im[2] if p[3]}<=set(HK),n+'/'+k+' hair colors')
   else:ck(not(set(im[2])&set(HK)),n+'/'+k+' no hair tint contamination')
   if k!='back':ck(bounds(im) is not None,n+'/'+k+' nonempty')
  im=compose(ls);ck(im==read(R/f'composite/{n}.png'),n+' recomposition')
  b=bounds(im);ck(0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,n+' unclipped')
  ck(f['weapon']['anatomicalHand']=='left',n+' same declared hand')
  g=f['weapon']['gripPoint']
  ck(any(get(ls['weapon'],x,y)[3] for y in range(g[1]-3,g[1]+4) for x in range(g[0]-3,g[0]+4)),n+' bow close to grip')
  ck(not any(p[3] and p[1]>p[0] for p in ls['weapon'][2]),n+' no tunic green in bow')
  ck(any(get(ls['grip'],x,y)[3] and get(ls['body'],x,y)[3] for y in range(g[1]-2,g[1]+2) for x in range(g[0]-1,g[0]+2)),n+' grip attached')
  ck(m['weapons']['bow']['frames'][CID][n]==paths(n)['weapon'],n+' bow reference')
  ck(m['hair'][STYLE]['poses'][n]['front']==paths(n)['front'],n+' hair reference')
  metrics[n]={'bounds':b,'sha256':hashlib.sha256((R/f'composite/{n}.png').read_bytes()).hexdigest()}
ck(metrics['idle_0']['bounds'][3]-metrics['idle_0']['bounds'][1]==48,'standing height exactly 48px')
ck(metrics['idle_0']['bounds'][3]==112,'standing ground at y112')
for path,h in json.loads((R/'verification/reference_hashes.json').read_text()).items():
 ck(hashlib.sha256(Path(path).read_bytes()).hexdigest()==h,'reference unchanged '+path)
decoded=json.loads((R/'verification/gif_decode.json').read_text())
ck(len(decoded)==12,'12 independently decoded GIFs')
for d in decoded:
 action,scale=d['file'].removesuffix('.gif').split('_');anim=m['animations'][action]
 ck(d['frames']==len(anim['frames']),'GIF count '+d['file'])
 ck(all(abs(a-b)<.01 for a,b in zip(d['durations'],anim['durations'])),'GIF duration '+d['file'])
 ck(all(s==([128,120] if scale=='1x' else [512,480]) for s in d['sizes']),'GIF size '+d['file'])
for n,s in [('comparison_1x.png',[384,120]),('comparison_4x.png',[1536,480])]:ck(read(R/n)[:2]==s,n+' size')
reviews=json.loads((R/'FRAME_REVIEWS.json').read_text())
ck(set(c['frames'])<={v['frame'] for v in reviews if v.get('accepted')},'every frame reviewed')
dump('verification/validation.json',{'passed':True,'checksPassed':len(checks),'frames':metrics,'releaseMs':hit,'attackDurationMs':a['duration'],'referenceHashesPreserved':True,'gifDecoder':'Apple ImageIO','visualChecks':'FRAME_REVIEWS.json','limitations':'납품용 에셋 검증. 게임 코드와 런타임 통합은 요청 범위 밖이며 변경하지 않음. 머리 뒷 레이어는 짧은 헤어스타일 특성상 투명.'})
print(json.dumps({'passed':True,'checksPassed':len(checks),'frames':len(metrics)},ensure_ascii=False))
