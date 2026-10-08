# Codex 요청 가이드 (Claude Code용)

> 이 문서를 Claude Code 세션의 지침으로 넣는다. 이 PC의 Claude 세션이 "코덱스에게 요청해"를 바로 처리하게 하는 것이 목적이다.
> - 모든 프로젝트에서 쓰려면 `~/.claude/CLAUDE.md`에, 한 프로젝트에서만 쓰려면 그 프로젝트의 `CLAUDE.md`에 아래 "지침" 부분을 붙여 넣는다.
> - 확인한 버전: codex-cli 0.159.3. 기본 모델은 `~/.codex/config.toml`의 `model`(예: gpt-6-astra, 사용자가 "코덱스 아스트라"라고 부르는 것), 추론은 high.

---

## 지침 (여기부터 붙여 넣기)

### 코덱스 요청이란
- 사용자가 "코덱스에게 요청해", "코덱스한테 맡겨", "코덱스 아스트라와 토론해"라고 하면 **이 PC에 설치된 OpenAI Codex CLI(`codex`)를 비대화형으로 실행**하라는 뜻이다. 웹 서비스나 다른 앱을 찾지 않는다.
- Codex는 코딩 에이전트이고, 내장 이미지 생성(image_gen)이 있다. 그림·스프라이트·배경 키트 같은 **에셋 제작**, 두 번째 의견을 듣는 **리뷰와 토론**, 범위가 분명한 **구현**에 쓴다.
- 요청은 **브리프 파일 → `codex exec` 백그라운드 실행 → 결과 검수 → 사용자에게 보고** 순서로 한다.

### 0. 먼저 확인
```bash
codex --version          # 없으면: npm i -g @openai/codex
codex login status       # 로그인 안 돼 있으면 사용자에게 `codex login`을 직접 하라고 안내 (대화형이라 내가 하지 않는다)
```

### 1. 브리프 파일 쓰기 (프롬프트를 명령줄에 길게 넣지 않는다)
저장소 안에 `docs/<주제>_BRIEF.md` 같은 파일을 만든다. 형식은 아래와 같다.

```markdown
# <제목> (Codex 의뢰)

## 요약 (사람용)
- 사용자 요청 원문 인용, 무엇을 왜 만드는지 3~5줄 (한국어)

## REQUEST (for Codex)
(영어로) 목표 / 맥락: 참고할 파일 경로를 구체적으로 / 결과물과 정확한 저장 폴더 / 형식·계약
(파일 이름 규칙, 크기, 원점, manifest 스키마) / 검증물 (미리보기 이미지, 수치, 체크 결과) /
제약 / "Finish with a short Korean summary."
```

반드시 넣을 제약
- **쓰기 범위를 한 폴더로 제한**한다. 예: "Work only in `docs/art/xxx/`. Do not modify `src/`, `tools/` or other folders." 엔진 연결은 내가 한다.
- **IP**: 다른 게임의 이름·캐릭터·에셋을 베끼지 않는다. 오리지널만 허용한다.
- **스타일**은 승인된 참고 이미지 경로와 함께, 피할 것까지 명시한다. 예: "no glossy generic anime, no gradients".
- **검증**: 미리보기 이미지, 비교 이미지, 측정 수치를 요구한다. 결과를 "말"이 아니라 "파일"로 받는다.
- 조립형 에셋(파츠, 리그, 스프라이트)은 **Codex가 직접 계약(manifest)과 참조 플레이어/조립 코드**를 설계하게 한다. 게임 쪽은 그 코드를 한 줄씩 포팅한다. 내가 파츠 크기로 관절을 추측하면 조립이 깨진다.

### 2. 실행 (항상 백그라운드, 항상 stdin 닫기)
macOS / Linux (bash·zsh):
```bash
cd <저장소> && codex exec "Read docs/<주제>_BRIEF.md and carry out its REQUEST section." \
  -s workspace-write -C . \
  -o <스크래치폴더>/codex-<주제>-last.md \
  -i docs/art/ref/approved.png \
  < /dev/null
```
Windows
- PowerShell: `"" | codex exec "Read docs/..." -s workspace-write -C . -o $env:TEMP\codex-<주제>-last.md`
- cmd: `codex exec "..." -s workspace-write -C . -o %TEMP%\codex-<주제>-last.md < NUL`

규칙
- **stdin을 반드시 닫는다**(`< /dev/null`, `< NUL`, 빈 파이프). 안 닫으면 "Reading additional input from stdin" 상태로 끝없이 멈춘다(실제로 88분 멈춘 적이 있다).
- **Bash 도구의 `run_in_background: true`로 실행**한다. 작업은 10~90분 걸린다. 끝나면 하네스가 알려 주므로 sleep 반복이나 폴링은 하지 않는다.
- `-o` 파일에 Codex의 마지막 메시지(한국어 요약)가 남는다. 끝나면 이 파일부터 읽는다.
- `-i <이미지>`: 참고 이미지를 첨부한다. 여러 장이면 `-i a.png -i b.png`.
- `-s`(샌드박스)
  - 파일을 만들 때는 `workspace-write`.
  - 리뷰·토론만 할 때는 `read-only`. 이때 답은 `-o`로 받는다.
  - `danger-full-access`와 `--dangerously-*` 옵션은 쓰지 않는다.
- 모델: 기본값을 쓴다. 바꿀 때는 `-m <모델>`, 추론 강도는 `-c model_reasoning_effort="high"`.
- 이어서 요청: `codex exec resume --last "추가 지시" < /dev/null`. 또는 새 브리프(R2, R3…)를 써서 새로 실행한다. 큰 수정은 새 브리프가 기록이 남아서 낫다.
- 코드 리뷰만 받을 때: `codex exec review < /dev/null`.
- 동시에 여러 개를 돌릴 수 있지만, **같은 폴더에 쓰는 작업을 두 개 돌리지 않는다**.

### 3. 검수 (Codex의 "다 했다"를 그대로 믿지 않는다)
1. `-o` 요약을 읽는다.
2. 결과 폴더의 파일 목록, 이미지(Read로 직접 본다), 검증 수치를 확인한다.
3. 제약을 지켰는지 본다: `git status`에서 허용 폴더 밖이 바뀌지 않았는지.
4. 엔진에 연결해야 하면 내가 연결한다. 그다음 프로젝트 검사(타입 체크, 테스트, 빌드)와 스크린샷 확인을 한다.
5. 문제가 있으면 무엇이 왜 문제인지 적은 R2 브리프로 다시 요청한다.

### 4. 사용자에게 보고 (한국어)
- 시작할 때: 무엇을 요청했는지, 브리프 경로, 백그라운드로 돌고 있다는 것을 한두 줄로 알린다.
- 끝나면: 결과 이미지(미리보기)를 보여 주고 요약과 솔직한 한계를 말한다. 게임·앱에 적용하려면 사용자 확인을 받는다. 취향 판단은 사용자가 한다.
- Codex 리뷰는 버그 찾기에는 유용하지만 **취향이나 구조 개편 제안을 그대로 적용하지 않는다**. 화면 구조를 바꾸는 제안은 시안을 보여 주고 확인받는다.

### 5. 예시 (실제로 쓴 것)
- 에셋: `docs/art/SPRITE_BRIEF.md` → `docs/art/sprites/`
  - 통짜 스프라이트, manifest, 참조 플레이어 `player.py`, 검증 이미지를 받았다.
  - 게임에서는 `src/render/whole.ts`로 포팅했다.
- 화풍 테스트: `docs/art/STYLE_PROBE_PAINTERLY.md` → `docs/art/style-painterly/`.
- 토론·리뷰: `docs/ux/*`(R1~R6). `-s read-only`로 실행해 의견을 `-o`로 받고, 내 반론과 결정을 다음 라운드 브리프에 적었다.
