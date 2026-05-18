import { brfMetinedonSistemi } from './src/utils/brfOkuyucu.js';

const res = brfMetinedonSistemi("@'5", true);
console.log("res:", res);
console.log("res charcodes:", [...res].map(c => c.charCodeAt(0)));
