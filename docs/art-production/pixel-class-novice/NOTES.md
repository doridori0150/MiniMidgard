# 노비스 — 첫 모험

`novice_female_p2`를 수수한 리넨 셔츠·올리브 조끼·황토색 목수건·갈색 반바지와 부츠로 새로 디자인했다. 머리는 `novice_short_tail_p2`, 무기는 `weapons.dagger.frames.novice_female_p2`. 쿠키 r12·기사 r15와 같은 2등신, 대기 키 48px, 128×120, 발 기준 (64,112), 오른쪽 3/4이다. 대기 3·걷기 6·공격 6·피격 2·쓰러짐 3·앉기 1, 총 21장. 시전은 없다.

**계획과 참고.** 먼저 `PLAN.md`를 작성했다. 첨부 RO 노비스에서 가벼운 보행의 접지/통과, 몸 앞 단검 준비→낮게 내딛는 찌르기→멈춤, 뒤로 젖혀지는 피격, 엎드린 쓰러짐, 무릎 꿇은 앉기만 참고했다. RO 픽셀·그림과 예전 노비스 외형은 사용하거나 저장하지 않았다. 공격 520ms의 `hitFrame: 2`는 220–280ms로 중앙 260ms를 포함한다.

**한 장씩 제작·검수.** 내장 `image_gen.imagegen`으로 매번 한 장씩 생성하고 직전 결과의 얼굴·복장·무기 손·발과 다음 동작을 확인했다. 25회 생성 중 손 교체 4회와 불명확한 반대 보폭 1회를 제외하고 20개 원화를 채택했다. 마지막 공격 장은 대기 원본 레이어로 복귀한다. `PROMPTS.json`, `FRAME_REVIEWS.json`, `sources/`에 기록을 보존했다. r15 방식의 최근접 픽셀 정규화·레이어 분리를 적용하고, 머리 고정/10px 단검 길이/엎드림 머리 폭/얼굴 팔레트를 보정했다. 머리 네 키색은 머리 레이어에만 사용한다.

**검증·보기.** `verification/validation.json`의 1,153개 검사 통과: 21장 재합성, 알파·팔레트·같은 무기손 선언과 손잡이 겹침·접지·잘림·고정 머리·공격 종료 복귀·참고 자산 해시 보존. Apple ImageIO로 GIF 12개의 실제 장수·시간·크기를 독립 확인했다. 전체 접촉 시트와 1×/4× 비교를 육안 검토했고, Chrome의 `preview.html`에서 걷기 재생, 공격 타격 장, 엎드림 끝 장과 앉기를 확인했다. 비교 순서는 **쿠키 / 기사 / 노비스**. GIF는 검토용 반복이며 실제 공격·피격·쓰러짐·앉기는 manifest에서 비반복이다. 게임 코드 적용·커밋·푸시는 하지 않았다.

재출력: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-novice/build.py`

GIF 검사: `swift -module-cache-path docs/art-production/pixel-class-novice/.swift-module-cache docs/art-production/pixel-class-novice/verify_gif.swift docs/art-production/pixel-class-novice` (실행 후 생성된 모듈 캐시 제거)

검증: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-novice/validate.py`
