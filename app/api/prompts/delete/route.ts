import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { type, name, brand } = await request.json()
    const promptsDir = path.join(process.cwd(), 'prompts')

    let targetPath = ''
    
    if (type === 'brand') {
      targetPath = path.join(promptsDir, 'clients', name)
    } else if (type === 'campaign' && brand) {
      const brandDir = path.join(promptsDir, 'clients', brand)
      const files = await fs.readdir(brandDir)
      
      // Find all files for this campaign
      const campaignFiles = files.filter(f => 
        f.startsWith(`${name}_v`) && f.endsWith('.md')
      )
      
      // Delete all campaign files
      for (const file of campaignFiles) {
        await fs.unlink(path.join(brandDir, file))
      }
      
      return NextResponse.json({ success: true })
    }

    // For brand deletion, remove entire directory
    if (type === 'brand') {
      const stats = await fs.stat(targetPath)
      if (stats.isDirectory()) {
        await fs.rm(targetPath, { recursive: true })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    )
  }
}