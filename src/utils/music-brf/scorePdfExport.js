// Skor çizim alanını gerçek PDF olarak dışa aktarır.
// - Bravura SMuFL fontunu base64 olarak SVG'ye gömer (zaman imzası vb. PUA
//   glifleri html2canvas'ta "?" olmasın).
// - Her dize (satır) ayrı yakalanıp sayfaya yerleştirilir; sayfa sonunda
//   dize ortadan ikiye bölünmez, sığmıyorsa yeni sayfaya geçer.

let _bravuraDataUrl = null;

async function bravuraDataUrl() {
  if (_bravuraDataUrl) return _bravuraDataUrl;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const res = await fetch(`${base}/fonts/bravura/BravuraText.woff2`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  _bravuraDataUrl = `data:font/woff2;base64,${btoa(binary)}`;
  return _bravuraDataUrl;
}

// SVG içine gömülecek font + sınıf kuralları (dış stylesheet img-svg'ye taşınmaz)
function fontStyleElement(dataUrl) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  s.setAttribute('data-pdf-font', '1');
  s.textContent = `
@font-face{font-family:'Bravura Text';src:url('${dataUrl}') format('woff2');font-display:block;}
.muzik-time-sig-digit{font-family:'Bravura Text','Cambria Math',serif;font-size:48px;fill:#111827;}
.muzik-time-sig-glyph{font-family:'Bravura Text','Cambria Math',serif;font-size:34px;font-weight:800;fill:#111827;}
.muzik-key-sig-glyph{font-family:'Bravura Text','Cambria Math',serif;font-size:20px;font-weight:700;fill:#111827;}
.muzik-clef,.muzik-nuans-glyph,.muzik-ornament-glyph,.muzik-dynamic{font-family:'Bravura Text','Cambria Math',serif;}`;
  return s;
}

export async function skorAlaniPdfIndir(skorEl, { dosyaAdi = 'muzik-skor' } = {}) {
  if (!skorEl) throw new Error('Skor alanı bulunamadı');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  // Bravura'nın gerçekten yüklü olmasını bekle (PUA glifleri için)
  const dataUrl = await bravuraDataUrl();
  try { await document.fonts.ready; } catch { /* yoksay */ }

  // Her dize sarmalı (ilk satırda başlık/besteci de bu sarmalın içinde)
  const satirlar = Array.from(skorEl.children).filter(
    (c) => c.querySelector && c.querySelector('svg')
  );
  const hedefler = satirlar.length ? satirlar : [skorEl];

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const kenar = 6;
  const imgW = pageW - kenar * 2;          // tam genişlik
  const tamY = pageH - kenar * 2;          // sayfa içerik yüksekliği
  let y = kenar;
  let sayfadaIcerikVar = false;

  for (const el of hedefler) {
    // Fontu bu satırın svg'lerine göm (yakalama sonrası geri al)
    const eklenen = [];
    el.querySelectorAll('svg').forEach((svg) => {
      const st = fontStyleElement(dataUrl);
      svg.insertBefore(st, svg.firstChild);
      eklenen.push(st);
    });

    let canvas;
    try {
      canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: skorEl.scrollWidth || el.scrollWidth,
      });
    } finally {
      eklenen.forEach((st) => st.remove());
    }

    const h = imgW * (canvas.height / canvas.width);
    // Sayfada içerik varsa ve bu dize sığmıyorsa yeni sayfa (dizeyi bölme)
    if (sayfadaIcerikVar && y + h > pageH - kenar) {
      pdf.addPage();
      y = kenar;
      sayfadaIcerikVar = false;
    }
    const imgData = canvas.toDataURL('image/png');

    if (h <= tamY) {
      // Tek dize tek sayfaya sığar
      pdf.addImage(imgData, 'PNG', kenar, y, imgW, h);
      y += h + 2;
      sayfadaIcerikVar = true;
    } else {
      // Çok uzun tek dize (nadiren): kendi içinde dikey dilimle
      let kalan = h;
      let konum = 0;
      while (kalan > 0) {
        pdf.addImage(imgData, 'PNG', kenar, kenar - konum, imgW, h);
        kalan -= tamY;
        konum += tamY;
        if (kalan > 0) pdf.addPage();
      }
      y = kenar;
      sayfadaIcerikVar = false;
    }
  }

  const ad = (dosyaAdi || 'muzik-skor').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, '').trim() || 'muzik-skor';
  pdf.save(`${ad}.pdf`);
}
