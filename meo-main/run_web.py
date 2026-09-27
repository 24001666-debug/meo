import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path


WEB_DIR = Path(__file__).resolve().parent
WEB_APP = WEB_DIR / "web_app.py"
URL = "http://127.0.0.1:8000"


def open_browser():
    time.sleep(1)
    webbrowser.open(URL)


def main():
    server = subprocess.Popen([sys.executable, str(WEB_APP)], cwd=WEB_DIR)
    threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.wait()
    except KeyboardInterrupt:
        server.terminate()
        server.wait()


if __name__ == "__main__":
    main()