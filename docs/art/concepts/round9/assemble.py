"""Generated raster cleanup only: cell sampling, palette lock, explicit pixel fixes,
and review assembly. No character geometry, stroke, or polygon generation.
Run with any Python 3 + Pillow. All outputs stay beside this file.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
import json, math, hashlib

ROOT = Path(__file__).resolve().parent
NEAREST = Image.Resampling.NEAREST
# 31 opaque entries. Shared accents let material ramps stay coherent.
HEX = ['252638','49342f','776055','ad9480','d9c8ad','faf0d7',
       'b78066','e7ad86','ffd3ad','ffe7c7','301b21','80411e','bd7739',
       'fff9e5','263651','416297','7599c0','606676','a4adb9','e4eaf0',
       '692b36','ab3d47','e25b63','563c2f','855537','b57d49',
       'ddb364','8ccafa','d2f0ff','c4b5a6','9a8490']
PALETTES = {}
for key in 'abc':
    colors = HEX.copy()
    if key == 'b':
        for idx, color in {3:'ad9789',4:'d6c9bb',5:'f7eddb',15:'355a9b',16:'688ecb',21:'b32c3f',22:'e05260'}.items(): colors[idx] = color
    if key == 'c':
        for idx, color in {2:'7b6264',3:'b49b91',4:'e1cdb8',15:'50688d',16:'8aa5be',21:'a24e58',22:'d37678'}.items(): colors[idx] = color
    PALETTES[key] = [tuple(bytes.fromhex(c)) for c in colors]

def closest(rgb, palette):
    return min(palette, key=lambda c: sum((a-b)**2 for a,b in zip(c,rgb)))

def cells(im, bounds, step, palette):
    """One center sample per square cell, no filtering or interpolated colors."""
    x0,y0,x1,y1 = bounds
    size = (round((x1-x0)/step), round((y1-y0)/step))
    out = Image.new('RGBA', size)
    for y in range(size[1]):
        for x in range(size[0]):
            sx,sy = min(x1-1,int(x0+(x+.5)*step)),min(y1-1,int(y0+(y+.5)*step))
            r,g,b,a = im.getpixel((sx,sy))
            if a >= 200: out.putpixel((x,y), (*closest((r,g,b), palette),255))
    return out

def patches(im, name, palette, edits):
    for change in edits.get(name, []):
        x,y = change['xy']
        im.putpixel((x,y), (0,0,0,0) if change['color'] is None else (*palette[change['color']],255))

def font(size):
    for path in ['/System/Library/Fonts/Supplemental/Arial.ttf','/System/Library/Fonts/Helvetica.ttc']:
        if Path(path).exists(): return ImageFont.truetype(path,size)
    return ImageFont.load_default()

def label(im,xy,txt,size=14,color='#d9e0e7'):
    ImageDraw.Draw(im).text(xy,txt,font=font(size),fill=color)

def paste(im, sprite, xy, scale=1):
    if scale != 1: sprite = sprite.resize((sprite.width*scale,sprite.height*scale),NEAREST)
    im.paste(sprite,xy,sprite)

def main():
    edits_path=ROOT/'pixel_edits.json'
    edits=json.loads(edits_path.read_text()) if edits_path.exists() else {}
    sprites={}; manifest={'method':'one center sample per square cell; no interpolation; explicit palette; alpha >= 200 -> 255','sprites':{}}
    for key in 'abc':
        im=Image.open(ROOT/f'sources/r9{key}_generated.png').convert('RGBA')
        mask=im.getchannel('A').point(lambda v:255 if v>=200 else 0)
        idle_bounds=mask.crop((0,0,630,1024)).getbbox()
        pose_box=mask.crop((630,0,1536,1024)).getbbox()
        pose_bounds=(pose_box[0]+630,pose_box[1],pose_box[2]+630,pose_box[3])
        step=(idle_bounds[3]-idle_bounds[1])/48
        for kind,bounds,canvas,baseline in [('idle',idle_bounds,(64,64),58),('pose',pose_bounds,(96,80),70)]:
            small=cells(im,bounds,step,PALETTES[key])
            out=Image.new('RGBA',canvas)
            out.paste(small,((canvas[0]-small.width)//2,baseline-small.height))
            name=f'r9{key}_{kind}'
            out.save(ROOT/f'verification/{name}_before.png')
            patches(out,name,PALETTES[key],edits)
            out.save(ROOT/f'{name}.png')
            out.resize((out.width*6,out.height*6),NEAREST).save(ROOT/f'{name}_6x.png')
            sprites[name]=out
            alpha=sorted(set(out.getchannel('A').getdata()))
            colors=set(p[:3] for p in out.getdata() if p[3])
            manifest['sprites'][name]={'canvas':canvas,'source_bounds':bounds,'source_cell_pitch':step,'grid_size':small.size,'opaque_bbox':out.getbbox(),'opaque_colors':len(colors),'alpha_values':alpha,'manual_pixel_edits':len(edits.get(name,[]))}
    # Slime is sampled from a separately generated painted raster, never drawn here.
    slime_source=Image.open(ROOT/'sources/slime_generated.png').convert('RGBA')
    sm=slime_source.getchannel('A').point(lambda v:255 if v>=200 else 0)
    sb=sm.getbbox(); sp=[tuple(bytes.fromhex(c)) for c in ['233a1c','52702a','80a33b','abd443','ebf58a']]
    slime=cells(slime_source,sb,(sb[2]-sb[0])/20,sp)
    slime.save(ROOT/'slime.png')
    grass=Image.open(ROOT/'sources/grass.jpg').convert('RGB')
    grass=ImageEnhance.Color(grass).enhance(.75).filter(ImageFilter.GaussianBlur(.45))
    for key in 'abc':
        field=Image.new('RGB',(640,380),'#202e2a')
        label(field,(20,12),f'COOKIE / R9 {key.upper()}   |   FIELD READABILITY',17)
        for y,scale in [(48,1),(180,2)]:
            patch=grass.resize((640,640),Image.Resampling.LANCZOS).crop((0,0,600,120 if scale==1 else 180))
            field.paste(patch,(20,y))
            label(field,(32,y+10),f'{scale}x / NEAREST',12,'#314132')
            # Simple contact shadows on backdrop only; no sprite geometry.
            for nm,cx in [('idle',190),('pose',418)]:
                spr=sprites[f'r9{key}_{nm}']; baseline=58 if nm=='idle' else 70
                ground=y+(100 if scale==1 else 160)
                sx=cx-spr.width*scale//2; sy=ground-baseline*scale
                paste(field,spr,(sx,sy),scale)
            paste(field,slime,(510,y+(100 if scale==1 else 160)-slime.height*scale),scale)
        field.save(ROOT/f'r9{key}_field.png')
    compare=Image.new('RGB',(1440,1200),'#1f2b36')
    label(compare,(24,16),'COOKIE / ROUND 9     2-HEAD PIXEL DESIGN CANDIDATES',23)
    label(compare,(24,48),'48 px standing / 31-color material palette / nearest-neighbor only',14)
    subtitles={'a':'A / SOFT SIDE-PART','b':'B / SILVER VANGUARD','c':'C / WAVY CLOTH'}
    for idx,key in enumerate('abc'):
        x=idx*480
        ImageDraw.Draw(compare).rectangle((x+10,86,x+469,1180),fill='#e2dfd4')
        label(compare,(x+26,100),subtitles[key],19,'#273746')
        label(compare,(x+26,134),'IDLE / 6x',12,'#536473')
        spr=sprites[f'r9{key}_idle'];paste(compare,spr,(x+48,146),6)
        label(compare,(x+26,530),'IMPACT / 6x',12,'#536473')
        action=sprites[f'r9{key}_pose']; cropped=action.crop(action.getbbox())
        paste(compare,cropped,(x+(480-cropped.width*6)//2,565),6)
        label(compare,(x+26,914),'IDLE + IMPACT / 2x',12,'#536473')
        paste(compare,spr,(x+38,944),2)
        paste(compare,action,(x+214,916),2)
        label(compare,(x+26,1106),'NATIVE / 1x',12,'#536473')
        paste(compare,spr,(x+156,1090))
        paste(compare,action,(x+274,1074))
    compare.save(ROOT/'r9_compare.png')
    # Every action at 6x, separate contact sheet for visual QA.
    review=Image.new('RGB',(1760,560),'#e2dfd4')
    for idx,key in enumerate('abc'):
        label(review,(idx*580+18,16),f'{key.upper()} / IMPACT / 6x',20,'#273746')
        paste(review,sprites[f'r9{key}_pose'],(idx*580+8,60),6)
    review.save(ROOT/'verification/action_review_6x.png')
    (ROOT/'verification/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (ROOT/'palettes.json').write_text(json.dumps({k:['#'+bytes(c).hex() for c in p] for k,p in PALETTES.items()},indent=2)+'\n')
    print(json.dumps(manifest,indent=2))

if __name__=='__main__': main()
