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
    const blueprintName = searchParams.get('blueprint')
    
    if (!type || (!client && type !== 'blueprint')) {
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
    
    if (type === 'blueprint' && blueprintName) {
      // Load blueprint
      const blueprintPath = path.join(process.cwd(), 'blueprints', `${blueprintName}.md`)
      const fileContent = await fs.readFile(blueprintPath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)
      return NextResponse.json({ frontmatter, content })
    }
    
    const clientsDir = path.join(process.cwd(), 'prompts', 'clients', client!)
    
    if (type === 'client') {
      try {
        // Find the active client file
        const files = await fs.readdir(clientsDir)
        const clientFile = files.find(f => f.startsWith('_brand_v') && f.endsWith('.md'))
        
        if (!clientFile) {
          console.log(`[API] No client file found for ${client} in ${clientsDir}`)
          console.log('[API] Available files:', files)
          return NextResponse.json(
            { error: 'Client file not found', details: `No _brand_v*.md file found for ${client}` },
            { status: 404 }
          )
        }
        
        const filePath = path.join(clientsDir, clientFile)
        console.log('[API] Reading client file:', filePath)
        const fileContent = await fs.readFile(filePath, 'utf-8')
        const { data: frontmatter, content } = matter(fileContent)
        
        console.log('[API] Parsed content length:', content.length)
        console.log('[API] Frontmatter keys:', Object.keys(frontmatter))
        
        return NextResponse.json({ frontmatter, content })
      } catch (err) {
        console.error('[API] Error loading client file:', err)
        return NextResponse.json(
          { error: 'Failed to load client file', details: err instanceof Error ? err.message : 'Unknown error' },
          { status: 500 }
        )
      }
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