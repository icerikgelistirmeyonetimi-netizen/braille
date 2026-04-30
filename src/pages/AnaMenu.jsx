import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import TanitimTuru, { turuSifirla } from '../components/TanitimTuru.jsx';
import GorunumGecisi from '../components/GorunumGecisi.jsx';

// İkonlar – sade çizgi tabanlı SVG'ler. currentColor kullanılır,
// böylece tema rengine uyum sağlar.
const Ikon = {
  hucre: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="20" cy="16" r="6" fill="currentColor" />
      <circle cx="44" cy="16" r="6" fill="currentColor" />
      <circle cx="20" cy="32" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="44" cy="32" r="6" fill="currentColor" />
      <circle cx="20" cy="48" r="6" fill="currentColor" />
      <circle cx="44" cy="48" r="6" fill="currentColor" opacity="0.35" />
    </svg>
  ),
  harf: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="42"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">Aa</text>
    </svg>
  ),
  rakam: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="38"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">123</text>
    </svg>
  ),
  noktalama: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="42"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">,?!</text>
    </svg>
  ),
  test: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 10 h28 l8 8 v36 a2 2 0 0 1 -2 2 H14 a2 2 0 0 1 -2 -2 V12 a2 2 0 0 1 2 -2 z" />
      <path d="M22 32 l6 6 l14 -14" />
    </svg>
  ),
  ayarlar: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="7" />
      <path d="M32 6 v8 M32 50 v8 M6 32 h8 M50 32 h8
               M14 14 l6 6 M44 44 l6 6 M14 50 l6 -6 M44 20 l6 -6" />
    </svg>
  ),
  klavye: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="16" width="52" height="32" rx="4" />
      <circle cx="18" cy="26" r="2.5" fill="currentColor" />
      <circle cx="32" cy="26" r="2.5" fill="currentColor" />
      <circle cx="46" cy="26" r="2.5" fill="currentColor" />
      <path d="M16 38 h32" />
    </svg>
  ),
  yazma: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 50 L40 20 l8 8 L18 58 H10 z" />
      <path d="M36 24 l8 8" />
      <path d="M48 12 l4 4" />
    </svg>
  ),
  cumle: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 18 h48 M8 32 h40 M8 46 h32" />
      <path d="M50 50 L58 42 l4 4 L54 54 z" fill="currentColor" />
    </svg>
  ),
  serbest: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 16 h44" />
      <path d="M10 28 h36" />
      <path d="M10 40 h44" />
      <path d="M10 52 h28" />
    </svg>
  ),
  modul1: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14 h28 a8 8 0 0 1 8 8 v32 H18 a8 8 0 0 1 -8 -8 z" />
      <path d="M18 24 h22 M18 34 h22 M18 44 h14" />
    </svg>
  ),
  modul2: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="22" width="48" height="28" rx="5" />
      <circle cx="20" cy="32" r="2.6" fill="currentColor" />
      <circle cx="32" cy="32" r="2.6" fill="currentColor" />
      <circle cx="44" cy="32" r="2.6" fill="currentColor" />
      <path d="M18 42 h28" />
      <path d="M24 14 l4 -4 l4 4 l4 -4 l4 4" />
    </svg>
  ),
  modul3: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 12 h36 a4 4 0 0 1 4 4 v40 a4 4 0 0 1 -4 4 H10 z" />
      <path d="M18 22 h22 M18 32 h22 M18 42 h14" />
      <text x="50" y="22" fontSize="14" fontWeight="800" fill="currentColor" stroke="none">K</text>
    </svg>
  ),
  birHarf: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="40"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">B</text>
      <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.35" />
    </svg>
  ),
  ikiHarf: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="34"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">bd</text>
    </svg>
  ),
  hece: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="44" textAnchor="middle" fontSize="24"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">ba·be</text>
    </svg>
  ),
  kok: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="22" cy="32" r="5" fill="currentColor" />
      <text x="44" y="42" textAnchor="middle" fontSize="24"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">d</text>
      <text x="22" y="56" textAnchor="middle" fontSize="10"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="700"
            fill="currentColor" opacity="0.7">5</text>
    </svg>
  ),
  parca: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="16" cy="22" r="4" fill="currentColor" />
      <circle cx="16" cy="36" r="4" fill="currentColor" />
      <text x="44" y="42" textAnchor="middle" fontSize="22"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">-lık</text>
    </svg>
  ),
  modul4: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 12 h36 a4 4 0 0 1 4 4 v40 a4 4 0 0 1 -4 4 H10 z" />
      <text x="30" y="40" textAnchor="middle" fontSize="22" fontWeight="800"
            fill="currentColor" stroke="none">.,?!</text>
    </svg>
  ),
  noktalamaModul: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="38"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">.,;:</text>
    </svg>
  ),
  ozelIsaret: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="38"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">`*^</text>
    </svg>
  ),
  modul5: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8 h28 a8 8 0 0 1 8 8 v40 a4 4 0 0 1 -4 4 H14 a4 4 0 0 1 -4 -4 V12 a4 4 0 0 1 4 -4 z" />
      <path d="M22 22 h20 M22 32 h20 M22 42 h12" />
      <path d="M50 8 l4 4 l-4 4" />
    </svg>
  ),
  kuranHarf: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="50" textAnchor="middle" fontSize="44"
            fontFamily="'Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" direction="rtl">ب</text>
    </svg>
  ),
  harake: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="50" textAnchor="middle" fontSize="44"
            fontFamily="'Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" direction="rtl">َ</text>
      <text x="32" y="36" textAnchor="middle" fontSize="22"
            fontFamily="'Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" direction="rtl">ا</text>
    </svg>
  ),
  tecvid: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 40 q 10 -22 22 0 q 10 22 22 0" />
      <circle cx="32" cy="50" r="3" fill="currentColor" />
    </svg>
  ),
  kuranKelime: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="44" textAnchor="middle" fontSize="22"
            fontFamily="'Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" direction="rtl">بِسْمِ</text>
    </svg>
  ),
  modul6: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="10" width="44" height="44" rx="6" />
      <text x="32" y="42" textAnchor="middle" fontSize="22" fontWeight="800"
            fill="currentColor" stroke="none">π</text>
    </svg>
  ),
  matRakam: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="34"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">1·2·3</text>
    </svg>
  ),
  matSembol: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="34"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">+−×÷</text>
    </svg>
  ),
  geometri: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="14,50 32,18 50,50" />
      <circle cx="48" cy="18" r="6" />
    </svg>
  ),
  matIfade: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="42" textAnchor="middle" fontSize="22"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">2+3=5</text>
    </svg>
  ),
  modul7: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="6" fill="currentColor" />
      <ellipse cx="32" cy="32" rx="22" ry="9" />
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)" />
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(120 32 32)" />
    </svg>
  ),
  yunan: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="36"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">α β γ</text>
    </svg>
  ),
  fenSembol: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="44" textAnchor="middle" fontSize="22"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">°⇌→</text>
    </svg>
  ),
  kimya: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 8 v18 L12 50 a4 4 0 0 0 4 6 h32 a4 4 0 0 0 4 -6 L40 26 V8" />
      <path d="M22 8 h20" />
    </svg>
  ),
  fizik: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="44" textAnchor="middle" fontSize="22"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">F=ma</text>
    </svg>
  ),
  modul8: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 50 V14 h20 v8 h-20" />
      <circle cx="20" cy="50" r="6" fill="currentColor" />
      <circle cx="40" cy="46" r="6" fill="currentColor" />
    </svg>
  ),
  nota: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="38"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">♩ ♪</text>
    </svg>
  ),
  sure: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="44" textAnchor="middle" fontSize="22"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">𝅝 𝅗𝅥 ♩ ♪</text>
    </svg>
  ),
  muzikSembol: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="46" textAnchor="middle" fontSize="36"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">♯ ♭</text>
    </svg>
  ),
  muzikDizi: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="44" textAnchor="middle" fontSize="20"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">do-re-mi</text>
    </svg>
  )
};

const MODULLER = [
  {
    id: 'modul1',
    baslik: 'Modül 1',
    altBaslik: 'Braille Öğrenme',
    ikon: Ikon.modul1,
    ogeler: [
      { yol: '/hucre',     baslik: 'Hücreyi Tanı',         ikon: Ikon.hucre },
      { yol: '/harfler',   baslik: 'Harf Eğitimi',          ikon: Ikon.harf },
      { yol: '/rakamlar',  baslik: 'Rakam Eğitimi',         ikon: Ikon.rakam },
      { yol: '/noktalama', baslik: 'Noktalama İşaretleri',  ikon: Ikon.noktalama },
      { yol: '/test',      baslik: 'Test / Sınav',          ikon: Ikon.test }
    ]
  },
  {
    id: 'modul2',
    baslik: 'Modül 2',
    altBaslik: 'Braille ile Yazma',
    ikon: Ikon.modul2,
    ogeler: [
      { yol: '/yazma-egitim',         baslik: 'Perkins Klavye Eğitimi', ikon: Ikon.klavye },
      { yol: '/yazma-yonergeli',      baslik: 'Yönergeli Yazma',        ikon: Ikon.yazma },
      { yol: '/yazma-yonergeli-cumle', baslik: 'Yönergeli Cümle Yazma',  ikon: Ikon.cumle },
      { yol: '/yazma-serbest',        baslik: 'Serbest Yazma',          ikon: Ikon.serbest }
    ]
  },
  {
    id: 'modul3',
    baslik: 'Modül 3',
    altBaslik: 'Kısaltma Sistemi',
    ikon: Ikon.modul3,
    ogeler: [
      { yol: '/kisaltma-bir-harfli',     baslik: 'Bir Harfli Kısaltmalar',     ikon: Ikon.birHarf },
      { yol: '/kisaltma-iki-harfli',     baslik: 'İki Harfli Kısaltmalar',     ikon: Ikon.ikiHarf },
      { yol: '/kisaltma-hece',           baslik: 'Hece Kısaltmaları',          ikon: Ikon.hece },
      { yol: '/kisaltma-kelime-koku',    baslik: 'Kelime Kökü Kısaltmaları',   ikon: Ikon.kok },
      { yol: '/kisaltma-kelime-parcasi', baslik: 'Kelime Parçası Kısaltmaları', ikon: Ikon.parca },
      { yol: '/test-kisaltma',           baslik: 'Test / Sınav',                ikon: Ikon.test }
    ]
  },
  {
    id: 'modul4',
    baslik: 'Modül 4',
    altBaslik: 'Noktalama ve Özel İşaretler',
    ikon: Ikon.modul4,
    ogeler: [
      { yol: '/noktalama-isaretleri', baslik: 'Noktalama İşaretleri',  ikon: Ikon.noktalamaModul },
      { yol: '/ozel-isaretler',        baslik: 'Diğer Özel İşaretler', ikon: Ikon.ozelIsaret },
      { yol: '/test-noktalama',        baslik: 'Test / Sınav',           ikon: Ikon.test }
    ]
  },
  {
    id: 'modul5',
    baslik: 'Modül 5',
    altBaslik: "Kur'an Eğitimi",
    ikon: Ikon.modul5,
    ogeler: [
      { yol: '/kuran-harfler',   baslik: 'Arap Harfleri',     ikon: Ikon.kuranHarf },
      { yol: '/kuran-harekeler', baslik: 'Harekeler',          ikon: Ikon.harake },
      { yol: '/kuran-tecvid',    baslik: 'Tecvid İşaretleri',  ikon: Ikon.tecvid },
      { yol: '/kuran-heceler',   baslik: 'Hece Okuma',         ikon: Ikon.hece },
      { yol: '/kuran-kelimeler', baslik: 'Kelime Okuma',       ikon: Ikon.kuranKelime },
      { yol: '/test-kuran',      baslik: 'Test / Sınav',       ikon: Ikon.test }
    ]
  },
  {
    id: 'modul6',
    baslik: 'Modül 6',
    altBaslik: 'Matematik Braille',
    ikon: Ikon.modul6,
    ogeler: [
      { yol: '/mat-rakamlar',  baslik: 'Rakamlar',           ikon: Ikon.matRakam },
      { yol: '/mat-semboller', baslik: 'İşlem Sembolleri',   ikon: Ikon.matSembol },
      { yol: '/mat-geometri',  baslik: 'Geometri',            ikon: Ikon.geometri },
      { yol: '/mat-ifadeler',  baslik: 'İfade Okuma',         ikon: Ikon.matIfade },
      { yol: '/test-matematik', baslik: 'Test / Sınav',       ikon: Ikon.test }
    ]
  },
  {
    id: 'modul7',
    baslik: 'Modül 7',
    altBaslik: 'Fen Bilimleri',
    ikon: Ikon.modul7,
    ogeler: [
      { yol: '/fen-yunan',     baslik: 'Yunan Harfleri',          ikon: Ikon.yunan },
      { yol: '/fen-semboller', baslik: 'Birim ve Semboller',      ikon: Ikon.fenSembol },
      { yol: '/fen-kimya',     baslik: 'Kimyasal Formüller',      ikon: Ikon.kimya },
      { yol: '/fen-fizik',     baslik: 'Fizik Formülleri',        ikon: Ikon.fizik },
      { yol: '/test-fen',      baslik: 'Test / Sınav',            ikon: Ikon.test }
    ]
  },
  {
    id: 'modul8',
    baslik: 'Modül 8',
    altBaslik: 'Müzik Braille',
    ikon: Ikon.modul8,
    ogeler: [
      { yol: '/muzik-notalar',   baslik: 'Notalar (Do-Si)',     ikon: Ikon.nota },
      { yol: '/muzik-sureler',   baslik: 'Nota Süreleri',       ikon: Ikon.sure },
      { yol: '/muzik-semboller', baslik: 'Anahtar ve Semboller', ikon: Ikon.muzikSembol },
      { yol: '/muzik-diziler',   baslik: 'Dizi Okuma',          ikon: Ikon.muzikDizi },
      { yol: '/test-muzik',      baslik: 'Test / Sınav',        ikon: Ikon.test }
    ]
  }
];

export default function AnaMenu() {
  const navigate = useNavigate();
  const [turAcik, setTurAcik] = useState(false);
  const [aktifModul, setAktifModul] = useState(() => {
    try { return sessionStorage.getItem('aktifModul') || 'modul1'; }
    catch { return 'modul1'; }
  });

  useEffect(() => {
    const ANAHTAR = 'braille-hosgeldin-okundu';
    let metin;
    try {
      if (localStorage.getItem(ANAHTAR)) {
        metin = 'Ana menü. Lütfen bir bölüm seçin.';
      } else {
        metin = 'Braille Eğitim uygulamasına hoş geldiniz. Lütfen bir bölüm seçin.';
        localStorage.setItem(ANAHTAR, '1');
      }
    } catch {
      metin = 'Ana menü. Lütfen bir bölüm seçin.';
    }
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      // Başka sayfaya geçildiğinde menü yönergesi sıraya kalmasın.
      konusmayiDurdur();
    };
  }, []);

  const modul = MODULLER.find((m) => m.id === aktifModul) || MODULLER[0];

  const modulSec = (id) => {
    setAktifModul(id);
    try { sessionStorage.setItem('aktifModul', id); } catch { /* ignore */ }
    const m = MODULLER.find((x) => x.id === id);
    if (m) konus(`${m.baslik}, ${m.altBaslik}`, { kesintiyle: true });
  };

  return (
    <div className="page anasayfa">
      {turAcik && (
        <TanitimTuru zorunlu={false} onKapat={() => setTurAcik(false)} />
      )}
      {!turAcik && <TanitimTuru />}

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span className="logo" aria-hidden="true">
            <svg viewBox="0 0 64 64" focusable="false">
              <rect x="4" y="4" width="56" height="56" rx="14"
                    fill="currentColor" opacity="0.12" />
              <circle cx="22" cy="18" r="5" fill="currentColor" />
              <circle cx="42" cy="18" r="5" fill="currentColor" />
              <circle cx="22" cy="32" r="5" fill="currentColor" />
              <circle cx="42" cy="32" r="5" fill="currentColor" opacity="0.35" />
              <circle cx="22" cy="46" r="5" fill="currentColor" opacity="0.35" />
              <circle cx="42" cy="46" r="5" fill="currentColor" />
            </svg>
          </span>
          <h1 className="banner-baslik" style={{ margin: 0, fontSize: '1.5em', whiteSpace: 'nowrap' }}>
            Braille Eğitim
          </h1>
        </div>
        <GorunumGecisi />
      </header>

      <div className="modul-layout">
        <aside className="modul-yan" aria-label="Modüller">
          <div className="modul-yan-baslik" aria-hidden="true">Modüller</div>
          {MODULLER.map((m) => (
            <button
              key={m.id}
              type="button"
              className={'modul-sekme' + (m.id === aktifModul ? ' aktif' : '')}
              onClick={() => modulSec(m.id)}
              aria-pressed={m.id === aktifModul}
              aria-label={`${m.baslik}: ${m.altBaslik}`}
            >
              <span className="modul-sekme-ikon" aria-hidden="true">{m.ikon}</span>
              <span className="modul-sekme-yazi">
                <span className="modul-sekme-baslik">{m.baslik}</span>
                <span className="modul-sekme-alt">{m.altBaslik}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            className="modul-sekme modul-ayarlar"
            onClick={() => navigate('/ayarlar')}
            aria-label="Ayarlar"
          >
            <span className="modul-sekme-ikon" aria-hidden="true">{Ikon.ayarlar}</span>
            <span className="modul-sekme-yazi">
              <span className="modul-sekme-baslik">Ayarlar</span>
            </span>
          </button>
        </aside>

        <section className="modul-icerik" aria-label={`${modul.baslik} bölümleri`}>
          <h2 className="modul-icerik-baslik">{modul.baslik} — {modul.altBaslik}</h2>
          <nav className="menu-grid" aria-label={modul.baslik}>
            {modul.ogeler.map((m) => (
              <button
                key={m.yol}
                type="button"
                className="menu-card"
                onClick={() => navigate(m.yol)}
                aria-label={m.baslik}
              >
                <span className="menu-card-ikon" aria-hidden="true">{m.ikon}</span>
                <span className="menu-card-yazi">{m.baslik}</span>
              </button>
            ))}
          </nav>
        </section>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => { turuSifirla(); setTurAcik(true); }}
          style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'var(--accent)' }}
          aria-label="Tanıtım turunu yeniden göster"
        >
          Tanıtım Turunu Tekrar Göster
        </button>
      </div>
    </div>
  );
}
