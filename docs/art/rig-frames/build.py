"""Reproducible extraction/normalization. Python stdlib + macOS raster.swift.
Generated source sheets are immutable; no network or model calls during rebuild.
"""
from pathlib import Path
import json, subprocess, math
R=Path(__file__).resolve().parent
J=[]
def process(file,source,rect,size=None,**kw):
    j=dict(op='process',file=file,source=source,rect=rect,**kw)
    if size:j['size']=size
    J.append(j)
def render(file,size,draws,**kw):J.append(dict(op='render',file=file,size=size,draws=draws,**kw))
def draw(file,x=0,y=0,s=1):return dict(file=file,matrix=[s,0,0,s,x,y])
# Intentional small fixed palette; resizing alone supplies antialiasing.
PAL=['3b281c','fff1d8','f3d1aa','f0b764','cf9247','835737','b4804c','64615e','dedddb','b8bec3','346aae','235080','b54737']
PALETTE=[[int(h[i:i+2],16) for i in (0,2,4)] for h in PAL]
HPAL=[[59,40,28],[255,243,220],[241,211,172]]
lineup='../concepts/round3/class_lineup.png'; hairs='source/hair_faces_normalized.png'
process(hairs,'../concepts/round3/hair_faces.png',[0,0,2100,749],[2048,730])
process('source/heads_normalized.png','source/heads_sheet.png',[0,0,2172,724],[2048,684])
process('source/novice_normalized.png','source/novice_sheet.png',[0,0,1274,1235],[1254,1254])
process('source/swordsman_normalized.png','source/swordsman_sheet.png',[0,0,1274,1234],[1254,1254])
headpoly=[[43,78],[225,78],[225,248],[204,263],[196,266],[193,245],[184,249],[170,254],[146,256],[121,256],[109,251],[97,247],[87,248],[77,252],[43,252]]
facepoly=[[115,194],[126,183],[138,165],[145,180],[158,190],[177,198],[177,183],[187,194],[188,216],[184,236],[179,244],[165,249],[143,251],[122,247],[117,228]]
# Hair front and back form a lossless partition of the approved bob silhouette.
hairbackpoly=[[43,204],[75,204],[79,245],[43,245]]
process('source/approved_head.png',lineup,[45,80,190,190],[380,380],keyGreen=True,include=headpoly)
process('assets/hair/01_front.png',lineup,[45,80,190,190],[380,380],keyGreen=True,include=headpoly,exclude=[facepoly,hairbackpoly],palette=HPAL)
process('assets/hair/01_back.png',lineup,[45,80,190,190],[380,380],keyGreen=True,include=hairbackpoly,exclude=[facepoly],palette=HPAL)
# One canonical bald base and expression-only overlays, shared by BOTH hair styles.
process('source/scalp.png','source/heads_normalized.png',[204,130,430,430],[258,266],palette=[[59,40,28],[255,229,199],[243,206,167]],eraseInkRects=[[365,374,85,99],[511,374,79,100],[443,481,71,38]])
process('source/skin.png',lineup,[150,220,4,4],[43,26],palette=[[255,229,199]])
render('assets/head_base.png',[380,380],[draw('source/skin.png',190,335),draw('source/scalp.png',66,81)])
normalpoly=[[123,192],[145,198],[145,222],[165,223],[165,201],[184,195],[183,227],[168,229],[164,241],[141,241],[141,227],[123,227]]
process('assets/faces/normal.png',lineup,[45,80,190,190],[380,380],faceInk=True,include=normalpoly)
face02=[[380,292],[397,292],[411,321],[412,282],[435,264],[453,239],[467,259],[492,273],[511,282],[503,260],[527,281],[540,289],[541,320],[555,320],[570,375],[340,375],[340,292]]
# Approved short spiky hair, nonuniform alignment maps original eyes to canonical eyes.
process('source/hair02_all.png',hairs,[350,160,215,210],[394,336],keyGreen=True,exclude=[face02],palette=HPAL)
# This style has no long back locks: a real back silhouette is the rear-left portion.
process('assets/hair/02_back.png','source/hair02_all.png',[0,0,394,336],None,include=[[0,135],[95,135],[112,320],[0,320]])
process('assets/hair/02_front.png','source/hair02_all.png',[0,0,394,336],None,exclude=[[[0,135],[95,135],[112,320],[0,320]]])
# Extract only generated expression ink; identical head_base and hair in every state.
process('assets/faces/hurt.png','source/heads_normalized.png',[960,385,235,131],[146,92],inkOnly=True,palette=[[59,40,28]])
process('assets/faces/ko.png','source/heads_normalized.png',[1563,385,235,131],[146,92],inkOnly=True,palette=[[59,40,28]])
# Reference lineup crops used only in comparison, never in the renderer.
for cls,rect in [('novice',[40,78,215,320]),('swordsman',[270,78,240,320])]:
    process(f'source/lineup_{cls}.png',lineup,rect,None,keyGreen=True)
# Idle is extracted from the approved source, not the generated approximation.
for cls,offset in [('novice',0),('swordsman',234)]:
    hp=[[x+offset,y] for x,y in headpoly]
    weapon=[[201+offset,299],[211+offset,280],[246+offset,231],[270+offset,234],[267+offset,280],[214+offset,321]]
    # Tight hand/guard boundary, leaving complete empty fist.
    weapon=[[189+offset,279],[200+offset,269],[270+offset,220],[280+offset,340],[210+offset,340],[206+offset,322],[211+offset,314],[211+offset,307],[205+offset,303],[204+offset,298],[196+offset,291],[190+offset,291]]
    process(f'assets/body/{cls}/idle_0.png',lineup,[55+offset,246,160,149],[320,298],keyGreen=True,exclude=[hp,weapon,[[182+offset,246],[217+offset,246],[217+offset,269],[182+offset,269]],[[55+offset,246],[116+offset,246],[116+offset,250],[55+offset,250]],[[210+offset,275],[230+offset,275],[230+offset,307],[210+offset,307]]])
# Reuse already approved independent equipment art (no cutout body parts).
for name,size in [('dagger',[167,64]),('sword',[246,74]),('leaf',[64,43]),('hairpin',[66,40])]:
    dims={'dagger':[76,29],'sword':[107,32],'leaf':[40,27],'hairpin':[33,20]}[name]
    process(f'assets/equipment/{name}.png',f'../rig-codex/parts/{name}.png',[0,0,*dims],size)
# Painted body sprites, one image per pose. All limbs stay baked into this image.
NAMES=['idle_0','idle_1','walk_0','walk_1','walk_2','walk_3','attack_0','attack_1','attack_2','cast_0','cast_1','sit_0','hurt_0','dead_0']
NECK=[(166,78),(480,78),(799,78),(1118,78),(164,361),(484,359),(800,365),(1119,365),(164,685),(484,669),(799,682),(1117,717),(132,951),(378,1060)]
HAND=[(236,169),(549,169),(878,146),(1207,124),(232,454),(571,455),(882,438),(1226,391),(276,774),(567,675),(873,661),(1180,781),(165,954),(457,1097)]
WORLD=[(400,454),(400,451),(400,454),(400,450),(400,454),(400,450),(394,456),(408,452),(412,460),(400,454),(400,450),(400,530),(391,461),(440,596)]
ANGLES=[-48,-48,-40,-32,-55,-58,-115,0,32,-80,-80,-15,-65,0]
HEADANGLES=[0,0,0,0,0,0,-3,2,4,-2,-2,0,-8,-55]
S=1.33
measurements=json.loads((R/'source/hand_measurements.json').read_text())
body_measurements={x['file']:x for x in json.loads((R/'source/body_measurements.json').read_text())}
classes={}
for cls in ['novice','swordsman']:
    frames={}
    measured_hands=next(x['points'] for x in measurements if cls in x['file'])
    for i,name in enumerate(NAMES):
        row,col=divmod(i,4);x=int(col*313.5);y=[0,314,620,910][row];w=314 if col<3 else 313;h=[314,306,290,344][row]
        path=f'assets/body/{cls}/{name}.png'
        sy=S
        if 2<=i<=12:
            # Normalize collar-to-ground height while preserving the painted pose.
            raw_bottom=body_measurements[path]['bounds'][3]/S
            sy=(725-WORLD[i][1])/(raw_bottom-(NECK[i][1]-y))
        outsize=[round(w*S),round(h*sy)]
        sx=outsize[0]/w;sy=outsize[1]/h
        pos=[round(WORLD[i][0]-(NECK[i][0]-x)*sx),round(WORLD[i][1]-(NECK[i][1]-y)*sy)]
        hp=measured_hands[i][:2] if i!=11 else [1031,817]
        grip=[round(WORLD[i][0]+(hp[0]-NECK[i][0])*sx),round(WORLD[i][1]+(hp[1]-NECK[i][1])*sy)]
        if i==1:
            outsize=[320,302];pos=[210,426];grip=[492,554]
            process(path,f'assets/body/{cls}/idle_0.png',[0,0,320,298],outsize)
        elif i!=0: process(path,f'source/{cls}_normalized.png',[x,y,w,h],outsize,palette=PALETTE,flatSkin=True)
        else:
            pos=[210,430];outsize=[320,298]
            grip=[492 if cls=='novice' else 492,556]
        frame=dict(body=path,bodyPosition=pos,bodySize=outsize,neck=dict(point=list(WORLD[i]),angle=HEADANGLES[i]),hand=dict(point=grip,angle=ANGLES[i]),weaponZ='front' if name.startswith('attack') else 'behind',weaponVisible=not name.startswith(('sit','dead','cast')),expression='hurt' if name.startswith('hurt') else 'ko' if name.startswith('dead') else 'normal')
        # A pose-specific overpaint of the actual fist hides the handle for a front weapon.
        if frame['weaponZ']=='front':
            cx=grip[0]-pos[0];cy=grip[1]-pos[1];rad=29
            patch=f'assets/grip/{cls}_{name}.png'
            process(patch,path,[cx-rad,cy-rad,rad*2,rad*2],None,include=[[cx-rad+6,cy-rad+6],[cx+rad-6,cy-rad+6],[cx+rad,cy],[cx+rad-6,cy+rad-5],[cx-rad+5,cy+rad-5],[cx-rad,cy]])
            frame['gripOverlay']=dict(file=patch,position=[grip[0]-rad,grip[1]-rad])
        frames[name]=frame
    classes[cls]=dict(frames=frames,defaultWeapon='dagger' if cls=='novice' else 'sword',defaultHairColor='cream' if cls=='novice' else 'blue')
animations={}
for state,durations,loop in [('idle',[800,800],True),('walk',[180]*4,True),('attack',[100,80,100],False),('cast',[360,360],True),('sit',[1],False),('hurt',[1],False),('dead',[1],False)]:
    animations[state]=dict(frames=[f'{state}_{i}' for i in range(len(durations))],durations=durations,duration=sum(durations),loop=loop,interpolation='step')
animations['attack']['events']=[dict(time=140,name='hit')]
M=dict(schema='minimidgard.frames/1',canvas=dict(size=[1024,800],origin=[400,725],referenceHeight=620,displayHeight=80,axes='x right, y down',angles='clockwise degrees'),classes=classes,animations=animations,head=dict(size=[380,380],neck=[210,356],base='assets/head_base.png',skullAnchors=dict(crown=[194,80],brow=[274,223],eyes=[230,266],mouth=[220,308]),faces={'normal':dict(file='assets/faces/normal.png',position=[0,0]),'hurt':dict(file='assets/faces/hurt.png',position=[145,228]),'ko':dict(file='assets/faces/ko.png',position=[145,228])}),hairStyles={'01':dict(front='assets/hair/01_front.png',back='assets/hair/01_back.png',position=[0,0]),'02':dict(front='assets/hair/02_front.png',back='assets/hair/02_back.png',position=[-33,26])},hairColors={'cream':None,'blue':[0.39,0.60,0.79],'brown':[0.65,0.43,0.27],'black':[0.35,0.36,0.38]},headgear={'leaf':dict(file='assets/equipment/leaf.png',anchor='crown',offset=[-18,-2],pivot=[24,41]),'hairpin':dict(file='assets/equipment/hairpin.png',anchor='brow',offset=[17,-52],pivot=[34,20])},weapons={'dagger':dict(file='assets/equipment/dagger.png',size=[167,64],grip=[33,33],tip=[163,33]),'sword':dict(file='assets/equipment/sword.png',size=[246,74],grip=[46,37],tip=[241,37])},renderContract=dict(order=['weaponBehind','body','headUnit','weaponFront','gripOverlay'],headUnitOrder=['hairBack','headBase','face','hairFront','headgear'],mirror='mirror completed assembly around canvas.origin.x',time='integer milliseconds; negative clamps to zero; loops modulo duration; nonloop holds last',head='compose once per equipment/expression selection; rigid rotation about head.neck only',tint='multiply only hair RGB with red > 127; preserve dark outline and alpha',nullEquipment='weapon=null skips weapon; headgear=[] skips decorations',unknownIds='error',units='source pixels; world scale = desired character height / referenceHeight'))
(R/'manifest.json').write_text(json.dumps(M,indent=2)+'\n')
(R/'source/extract_jobs.json').write_text(json.dumps(J,indent=2)+'\n')
subprocess.run([str(R/'.raster'),str(R),'source/extract_jobs.json'],check=True)
print(f'Built {len(J)} raster jobs / 28 body frames.')
