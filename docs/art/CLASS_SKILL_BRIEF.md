상태: 기준 (2026-10-10). 2차 직업을 하나씩 마무리할 때(기본 동작 + 스킬 모션) 쓰는 공통 요청서입니다. 직업별 값은 `docs/art/class-briefs/<직업>.md`에 있습니다. 기본 동작 규격은 `docs/art/CLASS_PIXEL_BRIEF.md`를 그대로 따릅니다.

# 2차 직업 마무리 — 스킬 모션 공통 요청서

## 사용자 말 (그대로)
- "블랙 스미스는 제외하자. 2차 직업부터는 이제 스킬 모션도 해야 해. 그래서 한 직업 씩 마무리를 하는 걸로 하자"
- "쭉 진행해줘. 한 번에 하지 말고 한 직업씩"
- "앞으로 직업 모션은 라그나로크로 넘기던가, 트리 오브 세이비어로 넘기던가 해. 아니면 소드 오브 콘발리아 등."
- 기사를 맡길 때 한 말(모든 직업에 그대로):
  1. 등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것
  2. 레퍼런스를 체크할 것
  3. 스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것 (다음 그림을 그리기 전에 이전 그림을 체크해서 연결되게)
- 기사 15라운드를 보고: "저 정도면 훌륭해"

## 게임이 스킬 모션을 쓰는 방식
- 캐릭터의 `skillMotions`(스킬 id → 애니메이션 이름)에 있는 스킬을 쓰면, 쓰는 순간부터 그 애니메이션을 한 번 재생합니다. 없는 스킬은 지금처럼 일반 공격이나 캐스팅 동작을 씁니다.
- 타격(피해·이펙트)은 스킬을 쓴 뒤 **130ms**에 들어갑니다. 게임은 `hitFrame` 앞의 장들을 그 130ms에 맞춰 재생하고, 그 뒤 장들은 그림의 시간대로 재생합니다.
- 시전 시간이 있는 스킬은 모으는 동안 캐릭터의 `cast`(반복) 동작을 보여 주고, 다 모으면 스킬 모션을 재생합니다.
- 버프·자세 스킬은 타격이 없습니다. `hitFrame` 없이 쓰는 순간부터 재생합니다.
- 폭발·참격 이펙트는 게임이 위에 따로 그립니다. 스프라이트는 몸 동작과, 휘두름에 붙은 잔상까지만 그립니다.
- 영웅이 걷기 시작하면 모션이 끊깁니다. 스킬 모션 하나는 0.5~1초 안팎이 알맞습니다.

---

## REQUEST (for Codex)

Finish **one 2nd-job class** (named in the class brief): its base motions and its **skill motions**. The user's words are above: "2차 직업부터는 이제 스킬 모션도 해야 해. 그래서 한 직업 씩 마무리를 하는 걸로 하자".

If the class brief says the class has no pixel hero of its own yet, first make one exactly as `docs/art/CLASS_PIXEL_BRIEF.md` says. Then add the skills.

Keep the user's three rules:
1. Match proportion, style and size: our 쿠키 (r12) and Knight (r15).
2. Check the references. First the Ragnarok Online motions of this class (the attached sheet; addresses in `docs/art/CLASS_MOTION_REFS.md`). Then Tree of Savior, whose classes have their own skill animations, and Sword of Convallaria. Open them yourself where you can. Take the motion only: poses, order, rhythm and smears. Draw our own art; copy no pixels and save none of their images here.
3. Plan every skill motion first, then draw one frame at a time, checking the previous frame before drawing the next so they connect: same character, size and weapon hand. Reject and redraw any frame that drifts.

### Skills
The class brief lists the class's skills with what each does in the game.
- You decide how many skill motions to draw and which skills share one. Similar skills may share a motion; a signature skill may get its own.
- Name them `skill_<name>`.
- Map every listed skill id to a motion in the character's `skillMotions`. Leave a skill out only if a plain attack or cast suits it better, and say why in `NOTES.md`.
- In the game, the hit lands 130 ms after the skill starts. Keep the wind-up short, put `hitFrame` on the impact frame, and let the follow-through or hold come after it.
- Buffs and stances have no hit: omit `hitFrame`.
- Keep each motion about 0.5–1 s.
- If any listed skill has a cast time, also draw a short looping `cast` (charging) animation if the class has none.
- Draw the body and any smear that belongs to the swing. The game draws explosions and spell effects itself.

### Deliver
Into the folder named in the class brief:
- `manifest.json` in the `minimidgard.pixel/1` format, with the character's `animations` (incl. the new ones, `hitFrame` where there is a hit) and `skillMotions`;
- `body/`, `hair/`, `weapons/`, `grips/` for every frame, including weapon layers for each weapon type the class brief asks for;
- a GIF of each skill motion at 1× and 4×, `skills_contact_sheet.png`, and a side-by-side of the plain attack next to each skill motion;
- `NOTES.md`, short: the plan, the skill → motion mapping and why, what you took from each reference, and your checks between frames.

Hair names keep the class prefix. Do not leave build caches (e.g. `.swift-module-cache/`) or source zips in the folder. Write only inside that folder. Do not change `src/` or other folders. Do not commit or push. End with a short Korean summary.
