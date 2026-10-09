# R15 — 기사 한손검 베기

R14의 수평 찌르기를 **뒤로 당기기 → 몸을 감싸는 큰 부채꼴 베기 → 낮은 자세의 긴 멈춤 → 회수**로 교체했다. 8장, 660ms, `hitFrame: 3`(0부터 셈, 270–310ms). 베기 100ms에 비해 후속 낮은 자세는 220ms 유지한다. 2등신·기존 얼굴과 머리·청록 판금 디자인·48px 대기 키·128×120 캔버스·기준점 (64,112), `minimidgard.pixel/1`과 `knight_female_p2`를 보존했다.

**참고와 사전 계획.** `CLASS_MOTION_REFS.md` 및 첨부 RO 여성 남동·남성 동쪽 프레임 분해표에서 뒤쪽 준비, 비틀림, 큰 부채꼴 궤적, 깊게 내딛는 낮은 자세와 짧은 베기/긴 멈춤의 리듬만 가져왔다. RO 그림·픽셀은 복사하거나 저장하지 않았다. 공개 렌더러는 웹 도구 접근 실패, 연결 브라우저도 없어 실시간 재생은 확인하지 못했다. `PLAN.md`를 먼저 작성하고 내장 `image_gen.imagegen`으로 한 장씩 생성했다. 다음 장 전 직전 결과를 확인하고 참조로 전달했다. 원본은 `sources/`, 전체 프롬프트는 `PROMPTS.json`에 있다.

**장 사이 확인.** 0→1 같은 가까운 손으로 뒤쪽 검을 더 당김, 1→2 뒤 위에서 허리 앞까지 감싸는 잔상, 2→3 앞 아래의 부채꼴 착지, 3→4 잔상 소멸과 같은 손의 실제 검 연결, 4→5 발 위치·낮은 무릎·망토 정착, 5→6 체중과 앞발 회수, 6→7 기존 대기 복귀를 확인했다. 6번 최초 시도는 손이 바뀐 듯 보여 제외하고 재생성했다. 세부 기록은 `FRAME_REVIEWS.json`. 완성 크기에서는 기존 얼굴·머리 레이어를 정수 좌표로 옮겨 동일 크기를 유지하고, 칼 길이를 기존 약 21px로 맞췄다. 잔상 프레임의 손잡이 좌표와 레이어 경계를 보정한 뒤 접촉 시트로 다시 확인했다.

**검증.** `verification/validation.json`: 1,202개 검사 통과. 공격 외 129개 파일 SHA256 동일, R14 원본 파일 전체 해시 보존, 27장 레이어 재합성 일치, 이진 알파·머리 키색·같은 손 선언·손잡이 겹침·발 접지·캔버스 잘림 없음·마지막 장의 기존 대기 일치를 확인했다. Apple ImageIO로 GIF 13개를 독립 디코딩해 장수·시간·크기를 확인했다. 회수 시도의 손 교체는 육안으로 발견·수정했으며 메타데이터 검사를 시각 검사의 대체로 삼지 않았다.

**보기.** `preview.html`, `attack_1x.gif`, `attack_4x.gif`, `attack_contact_sheet.png`, `attack_r14_vs_r15.gif`(왼쪽 R14 / 오른쪽 R15). 비교는 실제 타이밍을 유지하고 R14가 끝난 뒤 100ms 대기로 기다려 함께 재시작한다. GIF는 검토용 반복, 게임용 공격은 `loop: false`. 이전 검수 자료는 `verification/r14_inherited/`로 구분했다. `generated/`, `normalized/`, ZIP은 복사하지 않았다. R15 밖 파일 수정·게임 적용·커밋·푸시는 하지 않았다.

재생성: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-knight-r15/build.py`  
GIF 검사: `swift -module-cache-path docs/art-production/pixel-knight-r15/.swift-module-cache docs/art-production/pixel-knight-r15/verify_gif.swift docs/art-production/pixel-knight-r15`  
검증: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-knight-r15/validate.py`
