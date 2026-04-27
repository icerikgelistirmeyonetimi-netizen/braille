/*
 * Braille Eğitim — ÇOKLU HÜCRE (satır) sürücü
 * --------------------------------------------------------------
 * 20 (veya istediğin kadar) braille hücresi = N×6 solenoid'i
 * 74HC595 shift register zinciri + ULN2803 darlington dizisi ile sürer.
 *
 * Uygulamadan gelen komutlar (satır sonu '\n'):
 *   "L:HHHH...HH\n"   Tam satır. Hücre başına 2 hex karakter (bitmaske).
 *                     Hücre 0 önce gelir, sonra 1, 2, ... N-1.
 *                     Eksik gelen hücreler 0x00 sayılır.
 *   "P:HH\n"          Tek hücre (hücre 0). Geriye dönük uyum.
 *   "C:i:HH\n"        i. hücreyi HH desenine ayarla (diğerleri korunur).
 *   "CLR\n"           Tüm hücreleri indir.
 *   "PING\n"          Cevap: PONG
 *   "INFO\n"          Cevap: "INFO N=20 R=120" (hücre/pin sayısı)
 *
 * Cihaz -> Uygulama (opsiyonel):
 *   "OK\n", "PONG\n", "READY\n"
 *   "BTN:NEXT\n"  Sonraki sayfa düğmesi
 *   "BTN:PREV\n"  Önceki sayfa düğmesi
 *
 * Donanım (varsayılan):
 *   D11 = MOSI -> 595 DS  (sadece ilk çip)
 *   D13 = SCK  -> 595 SHCP (tüm çiplere ortak)
 *   D10 = SS   -> 595 STCP (latch, tüm çiplere ortak)
 *   D2         -> "Sonraki" düğmesi (GND'ye, INPUT_PULLUP)
 *   D3         -> "Önceki"  düğmesi (GND'ye, INPUT_PULLUP)
 *
 *   595 zinciri Q0..Q7 -> ULN2803 IN1..IN8 -> Solenoid (-)
 *   Solenoid (+) -> Harici +5V
 *   Ortak GND zorunlu.
 *
 * Akım tasarrufu:
 *   Bir desen geldikten sonra yeni kalkanlara TAM akım verilir;
 *   TUTMA_MS sonra "tutma PWM"i devreye girer. Latching solenoid
 *   kullanıyorsan TUTMA_PWM = 0 yap.
 */

#include <SPI.h>

// ---- Ayarlar ----------------------------------------------------
const uint8_t  HUCRE_SAYISI = 20;                        // 20 karakter = 120 pin
const uint8_t  REGISTER_SAYISI = (HUCRE_SAYISI * 6 + 7) / 8; // 595 sayısı
const uint8_t  LATCH_PINI  = 10;
const uint8_t  DUGME_NEXT  = 2;
const uint8_t  DUGME_PREV  = 3;
const uint32_t BAUD        = 9600;

// Akım tasarrufu (PWM tutma) — kullanmıyorsan TUTMA_MS = 0
const uint16_t TUTMA_MS    = 80;     // tam güçle 80 ms tut
const uint8_t  TUTMA_DUTY  = 96;     // 0-255, ~%37 — solenoidi havada tutmaya yeterli
                                     // Latching solenoid için: TUTMA_DUTY = 0 yap

// ------------------------------------------------------------------

uint8_t durum[REGISTER_SAYISI];        // şu anda donanıma yazılı bitler
uint8_t hedef[REGISTER_SAYISI];        // ulaşmak istediğimiz desen
uint8_t aktivasyon[REGISTER_SAYISI];   // bu döngüde tam güçle yazılacaklar
unsigned long aktivasyonZamani = 0;
bool tutmaModu = false;

String tampon;
unsigned long sonNext = 0, sonPrev = 0;

// ---- 595'e bit yığını yaz ----
void registerYaz(const uint8_t* bytes) {
  digitalWrite(LATCH_PINI, LOW);
  // Zincirin SONUNDAKİ çipe önce yazılır; bizim hücre 0 ilk çipte.
  // Sıralamayı tersine çevirip yazıyoruz:
  for (int i = REGISTER_SAYISI - 1; i >= 0; i--) {
    SPI.transfer(bytes[i]);
  }
  digitalWrite(LATCH_PINI, HIGH);
}

// ---- Hex çevir ----
int hex2(char a, char b) {
  auto k = [](char c) -> int {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return 10 + c - 'a';
    if (c >= 'A' && c <= 'F') return 10 + c - 'A';
    return -1;
  };
  int hi = k(a), lo = k(b);
  if (hi < 0 || lo < 0) return -1;
  return (hi << 4) | lo;
}

// ---- Hücreyi N -> bit dizisine yerleştir ----
// Her hücre 6 bit; biz çipleri 8-bit kullandığımız için
// hücre i'nin 6 biti, byte (i*6/8) içinde (i*6%8) ofsetinden başlar.
void hucreYerlestir(uint8_t* bytes, uint8_t indeks, uint8_t maske6) {
  uint16_t bitOfs = indeks * 6;
  uint8_t  byteIdx = bitOfs >> 3;
  uint8_t  bitIdx  = bitOfs & 7;
  // Önce bu hücrenin 6 bitini sıfırla
  uint16_t mask = ((1u << 6) - 1u) << bitIdx;
  bytes[byteIdx]   &= ~(mask & 0xFF);
  if (bitIdx > 2 && byteIdx + 1 < REGISTER_SAYISI) {
    bytes[byteIdx + 1] &= ~((mask >> 8) & 0xFF);
  }
  // Sonra yerleştir
  uint16_t v = ((uint16_t)(maske6 & 0x3F)) << bitIdx;
  bytes[byteIdx] |= v & 0xFF;
  if (bitIdx > 2 && byteIdx + 1 < REGISTER_SAYISI) {
    bytes[byteIdx + 1] |= (v >> 8) & 0xFF;
  }
}

// Tek bir hücrenin mevcut maskesini oku
uint8_t hucreOku(const uint8_t* bytes, uint8_t indeks) {
  uint16_t bitOfs = indeks * 6;
  uint8_t  byteIdx = bitOfs >> 3;
  uint8_t  bitIdx  = bitOfs & 7;
  uint16_t v = bytes[byteIdx];
  if (byteIdx + 1 < REGISTER_SAYISI) v |= ((uint16_t)bytes[byteIdx + 1]) << 8;
  return (uint8_t)((v >> bitIdx) & 0x3F);
}

// ---- Hedef -> donanıma yaz (akım tasarrufu mantığı dahil) ----
void uygula() {
  // Yeni kalkacak bitleri bul (0->1 geçişi) -> "aktivasyon"
  for (uint8_t i = 0; i < REGISTER_SAYISI; i++) {
    aktivasyon[i] = hedef[i] & ~durum[i];
    durum[i] = hedef[i];
  }
  registerYaz(durum);
  aktivasyonZamani = millis();
  tutmaModu = false;
}

// ---- Aktivasyondan sonra tutma moduna geç ----
void tutmayaGec() {
  if (TUTMA_MS == 0) return;
  if (tutmaModu) return;
  if (millis() - aktivasyonZamani < TUTMA_MS) return;
  tutmaModu = true;
  // Tutma modunda: hedef = aynı; akımı düşürmek için yumuşak PWM yapacağız.
  // Basit yaklaşım: latch'i PWM gibi anahtarla. ULN2803 GND akımını siler.
  // OE pinini PWM yapan tasarımlar daha temizdir; bunu opsiyonel bırakıyoruz.
}

// loop() içinde çağrılır: tutma PWM'ini software ile üret
void tutmaPWM() {
  if (!tutmaModu || TUTMA_MS == 0 || TUTMA_DUTY == 255) return;
  // Çok kaba bir software-PWM. Latching solenoid kullanıyorsan
  // bu fonksiyona ihtiyacın yok; TUTMA_DUTY = 0 yap.
  static uint8_t sayac = 0;
  sayac++;
  if (sayac > 10) sayac = 0;
  // sayac < (TUTMA_DUTY/26) ise aktif, değilse düşür:
  uint8_t esik = (uint16_t)TUTMA_DUTY * 10 / 255;
  if (sayac < esik) {
    registerYaz(durum);
  } else {
    static uint8_t sifir[REGISTER_SAYISI];
    registerYaz(sifir);
  }
  delayMicroseconds(200);
}

// ---- Komut işle ----
void komutuIsle(String& satir) {
  if (satir.length() == 0) return;

  if (satir == "PING") { Serial.println("PONG"); return; }
  if (satir == "INFO") {
    Serial.print("INFO N=");
    Serial.print(HUCRE_SAYISI);
    Serial.print(" R=");
    Serial.println(HUCRE_SAYISI * 6);
    return;
  }
  if (satir == "CLR") {
    memset(hedef, 0, REGISTER_SAYISI);
    uygula();
    Serial.println("OK");
    return;
  }

  // P:HH  -> tek hücre (hücre 0)
  if (satir.startsWith("P:") && satir.length() >= 4) {
    int v = hex2(satir[2], satir[3]);
    if (v >= 0) {
      hucreYerlestir(hedef, 0, (uint8_t)v);
      uygula();
      Serial.println("OK");
    }
    return;
  }

  // C:i:HH  -> i. hücreyi ayarla
  if (satir.startsWith("C:")) {
    int kolon = satir.indexOf(':', 2);
    if (kolon > 2 && satir.length() >= (unsigned)kolon + 3) {
      int idx = satir.substring(2, kolon).toInt();
      int v = hex2(satir[kolon + 1], satir[kolon + 2]);
      if (idx >= 0 && idx < HUCRE_SAYISI && v >= 0) {
        hucreYerlestir(hedef, (uint8_t)idx, (uint8_t)v);
        uygula();
        Serial.println("OK");
      }
    }
    return;
  }

  // L:HHHH...HH  -> tam satır
  if (satir.startsWith("L:")) {
    memset(hedef, 0, REGISTER_SAYISI);
    int p = 2;
    uint8_t i = 0;
    while (p + 1 < (int)satir.length() && i < HUCRE_SAYISI) {
      int v = hex2(satir[p], satir[p + 1]);
      if (v < 0) break;
      hucreYerlestir(hedef, i, (uint8_t)v);
      p += 2;
      i++;
    }
    uygula();
    Serial.println("OK");
    return;
  }
}

void setup() {
  Serial.begin(BAUD);
  pinMode(LATCH_PINI, OUTPUT);
  digitalWrite(LATCH_PINI, LOW);
  SPI.begin();
  SPI.beginTransaction(SPISettings(8000000, MSBFIRST, SPI_MODE0));

  memset(durum, 0, REGISTER_SAYISI);
  memset(hedef, 0, REGISTER_SAYISI);
  registerYaz(durum); // her şey aşağıda

  pinMode(DUGME_NEXT, INPUT_PULLUP);
  pinMode(DUGME_PREV, INPUT_PULLUP);

  Serial.println("READY");
}

void loop() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (tampon.length() > 0) {
        komutuIsle(tampon);
        tampon = "";
      }
    } else if (tampon.length() < 256) {
      tampon += c;
    }
  }

  // Düğmeler
  unsigned long simdi = millis();
  if (digitalRead(DUGME_NEXT) == LOW && simdi - sonNext > 250) {
    Serial.println("BTN:NEXT");
    sonNext = simdi;
  }
  if (digitalRead(DUGME_PREV) == LOW && simdi - sonPrev > 250) {
    Serial.println("BTN:PREV");
    sonPrev = simdi;
  }

  tutmayaGec();
  tutmaPWM();
}
