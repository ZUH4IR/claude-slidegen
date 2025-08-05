'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Hash, MessageSquare, Lightbulb, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlueprintSection {
  slideNumber: number
  title: string
  instructions: string[]
  icon?: React.ReactNode
}

interface BlueprintViewerProps {
  content: string
  className?: string
}

export function BlueprintViewer({ content, className }: BlueprintViewerProps) {
  // Parse the blueprint content into sections
  const parseSections = (text: string): BlueprintSection[] => {
    const sections: BlueprintSection[] = []
    const lines = text.split('\n')
    let currentSection: BlueprintSection | null = null
    let currentInstructions: string[] = []

    const getIcon = (slideNumber: number, title: string) => {
      if (title.toLowerCase().includes('hook')) return <MessageSquare className="h-4 w-4" />
      if (title.toLowerCase().includes('tension')) return <TrendingUp className="h-4 w-4" />
      if (title.toLowerCase().includes('drama')) return <Target className="h-4 w-4" />
      if (title.toLowerCase().includes('resolution')) return <Lightbulb className="h-4 w-4" />
      return <Hash className="h-4 w-4" />
    }

    // Check if this is actually a blueprint by looking for specific patterns
    const isBlueprint = text.includes('## Slide 1:') && text.includes('## Slide 2:')
    if (!isBlueprint) {
      return []
    }

    for (const line of lines) {
      if (line.startsWith('## Slide ')) {
        // Save previous section
        if (currentSection) {
          currentSection.instructions = currentInstructions
          sections.push(currentSection)
        }

        // Parse new section
        const match = line.match(/## Slide (\d+):\s*(.+)/)
        if (match) {
          const slideNumber = parseInt(match[1])
          const title = match[2]
          currentSection = {
            slideNumber,
            title,
            instructions: [],
            icon: getIcon(slideNumber, title)
          }
          currentInstructions = []
        }
      } else if (line.trim().startsWith('- ') && currentSection) {
        // Add instruction
        currentInstructions.push(line.trim().substring(2))
      } else if (line.trim() && !line.startsWith('#') && currentSection && !line.startsWith('Grab')) {
        // Add as instruction if it's not empty and not a header
        currentInstructions.push(line.trim())
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.instructions = currentInstructions
      sections.push(currentSection)
    }

    return sections
  }

  const sections = parseSections(content)
  const title = content.match(/# (.+)/)
  const description = content.match(/Grab attention immediately/)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>{title?.[1] || 'Blueprint'}</CardTitle>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Structured template for creating engaging slide content
                  </p>
                )}
              </div>
            </div>
            <Badge variant="secondary">{sections.length} Slides</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Slide Sections */}
      <div className="grid gap-4">
        {sections.map((section, index) => (
          <Card key={section.slideNumber} className="overflow-hidden">
            <div className={cn(
              "px-4 py-3 flex items-center gap-2 font-medium",
              index === 0 && "bg-blue-50 text-blue-700 border-b border-blue-200",
              index === 1 && "bg-purple-50 text-purple-700 border-b border-purple-200",
              index === 2 && "bg-orange-50 text-orange-700 border-b border-orange-200",
              index === 3 && "bg-green-50 text-green-700 border-b border-green-200",
              index === 4 && "bg-gray-50 text-gray-700 border-b border-gray-200",
            )}>
              {section.icon}
              <span className="text-sm">Slide {section.slideNumber}</span>
              <span className="text-sm font-semibold">{section.title}</span>
            </div>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {section.instructions.map((instruction, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span className="flex-1">{instruction}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      {sections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No blueprint structure detected</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}