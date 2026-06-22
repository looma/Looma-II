# Piper Installation and Startup Documentation for Looma

Documentation date: 2026-04-19

This document explains how Piper is installed in the Looma project and which steps/commands are needed to run it automatically when the machine boots.

The information below was confirmed on the current machine. Some commands are included as reproducible setup steps for reinstalling or configuring Piper again on a similar system.

## Goal

Piper is the main/default TTS engine used by Looma. Instead of calling the Piper binary directly for every request, Looma uses a small Python/Flask HTTP server:

```bash
/var/www/html/piper/piper_http_server.py
```

That server keeps Piper workers warm and exposes HTTP endpoints such as:

```text
/tts
/speak-local
/stop-local
/playback-status
/health
```

The service is started automatically by systemd through:

```bash
/etc/systemd/system/piper.service
```

## Installed Structure

### Main Piper Directory

```bash
/var/www/html/piper
```

Confirmed key files:

```bash
/var/www/html/piper/piper
/var/www/html/piper/piper_http_server.py
/var/www/html/piper/piper.service
/var/www/html/piper/looma-piper.service
/var/www/html/piper/start-piper-server.sh
/var/www/html/piper/piper_phonemize
/var/www/html/piper/espeak-ng-data
/var/www/html/piper/libonnxruntime.so.1.14.1
/var/www/html/piper/libpiper_phonemize.so.1.2.0
/var/www/html/piper/libespeak-ng.so.1.52.0.1
```

### Installed Voice Models

The models are stored in:

```bash
/var/www/html/piper/models
```

Confirmed models:

```bash
/var/www/html/piper/models/en_US-amy-low.onnx
/var/www/html/piper/models/en_US-amy-low.onnx.json
/var/www/html/piper/models/ne_NP-google-x_low.onnx
/var/www/html/piper/models/ne_NP-google-x_low.onnx.json
```

### Python Environment

The service uses Looma's Python environment:

```bash
/var/www/html/looma-env/bin/python
```

Confirmed Python packages in that environment:

```text
Flask 3.0.3
Flask-Cors 5.0.0
```

Command used to verify:

```bash
/var/www/html/looma-env/bin/python -m pip show flask flask-cors
```

## Installation and Configuration Steps

### 1. Create or Confirm the Piper Directory

```bash
mkdir -p /var/www/html/piper
```

The directory should contain the `piper` binary, required libraries, `espeak-ng-data`, `piper_phonemize`, and the Python HTTP server `piper_http_server.py`.

Verify:

```bash
ls -l /var/www/html/piper
```

### 2. Ensure the Piper Binaries Are Executable

The binaries must be executable:

```bash
chmod +x /var/www/html/piper/piper
chmod +x /var/www/html/piper/piper_phonemize
```

Verify:

```bash
ls -l /var/www/html/piper/piper /var/www/html/piper/piper_phonemize
```

### 3. Install or Copy the Voice Models

Create the models directory:

```bash
mkdir -p /var/www/html/piper/models
```

Copy the `.onnx` models and their matching `.onnx.json` files into:

```bash
/var/www/html/piper/models
```

This installation currently includes:

```bash
en_US-amy-low.onnx
ne_NP-google-x_low.onnx
```

Verify:

```bash
ls -l /var/www/html/piper/models
```

### 4. Ensure the Looma Python Environment Exists

The service expects this Python executable:

```bash
/var/www/html/looma-env/bin/python
```

Verify:

```bash
ls -l /var/www/html/looma-env/bin/python
```

### 5. Install Python Dependencies

Install Flask and Flask-Cors in the Python environment used by Looma:

```bash
/var/www/html/looma-env/bin/python -m pip install Flask Flask-Cors
```

Verify:

```bash
/var/www/html/looma-env/bin/python -m pip show flask flask-cors
```

### 6. Test the Piper Server Manually

Before configuring automatic startup, test the server manually:

```bash
cd /var/www/html
/var/www/html/looma-env/bin/python /var/www/html/piper/piper_http_server.py
```

The server should start on:

```text
127.0.0.1:5002
```

Health check from another terminal:

```bash
curl http://127.0.0.1:5002/health
```

TTS test:

```bash
curl -X POST http://127.0.0.1:5002/tts   -H 'Content-Type: application/json'   -d '{"text":"Hello from Piper","language":"en"}'   --output /tmp/piper-test.wav
```

Verify that the WAV file was created:

```bash
ls -l /tmp/piper-test.wav
```

### 7. Optional Manual Startup Script

There is a manual startup script at:

```bash
/var/www/html/piper/start-piper-server.sh
```

Confirmed content:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /var/www/html
exec /var/www/html/looma-env/bin/python /var/www/html/piper/piper_http_server.py
```

Recommended permission:

```bash
chmod +x /var/www/html/piper/start-piper-server.sh
```

Note: the active systemd service on this machine does not use this script; it calls Python and `piper_http_server.py` directly.

## Automatic Startup with systemd

### 1. Active Service File

The active service file is:

```bash
/etc/systemd/system/piper.service
```

Confirmed content:

```ini
[Unit]
Description=Looma Piper TTS Server

[Service]
Type=simple
User=odroid
WorkingDirectory=/var/www/html
Environment=PYTHONUNBUFFERED=1
PermissionsStartOnly=true
ExecStartPre=/bin/sh -c 'for f in /sys/devices/system/cpu/cpu*/cpufreq/scaling_max_freq; do echo 1900000 > "$f"; done'
ExecStart=/var/www/html/looma-env/bin/python /var/www/html/piper/piper_http_server.py
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

### 2. Create or Update the Service File

The project also keeps a copy at:

```bash
/var/www/html/piper/piper.service
```

To install that copy into systemd:

```bash
sudo install -m 644 /var/www/html/piper/piper.service /etc/systemd/system/piper.service
```

To edit manually if needed:

```bash
sudo nano /etc/systemd/system/piper.service
```

### 3. Reload systemd

After creating or changing the `.service` file:

```bash
sudo systemctl daemon-reload
```

### 4. Enable the Service at Boot

```bash
sudo systemctl enable piper.service
```

This creates the boot symlink:

```bash
/etc/systemd/system/multi-user.target.wants/piper.service -> /etc/systemd/system/piper.service
```

Verify:

```bash
ls -l /etc/systemd/system/multi-user.target.wants/piper.service
systemctl is-enabled piper.service
```

Expected result:

```text
enabled
```

### 5. Start the Service

```bash
sudo systemctl start piper.service
```

### 6. Check Whether It Is Running

```bash
systemctl is-active piper.service
```

Expected result:

```text
active
```

Show service details:

```bash
systemctl status piper.service --no-pager
```

Show the service file currently used by systemd:

```bash
systemctl cat piper.service
```

### 7. Restart the Service After Changes

Whenever `piper_http_server.py` or the systemd service changes:

```bash
sudo systemctl restart piper.service
```

If the `.service` file changed:

```bash
sudo systemctl daemon-reload
sudo systemctl restart piper.service
```

### 8. View Logs

```bash
journalctl -u piper.service -n 100 --no-pager
```

Follow logs in real time:

```bash
journalctl -u piper.service -f
```

## Looma Integration

The Looma backend uses the local Piper endpoint:

```bash
http://127.0.0.1:5002/tts
```

The PHP file that forwards TTS requests to Piper is:

```bash
/var/www/html/Looma/looma-TTS.php
```

In that file, Piper remains the main/default engine. Mimic is only used when the request explicitly includes:

```text
engine=mimic
```

## Useful Diagnostic Commands

Check the service:

```bash
systemctl is-enabled piper.service
systemctl is-active piper.service
systemctl cat piper.service
```

Test the health endpoint:

```bash
curl http://127.0.0.1:5002/health
```

Test audio generation:

```bash
curl -X POST http://127.0.0.1:5002/tts   -H 'Content-Type: application/json'   -d '{"text":"Testing Piper","language":"en"}'   --output /tmp/piper-test.wav
```

Validate the Python server syntax:

```bash
/var/www/html/looma-env/bin/python -m py_compile /var/www/html/piper/piper_http_server.py
```

Check models:

```bash
ls -l /var/www/html/piper/models
```

Check Python dependencies:

```bash
/var/www/html/looma-env/bin/python -m pip show flask flask-cors
```

## Confirmed State on This Machine

At the time of documentation, this was confirmed:

```text
piper.service: enabled
piper.service: active
```

The active service runs:

```bash
/var/www/html/looma-env/bin/python /var/www/html/piper/piper_http_server.py
```

The active startup file is:

```bash
/etc/systemd/system/piper.service
```

The project copy of the service file is:

```bash
/var/www/html/piper/piper.service
```

## Notes

- Piper is the main/default TTS engine for Looma.
- The service runs as user `odroid`.
- The Piper HTTP server listens locally on `127.0.0.1:5002`.
- The service restarts automatically on failure because of `Restart=on-failure`.
- `ExecStartPre` tries to set the CPU maximum frequency to `1900000` before starting Piper.
- If the service fails to start, check `journalctl -u piper.service -n 100 --no-pager` first.
