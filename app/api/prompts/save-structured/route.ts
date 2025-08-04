import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, frontmatter, content } = await request.json()
    
    // Construct the full path
    const fullPath = path.join(process.cwd(), 'prompts', 'clients', filePath)
    const dirPath = path.dirname(fullPath)
    
    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true })
    
    // Create the file content with frontmatter
    const fileContent = matter.stringify(content, frontmatter)
    
    // Write the file
    await fs.writeFile(fullPath, fileContent)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving structured prompt:', error)
    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    )
  }
}