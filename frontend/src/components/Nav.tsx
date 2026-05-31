'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/life-areas', label: 'Life Areas' },
  { href: '/sprint', label: 'Weekly Sprint' },
  { href: '/settings', label: 'Settings' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <aside className="w-52 shrink-0 border-r border-[#1a1a1a] flex flex-col p-4 gap-1 min-h-screen">
      <div className="mb-8 px-3">
        <span className="text-white font-semibold tracking-widest uppercase text-xs">LifeOS</span>
      </div>
      {links.map(link => {
        const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${
              active ? 'bg-white/10 text-white' : 'text-[#888] hover:text-white hover:bg-white/5'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </aside>
  )
}
