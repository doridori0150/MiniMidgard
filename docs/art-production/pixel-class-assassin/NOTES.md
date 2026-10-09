# 어쌔신 제작 기록

[미리보기](preview.html)에서 무기 교체, 정상·¼ 속도, 장별 이동, 일반 공격과의 동시 비교가 가능하다. 이번 작업은 어쌔신 에셋 패키지만 제작했다. 블랙스미스 및 다른 직업, `src/`는 수정하지 않았다.

## 디자인과 제작

`assassin_male_p2`: 백금색 비대칭 짧은 머리, 호박색 눈, 짙은 하관 마스크, 자주색 경갑, 남색 두 갈래 천, 황동 장식. 가까운 손 한쪽에 카타르를 착용하고 같은 손의 단검 교체 레이어를 제공한다. 먼 손은 뿌리기·줍기·독 바르기·해독을 담당한다.

쿠키 r12 / 기사 r15와 같은 128×120, 발 기준 (64,112), 대기 기본 키 48px, 머리 약 24px. 호흡 상승 장은 49px이다. 머리는 `assassin_swept_crop_p2` 및 지정된 4색만 사용한다. [PLAN.md](PLAN.md)에 동작을 먼저 설계하고, 내장 `image_gen.imagegen`으로 한 장씩 생성했다. 다음 생성 전에 직전 그림의 머리·마스크·갑옷·무기 손·무게중심을 검토했다. 정확한 프롬프트와 직전 검토는 [PROMPTS.json](PROMPTS.json), 채택·공유·제외 내역은 [FRAME_REVIEWS.json](FRAME_REVIEWS.json)에 있다.

51개 생성 결과 중 몸 동작 원화 45개와 단검 디자인 1개를 채택했다. 손이 바뀐 쓰러짐·연격·투척, 과하게 길어진 누운 비율, 중복된 천 꼬리 등 5개는 다시 그렸다. 원화에서 정수 좌표 정합, 팔레트 정리, 이진 알파, 머리·몸·무기·손 덮개 분리를 거쳤다. 무기는 그린 원화의 날을 추출해 각 손목 방향에 맞추었다.

기본 동작은 대기 3 / 걷기 8 / 공격 8 / 피격 3 / 쓰러짐 4 / 앉기 1 / 시전 3장이다. 총 111개 프레임 ID는 기본 30개와 스킬 81개다. 준비·회수·정착 자세를 공유하므로 111장 모두 새로운 원화라는 의미는 아니다. 걷기·일반 공격은 각각 서로 다른 8개 합성 프레임이다.

## 스킬 연결

| 게임 스킬 | 모션 | 장 수 / 길이 | 설계·공유 이유 |
|---|---|---:|---|
| `sonic_blow` | `skill_sonic` | 19 / 800ms | 짧은 회수와 상·하단 찌르기 8타. 대표 기술 별도 리듬 |
| `grimtooth` | `skill_grimtooth` | 6 / 610ms | 낮춰 지면에 날을 향한 뒤 압력 유지 |
| `envenom` | `skill_envenom` | 6 / 580ms | 전진 찌르기 한 번을 길게 유지 |
| `sand_attack`, `venom_dust` | `skill_scatter` | 6 / 550ms | 빈손을 전방 아래로 쓸어 뿌리는 공통 몸 동작 |
| `throw_stone`, `venom_knife` | `skill_throw` | 6 / 580ms | 어깨 뒤 준비→팔 뻗기→빈손 후속 동작 공유 |
| `find_stone` | `skill_pickup` | 6 / 610ms | 허리 숙임→지면 접촉→쥐고 일어나기 |
| `venom_splasher` | `skill_plant` | 6 / 570ms | 빈손을 적 쪽으로 낮게 내밀어 부착 |
| `enchant_poison` | `skill_coat` | 5 / 640ms | 수평 날에 빈손을 따라 움직여 독 바르기 |
| `poison_react` | `skill_guard` | 5 / 620ms | 무장한 팔을 가슴 앞에 올린 반격 자세 |
| `detoxify` | `skill_detox` | 5 / 610ms | 가슴 앞 준비→동료 쪽 손바닥 펴기 |
| `hiding`, `cloaking` | `skill_hide` | 4 / 580ms | 낮게 압축하는 은신 진입 동작 공유 |
| `back_slide` | `skill_backslide` | 7 / 640ms | 웅크림→뒤로 회전→무릎 착지→기립 |

타격·투척·설치 6종은 `hitFrame: 2`, 앞 두 장 합계가 정확히 130ms다. 음속 연격의 타격 자세는 인덱스 2·4·6·8·10·12·14·16으로, 시작 시각 130·190·250·310·370·430·490·550ms다. 실제 피해 횟수와 이펙트는 게임 로직이 담당한다. 줍기·버프·회복·은신·이동에는 `hitFrame`이 없다. 일반 공격은 인덱스 3 / 220ms, 전체 620ms다. `cast`는 500ms 반복이며 돌 줍기와 독 폭발의 시전 중 사용한다.

투척 장 2·3은 무기를 숨겨 빈손을 보이고 회수 때 복구한다. 돌·단검 투사체, 모래·독 안개·폭발·지면 칼날, 은신 투명화 및 뒤로 이동하는 월드 좌표는 게임에서 처리한다. 그림에는 몸과 휘두름에 붙은 잔상만 있다. 돌 던지기는 같은 투척 몸 동작을 쓰며, 카타르를 단검처럼 날리는 투사체는 이 패키지에 없다.

## 레퍼런스 확인 범위

- **첨부 RO 남성 어쌔신 시트:** 직접 확인. 낮은 보행, 팔 뒤당김→가로베기→낮은 후속 자세, 무릎 붕괴→옆으로 쓰러짐, 마지막 줄의 손 모음 시전을 참고했다. RO 픽셀을 복사하거나 외부 이미지를 이 폴더에 저장하지 않았다.
- **[ToS 공식 Assassin](https://treeofsavior.com/page/class/view.php?c=Assassin), [Rogue](https://treeofsavior.com/page/class/view.php?c=Rogue):** 공식 직업·스킬 설명을 확인하고 Assassin 페이지의 캐릭터 표시도 브라우저에서 확인했다. 반복 근접, 직선 찌르기, Knife Throw, Burrow, 연막의 기능 차이를 스킬별 자세 분리에 참고했다. **스킬별 실제 영상 재생은 확인하지 못했으므로 특정 자세를 영상에서 관찰했다고 주장하지 않는다.**
- **[SoC 공식 Acambe 영상](https://www.youtube.com/watch?v=DymcWByf_yU):** 브라우저 재생과 Rich Rewards 전투 화면을 확인했다. 작은 몸 실루엣과 큰 독립 효과를 구분하는 보조 참고로만 사용했다. 어쌔신 연격의 직접 모션 원본은 아니다.
- **쿠키 r12 / 기사 r15:** 크기·등신·팔레트 대비 기준. `size_comparison_1x.png`, `size_comparison_4x.png`는 캐릭터별 추가 배율 조정 없이 같은 캔버스에 합성했다.

## 검증과 전달

프레임 시트의 행 배치 오류를 고쳤고, 그림자 송곳니의 단검 끝이 캔버스 하단에 닿는 문제를 검출했다. 날 방향 조정 후에도 남은 문제는 무기 추출 영역에 포함된 갑옷 픽셀이 원인이어서, 두 무기 모두 윤곽 마스크와 금속 색상 분리로 수정했다. `validate.py`는 전체 레이어의 크기·알파·머리색, 합성 일치, 무기 연결·구분, 클리핑, 시트의 모든 칸, 스킬 매핑과 타이밍을 검사한다. GIF는 Apple ImageIO로 독립 디코딩하여 장 수·시간·크기를 검사한다. 전체 자동 검증을 통과했다. 결과는 `verification/validation.json`, `verification/gif_decode.json`에 있다.

`body/`, `hair/`, `weapons/katar/`, `weapons/dagger/`, `grips/`에 111개 ID의 6개 레이어 PNG(총 666개)가 있다. `composite/`에 두 무기 합성 222개, 기본·스킬 19종 GIF 1×/4×와 단검 주요 동작 GIF, 일반 공격 대 스킬 12종 비교 GIF까지 총 72개 GIF를 제공한다. 모든 동작별 시트와 전체 시트도 포함한다. 전체 시트 숫자의 ID 대응은 `contact_sheet_index.json`이다.

브라우저에서는 222개 이미지 로드, 음속 연격 재생, 뒤로 구르기의 장별 이동, 단검 전환과 투척 방출 시 빈손을 확인했다. 패키지의 자동 검사와 시각 검수는 실제 게임 통합 검증을 대신하지 않는다. 현재 `src/render/pixel.ts`는 `katar`를 `dagger`로 매핑하므로, 추후 게임 통합 작업에서 이를 연결해야 새 카타르 그림을 사용한다. 이번 요청의 수정 금지 범위에 따라 게임 코드는 변경하지 않았다.

재출력은 이 폴더에서 `PYTHONDONTWRITEBYTECODE=1 python3 build.py`, `PYTHONDONTWRITEBYTECODE=1 python3 make_preview.py` 순서다. GIF 검증은 `swift -module-cache-path .swift-module-cache verify_gif.swift .`, 이후 `PYTHONDONTWRITEBYTECODE=1 python3 validate.py`를 실행한다. Swift 캐시는 검증 후 삭제한다. 커밋·푸시는 하지 않았다.
