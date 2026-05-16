import { metniBrailleyeCevir, metniBrailleyeCevirKisaltmali } from '../utils/brailleCevir.js';
import { brfMetinedonSistemi } from '../utils/brfOkuyucu.js';

self.onmessage = (e) => {
  const { text, kisaltmali, opts, requestId, action } = e.data || {};
  if (typeof text !== 'string' || typeof requestId !== 'number') {
    self.postMessage({ ok: false, requestId: requestId ?? -1, error: 'Geçersiz çeviri isteği' });
    return;
  }
  try {
    if (action === 'brfToText') {
      const resultText = brfMetinedonSistemi(text, kisaltmali, opts);
      self.postMessage({
        ok: true,
        requestId,
        resultText,
      });
      return;
    }
    
    const r = kisaltmali
      ? metniBrailleyeCevirKisaltmali(text, opts)
      : metniBrailleyeCevir(text, opts);
    self.postMessage({
      ok: true,
      requestId,
      hucreler: r.hucreler,
      esleme: r.esleme,
      kaynak: text,
    });
  } catch (err) {
    self.postMessage({
      ok: false,
      requestId,
      error: err && err.message ? String(err.message) : String(err),
    });
  }
};
