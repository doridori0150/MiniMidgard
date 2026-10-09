# 도둑 · thief_male_p2

남성 도둑 한 직업, 6동작 25장. 짧게 쓸어 넘긴 머리·굵고 곧은 눈썹·민소매 회청색 조끼·자주색 허리천·가죽 장화로 새로 디자인했다. `minimidgard.pixel/1`, 128×120, 발 기준 (64,112), 대기 기본 키 48px(숨을 들이쉴 때 49px), 약 2등신. 자체 머리 `swept_crop_p2`는 지정 네 키색, 무기는 `dagger`, 손 덮개는 별도 레이어다. 시전은 없다.

**계획과 참고.** 먼저 `PLAN.md`를 작성했다. 첨부 RO 도둑 남성 남동 시트에서 가벼운 대기, 양발 교대, 뒤로 뻗는 준비 팔, 넓은 수평 베기, 낮은 마무리, 뒤젖힘, 엎드림, 바닥을 짚는 앉기를 참고했다. RO 그림과 픽셀은 복사·저장하지 않았다. 쿠키 r12와 기사 r15를 크기·스타일 기준으로 확인했다. 공격은 7장 440ms, `hitFrame: 3`의 200–240ms가 중앙 타격 구간이며, 타격 40ms보다 낮은 마무리 100ms를 길게 유지한다.

**한 장씩 검수.** 내장 `image_gen.imagegen`으로 직전 장을 보고 참조에 넣으며 순차 제작했다. 걷기 5번의 단검 누락과 첫 앉기의 커진 하체는 제외하고 다시 생성했다. 뒤로 빼기→베기→멈춤→회수에서 가까운 손과 단검의 연결을 확인했다. 공격 마지막은 검수된 대기 첫 장을 그대로 재사용했다. 원본은 `sources/`, 제외 시도는 `sources/rejected/`, 전체 프롬프트와 장별 기록은 `PROMPTS.json`, `FRAME_REVIEWS.json`에 있다.

**완성 크기 검수.** 최초 정규화의 머리 교체 경계에서 목·팔이 끊겨 보여 해당 방식을 폐기했다. 최종본은 원화 전체를 같은 축척으로 등록하고 원래 목·팔 연결을 보존한다. 별도 확대돼 생성된 앉기는 머리 폭을 27px로 맞췄다. 픽셀 팔레트·이진 알파·레이어를 분리한 뒤 전체 접촉 시트, 공격 순서와 동일 배율 비교를 육안 확인했다. 뒤로 준비한 단검은 실제 수평 잔상과 앞쪽 단검으로 이어지고, 쓰러짐은 점차 낮아져 마지막 엎드림을 유지한다.

**검증.** `verification/validation.json`: 2,518개 검사 통과. 125개 레이어 경로·크기·알파·머리 키색 및 몸/무기 키색 분리·25장 재합성 일치·접지·손잡이 겹침·타격 시간·대기 복귀를 확인했다. 머리의 어두운 키색이 옷의 외곽선에 섞이지 않게 별도 색을 썼다. GIF 12개는 Apple ImageIO로 장수·실제 시간·크기를 독립 디코딩했다. 연결된 브라우저가 없어 HTML의 실시간 UI 재생은 확인하지 못했다. 모든 동작은 접촉 시트로 검수했으며, GIF 파일 검증과 UI 검증을 구분한다.

보기: `contact_sheet.png`, 동작별 `*_1x.gif`·`*_4x.gif`, `side_by_side_1x.png`·`side_by_side_4x.png`(왼쪽부터 쿠키·기사·도둑). `preview.html`은 HTTP 서버에서 동작 선택·장별 이동·배속·레이어 토글을 제공한다. GIF는 검토용 반복, 게임용 공격/피격은 단발, 쓰러짐/앉기는 마지막 유지다. 작업은 이 폴더에만 작성했으며 게임 적용·커밋·푸시는 하지 않았다.

재생성: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-thief/build.py`  
GIF 검사: `swift -module-cache-path docs/art-production/pixel-class-thief/.swift-module-cache docs/art-production/pixel-class-thief/verify_gif.swift docs/art-production/pixel-class-thief`  
검증: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-thief/validate.py`  
미리보기: `python3 -m http.server 8876 --bind 127.0.0.1 --directory docs/art-production/pixel-class-thief` 실행 후 `http://127.0.0.1:8876/preview.html`.
