import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Get unique clients from prompts directory
    const promptsDir = path.join(process.cwd(), 'prompts')
    const clients: string[] = []
    
    try {
      const items = await fs.readdir(promptsDir, { withFileTypes: true })
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.')) {
          clients.push(item.name)
        }
      }
    } catch (err) {
      console.log('No prompts directory found')
    }
    
    // Count active prompts (brand + campaign prompts)
    let activePrompts = 0
    for (const client of clients) {
      // Count brand prompt
      try {
        await fs.access(path.join(promptsDir, client, 'prompt.md'))
        activePrompts++
      } catch {}
      
      // Count campaign prompts
      try {
        const clientDir = path.join(promptsDir, client)
        const items = await fs.readdir(clientDir, { withFileTypes: true })
        for (const item of items) {
          if (item.isDirectory() && !item.name.startsWith('.')) {
            try {
              await fs.access(path.join(clientDir, item.name, 'prompt.md'))
              activePrompts++
            } catch {}
          }
        }
      } catch {}
    }
    
    // Get last CSV generation time
    let lastCsv = 'Never'
    try {
      const historyDir = path.join(process.cwd(), 'history')
      const files = await fs.readdir(historyDir)
      
      if (files.length > 0) {
        // Sort files by name (timestamp) and get the latest
        const latest = files
          .filter(f => f.endsWith('.json'))
          .sort()
          .reverse()[0]
        
        if (latest) {
          const timestamp = latest.replace('.json', '').replace(/-/g, ':')
          const date = new Date(timestamp)
          
          // Format as relative time
          const now = new Date()
          const diff = now.getTime() - date.getTime()
          const minutes = Math.floor(diff / 60000)
          const hours = Math.floor(minutes / 60)
          const days = Math.floor(hours / 24)
          
          if (days > 0) {
            lastCsv = `${days}d ago`
          } else if (hours > 0) {
            lastCsv = `${hours}h ago`
          } else if (minutes > 0) {
            lastCsv = `${minutes}m ago`
          } else {
            lastCsv = 'Just now'
          }
        }
      }
    } catch (err) {
      console.log('No history directory found')
    }
    
    return NextResponse.json({
      clients,
      activePrompts,
      lastCsv
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    return NextResponse.json(
      { clients: [], activePrompts: 0, lastCsv: 'Never' },
      { status: 200 }
    )
  }
}