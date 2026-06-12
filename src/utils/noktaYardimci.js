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
