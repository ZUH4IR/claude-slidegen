import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { type, brand, campaign, version } = await request.json()
    const promptsDir = path.join(process.cwd(), 'prompts')

    if (!version || !version.match(/^v\d+$/)) {
      return NextResponse.json(
        { error: 'Invalid version format' },
        { status: 400 }
      )
    }

    if (type === 'brand' && brand) {
      const brandDir = path.join(promptsDir, 'clients', brand)
      const files = await fs.readdir(brandDir)
      
      // Find all brand prompt versions
      const brandFiles = files.filter(f => 
        f.startsWith('_brand_') && f.endsWith('.md')
      )
      
      // Check if requested version exists
      const targetFile = `_brand_${version}.md`
      if (!brandFiles.includes(targetFile)) {
        return NextResponse.json(
          { error: `Version ${version} not found` },
          { status: 404 }
        )
      }
      
      // Here you would typically update a config file or database
      // For now, we'll just return success
      // In a real implementation, you'd track which version is active
      
    } else if (type === 'campaign' && brand && campaign) {
      const brandDir = path.join(promptsDir, 'clients', brand)
      const files = await fs.readdir(brandDir)
      
      // Find all campaign versions
      const campaignFiles = files.filter(f => 
        f.startsWith(`${campaign}_`) && f.endsWith('.md')
      )
      
      // Check if requested version exists
      const targetFile = `${campaign}_${version}.md`
      if (!campaignFiles.includes(targetFile)) {
        return NextResponse.json(
          { error: `Version ${version} not found` },
          { status: 404 }
        )
      }
      
      // Here you would typically update a config file or database
      // For now, we'll just return success
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set version error:', error)
    return NextResponse.json(
      { error: 'Failed to set version' },
      { status: 500 }
    )
  }
}