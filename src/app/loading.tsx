export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="flex flex-col items-center gap-5">

        {/* Rune ring */}
        <div className="relative w-14 h-14">
          {/* Outer static ring */}
          <div className="absolute inset-0 rounded-full border border-[#c8a96e]/15" />

          {/* Spinning arc */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor:   '#c8a96e',
              borderRightColor: '#c8a96e44',
              animationDuration: '900ms',
              animationTimingFunction: 'linear',
            }}
          />

          {/* Inner pulsing ring */}
          <div className="absolute inset-[5px] rounded-full border border-[#c8a96e]/20 animate-pulse" />

          {/* Center emblem — sword cross */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              {/* Sword blade */}
              <line x1="12" y1="3"  x2="12" y2="17" stroke="#c8a96e" strokeWidth="1.8" strokeLinecap="round" />
              {/* Crossguard */}
              <line x1="8"  y1="9"  x2="16" y2="9"  stroke="#c8a96e" strokeWidth="1.8" strokeLinecap="round" />
              {/* Pommel */}
              <circle cx="12" cy="19.5" r="1.5" fill="#c8a96e" opacity="0.8" />
            </svg>
          </div>

          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{ boxShadow: '0 0 16px #c8a96e22' }}
          />
        </div>

        {/* Label */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] tracking-[0.35em] uppercase font-medium"
            style={{ color: '#c8a96e99' }}
          >
            Loading
          </span>
          <span className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-0.5 h-0.5 rounded-full bg-[#c8a96e] animate-bounce"
                style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
              />
            ))}
          </span>
        </div>

      </div>
    </div>
  )
}
