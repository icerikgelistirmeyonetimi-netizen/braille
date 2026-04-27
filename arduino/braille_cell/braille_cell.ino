/*
 * Braille Eğitim Cihazı — 6 noktalı fiziksel hücre kontrolcüsü
 * --------------------------------------------------------------
 * Bu Arduino sketch'i, "Braille Eğitim" web/Android uygulamasından
 * gelen desen komutlarını dinler ve 6 noktayı (servo veya solenoid ile)
 * yukarı/aşağı kaldırır. Öğrenci ekranda gösterilen harfi cihaz
 * üzerinde dokunarak öğrenebilir.
 *
 * PROTOKOL (uygulamadan gelen komutlar, satır sonu '\n'):
 *   "P:HH"   HH = 2 haneli onaltılık bitmaske
 *            bit0=nokta1 ... bit5=nokta6
 *            Ör: A harfi (sadece nokta 1)        -> "P:01"
 *                L harfi (nokta 1,2,3)            -> "P:07"
 *                Tüm noktaları indir              -> "P:00"
 *   "PING"   Cevap: "PONG"
 *
 * CİHAZ -> UYGULAMA (opsiyonel):
 *   "OK"    Komut alındı
 *   "BTN"   Cihaz üzerindeki onay düğmesine basıldı
 *
 * DONANIM (varsayılan kurulum, Arduino UNO):
 *   - 6 adet SG90 servo (D2..D7 pinleri)
 *   - Her servo, ilgili braille noktasının altındaki kaldıracı yukarı/aşağı çevirir.
 *   - 5V'lik harici güç önerilir (USB tek başına 6 servoyu zorlayabilir).
 *   - GND'ler ortak olmalıdır.
 *   - Opsiyonel: D8'e push-button (diğer ucu GND), aktif LOW.
 *
 * TELEFONLA BLUETOOTH İÇİN:
 *   HM-10 / JDY-08 (BLE) modülünü kullanın:
 *     HM-10 TX -> Arduino RX (D0)
 *     HM-10 RX -> Arduino TX (D1) (3.3V seviyeye dikkat)
 *     VCC -> 5V, GND -> GND
 *   Sketch aynen çalışır; Serial üzerinden konuşur.
 *   (HC-05 klasik Bluetooth modülü Web Bluetooth ile uyumlu DEĞİLDİR;
 *    masaüstüne USB ile bağlanmak için sorunsuzdur.)
 */

#include <Servo.h>

// ---- Ayarlar -----------------------------------------------------
const uint8_t NOKTA_PINLERI[6] = { 2, 3, 4, 5, 6, 7 };

// Her servonun "indi" (nokta gizli) ve "kalktı" (nokta hissedilebilir)
// açıları. Mekaniğe göre ayarlayın.
const uint8_t ACI_INIK   = 0;
const uint8_t ACI_KALKIK = 90;

const uint8_t DUGME_PINI = 8;     // -1 yaparsanız düğme yok kabul edilir
const uint32_t BAUD      = 9600;

// ------------------------------------------------------------------

Servo servolar[6];
uint8_t sonDesen = 0xFF;          // ilk yazımda zorla güncelle
String tampon;
unsigned long sonDugmeMs = 0;

void deseniUygula(uint8_t maske) {
  for (uint8_t i = 0; i < 6; i++) {
    bool kalkik = (maske >> i) & 0x01;
    servolar[i].write(kalkik ? ACI_KALKIK : ACI_INIK);
  }
}

void komutuIsle(const String& satir) {
  if (satir.length() == 0) return;

  if (satir == "PING") {
    Serial.println("PONG");
    return;
  }

  if (satir.startsWith("P:") && satir.length() >= 4) {
    String hh = satir.substring(2, 4);
    char* son;
    long deger = strtol(hh.c_str(), &son, 16);
    if (son != hh.c_str()) {
      uint8_t maske = (uint8_t)(deger & 0x3F);
      if (maske != sonDesen) {
        deseniUygula(maske);
        sonDesen = maske;
      }
      Serial.println("OK");
    }
    return;
  }
}

void setup() {
  Serial.begin(BAUD);
  for (uint8_t i = 0; i < 6; i++) {
    servolar[i].attach(NOKTA_PINLERI[i]);
    servolar[i].write(ACI_INIK);
  }
  sonDesen = 0x00;

  if (DUGME_PINI != 0xFF) {
    pinMode(DUGME_PINI, INPUT_PULLUP);
  }

  Serial.println("READY");
}

void loop() {
  // Seri komutları satır satır oku
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (tampon.length() > 0) {
        komutuIsle(tampon);
        tampon = "";
      }
    } else {
      if (tampon.length() < 32) tampon += c;
    }
  }

  // Onay düğmesi (debounce)
  if (DUGME_PINI != 0xFF) {
    if (digitalRead(DUGME_PINI) == LOW) {
      unsigned long simdi = millis();
      if (simdi - sonDugmeMs > 250) {
        Serial.println("BTN");
        sonDugmeMs = simdi;
      }
    }
  }
}
