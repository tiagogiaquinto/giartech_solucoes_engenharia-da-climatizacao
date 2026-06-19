export function GiartechLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 36, md: 54, lg: 72 }
  const s = sizes[size]
  const nameSize = size === 'sm' ? 18 : size === 'lg' ? 30 : 24
  const subSize = size === 'sm' ? 9 : size === 'lg' ? 13 : 11

  return (
    <div className="flex items-center gap-3">
      <svg width={s} height={Math.round(s * 0.78)} viewBox="0 0 54 42" fill="none">
        <defs>
          <linearGradient id="g-b1" x1="0" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#e8402a"/>
            <stop offset="100%" stopColor="#ff8149"/>
          </linearGradient>
          <linearGradient id="g-b2" x1="0" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#0062f6"/>
            <stop offset="100%" stopColor="#00d1ff"/>
          </linearGradient>
          <linearGradient id="g-b3" x1="0" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#003db8"/>
            <stop offset="100%" stopColor="#0062f6"/>
          </linearGradient>
        </defs>
        <g transform="rotate(-32, 27, 21)">
          <rect x="2"  y="4"  width="10" height="32" rx="3.5" fill="url(#g-b1)"/>
          <rect x="20" y="1"  width="10" height="32" rx="3.5" fill="url(#g-b2)"/>
          <rect x="38" y="4"  width="10" height="32" rx="3.5" fill="url(#g-b3)"/>
        </g>
      </svg>
      <div>
        <div style={{ fontFamily: 'Questrial, system-ui', fontSize: nameSize, color: '#191919', letterSpacing: '-0.5px', lineHeight: 1 }}>
          Giartech
        </div>
        <div style={{ fontSize: subSize, color: '#8a95a8', letterSpacing: '1px', marginTop: 2 }}>
          Soluções
        </div>
      </div>
    </div>
  )
}

export function GiartechLogoWhite({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 36, md: 54, lg: 72 }
  const s = sizes[size]
  const nameSize = size === 'sm' ? 18 : size === 'lg' ? 30 : 24
  const subSize = size === 'sm' ? 9 : size === 'lg' ? 13 : 11

  return (
    <div className="flex items-center gap-3">
      <svg width={s} height={Math.round(s * 0.78)} viewBox="0 0 54 42" fill="none">
        <defs>
          <linearGradient id="gw-b1" x1="0" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#e8402a"/>
            <stop offset="100%" stopColor="#ff8149"/>
          </linearGradient>
          <linearGradient id="gw-b2" x1="0" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#0062f6"/>
            <stop offset="100%" stopColor="#00d1ff"/>
          </linearGradient>
          <linearGradient id="gw-b3" x1="0" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#7aaff8"/>
            <stop offset="100%" stopColor="#a8d8ff"/>
          </linearGradient>
        </defs>
        <g transform="rotate(-32, 27, 21)">
          <rect x="2"  y="4"  width="10" height="32" rx="3.5" fill="url(#gw-b1)"/>
          <rect x="20" y="1"  width="10" height="32" rx="3.5" fill="url(#gw-b2)"/>
          <rect x="38" y="4"  width="10" height="32" rx="3.5" fill="url(#gw-b3)"/>
        </g>
      </svg>
      <div>
        <div style={{ fontFamily: 'Questrial, system-ui', fontSize: nameSize, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: 1 }}>
          Giartech
        </div>
        <div style={{ fontSize: subSize, color: 'rgba(255,255,255,0.45)', letterSpacing: '1px', marginTop: 2 }}>
          Soluções
        </div>
      </div>
    </div>
  )
}
