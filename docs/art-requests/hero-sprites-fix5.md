상태: 수정 요청 (2026-10-09). 요구서 `asset-specs/hero-sprites.json`, 앞 요청서 `hero-sprites-fix4.md`. 수정 4에서 채택한 도둑·상인을 Claude가 검수했습니다. 아래 문제 때문에 **아직 게임에 넣지 않았습니다**. 검사 walk_1·walk_3은 통과해서 게임에 들어갔습니다.

검수 근거(`verification/claude-review/`):
- `fix5_thief_size.png`: idle_0 / attack_0 / attack_2 / hurt_0를 같은 배율로 놓은 것
- `fix5_thief_walk.png`, `fix5_merchant_walk.png`: 걷기 4장, 무기 얹음
- `fix5_merchant_tint.png`: 갈색 머리색을 입힌 14장

# 영웅 스프라이트 — 수정 5: 도둑·상인 마무리

## 고칠 것

| 대상 | 프레임 | 지금 문제 | 고치는 법 |
|---|---|---|---|
| thief_male | attack_0 | 머리 크기는 idle과 같은데 몸·다리가 약 12% 크다(그림 top y 18, 높이 341px). 몸 비율이 다른 프레임과 다르다 | 다시 그린다: idle_0과 같은 머리·몸 비율, 칼 든 가까운 팔을 뒤로·위로 젖힌 준비 자세. 서 있는 높이 300~310px |
| thief_male | hurt_0 | 반려 사유(높이 199px)를 맞추려고 1.25배로 키워서 머리가 idle보다 약 9% 크다 | 처리로 맞춘다: 머리 크기가 idle과 같아지게 줄인다(약 0.9배, 발 기준점 고정). 높이는 피격 검사 하한 이상(약 220px)이면 된다 |
| thief_male | walk_2 | 다리를 붙인 자리가 보인다(허리 아래 가로 이음매, 다리 사이 틈). 다리가 짧고 거의 모여 있어 보폭이 없다 | 다시 그린다(아래 걷기 항목) |
| merchant_female | walk_2 | 붙인 다리가 앞치마 아래에서 떠 보이고, 먼 쪽 장화 색이 다르다. 보폭이 거의 없다 | 다시 그린다(아래 걷기 항목) |
| merchant_female | attack_0 | 전체가 idle보다 약 4~5% 크다(높이 321px) | 처리로 맞춘다: 머리 크기가 idle과 같아지게 줄인다(발 기준점 고정) |
| merchant_female | sit_0, dead_0 | 머리 마스크가 묶은 머리 끝을 덮지 않아 머리색을 바꾸면 그 부분만 크림색으로 남는다 | 마스크만 고친다 |

## 걷기 walk_2 (도둑·상인)
- walk_0은 한쪽 발이 앞으로 크게 나간 자세입니다. **walk_2는 반대쪽 발이 앞으로 같은 만큼 나간 자세**입니다.
  - 앞에 나간 발이 walk_0과 반대여야 합니다.
  - 보폭과 높낮이는 walk_0과 같습니다.
- **전신 한 장으로 새로 그립니다.** 다리만 붙이는 합성은 이번에는 쓰지 않습니다.
  - 상반신 자세(무기 팔은 가까운 쪽, 먼 쪽 주먹은 몸 옆)는 지금 walk_2를 따릅니다.
  - 그림체·선 굵기·옷 질감은 walk_0·idle_0에 맞춥니다.
- 어느 발이 앞인지 헷갈리지 않게 하는 법:
  - 가까운 쪽 다리(화면 앞, 밝은 색)와 먼 쪽 다리(뒤, 조금 어두운 색)를 구분해서 그립니다.
  - walk_0에서 앞으로 나간 다리가 가까운 쪽이면, walk_2에서는 먼 쪽 다리가 앞으로 나갑니다. 반대도 마찬가지입니다.
- 검수 시트에 walk_0·walk_2 다리를 확대해 나란히 놓은 그림(`verification/fix5-legs-<캐릭터>.png`)을 더합니다.

## 할 일
1. 위 표를 처리합니다.
   - 다시 그리는 것은 도둑 attack_0, 도둑·상인 walk_2입니다.
   - 승인 원본 `docs/art/concepts/round3/class_lineup.png`를 매번 첨부합니다.
   - 실제로 쓴 프롬프트는 `prompts/<캐릭터>-fix5-attempt<n>.txt`로 남깁니다.
2. 고친 프레임의 `hand`·`crown`·`side`·`hairMask`·`gripOverlay`를 새로 만들고 `game-manifest.json`을 갱신합니다.
   - 처리로 줄인 프레임은 기준점도 같은 배율로 옮깁니다.
3. 표준 기록 → 기록 보강 → 검사를 차례로 돌려 오류 0을 확인합니다.
   - `node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json`
   - `node docs/art-production/hero-sprites/record.mjs`
   - `node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json`
4. 검수 시트 `verification/review_thief_male.png`, `review_merchant_female.png`를 다시 만들고 직접 봅니다.
   - 무기와 머리장식 두 개를 얹습니다.
   - 확인할 것:
     - 14프레임 머리 크기가 같은지(idle_0 ±4%)
     - 몸 방향과 무기 팔
     - 걷기 반대발
     - 머리장식 자리
   - 머리색 시트 `verification/fix5-hair-<캐릭터>.png`(갈색)도 만듭니다.
5. README에 수정 5 절을 더합니다.
   - 두 번 다시 해도 안 맞는 프레임은 rejected에 두고 사유를 적습니다. 그 캐릭터 나머지는 그대로 둡니다.

쓰기 범위: `docs/art-production/hero-sprites/`만. 다른 다섯 캐릭터는 바꾸지 않습니다. `src/`, `tools/`, `asset-specs/`, `docs/art-requests/`, `docs/art/`, `../asset-kit`도 바꾸지 않습니다. 커밋·푸시하지 않습니다. 끝나면 짧은 한국어 요약을 씁니다.
