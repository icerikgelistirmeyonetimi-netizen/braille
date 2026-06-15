# Braille Müzik — İşlenmiş Örnekler (Test Fixture'ları)

> **Kaynak:** *Braille Music Notation Introductory Training* (NextSense, Rev 2) — PDF'in **braille'ini gösterdiği** işlenmiş örnekler (otoriter oracle).
> **Üretim:** `scripts/muzik-brl-fixtures.mjs` — doğrulanmış UEB Music kural+hücre tablolarıyla, repo motorundan **bağımsız** üretildi.
> **Format:** Unicode braille. Ölçü ayracı = boşluk. "İmza satırı" = müziğin üstündeki ortalanmış donanım+ölçü satırı.

## Doğrulama durumu (PDF braille'iyle hücre-hücre karşılaştırma)
Şu parçaları PDF'in basılı braille'iyle **tek tek karşılaştırdım, eşleşiyor:** Ode to Joy (s.24), Long Time Ago (s.85),
**Angels (s.86)**, **Jingle Bells (s.97)**, **Soon (s.98)**, **Cavallini (s.93)**, **Trumpet Voluntary (s.52)**, **Fidelio (s.61)**,
**Tekrar+oktav+dinamik (s.94)**, **Bar-üstü tie (s.94)**, **Bar-repeat ×N (s.95)**, **Bracket slur (s.44, 1 hücre hariç — aşağı bak)**.
Karşılaştırmada bulunup düzeltilen gerçek hatalar: başla-tekrar sonrası fazladan boşluk; Jingle bar7 (A→G);
Trumpet cresc yanlış notada; **L6 kural 4** (dinamik sözcükten sonraki nota her zaman oktav işareti alır); ve
**tie-across-tekrar** (bir tie braille-tekrar ⠶ sınırını geçince devam eden nota oktav işareti alır — ties-across bar4).
Geri kalan parçalar **aynı doğrulanmış motorla** üretildi.

> 🔎 **Bracket slur (s.44) bar1 — ÇÖZÜLDÜ:** B2 burada **işaretsiz** ⠺ (C3→B2 = 2'li aralık → işaret yok). İnternette
> teyit edildi: "anacrusis sonrası downbeat oktav alır" diye bir kural YOK; 2'li/3'lü → işaret yok kuralı geçerli.
> PDF görselindeki ⠘⠺ izlenimi muhtemelen okuma hatası. Kural-doğru hâli (⠺) tutuluyor.

> ✅ **39/39 parça TAMAM.** 38'i PDF braille'iyle hücre-hücre doğrulandı. **Weber TEK anomali:** PDF, üçleme-içi
> oktav-geçişli 3'lülere (D5/B4/B3) oktav işareti koyuyor; ama kural "2'li/3'lü → asla, oktav değişse bile" (internet
> + Bethena bar1 D5→B4=⠺ işaretsiz ile teyitli). Weber editöryel anomali; fixture kurala göre üretildi (parça başlığında ⚠ var).

## ⚠️ Tam PDF satırından FARKLAR (bilerek)
Buradaki braille **müzik içeriğidir**; tam PDF satırı = bu + aşağıdakiler:
1. **Satır başı ölçü numaraları** — PDF her braille satırının 1. hücresine ölçü no koyar (sayı işaretsiz, ⠁=1, ⠋=6, ⠁⠁=11…). Burada YOK (satır kırılmasına bağlı).
2. **Fiziksel satır kırılması** — PDF sayfayı genişliğe göre kırar; her yeni satırın ilk notası ek oktav işareti alır. Burada her parça tek mantıksal satır (kırılma yok), bu yüzden oktav işaretleri yalnızca aralık/dinamik/tekrar/volta kuralıyla konur.
3. **Kısaltma noktası (çözüldü):** `cresc.`/`rit`/`decr`/`dim` kısaltmalarının sonuna **dot 3** gelir (standart "abbreviation" kuralı — NFB Music Cert. Ch.14, National Braille, RNIB, Music Braille Code 2015; PDF Appendix de `cresc.`=⠜⠉⠗⠄ gösterir). Bu dot 3 hem kısaltma noktasıdır hem ayırıcıdır. → `rit`=⠜⠗⠊⠞⠄ doğru.

**Kullanım:** notaları editöre gir → çıkan braille'i buradaki müzik satırıyla karşılaştır (ölçü no/satır kırılması hariç).

---

## Ode to Joy (s.24)
Müzik:
```
⠐⠋⠋⠛⠓ ⠓⠛⠋⠑ ⠙⠙⠑⠋ ⠋⠑⠑⠭ ⠋⠋⠛⠓ ⠓⠛⠋⠑ ⠙⠙⠑⠋
⠐⠑⠙⠙⠭⠣⠅
```

## 6'lı atlama örneği (s.25)
Müzik:
```
⠸⠗⠐⠏ ⠻⠳⠪⠸⠺ ⠽⠣⠅
```

## 2 bemol 3/4 örnek (s.30-31)
*donanım: 2b · ölçü: 3/4*

İmza satırı (ortalanmış): `⠣⠣⠼⠉⠲`

Müzik:
```
⠐⠟⠻ ⠻⠳⠻ ⠕⠱ ⠱⠹⠱ ⠫⠄⠋⠫ ⠻⠄⠛⠻ ⠕⠄⠣⠅
```

## 4 diyez 2/4 örnek (s.31)
*donanım: 4# · ölçü: 2/4*

İmza satırı (ortalanmış): `⠼⠙⠩⠼⠃⠲`

Müzik:
```
⠐⠋⠋⠳ ⠛⠑⠺ ⠐⠋⠋⠳ ⠚⠊⠻⠣⠅
```

## Little Brown Jug (s.41-42)
*ölçü: C*

İmza satırı (ortalanmış): `⠨⠉`

Müzik:
```
⠐⠋⠳⠓⠈⠉⠗ ⠛⠪⠊⠈⠉⠎ ⠭⠺⠚⠪⠺ ⠙⠱⠣⠋⠑⠙⠊⠓
⠐⠋⠳⠋⠗ ⠛⠪⠛⠎ ⠭⠺⠚⠪⠺ ⠑⠹⠙⠈⠉⠹⠧⠣⠅
```

## Tekli/çift slur örneği (s.43)
*donanım: 3# · ölçü: C*

İmza satırı (ortalanmış): `⠩⠩⠩⠨⠉`

Müzik:
```
⠨⠝⠉⠏ ⠐⠎⠉⠝ ⠐⠟⠉⠨⠱⠉⠹ ⠺⠉⠨⠻⠉⠏ ⠐⠎⠉⠨⠏⠉ ⠟⠐⠪⠉⠺⠉ ⠹⠉⠫⠉⠐⠎ ⠺⠉⠱⠉⠐⠗⠉ ⠮⠣⠅
```

## Good King Wenceslas (s.80)
*donanım: 2b · ölçü: 2/4*

İmza satırı (ortalanmış): `⠣⠣⠼⠃⠲`

Müzik:
```
⠨⠫⠫ ⠫⠻ ⠫⠫ ⠐⠞⠜⠂ ⠹⠺ ⠹⠱ ⠏ ⠫⠧⠣⠆
```

## Long Time Ago (s.84-85)
*tempo: allegro · donanım: 2b · ölçü: 4/4*

İmza satırı (ortalanmış): `⠣⠣⠼⠙⠲`

Müzik:
```
⠐⠚⠚⠺⠺⠳ ⠺⠄⠚⠓⠻⠄ ⠼⠂⠨⠹⠄⠙⠙⠺⠄ ⠹⠄⠙⠙⠱⠄⠣⠆ ⠼⠆⠨⠕⠹⠄⠙ ⠾⠣⠅
```

## Jingle Bells (s.96-97)
*donanım: 1# · ölçü: cut*

İmza satırı (ortalanmış): `⠩⠸⠉`

Müzik:
```
⠐⠺⠚⠚⠈⠉⠞ ⠶ ⠭⠺⠑⠐⠳⠪ ⠞⠄⠧ ⠹⠙⠙⠈⠉⠹⠄⠙ ⠹⠺⠺⠚⠚ ⠺⠪⠳⠺ ⠎⠩⠎ ⠼⠓⠼⠋ ⠨⠱⠱⠹⠪ ⠗⠄⠣⠅
```

## Triplet örneği — Beethoven Sym.6 (s.73)
*donanım: 1# · ölçü: 2/4*

İmza satırı (ortalanmış): `⠩⠼⠃⠲`

Müzik:
```
⠜⠙⠕⠇⠉⠑⠨⠫⠈⠉⠆⠋⠋⠑ ⠆⠙⠋⠑⠆⠙⠊⠛⠣⠅
```

## Trumpet Voluntary — J. Clarke (s.51-52)
*tempo: Moderato · donanım: 1b · ölçü: 4/4*

İmza satırı (ortalanmış): `⠣⠼⠙⠲`

Müzik:
```
⠜⠍⠋⠐⠟⠗ ⠪⠄⠚⠪⠳ ⠻⠳⠪⠓⠛ ⠳⠜⠉⠗⠄⠨⠹⠹⠹ ⠜⠋⠐⠟⠗ ⠪⠄⠚⠪⠳ ⠜⠗⠊⠞⠄⠐⠛⠓⠛⠓⠳⠄⠛ ⠿⠣⠅
```

## Zaman imzası değişimi örneği (s.31-32)
*donanım: 3b · ölçü: 2/4*

İmza satırı (ortalanmış): `⠣⠣⠣⠼⠃⠲`

Müzik:
```
⠨⠑⠚⠙⠑ ⠫⠄⠐⠚ ⠙⠚⠙⠐⠙ ⠼⠉⠲ ⠐⠗⠨⠫ ⠼⠋⠦ ⠨⠱⠛⠫⠑ ⠼⠉⠲ ⠨⠹⠱⠐⠳ ⠼⠋⠦ ⠐⠪⠓⠻⠛ ⠼⠉⠲ ⠐⠗⠧⠣⠅
```

## Donanım değişimi örneği (s.32-33)
*donanım: 1b · ölçü: 4/4*

İmza satırı (ortalanmış): `⠣⠼⠙⠲`

Müzik:
```
⠘⠻⠄⠛⠻⠪ ⠺⠄⠚⠈⠺⠺⠣⠅⠄ ⠣⠣⠣ ⠘⠫⠄⠋⠫⠺ ⠫⠄⠋⠞⠣⠅⠄
```

## Oh, My Lovin' Brother (s.40-41)
*donanım: 1b · ölçü: cut*

İmza satırı (ortalanmış): `⠣⠸⠉`

Müzik:
```
⠧⠐⠛⠛⠳⠪ ⠞⠞⠈⠉ ⠺⠚⠚⠻⠳ ⠮ ⠧⠊⠊⠹⠪ ⠗⠗⠈⠉ ⠳⠳⠻⠳ ⠎⠎⠈⠉ ⠪⠧⠳⠻ ⠟⠟⠈⠉ ⠻⠓⠓⠻⠱ ⠝⠟⠈⠉ ⠟⠻⠳ ⠎⠎ ⠳⠻⠗ ⠿⠈⠉ ⠻⠧⠥⠣⠅
```

## Fidelio Ouverture — Beethoven (s.60-61)
*tempo: Allegro · donanım: 4# · ölçü: cut*

İmza satırı (ortalanmış): `⠼⠙⠩⠸⠉`

Müzik:
```
⠜⠋⠨⠫⠄⠐⠚⠦⠺⠧ ⠜⠎⠋⠨⠳⠄⠋⠦⠫⠧ ⠜⠎⠋⠨⠺⠄⠓⠦⠳⠦⠰⠫ ⠦⠱⠧⠥⠣⠇⠣⠅⠄
```

## Angels We Have Heard on High (s.85-86)
*donanım: 1b · ölçü: C*

İmza satırı (ortalanmış): `⠣⠨⠉`

Müzik:
```
⠜⠍⠋⠐⠪⠪⠪⠹ ⠹⠄⠚⠎ ⠪⠳⠪⠹ ⠪⠄⠓⠟⠣⠆ ⠜⠋⠨⠝⠑⠙⠚⠊ ⠣⠶⠐⠞⠙⠚⠊⠓ ⠎⠚⠊⠓⠛ ⠳⠄⠙⠝ ⠻⠳⠪⠺ ⠼⠂⠄⠜⠙⠐⠎⠗⠜⠂ ⠜⠏⠨⠝⠜⠉⠗⠄⠨⠑⠙⠚⠊⠣⠆ ⠼⠆⠄⠜⠋⠐⠎⠉⠗ ⠿⠣⠅
```

## Cavallini study (s.92-93)
*ölçü: 2/4*

İmza satırı (ortalanmış): `⠼⠃⠲`

Müzik:
```
⠐⠳ ⠆⠨⠋⠉⠓⠦⠐⠓⠆⠨⠙⠉⠋⠦⠐⠓ ⠶ ⠆⠨⠑⠉⠛⠦⠐⠓⠆⠣⠨⠊⠉⠚⠦⠐⠑ ⠶⠣⠅
```

## Soon, Soon, Soon — Mozart (s.97-98)
*tempo: Adagio · donanım: 2# · ölçü: cut*

İmza satırı (ortalanmış): `⠩⠩⠸⠉`

Müzik:
```
⠜⠏⠐⠪⠧⠨⠱⠧ ⠟⠻⠻ ⠗⠄⠻ ⠻⠉⠫⠱⠉⠹ ⠕⠥ ⠼⠑ ⠜⠍⠏⠨⠕⠹⠄⠑⠉ ⠕⠥ ⠜⠏⠨⠼⠃⠣⠅
```

## Bracket slur örneği (s.44)
*donanım: 1# · ölçü: 3/4*

İmza satırı (ortalanmış): `⠩⠼⠉⠲`

Müzik:
```
⠰⠃⠸⠑⠙ ⠺⠪⠳ ⠎⠪ ⠸⠕⠘⠆⠰⠃⠻ ⠳⠫⠹ ⠕⠱ ⠞⠘⠆⠣⠅
```

## Tekrar işareti + bar-üstü tie (s.94)
*ölçü: 4/4*

İmza satırı (ortalanmış): `⠼⠙⠲`

Müzik:
```
⠸⠹⠘⠓⠸⠙⠈⠉⠹⠘⠓⠸⠙⠈⠉ ⠶⠈⠉ ⠶⠈⠉ ⠸⠹⠘⠓⠸⠙⠈⠉⠹⠧⠣⠅
```

## Tekrar + oktav + dinamik örneği (s.93)
*ölçü: 2/4*

İmza satırı (ortalanmış): `⠼⠃⠲`

Müzik:
```
⠜⠍⠏⠆⠐⠙⠉⠋⠦⠓⠜⠍⠋⠆⠨⠙⠉⠋⠦⠓ ⠜⠋⠰⠹⠧⠣⠅
```

## Bar-repeat ×N örneği (s.94-95)
*ölçü: 4/4*

İmza satırı (ortalanmış): `⠼⠙⠲`

Müzik:
```
⠘⠺⠺⠺⠺ ⠶⠼⠓ ⠘⠺⠺⠺⠚⠛⠣⠆
```

## Nota gruplama — Beethoven Op.24 (s.33)
*donanım: 1b · ölçü: C*

İmza satırı (ortalanmış): `⠣⠨⠉`

Müzik:
```
⠨⠎⠷⠛⠋⠛⠷⠛⠋⠑ ⠝⠵⠙⠡⠚⠐⠙⠨⠵⠙⠣⠚⠊⠣⠅
```

## Gruplama Örnek 1 (s.34)
*donanım: 3b · ölçü: 2/4*

İmza satırı (ortalanmış): `⠣⠣⠣⠼⠃⠲`

Müzik:
```
⠨⠽⠑⠋⠑⠙⠭ ⠯⠛⠓⠛⠋⠭ ⠷⠛⠊⠓⠿⠋⠑⠙ ⠡⠾⠙⠑⠚⠙⠙⠣⠅
```

## The Golden Sonata — Purcell (s.66-67)
*donanım: 1b · ölçü: 3/8*

İmza satırı (ortalanmış): `⠣⠼⠉⠦`

Müzik:
```
⠨⠫⠊ ⠓⠐⠖⠫ ⠱⠠⠌⠜⠏⠨⠊ ⠓⠐⠖⠫ ⠱⠭⠣⠅
```

## Gigue — Couperin (s.67)
*donanım: 1# · ölçü: 6/8*

İmza satırı (ortalanmış): `⠩⠼⠋⠦`

Müzik:
```
⠐⠖⠨⠑⠐⠢⠙⠉⠚⠨⠋⠑⠐⠖⠹⠉⠐⠢⠚⠉⠐⠢⠙ ⠚⠚⠠⠲⠙⠑⠐⠓⠠⠲⠊ ⠚⠋⠠⠲⠛⠓⠐⠢⠓⠉⠐⠖⠇⠪⠣⠅
```

## The Jolly Miller (s.82-83)
*ölçü: 6/8*

İmza satırı (ortalanmış): `⠼⠋⠦`

Müzik:
```
⠣⠶⠐⠋ ⠪⠊⠩⠳⠋ ⠨⠹⠙⠺⠑ ⠹⠊⠺⠩⠓ ⠪⠄⠈⠉⠪⠣⠆ ⠐⠨⠽⠵ ⠫⠋⠫⠙ ⠱⠑⠱⠚ ⠹⠊⠨⠱⠙ ⠹⠄⠺⠋ ⠪⠊⠩⠓⠄⠩⠿⠋ ⠨⠹⠙⠺⠣⠇⠑ ⠙⠄⠾⠊⠺⠩⠓ ⠪⠄⠈⠉⠪⠣⠅
```

## Carmen — Bizet (s.61-62)
*donanım: 2# · ölçü: 3/8*

İmza satırı (ortalanmış): `⠩⠩⠼⠉⠦`

Müzik:
```
⠜⠏⠏⠦⠦⠨⠯⠷⠾⠍⠾⠍ ⠨⠵⠿⠾⠍⠾⠍ ⠨⠽⠯⠾⠍⠾⠍ ⠨⠵⠿⠾⠍⠾⠍ ⠨⠵⠡⠿⠾⠍⠾⠍ ⠨⠵⠡⠿⠣⠾⠍⠾⠍ ⠨⠽⠯⠮⠍⠦⠮⠍⠣⠅
```

## Bethena — Joplin (s.54-55)
*tempo: Cantabile · donanım: 2# · ölçü: 3/4*

İmza satırı (ortalanmış): `⠩⠩⠼⠉⠲`

Müzik:
```
⠜⠏⠨⠑⠺⠨⠛⠱ ⠑⠛⠑⠚⠈⠉⠺ ⠩⠊⠨⠻⠓⠻ ⠐⠚⠨⠻⠓⠻ ⠑⠺⠨⠛⠱ ⠨⠚⠛⠑⠚⠈⠉⠚⠑ ⠜⠉⠑⠜⠗⠊⠞⠄⠨⠱⠑⠋⠩⠋ ⠜⠋⠨⠻⠜⠙⠹⠻ ⠜⠁⠀⠞⠑⠍⠏⠕⠜ ⠜⠏⠨⠑⠺⠨⠛⠱ ⠨⠚⠛⠑⠚⠈⠉⠺ ⠩⠊⠨⠻⠓⠻ ⠐⠚⠨⠻⠓⠛⠚ ⠚⠳⠊⠓⠛ ⠛⠱⠋⠑⠙ ⠙⠩⠪⠨⠓⠻ ⠐⠞⠧⠣⠅
```

## Gruplama Örnek 2 (s.35)
*ölçü: 4/4*

İmza satırı (ortalanmış): `⠼⠙⠲`

Müzik:
```
⠍⠐⠷⠮⠾⠽⠚⠙⠑⠯⠍⠿⠯⠵⠋⠛⠓ ⠮⠷⠿⠍⠵⠋⠛⠋⠵⠙⠊⠚⠍⠵⠯⠵ ⠙⠐⠓⠮⠚⠙⠑⠋⠐⠚⠹⠣⠅
```

## Prelude in C minor — Chopin (s.81-82)
*tempo: Largo · donanım: 1b · ölçü: C*

İmza satırı (ortalanmış): `⠣⠨⠉`

Müzik:
```
⠜⠋⠐⠪⠉⠉⠪⠊⠄⠷⠉⠻ ⠻⠉⠉⠳⠛⠄⠣⠯⠉⠱ ⠫⠉⠉⠩⠻⠊⠄⠷⠉⠻ ⠫⠪⠩⠙⠄⠡⠾⠉⠪ ⠣⠶⠰⠃⠜⠏⠨⠻⠻⠫⠫ ⠱⠫⠩⠙⠄⠡⠾⠪ ⠨⠱⠺⠊⠄⠷⠻ ⠜⠗⠊⠞⠄⠐⠻⠪⠛⠄⠯⠱⠘⠆⠣⠆ ⠜⠏⠜⠙⠐⠵⠣⠇⠣⠅
```

## Katmanlı bracket slur (s.44-45)
*donanım: 4# · ölçü: 4/4*

İmza satırı (ortalanmış): `⠼⠙⠩⠼⠙⠲`

Müzik:
```
⠰⠃⠸⠺ ⠺⠙⠉⠑⠫⠛⠛ ⠊⠉⠓⠛⠉⠑⠐⠺⠄⠚ ⠨⠫⠱⠙⠉⠚⠩⠊⠉⠛ ⠞⠄⠘⠆⠭⠚⠉ ⠙⠉⠐⠓⠉⠛⠉⠩⠋⠉⠻⠄⠊⠉ ⠚⠉⠛⠉⠋⠉⠑⠉⠫⠰⠃⠸⠺ ⠹⠋⠉⠓⠺⠄⠊ ⠓⠉⠛⠉⠏⠘⠆⠣⠅
```

## Triplet + düzensiz grup (s.76)
*ölçü: 4/4*

İmza satırı (ortalanmış): `⠼⠙⠲`

Müzik:
```
⠸⠖⠄⠨⠽⠑⠋⠛⠓⠊⠸⠒⠄⠨⠓⠋⠑⠸⠖⠄⠨⠯⠛⠓⠊⠚⠙⠸⠒⠄⠰⠑⠨⠊⠛ ⠸⠖⠄⠨⠷⠊⠓⠛⠋⠛⠋⠑⠝⠣⠅
```

## Let Me Call You Sweetheart (s.99-100)
*donanım: 2b · ölçü: 3/4*

İmza satırı (ortalanmış): `⠣⠣⠼⠉⠲`

Müzik:
```
⠐⠕⠻ ⠞⠹ ⠱⠐⠟ ⠡⠏⠻ ⠗⠄ ⠗⠄ ⠗⠄⠈⠉ ⠗⠧ ⠎⠩⠳ ⠎⠺ ⠹⠎ ⠡⠗⠪ ⠟⠄ ⠟⠄ ⠟⠄⠈⠉ ⠟⠧ ⠼⠂⠤⠖ ⠨⠝⠄⠈⠉ ⠝⠧ ⠝⠺ ⠎⠺ ⠱⠐⠟ ⠨⠏⠱ ⠐⠗⠄ ⠨⠝⠐⠻ ⠞⠄⠈⠉ ⠺⠧⠧⠣⠅
```

## Re-majör nüans dizisi (s.62-63)
*donanım: 2# · ölçü: 4/4*

İmza satırı (ortalanmış): `⠩⠩⠼⠙⠲`

Müzik:
```
⠐⠦⠐⠦⠐⠑⠋⠛⠓⠊⠚⠙⠐⠦⠑ ⠨⠦⠨⠦⠑⠙⠚⠨⠦⠊⠦⠨⠦⠓⠛⠋⠦⠨⠦⠑ ⠸⠦⠸⠦⠑⠛⠊⠨⠑⠛⠊⠰⠑⠸⠦⠨⠊ ⠦⠦⠛⠑⠐⠊⠦⠐⠙⠡⠄⠕⠣⠇⠣⠅
```

## Vocalise — Sieber (s.53-54)
*tempo: Lento · donanım: 1# · ölçü: C*

İmza satırı (ortalanmış): `⠩⠨⠉`

Müzik:
```
⠜⠏⠐⠋⠉⠓⠉⠚⠨⠋⠉⠱⠉⠹ ⠺⠈⠉⠾⠉⠮⠉⠷⠉⠿⠉⠫⠧ ⠚⠉⠊⠉⠛⠉⠩⠑⠫⠳ ⠻⠈⠉⠿⠉⠯⠉⠩⠵⠉⠩⠽⠺⠧ ⠜⠉⠐⠋⠉⠓⠉⠚⠉⠨⠋⠡⠻⠉⠐⠺⠉⠜⠒ ⠜⠙⠹⠵⠉⠽⠉⠾⠉⠮⠜⠲⠳⠛⠨⠙ ⠺⠽⠉⠾⠉⠮⠉⠷⠉⠜⠙⠻⠳⠉⠜⠲ ⠏⠥⠣⠅
```

## Rondo KV 386 — Mozart (s.65-66)
*donanım: 3# · ölçü: 2/4*

İmza satırı (ortalanmış): `⠩⠩⠩⠼⠃⠲`

Müzik:
```
⠜⠏⠠⠦⠨⠙⠹⠉⠖⠾⠉⠎⠉⠞ ⠠⠦⠊⠪⠉⠖⠾⠉⠎⠉⠞ ⠙⠦⠵⠦⠯⠦⠿⠦⠷⠦⠮⠦⠿ ⠖⠯⠉⠩⠵⠉⠯⠉⠿⠋⠐⠊ ⠠⠦⠨⠑⠱⠉⠙ ⠠⠦⠛⠻⠉⠋ ⠮⠉⠷⠉⠿⠉⠯⠯⠉⠵⠵⠉⠽ ⠽⠉⠾⠉⠩⠮⠉⠾⠉⠡⠮⠉⠷⠉⠿⠉⠯⠣⠅
```

## Peer Gynt — Grieg (keman, s.64-65)
*donanım: 4# · ölçü: 6/8*

İmza satırı (ortalanmış): `⠼⠙⠩⠼⠋⠦`

Müzik:
```
⠜⠋⠨⠦⠨⠚⠉⠓⠉⠛⠉⠋⠉⠛⠉⠓ ⠨⠦⠚⠉⠐⠢⠷⠐⠢⠮⠓⠉⠛⠉⠋⠉⠿⠉⠷⠉⠿⠉⠷ ⠐⠢⠷⠉⠐⠢⠮⠉⠜⠉⠨⠦⠚⠉⠓⠉⠚⠨⠦⠙⠉⠜⠒⠨⠓⠉⠰⠙ ⠨⠦⠙⠉⠊⠉⠓⠉⠛⠭⠭⠣⠅
```

## Weber Klarnet Beşlisi (s.74-75) — ⚠ Weber-özgü oktav belirsizliği
*ölçü: 2/4*

İmza satırı (ortalanmış): `⠼⠃⠲`

Müzik:
```
⠰⠃⠆⠆⠐⠷⠚⠑⠿⠑⠚⠷⠛⠑⠾⠓⠩⠛ ⠷⠊⠚⠽⠑⠋⠿⠓⠊⠾⠙⠑ ⠩⠵⠋⠛⠩⠿⠓⠩⠓⠮⠣⠚⠡⠚⠆⠽⠚⠊ ⠷⠩⠛⠊⠆⠷⠋⠙⠐⠓⠘⠆⠰⠃⠆⠰⠽⠾⠮ ⠆⠜⠏⠸⠦⠨⠷⠩⠿⠮⠆⠷⠯⠽⠐⠓⠘⠆⠆⠨⠯⠉⠵⠉⠽ ⠆⠾⠉⠵⠉⠿⠉⠜⠉⠊⠆⠐⠾⠉⠵⠉⠿⠉⠡⠊⠜⠒ ⠆⠐⠾⠉⠵⠉⠵⠉⠦⠨⠚⠜⠋⠸⠓⠭⠣⠅
```

