# 여성 마법사

**계획과 디자인.** `PLAN.md`를 먼저 작성했다. 쿠키 r12·기사 r15의 2등신, 대기 48px, 128×120, 발 (64,112), 오른쪽 3/4에 맞췄다. 크림색 물결 단발과 옆 땋음, 자주색 짧은 로브, 크림·금빛 장식, 민트 수정 지팡이를 새로 제작했다. `mage_female_p2`, 머리 `waved_braid_mage_p2`, 무기 `staff`. 머리에는 공용 네 가지 키색만 사용한다.

**모션 참고.** 첨부 RO 여성 마법사 남동 시트의 지팡이 머리 위 준비→앞 아래 내려침→숙인 유지, 가슴 앞 양손 모음→전방 시전, 뒤로 젖히는 피격과 엎드림을 참고했다. 포즈·순서·리듬만 가져왔으며 RO 픽셀이나 이미지는 저장하지 않았다. 대기3·걷기6·공격7·시전 준비2+유지3·피격2·쓰러짐3·앉기1, 총27장. 공격660ms의 280ms 지점이 `hitFrame: 3`이며, 타격 구간120ms보다 숙인 유지160ms를 길게 잡았다.

**한 장씩 확인.** 내장 `image_gen.imagegen`으로 다음 장마다 직전 장과 대기 원형을 참조했다. `PROMPTS.json`에 전체 요청, `FRAME_REVIEWS.json`에 장별 확인, `sources/`에 원본이 있다. 걷기 반대 접지가 이전 발과 비슷했던 최초 시도는 제외하고 다시 생성했다. 마지막 공격은 기존 대기 한 장을 그대로 재사용해 복귀를 맞췄다. 정규화에서 공격 머리 축소와 손의 머리 가림을 발견해, 머리를 별도 배율로 등록하고 실제 손 위치만 덮개로 분리했다. 대기·걷기·시전·앉기의 머리는 처음 확인한 같은 그림을 정수 좌표로 옮겼으며 기울어진 머리와 표정은 각 원화에서 추출했다.

**시전 사용.** `cast_start` 220ms를 한 번 재생한 뒤 `cast` 480ms를 반복한다. 준비를 루프에 넣지 않아 팔을 매번 거두지 않는다. `animationTransitions`는 전달용 설명이며 기존 게임이 읽는 기능이라는 뜻은 아니다. 미리보기의 재생기는 이 전환을 구현했다. 런타임 연동은 이번 범위에 포함하지 않았다.

**보기·검증.** `preview.html`은 서버 없이 열 수 있는 프레임·레이어 검수 페이지다. `contact_sheet.png`, 각 동작 1×/4× GIF, 준비→유지 3회 GIF, `comparison_1x.png`·`comparison_4x.png`(왼쪽 쿠키 / 가운데 기사 / 오른쪽 마법사)를 제공한다. GIF는 검토 편의를 위해 반복 재생하지만 게임용 공격·피격·쓰러짐의 manifest는 비반복이다. 완성 시트로 외형·손·접지·동작 연결을 육안 검토하며, `validate.py`는 레이어 재합성·알파·키색·그립·크기·타이밍·외부 파일 해시를 검사한다. Apple ImageIO의 독립 GIF 디코딩 결과는 `verification/gif_decode.json`, 최종 검사 결과는 `verification/validation.json`에 저장한다. 연결 브라우저가 없어 실제 브라우저 화면 검수는 수행하지 못했다.

**범위.** 이 폴더만 작성했다. `src/` 및 쿠키·기사 기준 파일의 작업 전 SHA256을 보존했다. 게임 적용·커밋·푸시는 하지 않았다.

최종 검수: **2,152개 검사 통과, GIF 18개 독립 디코딩, 기준 파일 1,251개 SHA256 동일.** 완성 전체 시트와 대기 크기 비교, 공격·시전·걷기·피격·쓰러짐·앉기 시트를 확인했다. 걷기는 머리 1px 상하 이동 때문에 픽셀 차이가 크게 생기므로 반복 끝의 변화량을 동작 중간 전환과 비교하고 머리·그립 좌표도 함께 검사했다. 검수 HTML의 JavaScript 구문과 내장 manifest 일치도 확인했다.

재생성·검사(저장소 루트):
```sh
PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-mage/build.py
swift -module-cache-path docs/art-production/pixel-class-mage/.swift-module-cache docs/art-production/pixel-class-mage/verify_gif.swift docs/art-production/pixel-class-mage
PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-mage/validate.py
```
