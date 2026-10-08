상태: 수정 요청 (2026-10-09). 요구서 `asset-specs/hero-sprites.json`, 원 요청서 `docs/art-requests/hero-sprites-a.md`. batch a 납품과 기존 두 캐릭터(novice_female·swordsman_male)를, 무기를 얹은 상태로 프레임 하나하나 검수한 결과입니다.

# 영웅 스프라이트 — 수정 1: 무기 든 팔 일관성 · 시전 중 무기 유지 · 얼룩

사용자 지적:
- "걷거나 공격할 때 반대 손 에셋을 이용해서 순간 무기와 팔이 반대 것으로 바뀌는 게 있어. 프리스트 걸을 때나 공격할 때 잘 봐 봐."
- "전사/검사도 마찬가지야."

## 규칙 (요구서 identity.rules에 추가됨)
- **무기를 쥐는 팔은 모든 프레임에서 가까운 쪽(화면 오른쪽, 몸 앞) 팔 하나다.**
  - 걷기: 그 팔은 앞뒤로만 흔들린다.
  - **공격 준비(attack_0): 무기를 든 그 팔을 뒤로·위로 젖힌다.** 먼 쪽 팔은 들지 않는다(몸 옆이나 뒤에 둔다).
  - 먼 쪽 팔은 어느 프레임에서도 무기를 잡지 않는다.
- **시전(cast_0·cast_1)에서도 무기를 쥔 채로 둔다.**
  - 무기를 든 팔을 앞으로 내밀거나 가슴 앞에 세운다. hand.visible = true.
  - 지금처럼 무기가 사라졌다가 다시 나타나면 안 된다. 빈손 시전 자세는 먼 쪽 손으로만 한다.
- 앉기(sit_0)·쓰러짐(dead_0)에서는 지금처럼 무기를 내려놓아도 된다(hand.visible = false).
- 궁수: 활을 쥔 앞손이 가까운 쪽 손이고, 시위를 당기는 손이 먼 쪽이다(지금 공격 프레임은 맞음).

## 고칠 프레임

| 대상 | 프레임 | 지금 문제 |
|---|---|---|
| acolyte_female | attack_0 | 먼 쪽 팔을 머리 위로 들어 철퇴가 그 손으로 감 (hand 112,176) |
| acolyte_female | cast_0, cast_1 | 철퇴가 사라짐 |
| mage_female | walk_2 | 먼 쪽 팔이 지팡이를 쥠 (hand 207,274) |
| mage_female | attack_0 | 먼 쪽 팔을 들어 지팡이가 그 손으로 감 (hand 162,237) |
| mage_female | cast_0, cast_1 | 지팡이가 사라짐 |
| archer_male | walk_3 | **먼 쪽 팔이 활을 쥠(반대 손으로 넘어감, 사용자 확인)** (hand 257,279). 가까운 쪽 팔이 활을 쥐게 다시 그림 |
| archer_male | cast_0, cast_1 | 활이 사라짐 |
| swordsman_male | attack_0 | 칼 든 팔은 아래에 두고 먼 쪽 빈 주먹을 치켜듦 → 다음 프레임에서 공격하는 팔이 바뀌어 보임 |
| swordsman_male | cast_0, cast_1 | 칼이 사라짐(두 주먹을 듦) |
| swordsman_male | 얼굴·머리 얼룩 | walk_3, attack_0, attack_1, cast_1 등 머리카락·얼굴에 주황 얼룩. 모든 프레임을 확인해 지운다 |
| novice_female | attack_0 | 단검 든 팔은 아래, 먼 쪽 빈 주먹을 듦 |
| novice_female | attack_2 | 머리 모양이 다른 프레임과 다름(더 뻗침) |
| novice_female | cast_0, cast_1 | 단검이 사라짐 |
| novice_female | walk_3 | 발밑 바닥선 아래 14px 얼룩(y≈384) |

## 기존 두 캐릭터(novice_female, swordsman_male) 처리
- 지금 게임 사본은 `src/assets/sprites/`(frames/novice, frames/swordsman, masks, grips, manifest.json)에 있다.
- 이 수정에서 두 캐릭터를 **제작 폴더로 옮겨 온다**: 고칠 프레임은 새로 만들고, 나머지는 그대로 복사한다.
  - `docs/art-production/hero-sprites/frames/novice/`, `frames/swordsman/`, `masks/…`, `grips/…`
  - `game-manifest.json`의 `characters`에 `novice_female`, `swordsman_male`를 넣는다.
  - 기존 무기(dagger, sword)와 머리장식(leaf, hairpin)도 함께 둔다.
  - 이제 game-manifest.json 하나가 다섯 캐릭터를 모두 담는다.
- `src/`는 바꾸지 않는다. 게임 반영은 Claude가 한다.

## 할 일
1. 위 프레임만 다시 만든다. 다른 프레임은 그대로 둔다.
   - 외형 기준은 승인 원본 `docs/art/concepts/round3/class_lineup.png`이다. 매번 처음부터 다시 첨부한다.
   - 이어짐을 위해 같은 캐릭터의 기존 프레임은 **자세·크기 참고로만** 쓴다. 그림체·얼굴·옷은 바꾸지 않는다.
2. 고친 프레임의 `hand`(점·각도·z·visible)·`crown`·`side` 기준점, `hairMask`, `gripOverlay`를 다시 만들고 `game-manifest.json`을 갱신한다.
3. 표준 기록을 다시 만든다.
   - `node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json`
4. 검사를 다시 돌려 오류 0을 확인하고 `check.json`을 갱신한다.
   - `node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --json docs/art-production/hero-sprites/check.json`
5. **검수 시트를 만든다**: `verification/review_<캐릭터>.png`
   - 캐릭터마다 14프레임을 2줄 7칸으로 놓는다.
   - 무기를 hand 기준점에 얹고(renderContract 순서), hand 점을 빨간 점으로 표시하고, 프레임 이름을 단다.
   - 무기를 든 팔이 모든 프레임에서 같은지 한눈에 보이게 한다.
   - `preview_animation.gif`도 무기를 얹은 상태로 갱신한다.
6. 실제로 쓴 프롬프트를 `prompts/`에 `*-fix1-attempt<n>.txt`로 남긴다. 2번 다시 만들어도 맞지 않으면 그 프레임은 납품하지 말고 `rejected/README.md`에 사유를 적는다.

쓰기 범위: `docs/art-production/hero-sprites/`만. `src/`, `tools/`, `asset-specs/`, `docs/art-requests/`, `docs/art/`는 바꾸지 않는다. 끝나면 짧은 한국어 요약을 쓴다(고친 프레임 목록, 검사 결과, 남은 문제).
