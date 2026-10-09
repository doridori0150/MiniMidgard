"""Validate exported files, timing, semantic layers and independent GIF decode."""
from build import *
import hashlib

m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];checks=[]
def ck(ok,label):
    if not ok:raise AssertionError(label)
    checks.append(label)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
ck(m['schema']=='minimidgard.pixel/1','schema')
ck(m['canvas']==dict(size=[128,120],origin=[64,112],bodyHeight=48),'canvas and origin')
ck(set(m['characters'])=={CID},'only requested mage')
ck(c['class']=='mage' and c['gender']=='female','identity')
ck(c['defaultWeapon']=='staff' and set(m['weapons'])=={'staff'},'staff weapon type')
ck(c['animations']==m['animations'],'per-character animation table')
ck(set(c['animations'])==set(ANIMS),'all seven actions and casting intro')
ck(len(c['frames'])==27,'27 delivered frames')
report={}
for action,a in c['animations'].items():
    ck(len(a['frames'])==len(a['durations']),'durations count '+action)
    ck(sum(a['durations'])==a['duration'],'duration sum '+action)
    ck(a['durations']==ANIMS[action][0],'planned rhythm '+action)
    ck(a['loop']==ANIMS[action][1],'loop flag '+action)
for n,f in c['frames'].items():
    pp=paths(n);ls={k:read(R/p) for k,p in pp.items()}
    ck(f['image']==pp['body'] and f['grip']==pp['grip'],'body/grip references '+n)
    ck(m['weapons']['staff']['frames'][CID][n]==pp['weapon'],'weapon reference '+n)
    hp=m['hair'][STYLE]['poses'][n]
    ck(hp['front']==pp['front'] and hp['back']==pp['back'],'hair references '+n)
    for k,im in ls.items():
        ck(im[:2]==[128,120],'layer dimensions '+n+'/'+k)
        ck(all(p[3] in (0,255) for p in im[2]),'binary alpha '+n+'/'+k)
        ck(bounds(im) is not None,'nonempty '+n+'/'+k)
        if k in ('front','back'):ck({p for p in im[2] if p[3]}<=set(HK),'four hair key colors '+n+'/'+k)
        else:ck(not(set(im[2])&set(HK)),'hair tint isolated '+n+'/'+k)
    im=compose(ls);ck(im==read(R/f'composite/{n}.png'),'renderer-order reconstruction '+n)
    b=bounds(im);ck(0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,'unclipped '+n)
    ck(f['weapon']['hand']=='near','same declared grip hand '+n)
    g=f['weapon']['gripPoint'];ck(any(get(ls['grip'],x,y)[3] for x in range(g[0]-2,g[0]+3) for y in range(g[1]-2,g[1]+3)),'actual pixels at grip '+n)
    ck(any(a[3] and b[3] and d[3] for a,b,d in zip(ls['body'][2],ls['weapon'][2],ls['grip'][2])),'hand/staff/body overlap '+n)
    figure=blank(*SIZE)
    for k in ('back','body','front'):paste(figure,ls[k])
    fb=bounds(figure)
    if n.startswith(('idle_','walk_','cast_','hurt_','attack_')):ck(fb[3]==112,'grounded feet '+n)
    if n.startswith('idle_'):ck(fb[3]-fb[1]==48,'48px idle figure '+n)
    report[n]=dict(bounds=b,figureBounds=fb,sha256=sha(R/f'composite/{n}.png'))
for k,p in paths('attack_6').items():ck(read(R/p)==read(R/paths('idle_0')[k]),'exact idle return '+k)
a=c['animations']['attack'];hit=sum(a['durations'][:a['hitFrame']]);ck(a['hitFrame']==3 and hit==280,'impact at 280ms frame 3')
ck(.4<=hit/a['duration']<=.6,'impact near midpoint')
ck(a['durations'][4]>sum(a['durations'][2:4]),'held recovery longer than strike')
ck(not c['animations']['cast_start']['loop'] and c['animations']['cast']['loop'],'intro then sustained loop')
seams={}
for a in ('idle','walk','cast'):
    ns=c['animations'][a]['frames'];first=read(R/f'composite/{ns[0]}.png');last=read(R/f'composite/{ns[-1]}.png')
    union=sum(bool(x[3] or y[3]) for x,y in zip(first[2],last[2]));delta=sum(x!=y for x,y in zip(first[2],last[2]))
    adjacent=[]
    for p,q in zip(ns,ns[1:]):
        p=read(R/f'composite/{p}.png');q=read(R/f'composite/{q}.png')
        adjacent.append(sum(x!=y for x,y in zip(p[2],q[2]))/sum(bool(x[3] or y[3]) for x,y in zip(p[2],q[2])))
    seams[a]=dict(changedPixels=delta,unionPixels=union,ratio=round(delta/union,3),interiorRatios=[round(x,3) for x in adjacent])
    # A 1px head bob changes many detailed pixels. Compare the wrap with actual
    # in-cycle transitions, and independently constrain anatomical anchors.
    ck(delta/union<=max(adjacent)+.04,'wrap no larger than interior transitions '+a)
    ck(math.dist(S[ns[0]]['target'],S[ns[-1]]['target'])<=1,'loop head anchor '+a)
    ck(math.dist(c['frames'][ns[0]]['weapon']['gripPoint'],c['frames'][ns[-1]]['weapon']['gripPoint'])<=2,'loop grip anchor '+a)
    if a!='walk':ck(delta/union<.4,'quiet hold loop '+a)
decoded=json.loads((R/'verification/gif_decode.json').read_text());ck(len(decoded)==18,'18 independently decoded GIFs')
for f in decoded:
    name,scale=f['file'].removesuffix('.gif').rsplit('_',1)
    ds=ANIMS['cast_start'][0]+ANIMS['cast'][0]*3 if name=='cast_sequence' else ANIMS[name][0]
    ck(f['frames']==len(ds),'GIF frames '+f['file'])
    ck(len(f['durations'])==len(ds) and all(abs(x-y)<.01 for x,y in zip(f['durations'],ds)),'GIF timing '+f['file'])
    ck(all(size==([128,120] if scale=='1x' else [512,480]) for size in f['sizes']),'GIF dimensions '+f['file'])
baseline=json.loads((R/'verification/baseline_hashes.json').read_text())
for p,h in baseline.items():ck(sha(R.parents[2]/p)==h,'preserved external file '+p)
for scale in (1,4):ck(read(R/f'comparison_{scale}x.png')[:2]==[384*scale,120*scale],'comparison size '+str(scale))
ck((R/'sources/walk_3_rejected.png').is_file(),'rejected stride retained')
ck(len(json.loads((R/'FRAME_REVIEWS.json').read_text()))==28,'frame reviews including rejection and reused return')
dump('verification/validation.json',dict(passed=True,checksPassed=len(checks),frames=report,loopSeams=seams,hitWindowMs=[280,340],totalAttackMs=660,decodedGifCount=len(decoded),externalFilesPreserved=len(baseline),sourceTool='image_gen.imagegen',scope='제작 폴더만. 게임 적용 없음. cast_start 전환은 미리보기에 구현. 연결 브라우저가 없어 브라우저 시각 검수는 불가.'))
print(json.dumps(dict(passed=True,checksPassed=len(checks),frames=len(report),gifs=len(decoded),loopSeams=seams),ensure_ascii=False))
