#include <Arduino.h>

#define TRIG_PIN 5
#define ECHO_PIN 18

// Returns distance in cm, or -1 if no echo came back (timeout)
float readOnce() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(5);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(20);              // trigger pulse, at least 20 us
  digitalWrite(TRIG_PIN, LOW);

  unsigned long us = pulseIn(ECHO_PIN, HIGH, 40000);  // timeout 40 ms (~680 cm)
  if (us == 0) return -1;
  return us * 0.034 / 2.0;
} // 0.0349 value adjust based on room temp

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);
  Serial.println("JSN-SR04T distance test");
}

void loop() {
  float d = readOnce();
  if (d < 0) {
    Serial.println("no echo (timeout)");
  } else {
    Serial.print("distance_cm: ");
    Serial.println(d, 1);
  }
  delay(200);   // never faster than 60 ms between readings
}
