// Fisher-Yates karıştırma — orijinal diziyi değiştirmez.
export function karistir(dizi) {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

// TTS'de kullanılan sıra sözcükleri (1. → birinci, 2. → ikinci, …).
export const HUCRE_SIRA_SOZ = ['birinci', 'ikinci', 'üçüncü', 'dördüncü', 'beşinci', 'altıncı'];
