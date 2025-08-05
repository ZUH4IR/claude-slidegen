import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchUserPosts, fetchMusicDetails } from './ensemble'

global.fetch = vi.fn()

describe('ensemble.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchUserPosts', () => {
    it('should fetch user posts successfully', async () => {
      const mockPosts = [
        {
          aweme_id: '123',
          desc: 'Test video',
          create_time: 1700000000,
          music: {
            id: 'music123',
            title: 'Test Song',
            author: 'Test Artist'
          }
        }
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts })
      } as Response)

      const posts = await fetchUserPosts('testuser', 3)
      
      expect(posts).toEqual(mockPosts)
      expect(fetch).toHaveBeenCalledWith('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetchPosts',
          username: 'testuser',
          depth: 3
        })
      })
    })

    it('should throw error on failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User not found' })
      } as Response)

      await expect(fetchUserPosts('nonexistent', 3)).rejects.toThrow('User not found')
    })
  })

  describe('fetchMusicDetails', () => {
    it('should fetch music details successfully', async () => {
      const mockMusic = {
        id: 'music123',
        title: 'Test Song',
        author: 'Test Artist',
        duration: 30,
        user_count: 1000000
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ music: mockMusic })
      } as Response)

      const music = await fetchMusicDetails('music123')
      
      expect(music).toEqual(mockMusic)
      expect(fetch).toHaveBeenCalledWith('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetchMusic',
          musicId: 'music123'
        })
      })
    })
  })
})