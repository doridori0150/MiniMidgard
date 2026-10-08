# 영웅 통짜 스프라이트 — Batch A

`mage_female`, `acolyte_female`, `archer_male` 각 14장, 총 42장의 전신 프레임과 같은 수의 머리 마스크·그립 오버레이를 제작했다. `staff`, `mace`, `bow`는 각각 256×256 RGBA PNG다. 모든 파일은 이 제작 폴더에만 저장했으며 기존 `baseline.json`은 보존했다.

게임용 파일은 `game-manifest.json`이다. `schema`, `canvas`(512×400, 원점 220/360), `animations`, `renderContract`와 머리장식 정의는 `src/assets/sprites/manifest.json`과 동일하다. 캐릭터 키는 `<line>_<gender>`다. 기존 머리장식 PNG는 이 폴더의 `equipment/`에 복사해 납품물의 경로를 자체 완결시켰다. 시전·앉기·사망의 무기 숨김도 기존 계약을 유지한다.

## 제작 기록

- 내장 `image_gen`으로 캐릭터별 14포즈 시트와 무기별 낱장을 생성했다. 매번 승인 라인업을 참조했으며 생성한 프레임을 다음 이미지의 참조로 사용하지 않았다.
- 실제 프롬프트 8개를 `prompts/`에 시도 번호와 함께 보관했다. 지팡이는 추가된 금색 고리, 철퇴는 잘못된 뾰족한 꽃잎 때문에 각각 한 번 재시도했다. 채택·탈락 원본과 이유는 `generation.json`에 기록했다.
- `source/annotations.json`에는 원본 전신 경계, 추출 영역, 손·머리 좌표, 공통 배율과 발 정렬 변환이 있다. 모든 자세에 원본 시트별 공통 배율을 적용했다. 앉기·눕기·피격의 높이를 선 자세에 맞춰 늘리지 않았다.
- `idle_1`은 얼굴과 의상 변화를 막기 위해 `idle_0` 전신을 발 고정 상태로 최대 2px 눌러 만든 호흡 프레임이다. 이 작은 전신 변형은 `derivation`에 따로 명시했다. 머리·얼굴·몸을 나누어 조립하지 않았다.
- 저알파 잡티 제거, 내부 색 평탄화, 색 경계 안티앨리어싱 보존, 연결 영역 기반 머리 마스크 추출을 적용했다. 활 손잡이의 녹색은 원화의 나무 팔레트로 정리했다. 그립은 해당 전신의 손 픽셀을 복사한 오버레이다.
- 무기 PNG는 손잡이 중심을 pivot으로 기록했다. 지팡이·철퇴의 손잡이→머리 축은 +X로 정렬되어 `attack_1`의 `hand.angle=0`에서 수평으로 뻗는다. 활의 `tip`은 발사 방향을 나타내며 활 자체는 세로다.

## 검증과 미리보기

요청한 표준 검사: **오류 0, 누락 0, 주의 2, 통과 267**. 원본 결과는 `check.json`이다. 주의 2건은 마법사 피격 높이 260px, 궁수 피격 높이 261px가 기준 310px보다 낮다는 항목이다. 두 자세는 실제로 무릎과 몸을 굽힌 전신이며, 공통 배율을 보존했다.

별도 검증 `verification/checks.json`: **PASS**, 좌우 방향·장비 유무·머리장식 조합 336건, 장비 잘림 0, 머리 마스크 누출 0. 계약 동일성, 전신·마스크·그립 각 42장, 140ms 공격 접촉의 손잡이 일치와 수평 축도 검사한다. 캐릭터 시트 배율과 파일·RGBA·레이어 해시는 표준 기록에 포함했다.

- `preview_vs_lineup.png`: 원화와 납품본을 240px·80px 높이로 비교.
- `preview_frames.png`: 42개 전신 포즈의 장비 없음/장착 비교.
- `preview_animation.gif`: 3명 × 대기·걷기·공격, 20ms 간격, 140ms 접촉 포함.
- `verification/hair-tints.png`: 모든 포즈에 갈색·검정·분홍 적용.
- `verification/anchor-checks.png`: 손·정수리·관자놀이 앵커와 머리장식.

생성형 재도색이므로 승인 원화의 픽셀 복제는 아니다. 원화 비교와 수치 검증은 아트 승인과 구분한다. 게임 소스 수정 및 런타임 통합은 이번 작업에 포함하지 않았다.

## 재현

별도 설치 없이 Node와 기존 asset-kit의 PNG 코덱을 읽기 전용으로 사용한다. 애니메이션 GIF에는 ffmpeg가 필요하다. 이 스크립트들은 이 폴더의 생성물을 다시 작성한다.

```sh
node docs/art-production/hero-sprites/build.mjs
node tools/asset-kit-sprites.mjs --root . --in docs/art-production/hero-sprites/game-manifest.json --out docs/art-production/hero-sprites/manifest.json
node docs/art-production/hero-sprites/record.mjs
node docs/art-production/hero-sprites/verify.mjs
node ../asset-kit/tools/check.mjs --root . --manifest docs/art-production/hero-sprites/manifest.json --spec asset-specs/hero-sprites.json --only mage_female,acolyte_female,archer_male,staff,mace,bow --json docs/art-production/hero-sprites/check.json
ffmpeg -hide_banner -loglevel error -y -framerate 50 -i docs/art-production/hero-sprites/verification/animation-frames/%03d.png -filter_complex '[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3' -loop 0 docs/art-production/hero-sprites/preview_animation.gif
```

`manifest.json`은 지정된 표준 변환 명령으로 만든 뒤, `record.mjs`로 생성 원본·공통 배율·해시·무기 시트·묶음 정보만 보강했다. 변환된 프레임 참조·기준점·레이어는 유지한다.
