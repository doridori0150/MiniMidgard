상태: 의뢰 (2026-10-10). 공방 검토 세션 확인을 거쳤습니다.
파이프라인: B-5-1 96px 시범 ② 키포즈(틀 T2). 기준 기록: `docs/art/ssot/assassin_male_p96.md`(T0).

# 어새신 96px — 키포즈 10장 (대기 1 · 걷기 4 · 공격 4 + 휘두름 1)

## 사용자 말 (그대로)
- 96px 대기 후보를 보고 고름: "B가 훨씬 좋네."
- "96px로 그럼 해보자."
- 48px 키포즈를 보고 한 판정: "예. 휘두르는 걸로 보이지만, 타격감이 좀 떨어져 보여. 동작이 단순해서 그런거 같은데. 그리고 앞쪽 지지발과 뒷쪽 발이 흔들려서 캐릭터 전체가 흔들려 보여."
- "모션은 최소 6~8장은 써야 할 거 같아." — 이 키포즈들을 배치하고, 필요한 사이 장만 더해서 동작마다 6~8칸을 만듭니다.
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

---

## REQUEST (for Codex)

Draw **ten key poses** of our 96 px Assassin, **one image per pose**:
- 1 idle;
- 4 walk;
- 5 attack (4 key poses and the swing).

These are poses only. The animation is assembled from them afterwards; do not draw in-betweens or animations.

Attachments, in this order:
1. **The 96 px Assassin idle — the style and look reference** (`docs/art/ssot/ssot96_assassin_idle_1x.png`, `_4x.png`). This single image sets the style and the look: face and mask, round platinum hair in the four hair key colours, thin vest with V brass trim, navy scarf and two waist tails, the wide-bladed katar on the near hand, the palette and the 1 px outline. **Re-attach it for every pose.** Do not use a pose you have just drawn as the next reference.
2. **Our approved 48 px attack key poses and swing** (`docs/art-production/pixel-assassin-attack-keyposes/keyposes_4x.png` and `.../poses/5_swing/composite_4x.png`). They show the attack roles that were approved. Take the pose of each role; draw it at the 96 px style of attachment 1.
3. **Motion reference — Ragnarok Online Assassin (male, dagger), south-east sheet**: row "walk" for the walk, row "w-attack1" for the attack. Take the order and rhythm only. Copy no pixels, do not copy its proportions, and save none of it here.

Rules for every pose:
- Canvas 256×240, feet on (128,224), lowest foot row y = 223. Facing right, 3/4 view.
- Same body and head scale as attachment 1. Crouched poses are lower, not smaller. Head no wider than 60 px.
- The katar is on the near hand in every pose.
- Real alpha only. No shadow, text, effect, glow or background.
- Layers as in attachment 1's folder: `body`, `hair_back`, `hair_front`, `katar`, `grip`.

### Idle (1)
| # | Role | Pose | Check |
|---|---|---|---|
| idle_1 | **Breath out** | attachment 1 is the breath in; this is the breath out: shoulders and head **2 px lower**, katar hand 1–2 px lower, cloth tails settled | **the feet are pixel-identical to attachment 1**, and nothing else moves |

### Walk (4) — walking in place (the game moves the unit)
The body's rise and fall is drawn **into** the poses; the game does not shift them up or down. The planted foot is always on row 223.

| # | Role | Pose | Check |
|---|---|---|---|
| walk_1 | **Contact, near foot forward** | heel of the near foot just touching in front, far foot behind on its toes, feet about 30–36 px apart | crown **3 px lower** than in the passing poses |
| walk_2 | **Passing, near foot planted** | near foot planted under the body, far foot lifted and passing it | the highest crown of the four |
| walk_3 | **Contact, far foot forward** | the mirror of walk_1: far foot in front, near foot behind | same crown height as walk_1 |
| walk_4 | **Passing, far foot planted** | the mirror of walk_2 | same crown height as walk_2 |

- **Next round:** as soon as these four pass, the four in-betweens will be requested to the same standard: down after each contact, and up after each passing. The walk is then 8 frames, 90 ms each. Space the four poses so that a down and an up pose fit between them; RO's crown moves 0, 1, 3, 2 px through up, contact, down and passing.
- The katar hand swings opposite to the near leg and stays on the near hand.
- The cloth tails trail behind.

### Attack (4 + swing) — the same roles as the approved 48 px attack (attachment 2)
**The back foot does not move:** in all five poses, its rearmost pixel on rows 220–223 is at **x = 105**, the same as attachment 1.

| # | Role | Pose | Check |
|---|---|---|---|
| attack_1 | **Wind-up** | body drops low, front foot steps forward, the katar arm pulled back behind the body, cloth tails flying back | katar on the near hand, behind the body |
| attack_2 | **Apex** | weight fully on the front foot, katar at the back end of its arc, starting forward at waist height | lowest, most coiled silhouette |
| attack_5 | **Swing** | halfway from apex to contact. A wide pale crescent smear along the arc, on the **katar layer** only | back foot x = 105. Front foot between apex and contact |
| attack_3 | **Contact** | the katar reaches **furthest in front** at waist height; a short smear behind the blade on the katar layer | katar tip furthest forward of all five |
| attack_4 | **Recovery** | still low, arm carried through past the front, rising toward idle | back foot **on row 223** (in the 48 px version it floated 1 px) |

Deliver into `docs/art-production/pixel-assassin-96/keyposes/<id>_<role>/` (for example `walk_2_pass_near/`). Each folder holds the five layers plus `composite.png`, `composite_4x.png` and `pose.json`. `pose.json` has:
- role;
- hand grip point, katar tip point and angle;
- head point and crown y;
- rearmost back-foot x on rows 220–223;
- the x range of each foot on row 223.

Also deliver:
- `keyposes_idle.png`, `keyposes_walk.png`, `keyposes_attack.png`: each motion's poses side by side at game size, starting with attachment 1. The attack sheet is in play order: wind-up, apex, swing, contact, recovery.
- The `_4x` version of each of those sheets.
- `side_by_side_attack.png`: the approved 48 px attack ×2 next to the 96 px attack.
- In `NOTES.md`, one line per pose:
  - whether anything differs from attachment 1 (face and mask, hair, vest, waist cloth, katar hand);
  - the measured crown y and the back-foot x.

  Then give the total images generated and rejected, with a reason for each rejection.

Do not change `idle/`, `src/` or anything outside `pixel-assassin-96/keyposes/`. Do not commit or push. End with a short Korean summary.
