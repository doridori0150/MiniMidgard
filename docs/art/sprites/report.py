"""Produce the Korean evidence report from saved raster checks, never fixed numbers."""
from pathlib import Path
from PIL import Image
import json,csv,statistics,math,hashlib
from player import R,M,draw_list,render,tint,select_frame

def main():
 drift=json.loads((R/'verification/drift.json').read_text());checks=json.loads((R/'verification/checks.json').read_text())
 lines=['# 통짜 스프라이트 검증 결과','',
 f'계약 검증: **{checks["status"]}**. 장비·머리장식·좌우 방향 {checks["configurations"]}조합을 검사했다. 아트 승인을 뜻하는 자동 판정은 아니다.','',
 '## 측정 정의','',
 '- 원본 1254×1254 시트의 수작업 head box를 `source/annotations.json`에 보존했다. 전체 그림과 같은 좌표변환을 적용한 머리 크기·중심을 기록한다. 손에 가려진 경계는 추정이므로 정밀 계측이나 얼굴 유사도 점수로 해석하지 않는다.',
 '- 독립적인 래스터 측정: alpha > 127 실루엣 경계, 실제 흰색 hair mask 경계, 평탄한 내부 색, 전체 불투명 픽셀의 최근접 원화 팔레트 RGB 거리.',
 '- 원화 head box 기준: 초보자 [46,84,222,265] = 176×181px; 검사 [278,81,456,266] = 178×185px. 검사 원화는 bob이며 납품물은 요청한 고정 단발 남성형이므로 실루엣 차이가 의도적으로 존재한다.',
 '- 정규화로 맞춘 head box 높이를 독립적인 동일성 증거로 사용하지 않는다. 머리카락의 실제 마스크 크기와 비교 PNG도 함께 보아야 한다.',
 '- 실루엣 높이는 발부터 ahoge까지다. 앉기·죽기·웅크림은 정상적인 높이 변화이며 매 프레임 310px로 늘리지 않는다. 발끝 alpha > 127 경계는 y=360이다.','',
 '## 캐릭터별 범위','',
 '| 캐릭터 | idle 실루엣 | upright 머리 W 범위 | upright 머리 H 범위 | idle 대비 upright 머리 중심 이동 최대 | upright 실루엣 범위 |',
 '|---|---:|---:|---:|---:|---:|']
 for cls in ['novice','swordsman']:
  a=[v for v in drift if v['character']==cls];idle=a[0];upr=[v for v in a if v['frame'] not in ('hurt_0','dead_0','attack_2','sit_0')]
  rng=lambda k:f'{min(v[k] for v in upr):.2f}–{max(v[k] for v in upr):.2f}'
  shift=max(math.dist(v['headCentre'],idle['headCentre']) for v in upr)
  lines.append(f'| {cls} | {idle["silhouetteHeight"]}px | {rng("headWidth")}px | {rng("headHeight")}px | {shift:.2f}px | {rng("silhouetteHeight")}px |')
 lines+=['','## 프레임별 수치','',
 '| 캐릭터 / 프레임 | 머리 W×H | 머리 중심 x,y | hair mask W×H | 실루엣 높이 | ground 오차 |',
 '|---|---:|---:|---:|---:|---:|']
 rows=[]
 for d in drift:
  f=M['characters'][d['character']+('_female' if d['character']=='novice' else '_male')]['frames'][d['frame']]
  b=Image.open(R/f['hairMask']).getbbox();hw,hh=b[2]-b[0],b[3]-b[1]
  d['hairMaskBounds']=list(b);rows.append({'character':d['character'],'frame':d['frame'],'headWidth':d['headWidth'],'headHeight':d['headHeight'],'headCentreX':d['headCentre'][0],'headCentreY':d['headCentre'][1],'hairMaskWidth':hw,'hairMaskHeight':hh,'silhouetteHeight':d['silhouetteHeight'],'groundErrorPx':d['groundErrorPx']})
  lines.append(f'| {d["character"]} / {d["frame"]} | {d["headWidth"]:.2f}×{d["headHeight"]:.2f} | {d["headCentre"][0]:.2f}, {d["headCentre"][1]:.2f} | {hw}×{hh} | {d["silhouetteHeight"]} | {d["groundErrorPx"]} |')
 with (R/'verification/drift.csv').open('w') as out:
  w=csv.DictWriter(out,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
 (R/'verification/drift.json').write_text(json.dumps(drift,indent=2)+'\n')
 lines+=['','## 팔레트','',
 '18개 원화 실측 색을 `source/palette.json`에 기록했다. 생성 그림을 median 3px로 정리하고 최근접 색으로 평탄화한 뒤 크기·비율 정규화에는 안티앨리어싱을 허용했다. 두 번째 팔레트 고정으로 눈과 외곽선이 거칠어지는 문제를 확인하여 제거했다. 아래 RGB 거리는 CIE Delta-E가 아니며 색상 경계의 보간 픽셀을 포함한다.','',
 '| 캐릭터 | 전체 불투명 픽셀 평균 최근접 RGB 거리, 프레임 범위 | 평탄 내부의 팔레트 오차 > 채널당 1 |',
 '|---|---:|---:|']
 for char in M['characters']:
  a=[v for v in checks['palette'] if v['character']==char]
  lines.append(f'| {char} | {min(v["meanNearestPaletteRGBDistance"] for v in a):.3f}–{max(v["meanNearestPaletteRGBDistance"] for v in a):.3f} | {sum(v["flatInteriorBeyondRoundingPixels"] for v in a)} pixels |')
 lines+=['','검사의 마스터 PNG 머리는 크림색이다. 기본 blue tint의 밝은 머리색은 원화 실측 RGB (96,138,189)로 복원된다. 보간 경계 및 그림자까지 원화 픽셀과 같다는 뜻은 아니다.','',
 '## 앵커와 재생','',
 f'- 손잡이 pivot→hand 변환 최대 오차: {checks["maxGripTransformErrorPx"]:.3g}px.',
 f'- 장식 pivot→crown/side 변환 최대 오차: {checks["maxHeadgearTransformErrorPx"]:.3g}px.',
 '- 위 값은 행렬 일치 검사다. 주먹 중심을 올바로 찍었는지는 `anchor_checks.png`의 육안 검토로 별도 확인했다.',
 f'- 140ms 접촉: {checks["contact140ms"]}. 오른쪽에서는 tip.x > grip.x, tip.y = grip.y; 왼쪽은 전체 반사 후 x 방향만 반대다.',
 '- 마스크가 투명 영역에 걸친 픽셀: '+str(sum(x[2] for x in checks['maskLeaks']))+'. 경계 밖 장비/그림 조합: '+str(len(checks['boundsFailures']))+'.',
 '- PNG 미리보기에서 전 프레임의 주먹 가림, 머리장식 위치, sit/hurt/dead 표정과 자세를 검토했다. GIF는 20ms 간격으로 샘플링하고 140ms 접촉을 실제 포함한다. 인코더는 동일 프레임을 합치므로 저장 프레임 수와 샘플 수는 다르다. 실제 duration 합과 접촉 프레임은 `detail_checks.json` 및 `gif_at_140ms.png`로 확인했다.',
 '- `detail_checks.py`는 28장 모두에서 염색 전후 mask=0 픽셀의 RGBA가 완전히 동일함을 검사한다. 확대 색상 검토는 `contact_and_tints.png`에 있다.',
 '- Python reference player로 PNG와 GIF를 렌더했다. HTML 보조 뷰어는 브라우저 연결이 없어 실제 브라우저 실행 검증은 하지 못했다. JS 문법 검사를 별도로 수행한다.','',
 '## 남은 아트 한계','',
 '- 초보자 idle은 원화를 참조한 재도색이며 원화의 픽셀 복제는 아니다. 앞머리 끝, 손 위치, 얼굴 획과 부츠 폭에 차이가 남는다. `preview_vs_lineup.png`가 판단 기준이다.',
 '- 검사의 짧은 머리·노출된 귀는 요청에 따른 남성형 변형이다. 기존 bob 원화와 동일 실루엣이라고 주장하지 않는다.',
 '- 정지형 14프레임의 제한으로 4프레임 걷기와 3프레임 공격은 단순하다. 공격 준비는 무기 손을 낮게 유지한 채 검을 세우고 반대 손으로 방어하는 자세다.',
 '- 연속된 전체 캔버스 세로 변형으로 머리/몸 비율을 맞췄다. 이것은 원화 재현을 보장하지 않으며 작은 갑옷·팔의 형태에도 영향이 있다. 런타임에 머리를 따로 합성하지는 않는다.',
 '- 실제 게임 내 나란히 비교는 미수행이다. 요청 범위가 이 폴더로 제한되어 있어 src와 tools를 수정하지 않았다.','']
 (R/'verification/REPORT.md').write_text('\n'.join(lines))
 hashes={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for d in ['frames','masks','grips','equipment','source'] for p in sorted((R/d).rglob('*.png'))}
 (R/'verification/sha256.json').write_text(json.dumps(hashes,indent=2)+'\n')
 print('Saved REPORT.md, drift.csv and SHA-256 inventory.')

if __name__=='__main__':main()
