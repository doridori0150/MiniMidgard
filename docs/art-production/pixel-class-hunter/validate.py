from register import *
import hashlib,re
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];checks=[]
def ck(name,ok):
 checks.append({'check':name,'pass':bool(ok)})
 if not ok:print('FAIL',name)
ck('schema',m['schema']=='minimidgard.pixel/1');ck('canvas',m['canvas']=={'size':[128,120],'origin':[64,112],'bodyHeight':48})
ck('character',c['class']=='hunter' and c['gender']=='male' and c['defaultWeapon']=='bow')
ck('hair namespace',all(s.startswith('hunter_') for s in c['hairStyles']))
ck('per character animations',c['animations']==m['animations'])
brief=(R.parent.parent/'art/class-briefs/hunter.md').read_text();skills=re.findall(r'^\| `([^`]+)`',brief,re.M)
ck('all 18 skills mapped',len(skills)==18 and set(skills)==set(c['skillMotions']))
ck('only this class',list(m['characters'])==[CID])
for name,a in c['animations'].items():
 ck(name+' frame count',len(a['frames'])==len(a['durations']))
 ck(name+' total timing',a['duration']==sum(a['durations']))
 ck(name+' positive 10ms timing',all(d>0 and d%10==0 for d in a['durations']))
 ck(name+' references',all(n in c['frames'] for n in a['frames']))
 if name.startswith('skill_'):
  ck(name+' one shot 500-1000ms',not a['loop'] and 500<=a['duration']<=1000)
  if name in ['skill_focus','skill_scout','skill_whistle']:ck(name+' no hit','hitFrame' not in a)
  else:ck(name+' contact 130ms',sum(a['durations'][:a['hitFrame']])==130)
  ck(name+' return idle',a['frames'][-1]=='idle_0')
for a in ['walk','attack']:ck(a+' at least 8 frames',len(c['animations'][a]['frames'])>=8)
ck('cast looping',c['animations']['cast']['loop'])
ck('death hold',c['animations']['dead']['holdLast'])
ck('skill targets exist',all(v in c['animations'] for v in c['skillMotions'].values()))
metrics={};lowhash=[]
for n,f in c['frames'].items():
 ls={k:read(R/p) for k,p in paths(n).items()}
 for k,im in ls.items():
  ck(n+'/'+k+' canvas',im[:2]==[128,120]);ck(n+'/'+k+' binary alpha',all(p[3] in (0,255) for p in im[2]))
  if k in ('front','back'):ck(n+'/'+k+' hair colours',all(p in HP or not p[3] for p in im[2]))
 whole=compose(ls);ck(n+' layer recomposition',whole==read(R/f'composite/{n}.png'))
 box=bounds(whole);ck(n+' not clipped',box[0]>0 and box[1]>0 and box[2]<128 and box[3]<120)
 ck(n+' bow visible',bounds(ls['weapon']) is not None);ck(n+' hair exists',bounds(ls['front']) is not None)
 g=f['weapon']['gripPoint'];ck(n+' constant hand',f['weapon']['anatomicalHand']=='left' and f['weapon']['hand']=='far')
 ck(n+' grip near declared hand',any(get(ls['grip'],x,y)[3] for y in range(g[1]-2,g[1]+3) for x in range(g[0]-2,g[0]+3)))
 ck(n+' bow grip contact',any(p[3] and q[3] for p,q in zip(ls['grip'][2],ls['weapon'][2])))
 metrics[n]={'bounds':box,'grip':g,'hairBounds':bounds(ls['front'])}
 if n.startswith('walk_'):
  b=crop(whole,(35,99,80,114));lowhash.append(hashlib.sha256(bytes(v for p in b[2] for v in p)).hexdigest())
ck('8 distinct walking leg silhouettes',len(lowhash)==len(set(lowhash))==8)
ck('idle height 48px',metrics['idle_0']['bounds'][3]-metrics['idle_0']['bounds'][1]==48)
ck('idle ground 112',metrics['idle_0']['bounds'][3]==112)
expected=json.loads((R/'verification/gif_expected.json').read_text())
decoded=json.loads((R/'verification/gif_decode.json').read_text())
ck('all 46 GIFs decoded',len(decoded)==len(expected)==46)
for d in decoded:
 e=expected[d['file']];ck(d['file']+' frame count',d['frames']==len(e['durations']));ck(d['file']+' timing',all(abs(x-y)<.1 for x,y in zip(d['durations'],e['durations'])));ck(d['file']+' dimensions',all(v==e['size'] for v in d['sizes']))
ck('deliverable sheets',all((R/p).exists() for p in ['contact_sheet.png','skills_contact_sheet.png','comparison_1x.png','comparison_4x.png','NOTES.md','PLAN.md','PROMPTS.json','preview.html']))
ck('no build caches or ZIPs',not any(p.name in ['__pycache__','.swift-module-cache'] or p.suffix=='.zip' for p in R.rglob('*')))
report={'passed':all(x['pass'] for x in checks),'checks':len(checks),'failures':[x for x in checks if not x['pass']],'authoredPoses':len(c['frames']),'animations':len(c['animations']),'skillMappings':len(skills),'gifFiles':len(decoded),'metrics':metrics,'details':checks}
(R/'verification/validation.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items() if k not in ('metrics','details')})
if not report['passed']:raise SystemExit(1)
