상태: 의뢰 (2026-10-10). 공통 요청서: `docs/art/CLASS_SKILL_BRIEF.md` (기본 동작은 `docs/art/CLASS_PIXEL_BRIEF.md`). 결과물: `docs/art-production/pixel-class-hunter/`.

# 헌터 — 마무리 (기본 동작 + 스킬 모션)

## 지금 있는 것
- 헌터 전용 도트 영웅은 아직 없습니다. 지금은 1차 직업 궁수(`archer_male_p2`, `docs/art-production/pixel-class-archer/`)의 그림을 빌려 씁니다.
- 마무리본 예: 기사 `docs/art-production/pixel-class-knight/`, 위저드 `docs/art-production/pixel-class-wizard/`.

## 이번에 할 것
1. **헌터 도트 영웅**: `hunter_male_p2`. 성별은 남성(궁수 계열과 같음)입니다. 외형은 아스트라가 새로 디자인합니다. 궁수에서 전직한 모습으로 이어지게 할지는 아스트라가 정합니다.
   - 무기: 활. 게임 무기 종류 `bow`, 레이어 이름 `bow`. 활은 목표(화면 오른쪽) 쪽으로 뻗은 팔이 쥐고, 다른 손이 시위를 당깁니다. 활을 쥔 손은 모든 프레임에서 같습니다.
   - 동작: 대기, 걷기, 공격(활 쏘기), 피격, 쓰러짐, 앉기. 걷기와 공격은 6~8장 이상(사용자 기준, 공통 요청서).
   - 화살은 게임이 따로 날립니다. 시위를 놓는 장에서 화살이 활을 떠나게 그리고, 날아가는 화살은 그리지 않습니다.
   - **매:** 게임이 헌터 어깨 위·주위에 매를 따로 그립니다. 스프라이트에는 매를 그리지 않습니다. 매에게 신호하는 팔 동작은 그려도 됩니다.
2. **스킬 모션**: 아래 스킬 전부.
3. 머리 이름에는 직업 접두어를 붙입니다(예: `hunter_..._p2`).

## 라그나로크 레퍼런스
- 첨부 시트: 라그나로크 헌터(남, 활)의 모든 동작, 남동 방향. 마지막 줄(무기 공격 3)이 캐스팅입니다.
- 주소: `https://assets.latam-tools.com.br/gif?job=11&gender=male&weapon=11&action=<동작×8+7>` (`docs/art/CLASS_MOTION_REFS.md`).
- 라그나로크는 스킬 대부분을 공격·캐스팅 동작에 이펙트를 얹어 보여 줍니다. 스킬마다 다른 몸 동작은 트리 오브 세이비어 궁수 계열(예: 레인저, 사피어, 팔코너, 퀘러슈터)의 스킬 모션을 함께 봐 주세요.

## 헌터 스킬 (게임 속 동작)
헌터는 궁수 스킬도 씁니다. 시전 시간이 있는 스킬은 모으는 동안 `cast`를 보여 주고, 다 모으면 스킬 모션을 재생합니다. 이 계열에서 시전이 있는 스킬은 밀어내는 화살(0.75초)과 블리츠 비트(0.8초)뿐입니다.

| id | 이름 | 종류 | 게임에서 하는 일 |
|---|---|---|---|
| `double_strafe` | 이중 사격 | 원거리 | 화살 2발을 연속 발사 |
| `arrow_shower` | 화살비 | 지역 범위 | 대상 지역에 화살비 (위로 쏘아 올림) |
| `arrow_repel` | 밀어내는 화살 | 원거리 | 강한 화살로 멀리 밀어냄 |
| `phantasmic` | 환영의 화살 | 원거리 | 화살 없이 쏘는 환영의 화살 |
| `improve_conc` | 집중력 향상 | 자기 버프 | 집중, 숨은 적을 드러냄 |
| `blitz_beat` | 블리츠 비트 | 매 공격 | 매가 대상에게 연속 급강하 |
| `falcon_strike` | 매의 일격 | 매 공격 | 매가 한 마리만 노리고 내리꽂힘 |
| `detect` | 탐지 | 자기 버프 | 매가 주위를 훑음 |
| `drover_whistle` | 몰이꾼의 호각 | 자기 버프 | 호각을 불어 몬스터를 끌어모음 |
| `skid_trap` | 미끄럼 덫 | 덫 설치 | 발밑에 덫을 놓음 |
| `land_mine` | 지뢰 | 덫 설치 | 발밑에 덫을 놓음 |
| `ankle_snare` | 앵클 스네어 | 덫 설치 | 발밑에 덫을 놓음 |
| `shockwave_trap` | 충격파 덫 | 덫 설치 | 발밑에 덫을 놓음 |
| `sandman` | 수면 덫 | 덫 설치 | 발밑에 덫을 놓음 |
| `flasher` | 섬광 덫 | 덫 설치 | 발밑에 덫을 놓음 |
| `freezing_trap` | 빙결 덫 | 덫 설치 | 발밑에 덫을 놓음 |
| `blast_mine` | 폭발 지뢰 | 덫 설치 | 발밑에 덫을 놓음 |
| `claymore_trap` | 클레이모어 트랩 | 덫 설치 | 발밑에 덫을 놓음 |

- 덫 자체와 터지는 이펙트, 매, 화살은 게임이 그립니다. 스프라이트는 몸과 활의 동작만 그립니다.
- 화살을 쏘는 스킬은 시위를 놓는 장에, 매 스킬은 매에게 신호하는 장에, 덫은 덫을 내려놓는 장에 `hitFrame`을 둡니다(게임 시간 130ms에 맞춰짐).

---

## REQUEST (for Codex)

Class: **Hunter**, character `hunter_male_p2` (male, like our archer line). It has no pixel hero of its own yet; it borrows the archer's (`docs/art-production/pixel-class-archer/`).

1. Make the Hunter's pixel hero first, exactly as `docs/art/CLASS_PIXEL_BRIEF.md` says: a new design by you, weapon layer `bow`, actions idle, walk, attack, hurt, dead, sit, and a short `cast` for the two skills with a cast time.
2. Then add the skill motions for every skill in the table above, as `docs/art/CLASS_SKILL_BRIEF.md` says, with `skillMotions` in the manifest.

References: the attached Ragnarok Online Hunter sheet first, then Tree of Savior's archer classes for skill-specific body motions, then Sword of Convallaria. Take the motion only.

Deliver into `docs/art-production/pixel-class-hunter/`.
