# 영웅 통짜 스프라이트 — Batch A / fix3

현재 납품은 **수정 3 부분 완료본: 4프레임 채택, 검사 걷기 2프레임 미해결**이다. 표준 검사 오류 0 · 주의 2 · 통과 466이며, 기술 검사 통과가 거절 프레임의 아트 승인을 뜻하지 않는다. 최신 상태는 마지막 **수정 3** 절을 따른다.

## 수정 1 이력

2026-10-09 수정 납품. **28프레임 변경(전신 재생성 16장 + 기존 검사 얼룩 정리 11장 + 초보자 바닥 잡티 1장), 궁수 walk_3은 미해결**이다. 두 번의 생성이 모두 계약을 만족하지 못해 새 프레임을 채택하지 않았다. 기존 궁수 walk_3은 파일·기준점 그대로 보존했으며 승인 대상이 아니다. 사유와 생성본 위치는 `rejected/README.md`에 기록했다.

## 고친 프레임

| 캐릭터 | 변경 |
|---|---|
| acolyte_female | attack_0의 가까운 팔 올리기, cast_0·cast_1의 닫힌 쥠손과 무기 유지 |
| mage_female | walk_2의 가까운 팔, attack_0의 가까운 팔 올리기, cast_0·cast_1의 쥠손과 무기 유지 |
| archer_male | cast_0·cast_1의 쥠손과 무기 유지. walk_3은 2회 탈락 후 원본 보존·미해결 |
| novice_female | attack_0의 가까운 팔 올리기, attack_2의 단발 실루엣, cast_0·cast_1의 쥠손과 무기 유지, walk_3의 바닥 아래 14px 잡티 제거 |
| swordsman_male | attack_0의 가까운 팔 올리기, cast_0·cast_1의 쥠손과 무기 유지. 14프레임 모두 얼굴·머리 얼룩 점검 및 정리(재생성 3장, 원본 색 오염만 정리 11장) |

다섯 캐릭터 × 14프레임을 `game-manifest.json` 하나에 담았다. 기존 초보자·검사의 미수정 프레임, 기존 dagger·sword·leaf·hairpin은 게임 사본에서 복사했다. 손·정수리·관자놀이 기준점, 머리 마스크, 손가락 오버레이를 재생성 프레임에 맞춰 다시 작성했다. 모든 시전 10프레임의 `hand.visible`은 true이며 앉기·쓰러짐은 false다. `src/`와 요청서·요구서·공용 도구·승인 원화는 수정하지 않았다.

## 검사 결과

- 지정 표준 검사: **기술 오류 0, 요청 범위 누락 0, 주의 3, 통과 465** (`check.json`).
- 주의 3건: 기존 마법사·궁수 피격 자세 높이 2건, **미해결 궁수 walk_3 손 위치 1건**. 자동 통과는 이 프레임의 아트 승인을 뜻하지 않는다.
- 원 요구서에는 다음 묶음 B(도둑·상인·도끼)가 들어 있어, 범위 구분 없는 첫 실행은 기술 오류 0 + 범위 밖 누락 15건이었다. 그 결과를 `verification/check-unscoped-spec.json`에 보존했다. 표준 기록의 `excluded`에 B의 15개 동작/무기를 **이번 요청 범위 밖**이라고 명시한 뒤 동일 명령으로 재검사했다. 요구서 자체는 변경하지 않았다.
- 별도 계약·장착 검사: 기술 PASS, 560조합, 장비 잘림 0, 머리 마스크 누출 0, 공격 접촉 140ms 축 일치, 수정 범위 밖 변경 0. 최종 아트 상태는 `PASS_WITH_ART_REJECTION` (`verification/checks.json`).
- 변경 전 해시로 기존 A의 비대상 프레임과 `src/assets/sprites/` 보존을 확인했다. 추가된 기존 초보자의 비대상 프레임도 원본과 동일하다.

## 검수 자료

- `verification/review_<캐릭터>.png`: 다섯 장, 각각 14프레임을 2줄 7칸으로 배치. renderContract 순서로 기본 무기를 얹고 hand를 빨간 점으로 표시했다. 미해결 궁수 walk_3에는 `UNRESOLVED ORIGINAL` 표시가 있다.
- `preview_frames.png`: 다섯 검수 시트를 합친 전체 보기.
- `preview_animation.gif`: 다섯 캐릭터 × 대기·걷기·공격·시전, 무기 장착, 1120×1050, 80프레임 / 1.6초. 시전에서도 무기가 유지된다.
- `verification/hair-tints.png`: 70프레임의 갈색·검정·분홍 머리 적용.
- `verification/anchor-checks.png`: 무기·머리장식 장착과 세 기준점 확인.
- `preview_vs_lineup.png`: 초기 Batch A의 idle 비교본. idle은 이번 수정 대상이 아니므로 그대로 보존했다.

## 생성·처리 기록

내장 `image_gen` 사용. 실제 프롬프트 7개는 `prompts/*-fix1-attempt<n>.txt`다. 각 호출에 승인 원본 `docs/art/concepts/round3/class_lineup.png`를 새로 첨부했고, 기존 프레임은 자세·크기 참고로만 사용했다. 새 생성본을 다음 생성의 참조로 쓰지 않았다. 원본 결과와 좌표는 `source/fix1/`, 상세 이력은 `generation.json`에 있다.

새 그림은 전신 그대로 추출하고 원본 시트별 공통 배율을 적용했다. 평면 팔레트 정리, 머리 영역 마스크, 원본 손 픽셀 오버레이를 만들었으며 머리·몸을 따로 조립하지 않았다. 기존 검사의 얼룩은 원래 머리 영역 안의 주황색 오염 픽셀만 이웃의 원래 크림색/피부색으로 정리했다. 몸·포즈·윤곽은 보존했다. 초보자 바닥 잡티는 바닥선 아래 독립 픽셀만 제거했다.

범위 내 `.gitignore`에서 최종 검수 시트와 fix1 생성 근거를 포함하도록 했다. 중간 애니메이션 PNG는 제외한다. 게임 적용은 후속 담당자가 진행한다.

## 재현

기존 `build.mjs`와 `verify.mjs`는 초기 3인 Batch A용이다. fix1 결과를 다시 만들 때는 아래를 사용한다.

```sh
node docs/art-production/hero-sprites/fix1.mjs
node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json
node docs/art-production/hero-sprites/record.mjs
node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json
node docs/art-production/hero-sprites/verify-fix1.mjs
ffmpeg -hide_banner -loglevel error -y -framerate 50 -i docs/art-production/hero-sprites/verification/animation-frames/%03d.png -filter_complex '[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3' -loop 0 docs/art-production/hero-sprites/preview_animation.gif
```


## 수정 2 — 궁수 walk_3 · 정수리/옆머리 기준점

2026-10-09 완료. 요청서: `docs/art-requests/hero-sprites-a-fix2.md`.

- 궁수 `walk_3`: 요청 순서 1번을 채택했다. 내장 `image_gen`으로 `source/fix1/archer-attempt2.png`의 활대·시위만 제거해 가까운 쪽(화면 오른쪽) 손은 빈 쥠손, 먼 쪽 손은 몸 뒤로 내린 자세로 유지했다. 합성 대안은 사용하지 않았다. 실제 프롬프트는 `prompts/archer_male-fix2-attempt1.txt`, 투명 생성 원본은 `source/fix2/archer-attempt1.png`다.
- 전신에 단일 배율 0.3462857143을 적용했다. 최종 크기 512×400, 캐릭터 높이 303px, 발 기준선 y=360, 상단 y=57로 기존 walk_3의 높이를 유지했다. walk_0 상단 43, walk_2 상단 59와 함께 검토했다. `hand/crown/side`, `masks/archer/walk_3.png`, `grips/archer/walk_3.png`를 새로 작성했다.
- 지정된 13프레임의 crown·side를 수정했다. 기존 idle_0·walk_0·attack_1의 눈 중심 상대 위치를 비교하고 정수리는 머리통 윗선, 핀은 얼굴 쪽 옆머리에 정렬했다. 측정값은 `source/fix2/eye-relative-measurements.json`에 남겼다. 이 13프레임의 그림·마스크·손 오버레이는 바이트 단위로 보존했다.
- 다섯 캐릭터의 70프레임을 모두 검토했다. 표 밖 추가 기준점 수정은 없으며 acolyte_female은 그대로다. 잎이 바보털 끝이나 번 위로 옮겨 가는 문제, 궁수 시전 핀이 앞머리 안으로 들어오는 문제를 수정했다.

### 기준점 이동 목록 (512×400 캔버스 px)

| 캐릭터 | 프레임 | 기준점 | 이전 → 이후 |
|---|---|---|---|
| mage_female | walk_2 | crown | (170.056, 54.822) → (222, 78) |
| mage_female | walk_2 | side | (259.611, 118.889) → (280, 140) |
| mage_female | attack_0 | crown | (163.347, 54.487) → (223, 78) |
| mage_female | attack_0 | side | (267.304, 127.033) → (283, 145) |
| mage_female | cast_0 | crown | (176.6, 65.156) → (226, 87) |
| mage_female | cast_0 | side | (264.778, 127.844) → (280, 151) |
| mage_female | cast_1 | crown | (180.733, 65.156) → (225, 87) |
| mage_female | cast_1 | side | (269.6, 128.533) → (280, 152) |
| archer_male | cast_0 | crown | (234.154, 54.833) → (211, 73) |
| archer_male | cast_0 | side | (262.461, 120.423) → (277, 135) |
| archer_male | cast_1 | crown | (234.499, 61.737) → (211, 80) |
| archer_male | cast_1 | side | (263.497, 125.947) → (277, 138) |
| novice_female | attack_0 | crown | (223.156, 55.611) → (222, 84) |
| novice_female | attack_0 | side | (258.925, 121.538) → (274, 128) |
| novice_female | attack_2 | crown | (269.796, 73.846) → (262, 78) |
| novice_female | attack_2 | side | (286.629, 144.683) → (306, 146) |
| novice_female | cast_0 | crown | (216.493, 57.715) → (211, 84) |
| novice_female | cast_0 | side | (255.068, 122.24) → (264, 130) |
| novice_female | cast_1 | crown | (215.792, 57.715) → (211, 84) |
| novice_female | cast_1 | side | (255.068, 122.24) → (265, 130) |
| swordsman_male | attack_0 | crown | (229.923, 56.159) → (225, 82) |
| swordsman_male | attack_0 | side | (265.508, 118.433) → (281, 135) |
| swordsman_male | cast_0 | crown | (228.896, 56.159) → (224, 81) |
| swordsman_male | cast_0 | side | (265.85, 118.433) → (278, 135) |
| swordsman_male | cast_1 | crown | (223.422, 60.265) → (222, 85) |
| swordsman_male | cast_1 | side | (261.744, 121.854) → (275, 136) |
| archer_male | walk_3 | hand | (256.877, 279.331) → (296.01, 271.351) |
| archer_male | walk_3 | crown | (224.61, 82.268) → (228.484, 79.855) |
| archer_male | walk_3 | side | (291.45, 144.498) → (286.66, 145.995) |

### 검증과 산출물

- `game-manifest.json` 갱신 후 지정 변환기와 `record.mjs`로 표준 `manifest.json`을 다시 만들었다.
- 표준 `check.json`: **오류 0 · 주의 2 · 통과 466 · 요청 범위 누락 0**. 주의 2건은 기존 마법사·궁수 hurt_0의 낮은 자세 높이이며 이번 수정 범위 밖이다. 기존 궁수 walk_3 손 위치 주의는 해소됐다. Batch B 제외 15건은 이전 범위를 유지했다.
- `verification/review_<캐릭터>.png` 다섯 장과 `preview_frames.png`: 14프레임 전체에 무기와 **leaf·hairpin 둘 다**를 renderContract 순서로 얹었다. 전체 512×400 캔버스를 칸에 넣어 정수리가 잘리지 않으며, hand는 빨간 점으로 표시했다. 앉기·쓰러짐은 기존 계약대로 무기만 숨긴다.
- `preview_animation.gif`: 5명 × 대기·걷기·공격·시전, 무기+잎+핀, 80프레임/1.6초. `verification/anchor-checks.png`와 `verification/hair-tints.png`도 갱신했다.
- 별도 검증 **PASS** (`verification/checks.json`): 70프레임/560장착 조합, 양방향 장착 잘림 0·머리 마스크 누출 0·공격 접촉축 일치·범위 밖 변경 0. 수정 시작 시점 해시와 비교해 그림 파일 변경은 궁수 walk_3의 본체·마스크·오버레이 세 장뿐임을 확인했다. GIF는 ffprobe로 1120×1050·80프레임·1.6초를 확인했다.
- 이번 요청의 미해결 항목은 없다. 기존 fix1 거절 자료와 생성 원본은 이력으로 보존했다. 게임 코드 적용·커밋·푸시는 하지 않았다.

### 수정 2 재현

`fix1.mjs`는 과거 상태 재현용이다. 현재 납품에는 아래 순서만 실행한다.

```sh
node docs/art-production/hero-sprites/fix2.mjs
node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json
node docs/art-production/hero-sprites/record.mjs
node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json
node docs/art-production/hero-sprites/verify-fix2.mjs
ffmpeg -hide_banner -loglevel error -y -framerate 50 -i docs/art-production/hero-sprites/verification/animation-frames/%03d.png -filter_complex '[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3' -loop 0 docs/art-production/hero-sprites/preview_animation.gif
```

### 수정 2 후 검수 조정 (Claude, 2026-10-09)

- 무기와 머리장식(leaf·hairpin)을 얹은 시트로 70프레임을 다시 검수했다.
- `novice_female attack_2`의 crown만 (262, 78) → (251, 95)로 옮겼다.
  - 잎이 바보털 끝에 떠 있었다.
  - 고치지 않은 프레임(idle_0·attack_1)의 side→crown 거리 (−55, −51)에 맞췄다.
- 이후 `asset-kit-sprites.mjs` → `record.mjs` → `check.mjs`를 다시 돌렸다. 오류 0, 주의 2, 통과 466.
- 남은 작은 차이: 궁수 `walk_3`은 선이 약 10% 가늘고 옷의 얼룩무늬가 없다. 80px 표시에서는 거의 드러나지 않아 이번에는 그대로 둔다.


## 수정 3 — 초보자·검사 몸통 방향과 팔 연결

2026-10-09. 요청서: `docs/art-requests/hero-sprites-a-fix3.md`. **4프레임 채택, 2프레임 거절 후 원본 보존**이다. 요청 전체를 완료한 상태는 아니다.

| 대상 | 프레임 | 결과 |
|---|---|---|
| novice_female | walk_1 | 채택. 가슴을 오른쪽 앞에 유지하고 가까운 팔을 몸 앞쪽에 드러냄 |
| novice_female | attack_1 | 확인 후 수정·채택. 가까운 소매를 몸통 오른쪽 가장자리로 옮기고 먼 주먹은 왼쪽 옆으로 내림 |
| novice_female | attack_2 | 채택. 튀어나온 뒤 어깨를 없애고 가까운 어깨에서 앞아래로 이어지는 마무리 자세 |
| swordsman_male | attack_2 | 채택. 가까운 견갑에서 팔을 앞아래로 내리고 먼 팔은 몸 옆에 유지 |
| swordsman_male | walk_1, walk_3 | **미해결·새 프레임 미납품**. 두 차례 생성 후에도 기존 walk_0·walk_2보다 어깨·옷깃이 약 10–14px 높아 보이는 비율 차이가 남음. 원래 그림·마스크·오버레이·기준점 보존 |

### 생성과 기준점

- 내장 `image_gen`으로 캐릭터별 2회, 총 4회 생성. 매번 승인 원본 `docs/art/concepts/round3/class_lineup.png`와 해당 캐릭터의 기존 idle_0·walk_0·walk_2·attack_0 및 수정 대상 참고 시트를 첨부했다. 생성 결과를 다음 호출의 참조로 사용하지 않았다.
- 실제 프롬프트 4개: `prompts/novice_female-fix3-attempt1.txt`, `prompts/novice_female-fix3-attempt2.txt`, `prompts/swordsman_male-fix3-attempt1.txt`, `prompts/swordsman_male-fix3-attempt2.txt`.
- 1차는 어깨 높이와 머리·몸 비율의 연속성이 부족해 제외했다. 최종 채택 4장은 2차 전신 생성본이다. 원본 4개와 실제 입력 시트는 `source/fix3/`, 거절 사유는 `rejected/README.md`에 보존했다.
- 통짜 그림을 추출해 원본 시트별 공통 배율(초보자 0.4874213836, 검사 0.4619970194)로만 축소했다. 머리와 몸을 나누어 조립하거나 프레임별로 키를 늘이지 않았다. 캔버스 512×400, 발 중앙 (220,360)을 유지했다.
- 채택 프레임마다 hand·crown·side·hairMask·gripOverlay를 새로 작성했다. crown은 바보털 끝이 아닌 머리통 윗선의 뿌리 부분, side는 관자놀이 옆머리에 맞췄다. 손 각도는 걷기 −48°, 접촉 0°, 마무리 +35°다. 좌표·배율·출처·해시는 `source/fix3/annotations.json`과 `generation.json`에 기록했다.
- 기존 walk_0의 팔레트를 기준으로 색을 정리하고 파란 옷의 얼룩무늬를 보존했다. 검사 머리 마스크가 견갑까지 포함했던 중간 처리 오류를 고쳤다. 머리통 상단에서 시작하는 머리 영역만 선택하도록 제한한 뒤 갈색·검정·분홍을 직접 확인했다.

### 검사 결과와 검수 자료

- 표준 변환 → `record.mjs` → 지정 검사: **오류 0 · 주의 2 · 통과 466 · 범위 내 누락 0** (`check.json`). 주의 2건은 기존 mage_female·archer_male hurt_0의 낮은 자세 높이로 이번 변경과 무관하다. Batch B 제외 15건은 기존 범위를 유지했다.
- 별도 검사: **기술 PASS / 최종 상태 PASS_WITH_ART_REJECTION** (`verification/checks.json`). 70프레임·560장착 조합에서 장착 잘림 0, 머리 마스크의 몸 밖 누출 0, 공격 접촉 140ms의 수평 축 일치를 확인했다.
- 시작 시점 해시와 비교해 본체·마스크·손 오버레이 변경은 채택 4프레임의 12파일뿐이다. 비대상 프레임과 거절한 검사 걷기 2프레임, 장비, src 및 요청서·요구서·공용 도구의 내용은 보존됐다.
- `verification/review_novice_female.png`, `verification/review_swordsman_male.png`를 재생성했다. 무기와 leaf·hairpin 두 개, 빨간 hand 점을 표시한다. 거절한 검사 걷기 2칸은 `UNRESOLVED ORIGINAL`로 명시했다.
- `verification/fix3-<캐릭터>-walk.png`, `verification/fix3-<캐릭터>-attack.png`의 확대본으로 걷기 4장·공격 3장을 직접 확인했다. 초보자의 팔 방향과 공격 연결, 검사의 공격 마무리는 채택했다. 검사 걷기 2장은 기존 문제를 유지한 원본이므로 승인 대상이 아니다.
- `verification/fix3-display80.png`는 실제 표시 높이 80px 비교, `verification/fix3-hair-review.png`는 채택 4장의 머리색 3종 검수다. 전체 프레임 미리보기와 기준점·머리색 시트도 최신 내용으로 갱신했다.
- `preview_animation.gif`: 무기+leaf+hairpin, 5명 × 대기·걷기·공격·시전, 1120×1050 / 80프레임 / 1.6초. 검사 걷기는 미해결 원본을 재생한다.
- **남은 문제: swordsman_male walk_1·walk_3의 기존 팔 가림·교차 자세.** 두 번 생성 제한을 지켜 추가 생성하지 않았다. 게임 적용·커밋·푸시는 하지 않았다.

### 수정 3 재현

과거 fix1·fix2 스크립트는 현재 납품에 실행하지 않는다.

```sh
node docs/art-production/hero-sprites/fix3.mjs
node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json
node docs/art-production/hero-sprites/record.mjs
node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json
node docs/art-production/hero-sprites/verify-fix3.mjs
ffmpeg -hide_banner -loglevel error -y -framerate 50 -i docs/art-production/hero-sprites/verification/animation-frames/%03d.png -filter_complex '[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3' -loop 0 docs/art-production/hero-sprites/preview_animation.gif
```


## 배치 B (2026-10-09): 부분 납품

도끼만 같은 game-manifest.json에 추가했습니다. thief_male·merchant_female은 최초 생성 뒤 두 번 재생성했으나 반대발 접지 동작이 계속 누락되어 요청서 규칙에 따라 반려했습니다. 검토용 28프레임과 마스크·그립은 rejected/b/, 장비 검수 시트는 verification/review_thief_male.png 및 verification/review_merchant_female.png에 보존했습니다. 전체 검사는 미납 14동작으로 FAIL입니다. 자세한 결과: [배치 B 보고서](verification/b-report.md). 기존 다섯 캐릭터와 src/는 변경하지 않았습니다.
