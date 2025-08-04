'use client'

import Link from 'next/link'
import { Play, Edit3, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

const tools = [
  {
    label: 'Generator',
    href: '/',
    icon: Play,
    description: 'Generate slide copy'
  },
  {
    label: 'Prompts',
    href: '/prompts',
    icon: Edit3,
    description: 'Edit prompt templates'
  },
  {
    label: 'History',
    href: '/history',
    icon: Clock,
    description: 'View version history'
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">SlideGen</h1>
        <p className="text-sm text-gray-600 mt-1">TikTok-style copy generator</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tools
          </p>
          {tools.map((tool) => {
            const isActive = pathname === tool.href
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <tool.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                <div className="flex-1">
                  <div>{tool.label}</div>
                  <div className="text-xs text-gray-500">{tool.description}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Stats */}
      <div className="p-6 border-t">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Clients:</span>
            <span className="font-medium">2 (vibit, pupscan)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Prompts:</span>
            <span className="font-medium">4 active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last generated:</span>
            <span className="font-medium">Never</span>
          </div>
        </div>
      </div>
    </div>
  )
}