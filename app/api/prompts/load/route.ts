import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const client = searchParams.get('client')
    const campaign = searchParams.get('campaign')
    
    if (!type || !client) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    if (type === 'global') {
      // Load global rules
      const globalPath = path.join(process.cwd(), 'prompts', 'global', 'rules_v1.md')
      const fileContent = await fs.readFile(globalPath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)
      return NextResponse.json({ frontmatter, content })
    }
    
    const clientsDir = path.join(process.cwd(), 'prompts', 'clients', client)
    
    if (type === 'client') {
      // Find the active client file
      const files = await fs.readdir(clientsDir)
      const clientFile = files.find(f => f.startsWith('_client_v') && f.endsWith('.md'))
      
      if (!clientFile) {
        return NextResponse.json(
          { error: 'Client file not found' },
          { status: 404 }
        )
      }
      
      const filePath = path.join(clientsDir, clientFile)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)
      
      return NextResponse.json({ frontmatter, content })
    } else if (type === 'campaign' && campaign) {
      // Find the active campaign file
      const files = await fs.readdir(clientsDir)
      const campaignFile = files.find(f => f.startsWith(`${campaign}_v`) && f.endsWith('.md'))
      
      if (!campaignFile) {
        return NextResponse.json(
          { error: 'Campaign file not found' },
          { status: 404 }
        )
      }
      
      const filePath = path.join(clientsDir, campaignFile)
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)
      
      return NextResponse.json({ frontmatter, content })
    }
    
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error loading prompt:', error)
    return NextResponse.json(
      { error: 'Failed to load prompt' },
      { status: 500 }
    )
  }
}