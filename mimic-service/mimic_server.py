#!/usr/bin/env python3
import json
import os
import re
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse


VOICE_DIR = os.environ.get("LOOMA_MIMIC_VOICE_DIR", "/usr/share/mimic-voices")
MIMIC_BIN = os.environ.get("LOOMA_MIMIC_BIN", "/usr/local/bin/mimic")
VOICE_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


class MimicHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(fmt % args, flush=True)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlparse(self.path).path == "/health":
            available = os.path.isfile(MIMIC_BIN) and os.access(MIMIC_BIN, os.X_OK)
            self.send_json(200 if available else 503, {"ok": available, "mimic": MIMIC_BIN})
            return
        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if urlparse(self.path).path != "/tts":
            self.send_json(404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except Exception:
            self.send_json(400, {"error": "Invalid JSON"})
            return

        text = str(payload.get("text", "")).strip()
        voice = str(payload.get("voice", "cmu_us_axb")).strip()
        try:
            rate = float(payload.get("rate", 2 / 3))
        except Exception:
            rate = 2 / 3

        if not text:
            self.send_json(400, {"error": "Missing text"})
            return
        if not VOICE_RE.match(voice):
            self.send_json(400, {"error": "Invalid voice"})
            return
        if rate <= 0 or rate > 2:
            rate = 2 / 3

        voice_file = os.path.join(VOICE_DIR, voice + ".flitevox")
        if not os.path.isfile(voice_file):
            self.send_json(404, {"error": "Voice not found", "voice": voice})
            return

        fd, wav_path = tempfile.mkstemp(prefix="looma_mimic_", suffix=".wav")
        os.close(fd)

        try:
            cmd = [
                MIMIC_BIN,
                "-t", text,
                "--setf", "duration_stretch=" + str(1 / rate),
                "-voice", voice_file,
                "-o", wav_path,
            ]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=120)
            if result.returncode != 0 or not os.path.isfile(wav_path) or os.path.getsize(wav_path) <= 44:
                self.send_json(500, {"error": "Mimic synthesis failed", "details": result.stdout})
                return

            with open(wav_path, "rb") as wav_file:
                body = wav_file.read()

            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        finally:
            try:
                os.unlink(wav_path)
            except OSError:
                pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5003"))
    server = ThreadingHTTPServer(("0.0.0.0", port), MimicHandler)
    print("Mimic TTS server listening on port %d" % port, flush=True)
    server.serve_forever()
