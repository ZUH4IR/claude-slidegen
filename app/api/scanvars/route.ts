import { NextRequest, NextResponse } from 'next/server'
import { scanVars } from '@/lib/scanVars'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const client = searchParams.get('client')
    const campaign = searchParams.get('campaign')
    
    const result = await scanVars(client || undefined, campaign || undefined)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error scanning variables:', error)
    return NextResponse.json(
      { variables: [], errors: ['Failed to scan variables'] },
      { status: 500 }
    )
  }
}