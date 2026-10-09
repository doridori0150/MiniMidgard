"""Sample painted pixel clusters; no generated limb geometry or interpolation."""
from pathlib import Path
import json
from raster import *
R=Path(__file__).resolve().parent
P=[tuple(bytes.fromhex(c[1:]))+(255,) for c in json.loads((R.parent/'pixel-hero-r10/source/design_palettes.json').read_text())['c']]
# Original generator images use large, almost uniform square pixel clusters.
# Coordinates are source sampling grid: left, top, step, native grid dimensions.
GRIDS={0:(0,0,16.67,76,76),1:(0,0,16.5,76,76),2:(0,0,15.1,91,76),3:(0,0,15.1,91,76),4:(0,0,15.1,91,76),5:(0,0,15.1,91,76)}
def main():
    for i,(x0,y0,s,w,h) in GRIDS.items():
        if (R/f'source/attack_{i}_sampled.png').exists():continue
        src=read(R/f'source/attack_{i}_generated.png')
        im=blank(w,h)
        for y in range(h):
            for x in range(w):
                p=get(src,int(x0+(x+.5)*s),int(y0+(y+.5)*s))
                if p[3]>=128:put(im,x,y,nearest(p,P))
        save(im,R/f'source/attack_{i}_sampled.png')
        large=resize(im,w*6,h*6);bg=blank(w*6,h*6,(38,50,62,255));paste(bg,large)
        save(bg,R/f'verification/sample_{i}_6x.png')
        grid(im,R/f'verification/grid_{i}.png')
        print(i,bounds(im))
if __name__=='__main__':main()
