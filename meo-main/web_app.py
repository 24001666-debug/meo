import json
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


WEB_DIR = Path(__file__).resolve().parent
SD_DIR = WEB_DIR.parents[1] / "Diffusionmodel" / "sd"
sys.path.insert(0, str(SD_DIR))

from generation import generate_image


class WebHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def do_POST(self):
        if self.path != "/api/generate":
            self.send_error(404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length))
            prompt = str(payload.get("prompt", "")).strip()
            if not prompt:
                self.send_json(400, {"error": "Prompt is required."})
                return
            steps = int(payload.get("steps", 3))
            if not 1 <= steps <= 100:
                self.send_json(400, {"error": "Steps must be between 1 and 100."})
                return

            started_at = time.perf_counter()
            result = generate_image(prompt, num_inference_steps=steps)
            result["elapsed_seconds"] = round(time.perf_counter() - started_at, 2)
            result["image"] = "/Sample/latest_output.png?t=" + str(time.time_ns())
            self.send_json(200, result)
        except Exception as error:
            self.send_json(500, {"error": str(error)})

    def send_json(self, status, payload):
        response = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(response)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8000), WebHandler)
    print("Local GenAI web app running at http://localhost:8000")
    server.serve_forever()
