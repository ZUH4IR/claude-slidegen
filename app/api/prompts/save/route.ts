import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { brand, campaign, content } = await request.json()
    
    let filePath: string
    if (campaign) {
      filePath = path.join(process.cwd(), 'prompts', brand, campaign, 'prompt.md')
    } else {
      filePath = path.join(process.cwd(), 'prompts', brand, 'prompt.md')
    }
    
    // Read existing file to preserve metadata
    let metadata = {}
    try {
      const existing = await fs.readFile(filePath, 'utf-8')
      const parsed = matter(existing)
      metadata = parsed.data
    } catch {}
    
    // Update metadata with current timestamp
    metadata = {
      ...metadata,
      lastModified: new Date().toISOString()
    }
    
    // Write the file with frontmatter
    const fileContent = matter.stringify(content, metadata)
    await fs.writeFile(filePath, fileContent)
    
    // Commit to git
    try {
      await execAsync(`git add "${filePath}"`)
      await execAsync(`git commit -m "Update prompt: ${brand}${campaign ? `/${campaign}` : ''}"`)
    } catch (err) {
      // Git might not be initialized or no changes
      console.log('Git commit skipped:', err)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    )
  }
}