"""Validate delivery references, raster layers and unchanged-motion provenance."""
import hashlib,json
from build import *
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];checks=[]
def ck(test,label):
    if not test:raise AssertionError(label)
    checks.append(label)
ck(m['schema']=='minimidgard.pixel/1','pixel/1 schema')
ck(m['canvas']=={'size':[128,120],'origin':[64,112],'bodyHeight':48},'canvas and ground origin compatible with R10')
ck(c['animations']==m['animations'],'global/character animation agreement')
ck(m['animations']['attack']['hitFrame']==2,'impact frame index 2')
ck(m['animations']['attack']['durations']==TIMES,'authored attack timing')
ck(len(c['frames'])==25,'complete 25-frame character pack')
paths=set()
def walk(o):
    if isinstance(o,dict):
        for v in o.values():walk(v)
    elif isinstance(o,list):
        for v in o:walk(v)
    elif isinstance(o,str) and o.endswith('.png'):paths.add(o)
walk(m)
for path in paths:
    ck((R/path).is_file(),f'asset exists: {path}')
    im=read(R/path)
    ck(all(p[3] in (0,255) for p in im[2]),f'binary alpha: {path}')
    if path.startswith('hair/'):
        ck({p for p in im[2] if p[3]}<=set(HK),f'four hair keys: {path}')
for anim,a in m['animations'].items():
    ck(len(a['frames'])==len(a['durations']) and sum(a['durations'])==a['duration'],f'timing contract: {anim}')
    for name in a['frames']:ck(name in c['frames'],f'animation frame exists: {name}')
report={}
for name,f in c['frames'].items():
    im=render(m,name);saved=read(R/f'composite/{name}.png')
    ck(im==saved,f'lossless reconstruction: {name}')
    b=bounds(im);ck(b[0]>0 and b[1]>0 and b[2]<128 and b[3]<120,f'no clipping: {name}')
    report[name]={'bounds':b,'sha256':hashlib.sha256((R/f'composite/{name}.png').read_bytes()).hexdigest()}
    if name.startswith(('attack','idle')):
        body=read(R/f['image']);weapon=read(R/m['weapons']['sword']['frames'][CID][name]);grip=read(R/f['grip'])
        ck(bounds(body)!=None and bounds(weapon)!=None and bounds(grip)!=None,f'nonempty separated layers: {name}')
        ck(not(set(body[2])&set(HK)),f'no hair-key leakage in body: {name}')
        ck(not(set(weapon[2])&set(HK)),f'no hair-key leakage in sword: {name}')
        ck(any(a[3] and b[3] and d[3] for a,b,d in zip(body[2],weapon[2],grip[2])),f'glove/hilt overlay contact: {name}')
        ck(b[3]==112,f'feet at shared origin: {name}')
ck(read(R/'composite/attack_5.png')==read(R/'composite/idle_0.png'),'exact attack-to-idle continuity')
ck(bounds(read(R/'composite/idle_0.png'))[3]-bounds(read(R/'composite/idle_0.png'))[1]==48,'idle native height 48 pixels')
for a in ('walk','hurt','dead','sit'):
    for name in m['animations'][a]['frames']:
        ck((R/f'composite/{name}.png').read_bytes()==(OLD/f'composite/{name}.png').read_bytes() or read(R/f'composite/{name}.png')==read(OLD/f'composite/{name}.png'),f'unchanged R10 composite: {name}')
for i in range(6):
    fx=read(R/f'source/fx_masks/attack_{i}.png')
    ck(bool(bounds(fx))==(i==2),f'slash trail only at impact: {i}')
out={'passed':True,'checksPassed':len(checks),'frames':report,'uniqueReferencedImages':len(paths),'limits':'Raster/schema checks do not prove anatomy. Poses, near-arm connection, foreground layering and recolour sheets were visually reviewed. Live game integration is outside scope.'}
dump('verification/validation.json',out)
print(json.dumps({'passed':True,'checksPassed':len(checks),'frames':len(report)},ensure_ascii=False))
