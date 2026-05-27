import SVG_NOTE from './musicSvgStyle';

function NoteHead({ x, y, hollow = false }) {
  return (
    <g>
      <ellipse
        cx={x}
        cy={y}
        rx={SVG_NOTE.headRx}
        ry={SVG_NOTE.headRy}
        transform={`rotate(${SVG_NOTE.headRotate} ${x} ${y})`}
        className={hollow ? 'fill-white stroke-zinc-900' : 'fill-zinc-900 stroke-zinc-900'}
        strokeWidth={hollow ? SVG_NOTE.hollowStrokeWidth : 1}
      />
    </g>
  );
}

export default NoteHead;
