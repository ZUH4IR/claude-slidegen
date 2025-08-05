'use client'

import { useEffect, useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Variable {
  key: string
  scope: 'global' | 'client' | 'campaign' | 'ui'
  start: number
  end: number
}

interface ColorCodedEditorProps {
  value: string
  onChange: (value: string) => void
  variables?: Array<{
    key: string
    scope: 'global' | 'client' | 'campaign'
  }>
  className?: string
  placeholder?: string
  maxLineLength?: number
  bannedWords?: string[]
}

export function ColorCodedEditor({ 
  value, 
  onChange, 
  variables = [], 
  className,
  placeholder,
  maxLineLength = 120,
  bannedWords = [] 
}: ColorCodedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [parsedVariables, setParsedVariables] = useState<Variable[]>([])
  const [validationErrors, setValidationErrors] = useState<{line: number, type: 'length' | 'banned', message: string}[]>([])

  // Parse variables from text
  useEffect(() => {
    console.log('[ColorCodedEditor] Parsing variables, available:', variables)
    const variablePattern = /\{\{(.*?)\}\}/g
    const matches: Variable[] = []
    let match

    while ((match = variablePattern.exec(value)) !== null) {
      const varName = match[1].trim()
      const foundVar = variables.find(v => v.key === varName)
      console.log('[ColorCodedEditor] Found variable:', varName, 'Matched:', foundVar)
      
      matches.push({
        key: varName,
        scope: foundVar?.scope || 'ui',
        start: match.index,
        end: match.index + match[0].length
      })
    }

    setParsedVariables(matches)
  }, [value, variables.map(v => v.key).join(',')])
  
  // Validate content
  useEffect(() => {
    const errors: typeof validationErrors = []
    const lines = value.split('\n')
    
    lines.forEach((line, index) => {
      // Check line length
      if (line.length > maxLineLength) {
        errors.push({
          line: index + 1,
          type: 'length',
          message: `Line ${index + 1} exceeds ${maxLineLength} characters (${line.length} chars)`
        })
      }
      
      // Check banned words
      bannedWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi')
        if (regex.test(line)) {
          errors.push({
            line: index + 1,
            type: 'banned',
            message: `Line ${index + 1} contains banned word: "${word}"`
          })
        }
      })
    })
    
    setValidationErrors(errors)
  }, [value, maxLineLength, bannedWords.join(',')])

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  // Generate highlighted HTML
  const getHighlightedHtml = () => {
    if (!value) return ''

    let html = ''
    let lastIndex = 0

    // Sort variables by start position
    const sortedVars = [...parsedVariables].sort((a, b) => a.start - b.start)

    sortedVars.forEach(variable => {
      // Add text before variable
      const textBefore = value.substring(lastIndex, variable.start)
      html += escapeHtml(textBefore)

      // Add highlighted variable
      const varText = value.substring(variable.start, variable.end)
      const colorClass = getColorClass(variable.scope)
      html += `<span class="${colorClass}">${escapeHtml(varText)}</span>`

      lastIndex = variable.end
    })

    // Add remaining text
    html += escapeHtml(value.substring(lastIndex))

    // Preserve line breaks and spaces
    html = html.replace(/\n/g, '<br>')
    html = html.replace(/ {2}/g, ' &nbsp;')

    return html
  }

  const getColorClass = (scope: string) => {
    switch (scope) {
      case 'global':
        return 'text-gray-600 bg-gray-100 px-1 rounded'
      case 'client':
        return 'text-blue-600 bg-blue-100 px-1 rounded'
      case 'campaign':
        return 'text-green-600 bg-green-100 px-1 rounded'
      case 'ui':
      default:
        return 'text-pink-600 bg-pink-100 px-1 rounded'
    }
  }

  const escapeHtml = (text: string) => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-md">
        {/* Highlight layer */}
        <div
          ref={highlightRef}
          className={cn(
            "absolute inset-0 overflow-auto pointer-events-none whitespace-pre-wrap break-words",
            "font-mono text-sm p-3 leading-6",
            className
          )}
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            minHeight: 'inherit',
            maxHeight: 'inherit'
          }}
          dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
        />
        
        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          className={cn(
            "relative bg-transparent resize-y overflow-auto",
            "font-mono text-sm leading-6",
            validationErrors.length > 0 && "border-amber-500",
            className
          )}
          style={{
            caretColor: 'black',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            minHeight: 'inherit',
            maxHeight: 'inherit'
          }}
        />
      </div>
      
      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mt-2 space-y-1">
          {validationErrors.slice(0, 5).map((error, i) => (
            <div key={i} className="text-xs flex items-center gap-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                error.type === 'length' ? "bg-amber-500" : "bg-red-500"
              )} />
              <span className={cn(
                error.type === 'length' ? "text-amber-600" : "text-red-600"
              )}>
                {error.message}
              </span>
            </div>
          ))}
          {validationErrors.length > 5 && (
            <div className="text-xs text-muted-foreground">
              ... and {validationErrors.length - 5} more issues
            </div>
          )}
        </div>
      )}
    </div>
  )
}