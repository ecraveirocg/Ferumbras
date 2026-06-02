'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prev     = useRef(pathname)

  const [show,   setShow]   = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (prev.current === pathname) return
    prev.current = pathname

    setShow(true)
    setFading(false)

    const t1 = setTimeout(() => setFading(true),  2400)
    const t2 = setTimeout(() => { setShow(false); setFading(false) }, 3000)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pathname])

  return (
    <>
      {children}

      {show && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{
            backdropFilter:       'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            backgroundColor:      'rgba(0,0,0,0.3)',
            opacity:    fading ? 0 : 1,
            transition: fading
              ? 'opacity 600ms ease, backdrop-filter 600ms ease'
              : 'opacity 200ms ease, backdrop-filter 200ms ease',
            pointerEvents: fading ? 'none' : 'all',
          }}
        >
          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
            }}
          />

          {/* Ferumbras gif — centered, no movement */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <Image
              src="/Ferumbras.gif"
              alt="Loading"
              width={160}
              height={160}
              unoptimized
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      )}
    </>
  )
}
