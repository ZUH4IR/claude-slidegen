import { TikTokPost, MusicTrack } from '@/types/tiktok'

export async function fetchUserPosts(
  username: string,
  depth: number = 3
): Promise<TikTokPost[]> {
  const response = await fetch('/api/music', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'fetchPosts',
      username,
      depth
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch posts')
  }

  const data = await response.json()
  return data.posts
}

export async function fetchMusicDetails(
  musicId: string
): Promise<MusicTrack | null> {
  const response = await fetch('/api/music', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'fetchMusic',
      musicId
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch music details')
  }

  const data = await response.json()
  return data.music
}