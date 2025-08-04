import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get('client')
    const type = searchParams.get('type')
    const campaign = searchParams.get('campaign')
    
    if (!client || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    const clientDir = path.join(process.cwd(), 'prompts', 'clients', client)
    const files = await fs.readdir(clientDir)
    
    let versionFiles: string[] = []
    if (type === 'brand') {
      versionFiles = files.filter(f => f.startsWith('_brand_v') && f.endsWith('.md'))
    } else if (type === 'campaign' && campaign) {
      versionFiles = files.filter(f => f.startsWith(`${campaign}_v`) && f.endsWith('.md'))
    }
    
    // Load version details
    const versions = await Promise.all(
      versionFiles.map(async (file) => {
        const filePath = path.join(clientDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const { data: frontmatter } = matter(content)
        const stats = await fs.stat(filePath)
        
        const versionMatch = file.match(/_v(\d+)\.md$/)
        const version = versionMatch ? parseInt(versionMatch[1]) : 1
        
        return {
          version,
          status: frontmatter.status || 'active',
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          file
        }
      })
    )
    
    // Sort by version number descending
    versions.sort((a, b) => b.version - a.version)
    
    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error loading versions:', error)
    return NextResponse.json(
      { error: 'Failed to load versions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { client, type, campaign, version, action } = await request.json()
    
    if (!client || !type || !version || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    const clientDir = path.join(process.cwd(), 'prompts', 'clients', client)
    
    if (action === 'activate') {
      // Archive all other versions
      const files = await fs.readdir(clientDir)
      let versionFiles: string[] = []
      
      if (type === 'brand') {
        versionFiles = files.filter(f => f.startsWith('_brand_v') && f.endsWith('.md'))
      } else if (type === 'campaign' && campaign) {
        versionFiles = files.filter(f => f.startsWith(`${campaign}_v`) && f.endsWith('.md'))
      }
      
      for (const file of versionFiles) {
        const filePath = path.join(clientDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const { data: frontmatter, content: body } = matter(content)
        
        const versionMatch = file.match(/_v(\d+)\.md$/)
        const fileVersion = versionMatch ? parseInt(versionMatch[1]) : 1
        
        // Update status
        frontmatter.status = fileVersion === version ? 'active' : 'archived'
        
        // Write back
        const newContent = matter.stringify(body, frontmatter)
        await fs.writeFile(filePath, newContent)
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing versions:', error)
    return NextResponse.json(
      { error: 'Failed to manage versions' },
      { status: 500 }
    )
  }
}