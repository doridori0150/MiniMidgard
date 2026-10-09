# fix1 탈락 및 미해결

- `mage/attack_0` 1차: 먼 쪽 팔이 올라가 탈락. 2차 전신으로 교체 완료.
- `archer/walk_3` 1차: 원래의 반대 팔 교차 자세가 남아 탈락.
- `archer/walk_3` 2차: 가까운 팔은 고쳐졌으나 활이 몸에 그려져 분리 무기 계약 위반. 두 번 시도 제한에 따라 새 프레임은 납품하지 않음. 원래 파일과 기준점은 보존했으며 **이 프레임은 미해결이고 승인 대상이 아님**.
- 원본 생성 결과는 `source/fix1/archer-attempt1.png` 첫 칸 및 `archer-attempt2.png`. 프롬프트는 `prompts/archer_male-fix1-attempt1.txt`, `prompts/archer_male-fix1-attempt2.txt`.

자동 검사는 기술적 계약만 확인하며 이 시각적 실패의 승인을 뜻하지 않는다.

## 수정 2에서 해결

2026-10-09: 위 궁수 walk_3 거절은 fix1 당시 이력이다. fix2 attempt1에서 fix1 attempt2의 활대·시위를 제거한 전신을 채택해 가까운 손 및 분리 무기 계약을 모두 충족했다. 현재 납품은 미해결 항목 없음. 원본 거절 자료는 보존한다.


## 수정 3 — 검사 걷기 2장 미해결

- `novice_female`·`swordsman_male` 1차 전체: 몸통 반전은 개선됐지만 어깨·목선이 높고 머리·몸 비율이 이웃 프레임과 달라 미채택. 원본은 `source/fix3/*-attempt1.png`.
- 검사 `walk_1`, `walk_3` 2차: 먼 주먹의 가슴 교차와 무기 손 가림은 개선됐으나, 어깨/옷깃이 원래 walk_0·walk_2보다 약 10–14px 높고 실루엣의 연속성이 부족하다. 두 번 생성 제한에 따라 새 그림을 납품하지 않는다.
- 2차 원본은 `source/fix3/swordsman-attempt2.png` 첫째·둘째 칸. 정규화된 거절 후보와 마스크·오버레이는 `rejected/fix3/swordsman/walk_1*.png`, `walk_3*.png`에 보존한다. 실제 프롬프트는 `prompts/swordsman_male-fix3-attempt1.txt`, `prompts/swordsman_male-fix3-attempt2.txt`.
- 위 두 프레임의 기존 PNG 6개(본체·마스크·오버레이) 및 game-manifest 기준점은 수정 시작 시점과 동일하다. 검수 시트에 UNRESOLVED ORIGINAL을 표시했다. 원래 팔 가림/교차 문제는 남아 있다.
- 초보자 walk_1·attack_1·attack_2 및 검사 attack_2는 2차를 채택했다. 자동 검사 오류 0은 위 두 미해결 프레임의 아트 승인을 뜻하지 않는다.


## 배치 B 반려

thief_male·merchant_female: 최초 생성 + 재생성 2회 후에도 walk_0·walk_2가 같은 발을 반복해 반대발 접지가 없습니다. 후보 hurt 높이 오류/주의와 소스 간 비율 차이도 남았습니다. 요청서 실패 대응 규칙에 따라 두 캐릭터 전체를 납품 manifest에서 제외하고 후보 프레임·레이어를 b/에 보존했습니다. 도끼는 통과하여 납품했습니다. [상세 근거](../verification/b-report.md).
