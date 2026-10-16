#!/usr/bin/env python3
"""
单词肉鸽 · 100% 纯本地离线桌面客户端 (PyQt6)
- 零网络依赖：无需启动任何本地 HTTP 服务或端口 (彻底告别 127.0.0.1:8765)
- 免受代理干扰：即便在公司内网、企业专网或开启全局 VPN/代理的情况下也能秒开运行
- 完全脱离外部浏览器：直接通过内嵌 Qt 引擎加载本地磁盘文件
"""
import os
import sys

# 必须在初始化 QApplication 之前注入 Chromium 离线与跨域参数
sys.argv.extend([
    "--disable-web-security",          # 允许从本地读取 data/*.json 词库
    "--allow-file-access-from-files",   # 允许本地文件相互引用
    "--no-proxy-server",               # 禁用任何系统/公司网络代理，杜绝内网拦截
    "--disable-features=IsolateOrigins,site-per-process",
])

from PyQt6.QtCore import QUrl
from PyQt6.QtGui import QIcon
from PyQt6.QtWebEngineCore import QWebEngineProfile, QWebEngineSettings
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWidgets import QApplication, QMainWindow

if getattr(sys, "frozen", False):
    ROOT = os.path.dirname(sys.executable)
else:
    ROOT = os.path.dirname(os.path.abspath(__file__))


class MainWindow(QMainWindow):
    def __init__(self, html_path):
        super().__init__()
        self.setWindowTitle("单词肉鸽 · 热血拼写 (LexiRogue)")
        self.resize(1220, 860)

        # 尝试设置应用图标
        icon_path = os.path.join(ROOT, "favicon.ico")
        if os.path.isfile(icon_path):
            self.setWindowIcon(QIcon(icon_path))

        # 配置专属本地持久化存储（保存最高分、学识币与天赋）
        storage_dir = os.path.join(ROOT, ".app_storage")
        os.makedirs(storage_dir, exist_ok=True)
        profile = QWebEngineProfile.defaultProfile()
        profile.setPersistentStoragePath(storage_dir)

        # 初始化 Web 视图并开启本地文件权限
        self.view = QWebEngineView(self)
        settings = self.view.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)

        # 核心：直接加载磁盘本地文件，绝不经过 127.0.0.1 网络层
        self.view.load(QUrl.fromLocalFile(html_path))
        self.setCentralWidget(self.view)


def main():
    os.chdir(ROOT)
    html_path = os.path.join(ROOT, "index.html")
    if not os.path.isfile(html_path):
        print(f"错误: 找不到核心游戏文件: {html_path}")
        return

    app = QApplication(sys.argv)
    app.setApplicationName("单词肉鸽")

    window = MainWindow(html_path)

    # 居中显示窗口
    screen = app.primaryScreen()
    if screen:
        geo = screen.geometry()
        x = (geo.width() - 1220) // 2
        y = (geo.height() - 860) // 2
        window.move(max(0, x), max(0, y))

    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
