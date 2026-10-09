# 기사 기본 동작 + 스킬 계획

기존 r15 기본 27프레임의 몸·머리·검·손 그림 보존. 128×120, (64,112), 대기 48px, 같은 가까운 손 유지. 머리 이름만 knight_ 접두어로 분리.

|모션|스킬|장면 순서|타격|
|---|---|---|---|
|skill_cleave|bash|위로 준비 → 짧게 내리치기 → 낮게 버팀 → 회수|130ms|
|skill_sweep|magnum_break, brandish|뒤로 감기 → 큰 가로 쓸기 → 앞 아래 정착 → 회수|130ms|
|skill_thrust|pierce, spear_stab|허리로 당기기 → 깊게 앞 찌르기 → 짧은 반동 → 회수|130ms|
|skill_throw|spear_boomerang|어깨 뒤 준비 → 놓기 → 빈손 유지 → 같은 손 되받기 → 회수|130ms|
|skill_guard|endure, auto_counter, iron_stance|무릎 굽힘 → 몸 앞 가드 → 버팀 → 회수|없음|
|skill_enchant|twohand_quicken, element_shift, mana_edge|무기 세움 → 빈손을 날에 가까이 → 집중 유지 → 회수|없음|
|skill_provoke|provoke|무기를 낮춤 → 빈손으로 도발 → 가슴 열기 → 회수|130ms|
|skill_double|bowling_bash|뒤 감기 → 첫 베기 → 역방향 준비 → 두 번째 베기 → 회수|첫 타 130ms|
|skill_crescent|moon_slash|뒤 감기 → 아래 베기 → 역베기 → 마지막 아래 베기 → 회수|첫 타 130ms|
|skill_charge|charge_attack|낮은 준비 → 몸을 밀며 찌르기 → 깊은 착지 → 회수|130ms|
|cast|시전 있는 3스킬|무기 모음 → 무릎·어깨 숨쉬기 → 시작 자세|반복|

새 자세를 한 장씩 생성하고 다음 장 전에 이전 장을 확인한다. 이미 검증된 준비·회수 자세는 재사용한다. 무기별 스킬 시트와 공격 대비 GIF를 원래 시간축으로 내보낸다. 잔상 외 별도 폭발·마법 효과는 그리지 않는다.
