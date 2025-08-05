import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchUserPosts, fetchMusicDetails } from '@/lib/ensemble-server'

const requestSchema = z.object({
  action: z.enum(['fetchPosts', 'fetchMusic']),
  username: z.string().optional(),
  depth: z.number().optional(),
  musicId: z.string().optional()
})

export async function POST(request: NextRequest) {
  console.log('[Music API] Received request')
  
  try {
    const body = await request.json()
    console.log('[Music API] Request body:', body)
    
    const { action, username, depth, musicId } = requestSchema.parse(body)

    if (action === 'fetchPosts') {
      if (!username) {
        return NextResponse.json({ error: 'Username required' }, { status: 400 })
      }
      console.log(`[Music API] Fetching posts for @${username} with depth ${depth}`)
      const posts = await fetchUserPosts(username, depth)
      console.log(`[Music API] Retrieved ${posts.length} posts`)
      return NextResponse.json({ posts })
    }

    if (action === 'fetchMusic') {
      if (!musicId) {
        return NextResponse.json({ error: 'Music ID required' }, { status: 400 })
      }
      console.log(`[Music API] Fetching music details for ID: ${musicId}`)
      const music = await fetchMusicDetails(musicId)
      console.log(`[Music API] Retrieved music:`, music ? 'Found' : 'Not found')
      return NextResponse.json({ music })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Music API] Error:', error)
    console.error('[Music API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}