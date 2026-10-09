상태: 기준 (2026-10-10). 직업 하나씩 도트 영웅을 맡길 때 쓰는 공통 요청서입니다. 직업별 값은 `docs/art/class-briefs/<직업>.md`에 있습니다.

# 직업별 도트 영웅 — 공통 요청서

## 사용자 말 (그대로)
- "쭉 진행해줘. 한 번에 하지 말고 한 직업씩"
- "앞으로 직업 모션은 라그나로크로 넘기던가, 트리 오브 세이비어로 넘기던가 해. 아니면 소드 오브 콘발리아 등."
- 기사를 맡길 때 한 말(모든 직업에 그대로):
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것 (다음 그림을 그리기 전에 이전 그림을 체크해서 연결되게)
- 기사 15라운드를 보고: "저 정도면 훌륭해"

## 기준
- **크기·스타일:** 지금 게임 속 도트 영웅에 맞춥니다.
  - 쿠키 검사: `docs/art-production/pixel-hero-r12/`
  - 기사: `docs/art-production/pixel-knight-r15/`
  - 공통 규격: 2등신, 대기 키 48px, 캔버스 128×120, 발 기준점 (64,112), 오른쪽 3/4 시점.
- **모션:** 같은 직업의 라그나로크 온라인 모션입니다.
  - 첨부한 시트는 실제 클라이언트 스프라이트를 남동 방향으로 그린 것입니다.
  - 주소와 동작 번호는 `docs/art/CLASS_MOTION_REFS.md`에 있습니다.
  - 동작(자세·순서·리듬·잔상)만 가져오고, 그림은 우리 것으로 그립니다. 라그나로크 그림은 베끼거나 저장하지 않습니다.
- **외형:** 직업에 맞는 새 디자인을 아스트라가 정합니다. 예전 라인업·조립형·통짜 그림은 보지 않습니다.

---

## REQUEST (for Codex)

Make **one class** (named in the class brief) as a 2-head pixel hero for our game, the same way the Knight was made in round 15 (`docs/art-production/pixel-knight-r15/`), which the user called "훌륭해".

1. Match proportion, style and size: our 쿠키 (r12) and Knight (r15).
2. Check the references. The Ragnarok Online motions of this class are in the attached sheet: idle, walk, sit, standby, hurt, dead, weapon attacks and cast. Use them as the motion reference: poses, order, rhythm and smears. Draw our own art; copy no RO pixels and save no RO images here.
3. Plan the actions first, then draw one frame at a time, checking the previous frame before drawing the next so they connect: same character, size and weapon hand. Reject and redraw any frame that drifts.

Actions:
- idle, walk, attack, hurt, dead, sit;
- also **cast** if the class brief says so.

You decide frame counts and timing from the RO reference, adapted to our game. The attack's hit lands about halfway through a short swing; put `hitFrame` on that frame.

Deliver into `docs/art-production/pixel-class-<class>/`:
- a `manifest.json` in the `minimidgard.pixel/1` format of r15:
  - character id `<class>_<female|male>_p2`;
  - its own hair style(s) in the four hair key colours `#faf0d7 #e1cdb8 #b49b91 #49342f`;
  - a weapon layer named by our weapon type given in the class brief;
  - grip overlays;
  - per-character `animations` with `hitFrame`;
- `body/`, `hair/`, `weapons/` and `grips/`;
- GIFs of each action at 1× and 4×, `contact_sheet.png`, and a side-by-side of this hero next to 쿠키 and the Knight at 1× and 4×;
- `NOTES.md`, short: the plan, what you took from the RO reference, and your checks between frames.

Write only inside that folder. Do not change `src/` or other folders. Do not commit or push. End with a short Korean summary.
