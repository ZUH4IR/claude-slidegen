import { z } from 'zod'

export const musicInfoSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  id_str: z.string().optional(),
  mid: z.union([z.string(), z.number()]).optional(),
  title: z.string(),
  author: z.string(),
  album: z.string().optional(),
  cover_thumb: z.object({
    url_list: z.array(z.string())
  }).optional()
}).transform(data => ({
  ...data,
  id: String(data.id_str || data.id || data.mid || '')
}))

export const tiktokPostSchema = z.object({
  aweme_id: z.string().optional(),
  id: z.string().optional(),
  desc: z.string().default(''),
  description: z.string().optional(),
  create_time: z.number().optional(),
  createTime: z.number().optional(),
  music: musicInfoSchema.nullable().optional(),
  added_sound_music_info: musicInfoSchema.nullable().optional(),
  author: z.object({
    unique_id: z.string().optional(),
    nickname: z.string().optional(),
    uid: z.string().optional()
  }).nullable().optional(),
  statistics: z.object({
    play_count: z.number().default(0),
    digg_count: z.number().default(0),
    comment_count: z.number().default(0),
    share_count: z.number().default(0)
  }).nullable().optional()
}).transform(data => ({
  aweme_id: data.aweme_id || data.id || '',
  desc: data.desc || data.description || '',
  create_time: data.create_time || data.createTime || 0,
  music: data.music || data.added_sound_music_info || null,
  author: data.author || null,
  statistics: data.statistics || null
}))

export const musicTrackSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  id_str: z.string().optional(),
  mid: z.union([z.string(), z.number()]).optional(),
  title: z.string(),
  author: z.string(),
  album: z.string().optional(),
  duration: z.number().optional().default(0),
  user_count: z.number().optional().default(0),
  use_count: z.number().optional(),
  cover_thumb: z.object({
    url_list: z.array(z.string())
  }).optional(),
  play_url: z.object({
    url_list: z.array(z.string())
  }).optional(),
  share_info: z.object({
    share_url: z.string().optional()
  }).passthrough().optional(),
  share_url: z.string().optional()
}).passthrough().transform(data => ({
  ...data,
  id: String(data.id_str || data.id || data.mid || ''),
  user_count: data.user_count || data.use_count || 0
}))

export type MusicInfo = z.infer<typeof musicInfoSchema>
export type TikTokPost = z.infer<typeof tiktokPostSchema>
export type MusicTrack = z.infer<typeof musicTrackSchema>