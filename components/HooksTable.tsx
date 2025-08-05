'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Edit, Save, X, Copy, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Hook {
  id?: string
  text: string
  selected: boolean
  edited?: string
  slides?: string[]
  bottomText?: string
}

interface HooksTableProps {
  hooks: Hook[]
  onHooksChange: (hooks: Hook[]) => void
  mode?: 'select' | 'edit' | 'view'
  showSlides?: boolean
  onGenerateSlides?: (selectedHooks: Hook[]) => void
  onExport?: (format: 'csv' | 'excel') => void
  className?: string
}

export function HooksTable({ 
  hooks, 
  onHooksChange,
  mode = 'select',
  showSlides = false,
  onGenerateSlides,
  onExport,
  className 
}: HooksTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [editValue, setEditValue] = useState('')

  const toggleSelection = useCallback((index: number) => {
    const updated = [...hooks]
    updated[index].selected = !updated[index].selected
    onHooksChange(updated)
  }, [hooks, onHooksChange])

  const selectAll = useCallback((selected: boolean) => {
    const updated = hooks.map(h => ({ ...h, selected }))
    onHooksChange(updated)
  }, [hooks, onHooksChange])

  const startEdit = useCallback((index: number) => {
    setEditingIndex(index)
    setEditValue(hooks[index].edited || hooks[index].text)
  }, [hooks])

  const saveEdit = useCallback(() => {
    if (editingIndex !== null) {
      const updated = [...hooks]
      updated[editingIndex].edited = editValue
      onHooksChange(updated)
      setEditingIndex(null)
      setEditValue('')
    }
  }, [editingIndex, editValue, hooks, onHooksChange])

  const cancelEdit = useCallback(() => {
    setEditingIndex(null)
    setEditValue('')
  }, [])

  const toggleRow = useCallback((index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }, [expandedRows])

  const updateSlide = useCallback((hookIndex: number, slideIndex: number, value: string) => {
    const updated = [...hooks]
    if (updated[hookIndex].slides) {
      updated[hookIndex].slides[slideIndex] = value
      onHooksChange(updated)
    }
  }, [hooks, onHooksChange])

  const selectedCount = hooks.filter(h => h.selected).length

  return (
    <div className={cn("space-y-4", className)}>
      {mode === 'select' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectAll(true)}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectAll(false)}
            >
              Deselect All
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedCount} of {hooks.length} selected
            </span>
          </div>
          {onGenerateSlides && (
            <Button 
              onClick={() => onGenerateSlides(hooks.filter(h => h.selected))}
              disabled={selectedCount === 0}
            >
              Generate Slides ({selectedCount})
            </Button>
          )}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {mode !== 'view' && (
                <th className="w-10 p-2">
                  <Checkbox 
                    checked={selectedCount === hooks.length}
                    onCheckedChange={(checked) => selectAll(!!checked)}
                  />
                </th>
              )}
              <th className="text-left p-3 font-medium">Hook</th>
              {showSlides && <th className="text-center p-3 font-medium">Slides</th>}
              {mode === 'edit' && <th className="w-24 text-center p-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {hooks.map((hook, index) => {
              const isEditing = editingIndex === index
              const isExpanded = expandedRows.has(index)
              const displayText = hook.edited || hook.text
              
              return (
                <tr key={index} className="border-t">
                  {mode !== 'view' && (
                    <td className="p-2 align-top">
                      <Checkbox
                        checked={hook.selected}
                        onCheckedChange={() => toggleSelection(index)}
                      />
                    </td>
                  )}
                  <td className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          {isEditing ? (
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="min-h-[80px] resize-none"
                              autoFocus
                            />
                          ) : (
                            <div className="text-sm">
                              {displayText}
                              {hook.bottomText && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Bottom: {hook.bottomText}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {hook.edited && !isEditing && (
                          <Badge variant="secondary" className="text-xs">edited</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  {showSlides && (
                    <td className="p-3 text-center">
                      {hook.slides && hook.slides.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(index)}
                        >
                          {hook.slides.length} slides
                          {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                  )}
                  {mode === 'edit' && (
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        {isEditing ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={saveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(index)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showSlides && expandedRows.size > 0 && (
        <div className="space-y-4">
          {hooks.map((hook, hookIndex) => {
            if (!expandedRows.has(hookIndex) || !hook.slides) return null
            
            return (
              <Card key={hookIndex} className="p-4">
                <div className="mb-3">
                  <Label className="text-sm font-medium">Hook {hookIndex + 1} - Slides</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {hook.slides.map((slide, slideIndex) => (
                    <div key={slideIndex}>
                      <Label className="text-xs text-muted-foreground">
                        Slide {slideIndex + 1}
                      </Label>
                      <Textarea
                        value={slide}
                        onChange={(e) => updateSlide(hookIndex, slideIndex, e.target.value)}
                        className="mt-1 text-sm min-h-[80px] resize-none"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {onExport && hooks.some(h => h.slides) && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => onExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      )}
    </div>
  )
}