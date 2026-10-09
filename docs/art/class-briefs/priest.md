상태: 의뢰 (2026-10-10). 공통 요청서: `docs/art/CLASS_SKILL_BRIEF.md` (기본 동작은 `docs/art/CLASS_PIXEL_BRIEF.md`). 결과물: `docs/art-production/pixel-class-priest/`.

# 프리스트 — 마무리 (기본 동작 + 스킬 모션)

## 지금 있는 것
- 프리스트 전용 도트 영웅은 아직 없습니다. 지금은 1차 직업 복사(`acolyte_female_p2`, `docs/art-production/pixel-class-acolyte/`)의 그림을 빌려 씁니다.
- 마무리본 예: 기사 `pixel-class-knight/`, 위저드 `pixel-class-wizard/`, 헌터 `pixel-class-hunter/` (모두 `docs/art-production/` 아래).

## 이번에 할 것
1. **프리스트 도트 영웅**: `priest_female_p2`. 성별은 여성(복사 계열과 같음)입니다. 외형은 아스트라가 새로 디자인합니다. 복사에서 전직한 모습으로 이어지게 할지는 아스트라가 정합니다.
   - 무기: 철퇴. 게임 무기 종류 `mace`, 레이어 이름 `mace`.
   - 동작: 대기, 걷기, 공격, 시전(`cast_start` 한 번 + `cast` 반복), 피격, 쓰러짐, 앉기. 걷기와 공격은 6~8장 이상(사용자 기준, 공통 요청서). 프리스트는 힐·축복을 계속 시전하므로 시전이 중요합니다.
2. **스킬 모션**: 아래 스킬 전부.
3. 머리 이름에는 직업 접두어를 붙입니다(예: `priest_..._p2`).

## 라그나로크 레퍼런스
- 첨부 시트: 라그나로크 프리스트(여, 철퇴)의 모든 동작, 남동 방향. 마지막 줄(무기 공격 3)이 캐스팅입니다.
- 주소: `https://assets.latam-tools.com.br/gif?job=8&gender=female&weapon=8&action=<동작×8+7>` (`docs/art/CLASS_MOTION_REFS.md`).
- 라그나로크는 스킬 대부분을 캐스팅 동작에 이펙트를 얹어 보여 줍니다. 스킬마다 다른 몸 동작은 트리 오브 세이비어 성직자 계열(예: 프리스트, 클레릭, 팔라딘, 크리비)의 스킬 모션을 함께 봐 주세요.

## 프리스트 스킬 (게임 속 동작)
프리스트는 복사 스킬도 씁니다. 시전 시간은 5레벨 기준입니다. 시전 시간이 있는 스킬은 모으는 동안 `cast`를 보여 주고, 다 모으면 스킬 모션을 재생합니다.

| id | 이름 | 종류 | 시전 | 게임에서 하는 일 |
|---|---|---|---|---|
| `heal` | 힐 | 아군 회복 | — | 동료 한 명의 HP 회복 |
| `blessing` | 축복 | 아군 버프 | — | 동료 한 명 능력치 상승 |
| `increase_agi` | 속도 증가 | 아군 버프 | — | 동료 한 명 빠르게 |
| `impositio` | 성스러운 손길 | 아군 버프 | — | 동료 무기 공격력 상승 |
| `suffragium` | 기도 | 아군 버프 | — | 동료의 다음 주문을 빠르게 |
| `aspersio` | 성수 세례 | 아군 버프 | — | 동료 무기를 성속성으로 |
| `kyrie` | 수호의 장막 | 아군 보호막 | 1초 | 동료에게 보호막 |
| `angelus` | 천사의 가호 | 파티 버프 | 0.25초 | 파티 전원 방어 상승 |
| `sacrament` | 성체 강복 | 파티 버프 | — | 파티 갑옷을 성속성으로 |
| `magnificat` | 영혼의 찬가 | 파티 버프 | 2초 | 파티 회복력 상승 (찬가) |
| `gloria` | 영광송 | 파티 버프 | — | 파티 행운 상승 (찬가) |
| `cure` | 치료 | 상태 회복 | — | 동료 상태 이상 해제 |
| `slow_poison` | 해독 지연 | 상태 회복 | — | 동료 독 멈춤 |
| `status_recovery` | 상태 회복 | 상태 회복 | — | 동료 빙결·석화·기절 해제 |
| `decrease_agi` | 속도 감소 | 약화 | 0.5초 | 적을 느리게 |
| `signum_crucis` | 성호 | 약화 | 0.25초 | 성호를 그어 불사·악마 약화 |
| `lex_divina` | 침묵의 율법 | 약화 | — | 적을 침묵시킴 |
| `lex_aeterna` | 영원의 율법 | 약화 | — | 적이 다음에 받는 피해 두 배 |
| `holy_light` | 성스러운 빛 | 단일 공격 | 1초 | 성스러운 빛의 창 |
| `turn_undead` | 정화 | 단일 공격 | 0.5초 | 불사 몬스터를 정화 |
| `holy_strike` | 성스러운 일격 | 근접 2연타 | — | 철퇴로 두 번 내려침 |
| `ruwach` | 성광 | 자기 버프 | — | 주위를 비추는 빛 |
| `sanct_aura` | 성역의 오라 | 자기 버프 | — | 몸에서 빛이 퍼짐 |
| `pneuma` | 장막 | 바닥 설치 | — | 구름 장막 |
| `pr_safety_wall` | 수호벽 | 바닥 설치 | 1초 | 보호벽 |
| `sanctuary` | 성역 | 바닥 설치 | 2.5초 | 회복의 성역 |
| `magnus` | 대퇴마 | 바닥 설치 공격 | 3.3초 | 성스러운 십자가 결계 |
| `resurrection` | 부활 | 부활 | 있음 | 쓰러진 동료를 일으킴 |
| `redemptio` | 속죄 | 부활 | 2초 | 자신을 바쳐 동료 모두를 일으킴 |
| `teleport` | 순간이동 | 이동 | — | 파티와 함께 순간이동 |
| `warp_portal` | 차원문 | 이동 | 0.5초 | 차원문을 엶 |
| `aqua_benedicta` | 성수 만들기 | 제작 | 0.5초 | 물을 떠 성수를 만듦 |

- 빛·십자가·보호막 같은 이펙트는 게임이 그립니다. 스프라이트는 몸과 철퇴의 동작만 그립니다.
- 효과가 들어가는 순간(손을 뻗거나 내려치는 장)에 `hitFrame`을 둡니다(게임 시간 130ms에 맞춰짐). 자기 버프는 `hitFrame` 없이 둡니다.

---

## REQUEST (for Codex)

Class: **Priest**, character `priest_female_p2` (female, like our acolyte line). It has no pixel hero of its own yet; it borrows the acolyte's (`docs/art-production/pixel-class-acolyte/`).

1. Make the Priest's pixel hero first, exactly as `docs/art/CLASS_PIXEL_BRIEF.md` says: a new design by you, weapon layer `mace`, actions idle, walk, attack, `cast_start` (one-shot) + `cast` (loop), hurt, dead, sit.
2. Then add the skill motions for every skill in the table above, as `docs/art/CLASS_SKILL_BRIEF.md` says, with `skillMotions` in the manifest.

References: the attached Ragnarok Online Priest sheet first, then Tree of Savior's cleric classes for skill-specific body motions, then Sword of Convallaria. Take the motion only.

Deliver into `docs/art-production/pixel-class-priest/`.
