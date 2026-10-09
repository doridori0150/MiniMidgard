"""Validate deliverable contract, raster evidence, timing, and layer composition."""
from pathlib import Path
from PIL import Image,ImageChops
import hashlib,json,math
from build import render,TIMES,CID,VIEW
R=Path(__file__).resolve().parent
M=json.loads((R/'manifest.json').read_text());C=M['characters'][CID]
OK=[];FAIL=[]
def ck(value,name):(OK if value else FAIL).append(name)
def read(p):return Image.open(R/p).convert('RGBA')
def pts(im):return {(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]}
def components(im):
    rem=pts(im);groups=[]
    while rem:
        todo=[rem.pop()];g=[]
        while todo:
            x,y=todo.pop();g.append((x,y))
            for dx,dy in [(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]:
                p=x+dx,y+dy
                if p in rem:rem.remove(p);todo.append(p)
        groups.append(g)
    return sorted(groups,key=len,reverse=True)
def colors(im):return {p for p in im.get_flattened_data() if p[3]}
ck(M['schema']=='minimidgard.pixel/1','pixel/1 schema')
ck(M['canvas']['size']==[128,120] and M['canvas']['origin']==[64,112],'R8 canvas / origin')
ck(list(M['characters'])==[CID],'exactly one character ID')
ck(len(C['frames'])==25,'all 25 frames')
ck(set(M['animations'])==set(TIMES),'exact six requested animations')
for a,ds in TIMES.items():
    an=M['animations'][a]
    ck(an==C['animations'][a],a+' animation override matches global')
    ck(an['durations']==ds and len(an['frames'])==len(ds),a+' frame count and exact duration vector')
    ck(an['duration']==sum(ds),a+' total duration')
    ck(an['loop']==(a in ('idle','walk')),a+' correct loop behavior')
ck(M['animations']['attack']['hitFrame']==4,'hitFrame 4')
ck(M['animations']['attack']['duration']==430,'attack 430 ms')
ck(M['animations']['dead']['holdLast'] and M['animations']['sit']['holdLast'],'dead / sit hold last')
ck(C['hairStyles']==['wavy_p2','ponytail_p2'] and C['defaultHair']=='wavy_p2','default C hair and alternate ponytail')
hk={tuple(bytes.fromhex(h[1:]))+(255,) for h in M['hairKeys']}
ck(len(hk)==4,'four hair palette keys')
allcolors=set();frame_report={};file_paths=set()
review=Image.open(R/'verification/review.png').convert('RGB')
for row,(a,ds) in enumerate(TIMES.items()):
    hashes=[]
    for i in range(len(ds)):
        name=f'{a}_{i}';f=C['frames'][name];b=read(f['image']);wpath=M['weapons']['sword']['frames'][CID][name];w=read(wpath);g=read(f['grip'])
        file_paths.update([f['image'],wpath,f['grip']])
        for label,im in [('body',b),('sword',w),('grip',g)]:
            ck(im.size==(128,120),name+'/'+label+' native canvas')
            ck(set(im.getchannel('A').get_flattened_data())<={0,255},name+'/'+label+' binary alpha')
            ck(bool(im.getbbox()),name+'/'+label+' nonempty')
            allcolors|=colors(im)
        head=read('source/heads/'+f['head']['basePose']+'.png');hx,hy=f['head']['point']
        ck(all(b.getpixel((hx+x,hy+y))==head.getpixel((x,y)) for x,y in pts(head)),name+' identical canonical face pixels')
        ck(f['weapon']['hand']=='near' and f['weapon']['visible'],name+' near sword hand contract')
        overlap=len(pts(b)&pts(w)&pts(g));ck(overlap>=1,name+' authored finger / hilt overlap')
        style_bounds={}
        for style in C['hairStyles']:
            hair=M['hair'][style];hp=hair['poses'][f['head']['pose']]
            for part,path in hp.items():
                file_paths.add(path);im=read(path);allcolors|=colors(im)
                ck(im.size==(96,96),name+'/'+style+'/'+part+' 96px hair canvas')
                ck(colors(im)<=hk,name+'/'+style+'/'+part+' only four hair keys')
                ck(set(im.getchannel('A').get_flattened_data())<={0,255},name+'/'+style+'/'+part+' binary alpha')
            im=render(M,name,style);bb=im.getbbox();style_bounds[style]=bb
            ck(bb[0]>0 and bb[1]>0 and bb[2]<128 and bb[3]<120,name+'/'+style+' no clipping')
            ck(bb[0]>=VIEW[0] and bb[1]>=VIEW[1] and bb[2]<=VIEW[2] and bb[3]<=VIEW[3],name+'/'+style+' review contains all pixels')
            if style=='ponytail_p2' and name in ('dead_2','dead_3'):
                ck(len(components(im))==1,name+' no detached ponytail specks')
        composed=render(M,name);ck(composed.tobytes()==read('composite/'+name+'.png').tobytes(),name+' manifest reconstruction')
        hashes.append(hashlib.sha256(composed.tobytes()).hexdigest())
        expected=Image.new('RGB',(384,272),'#26323e');tile=composed.crop(VIEW).resize((384,272),Image.Resampling.NEAREST);expected.paste(tile,(0,0),tile)
        actual=review.crop((i*384,70+row*320+34,i*384+384,70+row*320+34+272))
        ck(actual.tobytes()==expected.tobytes(),name+' exact 4x nearest review pixels')
        frame_report[name]={'bounds':style_bounds,'fingerHiltOverlapPixels':overlap,'sha256Rgba':hashes[-1]}
    ck(len(set(hashes))==len(ds),a+' every frame distinct')
ck(len(allcolors)<=31,'palette stays within original 31 C colors')
standing=render(M,'idle_0').getbbox();ck(standing[3]-standing[1]==48,'original C idle 48px high')
# The blade overlaps the near boot; verify stationary underlying boot pixels.
boots=[read(C['frames'][f'idle_{i}']['image']).crop((54,106,74,112)).tobytes() for i in range(4)]
ck(all(s==boots[0] for s in boots),'idle boot pixels stationary')
fx_report={}
for i in range(6):
    im=read(f'source/fx_masks/attack_{i}.png');groups=components(im);counts=[len(g) for g in groups];fx_report[str(i)]=counts
    if i==0:ck(not groups,'anticipation no smear')
    if i in (1,2,3):ck(len(groups)==1 and counts[0]>=40,f'attack {i} single continuous smear component')
    if i==4:ck(len(groups)==2 and all(1<=n<=3 for n in counts),'impact only two 1-3px wind bits, no smear')
    if i==5:ck(len(groups)==2 and max(counts)==1,'recovery dissipated one-pixel wind bits')
angles=[]
for i in range(5):
    w=C['frames'][f'attack_{i}']['weapon'];a,b=w['gripPoint'],w['tipPoint'];angles.append(math.degrees(math.atan2(b[1]-a[1],b[0]-a[0])))
ck(all(a<b for a,b in zip(angles,angles[1:])),'annotated visible sword trajectory turns one way')
ck(20<=angles[4]<=30,'impact blade 20-30 degrees down')
gif=Image.open(R/'verification/play.gif');dur=[]
for i in range(gif.n_frames):gif.seek(i);dur.append(gif.info['duration'])
ck(gif.size==(288,240),'GIF 3x nearest viewport')
ck(dur==TIMES['idle']+TIMES['walk']+TIMES['attack'],'GIF exact real timing for all 18 frames')
ck(sum(dur)==2030,'GIF total 2030ms')
keys=Image.open(R/'verification/attack_keys.png').convert('RGB')
for i in range(6):
    exp=Image.new('RGB',(768,544),'#26323e');tile=render(M,f'attack_{i}').crop(VIEW).resize((768,544),Image.Resampling.NEAREST);exp.paste(tile,(0,0),tile)
    x=i%3*768;y=100+i//3*600
    ck(keys.crop((x,y,x+768,y+544)).tobytes()==exp.tobytes(),f'attack {i} exact 8x nearest key image')
for p in ['NOTES.md','PROMPTS.json','build.py','clean.py','inspect_source.py','requirements.txt']:
    ck((R/p).is_file(),p+' delivered')
report={'passed':not FAIL,'checksPassed':len(OK),'failures':FAIL,'paletteColors':len(allcolors),'frameCount':len(C['frames']),'gifDurationsMs':dur,'gifCycleMs':sum(dur),'fxComponentPixelCounts':fx_report,'annotatedBladeAnglesDegrees':angles,'frames':frame_report,'assetSha256':{p:hashlib.sha256((R/p).read_bytes()).hexdigest() for p in sorted(file_paths)},'limits':'Automated checks verify raster/contract evidence; motion readability and anatomy are separately visually reviewed, not certified by metadata.'}
(R/'verification/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':not FAIL,'checksPassed':len(OK),'failures':FAIL},ensure_ascii=False,indent=2))
raise SystemExit(bool(FAIL))
