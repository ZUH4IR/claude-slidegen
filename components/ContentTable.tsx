'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Copy, FileSpreadsheet, Save, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SimpleExcelTable } from '@/components/SimpleExcelTable'

export interface ContentRow {
  hook: string
  slides: string[]
}

interface ContentTableProps {
  data: ContentRow[]
  onDataChange: (data: ContentRow[]) => void
  onGenerateSlides?: () => void
  onExport?: (format: 'csv' | 'excel') => void
  onCopy?: () => void
  loading?: boolean
  className?: string
}

export function ContentTable({ 
  data, 
  onDataChange,
  onGenerateSlides,
  onExport,
  onCopy,
  loading = false,
  className 
}: ContentTableProps) {
  const [editMode, setEditMode] = useState<'inline' | 'excel'>('excel')
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = useCallback((row: number, col: string, value: string) => {
    setEditingCell({ row, col })
    setEditValue(value)
  }, [])

  const saveEdit = useCallback(() => {
    if (editingCell) {
      const updated = [...data]
      if (editingCell.col === 'hook') {
        updated[editingCell.row].hook = editValue
      } else {
        const slideIndex = parseInt(editingCell.col.replace('slide', '')) - 1
        updated[editingCell.row].slides[slideIndex] = editValue
      }
      onDataChange(updated)
      setEditingCell(null)
      setEditValue('')
    }
  }, [editingCell, editValue, data, onDataChange])

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }, [saveEdit, cancelEdit])

  const generateCSV = useCallback(() => {
    const header = 'Hook,Slide 1,Slide 2,Slide 3,Slide 4,Slide 5'
    const rows = data.map(row => {
      const escapedHook = row.hook.includes(',') || row.hook.includes('"') 
        ? `"${row.hook.replace(/"/g, '""')}"` 
        : row.hook
      const escapedSlides = row.slides.map(slide => 
        slide.includes(',') || slide.includes('"') 
          ? `"${slide.replace(/"/g, '""')}"` 
          : slide
      )
      return [escapedHook, ...escapedSlides].join(',')
    })
    return [header, ...rows].join('\n')
  }, [data])

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Content Editor</h3>
          <Badge variant="secondary">{data.length} rows</Badge>
        </div>
        <div className="flex items-center gap-2">
          {onGenerateSlides && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateSlides}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          )}
          {onCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCopy}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy CSV
            </Button>
          )}
          {onExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('excel')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'inline' | 'excel')}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="excel">Excel View</TabsTrigger>
          <TabsTrigger value="inline">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="mt-4">
          <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <SimpleExcelTable 
              data={data} 
              onDataChange={onDataChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="inline" className="mt-4 space-y-4">
          {data.map((row, rowIndex) => (
            <Card key={rowIndex} className="p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2">Hook {rowIndex + 1}</Label>
                  {editingCell?.row === rowIndex && editingCell.col === 'hook' ? (
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={saveEdit}
                      className="min-h-[80px] resize-none"
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => startEdit(rowIndex, 'hook', row.hook)}
                    >
                      <p className="text-sm">{row.hook}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {row.slides.map((slide, slideIndex) => (
                    <div key={slideIndex}>
                      <Label className="text-xs text-muted-foreground">
                        Slide {slideIndex + 1}
                      </Label>
                      {editingCell?.row === rowIndex && editingCell.col === `slide${slideIndex + 1}` ? (
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={saveEdit}
                          className="mt-1 text-sm min-h-[80px] resize-none"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="mt-1 p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => startEdit(rowIndex, `slide${slideIndex + 1}`, slide)}
                        >
                          <p className="text-sm">{slide}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {data.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">No content generated yet</p>
          {onGenerateSlides && (
            <Button className="mt-4" onClick={onGenerateSlides}>
              Generate Content
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}