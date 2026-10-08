# 영웅 통짜 스프라이트 — Batch A / fix2

현재 납품은 수정 2 완료본이다. 궁수 `walk_3` 및 머리장식 기준점을 고쳤고, 표준 검사 오류 0 · 주의 2 · 통과 466이다. 아래 수정 1 미해결 기록은 당시 이력이며, 현재 결과는 마지막 **수정 2** 절을 따른다.

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
