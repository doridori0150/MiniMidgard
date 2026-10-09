상태: 의뢰 (2026-10-10). 공통 요청서: `docs/art/CLASS_SKILL_BRIEF.md`. 결과물: `docs/art-production/pixel-class-knight/`.

# 기사 — 마무리 (스킬 모션)

## 지금 있는 것
- 기사 도트 영웅 `knight_female_p2`: `docs/art-production/pixel-knight-r15/`. 사용자가 "저 정도면 훌륭해"라고 한 라운드입니다.
- 동작: 대기 4장, 걷기 8장, 공격 8장(`hitFrame` 3, 라그나로크 기사 공격처럼), 피격 2장, 쓰러짐 4장, 앉기 1장.
- 무기 레이어: 검(`sword`). 게임 속 양손검(`sword2h`)도 이 레이어로 그립니다.

## 이번에 할 것
1. 스킬 모션(아래 스킬 전부).
2. 시전 시간이 있는 스킬(창 휘두르기·회전 강타·돌격)을 위한 짧은 `cast`(모으기) 반복 동작.
3. **창(`spear`) 무기 레이어.** 게임 속 기사는 창도 들고, 창 찌르기·창 던지기는 창이 있어야 씁니다. 지금은 창을 들면 도트가 아닌 옛 그림으로 바뀝니다. 기사의 모든 장(기본 동작 + 스킬)에 창 레이어와 쥔 손 덧그림을 그려 주세요. 검과 같은 손입니다.

## 라그나로크 레퍼런스
- 첨부 시트: 라그나로크 기사(여, 한손검)의 모든 동작, 남동 방향. 마지막 줄(무기 공격 3)이 캐스팅입니다.
- 주소: `https://assets.latam-tools.com.br/gif?job=7&gender=female&weapon=2&action=<동작×8+7>` (`docs/art/CLASS_MOTION_REFS.md`).
- 라그나로크 2차 직업은 스킬 대부분을 공격·캐스팅 동작에 이펙트를 얹어 보여 줍니다. 그래서 스킬마다 다른 몸 동작은 트리 오브 세이비어 기사·검사 계열(예: 하이랜더, 바바리안, 페넌서, 카타프락트)의 스킬 모션을 함께 봐 주세요.

## 기사 스킬 (게임 속 동작)
| id | 이름 | 종류 | 게임에서 하는 일 | 시전 | 무기 |
|---|---|---|---|---|---|
| `bash` | 강타 | 근접 1타 | 대상에게 강력한 일격 | — | |
| `magnum_break` | 폭렬검 | 자기 주변 범위 | 자기 주변을 불꽃 폭발로 쳐서 밀어냄 | — | |
| `provoke` | 도발 | 약화 | 적의 시선을 끌어 자신을 치게 함 | — | |
| `endure` | 인내 | 자기 버프 | 경직 없이 버팀 | — | |
| `pierce` | 꿰뚫기 | 근접 | 꿰뚫는 찌르기, 크기 따라 1~3타 | — | |
| `spear_stab` | 창 찌르기 | 일직선 범위 | 일직선의 적을 모두 찌르고 밀어냄 | — | 창 |
| `spear_boomerang` | 창 던지기 | 원거리 | 창을 던졌다 되받음 | — | 창 |
| `brandish` | 창 휘두르기 | 앞쪽 범위 | 창을 크게 휘둘러 앞쪽을 쓸어냄 | 350ms | (탑승) |
| `twohand_quicken` | 양손검 가속 | 자기 버프 | 공격 속도 상승 | — | |
| `auto_counter` | 반격 | 자세 | 잠깐 막는 자세, 근접 공격을 막고 되받아침 | — | |
| `bowling_bash` | 회전 강타 | 범위 2연타 | 적을 후려쳐 주변까지 휩쓰는 2연타 | 350ms | |
| `charge_attack` | 돌격 | 근접 | 멀리 있는 적에게 단숨에 달려들어 일격 | 250ms | |
| `moon_slash` | 광월참 | 근접 3연타 | 초승달 세 줄기로 베는 3연타 | — | |
| `iron_stance` | 철벽 자세 | 자기 버프 | 방어 자세 | — | |
| `element_shift` | 속성 전환 | 자기 버프 | 무기 속성을 바꿈 | — | |
| `mana_edge` | 마력 부여 | 자기 버프 | 검에 마력을 두름 | — | |

- 검사(1차) 스킬 `bash`·`magnum_break`·`provoke`·`endure`도 기사가 씁니다. 그래서 함께 넣습니다.
- 연타 스킬은 첫 타가 130ms에 들어가고, 다음 타가 짧은 간격으로 이어집니다.

---

## REQUEST (for Codex)

Class: **Knight**, character `knight_female_p2`. It already has its pixel hero: round 15, `docs/art-production/pixel-knight-r15/`, which the user called "저 정도면 훌륭해". Keep its design and its base actions as they are.

1. Copy round 15 into `docs/art-production/pixel-class-knight/`, without `generated/`, `normalized/`, `sources/`, zips or caches.
2. Add the skill motions for every skill in the table above, as `docs/art/CLASS_SKILL_BRIEF.md` says, with `skillMotions` in the manifest.
3. Add a short looping `cast` (charging) animation for the skills with a cast time.
4. Add a `spear` weapon layer (with grip overlays where the hand closes over it) for every frame of `knight_female_p2`: base actions, cast and skills. Same hand as the sword. The spear skills (`spear_stab`, `spear_boomerang`, `brandish`) should read clearly with a spear. If you can, make them read with the sword too; otherwise say so in `NOTES.md`.

References: the attached Ragnarok Online Knight sheet first, then Tree of Savior's sword and spear classes for skill-specific body motions. Take the motion only.
