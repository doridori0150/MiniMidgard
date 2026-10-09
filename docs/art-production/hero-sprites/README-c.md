# 여검사 납품 — swordsman_female

`docs/art-requests/hero-sprites-c.md`의 마지막 덧붙임을 우선 적용했다. `game-manifest.json`에는 `characters.swordsman_female`만 추가했다(`class: swordsman`, `gender: f`, `defaultWeapon: sword`). 기존 일곱 캐릭터의 프레임·마스크·그립·기준점, 공용 장비는 그대로다. 보호 대상 786개 파일의 SHA256과 기존 매니페스트 항목을 비교했다. 최초 검증에는 전부 일치했고, 최종 확인에서는 `src/ui/Modals.tsx` 한 파일의 별도 변경이 감지되었다. 이 작업은 `src/`에 쓰기 작업을 하지 않았으며 해당 변경을 그대로 보존했다. 나머지 785개 파일은 일치한다.

- `frames/swordsman_female/`: 512×400 통짜 프레임 14장
- `masks/swordsman_female/`: 정렬된 머리카락 마스크 14장
- `grips/swordsman_female/`: 손가락 오버레이 14장
- 발 원점 (220,360), 기준 높이 310, 기존 애니메이션 타이밍 사용
- `preview_frames.png`, `preview_vs_lineup.png`, `preview_animation.gif`
- `verification/review_swordsman_female.png`: 검·leaf·hairpin, 빨간 손 기준점
- `verification/c-hair-brown.png`, `verification/c-hair-tints.png`: 갈색·검정·분홍 검수

내장 `image_gen`으로 제작했다. 매번 승인 라인업과 남검사 의상, 여초보자 얼굴·머리 원본을 참조했다. 실제 프롬프트는 `prompts/swordsman_female-*.txt`, 원본·선택 프레임·공통 배율·해시는 `generation.json`의 `sources` 및 `batchC`에 기록했다. 걷기 반대 접지와 누움만 별도 통짜 생성본으로 교체했다. 머리·몸·얼굴 조립은 하지 않았다. `idle_1`은 `idle_0` 전신에 발을 고정한 2px 호흡 변형을 적용했다.

검사 결과:

- 여검사 단독: 오류 0, 주의 1
- `--only` 없는 전체 검사: 오류 0, 주의 2, 누락 0 (`check.json`)
- 주의 2건은 기존 도둑과 새 여검사의 공격 준비→접촉 손 이동량이다. 여검사는 머리 옆의 준비 손에서 정면 접촉 손까지 약 87.3px 이동해 77.5px 경고 기준을 넘는다. 같은 가까운 팔임을 검수 시트에서 확인했으며, 경고를 숨기기 위해 기준점을 옮기지 않았다.
- 112개 부속·방향 조합: 잘림 0, 머리 마스크 누출 0, 그립 누출 0
- 머리 마스크 면적 환산 선형 크기: idle 대비 -2.62%~+2.98%. 바보털·머리 기울기·팔 가림 때문에 마스크 외접 폭/높이만으로 두개골 크기 ±4%를 독립적으로 보증하지는 않는다. 원본 수치는 `verification/c-head-metrics.json`에 남겼다.
- GIF: 1000×280, 80프레임, 1.6초 반복. idle·walk·attack·cast를 무기와 머리장식과 함께 재생한다.

재현: `node docs/art-production/hero-sprites/build-c.mjs` → `node docs/art-production/hero-sprites/record-c.mjs` → `node docs/art-production/hero-sprites/verify-c.mjs`. 전체 검사 명령은 요청서와 동일하다. `source/`와 대부분의 `verification/`는 기존 저장소 정책에 따라 Git 무시 대상이지만 로컬 납품 폴더에 보존했다. 게임 연결은 이번 요청 범위에 포함되지 않아 `src/`를 변경하지 않았다.
