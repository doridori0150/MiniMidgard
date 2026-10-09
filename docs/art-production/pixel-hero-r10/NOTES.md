# Round 10 — 디자인 C 전체 모션

납품 캐릭터는 `swordsman_female_p2` 하나다. 기본 `wavy_p2`는 선택한 C 물결머리이며, `ponytail_p2`로 교체할 수 있다. 앞 3/4 오른쪽 방향만 제작했다. 기준 대기 높이는 48px이고, 얼굴·눈 배치와 머리 외형은 원본 C에서 가져왔다. 머리 영역의 붉은 잡점은 제거하고 머리 색은 C 팔레트의 크림·베이지·갈색 네 키로 정리했다.

| 동작 | 프레임 | 프레임 시간(ms) | 동작 |
|---|---:|---|---|
| idle | 4 | 220 × 4 | 반복 |
| walk | 8 | 90 × 8 | 반복 |
| attack | 6 | 110, 40, 40, 40, 130, 70 | 430ms, `hitFrame: 4` |
| hurt | 2 | 80, 160 | 단발 |
| dead | 4 | 80, 100, 140, 1 | 마지막 장 유지 |
| sit | 1 | 1 | 마지막 장 유지 |

`1ms`는 기존 pixel/1 규격에서 쓰던 정지 자세의 명목 시간이다. dead/sit는 `loop: false`, `holdLast: true`로 마지막 그림을 유지한다. 전체 및 캐릭터별 animations에 같은 데이터를 넣었다.

## 읽은 레퍼런스와 적용

제작 전에 `CONCEPT_BRIEF_R10.md`, `MOTION_REFERENCE.md`와 아래 세 튜토리얼 원문을 읽었다. itch.io의 개별 댓글 링크가 열리지 않아 같은 게시글의 원문 topic URL로 확인했다. 게임 GIF 장수는 프로젝트 모션 문서의 조사값을 따랐으며, 이번에 공식 GIF를 다시 분해해 실측했다는 뜻은 아니다.

- [Slynyrd Pixelblog 56](https://www.slynyrd.com/blog/2025/5/23/pixelblog-56-top-down-character-attack-animation): 준비–스미어–끝까지 뻗음–복귀의 6장 구성, 스미어 없는 타격 자세, 타격에서 칼끝 1px 추가, 같은 손에 무기 유지 원칙을 적용했다. 원문 검 공격은 400ms지만 이 의뢰에서 우선하는 모션 표에 맞춰 430ms로 제작했다.
- [Slynyrd Pixelblog 9](https://www.slynyrd.com/blog/2018/9/8/pixelblog-9-melee-attacks): 짧은 스미어 구간과 오래 보이는 끝 자세, 자세 사이를 잇는 검의 이동 경로를 참고했다. 준비 110ms·타격 130ms와 중간 40ms의 대비를 사용했다.
- [imonk — Sword Slash Animation](https://itch.io/t/2489691/pixel-tutorial-sword-slash-animation): 키 자세를 먼저 만들고 중간 장을 채우는 순서, 준비의 몸통 비틀기, 전방 체중 이동과 뒤꿈치 들기, 검 끝의 바람 조각이 복귀에서 흩어지는 처리를 적용했다. 원문의 캐릭터나 픽셀은 복사하지 않았다.

## 제작과 수정 기록

1. 내장 `image_gen.imagegen`으로 공격 0·4·5 및 걷기 0·4의 키 자세를 한 시트에 먼저 생성했다. `source/key_poses_generated.png`가 그 기록이다.
2. 키 시트와 C 대기·검격을 참조해 전체 모션을 단일 시트로 생성했다. `source/motion_sheet_generated.png`를 보존하고, 공격 중간 칼 각도를 수정한 `motion_sheet_corrected.png`를 만들었다.
3. 전체 시트에서 걷기 2·6번의 검이 빠지고 다리 동작이 반복되는 문제가 있어 걷기 8장을 한 교정 시트 `walk_corrected.png`로 다시 생성했다. 나머지 동작은 기존 시트를 유지했다. 모든 실제 프롬프트와 순서는 `PROMPTS.json`에 있다.
4. `inspect_source.py`가 기록된 영역·격자 간격을 따라 한 칸당 한 픽셀을 샘플링한다. 보간 없이 C의 31색 팔레트로 고정하고 알파는 0/255로 제한한다. 생성 원본의 흐릿한 반투명 외곽은 최종 PNG에 포함하지 않는다.
5. `clean.py`가 선택 영역의 픽셀을 정리하고 레이어를 분리한다. 원본 C에서 추출한 동일한 얼굴을 up/hurt/down 자세별로 붙이며, hurt는 눈만 감은 고정 표정이다. 누운 머리는 이 고정 머리의 정수 90° 전치이고 팔 회전은 사용하지 않았다. 기본 머리는 원본 C, 포니테일 꼬리는 생성 시트의 픽셀을 사용한다.
6. 재검수에서 발견한 이전 머리의 잔여 픽셀, 머리 교체 때 지워진 팔, 목 연결, 바닥선 돌출을 수정했다. 검의 손잡이 위에는 원래 그려진 장갑 픽셀을 별도 grip으로 보존했다. 공격 3·4의 그려진 앞다리 픽셀을 행별 1/2/3px 이동해 접지를 넓히고, 4번 뒤꿈치 픽셀을 들어 발끝 접지를 남겼다. 신체 다각형을 생성하거나 팔 스프라이트를 회전해 동작을 조립하지 않았다.
7. 공격 1~3은 각각 하나로 연결된 밝은 검광 띠를 유지한다. 4번은 검광 없이 칼끝을 1px 추가하고 작은 바람 두 조각만 남겼다. 5번에는 분리된 바람 1px 두 개가 흩어진다. 머리 끝과 허리 천의 변화는 몸 움직임보다 늦게 따라오도록 정리했다.

여기서 픽셀 정리는 에이전트가 확대본을 보고 선택한 영역·좌표를 스크립트에 기록해 재현한 작업이다. 별도의 인간 화가가 수작업했다는 의미가 아니다. `source/extraction.json`, `source/pose_coordinates.json`, `source/pixel_edits.json`이 추출·배치·개별 수정 근거다. 정수 이동과 팔레트/레이어 처리는 `clean.py`에 공개되어 있다.

## 레이어 규격과 확인 파일

- 캔버스 128×120, 원점 (64,112), 머리 레이어 96×96 / pivot (48,48): R8과 동일하다.
- 합성 순서: 머리 뒤 → 몸/고정 얼굴 → 검/검광 → 손가락 → 머리 앞. 머리 PNG는 네 hairKeys만 사용한다. 다른 팔레트의 머리색으로도 교체할 수 있다.
- `manifest.json`: 레이어 경로, 프레임 시간, 머리 자세, 손잡이·칼끝 주석. 각도 주석만으로 애니메이션 품질을 검증했다고 간주하지 않는다.
- `verification/review.png`: 25장 모두 4× 최근접 확대, 프레임 번호와 시간.
- `verification/attack_keys.png`: 공격 0~5 전체 8× 확대.
- `verification/play.gif`: idle → walk → attack, 18장, 실제 지정 시간, 한 주기 2030ms. 스프라이트 3× 최근접 확대.
- `verification/ponytail_review.png`: 포니테일 전체 25장. 동작별 GIF도 추가했다. dead/sit 개별 GIF의 마지막 장은 관찰을 위해 1초로 표시하며 manifest의 hold 동작과는 구분한다.
- `verification/validation.json`: 최종 실제 파일 검사 결과 및 SHA256. 프레임 수·시간·레이어 합성·네 머리색·얼굴 일치·확대 배율·GIF 시간·검광 연결성 등을 검사한다. 자세와 동작의 가독성은 별도로 확대판에서 육안 검수했다.

최종 818개 검사 통과. 두 머리 스타일의 모든 프레임을 확인했으며, 포니테일의 누운 자세에서 떨어져 있던 머리 픽셀 조각도 제거했다. `verification/reproducibility.json`에는 보존 원본에서 재빌드한 결과와 기존 산출물의 SHA256 일치 검사를 기록했다.

## 재현

Python 3와 Pillow 12.3.0 환경에서 실행한다. 빌드는 보존한 생성 원본을 사용하며, API나 추가 이미지 생성 없이 다시 만들 수 있다.

```sh
python3 -m pip install -r docs/art-production/pixel-hero-r10/requirements.txt
python3 docs/art-production/pixel-hero-r10/build.py
python3 docs/art-production/pixel-hero-r10/validate.py
```

이번 실행은 이미 설치된 Pillow 12.3.0이 있는 Codex Python 환경을 사용했다. 생성 서비스가 기본 저장한 파일은 이 폴더로 복사해 보존했다. 직접 작성·수정한 프로젝트 결과물은 모두 `docs/art-production/pixel-hero-r10/` 내부에 있다. 게임 코드·기존 아트는 수정하지 않았고 런타임 통합·커밋·푸시는 하지 않았다.
