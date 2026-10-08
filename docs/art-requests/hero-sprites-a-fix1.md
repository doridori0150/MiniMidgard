상태: 수정 요청 (2026-10-09). 요구서 `asset-specs/hero-sprites.json`, 원 요청서 `docs/art-requests/hero-sprites-a.md`의 batch a 납품 검수 결과입니다.

# 영웅 스프라이트 batch a — 수정 1: 무기를 쥐는 손이 프레임마다 바뀜

사용자 지적: "걷거나 공격할 때 반대 손 에셋을 이용해서 순간 무기와 팔이 반대 것으로 바뀌는 게 있어. 프리스트 걸을 때나 공격할 때 잘 봐 봐."

## 문제
대기·걷기에서는 가까운 쪽(화면 오른쪽, 몸 앞) 손이 무기를 쥡니다. 그런데 아래 프레임은 **먼 쪽 팔**의 주먹에 hand 기준점이 있어서, 재생하면 무기가 순간 반대 손으로 튑니다.

| 대상 | 프레임 | 지금 |
|---|---|---|
| acolyte_female | attack_0 | 먼 쪽 팔을 머리 위로 들고 hand가 (112,176). 가까운 팔은 가슴 앞 주먹 |
| mage_female | walk_2 | hand가 (207,274). 먼 쪽 팔이 지팡이를 쥠 |
| mage_female | attack_0 | 먼 쪽 팔을 들어 hand가 (162,237) |
| archer_male | walk_3 | hand가 (257,279). 활 쥔 손이 몸 가운데로 넘어가 다른 팔처럼 보임 — 확인 후 같은 기준으로 고침 |

## 규칙 (요구서 identity.rules에 추가됨)
- 무기를 쥐는 손은 **모든 프레임에서 가까운 쪽 손 하나**다.
  - 걷기: 그 팔은 앞뒤로만 흔들린다.
  - 공격 준비(attack_0): 그 팔을 뒤로·위로 젖힌다.
- 먼 쪽 팔은 무기를 잡지 않는다(빈 손, 또는 몸 옆이나 뒤).
- 궁수: 활을 쥔 앞손이 가까운 쪽 손이고, 시위를 당기는 손이 먼 쪽이다.

## 할 일
1. 위 4장만 다시 만든다. 다른 프레임은 그대로 둔다.
   - 외형 기준은 승인 원본 `docs/art/concepts/round3/class_lineup.png`이다. 매번 처음부터 다시 첨부한다.
   - 이어짐을 위해 지난 생성 원본(`docs/art-production/hero-sprites/source/`)은 자세·크기 참고로만 쓴다. 그림체·얼굴·옷은 바꾸지 않는다.
2. 고친 프레임의 `hand`·`crown`·`side` 기준점, `hairMask`, `gripOverlay`를 다시 만들고 `game-manifest.json`을 갱신한다.
3. 표준 기록을 다시 만든다.
   - `node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json`
4. 검사를 다시 돌려 오류 0을 확인하고 `check.json`을 갱신한다.
   - `node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --only mage_female,acolyte_female,archer_male,staff,mace,bow --json docs/art-production/hero-sprites/check.json`
5. `preview_frames.png`와 `preview_animation.gif`를 갱신한다. 무기를 얹은 걷기·공격 연속 프레임에서 무기가 한 손에 머무는지 보이게 한다.
6. 실제로 쓴 프롬프트를 `prompts/`에 `*-fix1-attempt<n>.txt`로 남긴다. 2번 다시 만들어도 맞지 않으면 그 프레임은 납품하지 말고 `rejected/README.md`에 사유를 적는다.

쓰기 범위: `docs/art-production/hero-sprites/`만. `src/`, `tools/`, `asset-specs/`, `docs/art-requests/`, `docs/art/`는 바꾸지 않는다. 끝나면 짧은 한국어 요약을 쓴다.
