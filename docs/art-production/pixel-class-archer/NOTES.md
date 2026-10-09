# 궁수 · archer_male_p2

짧은 옆가르마와 굵은 곧은 눈썹, 숲색 튜닉·황토색 스카프·가죽 보호구·화살통의 새 남성 궁수. 쿠키 r12·기사 r15와 같은 **2등신, 대기 키 48px, 128×120, 발 기준점 (64,112)**이다. 비교 그림은 왼쪽부터 쿠키 / 기사 / 궁수이며 모두 같은 배율이다.

**계획과 참고.** `PLAN.md`를 먼저 작성했다. 첨부 RO 궁수 시트에서 숨쉬기, 발 교차, 활 올림→귀 옆 당김→놓기→발사 자세 유지, 뒤로 젖힘·등을 대고 쓰러짐·무릎을 접는 앉기의 순서와 리듬만 참고했다. RO 이미지·픽셀은 저장하거나 복사하지 않았다. 대기 3장 / 걷기 6장 / 공격 7장 / 피격 2장 / 쓰러짐 3장 / 앉기 1장, 총 22장. 시전은 없다.

**한 장씩 제작·검토.** 내장 `image_gen.imagegen`으로 개별 생성하고 직전 채택본을 확인해 다음 장의 참조로 전달했다. 동작 전환 시에는 기준 대기 원화도 참조했다. 같은 머리·복장·왼손 활·접지·동작 진행을 확인했다. 당기는 손이 너무 낮은 공격 장과 몸이 너무 높은 앉기 장은 제외하고 각각 다시 생성했다. 원화는 `sources/`, 전체 프롬프트는 `PROMPTS.json`, 장별 검토는 `FRAME_REVIEWS.json`이다.

**납품 정렬.** 최근접 샘플링과 팔레트 정규화 뒤 몸·머리·활·손가락을 분리했다. 정면에 가까운 장은 기준 얼굴·머리를 정수 좌표로 옮겨 크기를 고정했고, 기울어진 피격·쓰러짐은 해당 원화의 머리를 분리했다. 앉기는 기준 머리·목 스카프를 유지한 38px 높이로 정렬했다. 가는 시위는 원화 픽셀의 면적 샘플링으로 보존했다. 머리는 지정된 네 키색만 쓰며 짧은 헤어스타일의 뒤 레이어는 투명하다. 머리 경계에 걸렸던 활과 무기 레이어에 섞인 옷 픽셀도 분리 후 재확인했다.

**타이밍·레이어.** 공격은 600ms, `hitFrame: 3`은 360ms(60%)에 시작한다. 발사 장부터 장전 화살은 없으며 비행 화살은 그리지 않았다. 해부학적 왼손이 계속 활을 잡고 오른손이 시위를 당긴다. `bow`와 grip 오버레이, 캐릭터별 `animations`를 `minimidgard.pixel/1`에 기록했다. GIF는 검토용 반복이며 매니페스트의 공격·피격은 단발, 쓰러짐·앉기는 마지막 장 유지다.

**검증과 보기.** 1,106개 검사 통과. `verification/validation.json`에 규격·이진 알파·키색·레이어 재합성·손잡이 근접·타이밍·참조 파일 해시 검증 결과를, `verification/gif_decode.json`에 Apple ImageIO로 독립 디코딩한 12개 GIF의 장수·시간·크기를 기록했다. 전체 22장 접촉 시트와 같은 배율 비교도 육안 확인했다. `preview.html`, `contact_sheet.png`, 동작별 GIF, `comparison_1x.png` / `comparison_4x.png`로 확인할 수 있다. 게임 적용·커밋·푸시는 하지 않았으며 작업 파일은 이 폴더 안에만 작성했다.

재생성: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-archer/pack.py`  
GIF 확인: `swift -module-cache-path docs/art-production/pixel-class-archer/verification/swift-cache docs/art-production/pixel-class-archer/verify_gif.swift docs/art-production/pixel-class-archer`  
검증: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-archer/validate.py`
