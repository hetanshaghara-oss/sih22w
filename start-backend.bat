@echo off
title NAWI System - Backend Server
cd /d "D:\NAWI-System\backend"
echo ========================================================
echo Starting NAWI Backend Server on http://127.0.0.1:8000
echo ========================================================
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
