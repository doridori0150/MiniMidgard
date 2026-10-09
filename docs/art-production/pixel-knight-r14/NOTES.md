# R14 — 전진 수평 찌르기

기존 내려베기를 **몸을 낮춰 내딛는 수평 찌르기**로 교체했다. 7장, 560ms, `hitFrame: 3`(0부터 셈). `minimidgard.pixel/1`, `knight_female_p2`, 128×120 캔버스·(64,112) 기준점·48px 대기 키를 유지했다. 검은 계속 같은 가까운 손이다. 대기 포함 다른 5개 동작은 그대로다.

**참고 선택.** [Pixel Moon의 Jab](https://pixel-moon-studio.itch.io/knight-pixel-art)를 동작 방향의 기준으로, [Mattz Art](https://xzany.itch.io/free-knight-2d-pixel-art)의 전진과 뒤늦게 따라오는 천을 보조 참고했다. [lotus_garden의 2타](https://lotus-garden.itch.io/pixel-knight-animated-character)는 첫 타가 기존 내려베기와 겹쳐 선택하지 않았다. 세 공개 페이지를 직접 열었다. 이 환경은 브라우저가 없고 웹 도구가 GIF를 재생하지 못해, 시각 분석은 사용자 첨부 프레임 분해표에 근거했다. 외부 이미지는 저장하지 않았다. lotus 페이지의 상품 장수(1타 8·2타 12)와 브리프의 미리보기 13장은 서로 다른 자료이므로 혼용하지 않았다.

**사전 계획 → 제작.** `PLAN.md`를 먼저 작성했다. 준비 80 → 무게를 뒤로 싣기 90 → 전진 40 → 접촉 유지 130 → 팔 회수 70 → 몸 세우기 70 → 기존 대기 80ms. 내장 `image_gen.imagegen`으로 새 자세 6장을 하나씩 생성하고 직전 채택본을 다음 참조로 넣었다. 마지막 1장은 r13 `idle_0` 그대로다. 프롬프트는 `PROMPTS.json`, 확인 기록은 `FRAME_REVIEWS.json`.

**장 사이 확인.** 0→1은 무릎 하강·칼 수평화, 1→2는 몸통·앞발 전진, 2→3은 팔 최대 신전·뒷다리 밀기, 3→4는 팔꿈치 회수·앞발 위치, 4→5는 몸 세움·칼 내림, 5→6은 기존 대기 연결을 확인했다. 1번의 최초 시도는 손 교체처럼 보여 폐기·재생성했다. 완성 크기로 정규화하며 원래 얼굴·머리 레이어를 고정하고 검 길이를 약 21px로 맞췄다. 머리 마스크가 칼날과 뒤 어깨를 자르던 문제를 수정해 재검사했다.

**검증.** `verification/validation.json`: 공격 외 프레임·레이어·GIF·시트 129개 파일의 SHA256 동일, 전체 26장 합성 일치, 이진 알파·머리 네 키색·손/자루 겹침·경계 잘림 없음. 새 0~5번의 머리와 몸은 각각 한 연결 덩어리다. 6번은 기존 대기와 픽셀 단위 동일하다. Apple ImageIO로 GIF 13개를 별도 디코딩해 장수·시간·크기를 확인했다. 접촉 장에서 칼끝 전진량이 최대이며, 1~4번 칼 각도는 수평이다.

**보기.** `preview.html`, `attack_1x.gif`, `attack_4x.gif`, `attack_contact_sheet.png`. `attack_r13_vs_r14.gif`는 왼쪽 r13 / 오른쪽 r14이며, r13의 원래 430ms 뒤 대기 130ms를 붙여 동시에 다시 시작한다. `knight_female_p2_runtime.zip`도 새 매니페스트·공격 레이어로 갱신했다. 기존 검수 흔적은 `verification/r13_inherited/`에 구분했다. 게임 적용·커밋·푸시는 하지 않았다.

재생성: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-knight-r14/build.py`. 검사: 같은 방식으로 `validate.py` 실행. GIF 재디코딩은 `swift -module-cache-path docs/art-production/pixel-knight-r14/.swift-module-cache docs/art-production/pixel-knight-r14/verify_gif.swift docs/art-production/pixel-knight-r14`.
