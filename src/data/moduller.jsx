import React from 'react';

// İkonlar – sade çizgi tabanlı SVG'ler. currentColor kullanılır,
// böylece tema rengine uyum sağlar.
export const Ikon = {
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
  ),
};

export const MODULLER = [
  {
    id: 'modul1',
    baslik: 'Modül 1',
    altBaslik: 'Braille Öğrenme',
    ikon: Ikon.modul1,
    ogeler: [
      { yol: '/hucre',     baslik: 'Hücreyi Tanı',         ikon: Ikon.hucre },
      { yol: '/harfler',   baslik: 'Harf Eğitimi',          ikon: Ikon.harf,     anahtar: 'harfler',   toplam: 29 },
      { yol: '/rakamlar',  baslik: 'Rakam Eğitimi',         ikon: Ikon.rakam,    anahtar: 'rakamlar',  toplam: 10 },
      { yol: '/noktalama', baslik: 'Noktalama İşaretleri',  ikon: Ikon.noktalama, anahtar: 'noktalama', toplam: 8 },
      { yol: '/test',      baslik: 'Test / Sınav',          ikon: Ikon.test }
    ]
  },
  {
    id: 'modul3',
    baslik: 'Modül 2',
    altBaslik: 'Kısaltma Sistemi',
    ikon: Ikon.modul3,
    ogeler: [
      { yol: '/kisaltma-bir-harfli',     baslik: 'Bir Harfli Kısaltmalar',      ikon: Ikon.birHarf, anahtar: 'kisaltma-bir-harfli',     toplam: 28 },
      { yol: '/kisaltma-iki-harfli',     baslik: 'İki Harfli Kısaltmalar',      ikon: Ikon.ikiHarf, anahtar: 'kisaltma-iki-harfli',     toplam: 87 },
      { yol: '/kisaltma-hece',           baslik: 'Hece Kısaltmaları',           ikon: Ikon.hece,    anahtar: 'kisaltma-hece',           toplam: 22 },
      { yol: '/kisaltma-kelime-koku',    baslik: 'Kelime Kökü Kısaltmaları',    ikon: Ikon.kok,     anahtar: 'kisaltma-kelime-koku',    toplam: 46 },
      { yol: '/kisaltma-kelime-parcasi', baslik: 'Kelime Parçası Kısaltmaları', ikon: Ikon.parca,   anahtar: 'kisaltma-kelime-parcasi', toplam: 39 },
      { yol: '/test-kisaltma',           baslik: 'Test / Sınav',                ikon: Ikon.test }
    ]
  },
  {
    id: 'modul4',
    baslik: 'Modül 3',
    altBaslik: 'Noktalama ve Özel İşaretler',
    ikon: Ikon.modul4,
    ogeler: [
      { yol: '/noktalama-isaretleri', baslik: 'Noktalama İşaretleri',  ikon: Ikon.noktalamaModul, anahtar: 'noktalama-isaretleri', toplam: 15 },
      { yol: '/ozel-isaretler',       baslik: 'Diğer Özel İşaretler',  ikon: Ikon.ozelIsaret,     anahtar: 'ozel-isaretler',       toplam: 11 },
      { yol: '/test-noktalama',       baslik: 'Test / Sınav',           ikon: Ikon.test }
    ]
  },
  {
    id: 'modul2',
    baslik: 'Modül 4',
    altBaslik: 'Braille ile Yazma',
    ikon: Ikon.modul2,
    ogeler: [
      { yol: '/yazma-egitim',          baslik: 'Perkins Klavye Eğitimi', ikon: Ikon.klavye },
      { yol: '/yazma-yonergeli',       baslik: 'Yönergeli Yazma',        ikon: Ikon.yazma,  anahtar: 'yazma-yonergeli',       toplam: 500 },
      { yol: '/yazma-yonergeli-cumle', baslik: 'Yönergeli Cümle Yazma',  ikon: Ikon.cumle,  anahtar: 'yazma-yonergeli-cumle', toplam: 78 },
      { yol: '/yazma-serbest',         baslik: 'Serbest Yazma',          ikon: Ikon.serbest }
    ]
  },
  {
    id: 'modul5',
    baslik: 'Modül 5',
    altBaslik: "Kur'an Eğitimi",
    ikon: Ikon.modul5,
    ogeler: [
      { yol: '/kuran-harfler',   baslik: 'Arap Harfleri',      ikon: Ikon.kuranHarf, anahtar: 'kuran-harfler',   toplam: 31 },
      { yol: '/kuran-harekeler', baslik: 'Harekeler',           ikon: Ikon.harake,    anahtar: 'kuran-harekeler', toplam: 8 },
      { yol: '/kuran-tecvid',    baslik: 'Tecvid İşaretleri',  ikon: Ikon.tecvid,    anahtar: 'kuran-tecvid',    toplam: 7 },
      { yol: '/kuran-heceler',   baslik: 'Hece Okuma',          ikon: Ikon.hece, anahtar: 'kuran-kelime-hece', toplam: 15 },
      { yol: '/kuran-kelimeler', baslik: 'Kelime Okuma',        ikon: Ikon.kuranKelime, anahtar: 'kuran-kelime-kelime', toplam: 145 },
      { yol: '/kuran-sureler',   baslik: 'Kısa Sureler',        ikon: Ikon.kuranKelime },
      { yol: '/test-kuran',      baslik: 'Test / Sınav',        ikon: Ikon.test }
    ]
  },
  {
    id: 'modul6',
    baslik: 'Modül 6',
    altBaslik: 'Matematik Braille',
    ikon: Ikon.modul6,
    ogeler: [
      { yol: '/mat-rakamlar',   baslik: 'Rakamlar',           ikon: Ikon.matRakam,  anahtar: 'mat-rakamlar',    toplam: 10 },
      { yol: '/mat-semboller',  baslik: 'İşlem Sembolleri',   ikon: Ikon.matSembol, anahtar: 'mat-semboller',   toplam: 15 },
      { yol: '/mat-geometri',   baslik: 'Geometri',            ikon: Ikon.geometri,  anahtar: 'mat-geometri',    toplam: 7 },
      { yol: '/mat-ifadeler',   baslik: 'İfade Okuma',         ikon: Ikon.matIfade,  anahtar: 'matematik-ifade', toplam: 5 },
      { yol: '/test-matematik', baslik: 'Test / Sınav',        ikon: Ikon.test }
    ]
  },
  {
    id: 'modul7',
    baslik: 'Modül 7',
    altBaslik: 'Fen Bilimleri',
    ikon: Ikon.modul7,
    ogeler: [
      { yol: '/fen-yunan',     baslik: 'Yunan Harfleri',     ikon: Ikon.yunan,     anahtar: 'fen-yunan',            toplam: 11 },
      { yol: '/fen-semboller', baslik: 'Birim ve Semboller', ikon: Ikon.fenSembol, anahtar: 'fen-semboller',        toplam: 8 },
      { yol: '/fen-kimya',     baslik: 'Kimyasal Formüller', ikon: Ikon.kimya,     anahtar: 'fen-kimya-formuller',  toplam: 5 },
      { yol: '/fen-fizik',     baslik: 'Fizik Formülleri',   ikon: Ikon.fizik,     anahtar: 'fen-fizik-formuller',  toplam: 2 },
      { yol: '/test-fen',      baslik: 'Test / Sınav',       ikon: Ikon.test }
    ]
  },
  {
    id: 'modul8',
    baslik: 'Modül 8',
    altBaslik: 'Müzik Braille',
    ikon: Ikon.modul8,
    ogeler: [
      { yol: '/muzik-notalar',   baslik: 'Notalar (Do-Si)',      ikon: Ikon.nota,       anahtar: 'muzik-notalar',   toplam: 7 },
      { yol: '/muzik-sureler',   baslik: 'Nota Süreleri',        ikon: Ikon.sure },
      { yol: '/muzik-semboller', baslik: 'Anahtar ve Semboller', ikon: Ikon.muzikSembol, anahtar: 'muzik-semboller', toplam: 7 },
      { yol: '/muzik-diziler',   baslik: 'Dizi Okuma',           ikon: Ikon.muzikDizi,   anahtar: 'muzik-dizi',      toplam: 3 },
      { yol: '/test-muzik',      baslik: 'Test / Sınav',         ikon: Ikon.test }
    ]
  }
];
