import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter required' }, { status: 400 })
    }
    
    // Security: ensure path is within prompts directory
    const normalizedPath = path.normalize(filePath)
    if (normalizedPath.includes('..') || (!normalizedPath.startsWith('global/') && !normalizedPath.startsWith('clients/'))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }
    
    const fullPath = path.join(process.cwd(), 'prompts', normalizedPath)
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8')
      return NextResponse.json({ content })
    } catch (err) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error loading file:', error)
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 })
  }
}

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