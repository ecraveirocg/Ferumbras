'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Users, Clock, MapPin, Swords, LogOut, ChevronLeft, ChevronRight, Pin, PinOff, Target, Calculator, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { href: '/summary',    label: 'Summary',    icon: BarChart2 },
  { href: '/characters', label: 'Characters', icon: Users     },
  { href: '/sessions',   label: 'Sessions',   icon: Clock     },
  { href: '/spots',      label: 'Spots',      icon: MapPin    },
  { href: '/goals',      label: 'Objetivos',  icon: Target    },
]

const toolItems = [
  { href: '/skill-calc', label: 'Skill Calc', icon: Calculator },
]

export default function Sidebar() {
  const pathname = usePathname()

  const [pinned,       setPinned]       = useState(false)
  const [collapsed,    setCollapsed]    = useState(false)
  const [hovered,      setHovered]      = useState(false)
  const [toolsOpen,    setToolsOpen]    = useState(
    toolItems.some(t => pathname.startsWith(t.href))
  )

  const isExpanded = pinned || !collapsed || hovered

  const handleMouseEnter = () => { if (!pinned && collapsed) setHovered(true)  }
  const handleMouseLeave = () => { if (!pinned && collapsed) setHovered(false) }

  const isToolActive = toolItems.some(t => pathname.startsWith(t.href))

  return (
    <div className="pt-1.5 pl-1.5 pb-1.5 pr-0 flex-shrink-0">
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'flex flex-col bg-[#161616] border border-[#2a2a2a] rounded-2xl h-full overflow-hidden shadow-2xl shadow-black/40 transition-all duration-300',
          isExpanded ? 'w-52' : 'w-[58px]'
        )}
      >
        {/* Logo + controls */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-[#222] min-h-[60px]">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Swords size={16} className="text-white" />
          </div>

          {isExpanded && (
            <>
              <span className="flex-1 text-base font-bold text-white tracking-wide truncate">
                Ferumbras
              </span>
              <button
                onClick={() => setPinned(p => !p)}
                title={pinned ? 'Unpin menu' : 'Pin menu open'}
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-lg transition-colors flex-shrink-0',
                  pinned
                    ? 'text-purple-400 bg-purple-500/15 hover:bg-purple-500/25'
                    : 'text-gray-600 hover:text-white hover:bg-white/8'
                )}
              >
                {pinned ? <Pin size={13} /> : <PinOff size={13} />}
              </button>
              {!pinned && (
                <button
                  onClick={() => { setCollapsed(c => !c); setHovered(false) }}
                  title={collapsed ? 'Expand' : 'Collapse'}
                  className="flex items-center justify-center w-6 h-6 rounded-lg text-gray-600 hover:text-white hover:bg-white/8 transition-colors flex-shrink-0"
                >
                  {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 p-2 pt-3 overflow-y-auto">

          {/* Main items */}
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                title={!isExpanded ? label : undefined}
                className={cn(
                  'flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isExpanded ? 'px-3' : 'justify-center px-2',
                  isActive
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-900/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={18} className={cn('flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-gray-400 group-hover:text-white')} />
                {isExpanded && <span className="truncate">{label}</span>}
              </Link>
            )
          })}

          {/* Ferramentas group */}
          <div className="mt-1">
            {/* Group header */}
            <button
              onClick={() => isExpanded && setToolsOpen(o => !o)}
              title={!isExpanded ? 'Ferramentas' : undefined}
              className={cn(
                'w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isExpanded ? 'px-3' : 'justify-center px-2',
                isToolActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Wrench
                size={18}
                className={cn('flex-shrink-0 transition-colors', isToolActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-white')}
              />
              {isExpanded && (
                <>
                  <span className="flex-1 text-left truncate">Ferramentas</span>
                  <ChevronRight
                    size={13}
                    className={cn('flex-shrink-0 text-gray-600 transition-transform duration-200', toolsOpen && 'rotate-90')}
                  />
                </>
              )}
            </button>

            {/* Sub-items */}
            {(toolsOpen || !isExpanded) && toolItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  title={!isExpanded ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group mt-0.5',
                    isExpanded ? 'pl-9 pr-3' : 'justify-center px-2',
                    isActive
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-900/30'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={16} className={cn('flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-gray-500 group-hover:text-white')} />
                  {isExpanded && <span className="truncate">{label}</span>}
                </Link>
              )
            })}
          </div>

        </nav>

        {/* Profile */}
        <div className="p-2 border-t border-[#222]">
          <div className={cn('flex items-center gap-3 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer', isExpanded ? 'px-2' : 'justify-center px-1')}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                E
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#161616]" />
            </div>
            {isExpanded && (
              <>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-white truncate leading-tight">Eduardo</span>
                  <span className="text-[10px] text-gray-500 truncate leading-tight">Online</span>
                </div>
                <button className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0" title="Logout">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
