import React from 'react';
import {
  MATEMATIK_SEMBOLLER,
  MATEMATIK_OLCULER,
  GEOMETRI_SEMBOLLERI,
  MATEMATIK_IFADELER
} from './matematik.js';
import { KURAN_HECELERI, KURAN_KELIMELERI_TEMEL } from './kuran.js';
import { MUZIK_BOLUM_GRUPLARI } from './muzik.js';
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
  arama: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="28" cy="28" r="16" />
      <path d="M40 40 l16 16" />
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
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" direction="rtl">ب</text>
    </svg>
  ),
  harake: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="50" textAnchor="middle" fontSize="44"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" direction="rtl">َ</text>
      <text x="32" y="36" textAnchor="middle" fontSize="22"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
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
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" direction="rtl">بِسْمِ</text>
    </svg>
  ),
  cezmSedde: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="20" y="48" textAnchor="middle" fontSize="30"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">بّ</text>
      <text x="44" y="48" textAnchor="middle" fontSize="30"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">بْ</text>
    </svg>
  ),
  tenvin: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="12" y="46" textAnchor="middle" fontSize="22"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">نً</text>
      <text x="32" y="46" textAnchor="middle" fontSize="22"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">نٌ</text>
      <text x="52" y="46" textAnchor="middle" fontSize="22"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">نٍ</text>
    </svg>
  ),
  taMerbuta: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="50" textAnchor="middle" fontSize="44"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">ة</text>
    </svg>
  ),
  medHarf: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="44" textAnchor="middle" fontSize="28"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">ا و ي</text>
    </svg>
  ),
  mukadderMed: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="50" textAnchor="middle" fontSize="40"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">اٰ</text>
    </svg>
  ),
  elifZaid: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="28" y="50" textAnchor="middle" fontSize="42"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor" opacity="0.4">ا</text>
      <circle cx="46" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    </svg>
  ),
  hemze: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="50" textAnchor="middle" fontSize="44"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">ء</text>
    </svg>
  ),
  hemzeVasl: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="20" y="50" textAnchor="middle" fontSize="36"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">ٱ</text>
      <text x="46" y="50" textAnchor="middle" fontSize="36"
            fontFamily="'Amasya','Traditional Arabic','Amiri','Segoe UI',serif" fontWeight="800"
            fill="currentColor">أ</text>
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
  matOlcu: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <text x="32" y="43" textAnchor="middle" fontSize="24"
            fontFamily="Segoe UI, Tahoma, sans-serif" fontWeight="800"
            fill="currentColor">m²</text>
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
  modulYabanci: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="18" />
      <ellipse cx="32" cy="32" rx="18" ry="8.25" />
      <path d="M32 14 L32 50" />
      <path d="M17.03 22 A18 18 0 0 1 46.97 22" />
      <path d="M17.03 42 A18 18 0 0 0 46.97 42" />
    </svg>
  ),
  araclar: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14 h36 a4 4 0 0 1 4 4 v28 a4 4 0 0 1 -4 4 H14 a4 4 0 0 1 -4 -4 V18 a4 4 0 0 1 4 -4 z" />
      <path d="M10 26 h44" />
      <path d="M22 38 h20" />
    </svg>
  ),
  belgeBrf: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8 h24 l12 12 v36 a2 2 0 0 1-2 2 H14 a2 2 0 0 1-2-2 V10 a2 2 0 0 1 2-2 z" />
      <path d="M38 8 v12 h12" />
      <path d="M20 32 h10 M20 40 h16 M20 48 h12" />
      <path d="M44 38 l6 6 -6 6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  brfOku: (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" stroke="currentColor"
         strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8 h24 l12 12 v36 a2 2 0 0 1-2 2 H14 a2 2 0 0 1-2-2 V10 a2 2 0 0 1 2-2 z" />
      <path d="M38 8 v12 h12" />
      <circle cx="22" cy="34" r="3" fill="currentColor" stroke="none"/>
      <circle cx="22" cy="44" r="3" fill="currentColor" stroke="none"/>
      <circle cx="32" cy="29" r="3" fill="currentColor" stroke="none"/>
      <circle cx="32" cy="39" r="3" fill="currentColor" stroke="none"/>
      <circle cx="42" cy="34" r="3" fill="currentColor" stroke="none"/>
      <circle cx="42" cy="44" r="3" fill="currentColor" stroke="none"/>
    </svg>
  ),
};

const muzikBolumIkonuAl = (slug) => {
  if (slug === 'notalar') return Ikon.nota;
  if (slug.startsWith('sureler')) return Ikon.sure;
  if (slug.startsWith('oktav')) return Ikon.muzikDizi;
  return Ikon.muzikSembol;
};

const muzikGrupMenuOgesi = (grup) => ({
  yol: `/muzik/grup/${grup.id}`,
  baslik: grup.baslik,
  ikon: grup.id === 'temel' ? Ikon.nota : Ikon.muzikDizi,
  altMetin: `${grup.bolumler.length} konu`,
});

const muzikDiziMenuOgesi = {
  yol: '/muzik-diziler',
  baslik: 'Dizi Okuma',
  ikon: Ikon.muzikDizi,
  anahtar: 'muzik-dizi',
  toplam: 3,
};

const muzikModulOgeleriOlustur = () => [
  ...MUZIK_BOLUM_GRUPLARI.map((grup) => muzikGrupMenuOgesi(grup)),
  muzikDiziMenuOgesi,
];

export const MODULLER = [
  {
    id: 'modul1',
    baslik: 'Modül 1',
    mobilEtiket: 'Harfler',
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
    mobilEtiket: 'Kısaltmalar',
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
    mobilEtiket: 'Noktalamalar',
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
    mobilEtiket: 'Yazma',
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
    mobilEtiket: "Kur'an-ı Kerim",
    altBaslik: "Kur'an-ı Kerim",
    ikon: Ikon.modul5,
    // Sıra kullanıcı isteğiyle düzenlendi (Modül 5 Kur'an): Harfler → Harekeler → Cezim/Şedde
    // → Med → Mukadder → Elif-i Zaid → Hemzeler → Tenvinler → Ta-i Merbûta → Diğer Uzatma
    // → Hemze-i Vasl/Kat → Uzatma(Vakf). Başlıklar/ikonlar/anahtarlar AYNI (yalnız sıra değişti).
    ogeler: [
      { yol: '/kuran-harfler',                         baslik: "Kur'an-ı Kerim Harfleri", ikon: Ikon.kuranHarf, anahtar: 'kuran-harfler',          toplam: 29 },
      { yol: '/kuran-harekeler',                       baslik: 'Harekeler',               ikon: Ikon.harake,    anahtar: 'kuran-harekeler',        toplam: 3 },
      { yol: '/kuran-isaretler/cezm-sedde',            baslik: 'Cezim ve Şedde',          ikon: Ikon.cezmSedde,    anahtar: 'kuran-cezm-sedde',       toplam: 2 },
      { yol: '/kuran-isaretler/med-harfleri',          baslik: 'Med (Uzatma) Harfleri',   ikon: Ikon.medHarf,      anahtar: 'kuran-med-harfleri',     toplam: 3 },
      { yol: '/kuran-isaretler/mukadder-medler',       baslik: 'Mukadder Medler',         ikon: Ikon.mukadderMed,  anahtar: 'kuran-mukadder-medler',  toplam: 4 },
      { yol: '/kuran-isaretler/elif-zaid',             baslik: 'Elif-i Zaid',             ikon: Ikon.elifZaid,     anahtar: 'kuran-elif-zaid',        toplam: 1 },
      { yol: '/kuran-isaretler/hemzeler',              baslik: 'Hemzeler',                ikon: Ikon.hemze,        anahtar: 'kuran-hemzeler',         toplam: 4 },
      { yol: '/kuran-isaretler/tenvinler',             baslik: 'Tenvinler',               ikon: Ikon.tenvin,       anahtar: 'kuran-tenvinler',        toplam: 3 },
      { yol: '/kuran-isaretler/ta-i-merbuta',          baslik: "Ta-i Merbûta",            ikon: Ikon.taMerbuta,    anahtar: 'kuran-ta-i-merbuta',     toplam: 1 },
      { yol: '/kuran-isaretler/diger-uzatma',          baslik: 'Diğer Uzatma İşaretleri', ikon: Ikon.tecvid,       anahtar: 'kuran-diger-uzatma',     toplam: 2 },
      { yol: '/kuran-isaretler/hemze-vasl',            baslik: 'Hemze-i Vasl ve Kat',    ikon: Ikon.hemzeVasl,    anahtar: 'kuran-hemze-vasl',       toplam: 2 },
      { yol: '/kuran-uzatma',                           baslik: 'Durak İşaretleri',        ikon: Ikon.tecvid,    anahtar: 'kuran-tecvid',           toplam: 22 },
      // Hece Okuma ve Kelime Okuma gizlendi; veriler kuran.js'de duruyor.
      // "Kelime Okuma 2" (/kuran-kelimeler) ve "Kısa Sureler" (/kuran-sureler)
      // menüden gizlendi. Rotalar App.jsx'te durabilir; sadece listede görünmezler.
      { yol: '/test-kuran',      baslik: 'Test / Sınav',        ikon: Ikon.test }
    ]
  },
  {
    id: 'modul6',
    baslik: 'Modül 6',
    mobilEtiket: 'Matematik',
    altBaslik: 'Matematik',
    ikon: Ikon.modul6,
    ogeler: [
      { yol: '/mat-rakamlar',   baslik: 'Rakamlar',           ikon: Ikon.matRakam,  anahtar: 'mat-rakamlar',    toplam: 10 },
      { yol: '/mat-sira-sayilari', baslik: 'Sıra sayıları',   ikon: Ikon.matRakam, anahtar: 'mat-sira-sayilari', toplam: 9 },
      { yol: '/mat-semboller',  baslik: 'İşaretler',           ikon: Ikon.matSembol, anahtar: 'mat-semboller',   toplam: MATEMATIK_SEMBOLLER.length },
      { yol: '/mat-olculer',    baslik: 'Ölçüler',             ikon: Ikon.matOlcu,   anahtar: 'mat-olculer',     toplam: MATEMATIK_OLCULER.length },
      { yol: '/mat-geometri',   baslik: 'Geometri',            ikon: Ikon.geometri,  anahtar: 'mat-geometri',    toplam: GEOMETRI_SEMBOLLERI.length },
      { yol: '/mat-ifadeler',   baslik: 'İfade Okuma',         ikon: Ikon.matIfade,  anahtar: 'matematik-ifade', toplam: MATEMATIK_IFADELER.length },
      { yol: '/test-matematik', baslik: 'Test / Sınav',        ikon: Ikon.test }
    ]
  },
  {
    id: 'modul7',
    baslik: 'Modül 7',
    mobilEtiket: 'Fen',
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
    mobilEtiket: 'Müzik',
    altBaslik: 'Müzik',
    ikon: Ikon.modul8,
    ogeler: [
      ...muzikModulOgeleriOlustur(),
      { yol: '/test-muzik',    baslik: 'Test / Sınav',   ikon: Ikon.test },
    ]
  },
  {
    id: 'modul9-yabanci',
    baslik: 'Modül 9',
    mobilEtiket: 'Dil',
    altBaslik: 'Yabancı Dil',
    ikon: Ikon.modulYabanci,
    ogeler: [
      { yol: '/ingilizce', baslik: 'İngilizce', ikon: Ikon.modulYabanci },
      { yol: '/almanca', baslik: 'Almanca', ikon: Ikon.modulYabanci },
      { yol: '/fransizca', baslik: 'Fransızca', ikon: Ikon.modulYabanci },
    ]
  },
  {
    id: 'modul10-araclar',
    baslik: 'Modül 10',
    mobilEtiket: 'BRF',
    altBaslik: 'BRF Dönüştürücü',
    ikon: Ikon.araclar,
    ogeler: [
      { yol: '/araclar',         baslik: 'Metin → BRF',  ikon: Ikon.araclar },
      { yol: '/belge-brf',       baslik: 'Belge → BRF',  ikon: Ikon.belgeBrf },
      { yol: '/brf-oku',         baslik: 'BRF → Metin',  ikon: Ikon.brfOku },
      { yol: '/muzik-brf-yazim', baslik: 'Müzik → BRF',  ikon: Ikon.muzikSembol },
    ]
  }
];
