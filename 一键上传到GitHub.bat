@echo off
chcp 65001 >nul
title 单词肉鸽 · 推送到 GitHub
cd /d "%~dp0"

echo ======================================================
echo    🚀 单词肉鸽 -^> GitHub (word-roguelike) 推送工具
echo ======================================================
echo.
echo 正在推送到 https://github.com/q1164012062/word-roguelike ...
echo (若弹出 GitHub 登录/授权弹窗，请点击 Authorize 确认)
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ======================================================
    echo  🎉 推送成功！
    echo  你的项目已上传至: https://github.com/q1164012062/word-roguelike
    echo ======================================================
) else (
    echo ------------------------------------------------------
    echo [提示] 如果因网络或授权中断，也可以直接在 GitHub Desktop 
    echo        软件里点击顶部的「Push origin」按钮推送！
    echo ------------------------------------------------------
)
echo.
pause
