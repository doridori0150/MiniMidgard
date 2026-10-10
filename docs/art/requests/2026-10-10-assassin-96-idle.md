상태: 의뢰 (2026-10-10). 공방 검토 세션 확인을 거쳤습니다. 후보 2장 중 사용자가 고르거나 둘 다 거절합니다.
파이프라인: `asset-kit/docs/이펙트-연출-파이프라인.md` B-5-1 96px 시범 ① 디자인 대기 1장(틀 T1 그림체 맞추기). 승인되면 이 한 장이 **96px 그림체 기준(SSOT)**이 됩니다.

# 어새신 96px — 대기 1장

## 사용자 말 (그대로)
- "96px로 그럼 해보자."
- "평타도 마찬가지야. 전반적으로 에셋 작업 시 아마추어보다도 못하게 만드는데 이거 어떻게 해야할까?" (공방 검토 세션 전달)
- "일단 그렇게라도 만든다음 노하우를 이용해서 수정해야지 처음부터 멋대로 대충 만들고 있으니 지금 계속 되풀이하고 있어."
- 그림 규칙 세 가지:
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것

## 왜 96px인가
- 지금 영웅은 몸 48px(게임에서 59px로 표시)입니다. 얼굴이 10px 안팎이라 눈·마스크·카타르가 읽히지 않습니다.
- 그래서 어새신 한 명을 정확히 2배(몸 96px, 게임 118px 표시)로 그려 보고, 느낌과 공수를 잽니다.
- 다른 직업, 스킬 모션, 게임 코드는 이번 범위가 아닙니다.

---

## REQUEST (for Codex)

Draw **two candidates** of one idle frame of our Assassin at **twice the current size**: a 96 px tall body on a 256×240 canvas. Use the same brief for both, as two separate generations. Do not make the second a retouch of the first. The user will pick one or reject both. The approved one becomes the style reference for every 96 px hero, so draw both with that in mind.

Attachments, in this order:
1. **Look reference — our approved Assassin, idle frame 0 at 48 px** (`docs/art/ssot/look_assassin_idle0_4x.png`, shown ×4). Keep the same person and outfit: platinum asymmetric short hair, amber eyes, dark lower-face mask, purple light armour vest, two navy cloth tails at the waist, brass trim, and the katar on the near hand.
2. **Look reference — the approved attack key poses at 48 px** (`docs/art-production/pixel-assassin-attack-keyposes/keyposes_4x.png`). Use them only to see the outfit, cloth tails and katar from other angles. Do not draw these poses.
3. **Style reference — Knight r15 idle frame 0 at 48 px** (`docs/art/ssot/style_knight_r15_idle0_4x.png`). Take the 2-head proportion, the flat colours with one or two shading steps, and the dark brown outline character.

**The 96 px art must have twice the pixel density.** Redraw it with real 96 px detail. Do not enlarge the 48 px art.
- The outline stays **1 px** at the new size.
- The face gets real eyes, with the amber iris and a highlight readable.
- The mask edge, the vest trim and the katar blade each get their own clean shapes.

The frame:
- **Role:** idle, the breath held in. A relaxed fighting stance like the 48 px idle (attachment 1). The katar on the near hand, low and forward. Weight on both feet, back foot planted.
- **Canvas** 256×240, feet on (128,224), the lowest foot row is y = 223. Facing right, 3/4 view; the game mirrors it.
- **Size:** 96 px tall including hair, 2-head proportion like attachment 1, head no wider than 60 px.
- **Hair** in the four hair key colours only (#faf0d7 #e1cdb8 #b49b91 #49342f); the game recolours hair from them.
- **Alpha:** real alpha only. No shadow, text, effect, glow or background.

Deliver candidate A into `docs/art-production/pixel-assassin-96/idle_a/` and candidate B into `.../idle_b/`. Each folder holds:
- `body.png`, `hair_back.png`, `hair_front.png`, `katar.png`, `grip.png` on the 256×240 canvas.
- `pose.json`: hand grip point, katar tip point, katar angle, head point, back foot rearmost x on rows 220–223.
- `composite.png` (256×240) and `composite_4x.png`.
- `side_by_side.png`, all at the same pixel size: the 48 px Assassin idle (attachment 1) enlarged ×2 nearest, then this 96 px idle at ×1. Also the same pair ×2.
- `sources/`: the generated originals.
- `NOTES.md` (one file in `pixel-assassin-96/`), short, for each candidate:
  - one line on what differs from attachment 1 (face and mask, hair, vest, waist cloth, katar hand);
  - one line on whether the silhouette (head, shoulders, feet) matches the 48 px idle enlarged ×2 when the two are side by side;
  - one line on the measured height, head width and back-foot x;
  - how many images you generated and how many you rejected, with a reason for each rejection.

Do not draw any other pose. Do not change `src/`, commit or push. End with a short Korean summary.
