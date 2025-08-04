import { NextResponse } from 'next/server'
import { getPromptFiles, savePromptFile, getBrandOptions, getCampaignOptions } from '@/lib/fileUtils'

export async function GET() {
  try {
    const [files, brands, campaigns] = await Promise.all([
      getPromptFiles(),
      getBrandOptions(),
      getCampaignOptions()
    ])
    
    return NextResponse.json({
      files,
      brands,
      campaigns,
      blueprints: ['story_6', 'tutorial_5']
    })
  } catch (error) {
    console.error('Error fetching prompt files:', error)
    return NextResponse.json({ error: 'Failed to fetch prompt files' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { filePath, content } = await request.json()
    await savePromptFile(filePath, content)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving prompt file:', error)
    return NextResponse.json({ error: 'Failed to save prompt file' }, { status: 500 })
  }
}