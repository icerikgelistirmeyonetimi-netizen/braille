import { skorBarlineParcalariAl } from '../../utils/music-brf/musicVisualBarlineHelpers.js';

export default function ScoreBarlineGlyph({
  x,
  type = 'normal',
  topY,
  bottomY,
  className = '',
}) {
  const parts = skorBarlineParcalariAl({ x, type, topY, bottomY });

  return (
    <g className={className} data-barline-type={type}>
      {parts.map((part, index) => {
        if (part.kind === 'dot') {
          return (
            <circle
              key={`${part.role}-${index}`}
              cx={part.x}
              cy={part.y}
              r={part.r}
              fill="currentColor"
              pointerEvents="none"
            />
          );
        }

        return (
          <line
            key={`${part.role}-${index}`}
            x1={part.x}
            x2={part.x}
            y1={part.y1}
            y2={part.y2}
            stroke="currentColor"
            strokeWidth={part.width}
            strokeLinecap="butt"
            shapeRendering="geometricPrecision"
            pointerEvents="none"
          />
        );
      })}
    </g>
  );
}
