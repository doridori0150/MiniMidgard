# 미니 미드가르 — 캐릭터 컨셉 의뢰서 Round 2 (스타일 방향 탐색)

## 요약 (사람용)

- **Round 1 반려 사유:** 흔한 "AI 애니 일러스트"처럼 나왔다. 매끈한 셀 채색, 머리카락 광택띠, 하이라이트 여러 개인 반짝이는 눈, 고르게 매끈한 디테일, 가챠게임 같은 광택 때문이다.
- **클라이언트 판단:** 현재 게임의 코드로 그린 **종이 인형 스타일**(`ref/current-lineup.png`)이 오히려 낫다. 최소한 개성이 있기 때문이다.
- **이번 목표:** 뻔한 스타일 말고, 개성 있는 **스타일 방향 5개**를 같은 캐릭터 3명 + 몬스터 1마리로 비교한다(컨셉만, 고르면 그 방향으로 라인업 재진행).
- **5개 방향** (종이는 A 하나만):
  - A. **지금 종이풍 정제** — 현재 스타일 그대로 완성도만
  - B. **90년대 셀 애니(레트로 OVA)** — 손으로 칠한 셀, 그림자 1단, 필름 그레인, 원작 출시(2002) 시대감
  - C. **만화책 컬러 페이지(펜선 + 수채)** — 펜촉 잉크선, 수채 번짐·종이 흰색, 스크린톤 그림자. 원작이 만화에서 나왔다는 점과 연결
  - D. **RO 시절 도트 스프라이트(HD 도트)** — 직접 찍은 도트, 1px 선택적 외곽선, 제한 팔레트. 가장 원작 향수
  - E. **와일드카드: 점토 스톱모션** — 무광 점토, 손자국, 통통한 덩어리감
- 실제 제작에선 부위별 레이어로 움직이므로, 모든 방향에서 부위가 분리돼 읽혀야 한다.

---

## REQUEST (for Codex)

You are a concept artist with a strong, distinctive personal style — not a generic illustrator. Use your **image generation tool** to create **5 style-direction boards** for the characters of *Mini Midgard*, an original 2D fantasy idle RPG for phones. This is a **concept round**: the client will pick ONE direction. Bold, characterful choices matter more than polish.

### Read the attached references first
1. `docs/art/ref/current-lineup.png` — the game's **current code-drawn paper-doll characters**. The client says: *"the current paper style looks much better — at least it has personality."* This is the **starting point**. Its strengths: flat shapes, each body part a separate piece, chunky super-deformed proportions (~2.5 heads), simple readable faces, strong silhouettes, one dark outline, almost no rendering. Keep that DNA.
2. `docs/art/concepts/round1/02_first_jobs.png` — **REJECTED**. The client called it "generic mass-produced AI illustration". Study it as a list of things to avoid: glossy cel shading with soft gradients, the "angel ring" hair highlight, huge eyes with several sparkling highlights, airbrushed blush, evenly over-detailed costumes (belts, pouches and buckles everywhere), polished "gacha key-art" sheen, warm parchment background with soft drop shadows, everyone in the same cute-smile pose.

### The 5 directions (one image each)
Every board shows the **same cast**, so the directions can be compared:
- a **Novice girl** — short bob, simple tunic, small dagger
- a **Swordsman boy** — steel-blue tunic, light breastplate, round shield, sword
- a **Mage girl** — violet robe, short cape, staff with a blue orb
- one **round pink jelly-slime monster** — original, NOT the Ragnarok Poring; give it its own twist

Show them full-body, 3/4 view facing right, at ~2.5–3 heads tall. Along the bottom, add a strip of the same four shrunk to about 80 px tall, to show how each style reads at real game size. Landscape 1536×1024. No text, no logos, no UI.

**A — `A_paper_refined.png` — "the current paper style, refined"**
- Stay very close to the attached current lineup: same proportions, the same flat-colour pieces with one dark outline, the same simple face construction.
- Make it confident and crafted:
  - deliberate line weight (thicker outer contour, thin inner lines)
  - a tight palette of 4–5 colours per character
  - one flat shadow tone at most
  - charming asymmetric details (a patched sleeve, a crooked cap, mismatched socks)
  - faces with real personality (smug, sleepy, determined), not one generic smile
- Subtle matte paper texture is allowed. No gradients, no gloss.
- Background: flat pale colour.

**B — `B_90s_cel.png` — "1990s hand-painted anime cel (retro fantasy OVA), super-deformed"**
- The look of a real painted animation cel photographed for a 1990s fantasy OVA or its SD omake segment:
  - even, slightly thick ink lines
  - flat cel paint with exactly ONE hard-edged shadow tone, no gradients anywhere
  - slightly muted warm palette, a little desaturated
  - subtle film grain and a soft scan look
- Character design sensibility of 90s fantasy anime: angular hair clumps, small simple eyes with a single highlight, expressive brows.
- Background: a simple painted backdrop card (soft gouache sky or a field), clearly separate from the cel layer.
- It must NOT look like modern glossy anime.

**C — `C_manga_watercolor.png` — "manga colour page: dip-pen ink + transparent watercolour"**
- Hand-inked with a dip pen:
  - lines swell and taper
  - small ink pools at corners
  - a few confident hatch lines
- Colour from transparent watercolour washes:
  - uneven pigment, blooms and bleeding edges
  - paper white left showing in highlights
  - colour sometimes slightly outside the lines
- Shadows may use a little dot screentone, like a 2000s manga colour page or a tankōbon cover sketch.
- Faces stay manga but hand-drawn and lively, not polished.
- Background: cold-press watercolour paper.

**D — `D_pixel_sprite.png` — "hand-pixelled sprites, early-2000s 2D MMORPG era"**
- True pixel art: each character is a sprite about 64–80 px tall at native resolution, shown enlarged with crisp nearest-neighbour pixels. No blur and no anti-aliased edges.
- Hand-placed pixel clusters.
- Selective outlining: a dark coloured outline, with lighter outline segments on lit edges.
- Limited palette of about 16 colours per sprite, light dithering only where useful.
- Clear readable faces made of a few pixels.
- Show each character at 3× (large) and again at 1× in the bottom strip.
- Background: flat muted colour.

**E — `E_clay.png` — "claymation / plasticine figures (wildcard)"**
- The characters are chunky handmade plasticine figures photographed for a stop-motion short:
  - matte clay with faint fingerprints and tool marks
  - rounded slightly lumpy forms
  - simple bead or press-dot eyes
  - accessories sculpted as separate little clay pieces
- Soft studio light with one gentle shadow. No gloss.
- Background: plain felt or card backdrop.
- It should feel handmade and characterful, not like a polished 3D render.

### Hard rules for all five
- The characters are **original fantasy adventurers**. No Ragnarok Online characters, sprites or logos, and do not imitate any existing game's art.
- **No:** glossy highlights, multi-highlight sparkle eyes, rim light, bloom or glow, sparkles, airbrushed shading, hyper-detailed costume clutter, modern "anime key visual" lighting, a generic smiling-chibi face. Soft gradients only where the medium naturally makes them (watercolour washes).
- **Embrace:** the honest texture and imperfection of each medium (cel grain, ink pooling, watercolour blooms, pixel clusters, fingerprints), limited palettes, distinct personalities and poses per character.
- **Keep each body part a separate, clearly bounded shape.** The chosen style will later be produced as layered parts animated in code (head, hair front/back, torso, arms, legs, weapon, shield, cape) or, for pixel art, as sprites. Parts must not melt into each other.
- **Readability at ~80 px tall is mandatory.** Big head, clear silhouette, high-contrast colour blocking.

### Process
- Generate each board separately. Before accepting one, review it against this question: *"Would someone glance at this and say 'generic AI anime illustration'?"* If yes, or if it drifts back towards the rejected round-1 look (gloss, sparkly eyes, modern anime rendering), regenerate it. Allow up to 3 tries per board, and push the medium harder each time.
- Save the final PNGs in `docs/art/concepts/round2/` with exactly the names above (5 files).
- Write `docs/art/concepts/round2/notes.md` in Korean. For each board give the final prompt used, then 2–3 lines on what makes it distinctive, plus one line on how it would be produced as layered sprites. Close with an honest self-critique.
- Do not modify any other files.
- Finish with a short summary in Korean.
