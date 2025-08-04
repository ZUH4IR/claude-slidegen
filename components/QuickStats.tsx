'use client'

import { useEffect, useState } from 'react'

interface Stats {
  clients: string[]
  activePrompts: number
  lastCsv: string
}

export function QuickStats() {
  const [stats, setStats] = useState<Stats>({
    clients: [],
    activePrompts: 0,
    lastCsv: 'Never'
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold text-muted-foreground">Quick Stats</h3>
      <div className="space-y-1">
        <div>
          <span className="text-muted-foreground">Clients:</span>{' '}
          <span className="font-medium">{stats.clients.length} ({stats.clients.join(', ')})</span>
        </div>
        <div>
          <span className="text-muted-foreground">Prompts active:</span>{' '}
          <span className="font-medium">{stats.activePrompts}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Last CSV:</span>{' '}
          <span className="font-medium">{stats.lastCsv}</span>
        </div>
      </div>
    </div>
  )
}