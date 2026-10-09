"""Validate delivered assets against the class brief and Apple GIF decode."""
from register import *
import re
m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID];aa=c['animations'];checks=[]
def check(ok,label):
 if not ok:raise AssertionError(label)
 checks.append(label)
expected=set(re.findall(r'^\| `([^`]+)`', (R.parent.parent/'art/class-briefs/wizard.md').read_text(), re.M))
check(set(c['skillMotions'])==expected and len(expected)==28,'28개 스킬 모두 연결')
check(m['schema']=='minimidgard.pixel/1' and m['canvas']['size']==[128,120] and m['canvas']['origin']==[64,112],'스키마·캔버스·발 기준점')
check(len(aa)==18 and len({v for v in c['skillMotions'].values()})==10,'기본 8종·스킬 10종')
check(HAIR.startswith('wizard_') and m['hairKeys']==['#'+h for h in HK],'직업 머리 이름과 네 색')
for n,f in c['frames'].items():
 h=m['hair'][HAIR]['poses'][f['head']['pose']];wp=m['weapons']['staff']['frames'][CID][n]
 ps={'body':f['image'],'back':h['back'],'front':h['front'],'staff':wp,'grip':f['grip']}
 ls={k:read(R/p) for k,p in ps.items()}
 check(all(im[:2]==[128,120] for im in ls.values()),n+': 레이어 크기')
 check(all(p[3] in (0,255) for im in ls.values() for p in im[2]),n+': 이진 알파')
 check(all(p in HP for k in ('back','front') for p in ls[k][2] if p[3]),n+': 머리 팔레트')
 im=compose(ls);check(im==read(R/f'composite/{n}.png'),n+': 매니페스트 합성 일치')
 b=bounds(im);check(b[0]>0 and b[1]>0 and b[2]<128 and b[3]<120,n+': 캔버스 잘림 없음')
 g=f['weapon']['gripPoint'];check(any(get(ls['grip'],g[0]+dx,g[1]+dy)[3] for dx in range(-3,4) for dy in range(-3,4)),n+': 그립 좌표')
 check(f['weapon']['hand']=='near',n+': 무기 손 유지')
b=bounds(read(R/'composite/idle_0.png'));check(b[3]-b[1]==48 and b[3]==112,'대기 키 48px·바닥 112')
for name,a in aa.items():
 check(len(a['frames'])==len(a['durations']) and sum(a['durations'])==a['duration'],name+': 프레임 시간')
 if name.startswith('skill_'):
  check(500<=a['duration']<=1000 and not a['loop'],name+': 스킬 재생 길이')
  if name in ('skill_aura','skill_barrier'):check('hitFrame' not in a,name+': 버프 타격 없음')
  else:check(sum(a['durations'][:a['hitFrame']])==130,name+': 타격 130ms')
  check(read(R/f"composite/{a['frames'][-1]}.png")==read(R/'composite/idle_0.png'),name+': 대기 복귀')
check(not aa['cast_start']['loop'] and aa['cast']['loop'],'시전 시작 1회·유지 반복')
check(read(R/f"composite/{aa['cast_start']['frames'][-1]}.png")==read(R/f"composite/{aa['cast']['frames'][0]}.png"),'시전 시작→유지 연결')
check(c['frames']['cast_0']['weapon']['gripPoint']==c['frames']['cast_1']['weapon']['gripPoint'],'시전 유지 중 손 고정')
decode=json.loads((R/'verification/gif_decode.json').read_text())
check(len(decode)==56,'Apple ImageIO로 GIF 56개 전체 디코딩')
for name,a in aa.items():
 for scale in (1,4):
  d=next(v for v in decode if v['file']==f'{name}_{scale}x.gif')
  check(d['frames']==len(a['frames']) and all(abs(x-y)<.01 for x,y in zip(d['durations'],a['durations'])) and all(s==[128*scale,120*scale] for s in d['sizes']),d['file']+': 독립 디코더 시간·크기')
for name in set(c['skillMotions'].values()):
 events={0}
 for a in (aa['attack'],aa[name]):
  t=0
  for ms in a['durations']:t+=ms;events.add(t)
 e=sorted(events);times=[y-x for x,y in zip(e,e[1:])]
 for scale in (1,4):
  d=next(v for v in decode if v['file']==f'attack_vs_{name}_{scale}x.gif')
  check(d['frames']==len(times) and all(abs(x-y)<.01 for x,y in zip(d['durations'],times)) and all(s==[256*scale,120*scale] for s in d['sizes']),d['file']+': 비교 GIF 시간·크기')
check(read(R/'comparison_1x.png')[:2]==[384,120] and read(R/'comparison_4x.png')[:2]==[1536,480],'쿠키·기사·위저드 비교 크기')
check(not list(R.rglob('*.zip')) and not list(R.rglob('__pycache__')) and not list(R.rglob('.swift-module-cache')),'압축 원본·빌드 캐시 없음')
report={'passed':True,'checks':len(checks),'runtimeFrames':len(c['frames']),'skills':len(expected),'animations':len(aa),'gifFiles':len(decode),'details':checks}
(R/'verification/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print({k:v for k,v in report.items() if k!='details'})
