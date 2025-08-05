import { z } from 'zod'
import { TikTokPost, MusicTrack, tiktokPostSchema, musicTrackSchema } from '@/types/tiktok'

const ENSEMBLE_BASE_URL = 'https://ensembledata.com/apis'
const API_TOKEN = process.env.EDATA_TOKEN

console.log('[EnsembleAPI] Initializing with token:', process.env.EDATA_TOKEN ? 'Token is set' : 'TOKEN NOT SET!')
console.log('[EnsembleAPI] Available env vars:', Object.keys(process.env).filter(k => k.includes('EDATA')))

if (!API_TOKEN) {
  console.error('[EnsembleAPI] EDATA_TOKEN is not set in environment variables')
  throw new Error('EDATA_TOKEN environment variable is not set')
}

class EnsembleAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'EnsembleAPIError'
  }
}

async function ensembleFetch<T>(
  endpoint: string,
  schema: z.ZodSchema<T>,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${ENSEMBLE_BASE_URL}${endpoint}`)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  url.searchParams.append('token', API_TOKEN!)

  console.log('[EnsembleAPI] Request URL:', url.toString())
  console.log('[EnsembleAPI] Token:', API_TOKEN ? `${API_TOKEN.substring(0, 4)}...${API_TOKEN.substring(API_TOKEN.length - 4)}` : 'NOT SET')

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
    }
  })

  console.log('[EnsembleAPI] Response status:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[EnsembleAPI] Error response:', errorText)
    throw new EnsembleAPIError(
      `API request failed: ${response.statusText}`,
      response.status,
      errorText
    )
  }

  const data = await response.json()
  console.log('[EnsembleAPI] Response data:', JSON.stringify(data, null, 2))
  
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[EnsembleAPI] Zod validation error:', error.errors)
      console.error('[EnsembleAPI] Raw API response:', JSON.stringify(data, null, 2))
      throw new EnsembleAPIError(
        'Invalid API response format',
        undefined,
        error.errors
      )
    }
    throw error
  }
}

export async function fetchUserPosts(
  username: string,
  depth: number = 3
): Promise<TikTokPost[]> {
  try {
    // First try with a completely flexible schema to see what we get
    const response = await ensembleFetch(
      '/tt/user/posts',
      z.any(),
      { username, depth }
    )
    
    console.log('[EnsembleAPI] Raw user posts response type:', typeof response)
    console.log('[EnsembleAPI] Raw user posts response keys:', response ? Object.keys(response) : 'null')
    
    // Handle different possible response structures
    if (response && typeof response === 'object') {
      // Check if data is directly an array (as seen in the logs)
      if ('data' in response && Array.isArray(response.data)) {
        console.log('[EnsembleAPI] Found posts in response.data array, parsing...')
        // Log first post structure for debugging
        if (response.data.length > 0) {
          console.log('[EnsembleAPI] First post structure:', JSON.stringify(Object.keys(response.data[0]), null, 2))
          console.log('[EnsembleAPI] First post id:', response.data[0].id || response.data[0].aweme_id)
          const musicInfo = response.data[0].music || response.data[0].added_sound_music_info
          if (musicInfo) {
            console.log('[EnsembleAPI] Music info keys:', Object.keys(musicInfo).filter(k => k.includes('id') || k.includes('Id')))
            console.log('[EnsembleAPI] Music mid:', musicInfo.mid)
            console.log('[EnsembleAPI] Music id:', musicInfo.id)
            console.log('[EnsembleAPI] Music id_str:', musicInfo.id_str)
          }
        }
        try {
          const parsedPosts = response.data.map((post: any, index: number) => {
            try {
              return tiktokPostSchema.parse(post)
            } catch (e) {
              if (index === 0) {
                console.warn('[EnsembleAPI] Failed to parse first post, error:', e)
              }
              return null
            }
          }).filter(Boolean)
          console.log(`[EnsembleAPI] Successfully parsed ${parsedPosts.length} out of ${response.data.length} posts`)
          return parsedPosts
        } catch (e) {
          console.error('[EnsembleAPI] Error parsing posts:', e)
          return []
        }
      }
      if (response.data && typeof response.data === 'object') {
        if ('aweme_list' in response.data && Array.isArray(response.data.aweme_list)) {
          return response.data.aweme_list
        }
        if ('posts' in response.data && Array.isArray(response.data.posts)) {
          return response.data.posts
        }
      }
      if ('aweme_list' in response && Array.isArray(response.aweme_list)) {
        return response.aweme_list
      }
      if ('posts' in response && Array.isArray(response.posts)) {
        return response.posts
      }
      if ('items' in response && Array.isArray(response.items)) {
        return response.items
      }
      if (Array.isArray(response)) {
        return response
      }
    }
    
    console.warn('[EnsembleAPI] Unexpected response structure for user posts')
    return []
  } catch (error) {
    console.error('[EnsembleAPI] Error fetching user posts:', error)
    if (error instanceof EnsembleAPIError) {
      if (error.status === 404) {
        console.warn(`User @${username} not found`)
        return []
      }
      // Log the actual error for debugging
      console.error('[EnsembleAPI] API Error details:', error.details)
    }
    return [] // Return empty array instead of throwing
  }
}

export async function fetchMusicDetails(
  musicId: string
): Promise<MusicTrack | null> {
  try {
    console.log(`[EnsembleAPI] Fetching music details for ID: ${musicId}`)
    
    const response = await ensembleFetch(
      '/tt/music/details', 
      z.any(),
      { id: musicId }  // Changed from music_id to id
    )
    
    console.log('[EnsembleAPI] Raw music response type:', typeof response)
    console.log('[EnsembleAPI] Raw music response keys:', response ? Object.keys(response) : 'null')
    
    // Handle different possible response structures
    if (response && typeof response === 'object') {
      let musicData = null
      
      if (response.data) {
        musicData = response.data
      } else if (response.music) {
        musicData = response.music
      } else if (response.id && response.title) {
        // Direct music object
        musicData = response
      }
      
      // Ensure the ID matches what we requested
      if (musicData) {
        // Log all fields to understand the structure
        console.log('[EnsembleAPI] Music data fields:', Object.keys(musicData))
        console.log('[EnsembleAPI] Music title:', musicData.title)
        console.log('[EnsembleAPI] Music author:', musicData.author || musicData.author_name)
        
        // Check for URL fields
        if (musicData.music_url) console.log('[EnsembleAPI] music_url:', musicData.music_url)
        if (musicData.share_url) console.log('[EnsembleAPI] share_url:', musicData.share_url)
        if (musicData.play_url) console.log('[EnsembleAPI] play_url:', musicData.play_url)
        
        // The API might return id_str or a different field, so let's ensure consistency
        if (!musicData.id && musicData.id_str) {
          musicData.id = musicData.id_str
        } else if (!musicData.id && musicData.mid) {
          musicData.id = musicData.mid
        }
        
        // Ensure ID is always a string and preserve the requested ID
        if (musicData.id) {
          musicData.id = String(musicData.id)
        } else {
          // If no ID in response, use the requested ID
          musicData.id = musicId
        }
        
        console.log(`[EnsembleAPI] Processed music data - Requested ID: ${musicId}, Response ID: ${musicData.id}`)
        
        // Force the ID to match what was requested to maintain consistency
        musicData.id = musicId
        
        // Extract share URL if available
        try {
          if (musicData.share_info && typeof musicData.share_info === 'object' && musicData.share_info.share_url) {
            musicData.share_url = String(musicData.share_info.share_url)
            console.log(`[EnsembleAPI] Found share_url: ${musicData.share_url}`)
          } else {
            console.log(`[EnsembleAPI] No share_url found in response`)
          }
        } catch (err) {
          console.error(`[EnsembleAPI] Error extracting share_url:`, err)
        }
        
        return musicData
      }
    }
    
    console.warn('[EnsembleAPI] Unexpected music response structure')
    return null
  } catch (error) {
    console.error('[EnsembleAPI] Error fetching music details:', error)
    if (error instanceof EnsembleAPIError && error.status === 404) {
      console.warn(`Music ${musicId} not found`)
      return null
    }
    return null // Return null instead of throwing
  }
}