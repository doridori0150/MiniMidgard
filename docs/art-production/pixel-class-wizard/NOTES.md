# 위저드 마무리

`wizard_female_p2` · 여성 · `staff` · `wizard_crescent_braid_p2`

[미리보기](preview.html)에서 18개 동작을 재생하고 프레임별로 확인할 수 있다. 기본 8종, 스킬 모션 10종, 28개 스킬을 모두 포함한다. 내장 imagegen으로 원화를 한 장씩 제작했다. 걷기 보강 후 33개 승인 포즈를 83개 재생 프레임에 배치했으며 시작·유지·회수 자세는 공유한다. 원화·프롬프트는 `authored/`, `PROMPTS.json`, 걷기 보강 프롬프트는 `WALK_PROMPTS.json`, 순서별 등록 기록은 `FRAME_REVIEWS.json`에 있다.

## 계획과 연결

사전 [PLAN.md](PLAN.md)에 기본 동작과 스킬별 준비→방출→회수 순서를 정했다. 상아색 단발과 땋은 머리, 청록 초승달 장식, 남색 금테 로브, 자주 망토로 새로 디자인했다. 쿠키 r12·기사 r15와 동일하게 2등신, 대기 키 48px, 캔버스 128×120, 발 기준 (64,112), 오른쪽 3/4를 맞췄다. 비교 시트의 왼쪽부터 쿠키·기사·위저드다.

`cast_start`는 손 모으기 190ms를 한 번, `cast`는 같은 자세에서 작은 호흡 510ms를 반복한다. 두 동작의 연결 프레임은 동일하며 유지 중 지팡이 그립 좌표도 고정했다. 일반 공격은 준비→지팡이 전방 타격→낮게 버팀→대기로 돌아온다. 쓰러짐은 피격→무릎→옆으로 눕기, 앉기는 무릎을 접는 자세다.

|모션 / 시간|스킬 id|공유 이유|
|---|---|---|
|`skill_bolt` / 600ms|fire_bolt, cold_bolt, lightning_bolt, soul_strike, frost_diver, stone_curse|대상을 겨누는 짧은 전방 방출|
|`skill_orb` / 600ms|napalm_beat, fire_ball, jupitel|몸과 손바닥을 함께 미는 구체 방출|
|`skill_ground` / 680ms|fire_wall, safety_wall, earth_spike, fire_pillar, ice_wall, quagmire, heavens_drive|무릎을 낮추고 지면에 설치·발동 지시|
|`skill_sky` / 700ms|thunderstorm, lord_vermilion|지팡이와 빈손을 올려 하늘을 지시|
|`skill_water` / 700ms|water_ball|아래에서 끌어올리고 전방으로 연속 방출|
|`skill_meteor` / 700ms|meteor|높게 든 지팡이를 낮추며 먼 전방을 명령|
|`skill_blizzard` / 700ms|storm_gust|넓은 보폭과 수평으로 열린 팔·지팡이|
|`skill_nova` / 600ms|frost_nova, sightrasher|가슴에서 양팔을 벌리는 주변 방출|
|`skill_aura` / 620ms|sight, energy_coat, sight_blaster, mystic_amp|몸 앞에 집중하는 자기 강화|
|`skill_barrier` / 580ms|mana_barrier|손바닥을 몸 앞에 세우는 방어 자세|

마지막 두 자기 버프에는 `hitFrame`이 없다. 다른 스킬 모션은 `hitFrame` 앞 시간이 정확히 130ms다. 수호벽의 해당 프레임은 피해가 아니라 설치 지시 시점이다. 모든 스킬은 마지막에 대기로 복귀한다. 화염·얼음·번개·유성 등 마법 이펙트는 포함하지 않았다. 스킬 시트의 행 순서는 위 표와 같으며 숫자는 0부터 시작하는 행·프레임 번호다.

## 직접 확인한 레퍼런스

- 첨부 RO 여성 위저드 남동 시트: 시전의 손 모으기→손 펼치기, 작은 대기 변화, 피격의 뒤로 기울기, 낮은 앉기와 쓰러짐 순서를 참고했다. RO의 긴 몸 비율은 가져오지 않았다.
- [Tree of Savior Wizard](https://treeofsavior.com/page/class/view.php?c=Wizard), [Elementalist](https://treeofsavior.com/page/class/view.php?c=Elementalist), [Pyromancer](https://treeofsavior.com/page/class/view.php?c=Pyromancer), [Cryomancer](https://treeofsavior.com/page/class/view.php?c=Cryomancer): 공식 페이지와 Elementalist 캐릭터 동작 표시를 직접 열었다. 팔을 높이는 몸의 예비 동작과 상·전방 방향 구분을 참고했다. 개별 스킬 영상 전부를 확인한 것은 아니며, 각 스킬 모션은 의뢰서의 게임 효과와 이 방향 구분을 바탕으로 새로 설계했다.
- [Sword of Convallaria 공식 Acambe 영상](https://www.youtube.com/watch?v=DymcWByf_yU): 공식 채널에서 재생해 Rich Rewards 구간의 몸 앞·위쪽 빈손 동작과 자세 유지 구간을 확인했다. 버프의 몸 중심 제스처와 유지 리듬만 참고했다.
- 크기와 픽셀 밀도는 제공된 쿠키 r12 공격 시트와 기사 r15 시트를 직접 비교했다. 외부 게임의 이미지·영상 파일은 이 폴더에 저장하거나 픽셀로 복사하지 않았다.

## 프레임 검수와 수정

다음 원화를 요청하기 전에 직전 원화의 얼굴, 두상, 발, 가까운 지팡이 손, 팔의 이동 방향을 확인했다. 같은 보폭으로 나온 `walk_contact_b`와 `_fix`는 거절하고 교차 보행을 다시 그렸다. 손이 바뀐 `orb_release`는 `orb_release_fix`로, 호흡 변화가 큰 `cast_breath`는 손을 고정한 `cast_breath_fix`로 교체했다. 거절 원화 4개는 제작 경위 확인용으로만 남겼으며 매니페스트에서 사용하지 않는다.

48px 등록 후 일반 자세의 기준 두상을 정수 픽셀 이동으로 맞추고, 지정 네 머리 색으로 분리했다. 머리 옆으로 올라오는 팔이 머리 마스크에 잡힌 부분은 몸 레이어 경계를 수정했다. 지팡이·그립·머리 앞뒤 레이어는 게임 렌더 순서로 다시 합성해 확인했다. 등록 도구는 원화 정합·분리용이며 새 포즈를 절차적으로 합성하지 않는다.

검증 결과는 [verification/validation.json](verification/validation.json). 레이어 전체의 크기·알파·머리 팔레트·합성 일치·그립 위치·잘림, 28개 스킬 매핑, 타격 시간, 시전 연결을 검사한다. 1×/4× 및 일반 공격 비교 GIF 56개는 무손실 압축 후 Apple ImageIO로 모든 프레임을 디코딩해 크기·시간을 확인했다. 브라우저에서 미리보기 재생·스킬 선택·프레임 이동을 확인했다.

재생성: `prepare_specs.py` → `register.py` → `build.py` → `compact_gifs.py` → `verify_gif.swift` → `make_preview.py` → `validate.py`. Python은 `PYTHONDONTWRITEBYTECODE=1`로 실행하고, Swift 모듈 캐시는 검사 후 제거한다. 게임 소스 수정, 커밋, 푸시는 하지 않았다.

## 보강 1 — 걷기 (2026-10-10)

[WALK_PLAN.md](WALK_PLAN.md)에 양발 각각 접지→하중→통과→전진을 먼저 정하고, RO 위저드 시트 두 번째 줄의 8장 교대·작은 상하 움직임을 참고했다. 두 접지 원화를 살리고 중간 6장을 내장 imagegen으로 한 장씩 그렸다. 매번 직전 원화와 48px 등록본의 다리·두상·무기 손을 확인했다. 3번의 첫 후보는 같은 발 전진을 반복해 제외하고 교차 자세로 다시 그렸다. 마지막 7→0 접지도 확대 시트로 확인했다.

걷기는 서로 다른 8장, 각 100ms, 총 800ms다. 2등신·기준 키 48px·128×120 캔버스·발 원점 (64,112)과 가까운 화면 오른쪽 손의 지팡이를 유지했다. 매니페스트, 걷기 GIF 1×/4×, 걷기·전체 컨택트 시트와 미리보기 데이터를 갱신했다. [걷기 검사](verification/walk_validation.json)에서 하체 실루엣 8장 구별, 비걷기 매니페스트 동일, 보호 파일 743개 바이트 일치를 확인했다. Apple ImageIO로 GIF 프레임·시간·크기를 재검증했다. 이번 세션은 연결된 브라우저가 없어 UI 재생 검수는 하지 못했다. 디자인·나머지 동작·28개 스킬은 그대로다.

걷기만 재포장: `PYTHONDONTWRITEBYTECODE=1 python3 build_walk.py` → `compact_gifs.py` → `verify_gif.swift` → `make_preview.py` → `validate.py`. 신규 원화별 등록값은 `registration.json`, 프롬프트·전후 검토는 [WALK_PROMPTS.json](WALK_PROMPTS.json)에 남겼다. 빌드 캐시는 제거했으며 `src/` 수정·커밋·푸시는 하지 않았다.
