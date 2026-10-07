# 통짜 스프라이트 시범 제작

## 결과와 제작 방식

초보자(여)와 검사(남), 각각 14프레임을 **머리·얼굴·헤어·몸·의상이 한 장에 그려진 RGBA PNG**로 제작했다. 런타임에서 머리나 이목구비를 조립하지 않는다. 검사 헤어는 귀가 보이는 짧은 남성형으로 고정했다. `preview_vs_lineup.png`는 원화와 240px/80px 기준 크기로 비교한다.

내장 imagegen 편집 도구로 승인 라인업과 v1 포즈 시트를 참조하여 캐릭터별 4×4 시트를 생성했다. 라인업은 스타일·정체성 기준, v1 시트는 자세 참고만 사용했다. 이어 idle 팔 자세, 걷기의 passing pose, 검사 짧은 머리를 수정했다. 첫 결과와 수정 결과를 `source/`에 보존했다. 프롬프트는 `source/generation-prompts.txt`와 `source/revision-prompts.txt`에 기록했다. CLI 이미지 생성이나 외부 모델은 사용하지 않았다.

`build.py`의 결정적 후처리:

1. 시트에서 **완성된 전신 그림**을 추출한다. 낮은 alpha 잡티만 제거하며 생성된 투명도를 보존한다.
2. 원화에서 직접 채취한 18색으로 내부 색을 평탄화한다. 윤곽과 색 경계의 안티앨리어싱은 남긴다.
3. 픽셀 색과 머리 범위로 hair mask를 만든다. 검사에서는 연결된 파란 머리 영역을 분리하여 눈과 의상을 제외하고 크림색으로 변환한다.
4. 전체 그림을 균일 확대·축소한다. 머리와 몸의 비율 차이는 **전체 캔버스에 연속적인 세로 좌표변환**을 적용하여 보정한다. 머리를 잘라 다른 몸에 붙이지 않는다. 기준 upright head box 높이는 181px이며, hurt/dead/followthrough의 회전된 머리에는 이 보정을 강제하지 않는다.
5. idle/cast 높이는 약 310px, walk는 310/304/310/304px로 정렬한다. 최종 alpha 경계로 발을 y=360에 맞춘다. 앉기·죽기·공격·피격은 자세에 따른 높이 변화를 유지한다.
6. idle_1은 idle_0 **전체 그림**을 발 위치 고정 상태로 세로 1.004배 변형한다. 별도 생성된 idle의 팔·얼굴 변화를 사용하지 않는다.
7. 같은 변환을 손과 머리장식 앵커에도 적용한다. 앞손 가림 PNG는 해당 프레임의 주먹 부분만 복사한다.

## 파일 구성

- `frames/{novice,swordsman}/`: 전신 PNG 28장. 모든 프레임 512×400.
- `masks/{novice,swordsman}/`: 정렬된 8-bit grayscale hair mask 28장. 흰색=염색 영역, 검정=보호 영역.
- `grips/{novice,swordsman}/`: 장비가 보이는 20프레임의 앞손 가림. 원본 프레임과 같은 캔버스.
- `equipment/`: dagger, sword, leaf, hairpin. v1의 별도 장비 원본을 이 폴더에 복사·축소해 재사용했다. 몸/헤어/얼굴 레이어는 재사용하지 않았다.
- `manifest.json`: `minimidgard.sprites/1` 계약.
- `player.py`: 이식 기준인 작은 결정적 참조 플레이어. `--json`은 Pillow 없이 실행된다.
- `index.html`: 선택·시간 슬라이더·140ms 접촉·좌우 반사·머리색·장비를 검토하는 보조 Canvas 뷰어.
- `preview_frames.png`: 모든 프레임 × [장비 없음 / 무기+장식 / 크림 / 파랑 / 적갈색].
- `preview_animation.gif`: idle/walk/attack, 20ms 간격. 140ms 접촉 프레임 포함.
- `verification/anchor_checks.png`, `REPORT.md`, `drift.json`, `drift.csv`, `checks.json`, `sha256.json`: 육안 및 수치 증거.

## 좌표·재생 계약

캔버스는 **512×400px**, 원점은 **[220,360]**, 의미는 바닥 위 두 발의 중심이다. x는 오른쪽, y는 아래쪽, 각도는 시계방향 도 단위다. 게임의 월드 좌표 `(x,y)`는 이 원점에 대응한다. 기준 높이는 310px이고 표시 배율은 `desiredHeight / 310`이다. 좌향은 최종 그림과 모든 장비를 원점 중심으로 함께 반사한다.

| 상태 | 프레임 | 각 프레임 시간(ms) | 재생 |
|---|---|---|---|
| idle | idle_0, idle_1 | 800, 800 | 1600ms 반복 |
| walk | walk_0 … walk_3 | 180 × 4 | 720ms 반복 |
| attack | attack_0 … attack_2 | 100, 80, 100 | 280ms, 마지막 유지 |
| cast | cast_0, cast_1 | 360, 360 | 720ms 반복 |
| sit | sit_0 | 1 | 정지 |
| hurt | hurt_0 | 1 | 정지, 찡그린 눈 |
| dead | dead_0 | 1 | 정지, 누움·감은 눈 |

시간은 정수 ms로 내림하고 음수는 0으로 고정한다. 반복 상태는 duration으로 modulo한다. 비반복 상태는 마지막 프레임을 유지한다. 프레임 보간은 없다. **attack_1은 [100,180)ms에 표시되므로 140ms 접촉을 포함하며, hand.angle=0으로 칼끝이 정면을 향한다.** 이벤트 발생은 게임 시뮬레이션의 책임이다. 플레이어는 공격 이벤트를 발행하지 않는다.

프레임 데이터:

```text
image, hairMask: 전체 캔버스 기준 경로
hand: { point:[x,y], angle, z:"front"|"behind", visible }
crown: { point:[x,y], angle } — ahoge가 아니라 두개골 위쪽 부착점
side: { point:[x,y], angle } — 관자 부근 머리카락 부착점
gripOverlay?: 같은 캔버스의 앞손 가림 PNG
```

cast/sit/dead에서는 무기를 숨긴다. 숨겨진 손 앵커는 부착에 사용하지 않는다. crown/side는 모든 프레임에 존재하고 hurt와 dead에서도 위치와 각도가 같이 바뀐다. 머리장식 자체 pivot이 앵커 point에 놓인다.

장비 좌표변환은 `T(anchor.point) × R(angle) × T(-item.pivot)`다. 무기 PNG의 칼끝은 기본적으로 오른쪽을 향한다. 순서는 **뒤 무기 → 전신 → 앞 무기 → 앞손 가림 → 머리장식**이다. 이 파일에는 실제 무기가 보이는 프레임을 모두 front로 지정했지만 reference player는 behind도 지원한다. 무기 `null`, headgear `[]`는 각각 장비 없음이다. 미등록 ID는 오류다.

## 머리색 계약

두 캐릭터 모두 마스터 전신 PNG의 머리는 크림색이다. 원본 파란 머리 위에 임의 색을 곱하지 않는다. 검사 기본 tint는 원화의 파란색으로 복원하는 `[96/254, 138/240, 189/220]`이다.

`outRGB = round(baseRGB × (1 − mask/255 + mask/255 × tintRGB))`, alpha는 그대로 둔다. mask는 현재 0/255만 사용한다. 윤곽선·피부·눈·의상은 염색 대상이 아니다. 크림/파랑/적갈색 3가지를 전 프레임에서 확인할 수 있다. 프레임×색 결과를 캐시하고 매 tick마다 픽셀 처리를 반복하지 않는다.

## 실행과 검증

Python 3.10+ 및 `requirements.txt`의 Pillow 12.3.0을 사용한다. 현재 세션에서는 패키지 다운로드가 차단되어 기존 로컬 Pillow 환경을 사용했다.

```sh
python3 docs/art/sprites/build.py
python3 docs/art/sprites/verify.py
python3 docs/art/sprites/detail_checks.py
python3 docs/art/sprites/report.py
python3 docs/art/sprites/player.py --character swordsman_male --state attack --time 140 --gear leaf hairpin
python3 docs/art/sprites/player.py --state attack --time 140 --json
python3 -m http.server 8766 --directory docs/art/sprites
```

마지막 명령의 뷰어는 `http://localhost:8766`이다. `player.py`의 select_frame, matrix, multiply, draw_list, tint를 게임에 같은 순서로 이식하면 된다. 기존 조립형 manifest와 호환으로 가장하지 말고 schema를 구분한다. HTML은 보조 구현이며 브라우저 연결 부재로 실제 브라우저 실행 검증은 하지 못했다. Python 렌더러와 PNG/GIF는 검증했다.

## 13직업 × 2성별 확장

26개 고정 캐릭터 × 14프레임 = **364장 전신 + 364장 마스크**가 기본 규모다. 헤어·얼굴 조합 수가 프레임 수를 곱하지 않는다. 장비는 공유하되 직업별 손 위치·각도는 따로 검토한다.

확장 순서는 캐릭터별 원화 기준 확정 → 14프레임 전신 시트 → idle/접촉/사망 자세 우선 검토 → 같은 후처리와 앵커 작성 → 240/80px 비교 → 전체 프레임·색상·장비 검사다. 성별마다 별도 기준 원화가 있으면 재생성 간 해석 차이를 줄일 수 있다. 원거리·지팡이 계열은 같은 상태 이름이라도 공격 포즈와 손 앵커를 새로 설계해야 한다.

원본 PNG를 유지하고 실제 게임 빌드에서는 투명 여백을 trim한 atlas를 만들 수 있다. 이때 논리 캔버스 512×400과 trim offset, 원점, 앵커를 보존한다. atlas 최적화나 게임 코드 반영은 이번 시범 범위에 포함하지 않았다.

## 정직한 한계

통짜 방식으로 이중 머리 윤곽과 얼굴 레이어의 위치 불일치를 없앴다. 그러나 **생성 재도색은 승인 원화의 픽셀 복제가 아니다.** 초보자 idle의 손 위치·앞머리 끝·얼굴 획·부츠 폭에는 차이가 남는다. 검사 짧은 머리는 요청한 남성형 변형이다. 수치 검증 PASS는 아트 승인이나 원화 완전일치 판정이 아니다.

머리 크기/위치는 수작업 경계와 좌표변환으로 측정하며, 회전·웅크림 상태의 bbox 변화는 정체성 드리프트와 분리해서 봐야 한다. 자세별 실제 수치와 남은 차이는 `verification/REPORT.md`에 기록했다. 이번 결과는 확장 전 비교할 수 있는 시범 세트이며 실제 게임 내 비교는 이 폴더 밖 수정 금지 조건 때문에 수행하지 않았다.
