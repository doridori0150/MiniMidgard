# 프리스트 완성 패키지

`priest_female_p2` · 여성 · `mace` · `priest_crown_braid_p2`. 상아색 왕관 땋은머리, 자주색 예복, 금테 스톨, 짧은 케이프와 청록 목보석으로 새로 디자인했다. 128×120, 발 기준 (64,112), 대기 높이 48px, 머리 구간 24px. 쿠키 r12·기사 r15와 같은 크기로 비교했다.

[preview.html](preview.html)에서 전체 재생·한 장씩 이동·GIF·비교를 볼 수 있다. 기본 8종과 스킬 13종, 승인 원화 37장으로 구성한 런타임 110프레임이다. 준비/기도/회수는 공유하며 걷기와 일반 공격은 각각 서로 다른 8장이다. 모든 런타임 프레임에 몸, 머리 앞뒤, 철퇴, 그립이 있다.

## 계획과 배정

사전 [PLAN.md](PLAN.md)의 동작 순서에 따라 원화를 한 장씩 만들었다. 기본 공격은 준비→들기→정점→하강→타격→버팀→회수→대기, 총 690ms이며 중간 시점이 타격 4번 장 안에 있다. `cast_start` 마지막과 반복 `cast`의 첫/끝 그림을 일치시켰다.

|스킬 모션 / 시트 행|스킬 ID|공유 이유·몸 동작|
|---|---|---|
|0 `skill_mend`|heal, cure, slow_poison, status_recovery|회복·치료: 가슴에서 빈손을 부드럽게 펼침|
|1 `skill_bless`|blessing, increase_agi, impositio, suffragium, aspersio, kyrie|아군 강화: 손을 들고 축복을 내림|
|2 `skill_hymn`|angelus, sacrament, magnificat, gloria|파티 강복·찬가: 고개와 팔을 높여 유지|
|3 `skill_judgment`|decrease_agi, signum_crucis, lex_divina, lex_aeterna|약화: 성호를 긋고 전방을 지시|
|4 `skill_light`|holy_light, turn_undead|정화: 모은 빈손을 곧게 뻗음|
|5 `skill_holy_strike`|holy_strike|철퇴 첫 내려침→반동 재장전→둘째 내려침|
|6 `skill_aura`|ruwach, sanct_aura|자기 버프: 몸 중심에서 팔을 펼침|
|7 `skill_ground`|pneuma, pr_safety_wall, sanctuary|지면 설치: 낮아져 빈손으로 바닥 지시|
|8 `skill_magnus`|magnus|전용 대퇴마: 낮은 자세로 철퇴를 지면에 세움|
|9 `skill_resurrection`|resurrection|전용 부활: 낮은 손을 높게 끌어올림|
|10 `skill_redemptio`|redemptio|전용 속죄: 무릎을 꿇고 팔을 펼침|
|11 `skill_portal`|teleport, warp_portal|공간 열기: 빈손을 넓게 밀어 열음|
|12 `skill_water`|aqua_benedicta|성수 만들기: 낮게 뜨기→가슴 높이 받치기|

32개 전부 매핑, 제외 없음. 각 스킬은 510–760ms. 효과가 있는 모션의 `hitFrame=2`, 앞 두 장 합계 130ms. 공통 요청서에 따라 아군/파티/자기 버프인 bless·hymn·aura에는 `hitFrame`을 두지 않았다. 성스러운 일격의 `hitFrame`은 첫 타격이며 두 번째 몸 동작이 추가 피해 이벤트를 정의하지 않는다. 속죄 뒤 사망 여부는 게임 상태가 결정한다. 빛·결계·폭발은 포함하지 않고 철퇴에 붙은 짧은 잔상만 포함한다.

## 레퍼런스 확인 범위

- 첨부 RO 여성 프리스트 철퇴 시트: 발 교대, 어깨에서 준비해 낮게 내려치는 철퇴, 타격 후 긴 버팀, 가슴 앞 시전, 뒤로 피격→무릎→옆으로 쓰러짐을 참고했다. 외형과 픽셀은 새로 제작했다.
- 쿠키 r12·기사 r15: 대기 높이, 두상 비율, 발 기준과 팔레트 대비를 실제 레이어 합성 비교로 확인했다. [comparison_1x.png](comparison_1x.png), [comparison_4x.png](comparison_4x.png).
- [Tree of Savior Priest](https://treeofsavior.com/page/class/view.php?c=Priest), [Cleric](https://treeofsavior.com/page/class/view.php?c=Cleric): 공식 페이지를 직접 열어 캐릭터 대기 GIF와 회복·성수·부활 등의 구분을 확인했다. 이 페이지에는 개별 스킬 동작 영상이 없어 스킬별 연속 자세까지 확인했다고 간주하지 않았다. 손을 통한 회복/축복과 지면 설치의 구분을 자체 동작 설계에 사용했다.
- [Sword of Convallaria 공식 이난나 소개](https://www.youtube.com/watch?v=t2IeUg4OHgQ): 실제 전투의 스킬 장면을 브라우저로 확인했다. 짧은 몸 동작 뒤 효과와 유지가 이어지는 구성, 작은 전투 캐릭터에서 팔의 방향을 읽히게 하는 정도를 참고했다. 긴 연출 이펙트나 외형은 가져오지 않았다.

외부 레퍼런스 이미지·영상 파일은 이 폴더에 저장하지 않았다.

## 한 장씩 검수와 납품 검증

[PROMPTS.json](PROMPTS.json)에 생성 순서·프롬프트·직전 그림 검토를, [FRAME_REVIEWS.json](FRAME_REVIEWS.json)에 최종 프레임의 원화·이전 자세·재사용·기준점 정보를 남겼다. 머리/의상/오른쪽 3/4 방향/가까운 철퇴 손을 확인한 후 다음 장을 생성했다. 길어진 철퇴 `attack_back`, 손이 바뀐 `light_release`, 왼쪽을 향한 `resurrection`은 다시 그려 `_fix`를 채택했다. 누운 자세의 재시도 `fallen_clean`은 배경 번짐과 크기 변화 때문에 거절하고 승인한 `fallen`을 사용했다. 거절 원화는 제작 이력으로만 남고 매니페스트에는 들어가지 않는다.

축소는 최근접 등록, 머리는 지정 4색, 알파는 0/255. 검수 중 머리 그림자가 몸에 남아 머리색 교체 시 얼룩지는 분류를 수정했다. `verification/layers_*.png`는 왼쪽 원본 합성, 가운데 무기 숨김, 오른쪽 머리색 교체 비교다. 독립 Apple ImageIO 디코더로 GIF 68개의 크기·장 수·각 장 시간을 검증했다. 일반공격/스킬 비교는 양쪽 프레임 경계의 합집합 시간표로 동기화한다. GIF는 검토 편의를 위해 반복하며, 실제 일회성/반복/마지막 장 유지 정보는 manifest가 기준이다.

[verification/validation.json](verification/validation.json)에 32개 매핑, 레이어 재합성, 머리색, 알파, 그립 접점, 시전 이음, GIF 검증 결과를 기록한다. `preview.html`은 서버 없이 열리는 로컬 미리보기다. 이 패키지 제작 범위에서 `src/`와 다른 폴더는 수정하지 않았고, 게임 런타임 적용·커밋·푸시는 하지 않았다.

재생성: `PYTHONDONTWRITEBYTECODE=1 python3 prepare_specs.py` → `register.py` → `build.py` → `review_layers.py` → `compact_gifs.py` → `make_preview.py`. `verify_gif.swift` 실행 뒤 임시 Swift 모듈 캐시를 제거하고 `validate.py` 실행. 모든 명령은 이 폴더 안에서 사용한다.
