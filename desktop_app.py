#!/usr/bin/env python3
"""单词肉鸽 · 原生桌面客户端 (PyQt6 独立窗口运行，不依赖外部浏览器)"""
import http.server
import os
import socketserver
import sys
import threading

if getattr(sys, "frozen", False):
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
        pass


def start_local_server():
    try:
        httpd = socketserver.TCPServer(("127.0.0.1", PORT), QuietHandler)
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        return httpd
    except OSError:
        return None  # 端口已占用说明已有实例运行


def main():
    os.chdir(ROOT)
    httpd = start_local_server()

    # 尝试使用 PyQt6 内嵌引擎（纯原生桌面程序，零浏览器依赖）
    try:
        from PyQt6.QtCore import QUrl
        from PyQt6.QtWebEngineWidgets import QWebEngineView
        from PyQt6.QtWidgets import QApplication, QMainWindow

        # 解决部分高分屏缩放
        app = QApplication(sys.argv)
        app.setApplicationName("单词肉鸽")

        window = QMainWindow()
        window.setWindowTitle("单词肉鸽 · 热血拼写 (LexiRogue)")
        window.resize(1220, 860)

        # 居中显示
        screen = app.primaryScreen()
        if screen:
            geo = screen.geometry()
            x = (geo.width() - 1220) // 2
            y = (geo.height() - 860) // 2
            window.move(max(0, x), max(0, y))

        view = QWebEngineView(window)
        view.setUrl(QUrl(f"http://127.0.0.1:{PORT}/"))
        window.setCentralWidget(view)

        window.show()
        sys.exit(app.exec())

    except ImportError:
        # 降级：如果未安装 PyQt6 则使用原生窗口模式
        import subprocess

        edge = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        if os.path.isfile(edge):
            cmd = [
                edge,
                f"--app=http://127.0.0.1:{PORT}/",
                f"--user-data-dir={os.path.join(ROOT, '.app_profile')}",
                "--window-size=1220,860",
            ]
            flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            proc = subprocess.Popen(cmd, creationflags=flags)
            proc.wait()
        else:
            import webbrowser

            webbrowser.open(f"http://127.0.0.1:{PORT}/")


if __name__ == "__main__":
    main()
