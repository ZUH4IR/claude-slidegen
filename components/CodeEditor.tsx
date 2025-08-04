'use client'

import { useState, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, History, FileText } from 'lucide-react'
import matter from 'gray-matter'

interface CodeEditorProps {
  content: string
  metadata: any
  onSave: (content: string) => void
  onToggleVersions: () => void
}

export function CodeEditor({ content, metadata, onSave, onToggleVersions }: CodeEditorProps) {
  const [value, setValue] = useState(content)
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = useCallback((val: string) => {
    // Extract just the content part (without frontmatter)
    try {
      const parsed = matter(val)
      setValue(parsed.content)
      setHasChanges(parsed.content !== content)
    } catch {
      // If parsing fails, use the raw value
      setValue(val)
      setHasChanges(val !== content)
    }
  }, [content])

  const handleSave = () => {
    onSave(value)
    setHasChanges(false)
  }

  // Format the full content with frontmatter
  const fullContent = matter.stringify(value, metadata)

  return (
    <Card className="h-full rounded-none border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle>{metadata.name || 'Untitled'}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleVersions}
          >
            <History className="h-4 w-4 mr-1" />
            Versions
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <CodeMirror
          value={fullContent}
          height="100%"
          theme={undefined}
          extensions={[markdown()]}
          onChange={handleChange}
          className="h-full"
        />
      </CardContent>
    </Card>
  )
}