import { metniBrailleyeCevirKisaltmali } from './src/utils/brailleCevir.js';
import { brfMetinedonSistemi } from './src/utils/brfOkuyucu.js';

// noktalariBRF implementation from BelgeBrf.jsx
function noktalariBRF(noktalar) {
  let bits = 0;
  for (const d of noktalar) {
    if (d >= 1 && d <= 6) bits |= 1 << (d - 1);
  }
  return String.fromCharCode(0x20 + bits);
}

function metniBRFe(hucreler) {
  return hucreler.map(noktalariBRF).join('');
}

const text = "What is Lorem Ipsum?\nLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const result = metniBrailleyeCevirKisaltmali(text);
const brf = metniBRFe(result.hucreler);

console.log("BRF Length:", brf.length);

const backToText = brfMetinedonSistemi(brf, true);
console.log("Back to text:");
console.log(backToText);
