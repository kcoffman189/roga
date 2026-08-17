export default function CephosLogo({ width = 300, textColor = '#EEECEA' }: { width?: number, textColor?: string }) {
  return (
    <svg width={width} height="auto" viewBox="0 0 290 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(14, 2)">
        <g transform="rotate(-30 24 24)">
          <line x1="14" y1="33" x2="36" y2="12" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="12" x2="36" y2="36" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="12" x2="36" y2="12" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
          <line x1="36" y1="12" x2="36" y2="36" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="4" fill="#C45E0A"/>
          <circle cx="36" cy="12" r="4" fill="#C45E0A"/>
          <circle cx="14" cy="33" r="5" fill="#C45E0A"/>
          <circle cx="36" cy="36" r="4" fill="#C45E0A"/>
        </g>
      </g>
      <text x="62" y="42" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill={textColor}>Cephos</text>
      <text x="62" y="63" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="500" letterSpacing="1.5" fill="#C45E0A">MANY BOOKS. ONE MIND.</text>
    </svg>
  )
}