'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export default function RouteProgress() {
  const pathname = usePathname()
  const [width, setWidth]     = useState(0)
  const [opacity, setOpacity] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => timers.current.forEach(clearTimeout)

  useEffect(() => {
    clear()
    timers.current = []

    setWidth(0)
    setOpacity(1)

    // Ramp up quickly to 70%, then slowly to 90%
    timers.current.push(setTimeout(() => setWidth(70), 40))
    timers.current.push(setTimeout(() => setWidth(90), 400))
    // Complete
    timers.current.push(setTimeout(() => setWidth(100), 700))
    // Fade out
    timers.current.push(setTimeout(() => setOpacity(0), 950))
    // Reset
    timers.current.push(setTimeout(() => setWidth(0), 1150))

    return clear
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Progress bar */}
      <div
        className="h-[2px]"
        style={{
          width:      `${width}%`,
          opacity,
          background: 'linear-gradient(90deg, #a07840, #c8a96e, #f0d080, #c8a96e)',
          boxShadow:  '0 0 10px #c8a96e99, 0 0 20px #c8a96e44',
          transition: width === 0
            ? 'none'
            : width < 95
              ? 'width 400ms cubic-bezier(0.4,0,0.2,1), opacity 200ms'
              : 'width 200ms ease-out, opacity 200ms 200ms',
        }}
      />
      {/* Glowing tip */}
      {width > 0 && width < 100 && (
        <div
          className="absolute top-0 h-[2px] w-8 -translate-x-full"
          style={{
            left:       `${width}%`,
            background: 'radial-gradient(ellipse at right, #f0d08099, transparent)',
          }}
        />
      )}
    </div>
  )
}
