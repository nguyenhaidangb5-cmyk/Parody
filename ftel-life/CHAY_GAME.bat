@echo off
chcp 65001 >nul
title FTEL LIFE - Ngay dau di lam
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [!] Chua co Node.js. Hay cai ban LTS tai https://nodejs.org roi chay lai file nay.
  start https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dang cai dat thu vien lan dau, vui long doi 1-2 phut...
  call npm install
)
echo Dang khoi dong FTEL LIFE... Trinh duyet se tu mo tai http://localhost:5173
call npm run dev -- --open
pause
