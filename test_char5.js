import { IKI_HARFLI_KISALTMALAR } from './src/data/braille.js';

const kisaltma = IKI_HARFLI_KISALTMALAR.find(k => k.sol.join(',') === '1,2,3' && k.sag.join(',') === '1,3,5');
console.log("Kisaltma:", kisaltma);
