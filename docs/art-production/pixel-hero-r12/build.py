"""R12: extract six independently painted frames, layer and package pixel/1.

Run with Python 3. No external libraries; original generation PNGs are retained.
Masks select painted pixels. They do not synthesize arms, blades or slash arcs.
"""
from pathlib import Path
import json,shutil,math,copy,hashlib
from raster import *
from sample import P,main as sample
R=Path(__file__).resolve().parent;OLD=R.parent/'pixel-hero-r10'
CID='swordsman_female_p2';SIZE=(128,120);HK=[P[i] for i in (5,4,3,1)]
BODY=[p for p in P if p not in HK]
TIMES=[90,40,60,100,70,70]
# Native sampled-grid annotations, verified against source/grid previews.
SPEC=[
 dict(hip=42,ground=70,target=62,head=(22,18,60,46),grip=(40,41),tip=(21,13)),
 dict(hip=44,ground=69,target=63,head=(20,19,60,48),grip=(62,40),tip=(58,12)),
 dict(hip=43,ground=69,target=66,head=(19,21,60,49),grip=(56,53),tip=(82,62)),
 dict(hip=45,ground=69,target=66,head=(22,21,62,49),grip=(58,55),tip=(78,65)),
 dict(hip=45,ground=70,target=65,head=(23,21,62,49),grip=(55,56),tip=(72,68)),
 dict(hip=45,ground=72,target=64,head=(24,21,61,50),grip=(55,58),tip=(70,70)),
]
FX=[(20,10),(90,10),(90,65),(77,65),(72,50),(64,36),(51,24),(40,20),(26,22),(20,22)]
HAIR_COLORS={P[i] for i in (0,1,2,3,4,5,29,30)}
def dump(path,obj):(R/path).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def safe_copy(path):
    dest=R/path;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(OLD/path,dest)
def sword_pixel(i,x,y):
    if i==0:
        spans={12:(20,22),13:(20,23),14:(20,24),15:(21,25),16:(21,26),17:(22,27),18:(23,28),19:(23,28),20:(24,29),21:(25,30),22:(25,30),23:(26,31),24:(27,32),25:(27,32),26:(28,33),27:(29,33),28:(29,34),29:(30,35),30:(31,35),31:(31,36),32:(32,37),33:(33,37),34:(33,38),35:(34,39),36:(34,39),37:(35,39),38:(34,39),39:(33,37),40:(34,37)}
        return y in spans and spans[y][0]<=x<=spans[y][1]
    if i==1:
        lo=56 if y==12 else 55 if 13<=y<=17 else 56 if 18<=y<=21 else 57 if 22<=y<=25 else 58 if 26<=y<=32 else 59 if 33<=y<=36 else 58
        return 12<=y<=37 and lo<=x<=66
    if i==2:return (x>=60 and y>=49) or inside(x+.5,y+.5,FX)
    if i==3:return x>=60 and y>=53
    if i==4:return x>=57 and y>=56
    return x>=57 and y>=58
def hair_pixel(i,x,y,p):
    x0,y0,x1,y1=SPEC[i]['head']
    if not(x0<=x<x1 and y0<=y<y1) or p not in HAIR_COLORS:return False
    if i==0 and x>=36 and y>=39 and x<50:return False # raised near glove / forearm
    # Collar, cheek, eye and nose shadow are body, never hair-colour keys.
    if i in (0,1) and y>=44 and 39<=x<=53:return False
    if i>=2 and y>=46 and 38<=x<=52:return False
    if i==1 and x>=55 and y>=42:return False
    if i==0 and 41<=x<=54 and 35<=y<=42:return False
    if i==1 and 40<=x<=54 and 35<=y<=43:return False
    if i==2 and 40<=x<=54 and 38<=y<=46:return False
    if i>=3 and 43<=x<=55 and 38<=y<=45:return False
    return True
def normalized(im,spec):
    # One uniform nearest-neighbour scale for all six source frames.
    w,h=round(im[0]*.95),round(im[1]*.95)
    out=blank(*SIZE);paste(out,resize(im,w,h),spec['target']-round(spec['hip']*w/im[0]),112-math.ceil(spec['ground']*h/im[1]-.5))
    return out
def point(p,s):
    width=76 if s in SPEC[:2] else 91;sx=round(width*.95)/width;sy=72/76
    return [round(p[0]*sx)+s['target']-round(s['hip']*sx),round(p[1]*sy)+112-math.ceil(s['ground']*sy-.5)]
def authored(i):
    src=read(R/f'source/attack_{i}_sampled.png');s=SPEC[i]
    layers={k:blank(src[0],src[1]) for k in ('body','hair','back','weapon','grip','fx')}
    for y in range(src[1]):
        for x in range(src[0]):
            p=get(src,x,y)
            if not p[3]:continue
            fx=i==2 and inside(x+.5,y+.5,FX)
            weapon=sword_pixel(i,x,y)
            if weapon:
                # Sword/fx must never use recolourable hair key RGBs.
                q=nearest(p,[P[j] for j in (0,13,14,16,17,18,19,23,24,25,27,28,30)])
                put(layers['weapon'],x,y,q)
                if fx:put(layers['fx'],x,y,q)
            elif hair_pixel(i,x,y,p):put(layers['hair'],x,y,nearest(p,HK))
            else:put(layers['body'],x,y,nearest(p,BODY))
    # Restore the hair hidden by the diagonal preparation blade in BACK only.
    # Neighbouring authored hair pixels provide the colour; the visible sword
    # still covers these pixels in the final composite.
    if i==0:
        for y in range(26,39):
            for x in range(28,40):
                if not get(layers['weapon'],x,y)[3]:continue
                left=[get(layers['hair'],x-d,y) for d in range(1,7) if get(layers['hair'],x-d,y)[3]]
                right=[get(layers['hair'],x+d,y) for d in range(1,7) if get(layers['hair'],x+d,y)[3]]
                if left and right:put(layers['back'],x,y,left[0])
    # Existing painted knuckles form the front-of-hilt overlay. Underlying body
    # retains the same glove so hiding a weapon cannot remove the hand.
    gx,gy=s['grip']
    for y in range(gy-1,gy+2):
        for x in range(gx-1,gx+2):
            p=get(layers['body'],x,y)
            if p[3] and p in [P[j] for j in (10,11,12,23,24,25,26)]:
                put(layers['grip'],x,y,p);put(layers['weapon'],x,y,p)
    return {k:normalized(v,s) for k,v in layers.items()}
def write_frame(m,name,layers,source_i):
    body=f'body/{CID}/{name}.png';weapon=f'weapons/sword/{CID}/{name}.png';grip=f'grips/{CID}/{name}.png'
    front=f'hair/wavy_p2/{name}_front.png';back=f'hair/wavy_p2/{name}_back.png'
    for k,path in [('body',body),('weapon',weapon),('grip',grip),('hair',front)]:save(layers[k],R/path)
    save(layers['back'],R/back);save(layers['fx'],R/f'source/fx_masks/{name}.png')
    s=SPEC[source_i];a=point(s['grip'],s);b=point(s['tip'],s)
    m['characters'][CID]['frames'][name]={'image':body,'head':{'point':[0,0],'pose':name,'basePose':'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':a,'tipPoint':b,'angleDegrees':round(math.degrees(math.atan2(b[1]-a[1],b[0]-a[0])),2)},'grip':grip}
    m['hair']['wavy_p2']['poses'][name]={'front':front,'back':back,'pivot':[0,0]}
    m['weapons']['sword']['frames'][CID][name]=weapon
def render(m,name,tint=None,weapon=True):
    f=m['characters'][CID]['frames'][name];h=m['hair']['wavy_p2'];hp=h['poses'][f['head']['pose']]
    pivot=hp.get('pivot',h['pivot']);xy=[a-b for a,b in zip(f['head']['point'],pivot)];out=blank(*SIZE)
    seq=[(hp['back'],xy),(f['image'],(0,0))]
    if weapon:seq += [(m['weapons']['sword']['frames'][CID][name],(0,0)),(f['grip'],(0,0))]
    seq += [(hp['front'],xy)]
    for path,at in seq:
        im=read(R/path)
        if tint and path.startswith(('hair/','body/')):
            im[2]=[tint[HK.index(p)] if p in HK else p for p in im[2]]
        paste(out,im,*at)
    return out
def shifted_selected(im,select,dx,dy):
    out=[im[0],im[1],im[2].copy()];pts=[]
    for y in range(im[1]):
        for x in range(im[0]):
            p=get(im,x,y)
            if p[3] and select(x,y):pts.append((x,y,p));put(out,x,y,T)
    for x,y,p in pts:put(out,x+dx,y+dy,p)
    return out
def preview(im,scale=1):
    out=blank(*SIZE,(38,50,62,255));paste(out,im)
    return resize(out,SIZE[0]*scale,SIZE[1]*scale)
def main():
    sample();m=json.loads((OLD/'manifest.json').read_text())
    m['characters'][CID]['hairStyles']=['wavy_p2'];m['hair']={'wavy_p2':m['hair']['wavy_p2']}
    copied=[]
    def collect(o):
        if isinstance(o,dict):
            for v in o.values():collect(v)
        elif isinstance(o,list):
            for v in o:collect(v)
        elif isinstance(o,str) and o.endswith('.png'):copied.append(o)
    collect(m)
    for path in set(copied):safe_copy(path)
    attack=[]
    for i in range(6):
        ls=authored(i);attack.append(ls);write_frame(m,f'attack_{i}',ls,i)
    # The end of the attack and idle_0 share exactly the same authored pose.
    for i in range(4):
        ls=copy.deepcopy(attack[5])
        if i in (1,2):
            for k in ('body','hair','back','weapon','grip'):
                ls[k]=shifted_selected(ls[k],lambda x,y:y<97,0,-1)
        if i in (2,3):
            ls['hair']=shifted_selected(ls['hair'],lambda x,y:y>=83 and x<59,-1,0)
        write_frame(m,f'idle_{i}',ls,5)
    m['animations']['attack']={'frames':[f'attack_{i}' for i in range(6)],'durations':TIMES,'duration':sum(TIMES),'loop':False,'hitFrame':2}
    m['animations']['idle']={'frames':[f'idle_{i}' for i in range(4)],'durations':[240,200,240,200],'duration':880,'loop':True}
    m['characters'][CID]['animations']=copy.deepcopy(m['animations'])
    dump('manifest.json',m)
    for name in m['characters'][CID]['frames']:save(render(m,name),R/f'composite/{name}.png')
    for anim in ('attack','idle','walk'):
        a=m['animations'][anim];frames=[render(m,n) for n in a['frames']]
        for scale in (1,4):gif([preview(f,scale) for f in frames],a['durations'],R/f'{anim}_{scale}x.gif')
    frames=[render(m,'idle_0')]+[render(m,f'attack_{i}') for i in range(6)]
    gif([preview(f,4) for f in frames],[440]+TIMES,R/'verification/attack_context_4x.gif')
    sheet=blank(3*384,2*324,(38,50,62,255))
    for i in range(6):
        tile=resize(crop(render(m,f'attack_{i}'),(24,32,128,116)),312,252)
        x=(i%3)*384;y=(i//3)*324;paste(sheet,tile,x+24,y+40);number(sheet,x+24,y+12,i,3);number(sheet,x+68,y+12,TIMES[i],3)
    save(sheet,R/'attack_contact_sheet.png')
    tint=[(224,238,255,255),(144,173,214,255),(86,105,150,255),(38,45,72,255)]
    check=blank(6*256,2*240,(38,50,62,255))
    for i in range(6):
        paste(check,preview(render(m,f'attack_{i}',tint=tint),2),i*256,0)
        paste(check,preview(render(m,f'attack_{i}',weapon=False),2),i*256,240)
    save(check,R/'verification/recolor_and_unarmed.png')
    # Provenance of unchanged motions. No import/build touches source folders.
    retained={}
    for path in sorted(set(copied)):
        if (R/path).read_bytes()==(OLD/path).read_bytes():retained[path]=hashlib.sha256((R/path).read_bytes()).hexdigest()
    dump('source/provenance.json',{'generator':'built-in image_gen','selectedSourceFiles':[f'source/attack_{i}_generated.png' for i in range(6)],'reference':'round9 design C','samplingGrids':'sample.py:GRIDS','uniformScale':.95,'retainedR10Files':retained,'changedAnimations':['attack','idle'],'unchangedAnimations':['walk','hurt','dead','sit']})
    print('Built: 25 frames; 6 attack / 4 idle revised; pixel/1; 1x and 4x GIFs.')
if __name__=='__main__':main()
