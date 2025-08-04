'use client'

import { Card } from '@/components/ui/card'
import { FileText, ArrowDown, Globe, Users, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChainSegment {
  title: string
  type: 'global' | 'client' | 'campaign'
  content: string
  icon: React.ReactNode
}

interface PromptChainDiagramProps {
  globalContent?: string
  clientContent?: string
  campaignContent?: string
  className?: string
}

export function PromptChainDiagram({ 
  globalContent, 
  clientContent, 
  campaignContent,
  className 
}: PromptChainDiagramProps) {
  const segments: ChainSegment[] = []
  
  if (globalContent) {
    segments.push({
      title: 'Global Rules',
      type: 'global',
      content: globalContent,
      icon: <Globe className="h-4 w-4" />
    })
  }
  
  if (clientContent) {
    segments.push({
      title: 'Client Voice',
      type: 'client',
      content: clientContent,
      icon: <Users className="h-4 w-4" />
    })
  }
  
  if (campaignContent) {
    segments.push({
      title: 'Campaign Strategy',
      type: 'campaign',
      content: campaignContent,
      icon: <Target className="h-4 w-4" />
    })
  }
  
  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'global':
        return 'border-gray-300 bg-gray-50'
      case 'client':
        return 'border-blue-300 bg-blue-50'
      case 'campaign':
        return 'border-green-300 bg-green-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }
  
  const getHeaderColor = (type: string) => {
    switch (type) {
      case 'global':
        return 'bg-gray-200 text-gray-800'
      case 'client':
        return 'bg-blue-200 text-blue-800'
      case 'campaign':
        return 'bg-green-200 text-green-800'
      default:
        return 'bg-gray-200 text-gray-800'
    }
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {segments.map((segment, index) => (
        <div key={segment.type} className="relative">
          <Card className={cn(
            "border-2 overflow-hidden",
            getSegmentColor(segment.type)
          )}>
            <div className={cn(
              "px-4 py-2 flex items-center gap-2 font-medium",
              getHeaderColor(segment.type)
            )}>
              {segment.icon}
              <span>{segment.title}</span>
            </div>
            <div className="p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                {segment.content.substring(0, 500)}
                {segment.content.length > 500 && '...'}
              </pre>
            </div>
          </Card>
          
          {index < segments.length - 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 z-10">
              <div className="bg-background rounded-full p-1">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      ))}
      
      {segments.length === 0 && (
        <Card className="border-dashed">
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No prompt chain to display</p>
            <p className="text-xs mt-1">Select a client and campaign to see the full prompt chain</p>
          </div>
        </Card>
      )}
      
      {segments.length > 0 && (
        <Card className="border-2 border-primary bg-primary/5">
          <div className="px-4 py-2 flex items-center gap-2 font-medium bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
            <span>Final Combined Prompt</span>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-2">
              All segments are combined in order to create the final prompt sent to the AI
            </p>
            <div className="text-xs text-muted-foreground">
              <p>• Global rules provide universal guidelines</p>
              <p>• Client voice adds brand-specific tone</p>
              <p>• Campaign strategy targets specific audience</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}