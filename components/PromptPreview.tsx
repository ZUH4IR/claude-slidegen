'use client'

import { Card } from '@/components/ui/card'
import { FileText, ArrowDown, Globe, Users, Target, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface PromptPreviewProps {
  globalContent?: string
  clientContent?: string
  campaignContent?: string
  mergedContent?: string
  blueprint?: any
  config?: any
  className?: string
  mode?: 'chain' | 'merged' | 'full'
}

export function PromptPreview({ 
  globalContent, 
  clientContent, 
  campaignContent,
  mergedContent,
  blueprint,
  config,
  className,
  mode = 'chain'
}: PromptPreviewProps) {
  const segments = []
  
  if (globalContent) {
    segments.push({
      id: 'global',
      title: 'Global Rules',
      content: globalContent,
      icon: <Globe className="h-4 w-4" />,
      color: 'gray'
    })
  }
  
  if (clientContent) {
    segments.push({
      id: 'client',
      title: 'Client Voice',
      content: clientContent,
      icon: <Users className="h-4 w-4" />,
      color: 'blue'
    })
  }
  
  if (campaignContent) {
    segments.push({
      id: 'campaign',
      title: 'Campaign Strategy',
      content: campaignContent,
      icon: <Target className="h-4 w-4" />,
      color: 'green'
    })
  }

  const getSegmentStyles = (color: string) => ({
    border: `border-${color}-300 bg-${color}-50`,
    header: `bg-${color}-200 text-${color}-800`
  })

  if (mode === 'full') {
    return (
      <Tabs defaultValue="chain" className={cn("w-full", className)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chain">Prompt Chain</TabsTrigger>
          <TabsTrigger value="merged">Merged Prompt</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chain" className="space-y-4">
          {segments.map((segment, index) => (
            <div key={segment.id} className="relative">
              <Card className={cn("border-2 overflow-hidden", 
                segment.color === 'gray' && "border-gray-300 bg-gray-50",
                segment.color === 'blue' && "border-blue-300 bg-blue-50",
                segment.color === 'green' && "border-green-300 bg-green-50"
              )}>
                <div className={cn("px-4 py-2 flex items-center gap-2 font-medium",
                  segment.color === 'gray' && "bg-gray-200 text-gray-800",
                  segment.color === 'blue' && "bg-blue-200 text-blue-800",
                  segment.color === 'green' && "bg-green-200 text-green-800"
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
        </TabsContent>
        
        <TabsContent value="merged">
          <Card className="border-2 border-primary bg-primary/5">
            <div className="px-4 py-2 flex items-center gap-2 font-medium bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
              <span>Final Combined Prompt</span>
            </div>
            <div className="p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                {mergedContent || segments.map(s => s.content).join('\n\n---\n\n')}
              </pre>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="config">
          <div className="space-y-4">
            {config && (
              <Card>
                <div className="px-4 py-2 flex items-center gap-2 font-medium bg-muted">
                  <Code2 className="h-4 w-4" />
                  <span>Configuration</span>
                </div>
                <div className="p-4 space-y-2">
                  {Object.entries(config).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <Badge variant="secondary">{String(value)}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            
            {blueprint && (
              <Card>
                <div className="px-4 py-2 flex items-center gap-2 font-medium bg-muted">
                  <FileText className="h-4 w-4" />
                  <span>Blueprint Structure</span>
                </div>
                <div className="p-4">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {JSON.stringify(blueprint, null, 2)}
                  </pre>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    )
  }

  if (mode === 'merged') {
    return (
      <Card className={cn("border-2 border-primary bg-primary/5", className)}>
        <div className="px-4 py-2 flex items-center gap-2 font-medium bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
          <span>Merged Prompt</span>
        </div>
        <div className="p-4">
          <pre className="text-xs whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
            {mergedContent || segments.map(s => s.content).join('\n\n---\n\n')}
          </pre>
        </div>
      </Card>
    )
  }

  // Default chain mode
  return (
    <div className={cn("space-y-4", className)}>
      {segments.map((segment, index) => (
        <div key={segment.id} className="relative">
          <Card className={cn("border-2 overflow-hidden", 
            segment.color === 'gray' && "border-gray-300 bg-gray-50",
            segment.color === 'blue' && "border-blue-300 bg-blue-50",
            segment.color === 'green' && "border-green-300 bg-green-50"
          )}>
            <div className={cn("px-4 py-2 flex items-center gap-2 font-medium",
              segment.color === 'gray' && "bg-gray-200 text-gray-800",
              segment.color === 'blue' && "bg-blue-200 text-blue-800",
              segment.color === 'green' && "bg-green-200 text-green-800"
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
            <p className="text-sm">No prompt content to display</p>
            <p className="text-xs mt-1">Select a client and campaign to see the prompt chain</p>
          </div>
        </Card>
      )}
    </div>
  )
}