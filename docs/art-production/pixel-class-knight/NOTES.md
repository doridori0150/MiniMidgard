# 기사 — 기본 동작 + 스킬

`knight_female_p2`, `minimidgard.pixel/1`. r15 기본 27장의 몸·머리·검·쥔 손 그림과 기본 애니메이션 시간을 보존했다. 2등신, 대기 48px, 128×120, 발 기준점 (64,112), 가까운 무기 손을 유지한다. 머리 이름/경로만 `knight_braided_bob_p2`로 분리했다.

**계획과 제작.** `PLAN.md`를 먼저 작성했다. 내장 `image_gen.imagegen`으로 새 자세를 한 장씩 만들고, 직전 그림을 본 다음 다음 장에 참조했다. 최종 채택한 새 몸 자세는 15장, 창 원화는 1장이다. 기존 준비·타격·회수 자세도 재사용하여 기본 27장 + 캐스팅 2장 + 스킬 59장의 **88개 프레임 슬롯**을 구성했다. 88장을 모두 새로 그렸다는 뜻은 아니다. 생성 출처는 `PROMPTS.json`, 원화는 `authored/`, 자세별 기록은 `AUTHOR_REVIEWS.json`, 슬롯별 연결은 `FRAME_REVIEWS.json`에 있다. 외부 게임 그림은 저장하거나 픽셀을 복사하지 않았다.

| 스킬 id | 모션 | 공유 이유 / 동작 |
|---|---|---|
| `bash` | `skill_cleave` | 위 준비 → 아래 강타 → 낮은 멈춤 |
| `magnum_break`, `brandish` | `skill_sweep` | 몸을 감는 넓은 쓸기. 폭발은 게임 이펙트에 맡김 |
| `pierce`, `spear_stab` | `skill_thrust` | 허리 당김 → 직선 깊은 찌르기 → 짧은 재찌르기 |
| `spear_boomerang` | `skill_throw` | 어깨 뒤 준비 → 빈손으로 놓기 → 같은 손으로 되받기 |
| `endure`, `auto_counter`, `iron_stance` | `skill_guard` | 무릎과 팔을 압축하고 버티는 방어 자세 |
| `twohand_quicken`, `element_shift`, `mana_edge` | `skill_enchant` | 무기 세움 → 반대 손으로 날 쪽에 집중 |
| `provoke` | `skill_provoke` | 무기를 낮추고 반대 손으로 도발 |
| `bowling_bash` | `skill_double` | 큰 첫 베기 → 아래에서 위로 역베기 |
| `moon_slash` | `skill_crescent` | 아래 베기 → 역베기 → 마지막 내리베기 |
| `charge_attack` | `skill_charge` | 낮게 압축 → 전진 찌르기 → 착지·회수 |

16개 전부 매핑했으며 제외한 스킬은 없다. 스킬은 560~710ms, 타격/약화 적용 모션의 첫 `hitFrame`은 정확히 130ms에 시작한다. 방어·강화에는 `hitFrame`이 없다. 2·3연타는 첫 타 이후 역베기/마지막 베기가 이어진다. 실제 후속 피해 시점·횟수는 기존 게임 로직이 결정한다. `cast`는 방어 준비/압축 자세를 160+160ms로 연결한 짧은 반복이며, 캐스팅이 있는 세 스킬이 사용한다.

**레퍼런스 확인 범위.** 첨부 RO 여성 기사 시트에서 뒤로 감는 준비, 짧은 큰 부채꼴 베기, 낮은 후속 멈춤, 마지막 줄의 압축된 캐스팅 자세를 직접 확인했다. 쿠키 r12와 기사 r15 시트는 크기·화풍 기준으로 비교했다. [TOS Hoplite 공식 페이지](https://treeofsavior.com/page/class/view.php?c=Hoplite)의 찌르기·투척·방어 설명과 [Highlander 공식 페이지](https://treeofsavior.com/page/class/view.php?c=Highlander)의 연속 베기·올려베기·가드 설명을 읽고 기술 구분에 반영했다. [Cataphract 공식 페이지](https://treeofsavior.com/page/class/view.php?c=Cataphract)도 열었다. TOS 투척 영상은 브라우저에서 재생 페이지까지 열었지만 로그인 화면으로 전환되어 연속 동작을 충분히 관찰하지 못했다. [소드 오브 콘발리아 공식 채널](https://www.youtube.com/@SwordofConvallaria)과 [공식 사이트](https://soc.xd.com/)도 열었으나 영상 장면을 확인하지 못했으므로 그 작품에서 특정 자세를 관찰·차용했다고 주장하지 않는다. 이 제한 아래 RO 시트와 공식 기술 설명을 참고해 우리 캐릭터의 자세를 설계했다.

**장 사이 검수와 수정.** 준비→타격의 같은 손, 찌르기의 팔 연장, 투척의 손 펼침→같은 손 되받기, 가드의 무릎 압축, 강화의 반대 손 이동, 2·3연타의 방향 전환을 확인했다. 축소 후 강화 검이 머리에 가려지는 두 장은 제외하고 바깥으로 내민 자세로 재생성했다. 얼굴·머리는 r15 원본을 정수 좌표로 옮겨 크기와 인상을 고정했다. 모든 스킬의 마지막 장은 대기 원본이며, 캐스팅 두 장은 서로 이어진다.

**창과 레이어.** 88슬롯 모두 `spear`와 쥔 손 덧그림 경로가 있다. 고정 56px 길이의 창을 검과 같은 손잡이 좌표에 놓고, 대기 휴대 각도를 조정해 자루 끝 잘림을 해결했다. 일반 공격 마지막 장도 대기와 동일한 창 각도로 맞췄다. 투척의 빈손 프레임은 두 무기 레이어가 의도적으로 투명하고 `visible: false`이다. `pixel/1` 렌더러는 공통 `frame.grip` 하나를 쓰므로 창 전용 손 덧그림을 창 PNG에도 합성했다. 별도 덧그림 파일과 `weapon.byType.spear`에는 그 출처·좌표를 기록했다. 검으로도 모든 모션이 읽히지만 창 던지기는 게임상 창 전용이다. 탑승 조건·이동·폭발·마법 효과는 기존 게임 처리를 따른다.

**보기와 검증.** `preview.html`에서 검/창, 1×/4×, 일시정지와 다음 장, 일반 공격 비교를 볼 수 있다. 각 스킬의 1×/4× GIF, 검/창 접촉 시트, `attack_vs_skill_*` 비교 GIF/PNG를 제공한다. `comparison_*.png`는 쿠키 r12 / 기사 r15 / 완성 기사 검 / 창 순서다. `verification/validation.json`은 기본 그림 해시, 전체 레이어 재합성, 머리 팔레트, 이진 알파, 창 길이·손잡이·잘림, 스킬 매핑·시간 검사 결과다. GIF는 색상표를 바꾸지 않는 LZW 재압축 뒤 Apple ImageIO로 별도 디코딩해 장수·시간·크기를 확인한다. 브라우저에서 창 전환과 130ms 투척 빈손 프레임을 확인했다.

재빌드: `PYTHONDONTWRITEBYTECODE=1 python3 docs/art-production/pixel-class-knight/build.py` → `compact_gifs.py` → `make_preview.py`. GIF 검증은 `verify_gif.swift`, 전체 검증은 `validate.py`. 최종 파일 검증 기록이 기준이며 `verification/r15_inherited/`는 이전 라운드 참고 기록이다. 요청대로 게임 코드 수정·실제 게임 통합·커밋·푸시는 하지 않았다.
