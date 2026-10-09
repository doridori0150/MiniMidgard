"""Checks the delivered raster contract, not drawing implementation details."""
from pathlib import Path
from collections import deque
from PIL import Image
import json, hashlib

ROOT=Path(__file__).resolve().parent
def components(im):
    remaining={(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]}
    sizes=[]
    while remaining:
        q=deque([remaining.pop()]);count=0
        while q:
            x,y=q.popleft();count+=1
            for dx,dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
                p=(x+dx,y+dy)
                if p in remaining:remaining.remove(p);q.append(p)
        sizes.append(count)
    return sorted(sizes,reverse=True)

report={'status':'PASS','sprites':{},'deliverables':[]}
required=['r9_compare.png','NOTES.md','PROMPTS.json']
for c in 'abc':
    required += [f'r9{c}_field.png']
    for kind in ['idle','pose']:
        name=f'r9{c}_{kind}'
        required += [name+'.png',name+'_6x.png']
        im=Image.open(ROOT/(name+'.png')).convert('RGBA')
        large=Image.open(ROOT/(name+'_6x.png')).convert('RGBA')
        colors={p[:3] for p in im.getdata() if p[3]}
        alpha=sorted(set(im.getchannel('A').getdata()))
        assert alpha==[0,255],(name,'alpha')
        assert len(colors)<=31,(name,'palette incl transparent exceeds 32')
        assert large.tobytes()==im.resize((im.width*6,im.height*6),Image.Resampling.NEAREST).tobytes(),(name,'6x is not exact nearest')
        bbox=im.getbbox();height=bbox[3]-bbox[1]
        if kind=='idle':assert 46<=height<=50,(name,height)
        assert bbox[0]>0 and bbox[1]>0 and bbox[2]<im.width and bbox[3]<im.height,(name,'clipping')
        cs=components(im)
        assert len(cs)==1,(name,'stray disconnected components',cs)
        report['sprites'][name]={'opaque_colors':len(colors),'colors_including_transparency':len(colors)+1,'alpha':alpha,'visible_height':height,'exact_6x_nearest':True,'connected_components':cs,'sha256':hashlib.sha256((ROOT/(name+'.png')).read_bytes()).hexdigest()}
for name in required:
    assert (ROOT/name).is_file(),name
    report['deliverables'].append(name)
assert len(required)==18
json.loads((ROOT/'PROMPTS.json').read_text())
(ROOT/'verification/VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
