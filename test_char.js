import { hucreyiKarakteryap } from './src/utils/brailleCevir.js';
import { _NOKTA_TERS, _HECE_TERS } from './src/utils/brfOkuyucu.js';

console.log("hucreyiKarakteryap([1,2,3]):", hucreyiKarakteryap([1,2,3]));
console.log("NOKTA_TERS for 1,2,3:", _NOKTA_TERS?.get('1,2,3'));
console.log("HECE_TERS for 1,2,3:", _HECE_TERS?.get('1,2,3'));
