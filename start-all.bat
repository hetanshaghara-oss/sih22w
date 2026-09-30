@echo off
title NAWI System Launcher
echo ========================================================
echo Starting NAWI Compliance & Test Report System
echo ========================================================
start "NAWI Backend (Port 8000)" cmd /k "cd /d D:\NAWI-System\backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak >nul
start "NAWI Frontend (Port 5173)" cmd /k "cd /d D:\NAWI-System\frontend && npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo Both servers started! Browser launched to http://localhost:5173
