#!/usr/bin/env python3
"""单词肉鸽 · 独立桌面应用程序启动器"""
from __future__ import annotations

import http.server
import os
import socketserver
import subprocess
import sys
import threading
import time

if getattr(sys, "frozen", False):
    # PyInstaller 打包环境
    exe_dir = os.path.dirname(sys.executable)
    if os.path.isfile(os.path.join(exe_dir, "index.html")):
        ROOT = exe_dir
    elif hasattr(sys, "_MEIPASS"):
        ROOT = sys._MEIPASS
    else:
        ROOT = exe_dir
else:
    ROOT = os.path.dirname(os.path.abspath(__file__))

PORT = 8765


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        pass  # 静默运行，不产生日志刷屏


def find_edge():
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def main():
    os.chdir(ROOT)
    url = f"http://127.0.0.1:{PORT}/"

    # 尝试启动 HTTP 服务（如果已启动则复用）
    httpd = None
    try:
        httpd = socketserver.TCPServer(("127.0.0.1", PORT), QuietHandler)
        server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        server_thread.start()
    except OSError:
        pass  # 端口已占用说明服务正在运行，直接启动窗口

    edge = find_edge()
    app_profile = os.path.join(ROOT, ".app_profile")

    if edge:
        # 启动独立窗口模式：无地址栏、无标签页、原生窗口尺寸
        cmd = [
            edge,
            f"--app={url}",
            f"--user-data-dir={app_profile}",
            "--window-size=1220,860",
            "--window-position=100,100",
            "--disable-extensions",
            "--disable-plugins",
            "--app-launch-url-for-shortcuts-menu-item=false",
            "--no-first-run",
        ]
        try:
            # 隐藏 CMD 窗口
            creation_flags = 0
            if sys.platform == "win32":
                creation_flags = subprocess.CREATE_NO_WINDOW
            proc = subprocess.Popen(cmd, creationflags=creation_flags)
            proc.wait()  # 等待游戏窗口关闭
        except Exception:
            import webbrowser
            webbrowser.open(url)
    else:
        import webbrowser
        webbrowser.open(url)
        time.sleep(2)

    if httpd:
        try:
            httpd.shutdown()
        except Exception:
            pass


if __name__ == "__main__":
    main()
