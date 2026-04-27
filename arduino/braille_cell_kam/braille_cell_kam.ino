/*
 * Braille Eğitim Cihazı — Kam/Rack tabanlı yenilenebilir hücre
 * --------------------------------------------------------------
 * Bu sketch, "özel kayar mekanizma" (sliding cam + rack & pinion)
 * kullanan TEK MOTORLU 6 noktalı bir Braille hücresini sürer.
 *
 * MEKANİK ÖZET
 *   - Bir step motor + pinyon dişli, yeşil "rack" parçasını sağa-sola kaydırır.
 *   - Rack'in alt yüzeyindeki kam profili, hangi pimin yukarı çıkacağını
 *     mekanik olarak belirler.
 *   - 64 farklı Braille deseni (0x00..0x3F) için 64 farklı motor konumu vardır.
 *   - Açılışta limit switch ile homing yapılır (referans noktası).
 *
 * UYGULAMA İLE PROTOKOL (mevcut braille_cell.ino ile aynı, satır sonu '\n'):
 *   "P:HH"   HH = 2 haneli onaltılık bitmaske (bit0=nokta1 ... bit5=nokta6)
 *   "PING"   -> "PONG"
 *   "INFO"   -> "INFO:CELLS=1" (web app hücre sayısını öğrenir)
 *
 * CİHAZ -> UYGULAMA:
 *   "READY"  Açılış + homing tamam
 *   "OK"     Komut uygulandı
 *   "ERR:..."Hata mesajı
 *   "BTN"    Onay düğmesine basıldı
 *
 * DONANIM (varsayılan)
 *   - Step motor: NEMA17 + A4988/DRV8825 sürücü
 *       STEP -> D3
 *       DIR  -> D4
 *       EN   -> D5  (LOW = enable)
 *   - Limit switch: D6  (NO, diğer ucu GND, aktif LOW)
 *   - Onay düğmesi: D8  (opsiyonel, aktif LOW)
 *   - Sürücü VMOT: 12V; mantık 5V; GND'ler ortak.
 *
 * KALİBRASYON
 *   1) KAM_KONUMU[] tablosunu mekaniğine göre doldur.
 *      İlk deneme için lineer aralık (her desen arası KAM_ADIM_ARALIGI step) bırakıldı.
 *   2) HOMING_YONU ve MAX_STEP değerlerini mekaniğine göre ayarla.
 *   3) Motor ters dönüyorsa DIR pinindeki HIGH/LOW yorumunu değiştir.
 */

// ---- Pin atamaları ------------------------------------------------
const uint8_t PIN_STEP   = 3;
const uint8_t PIN_DIR    = 4;
const uint8_t PIN_EN     = 5;
const uint8_t PIN_LIMIT  = 6;     // 0xFF yaparsanız limit switch yok kabul edilir
const uint8_t PIN_DUGME  = 8;     // 0xFF yaparsanız düğme yok

// ---- Hareket parametreleri ---------------------------------------
const uint16_t STEP_GECIKME_US  = 800;   // step pulse aralığı (hız)
const int16_t  HOMING_YONU      = -1;    // -1 = home tarafına geri sür, +1 = ileri
const int16_t  MAX_STEP         = 2000;  // güvenlik limiti (rack uzunluğu kadar)
const int16_t  HOMING_GERI_CEK  = 20;    // limit'e değdikten sonra geri çekilen step
const uint32_t BAUD             = 9600;

// ---- Kam tablosu --------------------------------------------------
// Her bir 6-bit Braille desenine karşılık gelen mutlak step konumu.
// Mekaniği bittikten sonra her deseni elle test edip bu tabloyu güncelle.
// Şimdilik ilk deneme için lineer (eşit aralıklı) varsayıyoruz.
const int16_t KAM_ADIM_ARALIGI = 16;     // iki desen arası step
int16_t KAM_KONUMU[64];

void kamTablosunuVarsayilanaAyarla() {
  for (uint8_t i = 0; i < 64; i++) {
    KAM_KONUMU[i] = (int16_t)i * KAM_ADIM_ARALIGI;
  }
}

// ---- Durum --------------------------------------------------------
int16_t mevcutKonum = 0;
uint8_t sonDesen    = 0xFF;
bool    homeTamam   = false;
String  tampon;
unsigned long sonDugmeMs = 0;

// ---- Düşük seviye motor ------------------------------------------
inline void surucuyuAc()  { if (PIN_EN != 0xFF) digitalWrite(PIN_EN, LOW); }
inline void surucuyuKapa(){ if (PIN_EN != 0xFF) digitalWrite(PIN_EN, HIGH); }

void yonAyarla(int16_t yon) {
  // yon > 0  -> ileri, yon < 0 -> geri.  Mekaniğe göre ters çevir.
  digitalWrite(PIN_DIR, yon > 0 ? HIGH : LOW);
}

void birStepAt() {
  digitalWrite(PIN_STEP, HIGH);
  delayMicroseconds(2);
  digitalWrite(PIN_STEP, LOW);
  delayMicroseconds(STEP_GECIKME_US);
}

bool limitBasildiMi() {
  if (PIN_LIMIT == 0xFF) return false;
  return digitalRead(PIN_LIMIT) == LOW;
}

// ---- Homing -------------------------------------------------------
bool homingYap() {
  surucuyuAc();
  yonAyarla(HOMING_YONU);
  // Limit switch'e değene kadar geri sür
  for (int16_t i = 0; i < MAX_STEP + 200; i++) {
    if (limitBasildiMi()) {
      // Biraz geri çekil ki switch serbest kalsın
      yonAyarla(-HOMING_YONU);
      for (int16_t j = 0; j < HOMING_GERI_CEK; j++) birStepAt();
      mevcutKonum = 0;
      sonDesen    = 0xFF;
      homeTamam   = true;
      return true;
    }
    birStepAt();
  }
  // Limit yoksa: ilk konumu sıfır kabul et (test/geliştirme modu)
  if (PIN_LIMIT == 0xFF) {
    mevcutKonum = 0;
    homeTamam   = true;
    return true;
  }
  Serial.println("ERR:HOME");
  return false;
}

// ---- Konuma git ---------------------------------------------------
void konumaGit(int16_t hedef) {
  if (hedef < 0) hedef = 0;
  if (hedef > MAX_STEP) hedef = MAX_STEP;

  int16_t fark = hedef - mevcutKonum;
  if (fark == 0) return;

  yonAyarla(fark > 0 ? +1 : -1);
  int16_t adim = fark > 0 ? fark : -fark;
  for (int16_t i = 0; i < adim; i++) {
    // İleri giderken bile limit'e değerse dur (güvenlik)
    if (limitBasildiMi() && (fark < 0)) break;
    birStepAt();
  }
  mevcutKonum = hedef;
}

// ---- Desen uygula -------------------------------------------------
void deseniUygula(uint8_t maske) {
  maske &= 0x3F;
  if (!homeTamam) {
    if (!homingYap()) return;
  }
  konumaGit(KAM_KONUMU[maske]);
  sonDesen = maske;
}

// ---- Komut işleyici ----------------------------------------------
void komutuIsle(const String& satir) {
  if (satir.length() == 0) return;

  if (satir == "PING") {
    Serial.println("PONG");
    return;
  }

  if (satir == "INFO") {
    Serial.println("INFO:CELLS=1");
    return;
  }

  if (satir == "HOME") {
    if (homingYap()) Serial.println("OK");
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
      }
      Serial.println("OK");
    } else {
      Serial.println("ERR:HEX");
    }
    return;
  }

  // L: (çoklu hücre) komutu — bu sketch tek hücreli; ilk hücreyi uygular.
  if (satir.startsWith("L:") && satir.length() >= 4) {
    String hh = satir.substring(2, 4);
    char* son;
    long deger = strtol(hh.c_str(), &son, 16);
    if (son != hh.c_str()) {
      deseniUygula((uint8_t)(deger & 0x3F));
      Serial.println("OK");
    }
    return;
  }
}

// ---- Setup / Loop -------------------------------------------------
void setup() {
  Serial.begin(BAUD);

  pinMode(PIN_STEP, OUTPUT);
  pinMode(PIN_DIR,  OUTPUT);
  if (PIN_EN != 0xFF) {
    pinMode(PIN_EN, OUTPUT);
    surucuyuKapa();
  }
  if (PIN_LIMIT != 0xFF) pinMode(PIN_LIMIT, INPUT_PULLUP);
  if (PIN_DUGME != 0xFF) pinMode(PIN_DUGME, INPUT_PULLUP);

  kamTablosunuVarsayilanaAyarla();

  // Açılışta homing dene; başarısızsa loop içinde komutla tekrar denenebilir.
  homingYap();

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
    } else {
      if (tampon.length() < 64) tampon += c;
    }
  }

  if (PIN_DUGME != 0xFF) {
    if (digitalRead(PIN_DUGME) == LOW) {
      unsigned long simdi = millis();
      if (simdi - sonDugmeMs > 250) {
        Serial.println("BTN");
        sonDugmeMs = simdi;
      }
    }
  }
}
