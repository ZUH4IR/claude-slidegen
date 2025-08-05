'use client'

import { cn } from '@/lib/utils'

interface MarkdownPreviewProps {
  content: string
  className?: string
  variables?: Record<string, string>
}

export function MarkdownPreview({ content, className, variables = {} }: MarkdownPreviewProps) {
  // Replace variables in content
  let processedContent = content
  Object.entries(variables).forEach(([key, value]) => {
    processedContent = processedContent.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
  })

  // Simple markdown to HTML conversion
  const renderMarkdown = (text: string) => {
    // Split by sections
    const sections = text.split(/(?=^##\s)/m)
    
    return sections.map((section, index) => {
      const lines = section.trim().split('\n')
      if (lines.length === 0) return null

      const elements: JSX.Element[] = []
      let currentList: string[] = []

      const flushList = () => {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}-${elements.length}`} className="list-disc list-inside space-y-1 my-2">
              {currentList.map((item, i) => (
                <li key={i} className="text-sm">{item}</li>
              ))}
            </ul>
          )
          currentList = []
        }
      }

      lines.forEach((line, lineIndex) => {
        // Headers
        if (line.startsWith('## ')) {
          flushList()
          elements.push(
            <h3 key={`h3-${index}-${lineIndex}`} className="text-base font-semibold mt-4 mb-2">
              {line.substring(3)}
            </h3>
          )
        } else if (line.startsWith('# ')) {
          flushList()
          elements.push(
            <h2 key={`h2-${index}-${lineIndex}`} className="text-lg font-bold mt-4 mb-2">
              {line.substring(2)}
            </h2>
          )
        }
        // List items
        else if (line.trim().startsWith('- ')) {
          currentList.push(line.trim().substring(2))
        }
        // Regular paragraphs
        else if (line.trim()) {
          flushList()
          elements.push(
            <p key={`p-${index}-${lineIndex}`} className="text-sm mb-2">
              {line}
            </p>
          )
        }
      })

      flushList()
      return <div key={index}>{elements}</div>
    })
  }

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {renderMarkdown(processedContent)}
    </div>
  )
}