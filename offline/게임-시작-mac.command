#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
python3 -m http.server "$PORT" &
SRV=$!
sleep 1
open "http://127.0.0.1:$PORT"
echo "치킨 사수 냥이 — 로컬 서버 (포트 $PORT). 종료: Ctrl+C"
wait $SRV
