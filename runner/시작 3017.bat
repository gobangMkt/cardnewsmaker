@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo 시리즈픽 카드뉴스 컨트롤 패널
echo http://localhost:3017
echo.
start "" http://localhost:3017
node server.js
pause
