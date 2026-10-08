상태: 수정 요청 (2026-10-09). 요구서 `asset-specs/hero-sprites.json`, 앞 요청서 `docs/art-requests/hero-sprites-a-fix1.md`. 수정 1 납품을 무기·머리장식(잎·별 핀)을 얹고 프레임 하나하나 검수한 결과입니다. 검수 시트: `docs/art-production/hero-sprites/verification/claude-review/fix1_<캐릭터>.png`(빨간 점 = hand).

# 영웅 스프라이트 — 수정 2: 궁수 walk_3 · 머리장식 기준점

수정 1에서 팔·무기·얼룩은 해결됐습니다. 남은 것은 두 가지입니다.

## 1. 궁수 walk_3 — 활을 쥐는 손 (그림 수정)
- 지금 먼 쪽 팔이 몸 앞을 가로질러 활을 쥐고 있습니다(사용자 지적: "궁수 walk 3 반대손으로 갔어"). 가까운 쪽(화면 오른쪽) 손이 활을 쥐게 고칩니다.
- 수정 1의 두 번째 생성(`source/fix1/archer-attempt2.png`)은 자세가 맞습니다. 가까운 쪽 손이 활을 쥐고, 먼 쪽 주먹은 몸 뒤에 있습니다. 다만 활이 그림에 들어가 있습니다. 아래 순서로 시도합니다.
  1. **attempt2에서 활만 지우는 편집.**
     - 활대와 시위를 지우고, 그 뒤에 가려졌던 손가락·다리·바지를 메웁니다.
     - 손은 빈 주먹(무기가 끼워질 자리)으로 둡니다.
     - 나머지(얼굴·머리·옷·자세)는 바꾸지 않습니다.
  2. 1이 안 맞으면 **합성으로 만듭니다.**
     - 상반신(머리·몸통·두 팔)은 같은 캐릭터의 `walk_1`에서, 다리는 지금 `walk_3`에서 가져옵니다.
     - 걷기 높낮이는 지금 walk_3에 맞춥니다.
     - 허리띠 이음매는 이웃 색으로 정리합니다.
- 크기·발 위치·머리 높이는 이웃 프레임(walk_2, walk_0)과 이어지게 맞춥니다.
- `hand`·`crown`·`side`·`hairMask`·`gripOverlay`를 새로 만듭니다.
- 두 방법 모두 안 맞으면 납품하지 말고 `rejected/README.md`에 사유를 적습니다.

## 2. 머리장식 기준점 — 새로 그린 프레임의 crown·side (기준점만 수정, 그림은 그대로)
- 수정 1에서 새로 그린 프레임들은 `crown`을 그림의 가장 높은 점(바보털 끝, 마법사는 올림머리 위)에 찍었습니다.
- 원래 프레임들은 머리통 윗선(바보털 뿌리)에 찍혀 있습니다.
- 그래서 애니메이션에서 잎 머리장식이 위로 튀거나 올림머리로 옮겨 갑니다.

| 캐릭터 | 프레임 | 지금 |
|---|---|---|
| mage_female | walk_2, attack_0, cast_0, cast_1 | 잎이 올림머리(번) 위로 감. 다른 프레임은 번 오른쪽 머리통 위 |
| swordsman_male | attack_0, cast_0, cast_1 | 잎이 바보털 끝 위에 떠 있음 |
| novice_female | attack_0, attack_2, cast_0, cast_1 | 잎이 바보털 끝 위에 떠 있음 |
| archer_male | cast_0, cast_1 | 잎이 바보털 끝 위에 떠 있음. 별 핀(side)도 옆머리 가장자리가 아니라 앞머리 안쪽으로 들어감 |

- 규칙(요구서 anchors에 반영됨):
  - `crown`은 머리통 윗선(두개골 꼭대기)입니다.
  - `side`는 얼굴 쪽 옆머리 바깥 가장자리입니다.
  - 같은 캐릭터의 고치지 않은 프레임(idle_0, walk_0, attack_1 등)에서 얼굴(눈)과 기준점의 상대 위치를 재고, 같은 자리에 오게 맞춥니다.
- 위 표의 프레임만 기준점을 고칩니다. 그림·마스크는 바꾸지 않습니다.
- 다른 프레임의 crown·side도 한 번 훑어서 같은 문제가 있으면 함께 고치고 README에 적습니다. acolyte_female은 지금 맞습니다.

## 할 일
1. 위 1·2를 합니다.
   - 외형 기준은 승인 원본 `docs/art/concepts/round3/class_lineup.png`입니다.
   - 실제로 쓴 프롬프트는 `prompts/archer_male-fix2-attempt<n>.txt`로 남깁니다.
2. `game-manifest.json`을 갱신하고 표준 기록을 다시 만듭니다.
   - `node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json`
3. 검사를 다시 돌려 오류 0을 확인하고 `check.json`을 갱신합니다.
   - `node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json`
4. **검수 시트를 다시 만듭니다**: `verification/review_<캐릭터>.png`.
   - 이번에는 무기와 함께 **머리장식 두 개(정수리 `leaf`, 옆머리 `hairpin`)를 renderContract 순서로 얹습니다.**
   - 시트에서 잎과 핀이 14프레임 모두 머리의 같은 자리에 붙는지 직접 확인합니다.
   - 머리 꼭대기가 잘리지 않게 칸을 잡습니다.
   - `preview_animation.gif`도 머리장식을 얹어 갱신합니다.
5. README에 수정 2 절을 더합니다: 고친 프레임, 기준점을 옮긴 목록(전·후 좌표), 검사 결과, 남은 문제.

쓰기 범위: `docs/art-production/hero-sprites/`만. `src/`, `tools/`, `asset-specs/`, `docs/art-requests/`, `docs/art/`, `../asset-kit`은 바꾸지 않습니다. 커밋·푸시하지 않습니다. 끝나면 짧은 한국어 요약을 씁니다.
