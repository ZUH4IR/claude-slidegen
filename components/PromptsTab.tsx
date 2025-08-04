'use client'

import { useState, useEffect } from 'react'
import { Save, RefreshCw, FileText, FolderOpen, ChevronRight, ChevronDown, Sparkles, Target, Plus, Bot, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PromptFile {
  name: string
  path: string
  content: string
  type: 'brand' | 'campaign' | 'blueprint' | 'other'
}

interface BrandGroup {
  brand: string
  brandFiles: PromptFile[]
  campaigns: PromptFile[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function PromptsTab() {
  const [files, setFiles] = useState<PromptFile[]>([])
  const [selectedFile, setSelectedFile] = useState<PromptFile | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  
  // Dialog states
  const [showBrandDialog, setShowBrandDialog] = useState(false)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [selectedBrandForCampaign, setSelectedBrandForCampaign] = useState('')
  
  // Form states
  const [brandForm, setBrandForm] = useState({ name: '', toneStrength: '80', voiceAttributes: '' })
  const [campaignForm, setCampaignForm] = useState({ name: '', type: 'awareness', duration: '30' })
  
  // AI Assistant
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setFiles(data.files)
      setMessage(null)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load prompt files' })
    } finally {
      setLoading(false)
    }
  }

  const selectFile = (file: PromptFile) => {
    setSelectedFile(file)
    setEditedContent(file.content)
    setMessage(null)
  }

  const saveFile = async () => {
    if (!selectedFile) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedFile.path,
          content: editedContent
        })
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      const updatedFiles = files.map(f => 
        f.path === selectedFile.path 
          ? { ...f, content: editedContent }
          : f
      )
      setFiles(updatedFiles)
      setSelectedFile({ ...selectedFile, content: editedContent })
      
      setMessage({ type: 'success', text: 'File saved successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save file' })
    } finally {
      setSaving(false)
    }
  }

  const createBrand = async () => {
    const content = `---
brand: ${brandForm.name}
tone_strength: ${brandForm.toneStrength}
voice_attributes:
${brandForm.voiceAttributes.split(',').map(attr => `  - ${attr.trim()}`).join('\n')}
---

# ${brandForm.name} Brand Voice

## Core Identity
Define your brand's core identity here.

## Voice Guidelines
- Key voice characteristic 1
- Key voice characteristic 2
- Key voice characteristic 3

## Product Focus
Describe what aspects of products to emphasize.

## Banned Words
List words to avoid in copy.`

    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: `brands/${brandForm.name.toLowerCase()}.md`,
          content
        })
      })
      
      setShowBrandDialog(false)
      setBrandForm({ name: '', toneStrength: '80', voiceAttributes: '' })
      await loadFiles()
      setMessage({ type: 'success', text: 'Brand created successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create brand' })
    }
  }

  const createCampaign = async () => {
    const content = `---
campaign: ${campaignForm.name}
brand: ${selectedBrandForCampaign}
campaign_type: ${campaignForm.type}
duration_days: ${campaignForm.duration}
rage_bait_intensity: 50
hook_style: engaging
cta_urgency: medium
---

# ${campaignForm.name}

## Campaign Theme
Define the main theme and approach for this campaign.

## Hook Templates
- Template 1: {variable}
- Template 2: {variable}
- Template 3: {variable}

## Content Pillars
1. Pillar 1
2. Pillar 2
3. Pillar 3

## CTA Variations
- CTA option 1
- CTA option 2
- CTA option 3`

    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: `campaigns/${selectedBrandForCampaign}_${campaignForm.name.toLowerCase().replace(/\s+/g, '_')}.md`,
          content
        })
      })
      
      setShowCampaignDialog(false)
      setCampaignForm({ name: '', type: 'awareness', duration: '30' })
      await loadFiles()
      setMessage({ type: 'success', text: 'Campaign created successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create campaign' })
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    
    const userMessage: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages([...chatMessages, userMessage])
    setChatInput('')
    
    // Simulate AI response (in real app, this would call an API)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `I understand you want to edit the prompt. Based on the current context of brand "${selectedFile?.name}", I suggest focusing on making the voice more conversational and adding specific product benefits. Would you like me to help you restructure the hook templates?`
      }
      setChatMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }

  const getFileType = (path: string): PromptFile['type'] => {
    if (path.includes('brands/')) return 'brand'
    if (path.includes('campaigns/')) return 'campaign'
    if (path.includes('blueprints')) return 'blueprint'
    if (path.includes('clients/')) return 'brand'
    return 'other'
  }

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev)
      if (next.has(brand)) {
        next.delete(brand)
      } else {
        next.add(brand)
      }
      return next
    })
  }

  const hasUnsavedChanges = selectedFile && editedContent !== selectedFile.content

  const organizeFilesByBrand = (): BrandGroup[] => {
    const brandGroups: { [key: string]: BrandGroup } = {}
    
    files.forEach(file => {
      const type = getFileType(file.path)
      
      if (type === 'brand' || (type === 'campaign' && file.path.includes('campaigns/'))) {
        let brandName = ''
        
        if (file.path.includes('brands/')) {
          brandName = file.path.split('/')[1].replace('.md', '')
        } else if (file.path.includes('campaigns/')) {
          const filename = file.path.split('/').pop() || ''
          brandName = filename.split('_')[0].replace('.md', '')
        } else if (file.path.includes('clients/')) {
          brandName = file.path.split('/')[1]
        }
        
        if (brandName) {
          if (!brandGroups[brandName]) {
            brandGroups[brandName] = {
              brand: brandName,
              brandFiles: [],
              campaigns: []
            }
          }
          
          if (type === 'campaign') {
            brandGroups[brandName].campaigns.push(file)
          } else {
            brandGroups[brandName].brandFiles.push(file)
          }
        }
      }
    })
    
    return Object.values(brandGroups).sort((a, b) => a.brand.localeCompare(b.brand))
  }

  const brandGroups = organizeFilesByBrand()
  const blueprintFiles = files.filter(f => getFileType(f.path) === 'blueprint')
  const otherFiles = files.filter(f => getFileType(f.path) === 'other')

  // Parse structured content for campaigns
  const parseStructuredContent = (content: string) => {
    const lines = content.split('\n')
    const metadata: { [key: string]: string } = {}
    let inFrontMatter = false
    let contentStart = 0
    
    lines.forEach((line, index) => {
      if (line.trim() === '---') {
        if (!inFrontMatter) {
          inFrontMatter = true
        } else {
          inFrontMatter = false
          contentStart = index + 1
        }
      } else if (inFrontMatter) {
        const match = line.match(/^(\w+):\s*(.*)$/)
        if (match) {
          metadata[match[1]] = match[2]
        }
      }
    })
    
    return { metadata, content: lines.slice(contentStart).join('\n') }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Prompt Editor</h2>
          <p className="text-gray-600 mt-1">Edit brand voices, campaigns, and blueprints</p>
        </div>
        <Button
          variant="outline"
          onClick={loadFiles}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      {message && (
        <Alert className="mb-6" variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Browser */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Files</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Brands & Campaigns */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Brands & Campaigns
                    </div>
                    <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Brand</DialogTitle>
                          <DialogDescription>
                            Add a new brand with its voice configuration.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="brand-name">Brand Name</Label>
                            <Input
                              id="brand-name"
                              value={brandForm.name}
                              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                              placeholder="e.g., Nike, Apple"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tone-strength">Tone Strength ({brandForm.toneStrength}%)</Label>
                            <Input
                              id="tone-strength"
                              type="range"
                              min="0"
                              max="100"
                              value={brandForm.toneStrength}
                              onChange={(e) => setBrandForm({ ...brandForm, toneStrength: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="voice-attributes">Voice Attributes (comma-separated)</Label>
                            <Input
                              id="voice-attributes"
                              value={brandForm.voiceAttributes}
                              onChange={(e) => setBrandForm({ ...brandForm, voiceAttributes: e.target.value })}
                              placeholder="energetic, playful, authentic"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={createBrand}>Create Brand</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-1">
                    {brandGroups.map(group => {
                      const isExpanded = expandedBrands.has(group.brand)
                      return (
                        <div key={group.brand}>
                          <button
                            onClick={() => toggleBrand(group.brand)}
                            className="flex items-center gap-1 w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-gray-400" />
                            )}
                            <FolderOpen className="h-3.5 w-3.5 text-purple-500" />
                            <span className="font-medium">{group.brand}</span>
                          </button>
                          
                          {isExpanded && (
                            <div className="ml-6 space-y-1">
                              {group.brandFiles.map(file => (
                                <button
                                  key={file.path}
                                  onClick={() => selectFile(file)}
                                  className={cn(
                                    "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors",
                                    selectedFile?.path === file.path && "bg-blue-50 text-blue-700"
                                  )}
                                >
                                  <FileText className="h-3 w-3 text-purple-400" />
                                  <span className="truncate">brand config</span>
                                </button>
                              ))}
                              
                              <div className="mt-1">
                                <div className="flex items-center justify-between px-2 py-1">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Target className="h-3 w-3" />
                                    campaigns
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0"
                                    onClick={() => {
                                      setSelectedBrandForCampaign(group.brand)
                                      setShowCampaignDialog(true)
                                    }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                {group.campaigns.map(file => (
                                  <button
                                    key={file.path}
                                    onClick={() => selectFile(file)}
                                    className={cn(
                                      "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors ml-4",
                                      selectedFile?.path === file.path && "bg-blue-50 text-blue-700"
                                    )}
                                  >
                                    <FileText className="h-3 w-3 text-green-500" />
                                    <span className="truncate">
                                      {file.name.replace(`${group.brand}_`, '').replace('.md', '')}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Blueprints */}
                {blueprintFiles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Blueprints
                    </div>
                    <div className="space-y-1 ml-6">
                      {blueprintFiles.map(file => (
                        <button
                          key={file.path}
                          onClick={() => selectFile(file)}
                          className={cn(
                            "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors",
                            selectedFile?.path === file.path && "bg-blue-50 text-blue-700"
                          )}
                        >
                          <FileText className="h-3 w-3 text-blue-400" />
                          <span className="truncate">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Files */}
                {otherFiles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Other
                    </div>
                    <div className="space-y-1 ml-6">
                      {otherFiles.map(file => (
                        <button
                          key={file.path}
                          onClick={() => selectFile(file)}
                          className={cn(
                            "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors",
                            selectedFile?.path === file.path && "bg-blue-50 text-blue-700"
                          )}
                        >
                          <FileText className="h-3 w-3 text-gray-400" />
                          <span className="truncate text-left">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3">
          {selectedFile ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {selectedFile.path.includes('brand') && <Sparkles className="h-4 w-4 text-purple-500" />}
                    {selectedFile.path.includes('campaign') && <Target className="h-4 w-4 text-green-500" />}
                    {selectedFile.path.includes('blueprint') && <FileText className="h-4 w-4 text-blue-500" />}
                    {selectedFile.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{selectedFile.path}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Button>
                  <Button
                    onClick={saveFile}
                    disabled={saving || !hasUnsavedChanges}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedFile.path.includes('campaign') && (() => {
                  const { metadata } = parseStructuredContent(editedContent)
                  return (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Campaign:</span>
                          <span className="ml-2 font-medium">{metadata.campaign || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-medium">{metadata.campaign_type || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-2 font-medium">{metadata.duration_days || 'N/A'} days</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
                
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm border-gray-200"
                  placeholder="Enter your content here..."
                />
                {hasUnsavedChanges && (
                  <p className="text-sm text-amber-600 mt-2">
                    You have unsaved changes
                  </p>
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-xl border overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAIAssistant(false)}
            >
              ×
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Hi! I can help you edit your prompts. I have context about your current brand, campaigns, and universal engine. What would you like to improve?
              </p>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    msg.role === 'user' 
                      ? "bg-blue-50 ml-8" 
                      : "bg-gray-50 mr-8"
                  )}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask for help with your prompts..."
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <Button size="sm" onClick={sendChatMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Creation Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Add a new campaign for {selectedBrandForCampaign}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="e.g., Summer Sale 2024"
              />
            </div>
            <div>
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <select
                id="campaign-type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={campaignForm.type}
                onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
              >
                <option value="awareness">Awareness</option>
                <option value="conversion">Conversion</option>
                <option value="engagement">Engagement</option>
                <option value="retention">Retention</option>
              </select>
            </div>
            <div>
              <Label htmlFor="campaign-duration">Duration (days)</Label>
              <Input
                id="campaign-duration"
                type="number"
                value={campaignForm.duration}
                onChange={(e) => setCampaignForm({ ...campaignForm, duration: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createCampaign}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}