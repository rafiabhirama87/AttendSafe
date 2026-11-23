@echo off
title AttendSafe Launcher

echo =====================================
echo       MENJALANKAN ATTENDSAFE
echo =====================================

echo.
echo [1/2] Menjalankan Backend FastAPI...
start "AttendSafe Backend" /D "%~dp0backend" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn main:app --reload"

echo.
echo [2/2] Menjalankan Frontend React...
start "AttendSafe Frontend" /D "%~dp0frontend" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"

echo.
echo Menunggu server berjalan...
timeout /t 7 /nobreak >nul

start "" http://localhost:5173

echo.
echo AttendSafe berhasil dijalankan!
