'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Play, FileEdit, Shield, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickStats } from '@/components/QuickStats'

const navItems = [
  {
    title: 'Generator',
    href: '/generator',
    icon: Play,
  },
  {
    title: 'Prompts',
    href: '/prompts',
    icon: FileEdit,
  },
  {
    title: 'Global Rules',
    href: '/global',
    icon: Shield,
  },
  {
    title: 'History',
    href: '/history',
    icon: History,
  },
]

interface SideNavProps {
  className?: string
}

export function SideNav({ className }: SideNavProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r bg-background", className)}>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === '/generator' && pathname === '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
      
      <div className="border-t p-4">
        <QuickStats />
      </div>
    </aside>
  )
}