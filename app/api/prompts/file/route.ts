import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    const { brand, campaign } = await request.json()
    
    let filePath: string
    if (campaign) {
      filePath = path.join(process.cwd(), 'prompts', brand, campaign, 'prompt.md')
    } else {
      filePath = path.join(process.cwd(), 'prompts', brand, 'prompt.md')
    }
    
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const { data: metadata, content } = matter(fileContent)
    
    return NextResponse.json({
      type: campaign ? 'campaign' : 'brand',
      brand,
      campaign,
      content,
      metadata
    })
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}