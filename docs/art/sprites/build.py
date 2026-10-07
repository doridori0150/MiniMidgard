"""Deterministic sheet normalization. Python 3.10+ and Pillow; no model calls.
Run from any directory. Only writes beside this file.
"""
from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import json, math, statistics

R = Path(__file__).resolve().parent
SIZE = (512, 400)
ORIGIN = (220, 360)
FRAMES = ['idle_0','idle_1','walk_0','walk_1','walk_2','walk_3',
          'attack_0','attack_1','attack_2','cast_0','cast_1','sit_0','hurt_0','dead_0']
# Measured on the saved 1254px sheets. These are audit annotations, not head layers.
HEADS = {
 'novice': [(78,30,240,185),(393,30,555,185),(702,30,866,185),(1016,31,1177,187),
 (78,338,242,491),(392,338,556,492),(700,339,865,493),(1009,339,1173,494),
 (86,656,255,805),(392,643,558,797),(715,645,867,799),(1004,687,1164,840),
 (62,956,228,1111),(322,1091,475,1234)],
 'swordsman': [(99,30,262,197),(392,30,558,197),(696,30,862,197),(1006,30,1173,198),
 (92,347,263,513),(388,347,556,513),(698,347,865,514),(993,347,1159,513),
 (86,657,256,831),(382,657,559,831),(692,657,869,831),(998,725,1165,883),
 (63,968,233,1131),(324,1084,481,1231)]}
HANDS = {
 'novice': [(218,246),(531,246),(858,223),(1152,249),(236,541),(530,546),
 (856,542),(1185,493),(229,859),(548,782),(869,757),(1158,863),(239,1080),(533,1196)],
 'swordsman': [(240,248),(530,249),(840,243),(1139,260),(247,548),(527,560),
 (848,565),(1171,521),(237,876),(548,813),(862,782),(1149,909),(253,1132),(538,1195)]}

def save(im, path):
 p=R/path; p.parent.mkdir(parents=True,exist_ok=True); im.save(p)

def dump(obj,path):
 p=R/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,indent=2)+'\n')

def clean_alpha(im):
 # Generator emits low-alpha coloured speckles outside ink. Drop <24, remap
 # interior 248..255 to opaque, retain intermediate coverage at the contour.
 im=im.convert('RGBA'); im.putalpha(im.getchannel('A').point(lambda a: 0 if a<24 else 255 if a>=248 else a))
 return im

def hair_mask(im, cls, head, cell):
 x0,y0,x1,y1=head; cx,cy=cell
 mask=Image.new('L',im.size); out=mask.load(); px=im.load()
 for y in range(max(0,y0-cy),min(im.height,y1-cy)):
  for x in range(max(0,x0-cx),min(im.width,x1-cx)):
   r,g,b,a=px[x,y]
   if a<128: continue
   # Cream hair is brighter and less saturated than skin. Blue hair is lighter
   # and less saturated than the eyes; semantic head ROI excludes blue clothes.
   yes=(r>205 and g>218 and b>185 and r-b<65) if cls=='novice' else (b>r+8 and b>g+8 and g>35 and r<180)
   if yes: out[x,y]=255
 if cls=='swordsman':
  # Blue eyes are disjoint from blue hair. Keep the largest connected blue
  # component within the head annotation, excluding eyes and collar pixels.
  remaining={(x,y) for y in range(im.height) for x in range(im.width) if out[x,y]};largest=set()
  while remaining:
   seed=remaining.pop();component={seed};q=deque([seed])
   while q:
    x,y=q.popleft()
    for p in ((x-1,y),(x+1,y),(x,y-1),(x,y+1),(x-1,y-1),(x+1,y+1)):
     if p in remaining:remaining.remove(p);component.add(p);q.append(p)
   if len(component)>len(largest):largest=component
  mask=Image.new('L',im.size);out=mask.load()
  for x,y in largest:out[x,y]=255
 else:
  # Drop tiny isolated cream flecks in facial anti-aliasing; keep the separate
  # ahoge and outlined bob locks, whose fill components are much larger.
  remaining={(x,y) for y in range(im.height) for x in range(im.width) if out[x,y]};keep=set()
  while remaining:
   seed=remaining.pop();component={seed};q=deque([seed])
   while q:
    x,y=q.popleft()
    for p in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
     if p in remaining:remaining.remove(p);component.add(p);q.append(p)
   if len(component)>=40:keep.update(component)
  mask=Image.new('L',im.size);out=mask.load()
  for x,y in keep:out[x,y]=255
 return mask

def reference_palette():
 im=Image.open(R/'source/approved-lineup.png').convert('RGB')
 # All swatches are actual pixels in approved art; two tones per material.
 samples={'ink':(113,211),'hairLight':(130,150),'hairShadow':(138,95),
 'skinLight':(154,222),'skinShadow':(161,245),'tanLight':(110,304),'tanShadow':(113,331),
 'brownLight':(99,360),'brownShadow':(111,379),'blueLight':(373,139),'blueShadow':(313,224),
 'metalLight':(329,262),'metalShadow':(334,266),'redLight':(384,326),'redShadow':(389,313),
 'eyeLight':(133,217),'eyeShadow':(132,205),'gold':(210,302)}
 pal={k:list(im.getpixel(p)) for k,p in samples.items()}
 # Deep outline sample is selected from the dark-brown edge, not a shaded fill.
 pal['ink']=list(im.getpixel((113,211)))
 return pal,samples

def quantize(im, colors):
 p=Image.new('P',(1,1)); arr=[v for c in colors for v in c]
 p.putpalette(arr+arr[-3:]*(256-len(colors)))
 rgb=im.convert('RGB').quantize(palette=p,dither=Image.Dither.NONE).convert('RGB')
 rgb.putalpha(im.getchannel('A')); return rgb

def main():
 palette,samples=reference_palette(); colors=list(palette.values())
 dump({'colors':palette,'sourcePixels':samples},'source/palette.json')
 animations={}
 for state,durations,loop in [('idle',[800,800],True),('walk',[180]*4,True),('attack',[100,80,100],False),('cast',[360,360],True),('sit',[1],False),('hurt',[1],False),('dead',[1],False)]:
  animations[state]={'frames':[f'{state}_{i}' for i in range(len(durations))],'durations':durations,'duration':sum(durations),'loop':loop}
 manifest={'schema':'minimidgard.sprites/1','canvas':{'size':list(SIZE),'origin':list(ORIGIN),'referenceHeight':310,'displayHeight':80,'axes':'x right, y down','angles':'clockwise degrees'},
 'animations':animations,'characters':{},'weapons':{},'headgear':{},
 'hairTints':{'cream':[1,1,1],'blue':[96/254,138/240,189/220],'auburn':[0.62,0.36,0.23]},
 'renderContract':{'order':['weaponBehind','figure','weaponFront','gripOverlay','headgear'],
 'time':'floor milliseconds; negative clamps to zero; looping modulo duration; nonloop holds last frame',
 'origin':'source pixel (220,360) maps to world feet-centre ground point; mirror entire render about origin.x',
 'hair':'mask white = tint; mask black = unchanged. Figure hair is cream for both characters. outRGB = round(baseRGB*(1-mask/255+mask/255*tintRGB)); preserve alpha',
 'noAssembly':'Exactly one figure PNG includes head, hair, face, torso and limbs. No replaceable face, hair shape or body layers.',
 'equipment':'null weapon and empty headgear list render naked figure; hidden weapon for cast/sit/dead; grip overlay only when visible weapon is front',
 'attackContact':'attack_1 at [100,180) ms, includes exact 140 ms contact; hand angle 0 makes blade forward',
 'sampling':'no interpolation between animation frames; bilinear display sampling; round RGB half up'}}
 metrics=[]; annotations={}
 for cls in ['novice','swordsman']:
  sheet=clean_alpha(Image.open(R/f'source/{cls}-sheet.png'))
  cfg={'class':cls,'gender':'female' if cls=='novice' else 'male','defaultWeapon':'dagger' if cls=='novice' else 'sword',
       'defaultHairTint':'cream' if cls=='novice' else 'blue','frames':{}}
  manifest['characters'][cls+'_'+cfg['gender']]=cfg
  annotations[cls]={}
  for i,name in enumerate(FRAMES):
   row,col=divmod(i,4); xe=[0,313,627,940,1254]; ye=[0,330,643,951,1254]
   cell=(xe[col],ye[row]); box=(xe[col],ye[row],xe[col+1],ye[row+1])
   im=sheet.crop(box); head=HEADS[cls][i]; hand=HANDS[cls][i]
   mask=hair_mask(im,cls,head,cell)
   # Rebase blue hair to cream by a binary two-tone mapping before palette lock.
   if cls=='swordsman':
    data=list(im.getdata()); m=list(mask.getdata())
    for k,yes in enumerate(m):
     if yes:
      r,g,b,a=data[k]; c=palette['hairLight'] if g>=95 else palette['hairShadow']; data[k]=(*c,a)
    im.putdata(data)
   alpha=im.getchannel('A');im=im.filter(ImageFilter.MedianFilter(3));im.putalpha(alpha)
   im=quantize(im,colors)
   # Explicit hair fill mapping prevents cream patches quantizing as skin.
   pix=im.load(); mp=mask.load()
   for y in range(im.height):
    for x in range(im.width):
     if mp[x,y]:
      r,g,b,a=pix[x,y]; c=palette['hairLight'] if g>225 else palette['hairShadow']; pix[x,y]=(*c,a)
   bounds=im.getchannel('A').point(lambda a:255 if a>127 else 0).getbbox()
   # Uniform scale for the entire figure: no head/body splicing or independent scaling.
   anatomical_width=(head[3]-head[1]) if name=='dead_0' else head[2]-head[0]
   hb=mask.getbbox();hair_width=hb[3]-hb[1] if name=='dead_0' else hb[2]-hb[0]
   # Actual raster hair extent, rather than annotation width, controls scale.
   # Tilted hurt/followthrough bounds rotate; use the annotated correction there.
   scale=(164 if cls=='novice' else 160)/hair_width
   if name=='hurt_0' or (name in ('attack_2','cast_1') and cls=='novice'):scale=176/anatomical_width
   # Ground midpoint uses both boots rather than hand-extended total bounds.
   floor=im.getchannel('A').crop((0,max(0,bounds[3]-18),im.width,bounds[3])).point(lambda a:255 if a>127 else 0).getbbox()
   footx=(floor[0]+floor[2])/2 if name!='dead_0' else (bounds[0]+bounds[2])/2
   tx=ORIGIN[0]-footx*scale; ty=ORIGIN[1]-bounds[3]*scale
   inv=(1/scale,0,-tx/scale,0,1/scale,-ty/scale)
   figure=im.transform(SIZE,Image.Transform.AFFINE,inv,Image.Resampling.BICUBIC)
   hair=mask.transform(SIZE,Image.Transform.AFFINE,inv,Image.Resampling.NEAREST)
   # Resampling retains anti-alias blends only at colour boundaries. Re-locking
   # these pixels produces jagged eyes and contours, so do not quantize twice.
   hair=ImageChops.multiply(hair,figure.getchannel('A').point(lambda a:255 if a>127 else 0))
   top=(head[1]-cell[1])*scale+ty;bottom=(head[3]-cell[1])*scale+ty
   # A continuous whole-canvas mesh restores lineup head/body proportions.
   # It is not a pasted/replaced head: every pixel and anchor follows one map.
   mesh_enabled=name not in ('hurt_0','dead_0','attack_2')
   target_height={'idle_0':310,'idle_1':310,'walk_0':310,'walk_1':304,'walk_2':310,'walk_3':304,'cast_0':310,'cast_1':310}.get(name)
   alpha_top=figure.getchannel('A').point(lambda a:255 if a>127 else 0).getbbox()[1]
   dest_top=360-target_height+(top-alpha_top) if target_height else top
   dest_bottom=dest_top+181 if mesh_enabled else bottom
   def warp_y(y):
    if not mesh_enabled:return y
    if y<=top:return y*dest_top/top
    if y<bottom:return dest_top+(y-top)*(dest_bottom-dest_top)/(bottom-top)
    if y<ORIGIN[1]:return dest_bottom+(y-bottom)*(ORIGIN[1]-dest_bottom)/(ORIGIN[1]-bottom)
    return y
   if mesh_enabled:
    src=[0,round(top),round(bottom),360,400];dst=[0,round(dest_top),round(dest_bottom),360,400]
    mesh=[((0,dst[k],512,dst[k+1]),(0,src[k],0,src[k+1],512,src[k+1],512,src[k])) for k in range(4)]
    figure=figure.transform(SIZE,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
    hair=hair.transform(SIZE,Image.Transform.MESH,mesh,Image.Resampling.NEAREST)
    hair=ImageChops.multiply(hair,figure.getchannel('A').point(lambda a:255 if a>127 else 0))
   ground_shift=360-figure.getchannel('A').point(lambda a:255 if a>127 else 0).getbbox()[3]
   if ground_shift:
    figure=figure.transform(SIZE,Image.Transform.AFFINE,(1,0,0,0,1,-ground_shift),Image.Resampling.NEAREST)
    hair=hair.transform(SIZE,Image.Transform.AFFINE,(1,0,0,0,1,-ground_shift),Image.Resampling.NEAREST)
   # Cover bright resampling fringes beside the hair fill, while the thick dark
   # outline remains protected. This removes cream halos on dark tints.
   grown=hair.filter(ImageFilter.MaxFilter(3));hpix=hair.load();gpix=grown.load();fpix=figure.load()
   for yy in range(SIZE[1]):
    for xx in range(SIZE[0]):
     r,g,b,a=fpix[xx,yy]
     if gpix[xx,yy] and a>127 and r>175 and g>165 and b>145:hpix[xx,yy]=255
   def point(p): return [round((p[0]-cell[0])*scale+tx,3),round(warp_y((p[1]-cell[1])*scale+ty)+ground_shift,3)]
   hx,hy,hx1,hy1=head; hw=hx1-hx; hh=hy1-hy
   crown=(hx+hw*.54,hy+hh*.20);side=(hx+hw*.85,hy+hh*.48);angle=0
   if name=='attack_2': angle=12 if cls=='novice' else 0
   if name=='hurt_0':
    angle=-22; crown=(hx+hw*.40,hy+hh*.19);side=(hx+hw*.83,hy+hh*.48)
   if name=='dead_0':
    angle=-82; crown=(hx+hw*.18,hy+hh*.49);side=(hx+hw*.59,hy+hh*.83)
   hp=point(hand); visible=name.split('_')[0] not in ('cast','sit','dead')
   hand_angle=0 if name=='attack_1' else 42 if name=='attack_2' else -78 if name=='attack_0' else -48
   frame={'image':f'frames/{cls}/{name}.png','hairMask':f'masks/{cls}/{name}.png',
      'hand':{'point':hp,'angle':hand_angle,'z':'front','visible':visible},
      'crown':{'point':point(crown),'angle':angle},'side':{'point':point(side),'angle':angle}}
   if visible and frame['hand']['z']=='front':
    # A bounded copy of the painted front fist, not a replaceable anatomical layer.
    gm=Image.new('L',SIZE);ImageDraw.Draw(gm).ellipse((hp[0]-12*scale,hp[1]-12*scale,hp[0]+12*scale,hp[1]+12*scale),fill=255)
    grip=figure.copy();grip.putalpha(ImageChops.multiply(figure.getchannel('A'),gm))
    frame['gripOverlay']=f'grips/{cls}/{name}.png';save(grip,frame['gripOverlay'])
   cfg['frames'][name]=frame;save(figure,frame['image']);save(hair,frame['hairMask'])
   b=figure.getchannel('A').point(lambda a:255 if a>127 else 0).getbbox()
   head_box=[*point((hx,hy)),*point((hx1,hy1))]
   metrics.append({'character':cls,'frame':name,'scale':round(scale,5),'silhouetteBounds':b,'silhouetteHeight':b[3]-b[1],
     'headBox':head_box,'headWidth':round((head[2]-head[0])*scale,3),'headHeight':round(head_box[3]-head_box[1],3),
     'headCentre':[round((head_box[0]+head_box[2])/2,3),round((head_box[1]+head_box[3])/2,3)],
     'anatomicalHeadWidth':round(anatomical_width*scale,3),'hairMaskBounds':hair.getbbox(),'groundErrorPx':b[3]-ORIGIN[1]})
   annotations[cls][name]={'sourceCell':box,'sourceHeadBox':head,'sourceHand':hand,'scale':scale,'translation':[tx,ty],
     'wholeCanvasVerticalMap':{'enabled':mesh_enabled,'sourceHeadTopBottom':[top,bottom],'destinationHeadTopBottom':[dest_top,dest_bottom],'fixedGround':360},'rasterGroundShift':ground_shift}
 # Idle_1 is a very subtle deformation of the WHOLE idle_0 painting, locked feet.
 # This eliminates stochastic arm/face changes between generated idle cells.
 for cls in ['novice','swordsman']:
  cfg=manifest['characters'][cls+('_female' if cls=='novice' else '_male')]
  f0=cfg['frames']['idle_0'];f1=json.loads(json.dumps(f0));stretch=1.004
  for key in ['image','hairMask','gripOverlay']:
   im=Image.open(R/f0[key]); mode=Image.Resampling.NEAREST if key=='hairMask' else Image.Resampling.BICUBIC
   im=im.transform(SIZE,Image.Transform.AFFINE,(1,0,0,0,1/stretch,ORIGIN[1]*(1-1/stretch)),mode)
   f1[key]=f0[key].replace('idle_0','idle_1');save(im,f1[key])
  for key in ['hand','crown','side']: f1[key]['point'][1]=round(ORIGIN[1]+(f0[key]['point'][1]-ORIGIN[1])*stretch,3)
  cfg['frames']['idle_1']=f1
  m0=next(m for m in metrics if m['character']==cls and m['frame']=='idle_0');m1=next(m for m in metrics if m['character']==cls and m['frame']=='idle_1')
  m1.update(m0);m1['frame']='idle_1';m1['source']='idle_0 whole-figure breathing deformation'
  for k in ['headHeight']:m1[k]=round(m0[k]*stretch,3)
  m1['headCentre']=[m0['headCentre'][0],round(ORIGIN[1]+(m0['headCentre'][1]-ORIGIN[1])*stretch,3)]
  b=Image.open(R/f1['image']).getchannel('A').point(lambda a:255 if a>127 else 0).getbbox();m1['silhouetteBounds']=b;m1['silhouetteHeight']=b[3]-b[1]
 for name,grip,tip in [('dagger',(33,33),(163,33)),('sword',(46,37),(241,37))]:
  im=Image.open(R/f'source/{name}.png').convert('RGBA');im=im.resize((round(im.width/2),round(im.height/2)),Image.Resampling.LANCZOS)
  save(im,f'equipment/{name}.png');manifest['weapons'][name]={'image':f'equipment/{name}.png','pivot':[x/2 for x in grip],'tip':[x/2 for x in tip]}
 for name,anchor,pivot in [('leaf','crown',(24,41)),('hairpin','side',(34,20))]:
  im=Image.open(R/f'source/{name}.png').convert('RGBA');im=im.resize((round(im.width/2),round(im.height/2)),Image.Resampling.LANCZOS)
  save(im,f'equipment/{name}.png');manifest['headgear'][name]={'image':f'equipment/{name}.png','anchor':anchor,'pivot':[x/2 for x in pivot]}
 dump(manifest,'manifest.json');dump(metrics,'verification/drift.json');dump(annotations,'source/annotations.json')
 print('Built 28 whole figures, 28 masks, grip overlays and 4 equipment assets.')

if __name__=='__main__':main()
