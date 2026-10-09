"""Pack individually generated artwork; no procedural character drawing.
Nearest-neighbour registration, palette mapping, semantic layer masks and previews.
Writes only beside this script. Python standard library, no installed dependencies.
"""
from pathlib import Path
import json, math, copy, sys
from raster import *

R = Path(__file__).resolve().parent
CID = 'mage_female_p2'
STYLE = 'waved_braid_mage_p2'
SIZE = (128,120)
BG = (37,49,62,255)
def palette(s): return [tuple(bytes.fromhex(c))+(255,) for c in s.split()]
HK = palette('faf0d7 e1cdb8 b49b91 49342f')
BP = palette('34232f 49333b 583a45 754159 98566b b77982 fff0d1 ffe1ba f4bc91 d68b70 a55651 fffff8 583419 8c5529 f5d58e d5ac58 916137')
WP = palette('34232f 49333b 583419 8c5529 b98046 f5d58e d5ac58 916137 23473e 417563 77ad91 b5dfbe effff2')
FX = palette('417563 77ad91 b5dfbe effff2')

# Source-space anchors: head centre x, head-neck y, ground y, destination neck,
# grip, crystal tip, butt end. Head width / body width share a fixed source scale.
# Vertically the body registers to the ground; head is registered separately.
S = {}
def spec(n,cx=638,neck=901,ground=1145,target=(64,89),g=(770,975),tip=(902,730),butt=(728,1045),**kw):
    S[n]=dict(cx=cx,neck=neck,ground=ground,target=list(target),grip=list(g),tip=list(tip),butt=list(butt),**kw)
spec('idle_0')
spec('idle_1',g=(768,975),tip=(889,727),butt=(723,1048))
spec('idle_2',ground=1140,g=(765,971),tip=(884,727),butt=(723,1044))
for i,ground,g,tip,butt,dy in [
 (0,1135,(761,969),(878,727),(724,1037),1),
 (1,1135,(761,962),(896,720),(720,1032),0),
 (2,1135,(760,958),(878,714),(729,1025),0),
 (3,1145,(766,972),(894,724),(720,1042),1),
 (4,1145,(762,950),(892,711),(721,1025),0),
 (5,1138,(764,966),(906,734),(724,1038),0)]:
    spec('walk_'+str(i),neck=887 if i==4 else 900,ground=ground,target=(64,89+dy),g=g,tip=tip,butt=butt)
spec('attack_0',g=(780,805),tip=(753,568),butt=(764,964))
spec('attack_1',cx=613,neck=905,target=(62,90),g=(695,680),tip=(524,533),butt=(879,851),custom=True)
spec('attack_2',cx=636,neck=894,target=(65,91),g=(774,895),tip=(922,741),butt=(676,990),custom=True,fx=True)
spec('attack_3',cx=666,neck=921,ground=1119,target=(67,94),g=(746,989),tip=(980,1104),butt=(646,940),custom=True,fx=True)
spec('attack_4',cx=663,neck=932,ground=1117,target=(67,95),g=(742,996),tip=(949,1099),butt=(658,953),custom=True)
spec('attack_5',cx=631,neck=890,ground=1115,target=(65,91),g=(728,960),tip=(954,916),butt=(705,965),custom=True)
spec('attack_6')
spec('cast_start_0',g=(734,951),tip=(797,721),butt=(697,1049))
spec('cast_start_1',g=(854,923),tip=(894,719),butt=(805,1040),fx=True)
spec('cast_0',cx=649,neck=902,g=(895,918),tip=(941,728),butt=(833,1044),target=(65,89),fx=True)
spec('cast_1',cx=643,neck=901,g=(887,913),tip=(934,724),butt=(828,1042),target=(65,89),fx=True)
spec('cast_2',cx=640,neck=901,g=(880,915),tip=(929,729),butt=(820,1042),target=(65,89),fx=True)
spec('hurt_0',cx=581,neck=919,target=(59,90),g=(785,980),tip=(931,762),butt=(754,1043),custom=True)
spec('hurt_1',cx=582,neck=922,target=(61,90),g=(774,994),tip=(927,786),butt=(737,1053),custom=True)
spec('dead_0',cx=674,neck=982,ground=1129,target=(66,100),g=(766,1040),tip=(918,1099),butt=(737,1027),custom=True)
spec('dead_1',cx=739,neck=1058,ground=1125,target=(70,106),g=(773,1090),tip=(1049,1091),butt=(691,1102),custom=True)
spec('dead_2',cx=793,neck=1090,ground=1121,target=(75,109),g=(858,1086),tip=(1121,1090),butt=(744,1096),custom=True)
spec('sit_0',cx=633,neck=914,ground=1137,target=(64,98),g=(746,1009),tip=(974,1101),butt=(535,994))

# Hair masks follow the visible head silhouette, excluding visible face and ears.
HEAD = {
 'base':[(472,631),(739,637),(779,741),(801,819),(786,873),(755,909),(694,913),(692,891),(636,891),(617,910),(558,905),(472,875)],
 'attack_1':[(443,658),(680,654),(704,714),(721,758),(780,776),(774,825),(717,883),(664,904),(568,925),(443,897)],
 'attack_2':[(470,652),(761,650),(789,779),(792,857),(758,883),(691,900),(649,890),(588,915),(476,874)],
 'attack_3':[(490,660),(746,653),(802,740),(820,850),(809,888),(777,939),(730,938),(718,901),(644,899),(603,901),(490,862)],
 'attack_4':[(491,677),(750,677),(800,772),(812,856),(788,911),(773,943),(729,943),(718,910),(628,910),(600,916),(490,870)],
 'attack_5':[(469,642),(710,642),(766,742),(781,847),(756,884),(749,905),(704,905),(681,876),(608,877),(568,887),(468,854)],
 'hurt_0':[(424,656),(640,653),(688,705),(746,794),(736,875),(678,913),(626,922),(579,939),(430,922)],
 'hurt_1':[(430,655),(642,655),(690,711),(747,802),(723,886),(672,916),(627,923),(574,938),(432,925)],
 'dead_0':[(511,724),(767,724),(814,814),(824,940),(794,982),(779,996),(737,990),(722,966),(653,970),(602,969),(512,927)],
 'dead_1':[(582,790),(827,790),(891,887),(898,1009),(881,1064),(846,1071),(808,1042),(755,1036),(710,1033),(688,1018),(589,974)],
 'dead_2':[(630,830),(883,831),(950,923),(960,1023),(949,1080),(898,1078),(869,1068),(802,1074),(751,1056),(686,1018),(630,991)]
}
FACE = {
 'base':[(660,737),(713,735),(724,764),(737,794),(738,848),(722,870),(698,883),(640,877),(614,860),(613,821),(629,812),(654,806)],
 'attack_1':[(624,748),(663,739),(681,771),(692,833),(681,853),(633,876),(591,872),(574,841),(568,803),(604,788)],
 'attack_2':[(669,753),(714,741),(735,782),(742,838),(732,868),(663,885),(632,873),(619,844),(626,820),(656,805)],
 'attack_3':[(712,773),(752,779),(751,816),(768,850),(743,896),(690,893),(653,879),(629,855),(637,835),(673,822)],
 'attack_4':[(708,790),(748,792),(747,824),(767,848),(743,897),(686,900),(646,879),(631,856),(643,834),(676,825)],
 'attack_5':[(666,747),(711,745),(720,784),(729,818),(711,857),(684,875),(633,873),(603,855),(596,818),(623,803)],
 'hurt_0':[(604,731),(643,730),(658,775),(682,800),(693,849),(659,873),(614,891),(578,882),(559,850),(566,820),(596,799)],
 'hurt_1':[(604,738),(643,735),(660,782),(681,803),(694,853),(656,880),(609,894),(577,881),(562,850),(565,825),(596,803)],
 'dead_0':[(714,842),(757,845),(763,877),(766,920),(746,959),(718,970),(659,954),(641,933),(648,908),(678,900)],
 'dead_1':[(801,918),(835,933),(843,964),(828,1007),(803,1033),(750,1022),(719,1001),(701,977),(713,955),(750,952)],
 'dead_2':[(859,962),(893,982),(890,1019),(864,1051),(829,1070),(784,1050),(756,1027),(768,1002),(805,1003)]
}

def dump(p,v):
    p=R/p;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def paths(n):
    return dict(body=f'body/{CID}/{n}.png',back=f'hair/{STYLE}/{n}_back.png',front=f'hair/{STYLE}/{n}_front.png',weapon=f'weapons/staff/{CID}/{n}.png',grip=f'grips/{CID}/{n}.png')
def compose(ls):
    im=blank(*SIZE)
    for k in ('back','body','weapon','grip','front'):paste(im,ls[k])
    return im
def in_head(n,x,y):return inside(x,y,HEAD.get(n,HEAD['base']))
def in_face(n,x,y,p):
    # Visible face polygon and warm salmon ear clusters belong to body.
    return inside(x,y,FACE.get(n,FACE['base'])) or (p[0]>p[1]*1.19 and p[1]>p[2]*1.17 and p[0]>160)
def point_segment(x,y,a,b):
    vx=b[0]-a[0];vy=b[1]-a[1];d=vx*vx+vy*vy
    t=((x-a[0])*vx+(y-a[1])*vy)/d if d else 0
    return math.hypot(x-(a[0]+max(0,min(1,t))*vx),y-(a[1]+max(0,min(1,t))*vy)),t

BASE_HEAD=None
def normalize(n):
    global BASE_HEAD
    s=S[n];src=read(R/f'sources/{n}.png');ls={k:blank(*SIZE) for k in paths(n)}
    cx=s['cx'];neck=s['neck'];ground=s['ground'];tx,ty=s['target']
    sxscale=48/512; syscale=(112-ty)/(ground-neck)
    # At extreme low poses retain source pixel scale for horizontal body, use
    # its true vertical fall without stretching the remaining narrow torso.
    if n.startswith('dead_'):syscale=sxscale
    def point(p):return [round((p[0]-cx)*sxscale+tx),round((p[1]-ground)*syscale+112)]
    g=point(s['grip']);tip=point(s['tip']);butt=point(s['butt'])
    other_hand={'attack_0':(755,906),'attack_1':(740,735),'attack_2':(739,927),'attack_3':(710,975),'attack_4':(706,979),'sit_0':(622,1008)}.get(n)
    hands=[s['grip']]+([other_hand] if other_hand else [])
    # Register body and weapon as one source first; independently lock upright
    # head afterwards so head scale never follows compressed seated legs.
    for y in range(120):
        sy=round((y+.5-112)/syscale+ground)
        for x in range(128):
            sx=round((x+.5-tx)/sxscale+cx);p=get(src,sx,sy)
            if p[3]<220:continue
            dist,t=point_segment(sx,sy,s['butt'],s['tip'])
            crystal=math.dist((sx,sy),s['tip'])<85
            staff=dist<33 or (t>.62 and dist<64) or (crystal and dist<75)
            # Distinct source green authored clusters include staff crystal
            # and spell effects; colors cannot be confused with plum cloth.
            mint=p[1]>p[0]*1.04 and p[1]>p[2]*1.02
            effect=s.get('fx') and (mint or (p[0]>220 and p[1]>235 and p[2]>225 and not in_head(n,sx,sy)))
            nearhand=any(math.dist((sx,sy),hand)<30 for hand in hands) and p[0]>160 and p[0]>p[1]*1.02 and p[1]>p[2]*1.08
            if in_head(n,sx,sy) and not nearhand and not staff:continue
            if effect: key='weapon';pal=FX
            elif nearhand:key='grip';pal=BP
            elif staff:key='weapon';pal=WP
            elif in_head(n,sx,sy) and not in_face(n,sx,sy,p):key='front';pal=HK
            else:key='body';pal=BP
            q=nearest(p,pal);put(ls[key],x,y,q)
            if key=='grip':put(ls['body'],x,y,q)
    # Independently sample the stable approved upright head (hair + face).
    if s.get('custom'):
        # The head keeps the same logical pixel scale in crouches and recovery.
        # Its tilt/expression is source-authored, not a scaled torso byproduct.
        for y in range(120):
            sy=round((y+.5-ty)/sxscale+neck)
            for x in range(128):
                sx=round((x+.5-tx)/sxscale+cx);p=get(src,sx,sy)
                if p[3]<220 or not in_head(n,sx,sy):continue
                d,t=point_segment(sx,sy,s['butt'],s['tip'])
                if d<33 or (t>.62 and d<64):continue
                face=in_face(n,sx,sy,p)
                k='body' if face else ('back' if sx<cx-55 and sy>neck-85 else 'front')
                put(ls[k],x,y,nearest(p,BP if face else HK))
    else:
        if BASE_HEAD is None:
            ref=read(R/'sources/idle_0.png');BASE_HEAD={k:blank(*SIZE) for k in ('body','back','front')}
            for y in range(64,90):
                sy=round((y+.5-89)/(48/512)+901)
                for x in range(45,82):
                    sx=round((x+.5-64)/(48/512)+638);p=get(ref,sx,sy)
                    if p[3]<220 or not in_head('base',sx,sy):continue
                    face=in_face('base',sx,sy,p)
                    k='body' if face else ('back' if sx<580 and sy>835 else 'front')
                    put(BASE_HEAD[k],x,y,nearest(p,BP if face else HK))
        for k in BASE_HEAD:paste(ls[k],BASE_HEAD[k],tx-64,ty-89)
    # Extract an explicit small grip overlay from authored hand pixels. The
    # underlying staff is extended beneath opaque fingers for robust overlap.
    for y in range(g[1]-2,g[1]+3):
        for x in range(g[0]-2,g[0]+3):
            p=get(ls['body'],x,y)
            if p[3] and p in BP[6:11]:put(ls['grip'],x,y,p)
    for y in range(120):
        for x in range(128):
            p=get(ls['grip'],x,y)
            if p[3]:
                put(ls['weapon'],x,y,nearest(p,WP))
                # Renderer draws front hair last: expose the authored fingers.
                put(ls['front'],x,y,T);put(ls['back'],x,y,T)
    return ls,g,tip,dict(sourceScaleX=sxscale,sourceScaleY=syscale,headLocked=not s.get('custom',False),neckTarget=[tx,ty],bounds=bounds(compose(ls)))

ANIMS={
 'idle':([240]*3,True), 'walk':([90]*6,True),
 'attack':([100,120,60,60,160,100,60],False),
 'cast_start':([100,120],False),'cast':([160]*3,True),
 'hurt':([90,170],False),'dead':([120,140,1000],False),'sit':([1000],False)
}
def onbg(im):
    b=blank(*SIZE,BG);paste(b,im);return b
def sheet(names,path,cols=5):
    out=blank(cols*384,math.ceil(len(names)/cols)*300,BG)
    for i,n in enumerate(names):
        x=i%cols*384;y=i//cols*300
        paste(out,resize(crop(read(R/f'composite/{n}.png'),(0,24,128,120)),384,288),x,y+12)
        number(out,x+8,y+5,i,2)
    save(out,R/path)
def export():
    m=dict(schema='minimidgard.pixel/1',canvas=dict(size=list(SIZE),origin=[64,112],bodyHeight=48),animations={},hairKeys=['#faf0d7','#e1cdb8','#b49b91','#49342f'],characters={},hair={},weapons={'staff':{'frames':{CID:{}}}})
    c=dict(class_='mage',gender='female',bodyHeight=48,headHeight=26,proportion=2,defaultWeapon='staff',defaultHair=STYLE,hairStyles=[STYLE],animations={},frames={});c['class']=c.pop('class_');m['characters'][CID]=c
    h=dict(gender='female',style='waved_braid_mage',proportion='p2',pivot=[0,0],poses={});m['hair'][STYLE]=h
    metrics={};allnames=[]
    for action,(ds,loop) in ANIMS.items():
        names=[f'{action}_{i}' for i in range(len(ds))];allnames+=names
        a=dict(frames=names,durations=ds,duration=sum(ds),loop=loop)
        if action=='attack':a['hitFrame']=3
        if action in ('dead','sit'):a['holdLast']=True
        m['animations'][action]=a;c['animations'][action]=copy.deepcopy(a)
        for n in names:
            ls,g,t,stat=normalize(n);pp=paths(n)
            for k,p in pp.items():save(ls[k],R/p)
            im=compose(ls);save(im,R/f'composite/{n}.png');metrics[n]=dict(**stat,grip=g,tip=t,layerPixelCounts={k:sum(p[3]>0 for p in v[2]) for k,v in ls.items()})
            c['frames'][n]=dict(image=pp['body'],head=dict(point=[0,0],pose=n,basePose='up'),weapon=dict(z='front',visible=True,hand='near',gripPoint=g,tipPoint=t,angleDegrees=round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)),grip=pp['grip'])
            h['poses'][n]=dict(front=pp['front'],back=pp['back'],pivot=[0,0]);m['weapons']['staff']['frames'][CID][n]=pp['weapon']
        frames=[onbg(read(R/f'composite/{n}.png')) for n in names]
        gif(frames,ds,R/f'{action}_1x.gif');gif([resize(f,512,480) for f in frames],ds,R/f'{action}_4x.gif')
        sheet(names,f'{action}_contact_sheet.png',min(5,len(names)))
    # Existing schema has no intro/loopStart reader; explicit transition data is
    # documentation for future integration, NOT a claim that runtime was changed.
    m['animationTransitions']={'cast_start':{'next':'cast'},'cast':{'repeat':'cast','finish':'idle'}}
    dump('manifest.json',m);dump('verification/metrics.json',metrics);dump('FRAME_INDEX.json',allnames)
    (R/'preview-data.js').write_text('window.MAGE_MANIFEST = '+json.dumps(m,ensure_ascii=False)+';\n')
    names=m['animations']['cast_start']['frames']+m['animations']['cast']['frames']*3
    ds=ANIMS['cast_start'][0]+ANIMS['cast'][0]*3
    for scale in (1,4):gif([resize(onbg(read(R/f'composite/{n}.png')),128*scale,120*scale) for n in names],ds,R/f'cast_sequence_{scale}x.gif')
    sheet(allnames,'contact_sheet.png')
    # Exact native-size comparison with the two approved reference exports.
    pair=blank(384,120,BG)
    for i,im in enumerate([read(R.parent/'pixel-hero-r12/composite/idle_0.png'),read(R.parent/'pixel-knight-r15/composite/idle_0.png'),read(R/'composite/idle_0.png')]):paste(pair,im,128*i,0)
    save(pair,R/'comparison_1x.png');save(resize(pair,1536,480),R/'comparison_4x.png')
    save(resize(onbg(read(R/'composite/idle_0.png')),512,480),R/'mage_idle_4x.png')
    print(json.dumps({n:{'bounds':v['bounds'],'grip':v['grip'],'counts':v['layerPixelCounts']} for n,v in metrics.items()},ensure_ascii=False))
if __name__=='__main__':export()
