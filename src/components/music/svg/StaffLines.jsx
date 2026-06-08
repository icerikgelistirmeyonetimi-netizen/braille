// Porte çizgileri
function StaffLines({ x = 24, rightX = 776 }) {
  const ys = [64, 76, 88, 100, 112];
  return (
    <g>
      {ys.map((y) => (
        <line
          key={y}
          x1={x}
          x2={rightX}
          y1={y}
          y2={y}
          className="stroke-zinc-400"
          strokeWidth={1.56}
        />
      ))}
    </g>
  );
}

export default StaffLines;
