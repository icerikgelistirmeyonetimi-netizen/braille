import { brfMetinedonSistemi } from './src/utils/brfOkuyucu.js';

const originalKasala = (s) => s;
// Wait, I can't inject.
// I will just copy the logic and add console.logs.

function run() {
  const b = [ [1,2,3], [1,3,5] ];
  let bH = true;
  let bHTumu = false;
  const buf = [];
  const harfYaz = (h) => {
    if (!h) return;
    if (bHTumu) buf.push(h.toLocaleUpperCase('tr'));
    else if (bH) {
      buf.push(h.charAt(0).toLocaleUpperCase('tr') + h.slice(1).toLocaleLowerCase('tr'));
      bH = false;
    }
    else buf.push(h.toLocaleLowerCase('tr'));
  };
  
  harfYaz('L');
  harfYaz('o');
  console.log("buf after:", buf);
  console.log("Joined:", buf.join(''));
}
run();
