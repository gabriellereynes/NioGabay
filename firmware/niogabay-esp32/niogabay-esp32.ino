#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "secrets.h"


// testcomentttt

#define LED 2

// ---- timing ----
const unsigned long SEND_INTERVAL_MS  = 30000;   // normal cycle
const unsigned long MOUNT_RETRY_MS    = 300000;  // after a 409: 5 minutes
const unsigned long FAIL_LIMIT_MS     = 600000;  // 10 minutes of failures -> recover
const unsigned long WIFI_TIMEOUT_MS   = 20000;   // give up one connect attempt after 20 s
const uint16_t      HTTP_TIMEOUT_MS   = 60000;   // Render can take ~1 min to wake

// ---- state ----
unsigned long lastAttempt = 0;
unsigned long sendInterval = 0;      // 0 so the first reading goes out right away
bool firstCycle = true;
bool keyRejected = false;            // set by a 401, stops all sending
bool failing = false;                // inside a streak of connection failures
unsigned long failStart = 0;

// ---------- LED helpers ----------
void flashLed(int ms) {
  digitalWrite(LED, HIGH);
  delay(ms);
  digitalWrite(LED, LOW);
}

// ---------- Wi-Fi ----------
// returns true if connected, false if it timed out
bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - started >= WIFI_TIMEOUT_MS) {
      Serial.println();
      Serial.println("Wi-Fi connect timed out");
      digitalWrite(LED, LOW);
      return false;
    }
    digitalWrite(LED, !digitalRead(LED));  // slow blink while connecting
    delay(500);
    Serial.print(".");
  }
  digitalWrite(LED, LOW);
  Serial.println();
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());
  return true;
}

// ---------- failure streak ----------
void clearFailure() {
  failing = false;
}

void recoverNetwork() {
  Serial.println("10 minutes of failures: reconnecting Wi-Fi, then restarting");
  WiFi.disconnect(true);
  delay(1000);
  connectWiFi();
  Serial.println("Restarting now");
  delay(500);
  ESP.restart();
}

void markFailure() {
  if (!failing) {
    failing = true;
    failStart = millis();
    return;
  }
  if (millis() - failStart >= FAIL_LIMIT_MS) {
    recoverNetwork();
  }
}

// ---------- sensor (placeholder until A5) ----------
// returns distance in cm, or -1 if there is no valid reading
float readDistanceCm() {
  return 188.4;   // TODO A5: replace with the real JSN-SR04T median reading
}

// ---------- sending ----------
// returns the HTTP status code, or a negative number if the request failed
int sendReading(float distanceCm) {
  String url = SERVER_URL;
  HTTPClient http;
  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  bool started;

  if (url.startsWith("https://")) {
    secureClient.setInsecure();  // TODO: validate the real certificate before the real install
    started = http.begin(secureClient, url);
  } else {
    started = http.begin(plainClient, url);
  }
  if (!started) return -1;

  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);

  String body = "{\"distance_cm\":" + String(distanceCm, 1) + "}";
  int code = http.POST(body);
  if (code > 0) {
    Serial.println(http.getString());
  } else {
    Serial.println(http.errorToString(code));
  }
  http.end();
  return code;
}

// ---------- decide what each answer means ----------
void handleResult(int code) {
  Serial.print("HTTP status: ");
  Serial.println(code);

  if (code == 201) {
    clearFailure();
    sendInterval = SEND_INTERVAL_MS;
    flashLed(150);
  } else if (code == 400) {
    clearFailure();                     // server answered, so the network is fine
    sendInterval = SEND_INTERVAL_MS;    // do not retry this reading
    Serial.println("400: reading rejected, not retrying it");
  } else if (code == 401) {
    keyRejected = true;
    Serial.println("401: bad key or sensor switched off. Sending stopped. Check API_KEY, then reboot.");
  } else if (code == 409) {
    clearFailure();
    sendInterval = MOUNT_RETRY_MS;
    Serial.println("409: mount height not set in the database. Retrying in 5 minutes.");
  } else {
    // 500, other codes, or negative (-1 refused, -11 timeout, ...)
    sendInterval = SEND_INTERVAL_MS;
    Serial.println("Send failed: reading lost, trying again next cycle");
    markFailure();
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
  connectWiFi();   // if this times out, loop() keeps trying
}

void loop() {
  // 401: stop everything and blink fast
  if (keyRejected) {
    digitalWrite(LED, !digitalRead(LED));
    delay(100);
    return;
  }

  // no Wi-Fi: try to reconnect, count it as a failure
  if (WiFi.status() != WL_CONNECTED) {
    markFailure();
    connectWiFi();
    return;
  }

  // time for the next attempt?
  if (firstCycle || millis() - lastAttempt >= sendInterval) {
    firstCycle = false;
    lastAttempt = millis();

    float distance = readDistanceCm();
    if (distance < 0) {
      Serial.println("No valid reading, nothing sent");
      sendInterval = SEND_INTERVAL_MS;
      return;
    }
    int code = sendReading(distance);
    handleResult(code);
  }
}