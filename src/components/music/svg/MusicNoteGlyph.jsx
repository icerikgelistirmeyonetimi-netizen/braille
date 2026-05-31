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

function MusicNoteGlyph({ item, x, y, grouped, sure }) {
  const sureData = sure || item.sure || {};
  const realValue = Number.isFinite(sureData.realValue) ? sureData.realValue : 4;

  const isSmallDuration = realValue >= 16;
  const hollow = !isSmallDuration && /yarım|tam/i.test(sureData.ad || '');
  const hasStem = !/tam/i.test(sureData.ad || '') || isSmallDuration;

  const direction = getStemDirection(y);
  const flagCount = Number.isFinite(sureData.bayrak) ? sureData.bayrak : 0;

  return (
    <g className="cursor-pointer">
      {item.accidental && (
        <AccidentalGlyph accidental={item.accidental} x={x - 20} y={y} />
      )}

      <NoteHead x={x} y={y} hollow={hollow} />

      {item.dotted && (
        <circle cx={x + 16} cy={y - 1} r={2.1} className="fill-zinc-900" />
      )}

      {hasStem && !grouped && (
        <Stem x={x} y={y} direction={direction} />
      )}

      {hasStem && !grouped && flagCount > 0 && (
        <>
          {Array.from({ length: flagCount }).map((_, i) => (
            <Flag key={i} x={x} y={y} direction={direction} index={i} />
          ))}
        </>
      )}
    </g>
  );
}

export default MusicNoteGlyph;