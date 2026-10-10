상태: 기준 (2026-10-10). 미니 미드가르에서 쓴 작업 도구·요청서·생성 프로세스의 위치입니다. 노하우(룰·교훈·프로세스·프롬프트 틀)는 제작 노트 사이트에 있습니다.

# 작업 플레이북

## 사용자 말
- "작업툴이나 노하우가 정리가 되면 좋겠어. 안 그러면 내가 또 싱글MMO 만들 때 똑같은 삽질을 할 거잖아?"
- "에셋 공방을 만드는 이유가 결국 그런걸 자산화 해서 다음 프로젝트는 보다 쉽게 하고 싶어서이니까."

## 어디에 무엇이 있나
- **제작 노트 사이트** (비밀번호): https://loop-girl-notes.pages.dev/
  - 원본: `~/Projects/loop-girl-notes`의 `site/data.js`
  - 생성 프로세스(작업 영역별), AI 요청 프롬프트 틀(복사용), 룰·교훈을 영역(배경·캐릭터·시스템…)과 범위(공통·게임별)로 거름
  - 새 노하우가 생기면 Claude에게 "제작 노트에 추가해줘"라고 하면 됩니다.
- **에셋 공방** (asset-kit, 공방 세션이 만듦): `npm run asset:workshop`
  - 우리 도트 영웅이 표준 기록으로 뜹니다(`asset-records/`).
  - 게임 무대(`asset-stage.html`)에서 재생·프레임 촬영, "이 동작 요청서"로 수정 요청서를 만듭니다.

## 요청서 (AI에게 넘긴 원본)
| 무엇 | 파일 |
|---|---|
| 도트 영웅 공통 | `docs/art/CLASS_PIXEL_BRIEF.md` |
| 2차 직업 마무리(스킬 모션) 공통 | `docs/art/CLASS_SKILL_BRIEF.md` |
| 직업별 값·스킬 표·보강 | `docs/art/class-briefs/<직업>.md` |
| 공방 요청서 + 게임 덧붙임 | `docs/art/requests/<날짜>-<대상>-<동작>-v2.md` |
| 모션 레퍼런스(라그나로크 렌더러·직업 번호·무기 번호) | `docs/art/CLASS_MOTION_REFS.md` |
| 배경 킷 | `docs/art/BG_BRIEF_R3.md` |

## 도구
| 도구 | 하는 일 |
|---|---|
| `tools/art/ro-sheet.mjs <job> <gender> <weapon>` | 라그나로크 직업 모션 시트(저장소 밖에 저장) |
| `tools/art/codex-run.sh <요청서> <폴더> [첨부…]` | 아스트라 실행(다른 codex가 끝날 때까지 기다림) |
| `tools/art/merge-pixel.mjs <납품> [--only 동작] [--dry]` | 납품을 `src/assets/pixel/manifest.json`에 합침 |
| `tools/art/hero-sheet.mjs <id> \| --lineup` | 게임 렌더러로 그린 동작·스킬 시트 |
| `tools/art/field-skills.mjs --party …` | 필드에서 실제 스킬 발동 장면 캡처 |
| `tools/qa/ui-check.mjs` | UI 회귀 검사 32개 |
| `tools/asset-kit-pixel.mjs` (`npm run asset:records`) | 도트 영웅 → 공방 표준 기록 |

- 헤드리스 도구는 다른 저장소의 playwright를 빌립니다: `PLAYWRIGHT_FROM`(기본 `../RiftLoopPrototype`). 실행마다 자기 프로필이라 사용자 저장을 건드리지 않습니다.
- 그림을 합친 뒤에는 개발 서버를 다시 띄웁니다(Vite가 옛 PNG를 줌).
- 노트북 발열: 무거운 작업(codex, 헤드리스 브라우저, 시뮬레이션)은 한 번에 하나만, `taskpolicy -b`로 돌립니다.

## 새 게임에서 시작하는 순서
1. 제작 노트의 "생성 프로세스"에서 맞는 영역을 고르고, "AI 요청 프롬프트 틀"을 복사합니다.
2. 위 도구들을 새 저장소의 `tools/art/`로 복사하고 경로·형식 이름만 바꿉니다.
3. 게임 형식 → 공방 표준 기록 변환기와 무대 페이지를 먼저 만들어 둡니다("게임을 공방에 붙이기").
