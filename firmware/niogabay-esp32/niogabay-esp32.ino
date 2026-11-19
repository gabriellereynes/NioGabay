#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "secrets.h"

// nagana ba

#define LED 2

const unsigned long SEND_INTERVAL_MS = 30000;
const uint16_t HTTP_TIMEOUT_MS = 60000; // Render can take ~1 min to wake
unsigned long lastSend = 0;

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED, !digitalRead(LED)); // slow blink while connecting
    delay(500);
    Serial.print(".");
  }
  digitalWrite(LED, LOW);
  Serial.println();
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());
}

// returns the HTTP status code, or a negative number if the request failed
int sendReading(float distanceCm) {
  String url = SERVER_URL;
  HTTPClient http;
  WiFiClient plainClient;
  WiFiClientSecure secureClient;
  bool started;

  if (url.startsWith("https://")) {
    secureClient.setInsecure(); // TODO: validate the real certificate before the real install
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

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  if (millis() - lastSend >= SEND_INTERVAL_MS || lastSend == 0) {
    lastSend = millis();
    int code = sendReading(188.4);
    Serial.print("HTTP status: ");
    Serial.println(code);
    if (code == 201) {
      digitalWrite(LED, HIGH);
      delay(150);
      digitalWrite(LED, LOW);
    }
  }
}