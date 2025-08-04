'use client'

import { useState, useEffect } from 'react'
import { 
  Save, RefreshCw, FileText, FolderOpen, ChevronRight, ChevronDown, 
  Sparkles, Target, Plus, Bot, Send, Upload, Eye, Code, 
  Zap, Settings, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface StructuredBrand {
  name: string
  voiceAddons: string[]
  imageBuckets: string[]
  integrationRule: string
  keyValues: string[]
  messageGuidelines: string[]
}

interface StructuredCampaign {
  name: string
  brand: string
  type: string
  duration: string
  hookTemplates: string[]
  contentPillars: string[]
  ctaVariations: string[]
}

export default function PromptsTab() {
  const [files, setFiles] = useState<PromptFile[]>([])
  const [selectedFile, setSelectedFile] = useState<PromptFile | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured')
  
  // Dialog states
  const [showBrandDialog, setShowBrandDialog] = useState(false)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedBrandForCampaign, setSelectedBrandForCampaign] = useState('')
  
  // Structured editing states
  const [structuredBrand, setStructuredBrand] = useState<StructuredBrand>({
    name: '',
    voiceAddons: [''],
    imageBuckets: [''],
    integrationRule: '',
    keyValues: [''],
    messageGuidelines: ['']
  })
  
  const [structuredCampaign, setStructuredCampaign] = useState<StructuredCampaign>({
    name: '',
    brand: '',
    type: 'awareness',
    duration: '30',
    hookTemplates: [''],
    contentPillars: [''],
    ctaVariations: ['']
  })
  
  // AI Assistant
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    // Parse structured content when file is selected
    if (selectedFile && selectedFile.type === 'brand') {
      parseStructuredBrand(editedContent)
    } else if (selectedFile && selectedFile.type === 'campaign') {
      parseStructuredCampaign(editedContent)
    }
  }, [selectedFile, editedContent])

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
    
    let contentToSave = editedContent
    
    // If in structured mode, convert to markdown
    if (viewMode === 'structured') {
      if (selectedFile.type === 'brand') {
        contentToSave = convertBrandToMarkdown(structuredBrand)
      } else if (selectedFile.type === 'campaign') {
        contentToSave = convertCampaignToMarkdown(structuredCampaign)
      }
    }
    
    setSaving(true)
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedFile.path,
          content: contentToSave
        })
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      const updatedFiles = files.map(f => 
        f.path === selectedFile.path 
          ? { ...f, content: contentToSave }
          : f
      )
      setFiles(updatedFiles)
      setSelectedFile({ ...selectedFile, content: contentToSave })
      setEditedContent(contentToSave)
      
      setMessage({ type: 'success', text: 'File saved successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save file' })
    } finally {
      setSaving(false)
    }
  }

  const parseStructuredBrand = (content: string) => {
    // Parse markdown to structured format
    const sections = content.split('##').map(s => s.trim())
    const brand: StructuredBrand = {
      name: selectedFile?.name.replace('.md', '') || '',
      voiceAddons: [],
      imageBuckets: [],
      integrationRule: '',
      keyValues: [],
      messageGuidelines: []
    }
    
    sections.forEach(section => {
      if (section.includes('Brand Voice')) {
        const lines = section.split('\n').slice(1)
        brand.voiceAddons = lines.filter(l => l.trim()).map(l => l.replace('- ', ''))
      } else if (section.includes('Key Values')) {
        const lines = section.split('\n').slice(1)
        brand.keyValues = lines.filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, ''))
      }
    })
    
    setStructuredBrand(brand)
  }

  const parseStructuredCampaign = (content: string) => {
    const lines = content.split('\n')
    const metadata: { [key: string]: string } = {}
    let inFrontMatter = false
    
    const campaign: StructuredCampaign = {
      name: '',
      brand: '',
      type: 'awareness',
      duration: '30',
      hookTemplates: [],
      contentPillars: [],
      ctaVariations: []
    }
    
    lines.forEach(line => {
      if (line.trim() === '---') {
        inFrontMatter = !inFrontMatter
      } else if (inFrontMatter) {
        const match = line.match(/^(\w+):\s*(.*)$/)
        if (match) {
          metadata[match[1]] = match[2]
        }
      }
    })
    
    campaign.name = metadata.campaign || ''
    campaign.brand = metadata.brand || ''
    campaign.type = metadata.campaign_type || 'awareness'
    campaign.duration = metadata.duration_days || '30'
    
    // Parse content sections
    const sections = content.split('##').map(s => s.trim())
    sections.forEach(section => {
      if (section.includes('Hook Templates')) {
        const lines = section.split('\n').slice(1)
        campaign.hookTemplates = lines.filter(l => l.startsWith('-')).map(l => l.substring(2))
      } else if (section.includes('Content Pillars')) {
        const lines = section.split('\n').slice(1)
        campaign.contentPillars = lines.filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, ''))
      } else if (section.includes('CTA Variations')) {
        const lines = section.split('\n').slice(1)
        campaign.ctaVariations = lines.filter(l => l.startsWith('-')).map(l => l.substring(2))
      }
    })
    
    setStructuredCampaign(campaign)
  }

  const convertBrandToMarkdown = (brand: StructuredBrand): string => {
    return `---
brand: ${brand.name}
tone_strength: 80
---

# ${brand.name} Brand Voice

## Brand Voice
${brand.voiceAddons.map(v => `- ${v}`).join('\n')}

## Key Values
${brand.keyValues.map((v, i) => `${i + 1}. ${v}`).join('\n')}

## Messaging Guidelines
${brand.messageGuidelines.map(g => `- ${g}`).join('\n')}

## Integration Rule
${brand.integrationRule}

## Image Buckets
${brand.imageBuckets.map(b => `- ${b}`).join('\n')}`
  }

  const convertCampaignToMarkdown = (campaign: StructuredCampaign): string => {
    return `---
campaign: ${campaign.name}
brand: ${campaign.brand}
campaign_type: ${campaign.type}
duration_days: ${campaign.duration}
---

# ${campaign.name}

## Hook Templates
${campaign.hookTemplates.map(h => `- ${h}`).join('\n')}

## Content Pillars
${campaign.contentPillars.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## CTA Variations
${campaign.ctaVariations.map(c => `- ${c}`).join('\n')}`
  }

  const addArrayItem = (array: string[], setter: (value: any) => void, key: string) => {
    setter((prev: any) => ({
      ...prev,
      [key]: [...prev[key], '']
    }))
  }

  const updateArrayItem = (array: string[], index: number, value: string, setter: (value: any) => void, key: string) => {
    setter((prev: any) => ({
      ...prev,
      [key]: prev[key].map((item: string, i: number) => i === index ? value : item)
    }))
  }

  const removeArrayItem = (array: string[], index: number, setter: (value: any) => void, key: string) => {
    setter((prev: any) => ({
      ...prev,
      [key]: prev[key].filter((_: string, i: number) => i !== index)
    }))
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    
    const userMessage: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages([...chatMessages, userMessage])
    setChatInput('')
    
    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `I've analyzed your request. Based on the current ${selectedFile?.type} configuration, I suggest:\n\n1. Making the hooks more engaging by adding emotional triggers\n2. Incorporating trending topics from your uploaded CSVs\n3. Adjusting the tone to match your brand voice\n\nWould you like me to generate specific examples?`
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
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowBrandDialog(true)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {brandGroups.map(group => {
                      const isExpanded = expandedBrands.has(group.brand)
                      return (
                        <div key={group.brand}>
                          <button
                            onClick={() => toggleBrand(group.brand)}
                            className="flex items-center gap-1 w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 transition-colors text-left"
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
                                    "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors text-left",
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
                                      "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors ml-4 text-left",
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
                            "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors text-left",
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
                            "flex items-center gap-2 w-full px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors text-left",
                            selectedFile?.path === file.path && "bg-blue-50 text-blue-700"
                          )}
                        >
                          <FileText className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{file.name}</span>
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
                    onClick={() => setShowAIModal(true)}
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
                {(selectedFile.type === 'brand' || selectedFile.type === 'campaign') && (
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'structured' | 'raw')} className="mb-4">
                    <TabsList>
                      <TabsTrigger value="structured">
                        <Settings className="h-4 w-4 mr-2" />
                        Structured
                      </TabsTrigger>
                      <TabsTrigger value="raw">
                        <Code className="h-4 w-4 mr-2" />
                        Raw
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                
                {viewMode === 'structured' && selectedFile.type === 'brand' ? (
                  <div className="space-y-6">
                    <div>
                      <Label>Brand Name</Label>
                      <Input
                        value={structuredBrand.name}
                        onChange={(e) => setStructuredBrand({ ...structuredBrand, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>Voice Add-ons</Label>
                      <p className="text-sm text-gray-500 mb-2">Define your brand's voice characteristics</p>
                      {structuredBrand.voiceAddons.map((voice, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            value={voice}
                            onChange={(e) => updateArrayItem(structuredBrand.voiceAddons, index, e.target.value, setStructuredBrand, 'voiceAddons')}
                            placeholder="e.g., confident, relatable, innovative"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeArrayItem(structuredBrand.voiceAddons, index, setStructuredBrand, 'voiceAddons')}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addArrayItem(structuredBrand.voiceAddons, setStructuredBrand, 'voiceAddons')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Voice Trait
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Key Values</Label>
                      <p className="text-sm text-gray-500 mb-2">Core values that drive your brand</p>
                      {structuredBrand.keyValues.map((value, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            value={value}
                            onChange={(e) => updateArrayItem(structuredBrand.keyValues, index, e.target.value, setStructuredBrand, 'keyValues')}
                            placeholder="e.g., Authenticity over perfection"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeArrayItem(structuredBrand.keyValues, index, setStructuredBrand, 'keyValues')}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addArrayItem(structuredBrand.keyValues, setStructuredBrand, 'keyValues')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Value
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </h4>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {convertBrandToMarkdown(structuredBrand)}
                      </pre>
                    </div>
                  </div>
                ) : viewMode === 'structured' && selectedFile.type === 'campaign' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Campaign Name</Label>
                        <Input
                          value={structuredCampaign.name}
                          onChange={(e) => setStructuredCampaign({ ...structuredCampaign, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Campaign Type</Label>
                        <select
                          className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={structuredCampaign.type}
                          onChange={(e) => setStructuredCampaign({ ...structuredCampaign, type: e.target.value })}
                        >
                          <option value="awareness">Awareness</option>
                          <option value="conversion">Conversion</option>
                          <option value="engagement">Engagement</option>
                          <option value="retention">Retention</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Hook Templates</Label>
                      <p className="text-sm text-gray-500 mb-2">Templates with {'{variables}'} for dynamic content</p>
                      {structuredCampaign.hookTemplates.map((hook, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            value={hook}
                            onChange={(e) => updateArrayItem(structuredCampaign.hookTemplates, index, e.target.value, setStructuredCampaign, 'hookTemplates')}
                            placeholder="e.g., Did you know {shocking_fact} about {topic}?"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeArrayItem(structuredCampaign.hookTemplates, index, setStructuredCampaign, 'hookTemplates')}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addArrayItem(structuredCampaign.hookTemplates, setStructuredCampaign, 'hookTemplates')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Hook Template
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Preview with Sample Variables
                      </h4>
                      <div className="space-y-2 text-sm">
                        {structuredCampaign.hookTemplates.map((hook, index) => (
                          <div key={index} className="p-2 bg-white rounded border">
                            {hook.replace(/{(\w+)}/g, (match, variable) => {
                              const samples: { [key: string]: string } = {
                                shocking_fact: "90% of people",
                                topic: "productivity",
                                number: "5",
                                benefit: "save hours daily"
                              }
                              return samples[variable] || `[${variable}]`
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Generate hooks using AI
                        setMessage({ type: 'success', text: 'Generating hooks...' })
                      }}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Hook Variations
                    </Button>
                  </div>
                ) : (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm border-gray-200"
                    placeholder="Enter your content here..."
                  />
                )}
                
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

      {/* AI Assistant Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Prompt Assistant
            </DialogTitle>
            <DialogDescription>
              I can help you improve your prompts based on campaign data and best practices.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 space-y-4">
                <p>Hi! I can help you:</p>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  <Button variant="outline" size="sm" onClick={() => setChatInput("Analyze my hook templates")}>
                    <Target className="h-4 w-4 mr-2" />
                    Analyze Hooks
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChatInput("Suggest improvements")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Improve Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChatInput("Generate variations")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Create Variations
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg",
                    msg.role === 'user' 
                      ? "bg-blue-50 ml-12" 
                      : "bg-gray-50 mr-12"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your prompts or upload CSV data..."
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <Button onClick={sendChatMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Brand Creation Dialog */}
      <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Brand</DialogTitle>
            <DialogDescription>
              Set up a new brand with its unique voice and values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                placeholder="e.g., Nike, Apple"
                value={structuredBrand.name}
                onChange={(e) => setStructuredBrand({ ...structuredBrand, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="voice-traits">Voice Traits (comma-separated)</Label>
              <Input
                id="voice-traits"
                placeholder="e.g., bold, innovative, friendly"
                value={structuredBrand.voiceAddons.join(', ')}
                onChange={(e) => setStructuredBrand({ 
                  ...structuredBrand, 
                  voiceAddons: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              const brandName = structuredBrand.name.toLowerCase().replace(/\s+/g, '_')
              const content = convertBrandToMarkdown(structuredBrand)
              
              try {
                await fetch('/api/prompts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filePath: `brands/${brandName}.md`,
                    content
                  })
                })
                
                setShowBrandDialog(false)
                setStructuredBrand({
                  name: '',
                  voiceAddons: [''],
                  imageBuckets: [''],
                  integrationRule: '',
                  keyValues: [''],
                  messageGuidelines: ['']
                })
                await loadFiles()
                setMessage({ type: 'success', text: 'Brand created successfully!' })
              } catch (err) {
                setMessage({ type: 'error', text: 'Failed to create brand' })
              }
            }}>
              Create Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                placeholder="e.g., Summer Sale 2024"
                value={structuredCampaign.name}
                onChange={(e) => setStructuredCampaign({ ...structuredCampaign, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="campaign-type">Campaign Type</Label>
              <select
                id="campaign-type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={structuredCampaign.type}
                onChange={(e) => setStructuredCampaign({ ...structuredCampaign, type: e.target.value })}
              >
                <option value="awareness">Awareness</option>
                <option value="conversion">Conversion</option>
                <option value="engagement">Engagement</option>
                <option value="retention">Retention</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              const campaignName = structuredCampaign.name.toLowerCase().replace(/\s+/g, '_')
              const content = convertCampaignToMarkdown({
                ...structuredCampaign,
                brand: selectedBrandForCampaign,
                hookTemplates: ['Hook template 1: {variable}', 'Hook template 2: {variable}'],
                contentPillars: ['Content pillar 1', 'Content pillar 2'],
                ctaVariations: ['CTA option 1', 'CTA option 2']
              })
              
              try {
                await fetch('/api/prompts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filePath: `campaigns/${selectedBrandForCampaign}_${campaignName}.md`,
                    content
                  })
                })
                
                setShowCampaignDialog(false)
                setStructuredCampaign({
                  name: '',
                  brand: '',
                  type: 'awareness',
                  duration: '30',
                  hookTemplates: [''],
                  contentPillars: [''],
                  ctaVariations: ['']
                })
                await loadFiles()
                setMessage({ type: 'success', text: 'Campaign created successfully!' })
              } catch (err) {
                setMessage({ type: 'error', text: 'Failed to create campaign' })
              }
            }}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}