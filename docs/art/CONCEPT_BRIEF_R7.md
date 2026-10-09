상태: 의뢰 (2026-10-09). 요청: 사용자 → Claude. 제작: Codex(아스트라). 결과물: `docs/art/concepts/round7/`.

# 컨셉 7라운드 — 쿠키 모션 다시 만들기 (대기 4 · 걷기 8 · 공격 8)

## 사용자 말 (그대로)
- 6라운드를 보고: "이 정도면 되는데 도트가 그냥 화질이 깨진 느낌이네. 아예 도트로 안 그려서 그런가. 지금은 NONE이 가장 나아."
- "그런데 모션은 확실히 수정해야 해. 트리 오브 세이비어나 저런 거 GIF 자료들 많으니까 분석해서 좀 만들어봐. 어떤 모션을 몇 장 정도 쓰는지."

## 정해진 것
- **그림:** 6라운드 쿠키 그대로입니다(`docs/art/concepts/round6/`). 비율·얼굴·옷·검을 유지하고, 도트 처리는 하지 않습니다(NONE).
- **모션 기준:** `docs/art/MOTION_SPEC.md`입니다. Claude가 트리 오브 세이비어 공식 GIF와 라그나로크 스프라이트를 분석해 만든 모션표입니다. 이 문서의 장수·시간·장별 자세를 그대로 따릅니다.

## 6라운드 모션에서 고칠 점 (Claude 측정)
- **걷기:** 8장 사이 상체 차이가 12~17%뿐이었습니다. 팔이 흔들리지 않고, 머리 높이가 8장 모두 같아서 미끄러지듯 보였습니다. 양 다리가 같은 색이라 어느 발이 앞인지 안 읽혔습니다.
- **공격:** 6번에서 검을 내렸다가 7번에서 다시 위로 드는 군더더기가 있었습니다.

---

## REQUEST (for Codex)

Remake 쿠키's motions to `docs/art/MOTION_SPEC.md`: **idle 4 frames, walk 8, attack 8**.
- Use the exact poses, body heights, arm swings, secondary motion and per-frame timings in its tables.
- Keep the round-6 character exactly: proportions, face, hair, costume and sword. Use `docs/art/concepts/round6/r6_lineup.png` and the round-6 frames as the design reference.
- No pixel-art processing (the user chose NONE).

Key points the round-6 walk missed:
- **Arms:** they swing opposite to the legs. The free (far) arm swings about 30° forward and back; the sword arm swings a little (about 10°).
- **Bob:** the body bobs: 2 px down on the down frames (2 and 6), 1–2 px up on the up frames (4 and 8), at the 80 px game size.
- **Secondary motion:** hair and the red sash follow one frame late.
- **Legs:** the near leg is lit and the far leg is a step darker, so frames 1 and 5 visibly lead with different feet.

For the attack:
- Hold on the wind-up peak (frame 3) and on the impact (frame 5).
- Frame 4 has one soft blur arc for the swing.
- Never raise the sword again after it has gone down.

Method tips:
- Generate each motion as one sheet, so the character stays the same across its frames.
- Then cut the frames out and align them on one canvas with the feet on the same ground line.
- Do not stretch frames to equal heights; let the bob come from the poses.

Deliver into `docs/art/concepts/round7/`:
- `r7_idle.png`, `r7_walk.png` and `r7_attack.png`: each motion's frames in a row, numbered, at 1× (about 80 px tall) and at 3× (smooth scaling, no pixel effect).
- `r7_idle.gif`, `r7_walk.gif` and `r7_attack.gif`: played at the spec timings, at 3×.
- `r7_compare_walk.png`: the round-6 walk and the new walk, frame by frame, one above the other.
- `frames/` (the individual frame PNGs, transparent background), `FRAMES.json` (per-frame duration, ground line and scale), `NOTES.md` and `PROMPTS.json`.

Check every frame yourself before finishing, against the spec tables:
- arm swing, bob and the alternating lit leg;
- the attack holds;
- the same hand on the sword;
- the same facing;
- no specks.

Redo frames that drift. Write only inside `docs/art/concepts/round7/`. Do not change `src/` or other files. Do not commit or push. End with a short Korean summary.
