"""Build review artifacts and check actual PNGs, timing, transforms and masks."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops,ImageFilter
from collections import Counter
import json,math,statistics,csv
from player import M,R,draw_list,raster,render,select_frame,point

BG=(224,233,199,255);INK=(61,42,28)
FONT='/System/Library/Fonts/Supplemental/Arial.ttf'
def font(n):
 try:return ImageFont.truetype(FONT,n)
 except OSError:return ImageFont.load_default(size=n)
def board(size,title,sub=''):
 im=Image.new('RGBA',size,BG);d=ImageDraw.Draw(im);d.text((20,15),title,font=font(24),fill=INK)
 if sub:d.text((20,48),sub,font=font(14),fill=INK)
 return im
def label(im,xy,s,n=14):ImageDraw.Draw(im).text(xy,s,font=font(n),fill=INK)
def paste_figure(dst,im,x,ground,height):
 s=height/M['canvas']['referenceHeight'];im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
 dst.alpha_composite(im,(round(x-M['canvas']['origin'][0]*s),round(ground-M['canvas']['origin'][1]*s)))
def starts(state):
 t=0
 for dt in M['animations'][state]['durations']:yield t;t+=dt
def source(cls):
 im=Image.open(R/'source/approved-lineup.png').convert('RGBA')
 box=(40,80,245,397) if cls=='novice' else (274,77,503,397)
 im=im.crop(box);p=[]
 for r,g,b,a in im.getdata():p.append((r,g,b,0 if g>r-3 and g>b+9 else a))
 im.putdata(p);return im.crop(im.getbbox())

def previews():
 im=board((1120,920),'WHOLE FIGURE / APPROVED LINEUP','Same 310px reference height. Male uses a fixed short-hair adaptation. No runtime head assembly.')
 for ci,char in enumerate(M['characters']):
  cfg=M['characters'][char];y=90+ci*410;label(im,(24,y),char,20);ref=source(cfg['class']);save=R/f'source/lineup-{cfg["class"]}.png';ref.save(save)
  for h,x in [(240,180),(80,780)]:
   sc=h/ref.height;thumb=ref.resize((round(ref.width*sc),h),Image.Resampling.LANCZOS)
   im.alpha_composite(thumb,(round(x-thumb.width/2),y+280-h))
   paste_figure(im,render(character=char),x+230,y+280,h)
   label(im,(x-75,y+300),f'Approved / {h}px');label(im,(x+155,y+300),f'Pilot / {h}px')
 im.save(R/'preview_vs_lineup.png')
 # Each row is one frame. Every frame gets bare, equipped, and three tints.
 im=board((1250,80+28*185),'28 COMPLETE FIGURES / EQUIPMENT / HAIR TINTS','Columns: no equipment | weapon + leaf + star | cream | blue | auburn. All are the same whole-figure frame.')
 row=0
 for char,cfg in M['characters'].items():
  for state in M['animations']:
   for t in starts(state):
    frame=select_frame(state,t);y=80+row*185;label(im,(12,y+8),char,12);label(im,(12,y+27),f'{frame} / {t}ms',12)
    options=[dict(weapon=None,headgear=[]),dict(headgear=['leaf','hairpin']),*[dict(headgear=[],hair=h) for h in ['cream','blue','auburn']]]
    for col,opt in enumerate(options):paste_figure(im,render(character=char,state=state,time_ms=t,**opt),230+col*220,y+162,148)
    row+=1
 im.save(R/'preview_frames.png')
 # Anchor overlay on every frame, large enough for fist inspection.
 im=board((1400,80+7*410),'ANCHOR AUDIT / cyan hand, red crown, violet side','Every frame: both items follow annotated head tilt. Blue line is weapon grip-to-tip axis. Contact at 140ms is horizontal.')
 for ci,(char,cfg) in enumerate(M['characters'].items()):
  for i,(state,t) in enumerate((s,t) for s in M['animations'] for t in starts(s)):
   row,col=divmod(i,2);cx=175+(ci*2+col)*350;ground=80+row*410+348;sc=240/310
   frame=cfg['frames'][select_frame(state,t)];img=render(character=char,state=state,time_ms=t,headgear=['leaf','hairpin'])
   paste_figure(im,img,cx,ground,240);d=ImageDraw.Draw(im)
   def p(pt):return(cx+(pt[0]-220)*sc,ground+(pt[1]-360)*sc)
   for key,color in [('hand',(0,125,160)),('crown',(190,55,45)),('side',(131,64,190))]:
    x,y=p(frame[key]['point']);d.ellipse((x-3,y-3,x+3,y+3),fill=color)
   if frame['hand']['visible']:
    weapon=next(n for n in draw_list(char,state,t) if n['role']=='weapon');w=M['weapons'][cfg['defaultWeapon']]
    d.line([p(point(weapon['matrix'],w['pivot'])),p(point(weapon['matrix'],w['tip']))],fill=(0,125,160),width=1)
   label(im,(cx-145,ground+12),f'{char} / {select_frame(state,t)}',13)
 im.save(R/'verification/anchor_checks.png')
 frames=[]
 for tick in range(80):
  t=tick*20;im=board((1020,670),'DETERMINISTIC FRAME PLAYER','Idle 1600ms / walk 720ms / attack 280ms. Attack has 520ms rest between repetitions.')
  for ci,char in enumerate(M['characters']):
   for col,state in enumerate(['idle','walk','attack']):
    actual=state;tm=t
    if state=='attack':tm=t%800;actual='attack' if tm<280 else 'idle'
    paste_figure(im,render(character=char,state=actual,time_ms=tm,headgear=['leaf'] if ci==0 else ['hairpin']),165+col*340,340+ci*280,230)
    label(im,(70+col*340,350+ci*280),f'{char} / {state}',13)
  frames.append(im.convert('RGB').quantize(colors=128))
 frames[0].save(R/'preview_animation.gif',save_all=True,append_images=frames[1:],duration=20,loop=0,disposal=2)

def verify():
 failures=[];checks=0;max_grip=0;max_gear=0;bounds_fail=[];mask_leaks=[];palette_dist=[]
 pal=list(json.loads((R/'source/palette.json').read_text())['colors'].values());colors={tuple(p) for p in pal}
 for char,cfg in M['characters'].items():
  for state in M['animations']:
   for t in starts(state):
    name=select_frame(state,t);f=cfg['frames'][name];im=Image.open(R/f['image']).convert('RGBA');mask=Image.open(R/f['hairMask']).convert('L')
    assert im.size==mask.size==tuple(M['canvas']['size'])
    assert im.getchannel('A').getextrema()==(0,255)
    assert im.getchannel('A').point(lambda a:255 if a>127 else 0).getbbox()[3]==360,(char,name,'feet off ground')
    leaks=sum(1 for rgba,m in zip(im.getdata(),mask.getdata()) if m and rgba[3]<128)
    if leaks:mask_leaks.append([char,name,leaks])
    counts=Counter(rgb[:3] for rgb in im.getdata() if rgb[3]==255)
    off=sum(n for c,n in counts.items() if c not in colors)
    rgb=im.convert('RGB');lo=rgb.filter(ImageFilter.MinFilter(3));hi=rgb.filter(ImageFilter.MaxFilter(3))
    flat=Counter(c[:3] for c,l,h in zip(im.getdata(),lo.getdata(),hi.getdata()) if c[3]==255 and l==h)
    flat_off=sum(n for c,n in flat.items() if c not in colors)
    flat_beyond_rounding=sum(n for c,n in flat.items() if min(max(abs(c[k]-p[k]) for k in range(3)) for p in pal)>1)
    distance=sum(min(math.dist(c,p) for p in pal)*n for c,n in counts.items())/sum(counts.values())
    palette_dist.append({'character':char,'frame':name,'opaquePixels':sum(counts.values()),'antialiasOffPalettePixels':off,
     'flatInteriorPixels':sum(flat.values()),'flatInteriorOffPalettePixels':flat_off,'flatInteriorBeyondRoundingPixels':flat_beyond_rounding,'meanNearestPaletteRGBDistance':round(distance,4)})
    # Raster verification over all equipment, tints and directions; transparent
    # pixels outside canvas are detected on a padded canvas, not by asset rects.
    for weapon in [None,'dagger','sword']:
     for gear in [[],['leaf'],['hairpin'],['leaf','hairpin']]:
      for facing in [-1,1]:
       ds=draw_list(char,state,t,weapon,gear,facing=facing);checks+=1
       assert sum(d['role']=='figure' for d in ds)==1
       for d in ds:
        if d['role']=='weapon':
         expected=f['hand']['point'];expected=[440-expected[0],expected[1]] if facing==-1 else expected
         max_grip=max(max_grip,math.dist(point(d['matrix'],M['weapons'][weapon]['pivot']),expected))
        if d['role']=='headgear':
         g=next(g for g in M['headgear'].values() if g['image']==d['image']);expected=f[g['anchor']]['point'];expected=[440-expected[0],expected[1]] if facing==-1 else expected
         max_gear=max(max_gear,math.dist(point(d['matrix'],g['pivot']),expected))
       # Actual content corners transformed from the tight alpha bounding box.
       for d in ds:
        b=Image.open(R/d['image']).getbbox()
        pts=[point(d['matrix'],p) for p in [(b[0],b[1]),(b[2],b[1]),(b[0],b[3]),(b[2],b[3])]]
        if any(x<0 or x>512 or y<0 or y>400 for x,y in pts):bounds_fail.append([char,name,weapon,gear,facing,d['role']])
 for c in M['characters']:
  for w in M['weapons']:
   for facing in [-1,1]:
    d=next(d for d in draw_list(c,'attack',140,w,facing=facing) if d['role']=='weapon');a=point(d['matrix'],M['weapons'][w]['pivot']);b=point(d['matrix'],M['weapons'][w]['tip'])
    assert abs(b[1]-a[1])<1e-9 and (b[0]-a[0])*facing>0
 assert [select_frame('attack',t) for t in [-1,0,99,100,139,140,179,180,279,280,9999]]==['attack_0']*3+['attack_1']*4+['attack_2']*4
 for state in ['idle','walk','cast']:assert select_frame(state,0)==select_frame(state,M['animations'][state]['duration'])
 if mask_leaks:failures.append('hair-mask outside figure')
 if bounds_fail:failures.append('equipment or figure clips canvas')
 if any(p['flatInteriorBeyondRoundingPixels'] for p in palette_dist):failures.append('flat interior off-palette pixels beyond one RGB unit')
 report={'status':'PASS' if not failures else 'FAIL','configurations':checks,'maxGripTransformErrorPx':max_grip,'maxHeadgearTransformErrorPx':max_gear,
 'contact140ms':'PASS / both weapons, both characters, both directions','maskLeaks':mask_leaks,'boundsFailures':bounds_fail,'palette':palette_dist,'failures':failures}
 (R/'verification/checks.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k!='palette'},indent=2))
 return report

if __name__=='__main__':
 previews();report=verify()
 if report['failures']:raise SystemExit(1)
