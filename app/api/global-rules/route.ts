import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const GLOBAL_RULES_PATH = path.join(process.cwd(), 'global-rules.md')

export async function GET() {
  try {
    const content = await fs.readFile(GLOBAL_RULES_PATH, 'utf-8')
    return NextResponse.json({ content })
  } catch (error) {
    // File doesn't exist, return empty content
    return NextResponse.json({ content: '' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()
    
    await fs.writeFile(GLOBAL_RULES_PATH, content)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving global rules:', error)
    return NextResponse.json(
      { error: 'Failed to save global rules' },
      { status: 500 }
    )
  }
}