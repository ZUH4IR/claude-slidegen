import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    const { type, name, brand } = await request.json()
    
    if (type === 'brand') {
      // Create brand directory
      const brandDir = path.join(process.cwd(), 'prompts', name)
      await fs.mkdir(brandDir, { recursive: true })
      
      // Create default prompt.md
      const content = matter.stringify(
        `# ${name} Brand Voice Guidelines

## Brand Voice
- Define your brand voice here

## Content Rules
- Add content rules specific to this brand`,
        { name, created: new Date().toISOString() }
      )
      
      await fs.writeFile(path.join(brandDir, 'prompt.md'), content)
    } else if (type === 'campaign' && brand) {
      // Create campaign directory
      const campaignDir = path.join(process.cwd(), 'prompts', brand, name)
      await fs.mkdir(campaignDir, { recursive: true })
      
      // Create default prompt.md
      const content = matter.stringify(
        `# ${name} Campaign Guidelines

## Campaign Goals
- Define campaign goals here

## Specific Messaging
- Add campaign-specific messaging`,
        { name, created: new Date().toISOString() }
      )
      
      await fs.writeFile(path.join(campaignDir, 'prompt.md'), content)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating:', error)
    return NextResponse.json(
      { error: 'Failed to create' },
      { status: 500 }
    )
  }
}