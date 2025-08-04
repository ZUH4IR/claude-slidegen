import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { brand, campaign } = await request.json()
    
    let filePath: string
    if (campaign) {
      filePath = path.join('prompts', brand, campaign, 'prompt.md')
    } else {
      filePath = path.join('prompts', brand, 'prompt.md')
    }
    
    // Get git log for this file
    const { stdout } = await execAsync(
      `git log --pretty=format:'%H|%s|%ai|%an' -10 -- "${filePath}"`,
      { cwd: process.cwd() }
    )
    
    const versions = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, message, date, author] = line.split('|')
        return { hash, message, date, author }
      })
    
    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error getting versions:', error)
    // Return empty array if git is not initialized or file has no history
    return NextResponse.json({ versions: [] })
  }
}