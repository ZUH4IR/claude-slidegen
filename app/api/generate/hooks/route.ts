import { NextResponse } from 'next/server'
import { generateHooks } from '@/lib/generation'
import { GenerationConfig } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const config: GenerationConfig = await request.json()
    const hooks = await generateHooks(config)
    return NextResponse.json({ hooks })
  } catch (error) {
    console.error('Error generating hooks:', error)
    return NextResponse.json({ error: 'Failed to generate hooks' }, { status: 500 })
  }
}