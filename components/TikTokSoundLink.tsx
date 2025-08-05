'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Copy, Music } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TikTokSoundLinkProps {
  trackId: string
  trackTitle: string
  trackAuthor: string
  shareUrl?: string
}

export function TikTokSoundLink({ trackId, trackTitle, trackAuthor, shareUrl }: TikTokSoundLinkProps) {
  const { toast } = useToast()
  
  // Generate multiple possible URL formats
  const generateUrls = () => {
    const titleSlug = trackTitle
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)
    
    // If we have the share URL from the API, extract the exact format
    let primaryUrl = `https://www.tiktok.com/music/${titleSlug}-${trackId}`
    
    if (shareUrl) {
      // Extract the music path from the share URL
      const match = shareUrl.match(/\/music\/([^?]+)/);
      if (match && match[1]) {
        primaryUrl = `https://www.tiktok.com/music/${match[1]}`
      }
    }
    
    return [
      // Format 1: Confirmed working format from API or generated
      { label: '✅ Music Link (API Confirmed)', url: primaryUrl },
      
      // Format 2: Variations of the working format
      { label: 'Music with slug + lang', url: `https://www.tiktok.com/music/${titleSlug}-${trackId}?lang=en` },
      { label: 'Music uppercase slug', url: `https://www.tiktok.com/music/${titleSlug.toUpperCase()}-${trackId}` },
      
      // Format 3: Original sound variants (fallback)
      { label: 'Original sound', url: `https://www.tiktok.com/music/original-sound-${trackId}` },
      { label: 'Original sound + lang', url: `https://www.tiktok.com/music/original-sound-${trackId}?lang=en` },
      
      // Format 4: Direct ID
      { label: 'Direct music ID', url: `https://www.tiktok.com/music/${trackId}` },
      { label: 'Sound path', url: `https://www.tiktok.com/sound/${trackId}` },
      
      // Format 5: Search URLs (most reliable fallback)
      { label: 'Search by ID', url: `https://www.tiktok.com/search?q=${trackId}` },
      { label: 'Sound search by ID', url: `https://www.tiktok.com/search/sound?q=${trackId}` },
      { label: 'Search by title', url: `https://www.tiktok.com/search?q=${encodeURIComponent(trackTitle)}` },
      { label: 'Sound search by title', url: `https://www.tiktok.com/search/sound?q=${encodeURIComponent(`${trackTitle} ${trackAuthor}`)}` },
      
      // Format 6: Mobile/Share URLs
      { label: 'Mobile share', url: `https://m.tiktok.com/h5/share/music/${trackId}.html` },
      { label: 'VM short link', url: `https://vm.tiktok.com/music/${trackId}` },
    ]
  }
  
  const urls = generateUrls()
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: 'URL copied to clipboard',
    })
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Music className="h-3 w-3 mr-1" />
          TikTok Links
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel className="text-xs">
          Test different URL formats - one should work!
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {urls.map((item, idx) => (
            <div key={idx} className="p-2 hover:bg-accent rounded-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-1">{item.label}</div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.url}
                  </a>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(item.url)
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          Track ID: {trackId}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}