# R13 — 청록 판금 기사

`knight_female_p2`. 크림색 단발과 작은 옆머리 묶음, 은빛 판금, 청록 천, 금색 장식, 한손검의 신규 여성 기사. 기존 기사 자료는 열지 않았다. 게임 코드 수정·커밋·푸시는 하지 않았다.

## 계획과 결과

대기 4장(220ms씩), 걷기 8장(90ms씩), 공격 6장(110/40/40/40/130/70ms), 피격 2장(80/160ms), 쓰러짐 4장(80/100/140/1000ms), 앉기 1장(1000ms). 총 25장. 공격은 뒤위 준비→수직 위→앞위→앞아래→접촉→복귀이며 `hitFrame: 4`다. 쓰러짐·앉기는 게임에서 마지막 장을 유지한다. GIF는 관찰하기 쉽게 반복한다.

대기 키 **48px**, 머리 약 25px, 캔버스 **128×120**, 기준점 **(64,112)**. 쿠키와 같은 높이로 비교했다(`verification/cookie_comparison.png`, 왼쪽 쿠키 / 오른쪽 기사). 머리 앞·뒤, 몸, 무기, 손가락을 분리했다. 머리는 `#faf0d7 / #e1cdb8 / #b49b91 / #49342f`만 사용한다.

## 확인한 레퍼런스

- `docs/art/concepts/round9/r9c_idle_6x.png`, r12 쿠키의 공격 시트·대기 합성본·매니페스트: 큰 얼굴, 짧은 몸, 픽셀 밀도, 48px 키와 발 기준점을 취했다. 쿠키 픽셀을 기사에 복사하지 않았다.
- [도깨비의세계 공식 Google Play 공개 스크린샷](https://play.google.com/store/apps/details?hl=ko&id=com.kakaogames.dokkaebi): 브라우저에서 마을의 인게임 캐릭터를 직접 확인했다. 작은 얼굴과 의상을 분리하는 색 덩어리, 실루엣 가독성을 참고했다. 공개 이미지는 이 폴더에 저장하지 않았다.
- `docs/art/MOTION_REFERENCE.md`와 [Slynyrd Pixelblog 56](https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation): 공격의 준비·짧은 잔상·접촉 유지·복귀, 같은 손 유지 원칙을 적용했다. 정확한 게임용 시간은 로컬 문서의 430ms 기준을 사용했다.

## 한 장씩 확인한 과정

내장 `image_gen.imagegen`으로 매번 **단일 프레임**을 생성했다. 결과를 직접 보고 저장한 뒤, 직전 프레임을 다음 생성의 참조로 넣었다. 동작을 새로 시작할 때는 대기를 기준으로 삼았다. 프롬프트는 `PROMPTS.json`, 각 장 확인은 `FRAME_REVIEWS.json`, 생성 원본은 `source/`에 있다.

걷기 첫 시도에서 검 손이 바뀐 것을 발견해 채택하지 않고 다시 생성했다(`walk_0_rejected_hand.png`). 걷기는 양쪽 발의 접지·통과와 명도 차이를, 공격은 검 손·시계 방향 궤적을, 쓰러짐은 왼쪽으로 넘어가는 방향을 확인했다. 생성 후 대기·걷기의 머리 흔들림을 기준 머리로 고정하고, 칼 길이는 손과 날 폭을 고정한 채 손잡이에서 끝까지 약 21px로 통일했다. 머리 정렬 후 목 주변 빈틈을 발견해 수정·재검사했다. 후처리는 표준 Python 래스터 처리이며 `raster.py`의 일반 PNG/GIF 유틸리티만 r12에서 재사용했다.

## 자체 검수와 전달

6동작의 모든 프레임 시트, 쿠키 크기 비교, 머리색 3종·무기 숨김, Chrome 미리보기 표시를 확인했다. 레이어 125개와 완성본 25장의 합성 일치, 이진 알파, 네 머리 키색, 경계 잘림 없음, 손-자루 겹침, 공격 방향, 고정 머리를 검사했다. Apple ImageIO로 GIF 12개를 별도 디코딩해 크기·장수·시간을 확인했다. 결과: `verification/validation.json`.

자체 판단: 크기·재질 구분·동작의 순서가 읽히는 전달본이다. 대기/걷기 머리 흔들림과 검 길이 불일치를 수정했다. 공격·피격의 몸통은 개별 그림이라 완전한 리깅 보간은 아니며, 실제 게임 적용·플레이 검증은 이번 범위에 포함하지 않았다.

`preview.html`에서 확인. 게임 전달은 `manifest.json`과 `body/`, `hair/`, `weapons/`, `grips/`의 상대 경로를 함께 유지한다. 완성 PNG는 `composite/`, GIF는 `*_1x.gif`와 `*_4x.gif`, 전체 시트는 `contact_sheet.png`다. 전체 시트는 대기→걷기→공격→피격→쓰러짐→앉기 순서(0–24)다.

재생성: `python3 docs/art-production/pixel-knight-r13/build.py`. 검증: `python3 docs/art-production/pixel-knight-r13/validate.py`. 압축 RGBA는 원본 PNG를 Apple 색상 디코더로 읽은 중간 자료이며 후처리 재현을 위해 보관했다. GIF를 변경했다면 `verify_gif.swift`를 실행해 디코딩 결과를 갱신한 뒤 검증한다.
