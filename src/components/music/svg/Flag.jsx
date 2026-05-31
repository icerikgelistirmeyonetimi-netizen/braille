// Tek notada kısa ve küçük bayrak path'i
function Flag({ x, y, direction, index = 0 }) {
  const gap = 6;
  const offset = direction === 'up' ? index * gap : -index * gap;
  if (direction === 'up') {
    const stemX = x + 5.8;
    const flagY = y - 40 + offset;
    return (
      <path
        d={`M ${stemX} ${flagY}
            C ${stemX + 10} ${flagY + 3},
              ${stemX + 14} ${flagY + 10},
              ${stemX + 7} ${flagY + 17}`}
        className="fill-none stroke-zinc-900"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  const stemX = x - 5.8;
  const flagY = y + 40 + offset;
  return (
    <path
      d={`M ${stemX} ${flagY}
          C ${stemX - 10} ${flagY - 3},
            ${stemX - 14} ${flagY - 10},
            ${stemX - 7} ${flagY - 17}`}
      className="fill-none stroke-zinc-900"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export default Flag;
