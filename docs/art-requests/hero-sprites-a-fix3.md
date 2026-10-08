상태: 수정 요청 (2026-10-09). 요구서 `asset-specs/hero-sprites.json`, 앞 요청서 `hero-sprites-a-fix1.md`, `hero-sprites-a-fix2.md`. 수정 2가 게임에 들어간 뒤 사용자가 초보자 프레임에서 다시 찾아낸 문제와, 같은 구조를 가진 검사 프레임입니다.

# 영웅 스프라이트 — 수정 3: 몸통이 돌아간 프레임 (초보자·검사 원본)

사용자 지적:
- "지금 보니까 초보자 워크 1도 손이 반대야."
- "그리고 애초에 워크 1 자체가 이상해. 공격도. 어깨가 나왔고, 팔이 이상해."

## 무엇이 문제인가
- 초보자·검사는 묶음 a 이전(10월 7일)에 만든 원본 프레임입니다. 그중 몇 장은 **몸통이 다른 프레임과 다른 방향으로 돌아가** 있습니다.
- 그래서 생기는 문제:
  - 단검·칼을 쥔 팔이 몸 뒤쪽 팔처럼 보이고, 빈 주먹 팔이 앞으로 나와 손이 바뀐 것처럼 보입니다.
  - 먼 쪽 어깨가 몸 뒤로 툭 튀어나옵니다.
  - 무기 든 팔이 어깨가 아니라 가슴 한가운데에서 나옵니다.

| 대상 | 프레임 | 지금 문제 |
|---|---|---|
| novice_female | walk_1 | 몸통이 왼쪽으로 돌아 칼 든 팔(가까운 쪽)이 몸통 뒤에 가려진 뒤쪽 팔처럼 보임. 옷깃·몸 폭도 다른 걷기 프레임과 다름 |
| novice_female | attack_2 | 먼 쪽 어깨가 몸 뒤로 튀어나오고, 단검 든 팔이 가슴 가운데에서 비스듬히 나옴 |
| novice_female | attack_1 | 같은 문제가 있는지 확인. 있으면 함께 고침(빈 주먹이 가슴 앞을 가로지르지 않게) |
| swordsman_male | walk_1, walk_3 | 먼 쪽 빈 주먹이 몸 앞을 가로질러 나오고, 칼 든 손은 허리 뒤에 숨어 손이 바뀐 것처럼 보임 |
| swordsman_male | attack_2 | 먼 쪽 어깨가 몸 뒤로 튀어나오고, 칼 든 팔이 가슴 가운데에서 나옴 |

## 규칙 (요구서 identity.rules 보강)
- **몸 방향은 14프레임 모두 idle_0과 같습니다.**
  - 오른쪽 앞을 보는 3/4 자세로, 가슴이 화면 오른쪽 앞을 향합니다.
  - 걷기·공격에서 몸통을 반대로 비틀지 않습니다.
- 가까운 쪽(화면 오른쪽) 어깨에서 무기 든 팔이 나옵니다.
  - 그 팔이 몸통에 가려 뒤쪽 팔처럼 보이면 안 됩니다.
- 먼 쪽 팔은 몸 옆이나 뒤에만 둡니다.
  - 가슴 앞을 가로지르지 않습니다.
  - 먼 쪽 어깨가 몸 윤곽 밖으로 튀어나오지 않습니다.
- 걷기 중간 자세(walk_1, walk_3)는 walk_0·walk_2와 몸 폭·옷깃 위치·어깨 높이가 같습니다. 팔만 앞뒤로 조금 흔들립니다.
- 공격 마무리(attack_2)는 attack_1에서 이어집니다. 무기 든 팔을 가까운 어깨에서 앞아래로 휘둘러 내린 자세이고, 먼 쪽 팔은 몸 옆에 둡니다.

## 할 일
1. 위 프레임을 새로 만듭니다(attack_1은 확인 후 필요하면).
   - 외형 기준은 승인 원본 `docs/art/concepts/round3/class_lineup.png`입니다. 매번 첨부합니다.
   - 같은 캐릭터의 idle_0·walk_0·walk_2·attack_0(수정 1)을 몸 방향·크기·선 굵기 참고로 씁니다.
   - 그림체·얼굴·머리 모양·옷은 바꾸지 않습니다. 검사는 원래 프레임의 삐죽한 머리 실루엣을 지킵니다.
   - 선 굵기와 옷 질감(검사 파란 옷의 얼룩무늬, 초보자 옷 질감)을 이웃 프레임에 맞춥니다.
   - 수정 2의 궁수 walk_3처럼 선이 가늘어지거나 질감이 빠지지 않게 합니다.
2. 고친 프레임의 `hand`·`crown`·`side`·`hairMask`·`gripOverlay`를 새로 만들고 `game-manifest.json`을 갱신합니다.
   - crown은 머리통 윗선(바보털 뿌리)입니다. 고치지 않은 프레임과 머리의 같은 자리여야 합니다.
3. 표준 기록 → 기록 보강 → 검사를 차례로 돌려 오류 0을 확인합니다.
   - `node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json`
   - `node docs/art-production/hero-sprites/record.mjs`
   - `node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json`
4. 검수 시트 `verification/review_novice_female.png`, `verification/review_swordsman_male.png`를 다시 만듭니다.
   - 무기 + 머리장식 두 개를 얹습니다.
   - 시트를 직접 보고, 걷기 4장·공격 3장에서 무기 든 팔이 계속 가까운 어깨에서 나오는지 확인합니다.
   - `preview_animation.gif`도 갱신합니다.
5. 실제로 쓴 프롬프트는 `prompts/<캐릭터>-fix3-attempt<n>.txt`로 남깁니다.
   - 두 번 다시 만들어도 맞지 않으면 그 프레임은 납품하지 않고 `rejected/README.md`에 사유를 적습니다.
6. README에 수정 3 절을 더합니다: 고친 프레임, 검사 결과, 남은 문제.

쓰기 범위: `docs/art-production/hero-sprites/`만. `src/`, `tools/`, `asset-specs/`, `docs/art-requests/`, `docs/art/`, `../asset-kit`은 바꾸지 않습니다. 커밋·푸시하지 않습니다. 끝나면 짧은 한국어 요약을 씁니다.
