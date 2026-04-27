// Arduino ile fiziksel braille hücresi köprüsü.
//
// İki taşıma katmanı destekler:
//   - Web Serial API  (masaüstü Chrome/Edge — USB ile bağlı Arduino)
//   - Web Bluetooth   (Android/Chromebook — HM-10 / BLE modüllü Arduino)
//
// Protokol (çok basit, satır tabanlı, ASCII):
//   Uygulama -> Arduino:
//     "P:HH\n"   HH = 2 haneli onaltılık bitmaske (bit0=nokta1 ... bit5=nokta6)
//                Örn. A harfi (sadece nokta 1)        -> "P:01\n"
//                Örn. L harfi (nokta 1,2,3)           -> "P:07\n"
//                Tüm noktaları indir (boş hücre)       -> "P:00\n"
//     "PING\n"   Cihazın canlı olduğunu kontrol et
//
//   Arduino -> Uygulama (opsiyonel):
//     "OK\n"     Komut alındı
//     "PONG\n"   Ping cevabı
//     "BTN\n"    Cihaz üzerindeki onay düğmesine basıldı (kullanılmıyorsa görmezden gelinir)
//
// Tüm fonksiyonlar promise döner; hata durumunda sessizce reddedilir,
// böylece çağıran taraf (UI) Arduino bağlı olmasa da normal çalışmaya devam eder.

const BLE_SERVICE_UUID        = 0xFFE0; // HM-10 / JDY-08 varsayılan servis
const BLE_CHARACTERISTIC_UUID = 0xFFE1;

const durum = {
  tasiyici: null,         // 'serial' | 'bluetooth' | null
  bagli: false,
  port: null,             // SerialPort
  yazici: null,           // WritableStreamDefaultWriter
  okuyucu: null,          // ReadableStreamDefaultReader
  cihaz: null,            // BluetoothDevice
  karakteristik: null,    // BluetoothRemoteGATTCharacteristic
  sonDesen: null,         // tek hücre için son gönderilen
  sonSatir: null,         // çoklu hücre için son gönderilen satır
  hucreSayisi: 1          // INFO ile güncellenir
};

const dinleyiciler = new Set();
function yayinla() {
  const anlik = durumuAl();
  dinleyiciler.forEach((fn) => {
    try { fn(anlik); } catch {}
  });
}

export function durumuAl() {
  return {
    bagli: durum.bagli,
    tasiyici: durum.tasiyici,
    hucreSayisi: durum.hucreSayisi
  };
}

export function durumuDinle(fn) {
  dinleyiciler.add(fn);
  fn(durumuAl());
  return () => dinleyiciler.delete(fn);
}

export function webSerialDestekleniyorMu() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function webBluetoothDestekleniyorMu() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

// Nokta dizisini (ör. [1,2,4]) "P:HH\n" satırına çevirir.
function desenSatiri(noktalar) {
  let bit = 0;
  for (const n of noktalar || []) {
    if (n >= 1 && n <= 6) bit |= (1 << (n - 1));
  }
  const hh = bit.toString(16).toUpperCase().padStart(2, '0');
  return `P:${hh}\n`;
}

// Hücre dizisini (ör. [[1],[1,2],[1,4]]) "L:HHHH...HH\n" satırına çevirir.
function satirKomutu(hucreler) {
  let s = 'L:';
  for (const noktalar of hucreler || []) {
    let bit = 0;
    for (const n of noktalar || []) {
      if (n >= 1 && n <= 6) bit |= (1 << (n - 1));
    }
    s += bit.toString(16).toUpperCase().padStart(2, '0');
  }
  return s + '\n';
}

// ---------- Web Serial (USB) ----------

export async function seriBaglan(baudRate = 9600) {
  if (!webSerialDestekleniyorMu()) {
    throw new Error('Bu cihazda Web Serial desteklenmiyor. Lütfen Chrome veya Edge masaüstü kullanın.');
  }
  await baglantiyiKes(); // varsa eskisini kapat
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate });
  durum.port = port;
  durum.yazici = port.writable.getWriter();
  durum.tasiyici = 'serial';
  durum.bagli = true;
  yayinla();
  // Arka planda gelen satırları oku (BTN vs.)
  seriOkumayiBaslat().catch(() => {});
  // Cihazın hücre sayısını sor
  veriYaz('INFO\n').catch(() => {});
}

async function seriOkumayiBaslat() {
  if (!durum.port || !durum.port.readable) return;
  const reader = durum.port.readable.getReader();
  durum.okuyucu = reader;
  const decoder = new TextDecoder();
  let tampon = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      tampon += decoder.decode(value);
      let i;
      while ((i = tampon.indexOf('\n')) >= 0) {
        const satir = tampon.slice(0, i).trim();
        tampon = tampon.slice(i + 1);
        if (satir) gelenSatiriIsle(satir);
      }
    }
  } catch {
    // bağlantı koptu
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

// ---------- Web Bluetooth (BLE) ----------

export async function bleBaglan() {
  if (!webBluetoothDestekleniyorMu()) {
    throw new Error('Bu cihazda Web Bluetooth desteklenmiyor.');
  }
  await baglantiyiKes();
  const cihaz = await navigator.bluetooth.requestDevice({
    filters: [{ services: [BLE_SERVICE_UUID] }],
    optionalServices: [BLE_SERVICE_UUID]
  });
  const gatt = await cihaz.gatt.connect();
  const servis = await gatt.getPrimaryService(BLE_SERVICE_UUID);
  const krk = await servis.getCharacteristic(BLE_CHARACTERISTIC_UUID);
  durum.cihaz = cihaz;
  durum.karakteristik = krk;
  durum.tasiyici = 'bluetooth';
  durum.bagli = true;

  cihaz.addEventListener('gattserverdisconnected', () => {
    durum.bagli = false;
    durum.tasiyici = null;
    durum.karakteristik = null;
    yayinla();
  });

  // Bildirimleri dinle
  try {
    if (krk.properties.notify) {
      await krk.startNotifications();
      let tampon = '';
      const decoder = new TextDecoder();
      krk.addEventListener('characteristicvaluechanged', (e) => {
        tampon += decoder.decode(e.target.value);
        let i;
        while ((i = tampon.indexOf('\n')) >= 0) {
          const satir = tampon.slice(0, i).trim();
          tampon = tampon.slice(i + 1);
          if (satir) gelenSatiriIsle(satir);
        }
      });
    }
  } catch {}

  yayinla();
  veriYaz('INFO\n').catch(() => {});
}

// ---------- Ortak ----------

function gelenSatiriIsle(satir) {
  if (satir === 'BTN' || satir === 'BTN:NEXT') {
    try { window.dispatchEvent(new CustomEvent('arduinoSonraki')); } catch {}
    try { window.dispatchEvent(new CustomEvent('arduinoDugme')); } catch {}
    return;
  }
  if (satir === 'BTN:PREV') {
    try { window.dispatchEvent(new CustomEvent('arduinoOnceki')); } catch {}
    return;
  }
  if (satir.startsWith('INFO')) {
    // "INFO N=20 R=120"
    const m = satir.match(/N=(\d+)/);
    if (m) {
      durum.hucreSayisi = parseInt(m[1], 10) || 1;
      yayinla();
    }
    return;
  }
  if (satir === 'READY') {
    // Cihaz yeniden başlamış olabilir; kapasiteyi sor
    veriYaz('INFO\n').catch(() => {});
  }
}

async function veriYaz(metin) {
  const data = new TextEncoder().encode(metin);
  if (durum.tasiyici === 'serial' && durum.yazici) {
    await durum.yazici.write(data);
  } else if (durum.tasiyici === 'bluetooth' && durum.karakteristik) {
    // BLE karakteristikleri tipik olarak 20 baytla sınırlıdır
    for (let i = 0; i < data.length; i += 20) {
      const parca = data.slice(i, i + 20);
      if (durum.karakteristik.writeValueWithoutResponse) {
        await durum.karakteristik.writeValueWithoutResponse(parca);
      } else {
        await durum.karakteristik.writeValue(parca);
      }
    }
  } else {
    throw new Error('Arduino bağlı değil.');
  }
}

/**
 * Ekrandaki braille desenini (nokta numaraları dizisi) Arduino'ya gönderir.
 * Bağlı değilse sessizce yok sayar — UI bozulmaz.
 */
export async function deseniGonder(noktalar) {
  if (!durum.bagli) return false;
  const satir = desenSatiri(noktalar);
  if (durum.sonDesen === satir) return true; // gereksiz yazma yok
  try {
    await veriYaz(satir);
    durum.sonDesen = satir;
    durum.sonSatir = null;
    return true;
  } catch {
    // bağlantı koptuysa durumu güncelle
    durum.bagli = false;
    durum.tasiyici = null;
    yayinla();
    return false;
  }
}

/**
 * Birden çok hücreyi tek seferde gönderir.
 * @param {Array<number[]>} hucreler  ör. [[1],[1,2],[1,4]]
 */
export async function satiriGonder(hucreler) {
  if (!durum.bagli) return false;
  const komut = satirKomutu(hucreler);
  if (durum.sonSatir === komut) return true;
  try {
    await veriYaz(komut);
    durum.sonSatir = komut;
    durum.sonDesen = null;
    return true;
  } catch {
    durum.bagli = false;
    durum.tasiyici = null;
    yayinla();
    return false;
  }
}

/** Tüm noktaları indir (hücreyi boşalt). */
export async function deseniTemizle() {
  if (!durum.bagli) return false;
  durum.sonDesen = null;
  durum.sonSatir = null;
  try {
    await veriYaz('CLR\n');
    return true;
  } catch {
    return false;
  }
}

export async function baglantiyiKes() {
  durum.sonDesen = null;
  durum.sonSatir = null;
  // Önce hücreleri indir
  try { await veriYaz('CLR\n'); } catch {}

  if (durum.tasiyici === 'serial') {
    try { durum.yazici && durum.yazici.releaseLock(); } catch {}
    try { durum.okuyucu && await durum.okuyucu.cancel(); } catch {}
    try { durum.port && await durum.port.close(); } catch {}
  } else if (durum.tasiyici === 'bluetooth') {
    try { durum.cihaz && durum.cihaz.gatt && durum.cihaz.gatt.disconnect(); } catch {}
  }
  durum.port = null;
  durum.yazici = null;
  durum.okuyucu = null;
  durum.cihaz = null;
  durum.karakteristik = null;
  durum.tasiyici = null;
  durum.bagli = false;
  yayinla();
}
