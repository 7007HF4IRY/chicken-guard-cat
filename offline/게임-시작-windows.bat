@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8765
start /B cmd /c "python -m http.server %PORT% 2>nul || py -3 -m http.server %PORT%"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%"
echo.
echo 치킨 사수 냥이 — 브라우저에서 플레이하세요.
echo 서버 종료: 이 창을 닫으세요.
pause
