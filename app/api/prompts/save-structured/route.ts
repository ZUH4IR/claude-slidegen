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
    
    // Check if this is an update (version increment needed)
    const fileName = path.basename(filePath)
    const isUpdate = frontmatter.version && frontmatter.version > 1
    
    if (isUpdate) {
      // Archive previous versions
      const files = await fs.readdir(dirPath)
      const filePrefix = fileName.replace(/_v\d+\.md$/, '')
      const relatedFiles = files.filter(f => 
        f.startsWith(filePrefix + '_v') && f.endsWith('.md')
      )
      
      // Archive all existing versions
      for (const file of relatedFiles) {
        const existingPath = path.join(dirPath, file)
        const existingContent = await fs.readFile(existingPath, 'utf-8')
        const { data: existingFm, content: existingBody } = matter(existingContent)
        existingFm.status = 'archived'
        const updatedContent = matter.stringify(existingBody, existingFm)
        await fs.writeFile(existingPath, updatedContent)
      }
    }
    
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