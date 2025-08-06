import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, frontmatter, content } = await request.json()
    
    // Construct the full path based on the file type
    let fullPath: string
    if (filePath.startsWith('blueprints/')) {
      // Blueprint files are in the blueprints directory
      fullPath = path.join(process.cwd(), filePath)
    } else if (filePath.startsWith('global/')) {
      // Global files are in prompts/global
      fullPath = path.join(process.cwd(), 'prompts', filePath)
    } else {
      // Client/campaign files are in prompts/clients
      fullPath = path.join(process.cwd(), 'prompts', 'clients', filePath)
    }
    
    const dirPath = path.dirname(fullPath)
    
    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true })
    
    // Skip versioning for blueprints and global files
    const isBlueprint = filePath.startsWith('blueprints/')
    const isGlobal = filePath.startsWith('global/')
    
    if (!isBlueprint && !isGlobal) {
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
    }
    
    // Create the file content
    let fileContent: string
    if (isBlueprint || (isGlobal && !frontmatter) || Object.keys(frontmatter || {}).length === 0) {
      // For blueprints and global files without frontmatter, save content as-is
      fileContent = content
    } else {
      // For other files, include frontmatter
      fileContent = matter.stringify(content, frontmatter)
    }
    
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