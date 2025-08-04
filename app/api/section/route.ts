import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    const { src, id, dst, mode = 'copy' } = await request.json()
    
    if (!src || !id || !dst) {
      return NextResponse.json(
        { error: 'Missing required parameters: src, id, dst' },
        { status: 400 }
      )
    }
    
    // Load source file
    const srcPath = path.join(process.cwd(), 'prompts', src)
    const srcContent = await fs.readFile(srcPath, 'utf-8')
    const { data: srcFrontmatter, content: srcBody } = matter(srcContent)
    
    // Extract section from source
    const sectionRegex = new RegExp(`(#{1,2}\\s+${id}[^#]*?)(?=#{1,2}\\s|$)`, 's')
    const sectionMatch = srcBody.match(sectionRegex)
    
    if (!sectionMatch) {
      return NextResponse.json(
        { error: `Section "${id}" not found in source file` },
        { status: 404 }
      )
    }
    
    const sectionContent = sectionMatch[1].trim()
    
    // Load destination file
    const dstPath = path.join(process.cwd(), 'prompts', dst)
    const dstContent = await fs.readFile(dstPath, 'utf-8')
    const { data: dstFrontmatter, content: dstBody } = matter(dstContent)
    
    let newContent: string
    
    if (mode === 'reference') {
      // Add reference tag
      newContent = `${dstBody}\n\n{{> ${id} }}\n`
    } else {
      // Copy section content
      newContent = `${dstBody}\n\n${sectionContent}\n`
      
      // Check for duplicate frontmatter keys
      const srcKeys = Object.keys(srcFrontmatter)
      const dstKeys = Object.keys(dstFrontmatter)
      const duplicates = srcKeys.filter(key => dstKeys.includes(key))
      
      if (duplicates.length > 0) {
        return NextResponse.json({
          warning: `Duplicate frontmatter keys found: ${duplicates.join(', ')}`,
          section: sectionContent
        })
      }
    }
    
    // Save updated destination file
    const updatedContent = matter.stringify(newContent, dstFrontmatter)
    await fs.writeFile(dstPath, updatedContent)
    
    return NextResponse.json({
      success: true,
      mode,
      section: mode === 'reference' ? `{{> ${id} }}` : sectionContent
    })
  } catch (error) {
    console.error('Section operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform section operation' },
      { status: 500 }
    )
  }
}