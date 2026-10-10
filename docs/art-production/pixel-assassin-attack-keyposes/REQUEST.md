상태: 의뢰 (2026-10-10). 공방 검토 세션 확인을 거쳤습니다. 납품은 공방에서 사용자가 보고 승인한 뒤 ③ 조립표로 넘어갑니다.
파이프라인 단계: B-2 ② 키포즈 시트(틀 T2). 대상: 어새신 공격 하나. 기준 기록: `docs/art/ssot/assassin_male_p2.md`(T0).

# 어새신 공격 — 키포즈 4장

## 사용자 말 (그대로)
- "미니 미드가르. 어쌔신으로." (첫 시범 대상, 공방 검토 세션 전달)
- "추가로 지금 미니가드 쪽 캐릭터 스프라이트 애니메이션 파이프라인도 엉망이야. 퀄리티도 들죽날죽하고, 모션도 엉성하고. 이것도 제대로된 파이프라인을 구성했으면 좋겠어." (공방 검토 세션 전달)
- "일단 그렇게라도 만든다음 노하우를 이용해서 수정해야지 처음부터 멋대로 대충 만들고 있으니 지금 계속 되풀이하고 있어."
- 그림 규칙 세 가지(기사 때 한 말):
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것
- "모션은 최소 6~8장은 써야 할 거 같아." 이번 단계는 키포즈 4장입니다. 6~8장은 다음 단계에서 이 4장을 배치하고, 필요한 사이 장만 더해서 만듭니다.

## 왜 다시 하나 (측정)
- 지금 어새신 공격은 8장입니다. 그중 두 곳(2→3장, 5→6장)이 사이 장 없이 튑니다. 연속 장 실루엣 겹침이 0.6 아래입니다.
- 피해가 들어가는 장(4번째)과 카타르가 가장 멀리 뻗은 장(5번째)이 한 장 어긋납니다.
- 이번에는 역할이 다른 자세 4장만 먼저 그리고, 사용자가 공방에서 확인합니다. 동작은 그다음에 조립합니다.

## 라그나로크 어새신 단검 공격 (첨부 3의 w-attack1 줄, 9장 900ms)
첨부 시트에서 읽은 동작입니다. 자세, 순서, 리듬만 따릅니다.

| 장 | 동작 |
|---|---|
| 1~2 | 단검을 가슴 앞에 세운 경계 자세 |
| 3~4 | 몸을 낮게 웅크리며 앞발을 딛고, 단검 팔을 몸 뒤로 당김. 천이 뒤로 날림 |
| 5 | 허리 높이에서 뒤에서 앞으로 크게 가로 베는 잔상. 몸은 가장 낮은 돌진 자세 |
| 6~7 | 잔상이 줄어들며 팔이 앞으로 뻗음 |
| 8~9 | 낮은 자세로 멈춤. 팔은 휘두른 끝(몸 앞쪽 너머)에 있음 |

---

## REQUEST (for Codex)

Draw **four key poses** of our Assassin's basic attack, as one sheet. This is step ② of the new pipeline. Do not draw the full animation. The user will look at these four in the workshop first; the animation is assembled from them afterwards.

Attachments, in this order:
1. **Style reference — Knight r15 idle frame 0** (`docs/art/ssot/style_knight_r15_idle0_1x.png` and `_4x.png`). Take **only** its pixel density, outline weight, eye style, 2-head proportion and shading steps. Do not take its armour, cape, sword or hair.
2. **Look reference — our Assassin idle frame 0** (`docs/art/ssot/look_assassin_idle0_1x.png` and `_4x.png`). Take its face, mask, hair (the four hair key colours), outfit, the two navy cloth tails, brass trim, palette, and the katar on the near hand. **Re-attach this same image for every pose.** Do not use a pose you just drew as the next reference.
3. **Motion reference — Ragnarok Online Assassin (male, dagger), south-east sheet**, row "w-attack1". Take the pose, order and rhythm only. Copy no pixels, do not copy its proportions, and save none of it in this repo.

The four poses, by role. Each comes with one line to check:

| # | Role | Pose (after the RO w-attack1 frames) | Check |
|---|---|---|---|
| 1 | **Wind-up (준비)** | RO 3–4: body drops low, front foot steps forward, the katar arm pulled back behind the body, cloth tails flying back | the katar is still on the near hand, only behind the body |
| 2 | **Apex (정점)** | the instant before the strike: weight fully on the front foot, katar at the back end of its arc and starting to sweep forward at waist height | lowest, most coiled silhouette of the four |
| 3 | **Contact (접촉)** | RO 5: the katar has swept forward and reaches **furthest in front** of the body at waist height; a short pale smear behind the blade along the arc (the smear is drawn on the weapon layer, like the Knight r15 slash) | this pose has the katar tip furthest forward of all four |
| 4 | **Recovery (회수)** | RO 8–9: still low, arm carried through past the front, beginning to rise back toward the idle stance | the same near arm holds the katar |

Rules for every pose:
- The same character as attachment 2, at the same body and head scale. Crouching poses are simply lower, not smaller.
- Canvas 128×120 per pose, feet on (64,112), facing right 3/4. Idle height is 48 px with hair; head no wider than 30 px.
- Keep margin around each pose. No weapon or foot may be cut off. Use real alpha only: no shadow, text, effect, glow or background.
- The katar is on the near hand in all four poses.

Deliver into `docs/art-production/pixel-assassin-attack-keyposes/`:
- `keyposes.png`: the four poses side by side, 512×120 at game size, in the order above, assembled the same way as the game (body + hair + katar layers).
- `keyposes_4x.png`: the same sheet ×4, nearest neighbour.
- `side_by_side.png`: Knight r15 idle 0, our Assassin idle 0, then the four poses, all at game size and at ×4.
- `poses/<n>_<role>/` for each pose: `body.png`, `hair_back.png`, `hair_front.png`, `katar.png`, `grip.png` on the 128×120 canvas. Also `pose.json` with the hand grip point, the katar tip point, the angle and the head point.
- `sources/`: the generated originals.
- `NOTES.md`, short. For each pose, write one line saying **whether anything differs from attachment 2**: face and mask, hair, vest, waist cloth, and the katar hand. Keeping the look is the first pass condition of this round. Then write the result of the pose's check line.

Do not draw in-between frames. Do not assemble an animation, change `src/`, commit or push. End with a short Korean summary.
