import { brfMetinedonSistemi } from './src/utils/brfOkuyucu.js';

function noktalariBRF(noktalar) {
  let bits = 0;
  for (const d of noktalar) {
    if (d >= 1 && d <= 6) bits |= 1 << (d - 1);
  }
  return String.fromCharCode(0x20 + bits);
}

const brfL = noktalariBRF([1,2,3]);
console.log("BRF char for [1,2,3]:", brfL);
console.log("Back to text:", brfMetinedonSistemi(brfL, true));
