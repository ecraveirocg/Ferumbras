'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Users, Clock, MapPin, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/summary', label: 'Summary', icon: BarChart2 },
  { href: '/characters', label: 'Characters', icon: Users },
  { href: '/sessions', label: 'Sessions', icon: Clock },
  { href: '/spots', label: 'Spots', icon: MapPin },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-16 md:w-56 bg-[#212121] border-r border-[#2a2a2a] h-screen flex-shrink-0 transition-all duration-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 md:px-4 py-5 border-b border-[#2a2a2a]">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Swords size={16} className="text-white" />
        </div>
        <span className="hidden md:block text-base font-bold text-white tracking-wide truncate">
          Ferumbras
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-2 pt-3 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-gray-400 hover:text-white hover:bg-[#333333]'
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                )}
              />
              <span className="hidden md:block truncate">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 md:p-4 border-t border-[#2a2a2a]">
        <p className="hidden md:block text-xs text-gray-600 text-center">Tibia Hunt Tracker</p>
      </div>
    </aside>
  )
}
