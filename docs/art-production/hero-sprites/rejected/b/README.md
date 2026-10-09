# 배치 B — 부분 납품 / 캐릭터 검수 반려

- 제작 방식: 내장 image_gen. 각 호출은 승인 원본 라인업을 다시 첨부했으며 생성본을 다음 참조로 쓰지 않았습니다. 실제 프롬프트는 prompts/*-b-attempt-0*.txt, 생성 원본은 source/b/에 보존했습니다.
- 납품: ../../equipment/axe.png (256×256 RGBA), 같은 game-manifest.json의 weapons.axe에만 추가. 기존 다섯 캐릭터 데이터와 프레임·마스크·기준점, src/를 포함한 보호 파일 616개 해시 동일.
- 반려: thief_male, merchant_female. 최초 생성 + 재생성 2회를 소진했습니다. walk_0·walk_2가 같은 발을 반복하고 반대발 접지 동작이 없습니다. 공격 준비의 팔 방향은 마지막 시도에서 교정됐지만 소스 사이 몸 비율 차이가 남았습니다.
- 두 캐릭터 28장과 정렬된 마스크·손가락 오버레이·별도 후보 manifest는 rejected/b/에 보존했습니다. 이 폴더의 파일은 게임 연결용 납품이 아닙니다.
- 무기+leaf+hairpin 검수 시트: verification/review_thief_male.png, verification/review_merchant_female.png. 시트의 빨간 점은 hand 기준점입니다. 머리색 3종, 80px 표시, 장비 장착 동작 GIF와 라인업 비교도 verification/b-*에 있습니다. 기존 5명의 미리보기는 보존했습니다.

## 검사 결과

요청된 명령은 실행했고 check.json에 결과를 남겼습니다. 납품된 도끼 및 부속 검사 오류 0·주의 0, 요청 캐릭터 미납 14개 동작 시트이므로 **배치 B 전체는 FAIL**입니다. 미납을 승인된 제외로 감추지 않았습니다.

후보 전체 검사는 verification/b-candidate-check.json: 오류 1·주의 2. 도둑 hurt_0 높이 199px(기준 310px) 오류, 상인 hurt_0 높이 251px 주의, 도둑 공격 손 기준점 이동량 주의입니다. 후보별 높이를 강제로 늘리거나 검사 기준을 변경하지 않았습니다. 마스크 몸 밖 누출 0, 부속 잘림 0.

이 반려는 요청서의 '2번 다시 만들어도 맞지 않으면 그 대상은 납품하지 말고 rejected/README.md에 사유를 남긴다' 규칙에 따른 것입니다. 도끼만 통과했고 두 캐릭터는 완료되지 않았습니다.
