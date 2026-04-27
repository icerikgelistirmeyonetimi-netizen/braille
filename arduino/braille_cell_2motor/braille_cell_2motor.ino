/*
 * Braille Eğitim Cihazı — 2 Step Motorlu Karbartma (Refreshable) Hücre
 * ---------------------------------------------------------------------
 * MEKANİK MANTIK
 *   6 nokta = 2 şerit × 3 nokta. Her şerit, kam profilli bir rack üzerinde
 *   doğrusal hareket eder. Her şeridin 8 farklı konumu vardır
 *   (3 bit = 2^3 = 8 desen). İki şerit birlikte 8 × 8 = 64 farklı
 *   braille deseni üretir (6 bit = 2^6 = 64).
 *
 *     ALT ŞERİT (Motor A) -> noktalar 1, 2, 3 (bit0, bit1, bit2)
 *     ÜST ŞERİT (Motor B) -> noktalar 4, 5, 6 (bit3, bit4, bit5)
 *
 * MOTOR
 *   28BYJ-48 redüktörlü step motor + ULN2003A sürücü kartı (×2).
 *   - 4096 yarım-step / tam tur (half-step modunda, 1/64 redüktör dahil)
 *   - Half-step modu kullanıyoruz (Stepper.h değil, kendi 8-faz tablomuz)
 *   - 5V besleme (USB veya harici). İki motor + UNO için harici 5V önerilir.
 *
 * HOMING
 *   Açılışta her iki motor da limit switch'e (NO, GND'ye çekildiğinde LOW)
 *   değene kadar geri yönde döner, oraya 0 konumu denir. Sonra 0. desen
 *   konumuna ilerler.
 *
 * PROTOKOL (uygulamadan, satır sonu '\n'):
 *   "P:HH"     HH = 2 haneli hex bitmaske (bit0=n1 ... bit5=n6)
 *   "L:HHHHH"  Çoklu hücre (bu firmware tek hücre — ilk byte'ı kullanır)
 *   "PING"     -> "PONG"
 *   "INFO"     -> "INFO:CELLS=1"
 *   "HOME"     -> Yeniden homing yapar
 *
 * CİHAZ -> UYGULAMA:
 *   "READY"    Açılışta homing bitince
 *   "OK"       Komut uygulandı
 *   "ERR:..."  Hata
 *   "BTN"      Düğmeye basıldı
 *
 * PİNLER (Arduino UNO)
 *   Motor A (ULN2003 #1): IN1=D2, IN2=D3, IN3=D4, IN4=D5
 *   Motor B (ULN2003 #2): IN1=D6, IN2=D7, IN3=D8, IN4=D9
 *   Limit switch A: D10 (INPUT_PULLUP, basılınca LOW)
 *   Limit switch B: D11 (INPUT_PULLUP, basılınca LOW)
 *   Onay düğmesi  : D12 (INPUT_PULLUP, basılınca LOW)
 *
 * KALİBRASYON
 *   - SERIT_ADIM_ARALIGI: Bir konumdan diğerine kaç half-step? Mekaniğe
 *     göre deneyerek bulun. Tüm 8 konum eşit aralıklı varsayılır.
 *   - HOME_GERI_ADIMI: Limit'e değdikten sonra biraz geri çekilme miktarı.
 *   - Konum tablosu: Eşit aralık iyi sonuç vermezse SERIT_KONUMU[] dizisini
 *     elle düzenleyin (her şerit için 8 mutlak step pozisyonu).
 */

// ====================== AYARLAR =====================================
const uint8_t MOTOR_A_PINS[4] = { 2, 3, 4, 5 };
const uint8_t MOTOR_B_PINS[4] = { 6, 7, 8, 9 };
const uint8_t LIMIT_A_PIN     = 10;
const uint8_t LIMIT_B_PIN     = 11;
const uint8_t DUGME_PIN       = 12;   // -1 yaparsanız düğme yok

const uint32_t BAUD           = 9600;

// Step zamanlaması — 28BYJ-48 için ~1000 us altına inmeyin
const uint16_t STEP_GECIKME_US = 1200;

// Konumlar arası half-step sayısı (deneyerek ayarlayın)
const int16_t SERIT_ADIM_ARALIGI = 64;
// Maksimum güvenli step (homing'de takılmayı önler)
const int16_t MAX_HOMING_STEP    = 5000;
// Limit'e değdikten sonra geri çekme
const int16_t HOME_GERI_ADIMI    = 30;

// 8 konumun mutlak step değerleri (homing sonrası 0'dan itibaren)
int16_t SERIT_KONUMU[8];

// ====================== HALF-STEP TABLOSU ===========================
// 28BYJ-48 8-faz half-step sırası (CW yönü)
const uint8_t HALF_STEP_TABLO[8][4] = {
  { 1, 0, 0, 0 },
  { 1, 1, 0, 0 },
  { 0, 1, 0, 0 },
  { 0, 1, 1, 0 },
  { 0, 0, 1, 0 },
  { 0, 0, 1, 1 },
  { 0, 0, 0, 1 },
  { 1, 0, 0, 1 },
};

// ====================== MOTOR DURUMU ================================
struct Motor {
  uint8_t pins[4];
  uint8_t limitPin;
  int16_t mevcutStep;   // Homing sonrası mutlak konum
  uint8_t fazIndeksi;   // 0..7
};

Motor motorA;
Motor motorB;

// ====================== DÜĞME =======================================
bool sonDugmeOkumasi  = HIGH;
bool dugmeKararli     = HIGH;
uint32_t dugmeZamani  = 0;
const uint16_t DEBOUNCE_MS = 30;

// ====================== HEX YARDIMCI ================================
int hexHaneDegeri(char c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
  if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
  return -1;
}

int hexCiftiOku(const char* s) {
  int h = hexHaneDegeri(s[0]);
  int l = hexHaneDegeri(s[1]);
  if (h < 0 || l < 0) return -1;
  return (h << 4) | l;
}

// ====================== MOTOR DÜŞÜK SEVİYE ==========================
void motorPinleriniSifirla(Motor& m) {
  for (uint8_t i = 0; i < 4; i++) digitalWrite(m.pins[i], LOW);
}

void motorFaziniYaz(Motor& m) {
  for (uint8_t i = 0; i < 4; i++) {
    digitalWrite(m.pins[i], HALF_STEP_TABLO[m.fazIndeksi][i]);
  }
}

// yon: +1 ileri (step++), -1 geri (step--)
void motorBirAdim(Motor& m, int8_t yon) {
  if (yon > 0) {
    m.fazIndeksi = (m.fazIndeksi + 1) & 0x07;
    m.mevcutStep++;
  } else {
    m.fazIndeksi = (m.fazIndeksi + 7) & 0x07; // -1 mod 8
    m.mevcutStep--;
  }
  motorFaziniYaz(m);
  delayMicroseconds(STEP_GECIKME_US);
}

// İki motoru paralel olarak hedefe götürür (eş zamanlı görsün)
void ikiMotoruHedefeGotur(int16_t hedefA, int16_t hedefB) {
  while (motorA.mevcutStep != hedefA || motorB.mevcutStep != hedefB) {
    if (motorA.mevcutStep != hedefA) {
      int8_t y = (hedefA > motorA.mevcutStep) ? +1 : -1;
      motorBirAdim(motorA, y);
    }
    if (motorB.mevcutStep != hedefB) {
      int8_t y = (hedefB > motorB.mevcutStep) ? +1 : -1;
      motorBirAdim(motorB, y);
    }
    if (motorA.mevcutStep == hedefA && motorB.mevcutStep == hedefB) break;
  }
  motorPinleriniSifirla(motorA);
  motorPinleriniSifirla(motorB);
}

// ====================== HOMING ======================================
bool tekMotoruHomeYap(Motor& m) {
  // Limit'e değene kadar geri (- yön) git
  for (int16_t i = 0; i < MAX_HOMING_STEP; i++) {
    if (digitalRead(m.limitPin) == LOW) {
      // Geri çekil
      for (int16_t j = 0; j < HOME_GERI_ADIMI; j++) motorBirAdim(m, +1);
      m.mevcutStep = 0;
      motorPinleriniSifirla(m);
      return true;
    }
    motorBirAdim(m, -1);
  }
  motorPinleriniSifirla(m);
  return false;
}

bool homingYap() {
  bool ok1 = tekMotoruHomeYap(motorA);
  bool ok2 = tekMotoruHomeYap(motorB);
  return ok1 && ok2;
}

// ====================== KONUM TABLOSU ===============================
void konumTablosunuKur() {
  for (uint8_t i = 0; i < 8; i++) {
    SERIT_KONUMU[i] = (int16_t)i * SERIT_ADIM_ARALIGI;
  }
}

// ====================== DESEN UYGULAMA ==============================
// bitmaske: bit0..bit5
void deseniUygula(uint8_t bitmaske) {
  uint8_t altSerit = bitmaske & 0x07;        // bit0..bit2 -> Motor A
  uint8_t ustSerit = (bitmaske >> 3) & 0x07; // bit3..bit5 -> Motor B
  int16_t hedefA = SERIT_KONUMU[altSerit];
  int16_t hedefB = SERIT_KONUMU[ustSerit];
  ikiMotoruHedefeGotur(hedefA, hedefB);
}

// ====================== KOMUT İŞLEYİCİ ==============================
String komutTamponu;

void komutuIsle(String komut) {
  komut.trim();
  if (komut.length() == 0) return;

  if (komut == "PING") { Serial.println("PONG"); return; }
  if (komut == "INFO") { Serial.println("INFO:CELLS=1"); return; }
  if (komut == "HOME") {
    if (homingYap()) {
      deseniUygula(0);
      Serial.println("OK");
    } else {
      Serial.println("ERR:HOME");
    }
    return;
  }

  if (komut.startsWith("P:") && komut.length() >= 4) {
    int v = hexCiftiOku(komut.c_str() + 2);
    if (v < 0) { Serial.println("ERR:HEX"); return; }
    deseniUygula((uint8_t)(v & 0x3F));
    Serial.println("OK");
    return;
  }

  if (komut.startsWith("L:") && komut.length() >= 4) {
    // Çoklu hücre — tek hücreli cihaz, ilk byte'ı uygula
    int v = hexCiftiOku(komut.c_str() + 2);
    if (v < 0) { Serial.println("ERR:HEX"); return; }
    deseniUygula((uint8_t)(v & 0x3F));
    Serial.println("OK");
    return;
  }

  Serial.println("ERR:CMD");
}

// ====================== DÜĞME =======================================
void dugmeyiOku() {
  if (DUGME_PIN > 200) return; // devre dışı
  bool oku = digitalRead(DUGME_PIN);
  if (oku != sonDugmeOkumasi) {
    dugmeZamani = millis();
    sonDugmeOkumasi = oku;
  }
  if (millis() - dugmeZamani > DEBOUNCE_MS) {
    if (oku != dugmeKararli) {
      dugmeKararli = oku;
      if (dugmeKararli == LOW) {
        Serial.println("BTN");
      }
    }
  }
}

// ====================== SETUP / LOOP ================================
void setup() {
  Serial.begin(BAUD);

  // Motor A
  for (uint8_t i = 0; i < 4; i++) {
    motorA.pins[i] = MOTOR_A_PINS[i];
    pinMode(motorA.pins[i], OUTPUT);
    digitalWrite(motorA.pins[i], LOW);
  }
  motorA.limitPin = LIMIT_A_PIN;
  motorA.mevcutStep = 0;
  motorA.fazIndeksi = 0;

  // Motor B
  for (uint8_t i = 0; i < 4; i++) {
    motorB.pins[i] = MOTOR_B_PINS[i];
    pinMode(motorB.pins[i], OUTPUT);
    digitalWrite(motorB.pins[i], LOW);
  }
  motorB.limitPin = LIMIT_B_PIN;
  motorB.mevcutStep = 0;
  motorB.fazIndeksi = 0;

  pinMode(LIMIT_A_PIN, INPUT_PULLUP);
  pinMode(LIMIT_B_PIN, INPUT_PULLUP);
  pinMode(DUGME_PIN,   INPUT_PULLUP);

  konumTablosunuKur();

  // Açılış: homing yap, sonra 0 desenine git
  if (homingYap()) {
    deseniUygula(0);
    Serial.println("READY");
  } else {
    Serial.println("ERR:HOME");
  }

  komutTamponu.reserve(32);
}

void loop() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (komutTamponu.length() > 0) {
        komutuIsle(komutTamponu);
        komutTamponu = "";
      }
    } else {
      if (komutTamponu.length() < 30) komutTamponu += c;
    }
  }
  dugmeyiOku();
}
