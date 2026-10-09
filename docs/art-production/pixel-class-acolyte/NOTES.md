# 복사 — acolyte_female_p2

**계획과 제작.** 상아색 예복·자주색 스톨·금색 잠금 장식, 옆가르마 단발과 낮은 묶음머리로 새 디자인을 만들었다. `PLAN.md`를 먼저 작성하고 내장 `image_gen.imagegen`으로 한 장씩 생성했다. 매번 직전 결과를 보고 다음 생성의 참조로 전달했다. 원본과 제외본은 `sources/`, 전체 프롬프트는 `PROMPTS.json`, 개별 검토는 `FRAME_REVIEWS.json`이다. 공격 마지막 장은 대기 장을 재사용해 정확히 복귀한다.

**모션.** 첨부 RO 여성 복사의 남동 방향 시트에서 얌전한 대기, 발 교대, 어깨 준비→머리 뒤 치켜들기→갈색 하강 잔상→숙인 자세의 긴 멈춤, 가슴 앞 기도, 뒤로 젖히기와 쓰러짐을 참고했다. RO 그림·픽셀은 복사하거나 저장하지 않았다. 외부 실시간 재생을 확인했다고 주장하지 않는다. 대기 3장/720ms, 걷기 6장/540ms, 공격 7장/660ms, 시전 4장/760ms, 피격 2장/260ms, 쓰러짐 3장/1240ms, 앉기 1장/1000ms. 공격 `hitFrame: 3`(0부터 시작)은 300–350ms로 전체 동작의 중앙을 포함한다. 타격 직후 낮은 자세를 160ms 유지한다. 시전은 반복, 쓰러짐과 앉기는 마지막 장 유지다.

**장 사이 확인과 수정.** 대기 최초 시도는 몸이 길어 재생성했다. 걷기 3번·공격 0번의 무기 손 교체를 발견해 그 장만 다시 그렸다. 쓰러짐 1·2번의 길어진 자루와 앉기 최초 시도의 긴 하체도 수정했다. 가까운 손을 계속 철퇴 손으로 사용하며, 시전에는 다른 손을 그 손 앞에 모은다. 원화의 자세를 128×120 캔버스에 최근접 샘플링하고 대기 키 48px, 머리 24px, 발 기준점 (64,112)에 맞췄다. 색상 제한·레이어 분리만 코드로 처리했으며 캐릭터 그림을 도형 코드로 대체하지 않았다.

**보기와 검증.** 최초 머리색 교체 검토에서 몸 레이어에 남은 머리 음영을 발견해 얼굴·귀 영역을 지정하는 방식으로 분리 기준을 수정했다.  `preview.html`에서 동작별 1×/4× GIF와 접촉 시트를 볼 수 있다. `comparison_1x.png`와 `comparison_4x.png`는 왼쪽부터 쿠키 r12 / 기사 r15 / 복사이며 같은 배율과 발 기준선을 쓴다. `verification/layer_review.png`는 각 번호의 왼쪽이 머리색 교체, 오른쪽이 무기 숨김이다. 레이어는 런타임 순서(뒤 머리→몸→철퇴→그립→앞 머리)로 재합성한다. 최종 759개 검사 통과, 26장 레이어 재합성 일치, 이진 알파·머리 4키색·48px 대기 키·그립 겹침·공격 중앙 타격·캔버스 잘림 없음과 GIF 14개 장수/시간/배율을 확인했다. 최종 머리색 교체 및 무기 숨김 시트도 육안 확인했다. 최종 검사 결과는 `verification/validation.json`, Apple ImageIO 독립 GIF 디코딩 결과는 `verification/gif_decode.json`에 있다. GIF는 검토용 반복이며 manifest의 공격·피격·쓰러짐은 한 번 재생한다.

**범위.** 이 제작 폴더만 작성했다. 게임 적용, src 수정, 커밋, 푸시는 하지 않았다. 기존 라인업·조립형 그림을 디자인 참조로 열지 않았다.

재생성: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-acolyte/build.py`

GIF 검사: `swift -module-cache-path docs/art-production/pixel-class-acolyte/.swift-module-cache docs/art-production/pixel-class-acolyte/verify_gif.swift docs/art-production/pixel-class-acolyte`

검증: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-acolyte/validate.py`
