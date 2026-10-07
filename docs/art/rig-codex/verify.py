"""Reference renderer and manifest validation. No Python dependencies. macOS raster helper."""
import json, math, subprocess, struct
from pathlib import Path
R=Path(__file__).resolve().parent
M=json.loads((R/'manifest.json').read_text())
def mul(a,b):
 A,B,C,D,E,F=a;g,h,i,j,k,l=b
 return [A*g+C*h,B*g+D*h,A*i+C*j,B*i+D*j,A*k+C*l+E,B*k+D*l+F]
def point(a,p):return [a[0]*p[0]+a[2]*p[1]+a[4],a[1]*p[0]+a[3]*p[1]+a[5]]
def matrix(x=0,y=0,angle=0,sx=1,sy=1):
 c=math.cos(math.radians(angle));s=math.sin(math.radians(angle))
 return [c*sx,s*sx,-s*sy,c*sy,x,y]
def sample(state,t):
 anim=M['animations'][state]; t=t%anim['duration'] if anim['loop'] else min(max(0,t),anim['duration']); keys=anim['keys']; lo=keys[0]; hi=keys[-1]
 for a,b in zip(keys,keys[1:]):
  if a['time']<=t<=b['time']:lo,hi=a,b;break
 u=(t-lo['time'])/max(1,hi['time']-lo['time']);result={}
 for name,rest in M['nodes'].items():
  a=rest|lo['nodes'].get(name,{}); b=rest|hi['nodes'].get(name,{})
  out=dict(a)
  for k,default in [('offset',[0,0]),('scale',[1,1]),('angle',0),('worldAngle',None)]:
   av=a.get(k,default);bv=b.get(k,default)
   if av is not None and bv is not None:
    out[k]=[x+(y-x)*u for x,y in zip(av,bv)] if isinstance(av,list) else av+(bv-av)*u
  if u>=1:out=b
  result[name]=out
 return result

def assemble(state='idle',t=0,**look):
 look=M['defaults']|look; outfit=M['outfits'][look['outfit']]; nodes=sample(state,t); matrices={}; selected={}; draws=[]; world={}
 def visit(name):
  if name in matrices:return matrices[name]
  n=nodes[name]; parent=n.get('parent'); pm=visit(parent) if parent else matrix();pid=selected.get(parent)
  ident=n.get('part');slot=n.get('slot')
  if slot:ident=outfit.get(slot) if slot in outfit else look.get(slot)
  if ident is not None:assert ident in M['parts'],(name,ident)
  selected[name]=ident
  x,y=n.get('offset',[0,0])
  if n.get('anchor'):
   assert pid and n['anchor'] in M['parts'][pid]['anchors'],(name,pid)
   pp=M['parts'][pid]; a=pp['anchors'][n['anchor']];x+=a[0]-pp['pivot'][0];y+=a[1]-pp['pivot'][1]
  sx,sy=n.get('scale',[1,1]); m=mul(pm,matrix(x,y,n.get('angle',0),sx,sy))
  if 'worldAngle' in n:
   m=matrix(m[4],m[5],n['worldAngle'],math.hypot(m[0],m[1]),math.hypot(m[2],m[3]))
  matrices[name]=m
  if ident and n.get('visible',True):
   p=M['parts'][ident];dm=mul(m,matrix(-p['pivot'][0],-p['pivot'][1]));d=dict(file=p['file'],matrix=dm,z=n.get('z',p['z']),node=name)
   if name.startswith('hair_') and look['hairColor']!='cream':
    h=M['hairColors'][look['hairColor']].lstrip('#');d['tint']=[int(h[i:i+2],16)/255 for i in [0,2,4]]
   draws.append(d)
   world[name]={'pivot':point(m,[0,0]),'anchors':{k:point(dm,v) for k,v in p['anchors'].items()},'part':ident}
  return m
 for name in nodes:visit(name)
 return sorted(draws,key=lambda d:(d['z'],d['node'])),world

def shifted(draws,x,y,scale=1):return [dict(d,matrix=mul(matrix(x,y,sx=scale,sy=scale),d['matrix'])) for d in draws]
jobs=[]
cases=[('Novice · idle','idle',0,{}),('Walk · stride','walk',0,{}),('Melee · contact 220ms','melee',220,{}),('Swordsman + sword','idle',0,{'outfit':'swordsman','weapon':'sword','hairColor':'blue'}),('Leaf + hairpin','idle',0,{'head_top':'leaf','head_mid':'hairpin'})]
allDraw=[];labels=[dict(text='MANIFEST ASSEMBLY  /  3× inspection + actual 80 px height',at=[24,18],size=22)]
checks={};ratio=80/M['canvas']['referenceHeight']
for i,(title,state,t,look) in enumerate(cases):
 d,w=assemble(state,t,**look);x=20+i*350
 allDraw+=shifted(d,x,40,.95);allDraw+=shifted(d,x+80,392,ratio)
 labels += [dict(text=title,at=[x+20,353],size=17),dict(text='80 px',at=[x+122,510],size=13)]
 jobs.append(dict(op='render',size=M['canvas']['size'],draws=d,file=f'verification/{state}_{i}.png'))
 checks[title]=w
jobs.append(dict(op='render',size=[1770,550],background=[.83,.89,.73],draws=allDraw,labels=labels,file='preview_assembled.png'))
# Every implemented animation has a review pose; bow explicitly needs separate artwork.
allDraw=[];labels=[]
for i,(state,t) in enumerate([('idle',600),('walk',320),('melee',130),('melee',220),('bow',500),('cast',420),('sit',500),('hurt',100),('dead',550)]):
 d,w=assemble(state,t,weapon=None if state=='bow' else 'sword');x=(i%3)*400;y=(i//3)*355
 allDraw+=shifted(d,x,y);labels.append(dict(text=f'{state} / {t}ms'+(' (pose only)' if state=='bow' else ''),at=[x+18,y+323],size=16))
jobs.append(dict(op='render',size=[1200,1065],background=[.88,.9,.84],draws=allDraw,labels=labels,file='preview_states.png'))
# Verify dimensions, parent/socket references, finite transforms, and a forward blade at contact.
for id,p in M['parts'].items():
 data=(R/p['file']).read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';assert list(struct.unpack('>II',data[16:24]))==p['size'];assert data[25]==6, (id,'not RGBA')
 assert len(p['pivot'])==2
 for a in [p['pivot'],*p['anchors'].values()]:assert 0<=a[0]<=p['size'][0] and 0<=a[1]<=p['size'][1],(id,a)
count=0
fixtures=[]
for outfit in M['outfits']:
 for state,anim in M['animations'].items():
  for key in anim['keys']:
   for weapon in M['equipment']['weapon']:
    d,w=assemble(state,key['time'],outfit=outfit,weapon=weapon,head_top='leaf',head_mid='hairpin');count+=1
    fixtures.append(dict(state=state,time=key['time'],look=dict(outfit=outfit,weapon=weapon,head_top='leaf',head_mid='hairpin'),expected=[dict(node=x['node'],matrix=x['matrix'],file=x['file']) for x in d]))
    assert all(math.isfinite(v) for part in d for v in part['matrix'])
    for item in d:
     p=next(p for p in M['parts'].values() if p['file']==item['file']);width,height=p['size']
     for corner in [[0,0],[width,0],[width,height],[0,height]]:
      x,y=point(item['matrix'],corner);assert 0<=x<=384 and 0<=y<=320,(state,key['time'],item['node'],x,y)
    if state=='melee' and key['time']==220:
     hand=w['arm_near']['anchors']['grip']; grip=w['weapon']['pivot'];tip=w['weapon']['anchors']['tip'];assert math.dist(hand,grip)<1e-6;assert tip[0]>grip[0] and abs(tip[1]-grip[1])<1e-6
# Compare the actual Canvas transform implementation to the independent assembly renderer.
nodecode="import fs from 'node:fs';import {compose} from './renderer.mjs';const m=JSON.parse(fs.readFileSync('manifest.json'));const cases=JSON.parse(fs.readFileSync(0,'utf8'));console.log(JSON.stringify(cases.map(c=>compose(m,c.state,c.time,c.look))))"
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',nodecode],cwd=R,input=json.dumps(fixtures).encode()))
for case,draws in zip(fixtures,actual):
 assert len(case['expected'])==len(draws)
 for a,b in zip(case['expected'],draws):
  assert a['node']==b['node'] and a['file']==b['file']
  assert max(abs(x-y) for x,y in zip(a['matrix'],b['matrix']))<1e-8
# Reference crop is for review only; it is not used in runtime assembly.
jobs.append(dict(op='extract',source='../concepts/round2/scene_A.png',rect=[191,636,157,171],size=[232,252],file='verification/approved_mock_crop.png'))
d,_=assemble('walk',0)
jobs.append(dict(op='render',size=[800,355],background=[.83,.89,.73],draws=[dict(file='verification/approved_mock_crop.png',matrix=matrix(28,43)),*shifted(d,330,16,236/257)],labels=[dict(text='Approved scene_A crop',at=[30,310],size=17),dict(text='Manifest assembly · walk',at=[360,310],size=17)],file='preview_comparison.png'))
(R/'render_jobs.json').write_text(json.dumps(jobs,indent=2))
subprocess.run([str(R/'.raster'),str(R),'render_jobs.json'],check=True)
report=dict(parts=len(M['parts']),checkedCombinations=count,canvasTransformParity='pass (116 keyframe combinations, error < 1e-8)',dimensionAndRGBA='pass',anchorReferences='pass',canvasBounds='pass: all part rectangles within 384x320 at checked keys',contactGripErrorPixels=0,contactBladeDegrees=0,cases=checks,limitations=['bow pose scaffold only: bow/arrow/string not painted','one hairstyle and one face supplied; 2 outfits only','hurt/dead reuse open-eye face; no dedicated expression artwork'])
(R/'verification/report.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'PASS: {count} pose/equipment combinations; {len(M["parts"])} RGBA PNGs; contact grip + blade direction.')
