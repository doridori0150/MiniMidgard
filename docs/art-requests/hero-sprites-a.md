상태: 요청 (2026-10-09). 이 문서는 요구서 `asset-specs/hero-sprites.json`에서 `asset-kit/tools/prompt.mjs`로 만들었습니다. 고칠 때는 요구서를 고친 뒤 다시 만듭니다.

# 영웅 통짜 스프라이트 — 남은 직업×성별 — 시범 — 1차 직업 3

요청: Claude (미니 미드가르 세션), 2026-10-09. 제작: Codex(아스트라). 연결·재생 검증: Claude (미니 미드가르 세션): src/render/whole.ts가 minimidgard.sprites/1 manifest를 그대로 읽는다.

사용자 요청:
- "캐릭터가 영 엉망인 거 같은데. 차라리 이거 스프라이트로 만들어서 하면 어떨까."
- "위 이미지는 너무 좋은데 조립이 이상해서 그래."

## 배경
- 승인 원화(SSOT)는 docs/art/concepts/round3/class_lineup.png 하나다. 12직업이 위아래 두 줄로 있다. 윗줄: 초보자·검사·마법사·궁수·성직자·도둑·상인. 아랫줄: 기사·위저드·헌터·프리스트·어새신·블랙스미스.
- 10월 7일에 조립 리그 → 템플릿 → 프레임 계약 → 머리 따로 붙이기 → 통짜 스프라이트로 방식을 여러 번 바꿨다. 사용자가 받아들인 것은 통짜(프레임마다 캐릭터 전체 한 장)뿐이다.
- 통짜가 있는 캐릭터는 novice_female, swordsman_male 둘이다(docs/art/sprites/, 게임 사본 src/assets/sprites/). 그림체·과정의 기준선으로만 쓰고 다시 그리지 않는다.
- 나머지 직업×성별은 예전 조립형(v5 sprite.ts / v3 cutout)으로 그려진다. 사용자는 이것을 '엉망'이라고 했다.
- 계약: 캔버스 512×400, 발 중앙 기준점 (220,360), 기준 몸 높이 310px(표시 80px), 오른쪽을 보고 엔진이 뒤집는다. 무기와 머리장식은 따로 된 그림을 프레임별 기준점(hand·crown·side)에 얹고, 머리색은 프레임별 머리카락 마스크로 바꾼다(renderContract).

## 이번 범위
- 기존 두 캐릭터로 기준선을 잡은 뒤
- 대상 3명 + 공통 3종, 시트 6장: 마법사(여)(mage_female), 성직자(여)(acolyte_female), 궁수(남)(archer_male) / 공통: staff, mace, bow
- 전체 묶음: a(3명) → b(2명). 묶음마다 납품·검수 후 다음 묶음으로 갑니다.

## 형식

| 종류 | 파일 | 칸 | 격자 | 프레임 | 재생 | 기준점 |
|---|---|---|---|---|---|---|
| 영웅 통짜 프레임 세트 (`hero`) | `frames/{line}/{state}_{n}.png` | 캔버스 512×400 | 낱장 | 14 | 약 0.28초, 정점 8번 | 발 중심 (220, 360) |
| 무기 낱장(손 기준점에 얹힘) (`weapon`) | `docs/art-production/hero-sprites/equipment/{id}.png` | 256×256 | 1×1 (256×256) | 1 | — | 칸 중심 |

**영웅 통짜 프레임 세트**
- 프레임 순서: 1 idle_0 숨 들이쉼 · 2 idle_1 숨 내쉼(어깨·머리 1~2px 내려감) · 3 walk_0 오른발 앞 접지 · 4 walk_1 통과 · 5 walk_2 왼발 앞 접지 · 6 walk_3 통과 · 7 attack_0 예비(무기를 쥔 빈 주먹을 뒤로) · 8 attack_1 접촉(쥔 손이 앞으로 뻗고, 얹힐 무기가 정면 수평을 가리키는 hand 각도 — 140ms에 표시) · 9 attack_2 회수 · 10 cast_0 시전 준비(한 손을 앞으로) · 11 cast_1 시전 유지 · 12 sit_0 앉아 쉬기 · 13 hurt_0 맞음(찡그린 눈 > <) · 14 dead_0 누움(눈 감음)
- 동작 묶음(검사·재생 단위): idle 2장·반복 · walk 4장·반복 · attack 3장·정점 2번 · cast 2장·반복 · sit 1장 · hurt 1장 · dead 1장. 납품 기록은 동작마다 시트 하나(kind = 동작 이름)로 적습니다.
- 외형 참조(승인 원본): `docs/art/concepts/round3/class_lineup.png` — 외형 절대 기준 — 그 직업 한 명만 본다. 자세는 복사하지 않는다
- 동작 크기·연출 기준(외형 참조 아님): `src/assets/sprites/frames/novice/idle_0.png`, `src/assets/sprites/frames/swordsman/idle_0.png`
- 프레임마다 기록할 기준점(점·각도, 손은 앞/뒤와 보임 여부까지, 갈아 끼우는 부속이 붙음): `hand` — 무기를 쥐는 손의 쥠 중심 {point, angle(시계방향 도), z: front|behind, visible}. 빈 주먹으로 그려 무기가 끼워질 자리를 남긴다; `crown` — 정수리 {point, angle} — 위 머리장식; `side` — 관자놀이 머리카락 {point, angle} — 머리핀
- 프레임마다 마스크(흰색 = 적용, 몸 프레임과 같은 크기, 몸 밖으로 나가지 않음): `hair` — masks/{line}/{state}_{n}.png — 머리카락 흰색, 나머지 검정. 프레임과 1:1 정렬
- 프레임마다 오버레이(몸 프레임과 같은 크기): `grip` — grips/{line}/{state}_{n}.png — 손잡이를 덮는 앞 손가락(hand.z가 front일 때)
- 무기는 프레임에 그리지 않는다. 손은 빈 주먹(쥘 자리)으로 그린다.
- 웅크린 공격·앉기·누움은 같은 배율이라 자연히 키가 줄어든다. 프레임별로 키를 맞추지 않는다.

**무기 낱장(손 기준점에 얹힘)**
- pivot = 손이 쥐는 점(px). 오른쪽을 보는 기본 각도, 날·머리가 오른쪽 위

## 대상별 요구

### 마법사(여) (`mage_female`) · bodyHeight 310
- **고정 외형**: 크림색 머리를 정수리에 둥글게 틀어 올리고 양옆 머리를 내림, 큰 파란 눈. 보라 로브(금색 테두리, 갈색 허리띠), 목에 짧은 보라 망토 깃, 갈색 신발
- **그리지 않음**: 위저드의 고깔모자와 남색 로브(2차 직업), 성직자 흰 로브
- **주의**: 무기(나무 지팡이 끝에 파란 구슬)는 프레임에 그리지 않는다. 손은 빈 주먹으로 쥘 자리만 남기고, 무기는 따로 된 그림을 hand 기준점에 얹는다.
- **주의**: 시전 프레임은 지팡이를 앞으로 드는 자세(빛·마법진은 이펙트가 그린다)
- **영웅 통짜 프레임 세트**: 가벼운 마법사. 공격은 지팡이로 툭 치는 근접 평타

### 성직자(여) (`acolyte_female`) · bodyHeight 310
- **고정 외형**: 크림색 단발, 큰 파란 눈. 흰 긴 로브 가운데 파란 세로띠, 파란 두건 깃, 갈색 신발
- **그리지 않음**: 프리스트의 붉은 장식(2차 직업), 마법사 보라 로브
- **주의**: 무기(은빛 꽃 모양 머리가 달린 철퇴)는 프레임에 그리지 않는다. 손은 빈 주먹으로 쥘 자리만 남기고, 무기는 따로 된 그림을 hand 기준점에 얹는다.
- **영웅 통짜 프레임 세트**: 차분한 성직자. 공격은 철퇴 내려치기, 시전은 철퇴를 가슴 앞에 세움

### 궁수(남) (`archer_male`) · bodyHeight 310
- **고정 외형**: 짧고 삐친 크림색 머리, 큰 파란 눈, 남성 얼굴. 초록 목도리, 초록 튜닉(갈색 허리띠·가죽 손목 보호대), 짙은 초록 바지, 갈색 장화. 등에 흰 깃 화살이 든 화살통(그림에 포함)
- **그리지 않음**: 헌터의 위장 무늬 망토(2차 직업)
- **주의**: 무기(나무 리커브 활)는 프레임에 그리지 않는다. 손은 빈 주먹으로 쥘 자리만 남기고, 무기는 따로 된 그림을 hand 기준점에 얹는다.
- **주의**: 활은 따로 된 무기 그림이다. 활을 쥔 손(앞손) 기준점에 붙는다.
- **주의**: attack은 시위를 당겼다 놓는 빈손 동작(뒷손). 화살은 이펙트가 그린다.
- **영웅 통짜 프레임 세트**: 궁수. 공격은 활시위를 당겨 놓기(접촉 프레임 = 놓는 순간)

### 공통
- `staff` (무기 낱장(손 기준점에 얹힘)): 마법사 지팡이: 꼬인 나무 지팡이 끝에 파란 구슬. pivot = 손이 쥐는 점
- `mace` (무기 낱장(손 기준점에 얹힘)): 성직자 철퇴: 은빛 꽃봉오리 머리, 갈색 손잡이. pivot = 손이 쥐는 점
- `bow` (무기 낱장(손 기준점에 얹힘)): 궁수 활: 갈색 나무 리커브 활, 흰 시위. pivot = 앞손이 쥐는 활 손잡이 가운데

## 공통 규칙
- 외형 기준은 class_lineup.png에서 그 직업 한 명뿐이다. 매번 처음부터 다시 첨부하고, 새로 만든 프레임을 다음 참조로 쓰지 않는다.
- 그림체 기준은 승인된 novice_female·swordsman_male 통짜 프레임이다(평면색, 그림자 한 단계, 굵은 진갈색 외곽선, 약 3등신). 그림체만 참고하고 옷·장비는 베끼지 않는다.
- 남성형은 같은 의상에 남성 얼굴(굵고 곧은 눈썹, 속눈썹 꺾임 없음)과 짧은 머리. 여성형은 라인업 얼굴 그대로. 큰 파란 세로 눈, 자신감 있는 작은 입은 두 성별 모두 유지한다.
- 평면색 + 그림자 한 단계 + 굵은 진갈색 외곽선. 그라데이션·광택·반짝이는 눈, 양산형 애니메 채색 금지.
- 머리카락은 두 성별 모두 크림색 기본으로 그린다(엔진이 마스크로 곱해 색을 바꾼다).

## 실패 대응

원인을 먼저 가르고, 전체를 다시 만들지 않고 문제가 생긴 단계로 돌아갑니다.

| 원인 | 증상 | 할 것 |
|---|---|---|
| 외형 | 얼굴·무기·옷이 바뀜, 다른 캐릭터 장비를 닮음 | 승인 원본을 다시 첨부하고 범위를 "자세만"으로 좁혀 다시 생성. 새로 만든 프레임을 다음 참조로 쓰지 않음 |
| 여백 | 머리·무기 끝 잘림 | 생성 여백을 늘려 다시 생성. 칸에 맞추려고 그 프레임만 줄이지 않음 |
| 투명 | 체크무늬·배경 잔여·지저분한 가장자리 | 진짜 알파 확인, 크로마 언믹싱, 안 되면 다시 생성 |
| 배율 | 웅크리면 커짐, 프레임마다 크기 튐 | 한 생성본 안에서는 공통 배율 하나. 프레임별 높이 맞추기 금지 |
| 기준점 | 발이 뜨거나 미끄러짐, 쏠 때 좌우로 튐 | 무기를 뺀 발 기준으로 pivot 기록. 접지 프레임 확인 |

- 어긋난 생성본은 버리고 다시 만듭니다. 2번 다시 만들어도 맞지 않으면 그 대상은 납품하지 말고 `rejected/README.md`에 사유를 남깁니다.

## 납품·기록
- 기록 폴더: `docs/art-production/hero-sprites/`
- manifest: `docs/art-production/hero-sprites/manifest.json` — 최상위 `sheets[]` = `{id, kind, file, size, cell, grid, sha256, bodyHeight(모션만), frames[{rect, pivot, bounds, rgba_sha256, source, uniform_scale}]}`, 학생별 `bundles[]`. `source`(생성본 파일)와 `uniform_scale`은 배율 검사에 씁니다.
- game-manifest.json — 게임이 읽는 minimidgard.sprites/1 (characters.<line>_<gender>.frames, weapons, headgear, renderContract는 src/assets/sprites/manifest.json과 같게)
- manifest.json — 표준 기록. game-manifest.json에서 `node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json`으로 만든다
- prompts/
- generation.json
- verification/
- 미리보기: preview_vs_lineup.png
- 미리보기: preview_frames.png
- 미리보기: preview_animation.gif

## 자동 검사
납품 전에 아래 검사를 돌려 오류 0을 확인하고 결과를 기록 폴더에 `check.json`으로 남깁니다.

```bash
node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --only mage_female,acolyte_female,archer_male,staff,mace,bow --json docs/art-production/hero-sprites/check.json
```

검사 항목: 형식(크기·격자·프레임 수) · 여백(가장자리 비투명 0) · 투명(진짜 알파, 빈 칸) · 배율(생성본 안 공통 배율, 선 자세 높이 = bodyHeight ±12%) · 기준점(발 기준선 흔들림, 기록 pivot과 실제 발) · 타이밍(이펙트 마지막 프레임 소멸, 정점) · 색(흰 시트) · 기록(해시)

## 사람이 볼 것 (공방에서 확인)
- 영웅 통짜 프레임 세트: idle_0이 라인업의 그 직업으로 바로 읽힌다(얼굴·머리·옷·색)
- 영웅 통짜 프레임 세트: 14장 모두 같은 캐릭터다(얼굴 폭·눈·머리 실루엣·옷 디테일이 흔들리지 않음)
- 영웅 통짜 프레임 세트: 80px 표시에서 직업이 구분된다
- 영웅 통짜 프레임 세트: 무기가 손에 맞게 붙고 접촉 프레임에서 정면 수평으로 뻗는다
- 영웅 통짜 프레임 세트: 머리색 3종(갈색·검정·분홍)을 입혀도 머리카락만 바뀐다
- 영웅 통짜 프레임 세트: hurt·dead 머리장식이 머리를 따라간다
- 무기 낱장(손 기준점에 얹힘): 라인업의 무기와 같은 모양·색
- 무기 낱장(손 기준점에 얹힘): 80px 캐릭터 손에서 읽힌다

## 하지 말 것
- 기존 novice_female·swordsman_male 프레임과 src/ 아래 파일은 바꾸지 않는다(납품은 docs/art-production/hero-sprites/에만).
- 몸·머리·얼굴을 따로 그려 조립하지 않는다(프레임마다 캐릭터 전체 한 장).
- 다른 게임의 캐릭터·의상·로고를 베끼지 않는다(오리지널).
- 게임용 manifest는 minimidgard.sprites/1 형식의 game-manifest.json으로 납품한다(게임이 그대로 읽는다). 표준 기록 manifest.json은 그 파일에서 변환기로 만든다.

## 생성 프롬프트
시트마다 시작 프롬프트를 `docs/art-requests/prompts/hero-sprites-a`에 두었습니다(요구서에서 자동 생성). 그대로 쓰거나 고쳐 쓰고, **실제로 쓴 프롬프트는 기록 폴더 `prompts/`에 시도 번호와 함께 남깁니다.**

- `mage_female-hero.txt` → `frames/mage/{state}_{n}.png`
- `acolyte_female-hero.txt` → `frames/acolyte/{state}_{n}.png`
- `archer_male-hero.txt` → `frames/archer/{state}_{n}.png`
- `staff-weapon.txt` → `docs/art-production/hero-sprites/equipment/staff.png`
- `mace-weapon.txt` → `docs/art-production/hero-sprites/equipment/mace.png`
- `bow-weapon.txt` → `docs/art-production/hero-sprites/equipment/bow.png`

