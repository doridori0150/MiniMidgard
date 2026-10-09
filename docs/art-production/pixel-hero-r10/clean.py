"""Reproducible pixel cleanup of generated raster art, never limb geometry.

Selections are reviewed native-grid masks; operations are palette locking,
integer pixel translations, source-pixel copying, and recorded pixel edits.
No limb polygon drawing, affine rotation, smoothing, or resampled arm rigs.
"""
from pathlib import Path
from PIL import Image
import json, math
from inspect_source import sample, main as extract
R=Path(__file__).resolve().parent
SIZE=(128,120); CID='swordsman_female_p2'
P=[tuple(bytes.fromhex(s[1:]))+(255,) for s in json.loads((R/'source/design_palettes.json').read_text())['c']]
HK=[P[i] for i in (5,4,3,1)]
T=(0,0,0,0)
EDITS=[]
def blank(size=SIZE):return Image.new('RGBA',size)
def save(im,path):
    p=R/path;p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
def dump(path,obj):(R/path).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def recolor(p,colors):return min(colors,key=lambda c:sum((a-b)**2 for a,b in zip(c[:3],p[:3])))
def edit(im,name,x,y,p,why):
    if im.getpixel((x,y))!=p:
        EDITS.append({'asset':name,'xy':[x,y],'before':list(im.getpixel((x,y))),'after':list(p),'reason':why})
        im.putpixel((x,y),p)
def shift_selected(im,select,dx,dy):
    pts=[(x,y,im.getpixel((x,y))) for y in range(im.height) for x in range(im.width) if select(x,y) and im.getpixel((x,y))[3]]
    for x,y,p in pts:im.putpixel((x,y),T)
    for x,y,p in pts:
        if 0<=x+dx<im.width and 0<=y+dy<im.height:im.putpixel((x+dx,y+dy),p)
def remove_tiny(im,limit):
    pts={(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]}
    while pts:
        todo=[pts.pop()];g=[]
        while todo:
            x,y=todo.pop();g.append((x,y))
            for dx in (-1,0,1):
                for dy in (-1,0,1):
                    p=x+dx,y+dy
                    if p in pts:pts.remove(p);todo.append(p)
        if len(g)<=limit:
            for p in g:im.putpixel(p,T)
def canonical():
    src=Image.open(R/'source/design_c_idle.png').convert('RGBA')
    face=blank((32,28)); front=blank((32,28));back=blank((32,28))
    # Exact face boundary traced on design C; coordinates refer to original 64px tile.
    spans={19:(35,40),20:(34,40),21:(34,40),22:(34,41),23:(33,41),24:(33,41),25:(32,42),26:(30,43),27:(30,43),28:(29,43),29:(29,42),30:(29,43),31:(30,42),32:(30,41),33:(30,40),34:(31,39)}
    for y in range(10,38):
        for x in range(15,47):
            p=src.getpixel((x,y));lx,ly=x-15,y-10
            if not p[3]:continue
            isface=y in spans and spans[y][0]<=x<=spans[y][1]
            if isface:
                if p in [P[i] for i in (20,21,22,30)]:p=P[7] if x in (29,30,41,42,43) else P[9]
                if y<26 and p in (P[2],P[3]):p=P[7]
                if y in (28,30,31,33) and p in (P[4],P[5],P[29]):p=P[9]
                face.putpixel((lx,ly),p)
            elif y<35 or x<=30 or x>=40:
                q=recolor(p,HK)
                if p in (P[20],P[21],P[22]):q=P[3]
                (back if (y>=30 and x<29) or (y>=33 and x>=40) else front).putpixel((lx,ly),q)
            if isface and p!=src.getpixel((x,y)):
                EDITS.append({'asset':'canonical_up','xy':[lx,ly],'before':list(src.getpixel((x,y))),'after':list(p),'reason':'C 얼굴의 붉은 잡점과 피부 안의 머리색 오염 정리'})
    # Preserve C's face and eye positions, only close the eyes for pain/death.
    hurt=face.copy()
    for x0,x1 in [(15,19),(25,27)]:
        for y in range(16,21):
            for x in range(x0,x1+1):
                if hurt.getpixel((x,y))[3]:edit(hurt,'canonical_hurt',x,y,P[9],'동일 얼굴의 눈만 감은 표정')
    for x,y in [(15,18),(16,19),(17,19),(18,19),(19,18),(25,18),(26,19),(27,18)]:edit(hurt,'canonical_hurt',x,y,P[10],'감은 눈 1px 윤곽')
    heads={'up':face,'hurt':hurt,'down':hurt.transpose(Image.Transpose.ROTATE_90)}
    hairs={}
    pony=Image.open(R/'source/sampled/pony.png').convert('RGBA')
    tail=blank((16,29))
    for y in range(1,27):
        for x in range(0,13):
            p=pony.getpixel((x,y))
            if p[3]:tail.putpixel((x,y),recolor(p,HK))
    for style in ('wavy_p2','ponytail_p2'):
        f,b=front.copy(),back.copy()
        if style=='ponytail_p2':
            for y in range(18,28):
                for x in range(32):
                    if x<13 or x>=28:f.putpixel((x,y),T);b.putpixel((x,y),T)
        hairs[style]={}
        for pose in ('up','hurt','down'):
            for phase in (-1,0,1):
                ff,bb=blank((48,40)),blank((48,40))
                ff.alpha_composite(f,(8,2));bb.alpha_composite(b,(8,2))
                if style=='ponytail_p2':bb.alpha_composite(tail,(0,0))
                # Only the ends translate one integer pixel; fringe is invariant.
                if phase:
                    shift_selected(bb,lambda x,y:y>=22,phase,0)
                    shift_selected(ff,lambda x,y:y>=24 and (x<20 or x>35),phase,0)
                if pose=='down':
                    ff=ff.transpose(Image.Transpose.ROTATE_90);bb=bb.transpose(Image.Transpose.ROTATE_90)
                    if style=='ponytail_p2':
                        shift_selected(bb,lambda x,y:True,0,-9)
                        remove_tiny(bb,16)
                    local=(2,8) # top-left of transposed canonical 32x28 head inside 40x48 tile
                    for tile in (ff,bb):
                        for yy in range(40,tile.height):
                            for xx in range(tile.width):tile.putpixel((xx,yy),T)
                else:local=(8,2)
                layers={}
                for part,tile in [('front',ff),('back',bb)]:
                    out=blank((96,96));out.alpha_composite(tile,(48-local[0],48-local[1]))
                    path=f'hair/{style}/{pose}_{phase+1}_{part}.png';save(out,path);layers[part]=path
                hairs[style][f'{pose}_{phase+1}']=layers
    for name,im in heads.items():save(im,f'source/heads/{name}.png')
    save(front,'source/heads/wavy_front.png');save(back,'source/heads/wavy_back.png')
    return heads,hairs

# Reviewed painted-frame coordinates: head removal box, replacement head top,
# source hand/tip, placement on the R8 canvas. Not a skeleton or geometry rig.
M={
 'attack_0':dict(head=[13,6,37,33],hp=[4,3],at=[45,60],hand=[11,14],tip=[3,1],angle=-132),
 'attack_1':dict(head=[18,8,39,34],hp=[9,4],at=[43,60],hand=[15,4],tip=[16,0],angle=-80),
 'attack_2':dict(head=[0,8,35,33],hp=[2,4],at=[47,60],hand=[30,27],tip=[46,21],angle=-22),
 'attack_3':dict(head=[0,8,35,33],hp=[5,4],at=[47,60],hand=[29,36],tip=[45,43],angle=25),
 'attack_4':dict(head=[3,8,37,33],hp=[6,4],at=[48,60],hand=[32,36],tip=[48,44],angle=26),
 'attack_5':dict(head=[3,8,35,33],hp=[5,4],at=[45,60],hand=[17,40],tip=[29,49],angle=37),
}
W=[ # same source neck and ground anchors, eight independently painted bodies
 ([8,1,42,28],[9,1],[21,36],[39,48]),
 ([8,1,42,29],[9,3],[21,37],[37,48]),
 ([6,1,42,29],[8,1],[17,34],[36,48]),
 ([6,1,41,28],[8,0],[25,36],[39,48]),
 ([6,0,42,29],[8,1],[28,36],[43,46]),
 ([6,0,42,29],[8,3],[24,36],[39,46]),
 ([6,0,42,29],[8,1],[17,34],[37,48]),
 ([6,0,42,29],[8,0],[19,36],[36,46]),
]
for i,(h,hp,hand,tip) in enumerate(W):M[f'walk_{i}']=dict(head=h,hp=hp,at=[39,62],hand=hand,tip=tip,angle=round(math.degrees(math.atan2(tip[1]-hand[1],tip[0]-hand[0]))))
M.update({
 'hurt_0':dict(head=[5,6,38,32],hp=[5,6],at=[44,62],hand=[14,37],tip=[26,46],angle=37),
 'hurt_1':dict(head=[4,1,38,29],hp=[4,3],at=[46,62],hand=[15,37],tip=[26,48],angle=45),
 'sit_0':dict(head=[1,16,33,43],hp=[0,15],at=[45,61],hand=[24,48],tip=[38,50],angle=8),
 'dead_0':dict(head=[5,2,37,30],hp=[3,0],at=[43,75],hand=[18,31],tip=[36,35],angle=12),
 'dead_1':dict(head=[2,1,35,29],hp=[2,0],at=[41,76],hand=[18,31],tip=[31,34],angle=7),
 'dead_2':dict(head=[0,1,27,27],hp=[0,0],at=[39,80],hand=[29,23],tip=[46,26],angle=10),
 'dead_3':dict(head=[0,0,28,26],hp=[0,0],at=[38,80],hand=[29,21],tip=[48,25],angle=7),
})
def band(x,y,a,b,r=1.7):
    dx,dy=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy or 1)))
    return (x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2<=r*r
def main():
    extract();heads,hairs=canonical();frames={};weapons={};coords={}
    for anim,count in [('idle',4),('walk',8),('attack',6),('hurt',2),('dead',4),('sit',1)]:
        for i in range(count):
            name=f'{anim}_{i}';pose='hurt' if anim in ('hurt','dead') else 'up'
            if anim=='dead' and i>=2:pose='down'
            if anim=='idle':
                im=Image.open(R/'source/design_c_idle.png').convert('RGBA')
                m=dict(head=[15,10,47,38],hp=[15,10],at=[33,54],hand=[28,47],tip=[45,56],angle=28)
                # Restrained breathing: translate shoulder/chest pixels, feet fixed.
                bob=[0,-1,-1,0][i]
                if bob:shift_selected(im,lambda x,y:37<=y<=46 and not (x>=38 and y>=42 and im.getpixel((x,y)) in (P[20],P[21],P[22])),0,bob)
                if i in (2,3):shift_selected(im,lambda x,y:x>=38 and y>=42 and im.getpixel((x,y)) in (P[20],P[21],P[22]),1,0)
                m['hp']=[15,10+bob]
            else:
                im=Image.open(R/f'source/sampled/{name}.png').convert('RGBA');m=M[name].copy()
                if anim=='attack':m['at']=[m['at'][0],59]
                if name=='walk_3':
                    for xx in range(im.width):
                        for yy in range(50,im.height):edit(im,name,xx,yy,T,'앞 부츠 밑창의 1px 바닥선 돌출 정리')
            body=im.copy();weapon=blank(im.size);grip=blank(im.size);fx=blank(im.size)
            hx0,hy0,hx1,hy1=m['head']
            # Material-aware cleanup outside the selected head box avoids erasing raised gloves.
            for y in range(im.height):
                for x in range(im.width):
                    p=im.getpixel((x,y))
                    if not p[3]:continue
                    head=hx0<=x<hx1 and hy0<=y<hy1
                    keep_arm=(anim=='attack' and (
                        (i==0 and x<=18 and y>=22) or (i==1 and x<=23 and y>=24) or
                        (i==2 and x>=27 and y>=25 and p in [P[k] for k in (1,10,11,12,23,24,25,26)])
                    ))
                    keep_collar=head and y>=hy1-3 and p in [P[k] for k in (0,14,15,16,17,18,19)]
                    if head and not keep_arm and not keep_collar:body.putpixel((x,y),T)
                    isblade=band(x,y,m['hand'],m['tip'],2.5)
                    if anim=='attack' and i==1:isblade=False
                    isfx=anim=='attack' and i in (1,2,3,4,5) and p in (P[27],P[28],P[13],P[5],P[19],P[16],P[18]) and (
                        (i==1 and (y<8 or x>=38)) or
                        (i==2 and (y<8 or x>=36 and y<22)) or
                        (i==3 and x>=38 and y<43) or
                        (i==4 and ((40<=x<=44 and 27<=y<=34) or (x>=50 and 35<=y<=44))) or
                        (i==5 and x>=35 and y<40))
                    if isblade or isfx:
                        weapon.putpixel((x,y),P[27] if isfx and p==P[16] else P[28] if isfx and p==P[18] else p);body.putpixel((x,y),T)
                        if isfx:fx.putpixel((x,y),weapon.getpixel((x,y)))
                        if isfx and i==4 and (x,y) not in [(42,30),(43,31),(42,32),(51,39),(52,40),(51,41)]:
                            weapon.putpixel((x,y),T);fx.putpixel((x,y),T)
                    # Keep opaque authored glove pixels on top of the sword's hilt.
                    if band(x,y,m['hand'],m['hand'],2.0) and p in [P[k] for k in (1,10,11,12,23,24,25,26)]:
                        grip.putpixel((x,y),p);body.putpixel((x,y),p);weapon.putpixel((x,y),p)
            if anim=='idle' and i in (1,2):
                shift_selected(weapon,lambda x,y:True,0,-1)
                for gy in range(grip.height):
                    for gx in range(grip.width):
                        if grip.getpixel((gx,gy))[3]:body.putpixel((gx,gy),T)
                shift_selected(grip,lambda x,y:True,0,-1)
                body.alpha_composite(grip)
                m['hand']=[28,46];m['tip']=[45,55]
            if anim=='attack' and i==4:
                # Visually selected heel pixels: lift the heel, leave toe contact.
                shift_selected(body,lambda x,y:1<=x<=3 and 49<=y<=51,0,-2)
                edit(weapon,name,49,44,P[19],'타격 칼끝 1px 전방 과장')
                m['tip']=[49,44]
            if anim=='attack' and i in (3,4):
                # Native painted shin/boot cleanup: advance the front contact 3px,
                # with the existing thigh pixels following at 1/2px. No rotation.
                for y0,y1,dx in [(49,52,3),(45,48,2),(40,44,1)]:
                    shift_selected(body,lambda x,y:x>=(18 if y>=45 else 20) and y0<=y<=y1,dx,0)
            # Per-frame whole torso height corrections selected after sheet inspection.
            if anim=='walk':
                dy=[0,2,0,-1,0,2,0,-1][i]
                if dy:
                    shift_selected(body,lambda x,y:28<=y<34,0,dy)
            # Preserve original head artwork verbatim per expression/pose.
            out=blank();out.alpha_composite(body,tuple(m['at']))
            hp=[a+b for a,b in zip(m['hp'],m['at'])]
            if pose!='down':
                neck=Image.open(R/'source/design_c_idle.png').convert('RGBA').crop((31,35,39,39))
                out.alpha_composite(neck,(hp[0]+16,hp[1]+25))
            out.alpha_composite(heads[pose],tuple(hp))
            wo=blank();wo.alpha_composite(weapon,tuple(m['at']))
            go=blank();go.alpha_composite(grip,tuple(m['at']))
            if anim=='attack':
                fo=blank();fo.alpha_composite(fx,tuple(m['at']))
                if i==5:
                    for x,y,col in [(99,99,P[28]),(102,101,P[27])]:
                        edit(wo,name,x,y,col,'타격에서 분리되어 흩어지는 바람 잔여 1px');fo.putpixel((x,y),col)
                save(fo,f'source/fx_masks/{name}.png')
            phase=([0,0,-1,-1][i] if anim=='idle' else [0,0,-1,-1,1,1,0,0][i] if anim=='walk' else [0,0,-1,-1,-1,1][i] if anim=='attack' else 0)
            # Remove detached generated-head remnants from body (never wind from weapon).
            pts={(x,y) for y in range(out.height) for x in range(out.width) if out.getpixel((x,y))[3]}
            groups=[]
            while pts:
                q=[pts.pop()];g=[]
                while q:
                    x,y=q.pop();g.append((x,y))
                    for dx,dy in [(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]:
                        v=(x+dx,y+dy)
                        if v in pts:pts.remove(v);q.append(v)
                groups.append(g)
            for g in groups:
                if len(g)<=4 and all(y<hp[1]+25 and (x<hp[0] or x>hp[0]+31) for x,y in g):
                    for x,y in g:edit(out,name,x,y,T,'머리 교체 후 남은 원본 고립 픽셀 제거')
            bodypath=f'body/{CID}/{name}.png';wpath=f'weapons/sword/{CID}/{name}.png';gpath=f'grips/{CID}/{name}.png'
            save(out,bodypath);save(wo,wpath);save(go,gpath)
            hand=[a+b for a,b in zip(m['hand'],m['at'])];tip=[a+b for a,b in zip(m['tip'],m['at'])]
            angle=round(math.degrees(math.atan2(tip[1]-hand[1],tip[0]-hand[0])),2)
            frames[name]={'image':bodypath,'head':{'point':hp,'pose':f'{pose}_{phase+1}','basePose':pose},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':hand,'tipPoint':tip,'angleDegrees':angle},'grip':gpath}
            weapons[name]=wpath;coords[name]=m
    dump('source/pose_coordinates.json',coords);dump('source/pixel_edits.json',EDITS)
    dump('source/layer_index.json',{'frames':frames,'weapons':weapons,'hair':hairs,'hairKeys':['#'+bytes(p[:3]).hex() for p in HK]})
if __name__=='__main__':main()
