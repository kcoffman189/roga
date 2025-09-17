type Props = {
  value: number;
  size?: number;
  label?: string;
};

export default function CircleMeter({ value, size = 96, label }: Props) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={`Score ${pct}/100`}
      className="transform rotate-0"
    >
      {/* Background circle */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#EEE"
        strokeWidth="10"
      />
      {/* Progress circle */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="#20B2AA"
        strokeWidth="10"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        className="transition-all duration-1000 ease-out"
      />
      {/* Score text */}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        fontSize="18"
        fontFamily="Inter, sans-serif"
        fill="#1D1B20"
        fontWeight="700"
        className="select-none"
      >
        {pct}
      </text>
      {/* Label text */}
      {label && (
        <text
          x="50"
          y="70"
          textAnchor="middle"
          fontSize="8"
          fill="#7B61FF"
          className="select-none"
        >
          {label}
        </text>
      )}
    </svg>
  );
}