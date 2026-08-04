// [1]      + 'ya','a' → "1. noktaya"
// [1,2]    + 'ya','a' → "1. ve 2. noktalara"
// [1,2,4]  + 'ya','a' → "1., 2. ve 4. noktalara"
export function noktaListesi(nArr, tekEk, cogulEk) {
  if (!nArr || nArr.length === 0) return '';
  if (nArr.length === 1) return `${nArr[0]}. nokta${tekEk}`;
  if (nArr.length === 2) return `${nArr[0]}. ve ${nArr[1]}. noktalar${cogulEk}`;
  const bas = nArr.slice(0, -1).map((n) => `${n}.`).join(', ');
  return `${bas} ve ${nArr[nArr.length - 1]}. noktalar${cogulEk}`;
}

// Kısayol: "X. noktadan" / "X. ve Y. noktalardan"
export function nlDan(nArr) {
  return noktaListesi(nArr, 'dan', 'dan');
}

// Yönergenin KAPANIŞ cümlesi — nokta sayısına göre TEKİL/ÇOĞUL (kullanıcı: "tek nokta ise
// noktalarına değil noktasına tıklayınız gibi bir ifade olmalı").
// ⚠ Tek noktada "sırayla" da DÜŞER: tek noktanın sırası olmaz ("Lütfen bu noktaya dokunun.").
// hucreler: number[][] (çok hücreli öğede TÜM hücrelerin noktaları toplanır) veya number[].
export function dokunmaKapanisi(hucreler) {
  const dizi = Array.isArray(hucreler) ? hucreler : [];
  const toplam = Array.isArray(dizi[0])
    ? dizi.reduce((t, n) => t + ((n && n.length) || 0), 0)
    : dizi.length;
  if (toplam === 0) return '';
  return toplam === 1
    ? 'Lütfen bu noktaya dokunun.'
    : 'Lütfen bu noktalara sırayla dokunun.';
}
