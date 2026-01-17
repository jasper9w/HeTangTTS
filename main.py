import os
import sys
import webview
from pathlib import Path
from loguru import logger

from backend.api import Api

# 配置日志
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add(
    LOG_DIR / "app_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="7 days",
    level="DEBUG",
    encoding="utf-8"
)


def get_web_url() -> str:
    """获取前端页面URL"""
    dev_mode = os.environ.get("DEV", "0") == "1"

    if dev_mode:
        return "http://localhost:5273"
    else:
        web_dir = Path(__file__).parent / "web"
        if not web_dir.exists():
            logger.error(f"Web directory not found: {web_dir}")
            raise FileNotFoundError(f"Web directory not found: {web_dir}")
        return str(web_dir / "index.html")


def main():
    """主入口"""
    logger.info("Starting Audio Analyzer application")

    dev_mode = os.environ.get("DEV", "0") == "1"
    logger.info(f"Running in {'development' if dev_mode else 'production'} mode")

    api = Api()

    web_url = get_web_url()
    logger.info(f"Loading web from: {web_url}")

    window = webview.create_window(
        title="Audio Analyzer",
        url=web_url,
        width=1200,
        height=800,
        min_size=(800, 600),
        js_api=api
    )

    # 设置 window 引用用于 evaluate_js
    api.set_window(window)

    webview.start(debug=dev_mode, gui="qt")


if __name__ == "__main__":
    main()
