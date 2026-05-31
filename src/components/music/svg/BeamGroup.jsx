// BeamGroup.jsx
// Beam grubunu teknik olarak doğru seviyelere ayırarak çizer.
// Karışık sürelerde ikinci/üçüncü/dördüncü beam tüm gruba değil,
// sadece ilgili kısa nota segmentlerine uygulanır.

import BeamLine from './BeamLine';

const MIDDLE_LINE_Y = 88;
const NOTE_HEAD_HALF_WIDTH = 5.8;
const BEAM_STEM_LENGTH = 28;
const PARTIAL_BEAM_LENGTH = 12;
const MIN_STEM_CLEARANCE = 34;
const MIN_BEAM_Y_OFFSET = 42;
const MAX_BEAM_SLOPE = 0.16;
const MIN_BEAM_SLOPE = -0.16;
const SLOPE_RATIO = 0.6;
const SMALL_SLOPE_THRESHOLD = 0.005;
const MIN_VISIBLE_SLOPE = 0.06;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getStemX(x, direction) {
  return direction === 'up' ? x + NOTE_HEAD_HALF_WIDTH : x - NOTE_HEAD_HALF_WIDTH;
}

function getStemStartY(noteY, direction) {
  return direction === 'up' ? noteY - 2 : noteY + 2;
}

function getGroupStemDirection(notes) {
  if (!Array.isArray(notes) || notes.length === 0) return 'up';

  let above = 0;
  let below = 0;

  notes.forEach((note) => {
    if (note.y < MIDDLE_LINE_Y) above += 1;
    if (note.y > MIDDLE_LINE_Y) below += 1;
  });

  if (above > below) return 'down';
  if (below > above) return 'up';

  const avgY = notes.reduce((sum, note) => sum + note.y, 0) / notes.length;
  return avgY <= MIDDLE_LINE_Y ? 'down' : 'up';
}

function getBaseBeamY(notes, direction) {
  const ys = notes.map((note) => note.y);
  const highestNoteY = Math.min(...ys);
  const lowestNoteY = Math.max(...ys);

  if (direction === 'up') {
    const beamBaseY = highestNoteY - BEAM_STEM_LENGTH;
    const minBeamY = lowestNoteY - MIN_BEAM_Y_OFFSET;
    return Math.max(beamBaseY, minBeamY);
  }

  const beamBaseY = lowestNoteY + BEAM_STEM_LENGTH;
  const maxBeamY = highestNoteY + MIN_BEAM_Y_OFFSET;
  return Math.min(beamBaseY, maxBeamY);
}

function getBeamSlope(notes, x1, x2) {
  const first = notes[0];
  const last = notes[notes.length - 1];

  const rawSlope = (last.y - first.y) / Math.max(1, x2 - x1);
  const scaledSlope = rawSlope * SLOPE_RATIO;
  let beamSlope = clamp(scaledSlope, MIN_BEAM_SLOPE, MAX_BEAM_SLOPE);

  const noteDelta = last.y - first.y;
  if (Math.abs(noteDelta) >= 6 && Math.abs(beamSlope) < MIN_VISIBLE_SLOPE) {
    beamSlope = noteDelta > 0 ? MIN_VISIBLE_SLOPE : -MIN_VISIBLE_SLOPE;
  }

  return Math.abs(beamSlope) < SMALL_SLOPE_THRESHOLD ? 0 : beamSlope;
}

function getBeamGap(maxBeamCount) {
  if (maxBeamCount >= 4) return 5.0;
  if (maxBeamCount === 3) return 5.15;
  return 5.35;
}

function beamYAtX(x, x1, y1, x2, y2) {
  if (x1 === x2) return y1;

  const t = (x - x1) / (x2 - x1);
  return y1 + t * (y2 - y1);
}

function getLevelOffset(direction, level, gap) {
  const index = level - 1;
  return direction === 'up' ? index * gap : -index * gap;
}

function getBeamPointForNote(note, direction, x1, y1, x2, y2, level, gap) {
  const stemX = getStemX(note.x, direction);
  const mainY = beamYAtX(stemX, x1, y1, x2, y2);

  return {
    x: stemX,
    y: mainY + getLevelOffset(direction, level, gap),
  };
}

function getContiguousSegments(notes, level) {
  const segments = [];
  let current = [];

  notes.forEach((note) => {
    const beamCount = Number.isFinite(note.beamCount) ? note.beamCount : 0;

    if (beamCount >= level) {
      current.push(note);
    } else if (current.length) {
      segments.push(current);
      current = [];
    }
  });

  if (current.length) segments.push(current);
  return segments;
}

function findNoteIndex(notes, target) {
  if (!Array.isArray(notes) || !target) return -1;

  const byId = notes.findIndex((note) => note?.id && target?.id && note.id === target.id);
  if (byId >= 0) return byId;

  return notes.findIndex((note) => note === target);
}

function chooseHookDirection(notes, noteIndex, level) {
  const prev = notes[noteIndex - 1];
  const next = notes[noteIndex + 1];

  const prevBeamCount = Number.isFinite(prev?.beamCount) ? prev.beamCount : 0;
  const nextBeamCount = Number.isFinite(next?.beamCount) ? next.beamCount : 0;

  // Öncelik: aynı beam seviyesinde komşu varsa ona doğru dönsün.
  if (prevBeamCount >= level && nextBeamCount < level) return 'left';
  if (nextBeamCount >= level && prevBeamCount < level) return 'right';

  if (prevBeamCount >= level && nextBeamCount >= level) {
    const mid = (notes.length - 1) / 2;
    return noteIndex <= mid ? 'right' : 'left';
  }

  // Aynı seviyede komşu yoksa grubun içine doğru dönsün.
  const mid = (notes.length - 1) / 2;
  return noteIndex <= mid ? 'right' : 'left';
}

function adjustBeamForStemClearance(notes, direction, x1, y1, x2, y2) {
  if (!Array.isArray(notes) || notes.length === 0) {
    return { y1, y2 };
  }

  if (direction === 'up') {
    const smallestClearance = Math.min(
      ...notes.map((note) => {
        const stemX = getStemX(note.x, direction);
        const beamY = beamYAtX(stemX, x1, y1, x2, y2);
        return note.y - beamY;
      }),
    );

    if (smallestClearance < MIN_STEM_CLEARANCE) {
      const delta = MIN_STEM_CLEARANCE - smallestClearance;
      return {
        y1: y1 - delta,
        y2: y2 - delta,
      };
    }

    return { y1, y2 };
  }

  const smallestClearance = Math.min(
    ...notes.map((note) => {
      const stemX = getStemX(note.x, direction);
      const beamY = beamYAtX(stemX, x1, y1, x2, y2);
      return beamY - note.y;
    }),
  );

  if (smallestClearance < MIN_STEM_CLEARANCE) {
    const delta = MIN_STEM_CLEARANCE - smallestClearance;
    return {
      y1: y1 + delta,
      y2: y2 + delta,
    };
  }

  return { y1, y2 };
}

function BeamGroup({ notes = [] }) {
  if (!Array.isArray(notes) || notes.length < 2) return null;

  const direction = getGroupStemDirection(notes);

  const first = notes[0];
  const last = notes[notes.length - 1];

  const x1 = getStemX(first.x, direction);
  const x2 = getStemX(last.x, direction);

  const baseY = getBaseBeamY(notes, direction);
  const slope = getBeamSlope(notes, x1, x2);
  const dx = Math.max(1, x2 - x1);

  let y1 = baseY;
  let y2 = baseY + slope * dx;

  const adjusted = adjustBeamForStemClearance(notes, direction, x1, y1, x2, y2);
  y1 = adjusted.y1;
  y2 = adjusted.y2;

  const maxBeamCount = Math.max(
    1,
    ...notes.map((note) => (Number.isFinite(note.beamCount) ? note.beamCount : 0)),
  );

  const gap = getBeamGap(maxBeamCount);

  return (
    <g>
      {/* Saplar */}
      {notes.map((note, index) => {
        const stemX = getStemX(note.x, direction);
        const stemEndY = beamYAtX(stemX, x1, y1, x2, y2);

        return (
          <line
            key={`stem-${note.id || index}`}
            x1={stemX}
            y1={getStemStartY(note.y, direction)}
            x2={stemX}
            y2={stemEndY}
            className="stroke-zinc-900"
            strokeWidth={1.35}
            strokeLinecap="square"
            shapeRendering="geometricPrecision"
          />
        );
      })}

      {/* Beam seviyeleri */}
      {Array.from({ length: maxBeamCount }).map((_, i) => {
        const level = i + 1;
        const segments = getContiguousSegments(notes, level);

        return (
          <g key={`beam-level-${level}`}>
            {segments.map((segment, segmentIndex) => {
              if (segment.length >= 2) {
                const start = segment[0];
                const end = segment[segment.length - 1];

                const p1 = getBeamPointForNote(start, direction, x1, y1, x2, y2, level, gap);
                const p2 = getBeamPointForNote(end, direction, x1, y1, x2, y2, level, gap);

                return (
                  <BeamLine
                    key={`beam-${level}-${segmentIndex}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    beamLevel={level}
                  />
                );
              }

              if (level === 1) {
                return null;
              }

              const single = segment[0];
              const noteIndex = findNoteIndex(notes, single);
              const hookDirection = chooseHookDirection(notes, noteIndex, level);
              const p = getBeamPointForNote(single, direction, x1, y1, x2, y2, level, gap);

              const hookX2 =
                hookDirection === 'right'
                  ? p.x + PARTIAL_BEAM_LENGTH
                  : p.x - PARTIAL_BEAM_LENGTH;

              const hookY2 =
                beamYAtX(hookX2, x1, y1, x2, y2) +
                getLevelOffset(direction, level, gap);

              return (
                <BeamLine
                  key={`beam-hook-${level}-${single.id || segmentIndex}`}
                  x1={p.x}
                  y1={p.y}
                  x2={hookX2}
                  y2={hookY2}
                  beamLevel={level}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

export default BeamGroup;