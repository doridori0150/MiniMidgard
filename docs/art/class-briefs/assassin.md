상태: 의뢰 (2026-10-10). 공통 요청서: `docs/art/CLASS_SKILL_BRIEF.md` (기본 동작은 `docs/art/CLASS_PIXEL_BRIEF.md`). 결과물: `docs/art-production/pixel-class-assassin/`.

# 어새신 — 마무리 (기본 동작 + 스킬 모션)

## 지금 있는 것
- 어새신 전용 도트 영웅은 아직 없습니다. 지금은 1차 직업 도둑(`thief_male_p2`, `docs/art-production/pixel-class-thief/`)의 그림을 빌려 쓰고, 카타르도 단검 그림으로 보입니다.
- 마무리본 예: 기사 `pixel-class-knight/`, 위저드 `pixel-class-wizard/`, 헌터 `pixel-class-hunter/`, 프리스트 `pixel-class-priest/` (모두 `docs/art-production/` 아래). 기사는 검과 창, 두 무기 레이어를 가집니다.

## 이번에 할 것
1. **어새신 도트 영웅**: `assassin_male_p2`. 성별은 남성(도둑 계열과 같음)입니다. 외형은 아스트라가 새로 디자인합니다. 도둑에서 전직한 모습으로 이어지게 할지는 아스트라가 정합니다.
   - 무기 레이어 두 가지:
     - **카타르**(`katar`, 기본 무기): 주먹 앞으로 날이 뻗은 무기입니다. 라그나로크 어새신의 상징이고, 음속 연격·그림자 송곳니는 카타르가 있어야 씁니다.
     - **단검**(`dagger`): 독 단검 던지기는 단검이 있어야 씁니다.
     - 무기를 쥔 손은 모든 프레임에서 같습니다. 카타르를 두 손에 다 끼는 디자인이면, 모든 장에서 두 손 다 보이게 합니다.
   - 동작: 대기, 걷기, 공격, 피격, 쓰러짐, 앉기, 그리고 시전이 있는 스킬을 위한 짧은 `cast`. 걷기와 공격은 6~8장 이상(사용자 기준, 공통 요청서).
2. **스킬 모션**: 아래 스킬 전부.
3. 머리 이름에는 직업 접두어를 붙입니다(예: `assassin_..._p2`).

## 라그나로크 레퍼런스
- 첨부 시트: 라그나로크 어새신(남, 단검)의 모든 동작, 남동 방향. 마지막 줄(무기 공격 3)이 캐스팅입니다.
- 주소: `https://assets.latam-tools.com.br/gif?job=12&gender=male&weapon=1&action=<동작×8+7>` (`docs/art/CLASS_MOTION_REFS.md`).
- 이 렌더러는 카타르를 그리지 않습니다(무기 번호 0~23을 확인: 1 단검, 2 한손검, 6 도끼만 그려짐). 그래서 시트는 단검으로 뽑았습니다. 카타르의 모양은 아스트라가 디자인하고, 동작은 어새신 단검 공격과 트리 오브 세이비어를 참고합니다.
- 라그나로크는 스킬 대부분을 공격 동작에 이펙트를 얹어 보여 줍니다. 스킬마다 다른 몸 동작은 트리 오브 세이비어 도적 계열(예: 어새신, 로그, 아웃로, 시노비)의 스킬 모션을 함께 봐 주세요.

## 어새신 스킬 (게임 속 동작)
어새신은 도둑 스킬도 씁니다. 시전이 있는 스킬은 독 폭발(0.5초)과 돌 줍기(0.25초)뿐입니다.

| id | 이름 | 종류 | 무기 | 게임에서 하는 일 |
|---|---|---|---|---|
| `sonic_blow` | 음속 연격 | 근접 8연타 | 카타르 | 눈에 보이지 않는 8연타 (대표 스킬) |
| `grimtooth` | 그림자 송곳니 | 범위 | 카타르 | 숨은 채로 땅 밑에서 칼날을 솟구치게 함 |
| `envenom` | 맹독 | 근접 | | 독을 묻힌 일격 |
| `sand_attack` | 모래 뿌리기 | 근접 | | 모래를 뿌려 눈을 가림 |
| `throw_stone` | 돌 던지기 | 원거리 | | 돌을 던짐 |
| `find_stone` | 돌 줍기 | 제작 | | 몸을 숙여 돌을 주움 |
| `venom_knife` | 독 단검 던지기 | 원거리 | 단검 | 독 묻은 단검을 던짐 |
| `venom_splasher` | 독 폭발 | 약화 | | 적에게 독 폭탄을 심음 |
| `venom_dust` | 독 안개 | 바닥 설치 | | 발밑에 독 안개를 뿌림 |
| `enchant_poison` | 맹독 부여 | 버프 | | 무기에 독을 바름 |
| `poison_react` | 독 반격 | 자기 버프 | | 독 반격 자세 |
| `detoxify` | 해독 | 상태 회복 | | 동료의 독을 풂 |
| `hiding` | 하이딩 | 자기 버프 | | 땅속으로 숨음 |
| `cloaking` | 은신 이동 | 자기 버프 | | 모습을 감춤 |
| `back_slide` | 뒤로 구르기 | 이동 | | 뒤로 굴러 물러남 |

- 독 안개·독 폭탄·돌·던진 단검 같은 이펙트와 투사체는 게임이 그립니다. 스프라이트는 몸과 무기의 동작만 그립니다.
- 숨는 스킬은 게임이 캐릭터를 흐리게 만들어 숨긴 상태를 보여 줍니다. 스프라이트는 숨기 직전까지의 몸 동작만 그립니다.
- 타격·투척·설치 순간인 장에 `hitFrame`을 둡니다(게임 시간 130ms에 맞춰짐). 연타 스킬은 첫 타가 130ms이고, 다음 타가 짧은 간격으로 이어집니다.

---

## REQUEST (for Codex)

Class: **Assassin**, character `assassin_male_p2` (male, like our thief line). It has no pixel hero of its own yet; it borrows the thief's (`docs/art-production/pixel-class-thief/`).

1. Make the Assassin's pixel hero first, exactly as `docs/art/CLASS_PIXEL_BRIEF.md` says: a new design by you, weapon layers `katar` (default) and `dagger` for every frame (like the Knight's sword and spear), actions idle, walk, attack, hurt, dead, sit, and a short `cast` for the skills with a cast time.
2. Then add the skill motions for every skill in the table above, as `docs/art/CLASS_SKILL_BRIEF.md` says, with `skillMotions` in the manifest.

References: the attached Ragnarok Online Assassin sheet first, then Tree of Savior's rogue classes for skill-specific body motions, then Sword of Convallaria. Take the motion only.

Deliver into `docs/art-production/pixel-class-assassin/`.
