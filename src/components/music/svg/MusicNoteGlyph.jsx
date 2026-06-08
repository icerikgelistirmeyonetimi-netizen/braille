import NoteHead from './NoteHead';
import Stem from './Stem';
import Flag from './Flag';
import AccidentalGlyph from './AccidentalGlyph';

const MIDDLE_LINE_Y = 88;

function getStemDirection(noteY) {
  // Orta çizgi ve üstü için sap aşağı; altı için sap yukarı.
  // SVG'de y küçüldükçe nota yukarı çıkar.
  return noteY <= MIDDLE_LINE_Y ? 'down' : 'up';
}

function MusicNoteGlyph({ item, x, y, grouped, sure, glyphScaleY = 1 }) {
  const sureData = sure || item.sure || {};
  const realValue = Number.isFinite(sureData.realValue) ? sureData.realValue : 4;

  const isSmallDuration = realValue >= 16;
  const hollow = !isSmallDuration && /yarım|tam/i.test(sureData.ad || '');
  const hasStem = !/tam/i.test(sureData.ad || '') || isSmallDuration;

  const direction = getStemDirection(y);
  const flagCount = Number.isFinite(sureData.bayrak) ? sureData.bayrak : 0;

  // Sap uzunluğu: standart 3.5 porte aralığı (42). SMuFL bayrak glyph'leri tüm
  // çengelleri tek glyph'te taşır (~3.25 aralık); yalnızca 64'lük+ (≥4 çengel)
  // glyph daha çok yukarı uzandığından sapı uzatırız (aksi halde nota kafasına değer).
  const BASE_STEM = 42;
  const stemLength = BASE_STEM + Math.max(0, flagCount - 3) * 8;

  // Glyph-arası boşluklar (Gould/SMuFL konvansiyonu, staff space = 12px):
  //   aksidental → nota: ~0.2 ss boşluk (nota sol kenarı ≈ x-5.9'dan içeri)
  //   nokta → nota: nota sağ kenarından ~0.3 ss sonra
  // Nokta, nota çizgi ÜSTÜNDEYSE bir üst boşluğa kaçar (perde değişmesin diye).
  const onLine = [64, 76, 88, 100, 112].includes(y);
  const dotCy = onLine ? y - 6 : y;

  return (
    <g className="cursor-pointer">
      {/* Aksidental sağ kenarı = nota sol kenarı (≈x-5.9) − ~0.25 ss boşluk */}
      {item.accidental && (
        <AccidentalGlyph accidental={item.accidental} x={x - 10} y={y} />
      )}

      <NoteHead x={x} y={y} hollow={hollow} scaleY={glyphScaleY} />

      {item.dotted && (
        <circle cx={x + 10} cy={dotCy} r={2.1} className="fill-zinc-900" />
      )}

      {hasStem && !grouped && (
        <Stem x={x} y={y} direction={direction} stemLength={stemLength} />
      )}

      {hasStem && !grouped && flagCount > 0 && (
        <Flag
          x={x}
          y={y}
          direction={direction}
          flagCount={flagCount}
          stemLength={stemLength}
          glyphScaleY={glyphScaleY}
        />
      )}
    </g>
  );
}

export default MusicNoteGlyph;