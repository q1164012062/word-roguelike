@echo off
chcp 65001 >nul
title 单词肉鸽 · 正在运行
cd /d "%~dp0"

echo ======================================================
echo        🎮 单词肉鸽 (LexiRogue) · 本地启动器
echo ======================================================
echo.
echo  正在启动本地游戏服务并自动打开浏览器...
echo  访问地址: http://127.0.0.1:8765/
echo.
echo  [提示] 游戏期间请保持本窗口开启，关闭窗口即退出游戏。
echo ======================================================
echo.

if exist "..\.venv\Scripts\python.exe" (
    "..\.venv\Scripts\python.exe" play.py
) else (
    python play.py
)
