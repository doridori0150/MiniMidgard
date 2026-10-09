#!/usr/bin/env python3
"""Rebuild the meadow kit from preserved ImageGen sources. Writes only beside this script."""
from pathlib import Path
import json
import math
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'source'
QA = ROOT / 'qa'
QA.mkdir(exist_ok=True)
SCALE = 2.3
HEIGHTS = dict(tree=100, pine=112, bush=30, rock=25, flowers=16, stump=24,
               fence=28, sign=44, well=60, cart=40, haystack=34)
LANCZOS = Image.Resampling.LANCZOS
manifest = {'pixelsPerWorldUnit': SCALE, 'tileWorldScale': 0.55,
            'lightFrom': 'upper-left', 'shadowToward': 'lower-right',
            'camera': 'orthographic high three-quarter, approximately 45 degrees',
            'anchorRule': 'Place each file at worldFoot - anchorPx * drawScale. Do not recenter shadow canvases.',
            'props': {}}

def save_json(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def periodic_tile(name):
    im = Image.open(SRC / (name+'.png')).convert('RGB').resize((512,512), LANCZOS)
    im = ImageEnhance.Color(im).enhance(0.77 if name == 'grass' else 0.88)
    im = ImageEnhance.Contrast(im).enhance(0.78 if name == 'grass' else 0.91)
    if name == 'grass':
        im = ImageEnhance.Brightness(im).enhance(1.13)
    a = np.asarray(im).astype(np.float64)
    # Periodic-plus-smooth decomposition: remove boundary discontinuities without mirroring motifs.
    n = a.shape[0]
    v = np.zeros_like(a)
    v[0] = a[-1] - a[0]
    v[-1] = -v[0]
    v[:,0] += a[:,-1] - a[:,0]
    v[:,-1] -= a[:,-1] - a[:,0]
    yy, xx = np.indices((n,n))
    denom = 2*np.cos(2*np.pi*xx/n) + 2*np.cos(2*np.pi*yy/n) - 4
    denom[0,0] = 1
    f = np.fft.fft2(v, axes=(0,1)) / denom[:,:,None]
    f[0,0] = 0
    a -= np.fft.ifft2(f, axes=(0,1)).real
    # A narrow cosine correction gives exact matching edge samples before JPEG encoding.
    for axis in (0,1):
        a = np.swapaxes(a,0,axis)
        delta = (a[-1]-a[0])/2
        for k in range(12):
            weight = (1+math.cos(math.pi*k/12))/2
            a[k] += delta*weight
            a[-1-k] -= delta*weight
        a = np.swapaxes(a,0,axis)
    im = Image.fromarray(np.uint8(np.clip(a,0,255)))
    im.save(ROOT/(name+'.jpg'), quality=98, subsampling=0)
    decoded = Image.open(ROOT/(name+'.jpg')).convert('RGB')
    grid = Image.new('RGB',(1024,1024))
    for x in (0,512):
        for y in (0,512): grid.paste(decoded,(x,y))
    grid.save(QA/(name+'_2x2.png'))

def normalized_prop(name, world_h):
    im = Image.open(SRC/(name+'.png')).convert('RGBA')
    alpha = im.getchannel('A')
    # Remove only negligible fringe; keep generated antialiasing and transparency.
    alpha = alpha.point(lambda x: 0 if x < 8 else x)
    im.putalpha(alpha)
    box = alpha.getbbox()
    im = im.crop(box)
    h = round(world_h*SCALE)
    w = round(im.width*h/im.height)
    im = im.resize((w,h),LANCZOS)
    # One shared ground anchor, bottom centre, with 2 px export padding.
    canvas_w = w+8
    if canvas_w%2: canvas_w+=1
    out = Image.new('RGBA',(canvas_w,h+4))
    out.alpha_composite(im,((canvas_w-w)//2,2))
    out.save(ROOT/(name+'.png'))
    anchor = [canvas_w//2,h+2]
    manifest['props'][name] = {'worldHeight':world_h,'visibleHeightPx':h,
       'canvasPx':list(out.size),'anchorPx':anchor,
       'drawScale':1/SCALE,'file':name+'.png'}
    return out

def shadow(name, prop):
    info = manifest['props'][name]
    h = info['visibleHeightPx']
    ax,ay = info['anchorPx']
    # Project each silhouette sample away from the common foot, onto the ground plane.
    # Extended canvas keeps lower-right shadows from being clipped at the prop's bottom edge.
    w,hh = prop.size
    sw,sh = w+math.ceil(h*0.60)+16,hh+math.ceil(h*0.48)+16
    a = prop.getchannel('A')
    kx,ky = .40,.31
    cast = a.transform((sw,sh), Image.Transform.AFFINE,
         (1, -kx/ky, kx*ay/ky, 0, -1/ky, ay+ay/ky),
         resample=Image.Resampling.BICUBIC)
    cast = cast.filter(ImageFilter.GaussianBlur(max(1.5,h*.045)))
    cast_a = np.asarray(cast,dtype=np.float32)/255
    y,x = np.indices((sh,sw))
    # Contact AO anchors the shadow underneath the object.
    rx = max(3,min(w*.20,h*.35)); ry=max(2,h*.06)
    contact = np.exp(-2*((x-ax)/rx)**2-2*((y-ay)/ry)**2)
    out_a = np.maximum(cast_a*.46,contact*.49)
    # Scale cast core to 46%, while preserving feathering and 49% contact maximum.
    if cast_a.max()>0: out_a=np.maximum(cast_a/cast_a.max()*.46,contact*.49)
    out = np.zeros((sh,sw,4),dtype=np.uint8)
    out[:,:,3] = np.uint8(out_a*255)
    Image.fromarray(out).save(ROOT/(name+'_shadow.png'))
    info['shadow'] = {'file':name+'_shadow.png','canvasPx':[sw,sh],
                      'anchorPx':[ax,ay],'coreAlpha':round(float(out_a.max()),3)}

def canopy(name, prop):
    a = np.asarray(prop).copy()
    h,w = a.shape[:2]
    # Art-directed mask follows the visible crown/trunk boundary at final pixel coordinates.
    # A colour-key is insufficient because moss on the trunk is also green.
    cutouts = {
      'tree': [(103,179),(110,181),(115,184),(120,182),(125,187),(133,188),
               (141,186),(143,194),(147,199),(157,204),(161,h),(88,h),
               (88,204),(101,193),(106,185)],
      'pine': [(79,202),(84,204),(89,207),(96,207),(100,212),(103,220),
               (101,231),(106,h),(72,h),(74,229),(78,218)]
    }
    mask=Image.new('L',(w,h),255)
    ImageDraw.Draw(mask).polygon(cutouts[name],fill=0)
    if name=='pine': ImageDraw.Draw(mask).rectangle((0,232,w,h),fill=0)
    keep=np.asarray(mask)>0
    a[:,:,3] = np.where(keep,a[:,:,3],0)
    # Original RGB and retained alpha are never repainted or resampled.
    Image.fromarray(a).save(ROOT/(name+'_top.png'))
    Image.fromarray(np.uint8(keep)*255).save(QA/(name+'_canopy_mask.png'))
    proof=Image.new('RGBA',(w,h),'#abb5ac')
    proof.alpha_composite(Image.fromarray(a))
    proof.convert('RGB').resize((w*3,h*3),LANCZOS).save(QA/(name+'_canopy_on_gray.png'))
    manifest['props'][name]['canopy'] = {'file':name+'_top.png',
        'canvasPx':list(prop.size),'anchorPx':manifest['props'][name]['anchorPx']}

def load(name): return Image.open(ROOT/name).convert('RGBA')

def tile_area(name, size, scale=.55):
    tile=Image.open(ROOT/(name+'.jpg')).convert('RGBA')
    tile=tile.resize((round(512*scale),)*2,LANCZOS)
    out=Image.new('RGBA',size)
    for y in range(0,size[1],tile.height):
        for x in range(0,size[0],tile.width): out.paste(tile,(x,y))
    return out

def place(out,name,foot,scale=1/SCALE,part='prop'):
    info=manifest['props'][name]
    f=info if part=='prop' else info[part]
    im=load(f['file'])
    im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),LANCZOS)
    pos=(round(foot[0]-f['anchorPx'][0]*scale),round(foot[1]-f['anchorPx'][1]*scale))
    out.alpha_composite(im,pos)

def font(size):
    for p in ('/System/Library/Fonts/Supplemental/Arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(p).exists(): return ImageFont.truetype(p,size)
    return ImageFont.load_default()

def hero(colour):
    # Explicitly permitted simple scale placeholders, authored at pixel resolution.
    im=Image.new('RGBA',(24,36)); d=ImageDraw.Draw(im)
    dark='#343747'; skin='#efcfa4'; hair='#72503c'
    d.rectangle((6,29,10,35),fill=dark); d.rectangle((14,29,18,35),fill=dark)
    d.polygon([(7,17),(17,17),(21,30),(3,30)],fill=dark)
    d.polygon([(8,18),(16,18),(19,28),(5,28)],fill=colour)
    d.rectangle((4,19,7,25),fill=skin); d.rectangle((17,19,20,25),fill=skin)
    d.rectangle((6,5,18,16),fill=dark); d.rectangle((7,5,17,15),fill=skin)
    d.rectangle((5,3,18,7),fill=hair); d.rectangle((5,6,7,12),fill=hair)
    d.rectangle((9,10,10,11),fill=dark); d.rectangle((15,10,16,11),fill=dark)
    d.rectangle((9,18,15,19),fill='#fff1d5');d.rectangle((8,26,16,27),fill='#c5a95f')
    return im.resize((48,72),Image.Resampling.NEAREST)

def apply_grade(im):
    grade=json.loads((ROOT/'grade.json').read_text())
    im=ImageEnhance.Color(im.convert('RGB')).enhance(grade['saturation'])
    a=np.asarray(im).astype(float)/255
    lum=a @ np.array([.2126,.7152,.0722])
    def col(s): return np.array([int(s[i:i+2],16)/255 for i in (1,3,5)])
    shadow=col(grade['shadowTint']);light=col(grade['lightTint'])
    a=a*(1-.06*(1-lum[:,:,None]))+shadow*.06*(1-lum[:,:,None])
    a=a*(1-.04*lum[:,:,None])+light*.04*lum[:,:,None]
    y,x=np.indices(a.shape[:2]); h,w=lum.shape
    rad=((x-w/2)/(w*.72))**2+((y-h/2)/(h*.72))**2
    a*=1-grade['vignette']*np.clip(rad,0,1)[:,:,None]
    return Image.fromarray(np.uint8(np.clip(a*255,0,255))).convert('RGBA')

def preview_field():
    size=(390,844)
    out=tile_area('grass',size)
    y,x=np.indices((844,390))
    centre=195+80*np.sin(y/145)-35*np.cos(y/75)
    dist=np.abs(x-centre)
    mask=np.clip((47-dist)/13,0,1)
    out=Image.composite(tile_area('dirt',size),out,Image.fromarray(np.uint8(mask*255)))
    # A short stone footpath section joins the dirt track near the well.
    stone_mask=np.clip((31-dist)/10,0,1)*np.clip((360-y)/45,0,1)*np.clip((y-205)/40,0,1)
    out=Image.composite(tile_area('path',size),out,Image.fromarray(np.uint8(stone_mask*255)))
    objects=[('pine',25,130,1.15),('tree',343,157,1.25),('tree',64,245,1.10),
      ('fence',305,250,1.15),('well',302,318,1),('bush',359,334,1.2),
      ('flowers',109,315,1.1),('rock',41,354,1),('sign',106,411,1),
      ('cart',316,474,1.1),('haystack',351,487,1.1),('flowers',60,493,1),
      ('stump',65,559,1),('bush',324,596,1.2),('pine',354,735,1.25),
      ('tree',49,765,1.45),('flowers',215,688,1),('rock',285,775,1.1),
      ('tree',320,902,1.45)]
    for name,px,py,s in objects: place(out,name,(px,py),s/SCALE,'shadow')
    actors=[(178,498,'#606ad0'),(225,548,'#be6945'),(138,570,'#3f91b5')]
    # Shadow pass for characters and slime.
    ao=Image.new('RGBA',size);d=ImageDraw.Draw(ao)
    for px,py,_ in actors: d.ellipse((px-17,py-5,px+22,py+7),fill=(0,0,0,90))
    d.ellipse((257,379,291,390),fill=(0,0,0,80))
    ao=ao.filter(ImageFilter.GaussianBlur(3));out=Image.alpha_composite(out,ao)
    entries=[(py,'prop',(name,px,py,s)) for name,px,py,s in objects]
    entries += [(py,'hero',(px,py,c)) for px,py,c in actors]
    entries += [(386,'slime',None)]
    for _,kind,item in sorted(entries,key=lambda t:t[0]):
        if kind=='prop':
            name,px,py,s=item;place(out,name,(px,py),s/SCALE)
        elif kind=='hero':
            px,py,c=item;out.alpha_composite(hero(c),(px-24,py-72))
        else:
            d=ImageDraw.Draw(out)
            d.ellipse((258,361,289,386),fill='#559f91',outline='#345761',width=2)
            d.ellipse((263,364,276,370),fill='#b5e8bd')
            d.rectangle((267,375,269,377),fill='#243b49');d.rectangle((279,375,281,377),fill='#243b49')
    # Overlay only canopies that overlap heroes in the correct foreground depth range.
    for name,px,py,s in objects:
        if name in ('tree','pine'):
            place(out,name,(px,py),s/SCALE,'canopy')
    # Subtle lighting pass before the grade.
    light=Image.new('RGBA',size,(255,241,209,0))
    la=np.uint8(np.clip(13*(1-x/390)*(1-y/1100),0,13))
    light.putalpha(Image.fromarray(la));out=Image.alpha_composite(out,light)
    branch=load('foreground_branch.png').resize((250,167),LANCZOS)
    out.alpha_composite(branch,(-70,-24))
    out=apply_grade(out)
    out.convert('RGB').save(ROOT/'preview_field.png')

def preview_sheet():
    out=tile_area('grass',(1200,1050),.55)
    d=ImageDraw.Draw(out)
    d.rectangle((0,0,1200,76),fill='#273d38')
    d.text((28,19),'MEADOW / 2.5D LAYER KIT',font=font(27),fill='#f0e7ca')
    d.text((29,51),'UPPER-LEFT SUN  /  45 DEGREE VIEW  /  PROPS + ALPHA SHADOWS',font=font(12),fill='#b6c6ad')
    for i,(name,world_h) in enumerate(HEIGHTS.items()):
        row,col=divmod(i,4);cx=150+col*300;cy=350+row*310
        place(out,name,(cx,cy),1,'shadow');place(out,name,(cx,cy),1)
        d=ImageDraw.Draw(out)
        d.rounded_rectangle((cx-115,cy+30,cx+115,cy+70),8,fill=(31,51,45,225))
        d.text((cx-100,cy+38),f'{name}  /  {round(world_h*SCALE)} px',font=font(17),fill='#f2e8c8')
    d=ImageDraw.Draw(out)
    d.text((930,775),'CANOPY + SHADOW',font=font(18),fill='#fff0cf')
    d.text((930,806),'Shared foot anchors',font=font(15),fill='#e6e8d3')
    d.text((930,832),'11 props / 11 shadows',font=font(15),fill='#e6e8d3')
    d.text((930,858),'3 seamless 512 tiles',font=font(15),fill='#e6e8d3')
    out.convert('RGB').save(ROOT/'preview_sheet.png')

def canopy_proof():
    out=tile_area('grass',(800,360))
    for i,name in enumerate(('tree','pine')):
        foot=(195+i*400,315)
        place(out,name,foot,1,'shadow');place(out,name,foot,1)
        person=hero('#ac6bbb')
        out.alpha_composite(person,(foot[0]-24,foot[1]-110))
        place(out,name,foot,1,'canopy')
        d=ImageDraw.Draw(out)
        d.text((30+i*400,18),name+' / hero behind canopy',font=font(18),fill='#fff7df')
    out.convert('RGB').save(QA/'canopy_occlusion.png')

def validate():
    report={'tiles':{},'props':{},'canopies':{},'previews':{},'passed':True}
    for name in ('grass','dirt','path'):
        im=Image.open(ROOT/(name+'.jpg'));a=np.asarray(im).astype(float)
        edge=max(np.abs(a[0]-a[-1]).mean(),np.abs(a[:,0]-a[:,-1]).mean())
        interior=(np.abs(np.diff(a,axis=0)).mean()+np.abs(np.diff(a,axis=1)).mean())/2
        assert im.size==(512,512) and edge<3, (name,edge)
        report['tiles'][name]={'size':[512,512],'jpegEdgeMeanDifference':round(float(edge),3),
                              'interiorMeanDifference':round(float(interior),3)}
    for name,info in manifest['props'].items():
        im=load(name+'.png');a=np.asarray(im)
        sh=np.asarray(load(name+'_shadow.png'))
        assert np.all(sh[:,:,:3]==0) and .35<=sh[:,:,3].max()/255<=.55
        assert info['anchorPx']==info['shadow']['anchorPx']
        assert a[:,:,3].min()==0 and a[:,:,3].max()>240
        sy,sx=np.indices(sh.shape[:2]);weights=sh[:,:,3].astype(float)
        centroid=[float((sx*weights).sum()/weights.sum()),float((sy*weights).sum()/weights.sum())]
        assert centroid[0]>info['anchorPx'][0] and centroid[1]>info['anchorPx'][1]
        report['props'][name]={'canvasPx':list(im.size),'anchorPx':info['anchorPx'],
           'shadowCoreAlpha':round(float(sh[:,:,3].max()/255),3),'shadowCentroidPx':[round(v,2) for v in centroid]}
        if name in ('tree','pine'):
            top=np.asarray(load(name+'_top.png'));visible=top[:,:,3]>0
            assert top.shape==a.shape and np.all(top[visible]==a[visible])
            assert np.all(top[:,:,3]<=a[:,:,3])
            assert np.all(top[-14:,:,3]==0), name+' trunk remains in canopy'
            report['canopies'][name]={'sameCanvas':True,'retainedPixelsIdentical':True,'noAlphaOutsideProp':True}
    assert Image.open(ROOT/'preview_field.png').size==(390,844)
    assert Image.open(ROOT/'foreground_branch.png').width==600
    report['previews']={'field':[390,844],'sheet':list(Image.open(ROOT/'preview_sheet.png').size)}
    report['sourceSha256']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in SRC.glob('*.png')}
    report['sha256']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in ROOT.iterdir() if p.suffix in ('.png','.jpg')}
    save_json('QA_REPORT.json',report)
    return report

def main():
    for name in ('grass','dirt','path'): periodic_tile(name)
    for name,h in HEIGHTS.items():
        prop=normalized_prop(name,h);shadow(name,prop)
        if name in ('tree','pine'): canopy(name,prop)
    branch=Image.open(SRC/'foreground_branch.png').convert('RGBA').resize((600,400),LANCZOS)
    # Premultiplied-alpha blur avoids colour halos from transparent source RGB.
    branch=branch.convert('RGBa').filter(ImageFilter.GaussianBlur(2.4)).convert('RGBA')
    branch.save(ROOT/'foreground_branch.png')
    save_json('manifest.json',manifest)
    preview_field();preview_sheet();canopy_proof()
    report=validate()
    print(json.dumps({'passed':report['passed'],'props':len(HEIGHTS),'tiles':3,'canopies':2},ensure_ascii=False))

if __name__=='__main__': main()
