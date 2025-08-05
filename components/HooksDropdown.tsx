'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Copy, ChevronDown, ChevronRight, FileText, Edit, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HookItem {
  id: string
  text: string
  bottomText?: string
  category?: string
  tags?: string[]
  selected?: boolean
}

interface HooksDropdownProps {
  value: HookItem[]
  onChange: (hooks: HookItem[]) => void
  showBottomText?: boolean
  categories?: string[]
  className?: string
  placeholder?: string
  maxHeight?: number
}

const DEFAULT_CATEGORIES = [
  'Question',
  'Statement',
  'Comparison',
  'Challenge',
  'Curiosity',
  'Controversy',
  'Personal',
  'Educational',
  'Entertainment',
  'Other'
]

export function HooksDropdown({
  value = [],
  onChange,
  showBottomText = true,
  categories = DEFAULT_CATEGORIES,
  className,
  placeholder = "Select hooks...",
  maxHeight = 400
}: HooksDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newHook, setNewHook] = useState<Partial<HookItem>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingHook, setEditingHook] = useState<Partial<HookItem>>({})
  const [expandedHooks, setExpandedHooks] = useState<Set<string>>(new Set())

  // Predefined hooks library
  const [hooksLibrary] = useState<HookItem[]>([
    { id: '1', text: "Did you know that {{topic}}?", category: 'Question', tags: ['educational'] },
    { id: '2', text: "This changed everything about {{topic}}", category: 'Statement', tags: ['dramatic'] },
    { id: '3', text: "{{topic}} vs {{alternative}} - which wins?", category: 'Comparison', tags: ['versus'] },
    { id: '4', text: "I bet you can't {{challenge}}", category: 'Challenge', tags: ['interactive'] },
    { id: '5', text: "The truth about {{topic}} shocked me", category: 'Curiosity', tags: ['revelation'] },
    { id: '6', text: "Why {{topic}} is actually {{controversial_take}}", category: 'Controversy', tags: ['debate'] },
    { id: '7', text: "My {{personal_experience}} with {{topic}}", category: 'Personal', tags: ['story'] },
    { id: '8', text: "{{number}} things about {{topic}} you need to know", category: 'Educational', tags: ['listicle'] },
    { id: '9', text: "Wait for it... {{topic}} edition", category: 'Entertainment', tags: ['suspense'] },
    { id: '10', text: "POV: You just discovered {{topic}}", category: 'Personal', tags: ['relatable'] },
  ])

  const filteredHooks = [...hooksLibrary, ...value.filter(h => !hooksLibrary.find(lib => lib.id === h.id))]
    .filter(hook => {
      const matchesSearch = searchTerm === '' || 
        hook.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hook.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || hook.category === selectedCategory
      return matchesSearch && matchesCategory
    })

  const selectedHooks = value.filter(h => h.selected)
  const selectedCount = selectedHooks.length

  const toggleHook = (hookId: string) => {
    const hook = filteredHooks.find(h => h.id === hookId)
    if (!hook) return

    const existingIndex = value.findIndex(h => h.id === hookId)
    if (existingIndex >= 0) {
      const updated = [...value]
      updated[existingIndex] = { ...updated[existingIndex], selected: !updated[existingIndex].selected }
      onChange(updated)
    } else {
      onChange([...value, { ...hook, selected: true }])
    }
  }

  const updateHookBottomText = (hookId: string, bottomText: string) => {
    const updated = value.map(h => 
      h.id === hookId ? { ...h, bottomText } : h
    )
    onChange(updated)
  }

  const addNewHook = () => {
    if (!newHook.text) return
    
    const hook: HookItem = {
      id: `custom_${Date.now()}`,
      text: newHook.text,
      bottomText: newHook.bottomText,
      category: newHook.category || 'Other',
      tags: newHook.tags || [],
      selected: true
    }
    
    onChange([...value, hook])
    setNewHook({})
    setIsAddingNew(false)
  }

  const updateHook = (hookId: string, updates: Partial<HookItem>) => {
    const updated = value.map(h => 
      h.id === hookId ? { ...h, ...updates } : h
    )
    onChange(updated)
  }

  const deleteHook = (hookId: string) => {
    onChange(value.filter(h => h.id !== hookId))
  }

  const toggleExpanded = (hookId: string) => {
    const newExpanded = new Set(expandedHooks)
    if (newExpanded.has(hookId)) {
      newExpanded.delete(hookId)
    } else {
      newExpanded.add(hookId)
    }
    setExpandedHooks(newExpanded)
  }

  const startEditing = (hook: HookItem) => {
    setEditingId(hook.id)
    setEditingHook({ ...hook })
  }

  const saveEdit = () => {
    if (editingId && editingHook.text) {
      updateHook(editingId, editingHook)
      setEditingId(null)
      setEditingHook({})
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingHook({})
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Hooks Selection</Label>
      
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedCount > 0 ? `${selectedCount} hooks selected` : placeholder}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>

        {isOpen && (
          <Card className="absolute z-50 w-full mt-2 shadow-lg">
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Select Hooks</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingNew(!isAddingNew)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search hooks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-1 text-sm border rounded-md"
                  />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isAddingNew && (
                <div className="mb-4 p-3 border rounded-lg space-y-3 bg-muted/50">
                  <div>
                    <Label className="text-xs">Hook Text</Label>
                    <Textarea
                      value={newHook.text || ''}
                      onChange={(e) => setNewHook({ ...newHook, text: e.target.value })}
                      placeholder="Enter your custom hook..."
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                  
                  {showBottomText && (
                    <div>
                      <Label className="text-xs">Bottom Text (Optional)</Label>
                      <input
                        type="text"
                        value={newHook.bottomText || ''}
                        onChange={(e) => setNewHook({ ...newHook, bottomText: e.target.value })}
                        placeholder="Bottom text..."
                        className="mt-1 w-full px-3 py-1 text-sm border rounded-md"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={newHook.category || 'Other'} 
                      onValueChange={(v) => setNewHook({ ...newHook, category: v })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex-1 flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setIsAddingNew(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={addNewHook} disabled={!newHook.text}>
                        Add Hook
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <ScrollArea className="h-full" style={{ maxHeight }}>
                <div className="space-y-1">
                  {filteredHooks.map(hook => {
                    const isSelected = value.find(h => h.id === hook.id)?.selected
                    const isExpanded = expandedHooks.has(hook.id)
                    const isEditing = editingId === hook.id
                    const isCustom = hook.id.startsWith('custom_')
                    
                    return (
                      <div
                        key={hook.id}
                        className={cn(
                          "rounded-lg border p-2 transition-colors",
                          isSelected && "bg-primary/10 border-primary"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={isSelected || false}
                            onCheckedChange={() => toggleHook(hook.id)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                {isEditing ? (
                                  <Textarea
                                    value={editingHook.text || ''}
                                    onChange={(e) => setEditingHook({ ...editingHook, text: e.target.value })}
                                    className="min-h-[60px] text-sm"
                                  />
                                ) : (
                                  <p className="text-sm">{hook.text}</p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                {hook.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {hook.category}
                                  </Badge>
                                )}
                                {isCustom && (
                                  <Badge variant="outline" className="text-xs">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {hook.bottomText && !isEditing && (
                              <p className="text-xs text-muted-foreground">
                                Bottom: {hook.bottomText}
                              </p>
                            )}
                            
                            {isSelected && showBottomText && (
                              <div className="mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpanded(hook.id)}
                                  className="h-6 px-2 text-xs"
                                >
                                  {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                                  {hook.bottomText ? 'Edit Bottom Text' : 'Add Bottom Text'}
                                </Button>
                                
                                {isExpanded && (
                                  <div className="mt-2">
                                    <input
                                      type="text"
                                      value={value.find(h => h.id === hook.id)?.bottomText || ''}
                                      onChange={(e) => updateHookBottomText(hook.id, e.target.value)}
                                      placeholder="Enter bottom text..."
                                      className="w-full px-2 py-1 text-xs border rounded"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {isCustom && (
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => startEditing(hook)} className="h-6 w-6 p-0">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => deleteHook(hook.id)} className="h-6 w-6 p-0">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedHooks.map(hook => (
            <Badge key={hook.id} variant="secondary" className="text-xs">
              {hook.text.substring(0, 30)}...
              {hook.bottomText && ' (+bottom)'}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}