#!/usr/bin/env python3
"""R8: original native-grid pixel drawings. Python 3 + Pillow; no source image reads.
All sprite geometry is rasterized at 1x. Only review outputs are enlarged (NEAREST).
Run: python build.py (writes only beside this script).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, hashlib, random
ROOT = Path(__file__).resolve().parent
SIZE = (128,120)
ORIGIN = (64,112)
P = {
 'ink':'#302D3D','deep':'#484052',
 'skin':'#F5D6AC','skinHi':'#FFE9C9','skinSh':'#D89C7F','skinDark':'#9B625D',
 'blue':'#476A94','blueHi':'#7296B7','blueSh':'#304564','blueLight':'#9DB8CF',
 'silver':'#B9CAD0','silverHi':'#EDF1E9','silverSh':'#8296A6','silverDark':'#536473',
 'red':'#B95555','redHi':'#E38170','redSh':'#793C49',
 'leather':'#795442','leatherHi':'#AE8157','leatherSh':'#513D39',
 'white':'#EEE5D2','whiteSh':'#BFB8AE',
 'gold':'#D8B47A','goldSh':'#957B55',
 'h0':'#F8F0E0','h1':'#E8D0B0','h2':'#C8A880','h3':'#8A6A50',
}
C = {k:tuple(bytes.fromhex(v[1:]))+(255,) for k,v in P.items()}
HAIR_KEYS=[P[f'h{i}'] for i in range(4)]
NAMES=['idle','walk','attack','hurt','dead','sit']
COUNTS=[4,8,8,2,4,1]
TIMES={'idle':[250]*4,'walk':[90]*8,'attack':[60,80,140,40,150,90,90,80], 'hurt':[80,160], 'dead':[80,100,140,1], 'sit':[1]}
FONT = ImageFont.load_default(size=12)
SMALL = ImageFont.load_default(size=10)

def blank(size=SIZE): return Image.new('RGBA',size)
def poly(im, points, fill, outline='ink'):
    ImageDraw.Draw(im).polygon([(round(x),round(y)) for x,y in points],fill=C.get(fill,fill),outline=C.get(outline,outline) if outline else None)
def line(im, points, fill, width=1):
    ImageDraw.Draw(im).line([(round(x),round(y)) for x,y in points],fill=C.get(fill,fill),width=width)
def rect(im, box, fill): ImageDraw.Draw(im).rectangle(tuple(round(v) for v in box),fill=C.get(fill,fill))
def dot(im,x,y,fill): im.putpixel((int(x),int(y)),C[fill])
def save(im,path):
    out=ROOT/path; out.parent.mkdir(parents=True,exist_ok=True); im.save(out)
def dump(path,obj): (ROOT/path).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def composite_at(im,part,pos): im.alpha_composite(part,tuple(round(x) for x in pos))
def limb(im, points, width, fill, hi=None):
    # Integer-grid articulated limb, with a single-pixel dark perimeter.
    for a,b in zip(points,points[1:]):
        dx,dy=b[0]-a[0],b[1]-a[1]; length=math.hypot(dx,dy) or 1
        nx,ny=-dy/length*(width/2),dx/length*(width/2)
        poly(im,[(a[0]+nx,a[1]+ny),(b[0]+nx,b[1]+ny),(b[0]-nx,b[1]-ny),(a[0]-nx,a[1]-ny)],fill)
    if hi: line(im,[(x-1,y) for x,y in points],hi,max(1,width-3))

DESIGN={
 'p2':dict(height=46,top=66,headH=20,headW=24,headX=52,neck=85,shoulder=87,waist=95,hip=99,knee=103,boot=106,arm=9,sword=21),
 'p3':dict(height=62,top=50,headH=18,headW=22,headX=53,neck=68,shoulder=71,waist=85,hip=92,knee=100,boot=103,arm=17,sword=29),
}

def head_native(v,expression='up'):
    d=DESIGN[v]; w,h=d['headW'],d['headH']; im=blank((32,32))
    # Crown and short base hair. No hairstyle outline is baked into the body.
    poly(im,[(5,0),(w-7,0),(w-3,2),(w-1,6),(w-1,12),(w-4,16),(7,16),(2,12),(1,6),(3,2)],'h2','h3')
    poly(im,[(5,3),(w-7,2),(w-3,4),(w-2,7),(w-2,h-7),(w-4,h-3),(w-8,h-1),(9,h-1),(5,h-4),(4,8)],'skin','skinDark')
    poly(im,[(7,5),(w-5,5),(w-3,8),(w-3,h-7),(w-7,h-3),(11,h-3),(7,h-6)],'skinHi',None)
    rect(im,(5,10,7,13),'skin'); dot(im,5,11,'skinSh')
    # Hairline framing the face, exactly four swap keys.
    poly(im,[(3,4),(7,1),(w-7,1),(w-3,4),(w-3,7),(w-6,5),(w-8,4),(w-11,8),(8,9),(7,13),(4,11)],'h1','h3')
    line(im,[(5,4),(9,2),(w-8,2)],'h0')
    eyeY=11 if v=='p2' else 10
    nearX=12 if v=='p2' else 11; farX=w-5
    if expression=='up':
        line(im,[(nearX-1,eyeY-2),(nearX+1,eyeY-2)],'skinDark')
        dot(im,farX,eyeY-2,'skinDark')
        rect(im,(nearX,eyeY,nearX+1,eyeY+2),'ink'); dot(im,nearX,eyeY,'silverHi')
        rect(im,(farX,eyeY,farX,eyeY+1),'ink')
    else:
        line(im,[(nearX-1,eyeY),(nearX+1,eyeY+1),(nearX-1,eyeY+2)],'ink')
        line(im,[(farX+1,eyeY),(farX-1,eyeY+1)],'ink')
    dot(im,w-4,eyeY+3,'skinSh')
    line(im,[(w-10,h-4),(w-9,h-4)],'skinDark')
    line(im,[(9,h-6),(10,h-6)],'skinSh')
    return im

def head_asset(v,pose):
    if pose=='down':
        # One canonical down head: exact integer quarter turn, no resampling.
        h=head_native(v,'hurt').crop((0,0,DESIGN[v]['headW'],DESIGN[v]['headH']))
        return h.transpose(Image.Transpose.ROTATE_90)
    return head_native(v,'hurt' if pose=='hurt' else 'up')

def hair_native(v,style,phase=0):
    d=DESIGN[v]; w,h=d['headW'],d['headH']; front=blank((40,40)); back=blank((40,40))
    # Local head top is (6,3), leaving room for a ponytail at screen left.
    def pp(im,pts,fill,out='h3'): poly(im,[(x+6,y+3) for x,y in pts],fill,out)
    def ll(im,pts,fill): line(im,[(x+6,y+3) for x,y in pts],fill)
    if style=='bob':
        pp(back,[(4,2),(w-6,1),(w-2,4),(w,9),(w-1,h-3),(w+phase,h+1+phase),(w-3,h+3+phase),(w-7,h+1),(5,h+3+phase),(1,h+1+phase),(-1+phase,h-4),(0,8)],'h2')
        pp(back,[(2,9),(6,5),(7,h-1),(4,h+1),(1+phase,h-2)],'h1',None)
        pp(back,[(w-4,7),(w-2,10),(w-3,h),(w-5,h+1),(w-6,h-2)],'h1',None)
        ll(back,[(2,11),(2,h-4),(3+phase,h-2)],'h0')
        ll(back,[(w-3,12),(w-4,h-2)],'h0')
    else:
        pp(back,[(1,6),(-2,7),(-4,11),(-4+phase,h-1),(-6+phase,h+5+phase),(-2+phase,h+4+phase),(2+phase,h),(3,12),(4,8)],'h2')
        pp(back,[(0,9),(-2,11),(-2+phase,h-2),(-4+phase,h+2),(-1+phase,h),(1,12)],'h1',None)
        ll(back,[(-1,10),(-2,14),(-2+phase,h-1)],'h0')
        pp(back,[(0,7),(3,7),(3,10),(0,10)],'h3')
    # Asymmetric, side-parted cream fringe: broad readable clusters, no dithering.
    pp(front,[(4,0),(w-8,0),(w-4,1),(w-1,4),(w,8),(w-2,11),(w-4,8),(w-6,4),(w-8,5),(w-11,8),(8,10),(6,13),(6,h-2+phase),(3,h+1+phase),(1+phase,h-2+phase),(2,11),(0,8),(1,4)],'h1')
    pp(front,[(5,2),(w-9,1),(w-7,2),(w-10,4),(8,7),(3,8),(2,6)],'h0',None)
    pp(front,[(w-6,3),(w-3,4),(w-1,7),(w-2,9),(w-4,6)],'h2',None)
    pp(front,[(3,10),(6,9),(5,13),(5,h-2),(3,h-1),(2+phase,h-3)],'h2',None)
    ll(front,[(4,11),(3,14),(3,h-3)],'h0')
    ll(front,[(7,7),(11,5),(w-9,3)],'h2')
    return front,back

HAIR={}; HEAD={}
def build_hair():
    for v in DESIGN:
        HEAD[v]={p:head_asset(v,p) for p in ('up','hurt','down')}
        for style in ('bob','ponytail'):
            sid=f'{style}_{v}'; poses={}
            for pose,phase in [('up',0),('up_lift',-1),('up_forward',1),('hurt',0),('down',0)]:
                front,back=hair_native(v,style,phase)
                # 96x96 and pivot match the existing pixel/1 hair contract.
                layers={}
                for name,part in [('front',front),('back',back)]:
                    canvas=blank((96,96))
                    if pose=='down':
                        part=part.transpose(Image.Transpose.ROTATE_90)
                        # rotation of full 40px tile: original head top maps to (3, 34-w)
                        loc=(48-3,48-(34-DESIGN[v]['headW']))
                    else: loc=(48-6,48-3)
                    composite_at(canvas,part,loc)
                    if pose=='down':
                        # Hair settles against the floor instead of rotating through it.
                        floor=48+DESIGN[v]['headW']-1
                        ImageDraw.Draw(canvas).rectangle((0,floor+1,95,95),fill=(0,0,0,0))
                        if name=='back' and style=='ponytail':
                            poly(canvas,[(39,floor-1),(42,floor-4),(49,floor-5),(54,floor-2),(49,floor),(39,floor)],'h1','h3')
                            line(canvas,[(42,floor-2),(47,floor-3),(51,floor-2)],'h0')
                    path=f'hair/{sid}/{pose}_{name}.png'; save(canvas,path); layers[name]=path
                poses[pose]=layers
            HAIR[sid]={'gender':'female','style':style,'proportion':v,'pivot':[48,48],'poses':poses}


def pose_data(v,anim,i):
    d=DESIGN[v]; p=dict(dx=0,dy=0,lean=0,near=(60,112),far=(69,112),nearK=0,farK=0,armSwing=0,farSwing=0,expression='up',hair='up',sash=0,angle=46,hand=None,mode='stand')
    if anim=='idle':
        p['dy']=[0,-1,-1,0][i]; p['hair']=['up','up','up_lift','up_lift'][i]
        p['sash']=[0,0,-1,-1][i]; p['angle']=[46,44,44,46][i]
    if anim=='walk':
        amp=6 if v=='p2' else 9
        # Near leg starts forward and far leg behind; swap on frame 5.
        stride=[amp,amp-2,0,-amp//2,-amp,-amp+2,0,amp//2]
        lift=[0,0,0,0,0,-2,-4,-3]
        p.update(dy=[0,1,0,-1,0,1,0,-1][i],lean=[1,1,0,-1,1,1,0,-1][i],
                 near=(63+stride[i],112+lift[i]),far=(65-stride[i],112+lift[(i+4)%8]),
                 nearK=[1,2,0,-1,-1,-2,3,4][i],farK=[-1,-2,3,4,1,2,0,-1][i],
                 armSwing=[-2,-1,0,1,2,1,0,-1][i],farSwing=[4,3,0,-3,-4,-3,0,3][i],
                 hair=['up','up_lift','up_lift','up','up','up_lift','up_lift','up'][i],
                 sash=[0,-1,-1,1,1,-1,-1,0][i],angle=[49,47,46,43,41,43,46,47][i])
    if anim=='attack':
        p.update(dx=[-1,-2,-3,0,4,5,1,0][i],dy=[0,0,-1,-1,1,2,1,0][i],lean=[-1,-2,-2,1,2,2,0,0][i],
                 near=[(59,112),(59,112),(62,109),(68,110),(74,112),(74,112),(66,112),(60,112)][i],
                 far=[(69,112),(67,112),(66,112),(63,112),(60,112),(61,112),(66,112),(69,112)][i],
                 hair=['up','up','up_forward','up','up','up_forward','up_forward','up'][i],sash=[0,-1,-2,-1,1,3,2,0][i])
        if v=='p2':
            p['hand']=[(53,95),(45,79),(44,77),(79,78),(74,92),(73,99),(61,97),None][i]
        else:
            p['hand']=[(51,87),(45,63),(44,60),(80,64),(78,85),(76,95),(62,91),None][i]
        p['angle']=[52,-115,-128,-43,15,31,41,46][i]
    if anim=='hurt':
        p.update(dx=[-3,-1][i],dy=[2,1][i],lean=-2,expression='hurt',hair='hurt',near=(58,112),far=(69,112),angle=34)
    if anim=='sit':
        p.update(mode='sit',dy=8 if v=='p2' else 14,near=(77,112),far=(70,110),expression='up',hair='up',angle=8)
    if anim=='dead':
        if i<2:
            p.update(mode='kneel',dx=-2-i*2,dy=(4 if v=='p2' else 7)+i*(4 if v=='p2' else 8),lean=-2,expression='hurt',hair='hurt',near=(72,112),far=(67,111),angle=20 if i==0 else 5)
        else:
            p.update(mode='fallen',expression='down',hair='down',dx=0,dy=0,angle=4 if i==2 else 0)
    return p


def draw_boot(im,x,y,near,v):
    h=6 if v=='p2' else 9; x,y=round(x),round(y)
    poly(im,[(x-3,y-h),(x+2,y-h),(x+2,y-3),(x+5,y-2),(x+5,y-1),(x-3,y-1)],'leather' if near else 'leatherSh')
    line(im,[(x-2,y-h+1),(x+1,y-h+1)],'leatherHi' if near else 'leather')
    line(im,[(x-2,y-h+2),(x-2,y-3),(x,y-2),(x+3,y-2)],'leatherHi' if near else 'leather')
    if v=='p3': line(im,[(x,y-h+3),(x-1,y-h+5)],'goldSh')

def draw_body(v,anim,i,p):
    d=DESIGN[v]; im=blank(); grip=blank(); wpn=blank()
    dx,dy,lean=p['dx'],p['dy'],p['lean']
    waist=d['waist']+dy; shoulder=d['shoulder']+dy
    sx=64+dx+lean; wx=64+dx
    farS=(sx+6,shoulder+1); nearS=(sx-7,shoulder)
    hand=p['hand'] or (sx-9+p['armSwing'],shoulder+d['arm'])
    if p['mode']=='fallen': return fallen(v,anim,i,p)
    # Far leg first. Trousers use their own neutral ramp, not hair swap keys.
    for near,key,offset in [(False,'far',3),(True,'near',-4)]:
        foot=p[key]; hip=(wx+offset,d['hip']+dy)
        ky=(hip[1]+foot[1]-5)//2
        knee=((hip[0]+foot[0])//2+p['nearK' if near else 'farK'],ky)
        if p['mode'] in ('sit','kneel'):
            hip=(wx+offset,min(d['hip']+dy,108)); knee=(wx+10 if near else wx+5,105 if near else 104)
        limb(im,[hip,knee,(foot[0],foot[1]-(5 if v=='p2' else 7))],5 if v=='p2' else 6,'white' if near else 'whiteSh','white' if near else None)
        draw_boot(im,*foot,near,v)
    # Far arm always remains on the far/right side of the chest.
    farH=(sx+9+max(-2,p['farSwing']),shoulder+d['arm']-1)
    if anim=='attack' and i<7: farH=(sx+9,shoulder+d['arm']-2)
    limb(im,[farS,(sx+9,shoulder+d['arm']//2),farH],4,'blueSh','blue')
    poly(im,[(farH[0]-2,farH[1]-2),(farH[0]+1,farH[1]-2),(farH[0]+2,farH[1]+1),(farH[0],farH[1]+3),(farH[0]-2,farH[1]+2)],'leatherSh')
    # Tunic: short split hem and a thin gold seam.
    hem=waist+(7 if v=='p3' else 5)
    poly(im,[(sx-7,shoulder-1),(sx+5,shoulder-1),(wx+6,waist-1),(wx+9,hem),(wx+2,hem+1),(wx-1,hem-1),(wx-3,hem+1),(wx-10,hem)],'blue')
    poly(im,[(sx-6,shoulder+2),(wx-2,waist),(wx-2,hem-1),(wx-8,hem-1)],'blueHi',None)
    poly(im,[(wx+2,waist),(wx+5,waist),(wx+7,hem-1),(wx+2,hem)],'blueSh',None)
    line(im,[(wx-8,hem-1),(wx-3,hem)],'gold')
    line(im,[(wx+3,hem),(wx+7,hem-1)],'goldSh')
    # Neck and upright breastplate retain the same screen orientation in all frames.
    rect(im,(sx-2,shoulder-3,sx+2,shoulder),'skinSh')
    poly(im,[(sx-5,shoulder),(sx-2,shoulder+2),(sx+2,shoulder+2),(sx+5,shoulder),(wx+5,waist-2),(wx+1,waist),(wx-5,waist-2)],'silver','silverDark')
    poly(im,[(sx-4,shoulder+2),(sx-1,shoulder+3),(wx,waist-2),(wx-4,waist-3)],'silverHi',None)
    poly(im,[(sx+3,shoulder+2),(sx+4,shoulder+2),(wx+4,waist-3),(wx+1,waist-1)],'silverSh',None)
    line(im,[(sx-3,shoulder+1),(sx+1,shoulder+2),(sx+4,shoulder+1)],'gold')
    if v=='p3': line(im,[(wx-2,waist-4),(wx,waist-3),(wx+2,waist-4)],'silverDark')
    # Burgundy sash over leather belt; knot and tails remain attached.
    rect(im,(wx-6,waist-1,wx+5,waist+1),'redSh')
    line(im,[(wx-5,waist),(wx+4,waist-1)],'redHi')
    rect(im,(wx-6,waist+2,wx+5,waist+3),'leatherSh')
    rect(im,(wx-1,waist+1,wx+2,waist+3),'gold'); rect(im,(wx,waist+2,wx+1,waist+2),'leatherSh')
    t=p['sash']
    poly(im,[(wx+4,waist),(wx+7,waist+1),(wx+8+t,hem+4),(wx+5+t,hem+2),(wx+4,waist+3)],'red','redSh')
    line(im,[(wx+5,waist+2),(wx+6+t,hem+1)],'redHi')
    if v=='p3':
        poly(im,[(wx-8,waist+2),(wx-4,waist+3),(wx-5,waist+8),(wx-9,waist+7)],'leather','leatherSh')
        dot(im,wx-6,waist+4,'gold')
    # Near arm articulated independently, sword always in this hand.
    elbow=((nearS[0]+hand[0])//2-1,(nearS[1]+hand[1])//2+1)
    if hand[1]<nearS[1]-4: elbow=(nearS[0]-4,(nearS[1]+hand[1])//2)
    limb(im,[nearS,elbow,hand],5 if v=='p2' else 6,'blue','blueHi')
    # Shoulder cap and lower gauntlet have clear metal/leather blocks.
    poly(im,[(nearS[0]-3,nearS[1]-2),(nearS[0]+1,nearS[1]-3),(nearS[0]+3,nearS[1]),(nearS[0]+1,nearS[1]+2),(nearS[0]-4,nearS[1]+1)],'silver','silverDark')
    line(im,[(nearS[0]-2,nearS[1]-1),(nearS[0]+1,nearS[1]-2)],'silverHi')
    mid=((elbow[0]+hand[0])//2,(elbow[1]+hand[1])//2)
    limb(im,[mid,hand],4,'leather','leatherHi')
    hx,hy=hand
    poly(im,[(hx-2,hy-2),(hx+1,hy-2),(hx+2,hy),(hx+1,hy+2),(hx-2,hy+1)],'leather','ink')
    # Fixed canonical face/head pasted last; its position is the head anchor.
    top=(d['headX']+dx+lean,d['top']+dy)
    if p['mode'] in ('kneel','sit'): top=(top[0],top[1]+1)
    composite_at(im,HEAD[v][p['expression']],top)
    if anim=='attack' and i==3:
        # One subdued, fully opaque sweep arc; attached to the blade, no loose particles.
        arc=[(39,60),(45,54),(53,51),(62,51),(72,54),(82,59),(95,63)] if v=='p2' else [(27,40),(36,33),(48,28),(60,28),(74,31),(88,36),(101,44)]
        line(wpn,arc,'silverSh')
    sword(wpn,grip,hand,p['angle'],d['sword'])
    return im,wpn,grip,top,hand,farH


def sword(im,grip,hand,angle,length):
    a=math.radians(angle); ux,uy=math.cos(a),math.sin(a); nx,ny=-uy,ux; x,y=hand
    def q(t,n=0):return (round(x+ux*t+nx*n),round(y+uy*t+ny*n))
    # Blade is a small cluster bounded by one dark pixel, not an antialiased line.
    poly(im,[q(4,-2),q(length-3,-1),q(length+1,0),q(length-3,2),q(4,2)],'silver','silverDark')
    line(im,[q(5,-1),q(length-3,0),q(length,0)],'silverHi')
    line(im,[q(5,1),q(length-4,1)],'silverSh')
    line(im,[q(3,-4),q(3,4)],'ink',3)
    line(im,[q(3,-3),q(3,3)],'gold',1)
    line(im,[q(-3),q(2)],'leatherSh',3)
    line(im,[q(-3),q(1)],'leatherHi',1)
    dot(im,*q(-4),'gold')
    # Fingers over the grip and one thumb over its near edge.
    line(grip,[q(-1,-1),q(-1,1)],'leatherHi')
    line(grip,[q(1,-1),q(1,1)],'leather')
    dot(grip,*q(0,-1),'leatherHi')


def fallen(v,anim,i,p):
    d=DESIGN[v]; im=blank(); wpn=blank(); grip=blank(); final=i==3
    hx=42 if v=='p2' else 36; hy=112-d['headW']
    if not final: hx+=5; hy-=5
    top=(hx,hy); head=HEAD[v]['down']; neckX=hx+d['headH']-1; cy=104 if final else 99
    torsoEnd=neckX+(13 if v=='p2' else 19)
    # Collapsed body lies screen-right of the canonical down head.
    for near,yy in [(False,cy-3),(True,cy+3)]:
        knee=(torsoEnd+8,yy+1); foot=(torsoEnd+15,111 if near else 108)
        limb(im,[(torsoEnd-1,yy),knee,(foot[0]-2,foot[1]-4)],5,'white' if near else 'whiteSh')
        draw_boot(im,*foot,near,v)
    poly(im,[(neckX-1,cy-6),(torsoEnd-3,cy-7),(torsoEnd+3,cy-4),(torsoEnd+4,cy+5),(torsoEnd-3,cy+7),(neckX-1,cy+6)],'blue')
    line(im,[(neckX+1,cy+4),(torsoEnd,cy+5)],'blueHi',2)
    poly(im,[(neckX,cy-5),(torsoEnd-5,cy-5),(torsoEnd-4,cy+3),(neckX+1,cy+4)],'silver','silverDark')
    line(im,[(neckX+1,cy-3),(torsoEnd-6,cy-3)],'silverHi',2)
    line(im,[(torsoEnd-3,cy-5),(torsoEnd-2,cy+5)],'red',3)
    line(im,[(torsoEnd-2,cy+5),(torsoEnd+4,cy+6)],'redHi')
    nearS=(neckX+1,cy+3); hand=(neckX+6,107 if final else 106)
    limb(im,[nearS,(neckX,cy+6),hand],5,'blue','blueHi')
    rect(im,(hand[0]-2,hand[1]-2,hand[0]+2,hand[1]+1),'leatherSh')
    composite_at(im,head,top)
    sword(wpn,grip,hand,p['angle'],d['sword'])
    return im,wpn,grip,top,hand,(torsoEnd,cy-3)

ANIMS={a:{'frames':[f'{a}_{i}' for i in range(n)],'durations':TIMES[a], 'duration':sum(TIMES[a]),'loop':a in ('idle','walk')} for a,n in zip(NAMES,COUNTS)}
ANIMS['cast']={**ANIMS['idle'],'reuse':'idle'}
ANIMS['dead']['holdLast']=True
ANIMS['sit']['holdLast']=True
M={'schema':'minimidgard.pixel/1','canvas':{'size':list(SIZE),'origin':list(ORIGIN),'bodyHeight':46},'animations':ANIMS,'hairKeys':HAIR_KEYS,'characters':{},'hair':HAIR,'weapons':{'sword':{'frames':{}}}}
IMAGES={}; META={}

def build_frames():
    for v,d in DESIGN.items():
        cid=f'swordsman_female_{v}'
        char={'class':'swordsman','gender':'female','bodyHeight':d['height'],'headHeight':d['headH'], 'proportion':round(d['height']/d['headH'],2),'defaultWeapon':'sword','defaultHair':f'bob_{v}','hairStyles':[f'bob_{v}',f'ponytail_{v}'],'animations':ANIMS,'frames':{}}
        M['characters'][cid]=char; M['weapons']['sword']['frames'][cid]={}; IMAGES[v]={}; META[v]={}
        for anim,n in zip(NAMES,COUNTS):
            for i in range(n):
                name=f'{anim}_{i}'; p=pose_data(v,anim,i)
                body,weapon,grip,top,hand,farH=draw_body(v,anim,i,p)
                paths={kind:f'{kind}/{cid}/{name}.png' for kind in ('body','grips')}
                wp=f'weapons/sword/{cid}/{name}.png'
                save(body,paths['body']); save(weapon,wp); save(grip,paths['grips'])
                char['frames'][name]={'image':paths['body'],'head':{'point':list(top),'pose':p['hair'],'basePose':p['expression']},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':list(hand),'angleDegrees':p['angle']},'grip':paths['grips']}
                M['weapons']['sword']['frames'][cid][name]=wp
                IMAGES[v][name]=(body,weapon,grip); META[v][name]={'pose':p,'headTop':list(top),'hand':list(hand),'farHand':list(farH)}
        for pose,img in HEAD[v].items():save(img,f'source/heads/{v}_{pose}.png')
    dump('manifest.json',M); dump('source/pose_coordinates.json',META)

RAMPS={'cream':HAIR_KEYS,'brown':['#D8B88A','#B08359','#785039','#46352F'],'black':['#8F96A8','#636C81','#424759','#292A39'],'pink':['#FFE0DA','#ECA6B2','#BD718E','#75485F']}
def swap(im,color):
    if color=='cream': return im
    keys=[C[f'h{i}'] for i in range(4)]
    vals=[tuple(bytes.fromhex(h[1:]))+(255,) for h in RAMPS[color]]
    lut=dict(zip(keys,vals)); out=im.copy();out.putdata([lut.get(q,q) for q in im.get_flattened_data()]);return out

def render(v,name,style='bob',color='cream'):
    f=M['characters'][f'swordsman_female_{v}']['frames'][name]
    hp=HAIR[f'{style}_{v}']['poses'][f['head']['pose']]
    top=f['head']['point']; loc=(top[0]-48,top[1]-48)
    out=blank()
    composite_at(out,swap(Image.open(ROOT/hp['back']).convert('RGBA'),color),loc)
    b,w,g=IMAGES[v][name]
    composite_at(out,swap(b,color),(0,0));out.alpha_composite(w);out.alpha_composite(g)
    composite_at(out,swap(Image.open(ROOT/hp['front']).convert('RGBA'),color),loc)
    return out

def text(im,xy,txt,fill='#D9E3EB',font=FONT):ImageDraw.Draw(im).text(xy,txt,font=font,fill=fill)
def checker(size):
    im=Image.new('RGBA',size,'#E8E4DB');dr=ImageDraw.Draw(im)
    for y in range(0,size[1],16):
        for x in range(0,size[0],16):
            if (x//16+y//16)%2:dr.rectangle((x,y,x+15,y+15),fill='#E0DED6')
    return im

def reviews():
    for v in DESIGN:
        names=list(IMAGES[v])
        cw,ch=408,420
        sheet=Image.new('RGB',(cw*7,ch*4+64),'#202C39')
        text(sheet,(18,12),f'COOKIE / {v.upper()} / {DESIGN[v]["height"]} PX / ALL 27 FRAMES / 4x NEAREST')
        text(sheet,(18,34),'01-04 IDLE | 05-12 WALK | 13-20 ATTACK | 21-22 HURT | 23-26 DEAD | 27 SIT',font=SMALL)
        for j,name in enumerate(names):
            x=j%7*cw;y=64+j//7*ch
            tile=checker((400,384));src=render(v,name).crop((20,24,120,120)).resize((400,384),Image.Resampling.NEAREST)
            tile.alpha_composite(src);sheet.paste(tile.convert('RGB'),(x+4,y+28))
            text(sheet,(x+9,y+7),f'{j+1:02d}  {name}   {TIMES[name.rsplit("_",1)[0]][int(name.rsplit("_",1)[1])]} ms')
        save(sheet,f'verification/review_{v}.png')
        # Individual motion rows are easier to inspect at native-size clusters.
        for anim,n in zip(NAMES,COUNTS):
            row=Image.new('RGB',(400*n,420),'#202C39')
            for i in range(n):
                tile=checker((400,384));tile.alpha_composite(render(v,f'{anim}_{i}').crop((20,24,120,120)).resize((400,384),Image.Resampling.NEAREST))
                row.paste(tile.convert('RGB'),(i*400,30));text(row,(i*400+10,8),f'{v.upper()} {anim} {i+1}/{n}')
            save(row,f'verification/rows/{v}_{anim}.png')
        frames=[]; durations=[]
        for anim,n in [('idle',4),('walk',8),('attack',8)]:
            for i in range(n):
                tile=Image.new('RGB',(384,396),'#DADDD2')
                sprite=render(v,f'{anim}_{i}').resize((384,360),Image.Resampling.NEAREST)
                tile.paste(sprite,(0,28),sprite);text(tile,(12,8),f'{v.upper()} {anim.upper()} {i+1}/{n}',fill='#302D3D')
                frames.append(tile);durations.append(TIMES[anim][i])
        frames[0].save(ROOT/f'verification/play_{v}.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=False,disposal=2)
    # Both styles and 3 palette swaps, each in three poses: 36 cells.
    poses=['idle_0','attack_2','dead_3']; cw,ch=260,280
    sheet=Image.new('RGB',(cw*6,ch*6+50),'#202C39')
    text(sheet,(15,14),'BROWN / BLACK / PINK  x  BOB / PONYTAIL  x  P2 / P3  x  IDLE / WIND-UP / DOWN')
    for row,(v,pose) in enumerate((v,p) for v in DESIGN for p in poses):
        for col,(style,color) in enumerate((s,c) for s in ('bob','ponytail') for c in ('brown','black','pink')):
            tile=checker((256,240));tile.alpha_composite(render(v,pose,style,color).resize((256,240),Image.Resampling.NEAREST))
            x=col*cw;y=50+row*ch;sheet.paste(tile.convert('RGB'),(x,y+30));text(sheet,(x+6,y+8),f'{v} {pose} {style} {color}',font=SMALL)
    save(sheet,'verification/hair_swap.png')
    # Native grass scene; background is an original procedural review backdrop, not a game capture.
    grass=Image.new('RGB',(900,380),'#536D48');dr=ImageDraw.Draw(grass);rng=random.Random(8)
    for y in range(380):
        t=y/380;dr.line((0,y,899,y),fill=(round(93-27*t),round(119-25*t),round(71-14*t)))
    for _ in range(4000):
        x=rng.randrange(900);y=rng.randrange(48,380);c=rng.choice(['#6C8150','#799156','#496743','#526B44'])
        dr.line((x,y,x+1,y-2),fill=c)
    text(grass,(24,18),'COOKIE / GAME-SIZE COMPARISON / ORIGINAL GRASS REVIEW BACKDROP')
    for j,(v,scale) in enumerate([('p2',1),('p3',1),('p2',2),('p3',2)]):
        x=[65,240,430,650][j];ground=290
        dr.ellipse((x+48*scale,ground-3*scale,x+83*scale,ground+4*scale),fill='#3F593D')
        sprite=render(v,'idle_0').resize((128*scale,120*scale),Image.Resampling.NEAREST)
        grass.paste(sprite,(x,ground-112*scale),sprite)
        text(grass,(x+30,320),f'{v.upper()}  {scale}x / {DESIGN[v]["height"]}px')
    save(grass,'verification/game_size.png')
    # Clean comparison for quick visual review.
    comp=Image.new('RGB',(760,440),'#E8E3D7')
    for v,x in [('p2',30),('p3',390)]:
        spr=render(v,'idle_0').resize((384,360),Image.Resampling.NEAREST);comp.paste(spr,(x-24,24),spr)
        text(comp,(x+110,400),f'{v.upper()} / {DESIGN[v]["height"]}px',fill='#302D3D')
    save(comp,'verification/proportions.png')

if __name__=='__main__':
    build_hair(); build_frames(); reviews()
    print('Built 54 frames, 162 full-canvas layers, 40 hair tiles, and all review images/GIFs.')
