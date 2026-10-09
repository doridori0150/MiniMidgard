#!/usr/bin/env python3
"""Validate delivered PNG/GIF files and manifest; no game source is read/written."""
from pathlib import Path
from PIL import Image
import json, hashlib
ROOT=Path(__file__).resolve().parent
M=json.loads((ROOT/'manifest.json').read_text())
META=json.loads((ROOT/'source/pose_coordinates.json').read_text())
FAIL=[]; CHECKS=[]
def check(ok,msg):
    (CHECKS if ok else FAIL).append(msg)
def read(p):return Image.open(ROOT/p).convert('RGBA')
def colors(im):return {p for p in im.get_flattened_data() if p[3]}
def components(im):
    pts={(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]}
    out=[]
    while pts:
        start=pts.pop();group=[start];stack=[start]
        while stack:
            x,y=stack.pop()
            for dx,dy in [(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]:
                p=(x+dx,y+dy)
                if p in pts:pts.remove(p);group.append(p);stack.append(p)
        out.append(group)
    return sorted(out,key=len,reverse=True)
def render(c,name,style=None):
    f=c['frames'][name]; h=M['hair'][style or c['defaultHair']];hp=h['poses'][f['head']['pose']]
    loc=tuple(a-b for a,b in zip(f['head']['point'],h['pivot']))
    out=Image.new('RGBA',(128,120));out.alpha_composite(read(hp['back']),loc)
    out.alpha_composite(read(f['image']));out.alpha_composite(read(M['weapons']['sword']['frames'][cid][name]));out.alpha_composite(read(f['grip']))
    out.alpha_composite(read(hp['front']),loc);return out
check(M['schema']=='minimidgard.pixel/1','schema')
check(M['canvas']['size']==[128,120] and M['canvas']['origin']==[64,112],'canvas and origin')
expected={'idle':[250]*4,'walk':[90]*8,'attack':[60,80,140,40,150,90,90,80],'hurt':[80,160],'dead':[80,100,140,1],'sit':[1]}
keys={tuple(bytes.fromhex(s[1:]))+(255,) for s in M['hairKeys']}
file_report={};summary={}
for cid,c in M['characters'].items():
    v=cid.rsplit('_',1)[1];col=set()
    check(len(c['frames'])==27,f'{v}: all 27 frames')
    for a,ds in expected.items():
        anim=c['animations'][a]
        check(anim['durations']==ds and len(anim['frames'])==len(ds),f'{v}: {a} timing and count')
        check(anim['duration']==sum(ds),f'{v}: {a} total duration')
        check(anim['loop']==(a in ['idle','walk']),f'{v}: {a} loop')
    check(c['animations']['cast']['frames']==c['animations']['idle']['frames'],f'{v}: cast aliases idle')
    check(c['animations']['dead']['holdLast'] and c['animations']['sit']['holdLast'],f'{v}: dead/sit hold')
    canon={p:read(f'source/heads/{v}_{p}.png') for p in ['up','hurt','down']}
    head_checks=[];bounds=[];specks=[];hand_checks=[]
    for name,f in c['frames'].items():
        b=read(f['image']);w=read(M['weapons']['sword']['frames'][cid][name]);g=read(f['grip'])
        for kind,im in [('body',b),('sword',w),('grip',g)]:
            check(im.size==(128,120),f'{v}/{name}/{kind}: 128x120')
            check(set(im.getchannel('A').get_flattened_data())<={0,255},f'{v}/{name}/{kind}: binary alpha')
            col|=colors(im)
        top=f['head']['point'];base=canon[f['head']['basePose']]
        equal=all(b.getpixel((top[0]+x,top[1]+y))==base.getpixel((x,y)) for y in range(base.height) for x in range(base.width) if base.getpixel((x,y))[3])
        check(equal,f'{v}/{name}: canonical head exact');head_checks.append(equal)
        check(f['weapon']['hand']=='near',f'{v}/{name}: same sword hand')
        overlap=sum(1 for y in range(120) for x in range(128) if g.getpixel((x,y))[3] and w.getpixel((x,y))[3] and b.getpixel((x,y))[3])
        check(overlap>=2,f'{v}/{name}: fingers overlap grip and body');hand_checks.append(overlap)
        for style in c['hairStyles']:
            out=render(c,name,style);bbox=out.getbbox();cs=components(out)
            check(bbox is not None and bbox[0]>0 and bbox[1]>0 and bbox[2]<128 and bbox[3]<120,f'{v}/{name}/{style}: no canvas clipping')
            check(bbox[0]>=20 and bbox[1]>=24 and bbox[2]<=120 and bbox[3]<=120,f'{v}/{name}/{style}: review viewport includes all pixels')
            # A single connected silhouette includes the attached slash arc.
            tiny=[g for g in cs[1:] if len(g)<=3]
            check(not tiny,f'{v}/{name}/{style}: no isolated 1-3px specks')
            if tiny:specks.append({'frame':name,'style':style,'pixels':tiny})
            bounds.append({'frame':name,'style':style,'bbox':bbox,'components':[len(q) for q in cs]})
    for style in c['hairStyles']:
        for pose,hp in M['hair'][style]['poses'].items():
            for part,path in hp.items():
                im=read(path);col|=colors(im)
                check(colors(im)<=keys,f'{style}/{pose}/{part}: only 4 hair keys')
                check(im.size==(96,96),f'{style}/{pose}/{part}: 96x96')
                check(set(im.getchannel('A').get_flattened_data())<={0,255},f'{style}/{pose}/{part}: binary alpha')
    check(len(col)<=32,f'{v}: fixed palette <=32 ({len(col)})')
    standing=render(c,'idle_0');box=standing.getbbox()
    check(box[1]==112-c['bodyHeight'],f'{v}: standing height {c["bodyHeight"]}')
    check(2<=c['proportion']<=2.5 if v=='p2' else 3<=c['proportion']<=4,f'{v}: head proportion')
    feet=[META[v][f'idle_{i}']['pose']['near']+META[v][f'idle_{i}']['pose']['far'] for i in range(4)]
    check(all(q==feet[0] for q in feet),f'{v}: idle feet stationary')
    p0=META[v]['walk_0']['pose'];p4=META[v]['walk_4']['pose']
    check(p0['near'][0]>p0['far'][0] and p4['near'][0]<p4['far'][0],f'{v}: alternate lead foot')
    check([META[v][f'walk_{i}']['pose']['dy'] for i in range(8)]==[0,1,0,-1,0,1,0,-1],f'{v}: walk 2px peak-to-trough bob')
    check(all(META[v][f'attack_{i}']['pose']['angle']>=0 for i in range(4,8)),f'{v}: no second overhead lift after impact')
    check(read(c['frames']['idle_0']['image']).tobytes()==read(c['frames']['attack_7']['image']).tobytes(),f'{v}: attack returns exactly to idle body')
    gif=Image.open(ROOT/f'verification/play_{v}.gif');ds=[]
    for i in range(gif.n_frames):gif.seek(i);ds.append(gif.info['duration'])
    check(gif.size==(384,396) and gif.n_frames==20,f'{v}: 3x preview has 20 frames')
    check(ds==expected['idle']+expected['walk']+expected['attack'],f'{v}: GIF exact frame timing')
    summary[v]={'bodyHeight':c['bodyHeight'],'headHeight':c['headHeight'],'heads':c['proportion'],'colors':len(col),'palette':sorted('#'+bytes(q[:3]).hex().upper() for q in col),'canonicalHeadsExact':all(head_checks),'minFingerOverlapPixels':min(hand_checks),'bounds':bounds,'isolatedSpecks':specks,'gifDurationsMs':ds,'gifCycleMs':sum(ds)}
for p in sorted(ROOT.rglob('*.png')):
    if any(q.startswith('.') for q in p.relative_to(ROOT).parts):continue
    file_report[str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
report={'passed':not FAIL,'checksPassed':len(CHECKS),'failures':FAIL,'characters':summary,'pngSha256':file_report}
(ROOT/'verification/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':not FAIL,'checksPassed':len(CHECKS),'failures':FAIL},ensure_ascii=False,indent=2))
raise SystemExit(bool(FAIL))
