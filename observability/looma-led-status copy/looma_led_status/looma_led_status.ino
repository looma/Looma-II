// Looma stack status panel — ESP8266 (NodeMCU) + 7-segment display + RGB strip
// =========================================================================
//
// Polls ../status_server.py over WiFi every POLL_INTERVAL_MS and cycles
// through 5 signals on a single 7-segment digit, one at a time, colouring
// a plain analog RGB strip (green/yellow/red) to match the signal shown:
//
//   O  Looma OpenSearch cluster health
//   H  looma.website reachability
//   U  looma-vector container state
//   d  Size of looma_* Docker volumes
//   P  looma-prometheus health
//
// Board: FQBN esp8266:esp8266:nodemcuv2 ("NodeMCU 1.0 (ESP-12E Module)").
// esptool identified the chip on /dev/ttyUSB0 as an ESP8266, not an ESP32 —
// despite the "NodeMCU-32S" name on the box, this is a classic ESP8266
// NodeMCU board, which is exactly why its silkscreen has D0-D8/A0/SD1/SD2
// (that labelling is the ESP8266 NodeMCU standard, not ESP32's). The D0-D8
// macros below come straight from this core's own pins_arduino.h, so they
// match the board's silkscreen.
//
// GPIO budget: the ESP8266 NodeMCU only exposes 9 usable digital pins
// (D0-D8) in total. 7 segments + a decimal point + a 3-wire RGB strip would
// need 11 — too many. This design drops two things to fit exactly 9:
//   - No decimal point / "poll alive" LED (there's no free pin for it, and
//     the board's own A0 is analog-input-only on ESP8266 — it cannot drive
//     an LED segment at all, unlike ESP32's A0).
//   - No Blue channel on the strip: only green/yellow/red are ever shown,
//     and yellow = red+green, so Blue is never driven — its wire is simply
//     left disconnected.
//
// Wiring (see ../README.md for the full writeup / why):
//   7-segment (common cathode, both COM pins -> GND):
//     A->D7  B->D8  C->D5  D->D3  E->D4  F->D6  G->D0
//     (put a 220-330 ohm resistor in series on every segment pin)
//     NOT the display's own pin 5 (DP) or pin 10 (would-be G on A0) — A0 is
//     analog-input-only on ESP8266 and cannot drive a segment; DP is unused.
//   RGB strip (plain 4-wire analog strip, NOT addressable; Blue unused/not wired):
//     R->D1  G->D2
//     Strip 5V -> the ESP8266's own 5V/VIN pin or an external supply —
//     NEVER a GPIO pin, it can't source the current a strip needs.
//
// D3, D4 and D8 (GPIO0/2/15) are boot-strapping pins (must read a specific
// level at power-on) — a plain resistor+LED/MOSFET-gate load has never been
// an issue in practice on these, but if you ever see boot trouble, that's
// the first thing to suspect (there's no spare pin to move them to without
// dropping another segment).
//
// No external libraries needed: ESP8266WiFi.h and ESP8266HTTPClient.h ship
// with the ESP8266 Arduino core.
//
// Copy secrets.h.example -> secrets.h (same folder) and fill in your
// WiFi + status_server.py host before building.

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include "secrets.h"

// ---------------------------------------------------------------------- //
// Config
// ---------------------------------------------------------------------- //
const unsigned long POLL_INTERVAL_MS   = 10000;  // how often to fetch /status
const unsigned long DISPLAY_STEP_MS    = 2000;   // how long each signal is shown
const unsigned long HTTP_TIMEOUT_MS    = 4000;
const unsigned long WIFI_RETRY_MS      = 5000;

// 7-segment pins (see wiring table above)
const int PIN_SEG_A  = D7;
const int PIN_SEG_B  = D8;
const int PIN_SEG_C  = D5;
const int PIN_SEG_D  = D3;
const int PIN_SEG_E  = D4;
const int PIN_SEG_F  = D6;
const int PIN_SEG_G  = D0;

// RGB strip pins (digital on/off — only green/yellow/red are ever shown;
// Blue is never driven, so it has no pin and its wire stays disconnected)
// Physically the strip's R/G wires ended up swapped on the header, so the
// logical-to-physical mapping is swapped here to compensate (cheaper than
// re-wiring): PIN_R drives the wire that is physically the strip's Green
// input, and vice versa.
const int PIN_R = D2;
const int PIN_G = D1;

// ---------------------------------------------------------------------- //
// 7-segment character table (common cathode: HIGH = segment on)
// ---------------------------------------------------------------------- //
struct Segments { bool a, b, c, d, e, f, g; };

const Segments SEG_O  = {true,  true,  true,  true,  true,  true,  false};
const Segments SEG_H  = {false, true,  true,  false, true,  true,  true};
const Segments SEG_U  = {false, true,  true,  true,  true,  true,  false};
const Segments SEG_d  = {false, true,  true,  true,  true,  false, true};  // lowercase "d"
const Segments SEG_P  = {true,  true,  false, false, true,  true,  true};
const Segments SEG_DASH = {false, false, false, false, false, false, true}; // "no data"

void showDigit(const Segments &s) {
  digitalWrite(PIN_SEG_A, s.a);
  digitalWrite(PIN_SEG_B, s.b);
  digitalWrite(PIN_SEG_C, s.c);
  digitalWrite(PIN_SEG_D, s.d);
  digitalWrite(PIN_SEG_E, s.e);
  digitalWrite(PIN_SEG_F, s.f);
  digitalWrite(PIN_SEG_G, s.g);
}

// Driving R and G at the same time starves both (this module shares one
// resistor on the common wire, so simultaneous draw drops the voltage below
// both LEDs' threshold and they go dark instead of blending to yellow). The
// fix is alternating them fast enough that the eye can't see the flicker —
// a few milliseconds per phase reads as solid amber, unlike a slow blink.
const unsigned long BLINK_INTERVAL_MS = 4;

void updateStripColor(const String &color) {
  if (color == "green") {
    digitalWrite(PIN_R, LOW);
    digitalWrite(PIN_G, HIGH);
  } else if (color == "red") {
    digitalWrite(PIN_R, HIGH);
    digitalWrite(PIN_G, LOW);
  } else { // "yellow" (or anything unexpected) -> fast red/green alternation
    bool phase = (millis() / BLINK_INTERVAL_MS) % 2 == 0;
    digitalWrite(PIN_R, phase);
    digitalWrite(PIN_G, !phase);
  }
}

// ---------------------------------------------------------------------- //
// Status data — order matches the display cycle
// ---------------------------------------------------------------------- //
const char CODES[5] = {'O', 'H', 'U', 'd', 'P'};
const Segments *DIGITS[5] = {&SEG_O, &SEG_H, &SEG_U, &SEG_d, &SEG_P};
String currentColor[5] = {"yellow", "yellow", "yellow", "yellow", "yellow"};
bool lastPollOk = false;
String activeColor = "yellow";  // colour of whichever item is on screen right now

// ---------------------------------------------------------------------- //
// Networking
// ---------------------------------------------------------------------- //
void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("WiFi: connecting to %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_RETRY_MS) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi: connected, IP=%s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("WiFi: still not connected, will retry");
  }
}

// Extracts the value of "color" for the entry whose "code" is `code`,
// e.g. {"code": "O", "label": "opensearch", "color": "green", ...}
// Hand-rolled on purpose: the payload shape is small and fixed, so this
// avoids pulling in ArduinoJson just for five lookups.
String extractColorForCode(const String &json, char code) {
  String needle = String("\"code\": \"") + code + "\"";
  int idx = json.indexOf(needle);
  if (idx < 0) return "";
  int colorKey = json.indexOf("\"color\": \"", idx);
  if (colorKey < 0) return "";
  int start = colorKey + 10; // strlen("\"color\": \"")
  int end = json.indexOf("\"", start);
  if (end < 0) return "";
  return json.substring(start, end);
}

bool pollStatus() {
  if (WiFi.status() != WL_CONNECTED) return false;
  WiFiClient client;
  HTTPClient http;
  String url = String("http://") + STATUS_HOST + ":" + STATUS_PORT + STATUS_PATH;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(client, url);
  int code = http.GET();
  if (code != 200) {
    Serial.printf("status poll: HTTP %d\n", code);
    http.end();
    return false;
  }
  String body = http.getString();
  http.end();

  bool ok = true;
  for (int i = 0; i < 5; i++) {
    String c = extractColorForCode(body, CODES[i]);
    if (c.length() == 0) {
      ok = false;
      continue;
    }
    currentColor[i] = c;
  }
  return ok;
}

// ---------------------------------------------------------------------- //
// Arduino entry points
// ---------------------------------------------------------------------- //
void setup() {
  Serial.begin(115200);
  int segPins[] = {PIN_SEG_A, PIN_SEG_B, PIN_SEG_C, PIN_SEG_D, PIN_SEG_E, PIN_SEG_F, PIN_SEG_G};
  for (int p : segPins) pinMode(p, OUTPUT);
  pinMode(PIN_R, OUTPUT);
  pinMode(PIN_G, OUTPUT);
  showDigit(SEG_DASH);
  ensureWifi();
}

void loop() {
  static unsigned long lastPoll = 0;
  static unsigned long lastStep = 0;
  static int stepIndex = 0;

  ensureWifi();

  unsigned long now = millis();
  if (now - lastPoll >= POLL_INTERVAL_MS || lastPoll == 0) {
    lastPollOk = pollStatus();
    lastPoll = now;
  }

  if (now - lastStep >= DISPLAY_STEP_MS || lastStep == 0) {
    if (lastPollOk) {
      showDigit(*DIGITS[stepIndex]);
      activeColor = currentColor[stepIndex];
      stepIndex = (stepIndex + 1) % 5;
    } else {
      showDigit(SEG_DASH);
      activeColor = "yellow";
    }
    lastStep = now;
  }

  updateStripColor(activeColor);
}
