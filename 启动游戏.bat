@echo off
chcp 936 >nul
title 单词肉鸽 · 正在运行
cd /d "%~dp0"

start "" "D:\Program Files\Python312\pythonw.exe" "D:\pythonproject\单词肉鸽\app.py"
exit
