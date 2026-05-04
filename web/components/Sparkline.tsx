interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  baseline?: boolean;
}

export function Sparkline({
  values,
  width = 80,
  height = 22,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 1.25,
  baseline = false,
}: SparklineProps) {
  if (!values.length) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area = `${path} L${width} ${height} L0 ${height} Z`;

  return (
    <svg width={width} height={height} aria-hidden="true" className="block">
      {baseline ? (
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
      ) : null}
      {fill !== "none" ? <path d={area} fill={fill} opacity={0.16} /> : null}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="miter" strokeLinecap="butt" />
    </svg>
  );
}
