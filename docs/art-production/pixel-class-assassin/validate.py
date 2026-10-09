"""Validate delivered assets, not the image-generation process. Python stdlib only."""
from pathlib import Path
import json, hashlib, math
from raster import read, blank, paste, bounds, get

R=Path(__file__).resolve().parent
m=json.loads((R/'manifest.json').read_text())
cid='assassin_male_p2';c=m['characters'][cid]
metrics=json.loads((R/'verification/frame_metrics.json').read_text())
checks=[]
def check(ok, label):
    if not ok: raise AssertionError(label)
    checks.append(label)

check(m['schema']=='minimidgard.pixel/1','schema')
check(m['canvas']['size']==[128,120] and m['canvas']['origin']==[64,112],'canvas / ground origin')
check(c['gender']=='male' and c['defaultWeapon']=='katar','identity / default weapon')
check(c['defaultHair'].startswith('assassin_'),'hair namespace')
keys={tuple(bytes.fromhex(h[1:]))+(255,) for h in m['hairKeys']}
check(keys=={(250,240,215,255),(225,205,184,255),(180,155,145,255),(73,52,47,255)},'hair keys')
expected={'sonic_blow','grimtooth','envenom','sand_attack','throw_stone','find_stone','venom_knife','venom_splasher','venom_dust','enchant_poison','poison_react','detoxify','hiding','cloaking','back_slide'}
check(set(c['skillMotions'])==expected,'all 15 skill mappings')
check(len(set(c['skillMotions'].values()))==12,'12 skill motions')
check({'idle','walk','attack','hurt','dead','sit','cast'}<=set(c['animations']),'7 base motions')
check(c['animations']['cast']['loop'],'looping cast')
hits={'skill_sonic','skill_grimtooth','skill_envenom','skill_scatter','skill_throw','skill_plant'}
check(set(c['frames'])==set(metrics),'metrics cover every frame')
used=[];comps={};weapon_differences=0;grip_distances={}
for name,a in c['animations'].items():
    check(a==m['animations'][name],name+' top-level animation agreement')
    check(len(a['frames'])==len(a['durations']) and sum(a['durations'])==a['duration'],name+' timing')
    check(all(d>0 and d%10==0 for d in a['durations']),name+' GIF timing precision')
    if name.startswith('skill_'):
        check(500<=a['duration']<=1000,name+' duration range')
        check(('hitFrame' in a)==(name in hits),name+' hit/no-hit type')
        if name in hits:check(sum(a['durations'][:a['hitFrame']])==130,name+' impact at 130 ms')
    used+=a['frames']
for n,f in c['frames'].items():
    hp=m['hair'][c['defaultHair']]['poses'][f['head']['pose']]
    p={'body':f['image'],'front':hp['front'],'back':hp['back'],'grip':f['grip']}
    p.update({w:m['weapons'][w]['frames'][cid][n] for w in ('katar','dagger')})
    layers={}
    for k,path in p.items():
        check((R/path).resolve().is_relative_to(R),n+'/'+k+' path containment')
        im=read(R/path);layers[k]=im
        check(im[:2]==[128,120],n+'/'+k+' size')
        check(all(px[3] in (0,255) for px in im[2]),n+'/'+k+' binary alpha')
        if k in ('front','back'):check(all(px in keys for px in im[2] if px[3]),n+'/'+k+' tint palette')
    for w in ('katar','dagger'):
        im=blank(128,120)
        for k in ('back','body',w,'grip','front'):paste(im,layers[k])
        actual=read(R/('composite/'+('dagger/' if w=='dagger' else '')+n+'.png'))
        check(im==actual,n+'/'+w+' exact layer composition')
        b=bounds(im);check(b and 0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,n+'/'+w+' no clipping')
        if w=='katar':comps[n]=im
    check(f['weapon']['hand']=='near',n+' fixed weapon hand metadata')
    if f['weapon']['visible']:
        g=f['weapon']['gripPoint']
        check(bounds(layers['grip']) is not None,n+' grip overlay present')
        for w in ('katar','dagger'):
            pts=[(i%128,i//128) for i,px in enumerate(layers[w][2]) if px[3]]
            d=min(math.dist(g,p) for p in pts);grip_distances[n+'/'+w]=round(d,3)
            check(d<=3,n+'/'+w+' grip connection')
        check(layers['katar']!=layers['dagger'],n+' distinct weapon artwork')
        weapon_differences+=1
    else:
        check(all(bounds(layers[k]) is None for k in ('katar','dagger','grip')),n+' release hides weapon')
check(len(used)==len(set(used))==111,'111 unique frame IDs')
for action in ('walk','attack'):
    a=c['animations'][action]
    hashes={hashlib.sha256(bytes(v for p in comps[n][2] for v in p)).hexdigest() for n in a['frames']}
    check(len(a['frames'])>=8 and len(hashes)>=8,action+' eight distinct drawings')
b=bounds(comps['idle_0']);check(b[3]-b[1]==48 and b[3]==112,'idle height 48 / feet at 112')
check(weapon_differences==109,'109 visible plus 2 release weapon pairs')
rejected=set(json.loads((R/'FRAME_REVIEWS.json').read_text())['rejected'])
check(not rejected & {v['source'] for v in metrics.values()},'rejected sources excluded')

# Check all sheet cells, including rows after the first, against the actual sprites.
index=json.loads((R/'contact_sheet_index.json').read_text())
for file,names,cols in [('contact_sheet.png',index['base'],6),('skills_contact_sheet.png',index['skills'],8)]+[(name+'_contact_sheet.png',a['frames'],min(6,len(a['frames']))) for name,a in c['animations'].items()]:
    sheet=read(R/file);check(sheet[:2]==[cols*256,math.ceil(len(names)/cols)*164],file+' dimensions')
    for i,n in enumerate(names):
        ox=i%cols*256;oy=i//cols*164+20
        for j,p in enumerate(comps[n][2]):
            x,y=j%128,j//128
            if p[3] and y>=48:
                check(get(sheet,ox+x*2,oy+(y-48)*2)==p,file+'/'+n+' body pixels')

# Apple ImageIO is an independent decoder, including the exported comparison GIFs.
decoded=json.loads((R/'verification/gif_decode.json').read_text())
check(len(decoded)==len(list(R.glob('*.gif')))==72,'72 GIFs independently decoded')
for row in decoded:
    file=row['file'];scale=4 if '_4x.gif' in file else 1
    name=file.replace('_4x.gif','').replace('_1x.gif','').replace('_dagger','')
    if name.startswith('attack_vs_'):
        a=c['animations']['attack'];b=c['animations'][name[len('attack_vs_'):]]
        ends={0}
        for ani in (a,b):
            t=0
            for d in ani['durations']:t+=d;ends.add(t)
        ends=sorted(ends);ds=[q-p for p,q in zip(ends,ends[1:])];width=256
    else:ds=c['animations'][name]['durations'];width=128
    check(row['frames']==len(ds),file+' frame count')
    check(all(abs(p-q)<.01 for p,q in zip(ds,row['durations'])),file+' decoded timing')
    check(all(s==[width*scale,120*scale] for s in row['sizes']),file+' decoded dimensions')
report={'status':'passed','checks':len(checks),'frameIDs':111,'layerPNGs':666,'composites':222,'GIFs':72,'skillMappings':15,'skillMotions':12,'idleBounds':b if isinstance(b,tuple) else bounds(comps['idle_0']),'maxGripDistance':max(grip_distances.values()),'scope':'asset package; no runtime integration'}
(R/'verification/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
