import SVG_NOTE from './musicSvgStyle';

function Stem({ x, y, direction, stemLength }) {
  const length = stemLength ?? SVG_NOTE.stemLength;
  const stemX = direction === 'up' ? x + 5.8 : x - 5.8;
  const y1 = direction === 'up' ? y - 2 : y + 2;
  const y2 = direction === 'up' ? y - length : y + length;

  return (
    <line
      x1={stemX}
      y1={y1}
      x2={stemX}
      y2={y2}
      className="stroke-zinc-900"
      strokeWidth={SVG_NOTE.stemStroke}
      strokeLinecap="round"
    />
  );
}

export default Stem;
