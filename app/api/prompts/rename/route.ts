import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { client, oldName, newName } = await request.json()
    
    if (!client || !oldName || !newName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    const clientDir = path.join(process.cwd(), 'prompts', 'clients', client)
    
    // Find all files for the old campaign
    const files = await fs.readdir(clientDir)
    const campaignFiles = files.filter(f => 
      f.startsWith(`${oldName}_v`) && f.endsWith('.md')
    )
    
    // Rename each file
    for (const file of campaignFiles) {
      const oldPath = path.join(clientDir, file)
      const newFileName = file.replace(`${oldName}_v`, `${newName}_v`)
      const newPath = path.join(clientDir, newFileName)
      
      await fs.rename(oldPath, newPath)
    }
    
    return NextResponse.json({ 
      success: true, 
      renamed: campaignFiles.length 
    })
  } catch (error) {
    console.error('Error renaming campaign:', error)
    return NextResponse.json(
      { error: 'Failed to rename campaign' },
      { status: 500 }
    )
  }
}