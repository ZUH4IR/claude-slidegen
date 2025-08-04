import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { brand, campaign, hash } = await request.json()
    
    let filePath: string
    if (campaign) {
      filePath = path.join('prompts', brand, campaign, 'prompt.md')
    } else {
      filePath = path.join('prompts', brand, 'prompt.md')
    }
    
    // Get the file content at the specified commit
    const { stdout: oldContent } = await execAsync(
      `git show ${hash}:"${filePath}"`,
      { cwd: process.cwd() }
    )
    
    // Get current file content
    const { stdout: newContent } = await execAsync(
      `cat "${filePath}"`,
      { cwd: process.cwd() }
    )
    
    return NextResponse.json({
      old: oldContent,
      new: newContent
    })
  } catch (error) {
    console.error('Error getting diff:', error)
    return NextResponse.json(
      { error: 'Failed to get diff' },
      { status: 500 }
    )
  }
}