import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Read the debug CSV file
    const csvPath = '/Users/zuhair/Downloads/08.03vibitpt.csv'
    const csvContent = await fs.readFile(csvPath, 'utf-8')
    
    return NextResponse.json({ csv: csvContent })
  } catch (error) {
    console.error('Error reading debug CSV:', error)
    return NextResponse.json(
      { error: 'Failed to read debug CSV' },
      { status: 500 }
    )
  }
}