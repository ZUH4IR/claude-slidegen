'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Music, Copy, AlertCircle, Play, Pause, FolderOpen, FileText, Save, CheckCircle, ExternalLink, Video, Trash2, Plus, Download, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
// Remove direct import - will use API route instead
import type { MusicTrack } from '@/types/tiktok'
import pLimit from 'p-limit'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const formSchema = z.object({
  depth: z.number().min(1).max(10)
})

type FormData = z.infer<typeof formSchema>

interface ProcessedTrack extends MusicTrack {
  localUsageCount: number
  firstSeen: Date
  lastSeen: Date
  soundUrl: string
  share_url?: string
  play_url?: {
    url_list: string[]
  }
  sourceVideos?: Array<{
    id: string
    desc: string
    author: string
    url: string
  }>
}

interface SavedTrackDisplay extends MusicTrack {
  localUsageCount: number
  soundUrl: string
  share_url?: string
  play_url?: {
    url_list: string[]
  }
  sourceVideos?: Array<{
    id: string
    desc: string
    author: string
    url: string
  }>
}

export default function MusicSourcingPage() {
  const [tracks, setTracks] = useState<ProcessedTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [campaignAccounts, setCampaignAccounts] = useState<string[]>([])
  const [availableClients, setAvailableClients] = useState<string[]>([])
  const [availableCampaigns, setAvailableCampaigns] = useState<string[]>([])
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [savedTracks, setSavedTracks] = useState<any[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depth: 3
    }
  })
  
  // Load available clients on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch('/api/prompts/tree')
        if (response.ok) {
          const data = await response.json()
          setAvailableClients(Object.keys(data.clients || {}))
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
    loadClients()
  }, [])

  // Load campaigns when client changes
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!selectedClient) {
        setAvailableCampaigns([])
        return
      }
      
      try {
        const response = await fetch('/api/prompts/tree')
        if (response.ok) {
          const data = await response.json()
          const campaigns = data.clients[selectedClient]?.campaigns || []
          setAvailableCampaigns(campaigns)
        }
      } catch (error) {
        console.error('Error loading campaigns:', error)
      }
    }
    loadCampaigns()
  }, [selectedClient])

  // Load campaign accounts when client/campaign changes
  useEffect(() => {
    const loadCampaignAccounts = async () => {
      if (!selectedClient || !selectedCampaign) {
        setCampaignAccounts([])
        return
      }
      
      try {
        // Use the API to load the campaign data
        const response = await fetch(`/api/prompts/load?type=campaign&client=${selectedClient}&campaign=${selectedCampaign}`)
        if (response.ok) {
          const data = await response.json()
          const accounts = data.frontmatter?.tracked_accounts || []
          setCampaignAccounts(accounts)
          // Auto-fill the form with campaign accounts
          if (accounts.length > 0) {
            form.setValue('usernames', accounts.join('\n'))
          }
          // Load saved tracks
          const saved = data.frontmatter?.saved_tracks || []
          setSavedTracks(saved)
        }
      } catch (error) {
        console.error('Error loading campaign accounts:', error)
      }
    }
    
    loadCampaignAccounts()
  }, [selectedClient, selectedCampaign, form])
  
  // Prefill client/campaign if coming from URL
  useEffect(() => {
    const client = searchParams.get('client')
    const campaign = searchParams.get('campaign')
    
    if (client) setSelectedClient(client)
    if (campaign) setSelectedCampaign(campaign)
  }, [searchParams])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: 'Sound link copied to clipboard'
    })
  }

  const downloadAsCSV = (data: ProcessedTrack[], filename: string) => {
    // Prepare data for CSV
    const csvData = data.map(track => ({
      'Track Title': track.title,
      'Artist': track.author,
      'Total Videos': track.user_count || 0,
      'Used by Accounts': track.localUsageCount,
      'TikTok URL': track.share_url || track.soundUrl || generateTikTokUrl(track),
      'Track ID': track.id
    }))

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(csvData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Music Tracks')

    // Generate and download
    XLSX.writeFile(wb, filename)
    
    toast({
      title: 'Downloaded!',
      description: `${data.length} tracks exported to ${filename}`
    })
  }

  const copyAllLinks = (data: ProcessedTrack[]) => {
    const links = data.map(track => 
      track.share_url || track.soundUrl || generateTikTokUrl(track)
    ).join('\n')
    
    navigator.clipboard.writeText(links)
    
    toast({
      title: 'Copied!',
      description: `${data.length} music links copied to clipboard`
    })
  }

  const generateTikTokUrl = (track: ProcessedTrack) => {
    // Generate URL in the format: /music/[title-slug]-[id]
    // Based on real example: /music/BABYDOLL-Speed-7080347657255782402
    
    const titleSlug = (track.title || 'original-sound')
      .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and dashes
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single
      .trim()
    
    return `https://www.tiktok.com/music/${titleSlug}-${track.id}`
  }

  const saveTrackToCampaign = async (track: ProcessedTrack) => {
    if (!selectedClient || !selectedCampaign) {
      toast({
        title: 'No Campaign Selected',
        description: 'Please select a client and campaign first',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      // Load current campaign data
      const loadResponse = await fetch(`/api/prompts/load?type=campaign&client=${selectedClient}&campaign=${selectedCampaign}`)
      if (!loadResponse.ok) throw new Error('Failed to load campaign')
      
      const campaignData = await loadResponse.json()
      
      // Get existing saved tracks or initialize empty array
      const existingTracks = campaignData.frontmatter?.saved_tracks || []
      
      // Check if track already exists
      if (existingTracks.find((t: any) => t.id === track.id)) {
        toast({
          title: 'Track Already Saved',
          description: `${track.title} is already in your saved tracks`,
          variant: 'destructive'
        })
        return
      }
      
      // Add new track
      const newTrack = {
        id: track.id,
        title: track.title,
        author: track.author,
        user_count: track.user_count,
        local_usage: track.localUsageCount,
        sound_url: track.share_url || generateTikTokUrl(track),
        share_url: track.share_url || undefined,
        play_url: track.play_url,
        sourceVideos: track.sourceVideos,
        saved_at: new Date().toISOString()
      }
      
      // Update frontmatter
      const updatedFrontmatter = {
        ...campaignData.frontmatter,
        saved_tracks: [...existingTracks, newTrack]
      }
      
      // Determine the file path for the campaign
      const currentVersion = campaignData.frontmatter?.version || 1
      const filePath = `${selectedClient}/${selectedCampaign}_v${currentVersion}.md`
      
      // Save updated campaign
      const saveResponse = await fetch('/api/prompts/save-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: campaignData.content,
          frontmatter: updatedFrontmatter
        })
      })
      
      if (!saveResponse.ok) throw new Error('Failed to save campaign')
      
      // Update local state
      setSavedTracks([...existingTracks, newTrack])
      
      toast({
        title: 'Track Saved!',
        description: `${track.title} saved to ${selectedCampaign} campaign`
      })
      
    } catch (error) {
      console.error('Error saving track:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save track',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const saveCampaignAccounts = async () => {
    if (!selectedClient || !selectedCampaign) {
      return
    }

    setIsSaving(true)
    try {
      // Load current campaign data
      const loadResponse = await fetch(`/api/prompts/load?type=campaign&client=${selectedClient}&campaign=${selectedCampaign}`)
      if (!loadResponse.ok) throw new Error('Failed to load campaign')
      
      const campaignData = await loadResponse.json()
      
      // Update frontmatter with new tracked accounts
      const updatedFrontmatter = {
        ...campaignData.frontmatter,
        tracked_accounts: campaignAccounts
      }
      
      // Determine the file path for the campaign
      const currentVersion = campaignData.frontmatter?.version || 1
      const filePath = `${selectedClient}/${selectedCampaign}_v${currentVersion}.md`
      
      // Save updated campaign
      const saveResponse = await fetch('/api/prompts/save-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: campaignData.content,
          frontmatter: updatedFrontmatter
        })
      })
      
      if (!saveResponse.ok) throw new Error('Failed to save campaign')
      
      toast({
        title: 'Accounts Saved!',
        description: `Tracked accounts updated for ${selectedCampaign} campaign`
      })
      
    } catch (error) {
      console.error('Error saving accounts:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save accounts',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteTrackFromCampaign = async (trackId: string) => {
    if (!selectedClient || !selectedCampaign) {
      return
    }

    try {
      // Load current campaign data
      const loadResponse = await fetch(`/api/prompts/load?type=campaign&client=${selectedClient}&campaign=${selectedCampaign}`)
      if (!loadResponse.ok) throw new Error('Failed to load campaign')
      
      const campaignData = await loadResponse.json()
      
      // Filter out the deleted track
      const updatedTracks = (campaignData.frontmatter?.saved_tracks || []).filter((t: any) => t.id !== trackId)
      
      // Update frontmatter
      const updatedFrontmatter = {
        ...campaignData.frontmatter,
        saved_tracks: updatedTracks
      }
      
      // Determine the file path for the campaign
      const currentVersion = campaignData.frontmatter?.version || 1
      const filePath = `${selectedClient}/${selectedCampaign}_v${currentVersion}.md`
      
      // Save updated campaign
      const saveResponse = await fetch('/api/prompts/save-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: campaignData.content,
          frontmatter: updatedFrontmatter
        })
      })
      
      if (!saveResponse.ok) throw new Error('Failed to save campaign')
      
      // Update local state
      setSavedTracks(updatedTracks)
      
      toast({
        title: 'Track Deleted',
        description: 'Track removed from saved list'
      })
      
    } catch (error) {
      console.error('Error deleting track:', error)
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete track',
        variant: 'destructive'
      })
    }
  }

  const saveToCampaign = async () => {
    if (!selectedClient || !selectedCampaign || selectedTracks.size === 0) {
      toast({
        title: 'Missing Selection',
        description: 'Please select a client, campaign, and at least one track',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      // Get selected track data
      const selectedTrackData = tracks.filter(t => selectedTracks.has(t.id))
      
      // Load current campaign data
      const loadResponse = await fetch(`/api/prompts/load?type=campaign&client=${selectedClient}&campaign=${selectedCampaign}`)
      if (!loadResponse.ok) throw new Error('Failed to load campaign')
      
      const campaignData = await loadResponse.json()
      
      // Get existing saved tracks
      const existingTracks = campaignData.frontmatter?.saved_tracks || []
      
      // Add new tracks (skip duplicates)
      const newTracks = selectedTrackData
        .filter(track => !existingTracks.find((t: any) => t.id === track.id))
        .map(track => ({
          id: track.id,
          title: track.title,
          author: track.author,
          user_count: track.user_count,
          local_usage: track.localUsageCount,
          sound_url: track.share_url || generateTikTokUrl(track),
          share_url: track.share_url || undefined,
          play_url: track.play_url,
          sourceVideos: track.sourceVideos,
          saved_at: new Date().toISOString()
        }))
      
      // Combine existing and new tracks
      const allTracks = [...existingTracks, ...newTracks]
      
      // Update frontmatter
      const updatedFrontmatter = {
        ...campaignData.frontmatter,
        saved_tracks: allTracks
      }
      
      // Determine the file path for the campaign
      const currentVersion = campaignData.frontmatter?.version || 1
      const filePath = `${selectedClient}/${selectedCampaign}_v${currentVersion}.md`
      
      // Save updated campaign
      const saveResponse = await fetch('/api/prompts/save-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: campaignData.content,
          frontmatter: updatedFrontmatter
        })
      })
      
      if (!saveResponse.ok) throw new Error('Failed to save campaign')
      
      // Update local state
      setSavedTracks(allTracks)
      
      toast({
        title: 'Tracks Saved!',
        description: `${newTracks.length} new tracks saved to ${selectedCampaign} campaign`
      })
      
      // Clear selection
      setSelectedTracks(new Set())
      
    } catch (error) {
      console.error('Error saving tracks:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save tracks',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const playTrack = (track: ProcessedTrack) => {
    console.log('[Music Sourcing] playTrack called with:', track)
    console.log('[Music Sourcing] play_url:', track.play_url)
    
    if (playingTrackId === track.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingTrackId(null)
    } else {
      // Stop current track if playing
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      // Check if track has play_url
      const playUrl = track.play_url?.url_list?.[0]
      console.log('[Music Sourcing] Extracted playUrl:', playUrl)
      
      if (playUrl) {
        // Create new audio element
        audioRef.current = new Audio(playUrl)
        audioRef.current.play().catch(err => {
          console.error('[Music Sourcing] Error playing track:', err)
          toast({
            title: 'Playback Error',
            description: 'Unable to play this track. It might be restricted.',
            variant: 'destructive'
          })
        })
        
        // Handle when track ends
        audioRef.current.onended = () => {
          setPlayingTrackId(null)
        }
        
        setPlayingTrackId(track.id)
      } else {
        console.log('[Music Sourcing] No play URL available for track')
        toast({
          title: 'No Audio Available',
          description: 'This track does not have a playable audio URL.',
          variant: 'destructive'
        })
      }
    }
  }

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  const createColumns = (showDelete: boolean = false): ColumnDef<ProcessedTrack | SavedTrackDisplay>[] => {
    const columns: ColumnDef<ProcessedTrack>[] = []
    
    // Only add select column for search results, not for saved tracks
    if (!showDelete) {
      columns.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={tracks.length > 0 && selectedTracks.size === tracks.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTracks(new Set(tracks.map(t => t.id)))
              } else {
                setSelectedTracks(new Set())
              }
            }}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedTracks.has(row.original.id)}
            onChange={(e) => {
              const newSelected = new Set(selectedTracks)
              if (e.target.checked) {
                newSelected.add(row.original.id)
              } else {
                newSelected.delete(row.original.id)
              }
              setSelectedTracks(newSelected)
            }}
            className="rounded border-gray-300"
          />
        )
      })
    }
    
    // Add the rest of the columns
    columns.push(
    {
      id: 'play',
      header: '',
      cell: ({ row }) => {
        const hasAudio = row.original.play_url?.url_list?.[0] || false
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => playTrack(row.original)}
            className="h-8 w-8 p-0"
            disabled={!hasAudio}
            title={hasAudio ? 'Play track' : 'No audio available'}
          >
            {playingTrackId === row.original.id ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className={cn("h-4 w-4", !hasAudio && "opacity-30")} />
            )}
          </Button>
        )
      }
    },
      {
        accessorKey: 'title',
        header: 'Track Title',
        cell: ({ row }) => {
          // Use share_url if available, otherwise generate URL
          const musicUrl = row.original.share_url || row.original.soundUrl || generateTikTokUrl(row.original)
          
          return (
            <a
              href={musicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {row.original.title}
            </a>
          )
        }
      },
      {
        accessorKey: 'author',
        header: 'Artist'
      },
      {
        accessorKey: 'user_count',
        header: 'Total Videos',
        cell: ({ row }) => {
          console.log('[Music Sourcing] Rendering user_count cell, row:', row.original)
          const count = row.original.user_count || 0
          return <div className="text-right">{count.toLocaleString()}</div>
        }
      },
      {
        accessorKey: 'localUsageCount',
        header: 'Used by Accounts',
        cell: ({ row }) => (
          <div className="text-right">{row.original.localUsageCount}</div>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const isAlreadySaved = savedTracks.some(t => t.id === row.original.id)
          
          return (
            <div className="flex items-center gap-2">
              {showDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTrackFromCampaign(row.original.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Delete track"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                selectedClient && selectedCampaign && (
                  <Button
                    variant={isAlreadySaved ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => saveTrackToCampaign(row.original)}
                    disabled={isSaving || isAlreadySaved}
                    title={isAlreadySaved ? "Already saved" : "Save to campaign"}
                  >
                    {isAlreadySaved ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                )
              )}
              {row.original.sourceVideos && row.original.sourceVideos.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Video className="h-3 w-3 mr-1" />
                      Videos ({row.original.sourceVideos.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-96">
                    <DropdownMenuLabel>Source Videos Using This Sound</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-64 overflow-y-auto">
                      {row.original.sourceVideos.map((video, idx) => (
                        <a
                          key={idx}
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 hover:bg-accent rounded-sm"
                        >
                          <div className="text-xs font-medium">@{video.author}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {video.desc || 'No description'}
                          </div>
                          <div className="text-xs text-blue-600 hover:underline mt-1">
                            {video.url}
                          </div>
                        </a>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        }
      }
    )
    
    return columns
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setTracks([])

      // Use campaign accounts
      const usernames = campaignAccounts
      
      console.log('[Music Sourcing] Using campaign accounts:', usernames)
      
      if (usernames.length === 0) {
        throw new Error('No valid usernames provided')
      }

      // Calculate cost estimate
      const uniqueMusicEstimate = usernames.length * 10 // rough estimate
      const estimatedUnits = (usernames.length * (1 + data.depth)) + (uniqueMusicEstimate * 2)
      
      toast({
        title: 'Cost Estimate',
        description: `This operation will use approximately ${estimatedUnits} units`,
      })

      if (estimatedUnits > 400) {
        throw new Error(`Operation too expensive: ${estimatedUnits} units (max 400)`)
      }

      // Fetch posts for all users (throttled)
      const limit = pLimit(5)
      console.log('[Music Sourcing] Starting to fetch posts for users...')
      
      const allPosts = await Promise.all(
        usernames.map(username =>
          limit(async () => {
            console.log(`[Client] Fetching posts for @${username}`)
            const response = await fetch('/api/music', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'fetchPosts', username, depth: data.depth })
            })
            const result = await response.json()
            console.log(`[Client] Response for @${username}:`, result)
            console.log(`[Client] Response status:`, response.status)
            console.log(`[Client] Posts count:`, result.posts?.length)
            
            if (!response.ok) {
              console.error(`[Client] Error fetching posts for @${username}:`, result.error)
              throw new Error(result.error || 'Failed to fetch posts')
            }
            return result.posts || []
          })
        )
      )
      
      console.log('[Music Sourcing] All posts fetched:', allPosts)
      console.log('[Music Sourcing] Total posts count:', allPosts.flat().length)

      // Collect and dedupe music
      const musicUsage = new Map<string, {
        count: number
        firstSeen: number
        lastSeen: number
        sourceVideos: Array<{
          id: string
          desc: string
          author: string
          url: string
        }>
      }>()

      console.log('[Music Sourcing] Starting music collection...')
      
      allPosts.flat().forEach((post, index) => {
        console.log(`[Music Sourcing] Processing post ${index}:`, post)
        
        if (!post) {
          console.warn(`[Music Sourcing] Post ${index} is undefined or null`)
          return
        }
        
        if (post.music?.id) {
          // Ensure we always use string IDs for consistency
          const musicId = String(post.music.id)
          console.log(`[Music Sourcing] Found music ID: ${musicId} in post ${index}`)
          
          const existing = musicUsage.get(musicId)
          const timestamp = post.create_time * 1000
          
          // Create video URL
          const videoUrl = post.aweme_id 
            ? `https://www.tiktok.com/@${post.author?.unique_id || 'user'}/video/${post.aweme_id}`
            : `https://www.tiktok.com/search?q=${musicId}`
          
          const videoInfo = {
            id: post.aweme_id || post.id || '',
            desc: post.desc || '',
            author: post.author?.unique_id || post.author?.nickname || 'unknown',
            url: videoUrl
          }
          
          if (existing) {
            console.log(`[Music Sourcing] Updating existing music ${musicId}, count: ${existing.count + 1}`)
            existing.count++
            existing.firstSeen = Math.min(existing.firstSeen, timestamp)
            existing.lastSeen = Math.max(existing.lastSeen, timestamp)
            existing.sourceVideos.push(videoInfo)
          } else {
            console.log(`[Music Sourcing] Adding new music ${musicId}`)
            musicUsage.set(musicId, {
              count: 1,
              firstSeen: timestamp,
              lastSeen: timestamp,
              sourceVideos: [videoInfo]
            })
          }
        } else {
          console.log(`[Music Sourcing] Post ${index} has no music:`, post.music)
        }
      })
      
      console.log('[Music Sourcing] Music usage map:', Array.from(musicUsage.entries()))

      // Fetch music details (throttled)
      const musicIds = Array.from(musicUsage.keys())
      console.log('[Music Sourcing] Music IDs to fetch details for:', musicIds)
      
      const musicDetails = await Promise.all(
        musicIds.map((id, index) =>
          limit(async () => {
            console.log(`[Music Sourcing] Fetching details for music ${id} (${index + 1}/${musicIds.length})`)
            
            const response = await fetch('/api/music', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'fetchMusic', musicId: id })
            })
            
            console.log(`[Music Sourcing] Music ${id} response status:`, response.status)
            
            if (!response.ok) {
              console.error(`[Music Sourcing] Failed to fetch music ${id}, status:`, response.status)
              return null
            }
            
            const result = await response.json()
            console.log(`[Music Sourcing] Music ${id} result:`, result)
            console.log(`[Music Sourcing] Music ${id} play_url:`, result.music?.play_url)
            
            return result.music || null
          })
        )
      )
      
      console.log('[Music Sourcing] All music details fetched:', musicDetails)
      console.log('[Music Sourcing] Non-null music details count:', musicDetails.filter(m => m !== null).length)

      // Process and sort results
      console.log('[Music Sourcing] Starting to process tracks...')
      
      const processedTracks: ProcessedTrack[] = musicDetails
        .filter(track => track !== null)
        .map((track, index) => {
          console.log(`[Music Sourcing] Processing track ${index}:`, track)
          
          if (!track || !track.id) {
            console.error(`[Music Sourcing] Track ${index} is missing or has no ID:`, track)
            return null
          }
          
          // Debug: Check different possible ID fields
          console.log(`[Music Sourcing] Track ID fields - id: ${track.id}, id_str: ${track.id_str}, mid: ${track.mid}`)
          console.log(`[Music Sourcing] Music usage map keys:`, Array.from(musicUsage.keys()))
          
          const usage = musicUsage.get(String(track.id))
          console.log(`[Music Sourcing] Usage for track ${track.id}:`, usage)
          
          if (!usage) {
            console.error(`[Music Sourcing] No usage data found for track ${track.id}`)
            return null
          }
          
          const processed = {
            ...track,
            localUsageCount: usage.count,
            firstSeen: new Date(usage.firstSeen),
            lastSeen: new Date(usage.lastSeen),
            soundUrl: (() => {
              const titleSlug = (track.title || 'original-sound')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim()
              return `https://www.tiktok.com/music/${titleSlug}-${track.id}`
            })(),
            share_url: track.share_url || undefined,
            play_url: track.play_url, // Explicitly preserve play_url
            sourceVideos: usage.sourceVideos.slice(0, 10) // Limit to first 10 videos
          }
          
          console.log(`[Music Sourcing] Processed track:`, processed)
          return processed
        })
        .filter(track => track !== null)
        .sort((a, b) => {
          // Sort by total user_count first, then by local usage
          const aUserCount = a?.user_count || 0
          const bUserCount = b?.user_count || 0
          const aLocalCount = a?.localUsageCount || 0
          const bLocalCount = b?.localUsageCount || 0
          
          if (bUserCount !== aUserCount) {
            return bUserCount - aUserCount
          }
          return bLocalCount - aLocalCount
        })

      console.log('[Music Sourcing] Final processed tracks:', processedTracks)
      console.log('[Music Sourcing] Final tracks count:', processedTracks.length)

      setTracks(processedTracks)
      
      toast({
        title: 'Success!',
        description: `Found ${processedTracks.length} unique tracks from ${usernames.length} accounts`,
      })
    } catch (error) {
      console.error('[Music Sourcing] Error in onSubmit:', error)
      console.error('[Music Sourcing] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Music Sourcing</h1>
        <p className="text-muted-foreground">
          Discover trending sounds from TikTok accounts
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Campaign Selection</CardTitle>
          <CardDescription>
            Select a client and campaign to load tracked accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client">
                    {selectedClient && (
                      <>
                        <FolderOpen className="h-4 w-4 mr-2 inline" />
                        {selectedClient}
                      </>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map(client => (
                    <SelectItem key={client} value={client}>
                      <FolderOpen className="h-4 w-4 mr-2 inline" />
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="campaign">Campaign</Label>
              <Select 
                value={selectedCampaign} 
                onValueChange={setSelectedCampaign}
                disabled={!selectedClient}
              >
                <SelectTrigger id="campaign">
                  <SelectValue placeholder="Select a campaign">
                    {selectedCampaign && (
                      <>
                        <FileText className="h-4 w-4 mr-2 inline" />
                        {selectedCampaign}
                      </>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableCampaigns.map(campaign => (
                    <SelectItem key={campaign} value={campaign}>
                      <FileText className="h-4 w-4 mr-2 inline" />
                      {campaign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedClient && selectedCampaign && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="tracked-accounts">Tracked accounts from campaign:</Label>
              <Textarea
                id="tracked-accounts"
                value={campaignAccounts.join('\n')}
                onChange={(e) => {
                  const newAccounts = e.target.value
                    .split('\n')
                    .map(acc => acc.trim().replace('@', ''))
                    .filter(Boolean)
                  setCampaignAccounts(newAccounts)
                }}
                placeholder="@username1&#10;@username2&#10;@username3"
                className="min-h-[100px] font-mono"
              />
              <Button
                onClick={saveCampaignAccounts}
                disabled={isSaving}
                size="sm"
                variant="outline"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Accounts
                  </>
                )}
              </Button>
            </div>
          )}
          
          {savedTracks.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {savedTracks.length} Saved Tracks in Campaign
                </p>
              </div>
              <div className="space-y-1">
                {savedTracks.slice(0, 3).map((track, idx) => (
                  <div key={idx} className="text-xs text-blue-700 dark:text-blue-300">
                    • {track.title} by {track.author}
                  </div>
                ))}
                {savedTracks.length > 3 && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                    and {savedTracks.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Accounts</CardTitle>
          <CardDescription>
            Analyze recent music usage from tracked campaign accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="depth">Scan Depth</Label>
                <span className="text-sm text-muted-foreground">
                  {form.watch('depth')} pages ({form.watch('depth') * 10} videos)
                </span>
              </div>
              <Slider
                id="depth"
                min={1}
                max={10}
                step={1}
                value={[form.watch('depth')]}
                onValueChange={([value]) => form.setValue('depth', value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Higher depth scans more videos but uses more API units
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !selectedClient || !selectedCampaign || campaignAccounts.length === 0}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning accounts...
                </>
              ) : !selectedClient || !selectedCampaign ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Select Campaign First
                </>
              ) : campaignAccounts.length === 0 ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Add Tracked Accounts
                </>
              ) : (
                <>
                  <Music className="mr-2 h-4 w-4" />
                  Fetch Music from {campaignAccounts.length} Accounts
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {tracks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Discovered Tracks</CardTitle>
                <CardDescription>
                  {tracks.length} unique tracks sorted by popularity
                  {selectedTracks.size > 0 && ` • ${selectedTracks.size} selected`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => copyAllLinks(tracks)}
                  size="sm"
                  variant="outline"
                >
                  <Link className="mr-2 h-4 w-4" />
                  Copy All Links
                </Button>
                <Button
                  onClick={() => downloadAsCSV(tracks, `music-tracks-${new Date().toISOString().split('T')[0]}.xlsx`)}
                  size="sm"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
                {selectedTracks.size > 0 && selectedClient && selectedCampaign && (
                  <Button
                    onClick={saveToCampaign}
                    disabled={isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save {selectedTracks.size} to Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {console.log('[Music Sourcing] Rendering DataTable with tracks:', tracks)}
            <DataTable
              columns={createColumns(false)}
              data={tracks}
              searchKey="title"
              searchPlaceholder="Search tracks..."
            />
          </CardContent>
        </Card>
      )}

      {!isLoading && tracks.length === 0 && form.formState.isSubmitted && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">No tracks found</h3>
              <p className="text-muted-foreground">
                Try scanning different accounts or increasing the depth
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Saved Tracks Section */}
      {savedTracks.length > 0 && tracks.length === 0 && !form.formState.isSubmitted && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Saved Tracks Library</CardTitle>
                <CardDescription>
                  {savedTracks.length} tracks saved to the {selectedCampaign} campaign
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => copyAllLinks(savedTracks.map(track => ({
                    ...track,
                    localUsageCount: track.local_usage || 0,
                    soundUrl: track.sound_url || '',
                    play_url: track.play_url,
                    sourceVideos: track.sourceVideos || [],
                    // Add dummy dates for copyAllLinks function compatibility
                    firstSeen: new Date(),
                    lastSeen: new Date()
                  } as ProcessedTrack)))}
                  size="sm"
                  variant="outline"
                >
                  <Link className="mr-2 h-4 w-4" />
                  Copy All Links
                </Button>
                <Button
                  onClick={() => downloadAsCSV(savedTracks.map(track => ({
                    ...track,
                    localUsageCount: track.local_usage || 0,
                    soundUrl: track.sound_url || '',
                    play_url: track.play_url,
                    sourceVideos: track.sourceVideos || [],
                    // Add dummy dates for downloadAsCSV function compatibility
                    firstSeen: new Date(),
                    lastSeen: new Date()
                  } as ProcessedTrack)), `saved-tracks-${selectedCampaign}-${new Date().toISOString().split('T')[0]}.xlsx`)}
                  size="sm"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={createColumns(true) as ColumnDef<SavedTrackDisplay>[]}
              data={savedTracks.map(track => ({
                ...track,
                localUsageCount: track.local_usage || 0,
                soundUrl: track.sound_url || '',
                play_url: track.play_url,
                sourceVideos: track.sourceVideos || []
              } as SavedTrackDisplay))}
              searchKey="title"
              searchPlaceholder="Search saved tracks..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}