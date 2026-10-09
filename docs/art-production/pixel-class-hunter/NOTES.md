# 헌터 마무리

`hunter_male_p2` · 남성 · `bow` · `hunter_swept_crop_p2`. [미리보기](preview.html)에서 기본 7종과 스킬 8종을 재생·프레임 이동할 수 있다. 18개 스킬 전부 매핑했다. 원화 35개를 공유 준비·유지·복귀 자세로 연결하며, 걷기는 서로 다른 8장, 일반 사격은 8장이다. 내장 imagegen 사용. 원화는 `authored/`, 실제 프롬프트는 [PROMPTS.json](PROMPTS.json).

## 계획과 매핑

[PLAN.md](PLAN.md)를 먼저 쓰고 한 장씩 제작했다. 숲색 짧은 망토, 크림 목깃, 가죽 조끼와 황동 버클, 상아색 짧은 머리로 새 디자인을 정했다. 쿠키 r12·기사 r15와 같은 2등신, 대기 48px, 128×120, 원점 (64,112), 오른쪽 3/4다. 비교 시트는 왼쪽부터 쿠키·기사·헌터. 활은 모든 자세에서 해부학적 왼손(먼 팔), 오른손은 시위·제스처를 맡는다.

| 모션 | 스킬 | 공유 이유 |
|---|---|---|
| skill_double | double_strafe | 당김→발사→재당김→두 번째 발사 |
| skill_sky | arrow_shower | 위로 조준하고 발사 |
| skill_power | arrow_repel, phantasmic | 넓은 보폭의 강한 발사, 실제 화살 없는 준비 자세 |
| skill_focus | improve_conc | 가슴 앞 손·감은 눈의 집중 |
| skill_falcon | blitz_beat, falcon_strike | 오른손을 들어 목표로 지시 |
| skill_scout | detect | 이마에 손을 올려 원거리 탐지 |
| skill_whistle | drover_whistle | 입 앞에 오른손을 대는 호각 제스처 |
| skill_trap | skid_trap, land_mine, ankle_snare, shockwave_trap, sandman, flasher, freezing_trap, blast_mine, claymore_trap | 무릎을 낮추고 발밑에 손을 내려놓는 설치 동작 |

타격·설치·매 지시는 `hitFrame` 직전 합계 130ms. 집중·탐지·호각에는 `hitFrame`이 없다. 스킬은 모두 대기로 복귀하며 0.5~1초 범위다. 시전 시간이 있는 두 스킬에는 `cast` 호흡 루프가 준비되어 있다. 매·덫·폭발·비행 화살은 그리지 않았다. 일반 사격의 당김 자세에 장전된 짧은 화살선이 있으며 발사 장부터 사라진다. 환영 사격은 화살 없는 원화를 별도 수정해 사용한다.

## 레퍼런스와 확인 범위

- 첨부 RO 헌터 남동 시트: 작은 대기 변화, 교대 보행, 활 준비→당김→놓기, 낮은 앉기와 쓰러짐을 참고했다. 공개 GIF 렌더러는 웹 도구에서 접근 실패했으며 첨부 시트를 직접 확인했다.
- [ToS Falconer](https://treeofsavior.com/page/class/view.php?c=Falconer), [Sapper](https://treeofsavior.com/page/class/view.php?c=Sapper), [Ranger](https://treeofsavior.com/page/class/view.php?c=Ranger): 공식 설명을 읽고 Falconer 남녀 대기 GIF 화면도 네이티브 Chrome에서 확인했다. 매와 교감하는 팔 제스처, 매 지시·덫 설치·반동 사격의 기능 구분을 참고했다. 개별 스킬 영상 전체를 보았다고 주장하지 않는다.
- [SoC 공식 Faycal 영상](https://www.youtube.com/watch?v=6NmsFyj4TXg): Chrome에서 Scatter와 Arrowstorm 구간을 재생했다. 준비와 발사를 분리하고 발사 뒤 자세를 유지하는 리듬을 완성 모션 검수에 참고했다. 외부 이미지·영상은 저장하지 않았다.

## 프레임 검수와 수정

다음 장 전에 직전 원화의 얼굴 크기·복장·활 손·다리 위상·오른팔 이동을 직접 확인하고 참조로 전달했다. [FRAME_REVIEWS.json](FRAME_REVIEWS.json)에 연결 기록을 남겼다. 처음 대기 원화는 몸이 길어 제외했고 2등신으로 다시 그렸다. 강한 당김의 수평 화살선은 환영 사격 조건에 맞춰 재생성했다. 제외 원화는 매니페스트에서 사용하지 않는다.

정규화는 원화의 최근접 표본화·팔레트 제한·레이어 분리다. 축소에서 끊긴 가는 시위는 원화 픽셀의 면적 표본으로 보완했다. 새 자세를 코드로 합성하지 않았다. 몸·앞뒤 머리·활·그립은 실제 게임 레이어 순서로 재합성한다. GIF는 검토용 반복, 게임용 스킬은 한 번 재생이다. 비교 GIF는 양쪽 원래 시간을 유지하고 먼저 끝난 쪽은 대기로 기다린다.

[검증 결과](verification/validation.json): 캔버스·이진 알파·머리 네 키색·그립 접촉·잘림·합성 일치·8장 보행 구별·18개 매핑·타격 시점 등 905개 검사를 통과했다. GIF 46개는 Apple ImageIO로 모든 장을 독립 디코딩해 크기·시간을 확인했다. Chrome에서 동일 배율 비교, 모션 선택, 일시정지, 처음부터, 다음 장 이동을 확인했다. 최종 보행 시트의 교대 다리와 스킬 시트의 동작 구분도 눈으로 검수했다.

재생성: `PYTHONDONTWRITEBYTECODE=1 python3 register.py` → `build.py` → `compact_gifs.py` → `make_preview.py`. GIF 디코딩은 `swift -module-cache-path .swift-module-cache verify_gif.swift .` 후 해당 캐시를 제거하고 `PYTHONDONTWRITEBYTECODE=1 python3 validate.py`. 모든 작업은 이 폴더에 한정했다. 게임 적용·소스 변경·커밋·푸시는 하지 않았다.
