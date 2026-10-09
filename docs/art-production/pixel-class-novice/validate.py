"""Asset contract, independently decoded GIF, and preservation checks."""
from build import *

def main():
 m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];checks=[];frames={}
 def ck(value,label):
  if not value:raise AssertionError(label)
  checks.append(label)
 ck(m['schema']=='minimidgard.pixel/1','pixel/1 schema')
 ck(m['canvas']==dict(size=[128,120],origin=[64,112],bodyHeight=48),'canvas and foot origin')
 ck(set(c['animations'])=={'idle','walk','attack','hurt','dead','sit'},'six required actions, no cast')
 ck(c['animations']==m['animations'],'per-character animation tables')
 ck(c['defaultWeapon']=='dagger' and set(m['weapons'])=={'dagger'},'dagger namespace')
 ck(set(m['weapons']['dagger']['frames'])=={CID},'per-character dagger frames')
 ck(all(h.startswith('novice_') for h in m['hair']),'class-prefixed hair')
 ck(len(c['frames'])==21,'21 complete frames')
 for a,v in c['animations'].items():
  ck(len(v['frames'])==len(v['durations']),a+' timings complete')
  ck(sum(v['durations'])==v['duration'],a+' summed duration')
  ck(all(d>0 and d%10==0 for d in v['durations']),a+' GIF-safe durations')
 attack=c['animations']['attack'];hit=attack['hitFrame'];start=sum(attack['durations'][:hit]);end=start+attack['durations'][hit]
 ck(start<=attack['duration']/2<end,'hitFrame spans attack midpoint')
 ck(not attack['loop'],'attack does not loop at runtime')
 for n,f in c['frames'].items():
  ps=paths(n);ls={k:read(R/p) for k,p in ps.items()}
  ck(f['image']==ps['body'] and f['grip']==ps['grip'],'body/grip links '+n)
  ck(m['weapons']['dagger']['frames'][CID][n]==ps['weapon'],'weapon link '+n)
  for k,im in ls.items():
   ck(im[:2]==[128,120],'canvas '+n+'/'+k)
   ck(all(p[3] in (0,255) for p in im[2]),'binary alpha '+n+'/'+k)
   ck(bounds(im) is not None,'nonempty '+n+'/'+k)
   if k in ('back','front'):ck({p for p in im[2] if p[3]}<=set(HK),'hair palette '+n+'/'+k)
   else:ck(not(set(im[2])&set(HK)),'no hair-key contamination '+n+'/'+k)
  actual=compose(ls);ck(actual==read(R/f'composite/{n}.png'),'exact recomposition '+n)
  b=bounds(actual);ck(0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,'no canvas clipping '+n)
  ck(f['weapon']['hand']=='near','consistent declared weapon hand '+n)
  ck(9.3<=math.dist(f['weapon']['gripPoint'],f['weapon']['tipPoint'])<=10.7,'fixed dagger reach '+n)
  ck(any(b[3] and w[3] and g[3] for b,w,g in zip(ls['body'][2],ls['weapon'][2],ls['grip'][2])),'painted fist/hilt overlap '+n)
  figure=blank(*SIZE)
  for k in ('back','body','front'):paste(figure,ls[k])
  fb=bounds(figure)
  ck(fb[3]==112,'ground baseline '+n)
  frames[n]=dict(bounds=b,figureBounds=fb,sha256=hashlib.sha256((R/f'composite/{n}.png').read_bytes()).hexdigest())
 ck(frames['idle_0']['figureBounds'][3]-frames['idle_0']['figureBounds'][1]==48,'48px idle height')
 for k in paths('idle_0'):
  ck(read(R/paths('idle_0')[k])==read(R/paths('attack_5')[k]),'exact attack idle return '+k)
 metrics=json.loads((R/'verification/frame_metrics.json').read_text())
 for a in ('idle','walk','attack','sit'):
  for n in c['animations'][a]['frames']:
   if n=='idle_2':continue
   dx,dy=[q-v for q,v in zip(metrics[n]['headTarget'],[64,88])]
   body=read(R/paths(n)['body'])
   ck({p for y in range(64+dy,88+dy) for x in range(128) if (p:=get(body,x,y))[3]}<=set(FP),'face excludes garment palette '+n)
   for k in ('front','back'):
    shifted=blank(*SIZE);paste(shifted,read(R/paths('idle_0')[k]),dx,dy)
    ck(shifted==read(R/paths(n)[k]),'same head geometry '+n+'/'+k)
 ck(frames['attack_2']['bounds'][1]>frames['attack_0']['bounds'][1],'lunge head lowers')
 ck(c['frames']['attack_2']['weapon']['gripPoint'][0]>c['frames']['attack_0']['weapon']['gripPoint'][0],'thrust moves forward')
 ck(frames['dead_2']['figureBounds'][3]-frames['dead_2']['figureBounds'][1]<25,'final prone silhouette')
 ck(frames['dead_2']['figureBounds'][2]-frames['dead_2']['figureBounds'][0]>48,'final prone body length')
 decoded=json.loads((R/'verification/gif_decode.json').read_text());ck(len(decoded)==12,'12 independently decoded GIFs')
 for d in decoded:
  a,scale=d['file'].removesuffix('.gif').split('_');v=c['animations'][a];expected=[128,120] if scale=='1x' else [512,480]
  ck(d['frames']==len(v['frames']),'decoded frame count '+d['file'])
  ck(all(s==expected for s in d['sizes']),'decoded dimensions '+d['file'])
  ck(all(abs(x-y)<.01 for x,y in zip(d['durations'],v['durations'])),'decoded timings '+d['file'])
 refs=json.loads((R/'verification/reference_hashes.json').read_text())
 repo=R.parents[2]
 for p,h in refs.items():ck(hashlib.sha256((repo/p).read_bytes()).hexdigest()==h,'reference unchanged '+p)
 ck(read(R/'comparison_1x.png')[:2]==[384,120],'three heroes at 1x')
 ck(read(R/'comparison_4x.png')==resize(read(R/'comparison_1x.png'),1536,480),'comparison exact 4x nearest neighbour')
 reviews=json.loads((R/'FRAME_REVIEWS.json').read_text())
 ck(set(c['frames'])<={v['frame'] for v in reviews if v.get('accepted')},'all frames reviewed')
 ck(all(v.get('checkedBeforeNext') for v in reviews if v.get('accepted')),'sequential review records')
 dump('verification/validation.json',dict(passed=True,checksPassed=len(checks),frameCount=len(frames),actions=list(c['animations']),gifFiles=len(decoded),hitWindowMs=[start,end],attackDurationMs=attack['duration'],referenceFilesUnchanged=len(refs),frames=frames))
 print(json.dumps(dict(passed=True,checks=len(checks),frames=len(frames),gifs=len(decoded),hitWindowMs=[start,end]),ensure_ascii=False))
if __name__=='__main__':main()
