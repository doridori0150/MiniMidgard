#!/bin/bash
# 아스트라(Codex) 한 건 실행: 요청서 하나를 그대로 하라고 맡깁니다. 노트북 열 때문에 다른 `codex exec`가 끝날 때까지 기다립니다.
# 사용: tools/art/codex-run.sh <요청서.md> <결과 폴더> [첨부 그림 ...]
#   요청서: docs/art/class-briefs/<직업>.md, docs/art/requests/<날짜>-<대상>.md 등 (docs/playbook/ai-요청.md)
#   첨부: 레퍼런스 시트(tools/art/ro-sheet.mjs, 저장소 밖 임시 폴더), 지금 그림의 접촉 시트, 크기 기준 시트
# 기록: $LOG_DIR(기본 ${TMPDIR:-/tmp}/minimidgard-codex)/<요청서 이름>.log, 마지막 답 .last.md
set -u
BRIEF=$1; OUT=$2; shift 2
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
LOG_DIR=${LOG_DIR:-${TMPDIR:-/tmp}/minimidgard-codex}; mkdir -p "$LOG_DIR"
NAME=$(basename "$BRIEF" .md)
ATTACH=(); for f in "$@"; do ATTACH+=(-i "$f"); done
# ChatGPT 앱의 `codex exec-server`는 상시 떠 있으니 빼고 셉니다.
while pgrep -fl "codex exec" | grep -v "exec-server" | grep -q .; do sleep 60; done
cd "$ROOT"
echo "$NAME start $(date)" | tee -a "$LOG_DIR/$NAME.log"
taskpolicy -b codex exec -m "${CODEX_MODEL:-gpt-6-astra}" "Read $BRIEF and do exactly what it says, into $OUT/. Keep the user's words and the three drawing rules in it (match proportion/style/size, check references, plan then draw one frame at a time checking the previous). The attached images are the references and the current approved art named in it; do not copy the attached images into $OUT/ (reference images from other games must never be saved in this public repo). Write only inside $OUT/. Do not change src/, commit or push. End with a short Korean summary." \
  -s workspace-write -C . -o "$LOG_DIR/$NAME.last.md" "${ATTACH[@]}" < /dev/null >> "$LOG_DIR/$NAME.log" 2>&1
echo "$NAME done $(date) exit $?" | tee -a "$LOG_DIR/$NAME.log"
