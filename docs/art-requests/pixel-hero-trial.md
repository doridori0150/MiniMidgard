상태: 요청 (2026-10-09). 요청: Claude (미니 미드가르 세션). 제작: Codex. 게임 연결·검수: Claude.

# 도트 영웅 시험 — 통짜 몸 + 머리카락 레이어 + 무기 (여검사 쿠키 1명)

## 사용자 요청
- "다시 그럼 새롭게 출발하자. 통 스프라이트 + 머리(얼굴이 아닌 머리)만 + 무기. 이렇게 잖아. 맞지?"
- "그럼 다시 도트풍으로 캐릭터 하나 만들어서 해보자."

## 무엇을 만드나
라그나로크처럼 레이어를 겹친 도트(픽셀 아트) 캐릭터입니다. 다만 얼굴은 몸 쪽에 둡니다.

| 레이어 | 담는 것 | 바뀌는 것 |
|---|---|---|
| 몸 (14프레임) | 얼굴, 몸, 옷, 팔다리. **머리통에 바짝 붙은 짧은 기본 머리** | 직업·성별마다 하나 |
| 머리카락 (스타일마다) | 앞머리·볼륨·묶은 머리처럼 기본 머리 위에 얹는 부분. 앞(얼굴 위)과 뒤(몸 뒤) 두 장 | 헤어스타일을 고르면 바뀜. 색은 팔레트로 바뀜 |
| 무기 (14프레임) | 몸 프레임과 같은 칸에 맞춘 무기 그림, 그리고 무기를 감싸는 손가락 | 무기 종류마다 |

대상은 사용자 캐릭터 **쿠키 = 검사(여)** 한 명입니다(2차 기사도 이 그림을 씁니다).
- 옷과 자세는 통짜 B 여검사(`docs/art-production/hero-sprites/frames/swordsman_female/`)를 따릅니다. 14프레임 자세 시트는 `docs/art-production/hero-sprites/verification/claude-review/final_swordsman_female.png`입니다.
  - 은빛 흉갑과 어깨 보호대, 파란 튜닉, 붉은 허리 천, 갈색 허리띠, 흰 바지, 갈색 장화·손목 보호대.
- 얼굴은 큰 파란 눈과 자신감 있는 작은 입입니다.
- 그림체 기준은 승인 라인업 `docs/art/concepts/round3/class_lineup.png`입니다. 다른 게임의 도트를 베끼지 않습니다(오리지널).

## 도트 규격 (`minimidgard.pixel/1`)
- **칸:** 128×120 투명 PNG이고, 발 중앙 기준점은 (64,112)입니다. 오른쪽을 보는 3/4 자세이고, 게임이 좌우로 뒤집습니다.
- **크기:** 서 있는 몸 높이(발바닥~기본 머리 꼭대기)는 **76px**입니다. 게임이 1px = 필드 1단위로 그립니다.
- **진짜 도트로:**
  - 픽셀 하나가 정확히 1px입니다(가짜 큰 픽셀 금지).
  - 반투명 픽셀이 없습니다(알파는 0 또는 255).
  - 몸 레이어는 32색 이하입니다.
  - 외곽선은 1px 진갈색이고, 안쪽 선은 부분 생략해도 됩니다.
  - 지글거리는 잡점과 계단이 깨진 곡선이 없어야 합니다.
- **만드는 법은 자유입니다.**
  - 큰 그림을 생성한 뒤 격자에 맞춰 줄이고 색을 줄여도 되고, 스크립트로 픽셀을 직접 다듬어도 됩니다.
  - 그대로 줄이기만 해서 흐릿한 결과는 받지 않습니다. 줄인 뒤 외곽선·덩어리를 손질해야 합니다.

### 머리 일관성 (가장 중요)
- **머리(얼굴+기본 머리)는 자세별로 한 번만 그리고, 몸 프레임에는 그 머리를 그대로 붙입니다.** 프레임마다 다시 그리지 않습니다.
  - `up`: 서 있는 모든 프레임(대기·걷기·공격·시전·앉기). 머리를 기울이지 않고 위치만 움직입니다.
  - `hurt`: 피격. 찡그린 얼굴, 조금 기운 머리.
  - `down`: 쓰러짐. 누운 머리, 감은 눈.
- 프레임마다 `head.point`(정수 좌표)를 기록합니다. 그 프레임에서 머리 그림의 기준점이 놓인 자리입니다.
- 이렇게 하면 얼굴이 프레임마다 흔들리지 않고, 머리카락 레이어가 늘 같은 자리에 맞습니다.

### 머리카락
- **기본 머리**(몸에 그려진 짧은 머리)와 머리카락 레이어는 **정해진 4색만** 씁니다. 게임이 이 4색을 머리색 팔레트로 바꿉니다.
  - 밝음 `#F8F0E0`, 중간 `#E8D0B0`, 그림자 `#C8A880`, 짙음 `#8A6A50`. 외곽선은 몸과 같은 진갈색입니다.
  - 이 4색은 머리카락 말고 다른 곳(옷·피부·무기)에는 쓰지 않습니다.
- **스타일 3종**을 자세(`up`/`hurt`/`down`)마다 앞(`front`)과 뒤(`back`) 두 장씩 만듭니다.
  - `ponytail`: 높이 묶어 뒤로 늘어진 머리와 앞머리.
  - `bob`: 어깨 위 단발과 바보털. 통짜 B 쿠키와 같은 인상입니다.
  - `long`: 등 중간까지 오는 긴 생머리.
- 기준점은 `pivot`입니다. 머리 그림의 기준점과 같은 자리이고, 게임이 `head.point`에 맞춰 놓습니다.
- `back`은 몸 뒤, `front`는 몸 위에 그립니다.
- 어떤 스타일을 얹어도 기본 머리가 어색하게 삐져나오지 않아야 합니다.
- 긴 머리 `back`이 가리던 자리(목·어깨)도 몸 레이어에 다 그려져 있어야 합니다. 스타일을 바꿨을 때 구멍이 나면 안 됩니다.

### 무기
- `sword`(한손검) 하나입니다. **몸과 같은 128×120 칸에 프레임별로** 그립니다. 같은 기준점이고, 그 프레임의 손에 쥔 모습입니다.
- 프레임마다 `z`(`behind`/`front`)와 `visible`을 적습니다. 앉기·쓰러짐만 `visible: false`입니다.
- 무기가 손 앞에 그려지면 손가락이 덮입니다. 그래서 손가락만 담은 `grip` 그림도 프레임별로 만듭니다(무기 위에 얹음).

### 지금까지 검수에서 나온 규칙 (반드시)
- 무기는 14프레임 모두 가까운 쪽(화면 오른쪽) 손에 있습니다. 먼 쪽 팔은 무기를 잡지 않고, 가슴 앞을 가로지르지 않습니다.
- **몸 방향:** 14프레임 모두 idle_0과 같습니다. 몸통을 반대로 비틀지 않습니다.
- **공격 준비(attack_0):** 무기를 든 팔을 뒤로·위로 젖힙니다.
- **공격 접촉(attack_1):** 무기가 앞으로 수평에 가깝게 뻗습니다. 접촉 시점은 공격 시작 후 140ms입니다.
- **시전(cast_0·1):** 무기를 쥔 채로 둡니다.
- **걷기:** walk_0과 walk_2는 앞에 나가는 발이 서로 반대입니다. 4장을 이어 보면 걸음이 번갈아야 합니다.
- **얼룩:** 얼굴·몸 위의 잡점과 발밑 얼룩이 없습니다.

## 동작과 시간 (통짜 B와 같음)
- `idle_0`, `idle_1`: 각 800ms
- `walk_0`~`walk_3`: 각 180ms
- `attack_0`, `attack_1`, `attack_2`: 100 / 80 / 100ms
- `cast_0`, `cast_1`: 각 360ms
- `sit_0`, `hurt_0`, `dead_0`

## 납품 (`docs/art-production/pixel-hero/`)
```
manifest.json
body/swordsman_female/<frame>.png
grips/swordsman_female/<frame>.png
weapons/sword/swordsman_female/<frame>.png
hair/<style>/<pose>_front.png, <pose>_back.png
```
`manifest.json` 형식(게임이 그대로 읽습니다):
```json
{
  "schema": "minimidgard.pixel/1",
  "canvas": { "size": [128, 120], "origin": [64, 112], "bodyHeight": 76 },
  "animations": { "idle": { "frames": ["idle_0", "idle_1"], "durations": [800, 800], "duration": 1600, "loop": true }, "...": "B와 같은 7개" },
  "hairKeys": ["#F8F0E0", "#E8D0B0", "#C8A880", "#8A6A50"],
  "characters": {
    "swordsman_female": {
      "class": "swordsman", "gender": "female", "defaultWeapon": "sword", "defaultHair": "bob",
      "frames": {
        "idle_0": { "image": "body/swordsman_female/idle_0.png", "head": { "point": [0, 0], "pose": "up" },
                    "weapon": { "z": "front", "visible": true }, "grip": "grips/swordsman_female/idle_0.png" }
      }
    }
  },
  "hair": {
    "bob": { "gender": "female", "pivot": [0, 0], "poses": { "up": { "front": "hair/bob/up_front.png", "back": "hair/bob/up_back.png" }, "hurt": {}, "down": {} } }
  },
  "weapons": { "sword": { "frames": { "swordsman_female": { "idle_0": "weapons/sword/swordsman_female/idle_0.png" } } } }
}
```
- 머리카락 그림의 크기는 자유입니다. `pivot`은 그 그림 안 좌표이고, 게임은 `head.point - pivot` 자리에 그립니다.
- 그리는 순서: `hair.back → (weapon z=behind) → body → (weapon z=front → grip) → hair.front`.

## 검수 자료 (`verification/`, 직접 보고 확인)
- `review.png`: 14프레임을 2줄 7칸에 놓고, 무기와 bob 머리를 얹어 4배로 확대합니다(nearest).
- `hair-swap.png`: idle_0·walk_2·attack_1·hurt_0·dead_0 × 스타일 3종 × 머리색 3종(갈색·검정·분홍).
  - 머리색은 4색을 팔레트로 바꿔 만듭니다. 예: 갈색 `#C08850 #A06838 #784828 #4A2C18`.
- `play-1x.gif`, `play-4x.gif`: 대기·걷기·공격·시전을 재생합니다.
- `game-size.png`: 1배와 2배로 필드 배경 위에 놓은 모습.
- 확인할 것: 위 규칙들, 머리 위치가 프레임마다 맞는지, 스타일을 바꿔도 구멍이나 삐져나옴이 없는지, 4색 말고 다른 색이 머리에 섞이지 않았는지.

## 기록
- 실제로 쓴 프롬프트는 `prompts/`에, 생성 원본은 `source/`에 남깁니다(`source/`는 커서 커밋하지 않아도 됩니다).
- 만든 과정과 남은 문제를 `README.md`에 짧게 적습니다.
- 두 번 다시 만들어도 규칙에 맞지 않는 프레임은 `rejected/`에 두고 사유를 적습니다.

쓰기 범위: `docs/art-production/pixel-hero/`만. `src/`, `tools/`, `asset-specs/`, `docs/art-requests/`, `docs/art/`, 기존 `hero-sprites/`, `../asset-kit`은 바꾸지 않습니다. 커밋·푸시하지 않습니다. 끝나면 짧은 한국어 요약을 씁니다.
