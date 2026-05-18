import { metniBrailleyeCevir } from './src/utils/brailleCevir.js';
import { brfMetinedonSistemi } from './src/utils/brfOkuyucu.js';

function noktalariBRF(noktalar) {
  let bits = 0;
  for (const d of noktalar) {
    if (d >= 1 && d <= 6) bits |= 1 << (d - 1);
  }
  return String.fromCharCode(0x20 + bits);
}

const brf = ['b', 'l', 'e', 'd'].map(x => metniBrailleyeCevir(x).hucreler[0]).map(noktalariBRF).join('');
console.log('bled ->', brfMetinedonSistemi(brf, true));
