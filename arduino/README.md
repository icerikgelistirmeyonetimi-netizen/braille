# Arduino ile Fiziksel Braille Hücresi Entegrasyonu

Bu klasör, "Braille Eğitim" uygulamasına bağlanan Arduino tarafındaki
sketch'i ve donanım talimatlarını içerir. Uygulama ekranda hangi harfi/rakamı
gösteriyorsa, Arduino üzerindeki **6 noktalı fiziksel hücreyi** aynı desende
kaldırır; öğrenci dokunarak öğrenebilir.

## 1. Donanım Listesi

| Parça | Adet | Not |
|-------|------|-----|
| Arduino UNO / Nano | 1 | Mega de olur |
| SG90 mikro servo | 6 | Her braille noktası için bir tane |
| 5V güç kaynağı (≥ 2A) | 1 | 6 servo için harici güç şart |
| Push-button (opsiyonel) | 1 | "Onay" düğmesi |
| HM-10 / JDY-08 BLE modülü | 1 | **Telefonla Bluetooth** kullanacaksanız |
| Jumper kablolar, breadboard | — | |

> Servo yerine **mini solenoid** veya **röle + iğne** kullanırsanız,
> sketch içindeki `Servo` çağrılarını basit `digitalWrite` ile değiştirin.

## 2. Pin Bağlantıları (varsayılan)

```
Arduino pin -> Servo sinyal
   D2  ->  Nokta 1
   D3  ->  Nokta 2
   D4  ->  Nokta 3
   D5  ->  Nokta 4
   D6  ->  Nokta 5
   D7  ->  Nokta 6

   D8  ->  Onay düğmesi (diğer uç GND, dahili pull-up kullanılır)
```

Tüm servoların kırmızı (+) uçları **harici 5V**'a, kahverengi/siyah (−) uçları
ise **ortak GND**'ye gider. Arduino GND'si de bu ortak GND'ye bağlanmalıdır.

### Braille nokta numaralandırması

```
1 • • 4
2 • • 5
3 • • 6
```

Servo "kalktı" konumundayken o nokta hissedilebilir olmalıdır.
`braille_cell.ino` içindeki `ACI_INIK` ve `ACI_KALKIK` değerlerini
mekaniğinize göre ayarlayın (varsayılan 0° / 90°).

## 3. Sketch'i Yükleme

1. Arduino IDE'yi açın.
2. `arduino/braille_cell/braille_cell.ino` dosyasını açın.
3. Doğru kart ve port seçilmişken **Yükle**'ye basın.
4. Seri Monitor (9600 baud) ile şu komutu deneyin:
   ```
   P:01     -> nokta 1 kalkar (A harfi)
   P:07     -> nokta 1,2,3 kalkar (L harfi)
   P:3F     -> tüm noktalar kalkar
   P:00     -> tüm noktalar iner
   PING     -> cevap PONG
   ```

## 4. Uygulamadan Bağlanma

Uygulamada **Ayarlar → Arduino (Fiziksel Hücre)** bölümüne gidin.

### A) Bilgisayar / laptop (USB)
- Tarayıcı: **Chrome veya Edge** (masaüstü)
- "USB ile Bağlan" düğmesine basın
- Açılan listede Arduino portunu seçin
- Bağlantı kurulduktan sonra "Test Et" ile 1–6 noktalarını sırayla deneyin.

### B) Android telefon (Bluetooth)
- Arduino'ya **HM-10 / JDY-08 (BLE)** modülü bağlamış olun (TX/RX değişimine dikkat).
- Uygulamayı **Chrome (Android)** içinde açın **veya** Capacitor APK'sı ile çalıştırın.
- "Bluetooth ile Bağlan" → cihaz seçimi → Bağlan.
- Telefonda **Konum izni** ve **Bluetooth** açık olmalıdır.

> Not: HC-05 / HC-06 klasik Bluetooth modülleri **Web Bluetooth ile çalışmaz**.
> Bunları yalnızca masaüstüne USB-Bluetooth köprüsü olarak kullanabilirsiniz.

## 5. Protokol (geliştiriciler için)

Tek yönlü, satır tabanlı, ASCII.

| Yön | Mesaj | Anlam |
|-----|-------|-------|
| App → Arduino | `P:HH\n` | HH = 2 haneli HEX bitmaske; bit0=nokta1 … bit5=nokta6 |
| App → Arduino | `PING\n` | Canlılık kontrolü |
| Arduino → App | `OK\n` / `PONG\n` | Onay |
| Arduino → App | `BTN\n` | Cihazdaki onay düğmesine basıldı |

Örnekler:
- `B` harfi (nokta 1,2) → maske `0b000011 = 0x03` → `P:03\n`
- `Ş` harfi (nokta 1,4,6) → maske `0b101001 = 0x29` → `P:29\n`

## 6. Sorun Giderme

- **Servolar titriyor / yetersiz güç**: Harici 5V güç kaynağı kullanın,
  USB ile beslemeyin.
- **"Web Serial desteklenmiyor" uyarısı**: Firefox / Safari Web Serial'i
  desteklemez; Chrome veya Edge masaüstü kullanın.
- **Telefonda cihaz görünmüyor**: BLE modülünüzün varsayılan servisi
  `0xFFE0` (HM-10) olmalı. Farklı bir modülde
  `src/utils/arduino.js` içindeki `BLE_SERVICE_UUID` ve
  `BLE_CHARACTERISTIC_UUID` değerlerini güncelleyin.
- **Yanlış noktalar kalkıyor**: Kabloları doğrulayın; `NOKTA_PINLERI`
  dizisinin sırası nokta 1→6 ile aynı olmalı.
