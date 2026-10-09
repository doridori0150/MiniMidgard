상태: 의뢰 (2026-10-10). 공통 요청서: `docs/art/CLASS_SKILL_BRIEF.md` (기본 동작은 `docs/art/CLASS_PIXEL_BRIEF.md`). 결과물: `docs/art-production/pixel-class-wizard/`.

# 위저드 — 마무리 (기본 동작 + 스킬 모션)

## 지금 있는 것
- 위저드 전용 도트 영웅은 아직 없습니다. 지금은 1차 직업 마법사(`mage_female_p2`, `docs/art-production/pixel-class-mage/`)의 그림을 빌려 씁니다.
- 기사 마무리본: `docs/art-production/pixel-class-knight/` (기본 동작 + 스킬 모션 10종 + 창 레이어). 같은 방식으로 합니다.

## 이번에 할 것
1. **위저드 도트 영웅**: `wizard_female_p2`. 성별은 여성(마법사 계열과 같음)입니다. 외형은 아스트라가 새로 디자인합니다. 마법사에서 전직한 모습으로 이어지게 할지는 아스트라가 정합니다.
   - 무기: 지팡이. 게임 무기 종류 `staff`, 레이어 이름 `staff`.
   - 동작: 대기, 걷기, 공격, 시전(cast), 피격, 쓰러짐, 앉기. 위저드는 거의 모든 사냥을 시전으로 하므로 cast가 중요합니다.
     - 손을 모으는 짧은 시작 장면은 `cast_start`(한 번), 유지 장면은 `cast`(반복)로 나눕니다. 게임은 시전을 시작하면 `cast_start`를 한 번 재생하고 `cast`를 반복합니다.
2. **스킬 모션**: 아래 스킬 전부.
3. 머리 이름에는 직업 접두어를 붙입니다(예: `wizard_..._p2`).

## 라그나로크 레퍼런스
- 첨부 시트: 라그나로크 위저드(여, 지팡이)의 모든 동작, 남동 방향. 마지막 줄(무기 공격 3)이 캐스팅입니다.
- 주소: `https://assets.latam-tools.com.br/gif?job=9&gender=female&weapon=10&action=<동작×8+7>` (`docs/art/CLASS_MOTION_REFS.md`).
- 라그나로크는 스킬 대부분을 캐스팅 동작에 이펙트를 얹어 보여 줍니다. 스킬마다 다른 몸 동작은 트리 오브 세이비어 마법 계열(예: 위저드, 파이로맨서, 크라이오맨서, 엘리멘탈리스트)의 스킬 모션을 함께 봐 주세요.

## 위저드 스킬 (게임 속 동작)
위저드는 마법사 스킬도 씁니다. 시전 시간은 5레벨 기준입니다. 시전 시간이 있는 스킬은 모으는 동안 `cast`를 보여 주고, 다 모으면 스킬 모션을 재생합니다.

| id | 이름 | 종류 | 속성 | 시전 | 게임에서 하는 일 |
|---|---|---|---|---|---|
| `fire_bolt` | 화염 화살 | 단일 연발 | 불 | 1.8초 | 대상에게 화염 화살 여러 발 |
| `cold_bolt` | 냉기 화살 | 단일 연발 | 물 | 1.8초 | 대상에게 냉기 화살 여러 발 |
| `lightning_bolt` | 번개 화살 | 단일 연발 | 바람 | 1.8초 | 대상에게 번개 화살 여러 발 |
| `soul_strike` | 영혼 강타 | 단일 연발 | 염 | 0.5초 | 영혼탄 여러 발 |
| `napalm_beat` | 염 폭발 | 대상 주변 범위 | 염 | 0.5초 | 대상 주변에 염 폭발 |
| `frost_diver` | 빙결 | 단일 | 물 | 0.8초 | 대상을 얼림 |
| `stone_curse` | 석화 | 약화 | 땅 | 0.5초 | 대상을 돌로 만듦 |
| `fire_ball` | 화염구 | 대상 주변 범위 | 불 | 1.5초 | 불덩이 폭발 |
| `thunderstorm` | 뇌우 | 지역 범위 | 바람 | 1.9초 | 지역에 벼락 여러 번 |
| `fire_wall` | 화염벽 | 바닥 설치 | 불 | 0.7초 | 앞에 불의 벽 |
| `safety_wall` | 수호벽 | 바닥 설치 | 염 | 1초 | 동료 발밑에 보호벽 |
| `sight` | 탐지의 불 | 자기 버프 | 불 | — | 몸 주위를 도는 불꽃 |
| `energy_coat` | 마력 갑주 | 자기 버프 | — | 2.5초 | 마력으로 몸을 감쌈 |
| `jupitel` | 뇌격구 | 단일 연타 | 바람 | 1.3초 | 번개 구체를 쏨 |
| `water_ball` | 물의 구 | 단일 연발 | 물 | 2.5초 | 물을 끌어올려 물방울을 쏨 |
| `earth_spike` | 대지 가시 | 단일 연발 | 땅 | 1.8초 | 땅에서 가시가 솟음 |
| `fire_pillar` | 화염 기둥 | 바닥 함정 | 불 | 0.9초 | 발밑에 불기둥 함정 |
| `ice_wall` | 얼음 벽 | 바닥 설치 | 물 | — | 앞에 얼음 벽 |
| `quagmire` | 늪 | 바닥 설치 | 땅 | — | 지역을 늪으로 |
| `heavens_drive` | 대지 진동 | 지역 범위 | 땅 | 2.5초 | 지역에 가시가 여러 번 솟음 |
| `meteor` | 유성우 | 넓은 지역 | 불 | 3초 | 하늘에서 유성이 떨어짐 |
| `storm_gust` | 폭풍한설 | 넓은 지역 | 물 | 4초 | 눈보라 |
| `lord_vermilion` | 천둥왕의 심판 | 가장 넓은 지역 | 바람 | 5초 | 하늘을 가르는 벼락 |
| `frost_nova` | 서리 폭발 | 자기 주변 범위 | 물 | 2.5초 | 자기 주위를 얼림 |
| `sightrasher` | 화염 폭산 | 자기 주변 범위 | 불 | 0.3초 | 불꽃을 여덟 방향으로 터뜨림 |
| `sight_blaster` | 탐지 폭발 | 자기 버프 | 불 | 1초 | 몸 주위에 터지는 불꽃 |
| `mystic_amp` | 마력 증폭 | 자기 버프 | — | — | 마력을 끌어올림 |
| `mana_barrier` | 마력 장벽 | 자기 버프 | — | 0.5초 | 몸 앞에 마력 장벽 |

- 마법의 불꽃·얼음·벼락 같은 이펙트는 게임이 그립니다. 스프라이트는 몸과 지팡이의 동작만 그립니다(지팡이 끝의 작은 빛 정도는 괜찮습니다).
- 마법은 스킬 모션이 시작되는 순간 발사됩니다. 지팡이를 내밀거나 내려찍는 장면에 `hitFrame`을 둡니다(게임 시간 130ms에 맞춰짐).

---

## REQUEST (for Codex)

Class: **Wizard**, character `wizard_female_p2` (female, like our mage line). It has no pixel hero of its own yet; it borrows the mage's (`docs/art-production/pixel-class-mage/`).

1. Make the Wizard's pixel hero first, exactly as `docs/art/CLASS_PIXEL_BRIEF.md` says: a new design by you, weapon layer `staff`, actions idle, walk, attack, `cast_start` (one-shot) + `cast` (loop), hurt, dead, sit.
2. Then add the skill motions for every skill in the table above, as `docs/art/CLASS_SKILL_BRIEF.md` says, with `skillMotions` in the manifest.

References: the attached Ragnarok Online Wizard sheet first, then Tree of Savior's magic classes for skill-specific body motions, then Sword of Convallaria. Take the motion only.

Deliver into `docs/art-production/pixel-class-wizard/`.

---

## 보강 1 — 걷기 (2026-10-10)
위저드 걷기가 4장(0·2장, 1·3장이 거의 같음)이라 사용자가 정한 장 수보다 적습니다.
- 사용자 말: "그리고 지금 이동 공격이 3프레임이라서 아무래도 어색한 거 같은데 보통 몇 프레임 정도를 쓰나? 스프라이트를 8장정도 쓰려나", "모션은 최소 6~8장은 써야 할 거 같아."
- 지금 다른 영웅들의 걷기: 쿠키·기사·도둑 8장, 마법사·궁수·복사·상인·초보자 6장.
- 라그나로크 위저드 걷기는 8장입니다(첨부 시트 2번째 줄).

### REQUEST (for Codex)
Redo only the **walk** of `wizard_female_p2` in `docs/art-production/pixel-class-wizard/` with 6–8 distinct frames (the user's rule above), a proper alternating stride, the staff in the same hand throughout. Keep the user's three rules: same proportion/style/size, check the reference (the RO Wizard walk row), plan the cycle first and draw one frame at a time, checking the previous frame before the next. Keep every other action, the design and the skill motions unchanged. Update `manifest.json`, the walk GIFs and contact sheet, and add a short section to `NOTES.md`. Write only inside that folder; no build caches. Do not change `src/`, commit or push. End with a short Korean summary.
