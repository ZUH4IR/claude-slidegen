import { NextResponse } from 'next/server'
import { generateCSV } from '@/lib/generation'
import { GenerationConfig } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { config, hooks } = await request.json()
    const result = await generateCSV(config, hooks)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 })
  }
}