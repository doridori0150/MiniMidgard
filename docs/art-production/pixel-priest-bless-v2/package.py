from register_frame import *
import hashlib,copy
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def dump(name,data):(R/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def main():
 orig=json.loads((S/'manifest.json').read_text());m=copy.deepcopy(orig);c=m['characters'][CID];a=orig['animations']['skill_bless'];names=a['frames'];dur=a['durations']
 # Approved endpoints are copied byte-for-byte; only three middle drawings are new.
 for i in [0,4]:
  n=names[i]
  for p in paths(n).values():
   dest=R/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(S/p,dest)
  shutil.copyfile(S/f'composite/{n}.png',R/f'composite/{n}.png')
 m['animations']={'skill_bless':a};m.pop('animationTransitions',None)
 c['animations']={'skill_bless':a};c['skillMotions']={k:v for k,v in c['skillMotions'].items() if v=='skill_bless'};c['frames']={n:c['frames'][n] for n in names}
 m['hair'][HID]['poses']={n:m['hair'][HID]['poses'][n] for n in names}
 m['weapons']['mace']['frames']={CID:{n:paths(n)['mace'] for n in names}}
 points={1:([68,92],[76,100]),2:([68,94],[78,107]),3:([71,95],[79,99])}
 for i,n in enumerate(names):
  f=c['frames'][n];f['pivot']=[64,112];f['sha256']=sha(R/f['image'])
  f['layerHashes']={k:sha(R/p) for k,p in paths(n).items()}
  f['head']['point']=[0,0]
  if i in points:
   g,t=points[i];f['weapon'].update(gripPoint=g,tipPoint=t,angleDegrees=round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2))
 dump('manifest.json',m)
 frames=[read(R/f'composite/{n}.png') for n in names];old=[read(S/f'composite/{n}.png') for n in names];BG=(36,49,61,255)
 def background(im):
  out=blank(*im[:2],BG);paste(out,im);return out
 pairs=[]
 for x,y in zip(old,frames):
  out=blank(256,120,BG);paste(out,x);paste(out,y,128);pairs.append(out)
 for scale in [1,4]:
  gif([resize(background(f),128*scale,120*scale) for f in frames],dur,R/f'skill_bless_{scale}x.gif')
  gif([resize(f,256*scale,120*scale) for f in pairs],dur,R/f'old_vs_v2_{scale}x.gif')
 sheet=blank(1280,240,BG)
 for i,f in enumerate(frames):paste(sheet,resize(f,256,240),i*256);number(sheet,i*256+6,6,i,2);number(sheet,i*256+40,6,dur[i],2)
 save(sheet,R/'skill_bless_contact_sheet.png')
 save(sheet,R/'contact_sheet.png')
 strip=blank(640,120)
 for i,f in enumerate(frames):paste(strip,f,128*i)
 save(strip,R/'skill_bless.png')
 p=blank(1024,480,BG);paste(p,resize(frames[3],512,480));paste(p,resize(frames[4],512,480),512);save(p,R/'verification/transition_3_4.png')
 # Keep workshop metadata and layer order identical to the approved production record.
 record=json.loads((S.parent.parent.parent/'asset-records/pixel-heroes/manifest.json').read_text())
 base=copy.deepcopy(next(s for s in record['sheets'] if s['id']==CID and s['kind']=='skill_bless'))
 record['sheets']=[base];record['source']='manifest.json';base['frames']=[]
 for i,n in enumerate(names):
  f=c['frames'][n];ps=paths(n)
  base['frames'].append({'name':n,'file':ps['body'],'pivot':[64,112],'duration':dur[i],'sha256':sha(R/ps['body']),'anchors':{'hand':{'point':f['weapon']['gripPoint'],'angle':f['weapon']['angleDegrees'],'z':'front','visible':True}},'overlays':{'weapon:mace':{'file':ps['mace'],'z':'front'},'grip':ps['grip'],'hair_back':ps['back'],'hair_front':ps['front']}})
 dump('workshop-manifest.json',record)
 dump('TRANSFORMS.json',{'tool':'image_gen.imagegen (built-in)','model':'tool does not expose exact backend model identifier','generatedFrames':[1,2,3],'preservedFrames':[0,4],'rawOriginals':[f'authored/skill_bless_{i}.png' for i in [1,2,3]],'exportTool':'Python 3 standard library + copied approved raster.py','sampling':'nearest neighbor','uniformScale':48/550,'registration':'registration.json','alphaThreshold':220,'palette':'original approved register.py BP, 28 colors; hair unchanged','protectedPixels':'body y<88 and y>=101, both entire hair layers; endpoint PNGs unchanged','changedRegion':'body x40..89 y88..100; weapon and grip','generatedImageCache':'Image generation service also saves its automatic original cache under CODEX_HOME; no project writes outside delivery folder. These service-managed files were not removed.','effects':'none; game draws light pillars separately','references':'references/hashes.json'})
 # Simple local viewer uses final PNGs at exact integer scaling and original timings.
 html='''<!doctype html><meta charset="utf-8"><title>프리스트 축복 v2</title><style>body{background:#24313d;color:#eee;font:16px sans-serif;margin:24px}img{image-rendering:pixelated;max-width:100%}button{padding:8px;margin:8px}a{color:#ffd78a}</style><h1>축복 v2 · 5장 / 600ms</h1><p>왼쪽: 승인된 현재 판 · 오른쪽: v2. GIF는 검토용 반복이며 실제 모션은 1회 재생합니다.</p><img src="old_vs_v2_4x.gif"><p><a href="skill_bless_1x.gif">1× GIF</a> · <a href="skill_bless_4x.gif">4× GIF</a> · <a href="NOTES.md">검수 기록</a></p><h2>프레임별 확인</h2><button onclick="step(-1)">이전</button><button onclick="step(1)">다음</button><span id="label"></span><br><img id="frame" width="512" height="480"><script>let i=0;const d=[100,140,160,100,100];function step(v){i=(i+v+5)%5;document.getElementById('frame').src='composite/skill_bless_'+i+'.png';document.getElementById('label').textContent=i+' / '+d[i]+'ms'}step(0)</script>'''
 (R/'preview.html').write_text(html)
 print('packaged',len(frames),'frames',sum(dur),'ms')
if __name__=='__main__':main()
