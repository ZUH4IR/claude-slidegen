import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get('client')
    const campaign = searchParams.get('campaign')
    
    if (!client) {
      return NextResponse.json({ error: 'Client parameter required' }, { status: 400 })
    }
    
    let lastModified: Date | null = null
    
    // Check client file modification time
    try {
      const clientDir = path.join(process.cwd(), 'prompts', 'clients', client)
      const files = await fs.readdir(clientDir)
      const clientFile = files.find(f => f.startsWith('_client_v') && f.endsWith('.md'))
      
      if (clientFile) {
        const stat = await fs.stat(path.join(clientDir, clientFile))
        lastModified = stat.mtime
      }
    } catch (err) {
      // Client file might not exist
    }
    
    // Check campaign file modification time if specified
    if (campaign) {
      try {
        const campaignDir = path.join(process.cwd(), 'prompts', 'clients', client)
        const files = await fs.readdir(campaignDir)
        const campaignFile = files.find(f => f.startsWith(`${campaign}_v`) && f.endsWith('.md'))
        
        if (campaignFile) {
          const stat = await fs.stat(path.join(campaignDir, campaignFile))
          if (!lastModified || stat.mtime > lastModified) {
            lastModified = stat.mtime
          }
        }
      } catch (err) {
        // Campaign file might not exist
      }
    }
    
    // Also check global rules
    try {
      const globalDir = path.join(process.cwd(), 'prompts', 'global')
      const files = await fs.readdir(globalDir)
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const stat = await fs.stat(path.join(globalDir, file))
          if (!lastModified || stat.mtime > lastModified) {
            lastModified = stat.mtime
          }
        }
      }
    } catch (err) {
      // Global directory might not exist
    }
    
    return NextResponse.json({ 
      lastModified: lastModified?.toISOString() || null 
    })
  } catch (error) {
    console.error('Error checking modification time:', error)
    return NextResponse.json(
      { error: 'Failed to check modification time' },
      { status: 500 }
    )
  }
}