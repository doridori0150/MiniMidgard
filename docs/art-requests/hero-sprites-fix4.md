상태: 수정 요청 (2026-10-09). 요구서 `asset-specs/hero-sprites.json`. 앞 요청서 `hero-sprites-a-fix3.md`, `hero-sprites-b.md`. 반려된 후보를 Claude가 검수한 결과, **새로 그리기보다 후보를 다듬어 채택하는 쪽**으로 정했습니다.

# 영웅 스프라이트 — 수정 4: 반려 후보 다듬어 채택

## 1. 검사 walk_1·walk_3 — `rejected/fix3/swordsman/` 후보 채택
- 후보는 지금 원본보다 낫습니다.
  - 먼 쪽 주먹이 가슴을 가로지르지 않고, 칼 든 손이 가려지지 않습니다.
  - 사용자가 지적한 문제("손이 반대", "팔이 이상해")가 해결됩니다.
- 반려 사유는 어깨·옷깃이 walk_0·walk_2보다 10–14px 높다는 것이었습니다. **다시 그리지 말고 처리로 맞춥니다.**
  - 발밑 기준점(220,360)은 그대로 둡니다.
  - 후보 전신을 같은 비율로 조금 줄이거나 몸통 위쪽을 내려서 맞춥니다.
    - 옷깃·어깨 높이는 walk_0·walk_2와 ±3px 안.
    - 머리 크기는 이웃 프레임과 ±3% 안.
  - 걷기 위아래 흔들림은 원래 walk_1·walk_3의 높이(top y 55 근처)를 따릅니다.
- `hand`·`crown`·`side`를 새로 찍고, 마스크·오버레이를 맞춰 `frames/swordsman/walk_1.png`, `walk_3.png`를 바꿉니다.
  - crown은 머리통 윗선(바보털 뿌리)입니다.

## 2. 도둑·상인 — `rejected/b/` 후보 채택 + 걷기 고침
- 후보 28장은 얼굴·옷·무기 손·머리장식이 대체로 맞습니다. 반려 사유 두 가지만 고칩니다.
- **걷기 반대발**
  - 지금 walk_0과 walk_2가 같은 발을 앞에 둡니다.
  - **walk_2만** 다시 만듭니다. 상반신(머리·몸통·팔·무기 손)은 지금 walk_2를 그대로 두고, 다리만 반대 발이 앞으로 나오게 바꿉니다.
    - 다리만 편집해도 되고, 다른 프레임 다리를 가져와 합성해도 됩니다.
    - 허리 이음매는 이웃 색으로 정리합니다.
  - 네 장을 이어 재생했을 때 왼발·오른발이 번갈아 나와야 합니다.
  - walk_1·walk_3(지나가는 자세)은 몸 방향·팔 규칙이 맞으면 그대로 둡니다.
- **도둑 hurt_0 높이**
  - 199px라 검사 오류입니다. 다른 캐릭터의 피격 높이(250~280px)에 맞게 같은 비율로 키웁니다. 발은 바닥선에 둡니다.
- **비율 차이**
  - 시트 사이에 머리·몸 크기가 다른 프레임이 있으면 같은 비율로 맞춥니다. idle_0이 기준입니다.
- 채택한 프레임·마스크·오버레이를 `frames/thief/`, `frames/merchant/`(마스크·오버레이도 같은 구조)로 옮깁니다.
- `game-manifest.json`의 `characters`에 `thief_male`, `merchant_female`을 더합니다.
  - 무기는 도둑 dagger, 상인 axe입니다.
  - 기존 다섯 캐릭터 데이터는 바꾸지 않습니다.
- `record.mjs`의 batch b 제외 목록(`excluded`)에서 두 캐릭터를 뺍니다.

## 할 일
1. 위 1·2를 합니다.
   - 새로 그리는 것은 walk_2 다리뿐입니다. 승인 원본 `docs/art/concepts/round3/class_lineup.png`를 첨부합니다.
   - 실제로 쓴 프롬프트는 `prompts/<캐릭터>-fix4-attempt<n>.txt`로 남깁니다.
2. 표준 기록 → 기록 보강 → 검사를 차례로 돌려 오류 0을 확인합니다.
   - `node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json`
   - `node docs/art-production/hero-sprites/record.mjs`
   - `node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json`
3. 검수 시트를 만들고 직접 봅니다: `verification/review_swordsman_male.png`, `review_thief_male.png`, `review_merchant_female.png`.
   - 무기 + 머리장식 두 개를 얹습니다.
   - 확인할 것: 14프레임의 몸 방향·무기 팔, 걷기 반대발, 머리장식 자리.
   - `preview_animation.gif`도 갱신합니다.
4. README에 수정 4 절을 더합니다.
   - 채택 프레임과 다듬은 방법(배율·이동량), 검사 결과, 남은 문제를 적습니다.
   - walk_2 다리가 두 번 해도 안 맞으면 그 캐릭터는 rejected에 두고 사유를 적습니다.

쓰기 범위: `docs/art-production/hero-sprites/`만. `src/`, `tools/`, `asset-specs/`, `docs/art-requests/`, `docs/art/`, `../asset-kit`은 바꾸지 않습니다. 커밋·푸시하지 않습니다. 끝나면 짧은 한국어 요약을 씁니다.
