"""Requested crop/alignment/size previews only; no recoloring, pixelation or pose warping."""
from PIL import Image, ImageDraw, ImageFont, ImageChops
from pathlib import Path
import json, hashlib
ROOT=Path(__file__).resolve().parent
FONT='/Library/Fonts/Lato-Regular.ttf'
W,H,G,X=144,120,106,62
RES=Image.Resampling.LANCZOS

def font(n): return ImageFont.truetype(FONT,n)
def white(im):
    b=Image.new('RGBA',im.size,'white'); b.alpha_composite(im); return b.convert('RGB')
def sheet(frames, name, durations):
    n=len(frames); out=Image.new('RGB',(n*W*3,560),'white'); d=ImageDraw.Draw(out)
    d.text((12,8),f'{name.upper()} / 1x / NONE',font=font(16),fill='#4b443b')
    d.text((12,173),f'{name.upper()} / 3x / smooth',font=font(16),fill='#4b443b')
    for i,im in enumerate(frames):
        out.paste(white(im),(i*W*3+W,30))
        out.paste(white(im.resize((W*3,H*3),RES)),(i*W*3,196))
        d.text((i*W*3+W*1.5,148),f'{i+1} / {durations[i]} ms',anchor='mt',font=font(14),fill='#4b443b')
        d.text((i*W*3+W*1.5,540),str(i+1),anchor='mt',font=font(14),fill='#4b443b')
    out.save(ROOT/f'r7_{name}.png')

def run():
    cfg=json.loads((ROOT/'sources/registration.json').read_text())
    manifest={'character':'쿠키','processing':'NONE: RGBA PNG, uniform per-sheet Lanczos scaling; no pixelation, palette reduction, dithering or per-frame height normalization','canvas1x':[W,H],'canvas3x':[W*3,H*3],'groundLine1x':G,'groundLine3x':G*3,'motions':{}}
    allframes={}
    for name in ['idle','walk','attack']:
        c=cfg[name]; src=Image.open(ROOT/c['source']).convert('RGBA'); frames=[]; rows=[]
        for i,r in enumerate(c['frames']):
            frame_source=Image.open(ROOT/r['source']).convert('RGBA') if 'source' in r else src
            cell=frame_source.crop(r['crop'])
            if 'extractionPolygon' in r:
                mask=Image.new('L',cell.size); ImageDraw.Draw(mask).polygon([(a-r['crop'][0],b-r['crop'][1]) for a,b in r['extractionPolygon']],fill=255)
                cell.putalpha(ImageChops.multiply(cell.getchannel('A'),mask))
            scale=r.get('scale',c['scale']); sw,sh=round(cell.width*scale),round(cell.height*scale)
            small=cell.resize((sw,sh),RES)
            dx=X-round((r['anchorX']-r['crop'][0])*scale)
            dy=G-round((r['groundY']-r['crop'][1])*scale)
            canvas=Image.new('RGBA',(W,H)); canvas.alpha_composite(small,(dx,dy))
            if name=='attack' and i==7: canvas=allframes['idle'][0].copy()
            frames.append(canvas)
            for z in [1,3]:
                (canvas if z==1 else canvas.resize((W*z,H*z),RES)).save(ROOT/f'frames/{name}_{i+1:02}_{z}x.png')
            rows.append({'frame':i+1,'durationMs':c['durations'][i],'source':r.get('source',c['source']),'sourceCrop':r['crop'],'sourceAnchorX':r['anchorX'],'sourceGroundY':r['groundY'],'sourceToGameScale':scale,'extractionPolygon':r.get('extractionPolygon'),'translation1x':[dx,dy],'groundLine1x':G,'groundLine3x':G*3,'pose':r['pose'],'sourceOverride':'frames/idle_01_1x.png' if name=='attack' and i==7 else None})
        allframes[name]=frames
        sheet(frames,name,c['durations'])
        # GIF's indexed palette is a format constraint only; PNG art remains full RGBA.
        g=[white(im.resize((W*3,H*3),RES)) for im in frames]
        atlas=Image.new('RGB',(W*3*len(g),H*3),'white')
        for j,im in enumerate(g): atlas.paste(im,(j*W*3,0))
        palette=atlas.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
        g=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in g]
        opt={'save_all':True,'append_images':g[1:],'duration':c['durations'],'disposal':2,'optimize':False}
        if name!='attack': opt['loop']=0
        g[0].save(ROOT/f'r7_{name}.gif',**opt)
        manifest['motions'][name]={'loop':name!='attack','totalDurationMs':sum(c['durations']),'scale':c['scale'],'frames':rows}
    compare=Image.new('RGB',(8*W*3,800),'white'); d=ImageDraw.Draw(compare)
    for row in range(2):
        d.text((12,row*400+8),['ROUND 6 / existing pixels','ROUND 7 / NONE / smooth'][row],font=font(20),fill='#4b443b')
        for i in range(8):
            im=Image.open(ROOT.parent/'round6'/f'frames/walk_{i+1:02}_1x.png').convert('RGBA') if row==0 else allframes['walk'][i]
            compare.paste(white(im.resize((im.width*3,im.height*3),RES)),(i*W*3,row*400+32))
            d.text((i*W*3+W*1.5,row*400+378),str(i+1),anchor='mt',font=font(16),fill='#4b443b')
    compare.save(ROOT/'r7_compare_walk.png')
    (ROOT/'FRAMES.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    checks={}
    for name,c in cfg.items():
        im=Image.open(ROOT/f'r7_{name}.gif'); ds=[]
        for i in range(im.n_frames): im.seek(i); ds.append(im.info['duration'])
        assert ds==c['durations'],(name,ds)
        assert ('loop' in im.info)==(name!='attack')
        checks[name]={'count':im.n_frames,'durationsMs':ds,'totalMs':sum(ds),'loopExtension':im.info.get('loop'),'framesHaveAlpha':all(Image.open(ROOT/f'frames/{name}_{i+1:02}_1x.png').mode=='RGBA' for i in range(len(ds)))}
    assert (ROOT/'frames/attack_08_1x.png').read_bytes()==(ROOT/'frames/idle_01_1x.png').read_bytes()
    checks['attack08EqualsIdle01']=True
    (ROOT/'VALIDATION.json').write_text(json.dumps(checks,indent=2)+'\n')
    print(json.dumps(checks,indent=2))
if __name__=='__main__':run()
