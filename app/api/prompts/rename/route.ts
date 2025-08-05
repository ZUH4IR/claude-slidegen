import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { type, oldName, newName, brand } = await request.json()
    const promptsDir = path.join(process.cwd(), 'prompts')

    if (!newName || newName === oldName) {
      return NextResponse.json(
        { error: 'Invalid new name' },
        { status: 400 }
      )
    }

    if (type === 'brand') {
      const oldPath = path.join(promptsDir, 'clients', oldName)
      const newPath = path.join(promptsDir, 'clients', newName)
      
      // Check if old path exists
      try {
        await fs.stat(oldPath)
      } catch {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }
      
      // Check if new path already exists
      try {
        await fs.stat(newPath)
        return NextResponse.json(
          { error: 'A brand with this name already exists' },
          { status: 409 }
        )
      } catch {
        // Good, new path doesn't exist
      }
      
      // Rename the directory
      await fs.rename(oldPath, newPath)
      
    } else if (type === 'campaign' && brand) {
      const brandDir = path.join(promptsDir, 'clients', brand)
      const files = await fs.readdir(brandDir)
      
      // Find all files for this campaign
      const campaignFiles = files.filter(f => 
        f.startsWith(`${oldName}_v`) && f.endsWith('.md')
      )
      
      // Check if new campaign name already exists
      const newCampaignFiles = files.filter(f => 
        f.startsWith(`${newName}_v`) && f.endsWith('.md')
      )
      
      if (newCampaignFiles.length > 0) {
        return NextResponse.json(
          { error: 'A campaign with this name already exists' },
          { status: 409 }
        )
      }
      
      // Rename all campaign files
      for (const file of campaignFiles) {
        const version = file.match(/_v(\d+)\.md$/)?.[1]
        if (version) {
          const oldPath = path.join(brandDir, file)
          const newPath = path.join(brandDir, `${newName}_v${version}.md`)
          await fs.rename(oldPath, newPath)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rename error:', error)
    return NextResponse.json(
      { error: 'Failed to rename' },
      { status: 500 }
    )
  }
}