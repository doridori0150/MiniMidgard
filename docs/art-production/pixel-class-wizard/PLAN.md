# 위저드 제작 계획

128×120, 발 (64,112), 대기 머리 포함 48px, 2등신, 오른쪽 3/4. 새 외형: 상아색 단발과 화면 왼쪽 땋은 머리, 남색 금테 로브, 자주 망토, 초승달·청록 보석 지팡이. 가까운 손(화면 오른쪽)이 지팡이를 계속 잡는다. 머리는 wizard_crescent_braid_p2, 지정 네 색만 사용.

기본 동작: idle 숨쉬기, walk 좌우 교차 보행, attack 지팡이 준비→앞 아래 타격→버팀→복귀, cast_start 손을 가슴 앞으로 모음→cast 유지 자세, cast 작은 호흡 반복, hurt 뒤로 젖힘, dead 무릎→옆으로 쓰러짐, sit 무릎을 접고 앉기.

|모션|스킬 id|동작 계획|
|---|---|---|
|skill_bolt|fire_bolt, cold_bolt, lightning_bolt, soul_strike, frost_diver, stone_curse|모은 손→지팡이 앞 겨눔→짧은 반동→복귀|
|skill_orb|napalm_beat, fire_ball, jupitel|가슴 모음→몸을 밀며 손바닥·지팡이 전방 방출→버팀→복귀|
|skill_ground|fire_wall, safety_wall, earth_spike, fire_pillar, ice_wall, quagmire, heavens_drive|지팡이 세움→무릎 굽혀 지면 지시→낮게 버팀→복귀|
|skill_sky|thunderstorm, lord_vermilion|지팡이 들어올림→위쪽 지시와 손바닥 펼침→유지→복귀|
|skill_water|water_ball|낮게 물을 끌어모음→손·지팡이를 위로 끌어올려 전방 방출→반동→복귀|
|skill_meteor|meteor|위쪽 지시→팔을 크게 내려 먼 전방 지시→낮은 후속 자세→복귀|
|skill_blizzard|storm_gust|모음→지팡이 옆으로 열며 넓은 밀기→열린 자세 유지→복귀|
|skill_nova|frost_nova, sightrasher|가슴으로 모음→양팔 벌림과 가슴 열기→반동→복귀|
|skill_aura|sight, energy_coat, sight_blaster, mystic_amp|손을 가슴 앞에→지팡이 수직과 손바닥 위로→집중 유지→복귀|
|skill_barrier|mana_barrier|손을 가슴 앞에→몸 앞 손바닥을 수직으로 세움→버팀→복귀|

스킬은 0.5–1초. 공격성/설치 모션은 hitFrame까지 130ms, 자기 버프 aura/barrier는 hitFrame 없음. 별도 마법 이펙트는 그리지 않는다.

각 원화는 imagegen으로 한 장씩 제작하고 화면으로 검토한 뒤 다음 장을 요청한다. 승인한 준비/회수 자세의 재사용은 기록한다. 48px 등록과 머리 네 색 분리 후 실제 크기에서도 확인한다. 이전 프레임 대비 얼굴·머리·손·지팡이·발 위치와 연결성을 점검하고 드리프트는 재제작 또는 기준 머리의 정수 이동 등록으로 교정한다. 높은 해상도 원화는 authored/, 정합·레이어 분리·시간 검증은 verification/에 보관한다.

외부 게임 이미지는 저장하지 않는다. RO 첨부는 자세/순서, TOS·SoC 공식 페이지와 접근 가능한 영상은 스킬 동작 조사에만 사용하며 실제 확인 범위를 NOTES에 구별해 적는다.
