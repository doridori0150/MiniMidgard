from register import *
from build import MAPPING,ANIMS
import hashlib
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];old=json.loads((OLD/'manifest.json').read_text());oc=old['characters'][CID]
checks=[];errors=[]
def check(ok,what):
 checks.append(what)
 if not ok:errors.append(what)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
check(m['schema']=='minimidgard.pixel/1','schema');check(m['canvas']==old['canvas'],'canvas unchanged')
check(c['skillMotions']==MAPPING,'all 16 skill mappings');check(all(n.startswith('knight_') for n in m['hair']),'class hair prefix')
check(len(c['frames'])==88,'88 runtime frames')
for a in oc['animations']:check(c['animations'][a]==oc['animations'][a],'base animation unchanged '+a)
for n in oc['frames']:
 for k,p in paths(n).items():check(sha(R/p)==sha(OLD/p.replace(STYLE,'braided_bob_p2')),'base layer unchanged '+n+' '+k)
for an,a in c['animations'].items():
 check(len(a['frames'])==len(a['durations']),'frame duration count '+an);check(sum(a['durations'])==a['duration'],'duration sum '+an)
 if an.startswith('skill_'):
  check(500<=a['duration']<=1000,'skill length '+an);check(not a['loop'],'skill once '+an)
  if an in ('skill_guard','skill_enchant'):check('hitFrame' not in a,'no hit '+an)
  else:check(sum(a['durations'][:a['hitFrame']])==130,'130ms hit '+an)
  for w in ('sword','spear'):check(read(R/f'composite/{w}/{a["frames"][-1]}.png')==read(R/f'composite/{w}/idle_0.png'),'idle return '+an+' '+w)
check(c['animations']['cast']['loop'],'cast loops')
check(read(R/'composite/spear/attack_7.png')==read(R/'composite/spear/idle_0.png'),'base spear attack exact idle return')
hk={tuple(bytes.fromhex(v[1:]))+(255,) for v in m['hairKeys']}
for n,f in c['frames'].items():
 check(f['weapon']['hand']=='near','near hand '+n)
 ls=layers(n)
 for k,im in ls.items():
  check(im[:2]==[128,120],'size '+n+' '+k);check(all(p[3] in (0,255) for p in im[2]),'binary alpha '+n+' '+k)
  if k in ('front','back'):check(all(p[3]==0 or p in hk for p in im[2]),'hair palette '+n+' '+k)
 for w in ('sword','spear'):
  path=m['weapons'][w]['frames'][CID].get(n);check(bool(path) and (R/path).is_file(),'weapon exists '+w+' '+n)
  ls[w]=read(R/path);check(ls[w][:2]==[128,120],'weapon size '+w+' '+n)
  check(all(p[3] in (0,255) for p in ls[w][2]),'weapon alpha '+w+' '+n)
  composite=compose(ls,w);check(composite==read(R/f'composite/{w}/{n}.png'),'layer recomposition '+w+' '+n)
  b=bounds(composite);check(b[0]>0 and b[1]>0 and b[2]<128 and b[3]<120,'no clipping '+w+' '+n)
  if f['weapon']['visible']:check(bounds(ls[w]) is not None,'visible weapon '+w+' '+n)
  else:check(bounds(ls[w]) is None,'intentional released weapon '+w+' '+n)
  if w=='spear':
   by=f['weapon']['byType'][w];g=by['gripPoint'];check(g==f['weapon']['gripPoint'],'same spear grip '+n)
   gr=read(R/by['gripOverlay']);check(gr[:2]==[128,120],'spear grip overlay '+n)
   if by['visible']:
    check(bounds(gr) is not None,'nonempty grasp '+n)
    check(any(get(gr,x,y)[3] and get(ls[w],x,y)[3] for y in range(g[1]-2,g[1]+3) for x in range(g[0]-2,g[0]+3)),'grip contact '+n)
    a=math.radians(by['angleDegrees']);u=(math.cos(a),math.sin(a));v=(-u[1],u[0]);pts=[(g[0]+s*u[0]+t*v[0],g[1]+s*u[1]+t*v[1]) for s in (-22,33) for t in (-2,2)]
    check(all(0<x<127 and 0<y<119 for x,y in pts),'spear full fixed length in canvas '+n)
# Preserve every source file, including excluded raw artwork.
before=json.loads((R/'verification/r15_before_sha256.json').read_text())
for p,h in before.items():check(sha(OLD/p)==h,'r15 untouched '+p)
for an in c['animations']:
 for w in ('sword','spear'):
  stem=an+('_spear' if w=='spear' else '')
  for scale in (1,4):check((R/f'{stem}_{scale}x.gif').is_file(),'gif '+stem+str(scale))
for p in R.rglob('*'):
 check(p.name not in {'__pycache__','.swift-module-cache','generated','normalized','sources'} and p.suffix!='.zip','no excluded artifact '+str(p.relative_to(R)))
# Independent Apple decoder confirms final GIF frame counts, time and dimensions.
gifpath=R/'verification/gif_decode.json'
if gifpath.exists():
 decoded={d['file']:d for d in json.loads(gifpath.read_text())}
 for an,a in c['animations'].items():
  for w in ('sword','spear'):
   for scale in (1,4):
    stem=an+('_spear' if w=='spear' else '')+f'_{scale}x.gif';d=decoded.get(stem)
    check(d is not None,'decoded '+stem)
    if d:
     check(d['frames']==len(a['frames']),'GIF frames '+stem);check([round(x) for x in d['durations']]==a['durations'],'GIF timing '+stem)
     check(all(x==[128*scale,120*scale] for x in d['sizes']),'GIF dimensions '+stem)
 for an in ANIMS:
  if an=='cast':continue
  def ends(a):
   out=[0]
   for d in a['durations']:out.append(out[-1]+d)
   return out
  events=sorted(set(ends(c['animations']['attack'])+ends(c['animations'][an])))
  expected=[b-a for a,b in zip(events,events[1:])]
  for w in ('sword','spear'):
   for scale in (1,4):
    fn=f'attack_vs_{an}_{w}_{scale}x.gif';d=decoded.get(fn)
    check(d is not None,'comparison decoded '+fn)
    if d:
     check([round(x) for x in d['durations']]==expected,'comparison timing '+fn)
     check(all(x==[256*scale,120*scale] for x in d['sizes']),'comparison size '+fn)
else:errors.append('Apple ImageIO GIF verification pending')
out={'passed':not errors,'checks':len(checks),'errors':errors,'frames':len(c['frames']),'skills':len(MAPPING),'skillMotions':10,'baseFramesPreserved':27}
(R/'verification/validation.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps(out,ensure_ascii=False,indent=2));raise SystemExit(bool(errors))
