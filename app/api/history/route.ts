import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const historyDir = path.join(process.cwd(), 'history')
    const entries: any[] = []
    
    try {
      const files = await fs.readdir(historyDir)
      
      // Sort files by name (timestamp) in descending order
      const sortedFiles = files
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
      
      // Read each file
      for (const file of sortedFiles) {
        try {
          const content = await fs.readFile(path.join(historyDir, file), 'utf-8')
          const data = JSON.parse(content)
          entries.push({
            id: file.replace('.json', ''),
            ...data
          })
        } catch (err) {
          console.error(`Error reading history file ${file}:`, err)
        }
      }
    } catch (err) {
      // History directory might not exist yet
      console.log('No history directory found')
    }
    
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error loading history:', error)
    return NextResponse.json({ entries: [] })
  }
}