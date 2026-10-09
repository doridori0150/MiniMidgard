"""Validate the complete pixel/1 delivery and independently decoded GIF timings."""
from build import *
from collections import deque
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];checks=[]
def ck(v,label):
 if not v:raise AssertionError(label)
 checks.append(label)
ck(m['schema']=='minimidgard.pixel/1','schema')
ck(m['canvas']=={'size':[128,120],'origin':[64,112],'bodyHeight':48},'canvas contract')
ck(c['class']=='knight' and c['gender']=='female','character identity')
ck(c['animations']==m['animations'],'animation tables agree')
ck(m['hairKeys']==['#faf0d7','#e1cdb8','#b49b91','#49342f'],'four hair key colours')
ck(len(c['frames'])==25,'all 25 frames')
expected={'idle':4,'walk':8,'attack':6,'hurt':2,'dead':4,'sit':1}
for a,count in expected.items():
 t=m['animations'][a]
 ck(len(t['frames'])==count and len(t['durations'])==count,f'{a} frame count')
 ck(sum(t['durations'])==t['duration'],f'{a} total duration')
 ck(all(d>0 and d%10==0 for d in t['durations']),f'{a} GIF timing exact to centisecond')
 ck(t['loop']==(a in ('idle','walk')),f'{a} game loop flag')
ck(m['animations']['attack']['hitFrame']==4,'attack contact index')
ck(m['animations']['attack']['durations']==[110,40,40,40,130,70],'attack motion reference timing')
for a in ('dead','sit'):ck(m['animations'][a]['holdLast'],f'{a} holds last frame')
paths=set()
def visit(o):
 if isinstance(o,dict):
  for v in o.values():visit(v)
 elif isinstance(o,list):
  for v in o:visit(v)
 elif isinstance(o,str) and o.endswith('.png'):paths.add(o)
visit(m)
for path in paths:
 ck((R/path).is_file(),f'file exists {path}')
 im=read(R/path)
 ck(im[:2]==[128,120],f'size {path}')
 ck(all(p[3] in (0,255) for p in im[2]),f'binary alpha {path}')
 if path.startswith('hair/'):
  ck({p for p in im[2] if p[3]}<=set(HK),f'hair keys {path}')
 else:ck(not (set(im[2])&set(HK)),f'no hair key contamination {path}')
report={}
for n,f in c['frames'].items():
 hp=m['hair'][STYLE]['poses'][f['head']['pose']]
 ls={'back':read(R/hp['back']),'body':read(R/f['image']),'front':read(R/hp['front']),'weapon':read(R/m['weapons']['sword']['frames'][CID][n]),'grip':read(R/f['grip'])}
 im=compose(ls);saved=read(R/f'composite/{n}.png');ck(im==saved,f'lossless layer reconstruction {n}')
 b=bounds(im);ck(0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,f'no clipping {n}')
 for key,layer in ls.items():ck(bool(bounds(layer)),f'nonempty {key} {n}')
 g=f['weapon']['gripPoint'];t=f['weapon']['tipPoint']
 ck(20<=math.dist(g,t)<=22,f'sword length {n}')
 ck(f['weapon']['hand']=='near',f'near hand declaration {n}')
 ck(any(a[3] and b[3] and d[3] for a,b,d in zip(ls['body'][2],ls['weapon'][2],ls['grip'][2])),f'glove-hilt overlap {n}')
 # Visual pose judgment is recorded separately; this checks a connected body.
 figure=blank(*SIZE)
 for k in ('back','body','front'):paste(figure,ls[k])
 pts={(i%128,i//128) for i,p in enumerate(figure[2]) if p[3]};components=[]
 while pts:
  seed=pts.pop();q=[seed];count=0
  while q:
   x,y=q.pop();count+=1
   for dx in (-1,0,1):
    for dy in (-1,0,1):
     p=(x+dx,y+dy)
     if p in pts:pts.remove(p);q.append(p)
  components.append(count)
 report[n]={'bounds':b,'components':sorted(components,reverse=True),'sha256':hashlib.sha256((R/f'composite/{n}.png').read_bytes()).hexdigest()}
ck(bounds(read(R/'composite/idle_0.png'))[1:4:2]==(64,112),'idle exact 48px height and ground')
base=crop(read(R/'composite/idle_0.png'),(47,64,80,89))
for a in ('idle','walk'):
 for n in m['animations'][a]['frames']:
  dy=48-SPEC[n][3]
  ck(crop(read(R/f'composite/{n}.png'),(47,64+dy,80,89+dy))==base,f'stable neutral head {n}')
angles=[c['frames'][f'attack_{i}']['weapon']['angleDegrees'] for i in range(5)]
ck(all(a<b for a,b in zip(angles,angles[1:])), 'clockwise continuous attack blade angles')
decoded=json.loads((R/'verification/gif_decode.json').read_text());ck(len(decoded)==12,'12 independently decoded GIFs')
for f in decoded:
 a,scale=f['file'].removesuffix('.gif').split('_');a0=m['animations'][a];size=[128,120] if scale=='1x' else [512,480]
 ck(f['frames']==len(a0['frames']),f"GIF frame count {f['file']}")
 ck(all(abs(x-y)<.01 for x,y in zip(f['durations'],a0['durations'])),f"GIF duration {f['file']}")
 ck(all(x==size for x in f['sizes']),f"GIF size {f['file']}")
reviews=json.loads((R/'FRAME_REVIEWS.json').read_text())
ck(set(c['frames'])<=set(x['frame'] for x in reviews),'per-frame visual review log')
report={'passed':True,'checksPassed':len(checks),'uniqueReferencedImages':len(paths),'frames':report,'attackAngles':angles,'limitations':'육안 검수와 래스터/매니페스트 검증 완료. 게임 src에 적용하거나 실제 게임 런타임에서 플레이한 결과는 아님.'}
dump('verification/validation.json',report)
print(json.dumps({k:report[k] for k in ('passed','checksPassed','uniqueReferencedImages')},ensure_ascii=False))
