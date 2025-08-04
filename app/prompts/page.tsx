'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Save, FolderOpen, FileText, ChevronRight, Edit, RefreshCw, GitBranch, History, Code, Eye, Copy, Link, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import matter from 'gray-matter'

interface PromptVersion {
  version: number
  status: 'active' | 'archived'
  createdAt: string
  content: string
}

interface ClientData {
  name: string
  campaigns: string[]
  activeVersion?: number
}

interface FormField {
  key: string
  label: string
  value: string
  type: 'text' | 'textarea'
}

export default function PromptsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientData[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [selectedType, setSelectedType] = useState<'new' | 'edit'>('new')
  const [isNewClient, setIsNewClient] = useState(false)
  const [isNewCampaign, setIsNewCampaign] = useState(false)
  const [isGlobalRules, setIsGlobalRules] = useState(false)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'form' | 'raw'>('form')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showFullChain, setShowFullChain] = useState(false)
  const [versions, setVersions] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState(1)
  const [fullPromptChain, setFullPromptChain] = useState('')
  
  // Form fields
  const [clientName, setClientName] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [rawPrompt, setRawPrompt] = useState('')
  const [frontmatter, setFrontmatter] = useState<any>({})
  const [dynamicFields, setDynamicFields] = useState<FormField[]>([])
  
  // Standard fields
  const [brandVoice, setBrandVoice] = useState('')
  const [imageBuckets, setImageBuckets] = useState('')
  const [toneStrength, setToneStrength] = useState('80')
  const [ctaVariant, setCtaVariant] = useState('soft')
  const [bannedWords, setBannedWords] = useState('')
  const [integrationRule, setIntegrationRule] = useState('')
  
  // Campaign specific
  const [audience, setAudience] = useState('')
  const [rageBaitIntensity, setRageBaitIntensity] = useState('50')
  const [campaignNotes, setCampaignNotes] = useState('')

  // Preview variables
  const [previewVariables, setPreviewVariables] = useState({
    product_slide: '5',
    brand_name: selectedClient || 'brand',
    campaign_name: campaignName || 'campaign'
  })

  useEffect(() => {
    loadClients()
  }, [])

  // Sync form fields with raw prompt
  useEffect(() => {
    if (viewMode === 'form') {
      updateRawFromForm()
    }
  }, [brandVoice, integrationRule, imageBuckets, toneStrength, ctaVariant, bannedWords, audience, rageBaitIntensity, campaignNotes, dynamicFields])

  const updateRawFromForm = () => {
    if (isGlobalRules) {
      let content = ''
      
      // Add dynamic fields
      dynamicFields.forEach(field => {
        content += `\n\n## ${field.label}\n${field.value}`
      })
      
      setRawPrompt(content.trim())
    } else if (isNewClient) {
      const fm = {
        version: selectedType === 'edit' ? currentVersion : 1,
        status: 'active',
        image_buckets: imageBuckets,
        tone_strength: parseInt(toneStrength),
        cta_variant: ctaVariant,
        banned_words: bannedWords.split(',').map(w => w.trim()).filter(Boolean)
      }
      
      let content = `voice: ${brandVoice}\nintegration_rule: ${integrationRule}`
      
      // Add dynamic fields
      dynamicFields.forEach(field => {
        content += `\n\n## ${field.label}\n${field.value}`
      })
      
      setRawPrompt(matter.stringify(content, fm))
    } else if (isNewCampaign) {
      const fm = {
        version: selectedType === 'edit' ? currentVersion : 1,
        status: 'active',
        audience,
        rage_bait_intensity: parseInt(rageBaitIntensity),
        notes: campaignNotes
      }
      
      let content = campaignNotes
      
      // Add dynamic fields
      dynamicFields.forEach(field => {
        content += `\n\n## ${field.label}\n${field.value}`
      })
      
      setRawPrompt(matter.stringify(content, fm))
    }
  }

  const parseRawPrompt = (raw: string) => {
    try {
      let fm = {}
      let content = raw
      
      // Only parse frontmatter if not global rules
      if (!isGlobalRules) {
        const parsed = matter(raw)
        fm = parsed.data
        content = parsed.content
      }
      
      setFrontmatter(fm)
      
      // Parse content for standard fields and dynamic sections
      const lines = content.split('\n')
      const sections: FormField[] = []
      let currentSection: FormField | null = null
      let contentBuffer: string[] = []
      let skipRest = false
      
      lines.forEach((line, i) => {
        if (skipRest) return
        if (line.startsWith('## ')) {
          // Save previous section
          if (currentSection) {
            currentSection.value = contentBuffer.join('\n').trim()
            sections.push(currentSection)
          }
          
          // Start new section
          const label = line.substring(3).trim()
          currentSection = {
            key: `section_${i}`,
            label,
            value: '',
            type: 'textarea' as const
          }
          contentBuffer = []
        } else if (line.startsWith('voice: ') && !currentSection) {
          setBrandVoice(line.substring(7))
        } else if (line.startsWith('integration_rule: ') && !currentSection) {
          setIntegrationRule(line.substring(17))
        } else if (currentSection) {
          contentBuffer.push(line)
        } else if (!line.startsWith('voice:') && !line.startsWith('integration_rule:')) {
          // Campaign notes or other content
          if (!currentSection && isNewCampaign) {
            setCampaignNotes(lines.slice(i).join('\n').trim())
            skipRest = true
          }
        }
      })
      
      // Save last section
      if (currentSection) {
        (currentSection as FormField).value = contentBuffer.join('\n').trim()
        sections.push(currentSection as FormField)
      }
      
      setDynamicFields(sections)
      
      // Update standard fields from frontmatter
      const frontmatter = fm as any
      if (frontmatter.image_buckets) setImageBuckets(frontmatter.image_buckets)
      if (frontmatter.tone_strength) setToneStrength(frontmatter.tone_strength.toString())
      if (frontmatter.cta_variant) setCtaVariant(frontmatter.cta_variant)
      if (frontmatter.banned_words) setBannedWords(frontmatter.banned_words.join(', '))
      if (frontmatter.audience) setAudience(frontmatter.audience)
      if (frontmatter.rage_bait_intensity) setRageBaitIntensity(frontmatter.rage_bait_intensity.toString())
      if (frontmatter.version) setCurrentVersion(frontmatter.version)
    } catch (err) {
      console.error('Error parsing raw prompt:', err)
    }
  }

  const loadClients = async () => {
    try {
      const res = await fetch('/api/prompts/clients')
      const data = await res.json()
      setClients(data.clients)
    } catch (err) {
      console.error('Failed to load clients:', err)
    }
  }

  const toggleClient = (clientName: string) => {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName)
    } else {
      newExpanded.add(clientName)
    }
    setExpandedClients(newExpanded)
  }

  const handleEditGlobalRules = async () => {
    try {
      const res = await fetch(`/api/prompts/load?type=global&client=global`)
      const data = await res.json()
      
      setSelectedType('edit')
      setIsGlobalRules(true)
      setIsNewClient(false)
      setIsNewCampaign(false)
      
      // Set raw prompt
      setRawPrompt(data.content)
      
      // Parse into form fields
      parseRawPrompt(data.content)
    } catch (err) {
      console.error('Failed to load global rules:', err)
    }
  }

  const handleEditClient = async (clientName: string) => {
    try {
      const res = await fetch(`/api/prompts/load?type=brand&client=${clientName}`)
      const data = await res.json()
      
      setSelectedClient(clientName)
      setSelectedType('edit')
      setIsNewClient(true)
      setIsNewCampaign(false)
      setIsGlobalRules(false)
      setClientName(clientName)
      
      // Set raw prompt
      setRawPrompt(matter.stringify(data.content, data.frontmatter))
      
      // Parse into form fields
      parseRawPrompt(matter.stringify(data.content, data.frontmatter))
    } catch (err) {
      console.error('Failed to load client:', err)
    }
  }

  const handleEditCampaign = async (clientName: string, campaignName: string) => {
    try {
      const res = await fetch(`/api/prompts/load?type=campaign&client=${clientName}&campaign=${campaignName}`)
      const data = await res.json()
      
      setSelectedClient(clientName)
      setSelectedCampaign(campaignName)
      setSelectedType('edit')
      setIsNewClient(false)
      setIsNewCampaign(true)
      setIsGlobalRules(false)
      setCampaignName(campaignName)
      
      // Set raw prompt
      setRawPrompt(matter.stringify(data.content, data.frontmatter))
      
      // Parse into form fields
      parseRawPrompt(matter.stringify(data.content, data.frontmatter))
    } catch (err) {
      console.error('Failed to load campaign:', err)
    }
  }

  const handleCampaignNameChange = async (newName: string) => {
    if (selectedType === 'edit' && newName !== campaignName) {
      try {
        await fetch('/api/prompts/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: selectedClient,
            oldName: campaignName,
            newName
          })
        })

        toast({
          title: 'Renamed',
          description: `Campaign renamed to ${newName}`
        })

        setCampaignName(newName)
        loadClients()
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to rename campaign',
          variant: 'destructive'
        })
      }
    } else {
      setCampaignName(newName)
    }
  }

  const loadVersions = async () => {
    try {
      const params = new URLSearchParams({
        client: selectedClient,
        type: isNewClient ? 'brand' : 'campaign',
        ...(isNewCampaign && { campaign: campaignName })
      })
      
      const res = await fetch(`/api/prompts/versions?${params}`)
      const data = await res.json()
      setVersions(data.versions || [])
    } catch (err) {
      console.error('Failed to load versions:', err)
    }
  }

  const loadVersion = async (version: number) => {
    try {
      const fileName = isNewCampaign 
        ? `${campaignName}_v${version}.md`
        : `_brand_v${version}.md`
      
      const res = await fetch(`/api/prompts/load?type=${isNewCampaign ? 'campaign' : 'brand'}&client=${selectedClient}&campaign=${campaignName}&version=${version}`)
      const data = await res.json()
      
      setRawPrompt(matter.stringify(data.content, data.frontmatter))
      parseRawPrompt(matter.stringify(data.content, data.frontmatter))
      setCurrentVersion(version)
      
      toast({
        title: 'Version Loaded',
        description: `Loaded version ${version}`
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load version',
        variant: 'destructive'
      })
    }
  }

  const activateVersion = async (version: number) => {
    try {
      await fetch('/api/prompts/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: selectedClient,
          type: isNewClient ? 'brand' : 'campaign',
          campaign: isNewCampaign ? campaignName : undefined,
          version,
          action: 'activate'
        })
      })

      toast({
        title: 'Version Activated',
        description: `Version ${version} is now active`
      })

      loadVersions()
      loadClients()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to activate version',
        variant: 'destructive'
      })
    }
  }

  const loadFullPromptChain = async () => {
    try {
      let fullChain = '# Full Prompt Chain\n\n'
      
      // Load global rules
      try {
        const globalRes = await fetch('/api/prompts/load?type=global&client=global')
        const globalData = await globalRes.json()
        fullChain += '## Global Rules\n\n'
        fullChain += globalData.content + '\n\n'
      } catch (err) {
        console.log('No global rules found')
      }
      
      // Load brand prompt
      if (selectedClient) {
        try {
          const brandRes = await fetch(`/api/prompts/load?type=brand&client=${selectedClient}`)
          const brandData = await brandRes.json()
          fullChain += `## Brand: ${selectedClient}\n\n`
          fullChain += brandData.content + '\n\n'
        } catch (err) {
          console.log('No brand prompt found')
        }
      }
      
      // Load campaign prompt
      if (isNewCampaign && campaignName) {
        fullChain += `## Campaign: ${campaignName}\n\n`
        fullChain += rawPrompt
      }
      
      setFullPromptChain(fullChain)
    } catch (err) {
      console.error('Failed to load full prompt chain:', err)
    }
  }

  useEffect(() => {
    if (showFullChain && selectedClient) {
      loadFullPromptChain()
    }
  }, [showFullChain, selectedClient, campaignName, rawPrompt])

  const handleSave = async () => {
    try {
      // Parse raw prompt if in raw mode
      if (viewMode === 'raw') {
        parseRawPrompt(rawPrompt)
      }

      if (isGlobalRules) {
        // Save global rules
        await fetch('/api/prompts/save-structured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'global/rules_v1.md',
            frontmatter: {},
            content: rawPrompt
          })
        })

        toast({
          title: 'Saved',
          description: 'Global rules saved successfully'
        })
        return
      }

      const { data: fm, content } = matter(rawPrompt)
      
      // Determine next version number
      let nextVersion = 1
      if (selectedType === 'edit') {
        // Get current versions to find the highest
        const params = new URLSearchParams({
          client: selectedClient,
          type: isNewClient ? 'brand' : 'campaign',
          ...(isNewCampaign && { campaign: campaignName })
        })
        
        const res = await fetch(`/api/prompts/versions?${params}`)
        const data = await res.json()
        const versions = data.versions || []
        
        if (versions.length > 0) {
          nextVersion = Math.max(...versions.map((v: any) => v.version)) + 1
        }
      }
      
      fm.version = nextVersion
      fm.status = 'active'
      
      const fileName = isNewCampaign 
        ? `${selectedClient}/${campaignName}_v${nextVersion}.md`
        : `${selectedClient}/_brand_v${nextVersion}.md`

      await fetch('/api/prompts/save-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: fileName,
          frontmatter: fm,
          content
        })
      })

      toast({
        title: 'Saved',
        description: `${isNewCampaign ? 'Campaign' : 'Brand'} prompt saved as version ${nextVersion}`
      })

      setCurrentVersion(nextVersion)
      loadClients()
      if (selectedType === 'new') {
        setSelectedType('edit')
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save prompt',
        variant: 'destructive'
      })
    }
  }

  const addDynamicField = () => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: 'New Section',
      value: '',
      type: 'textarea'
    }
    setDynamicFields([...dynamicFields, newField])
  }

  const updateDynamicField = (key: string, field: Partial<FormField>) => {
    setDynamicFields(dynamicFields.map(f => 
      f.key === key ? { ...f, ...field } : f
    ))
  }

  const removeDynamicField = (key: string) => {
    setDynamicFields(dynamicFields.filter(f => f.key !== key))
  }

  const resetForm = () => {
    setIsNewClient(false)
    setIsNewCampaign(false)
    setIsGlobalRules(false)
    setSelectedType('new')
    setClientName('')
    setCampaignName('')
    setBrandVoice('')
    setImageBuckets('')
    setToneStrength('80')
    setCtaVariant('soft')
    setBannedWords('')
    setIntegrationRule('')
    setAudience('')
    setRageBaitIntensity('50')
    setCampaignNotes('')
    setRawPrompt('')
    setDynamicFields([])
  }

  // Generate preview with variables replaced
  const previewContent = useMemo(() => {
    let content = rawPrompt
    Object.entries(previewVariables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })
    return content
  }, [rawPrompt, previewVariables])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Content copied to clipboard'
    })
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Global Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Global</h2>
            <div className="space-y-2">
              <div 
                className="border rounded-lg bg-background p-3 cursor-pointer hover:bg-accent flex items-center justify-between"
                onClick={handleEditGlobalRules}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Global Rules</span>
                </div>
                <Button size="sm" variant="ghost">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Clients Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Clients</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsNewClient(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadClients}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {clients.map(client => (
              <div key={client.name} className="border rounded-lg bg-background">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent"
                  onClick={() => toggleClient(client.name)}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedClients.has(client.name) && "rotate-90"
                      )}
                    />
                    <FolderOpen className="h-4 w-4" />
                    <span className="font-medium">{client.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      v{client.activeVersion || 1}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditClient(client.name)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {expandedClients.has(client.name) && (
                  <div className="px-3 pb-3">
                    <div className="ml-6 space-y-1">
                      {client.campaigns.map(campaign => (
                        <div 
                          key={campaign}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
                          onClick={() => handleEditCampaign(client.name, campaign)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            <span className="text-sm">{campaign}</span>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          resetForm()
                          setSelectedClient(client.name)
                          setIsNewCampaign(true)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Campaign
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Prompt Management</h1>
            <p className="text-muted-foreground">
              Create and manage brand voices and campaign prompts
            </p>
          </div>

          {/* Form/Editor */}
          {(isNewClient || isNewCampaign || isGlobalRules) && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {selectedType === 'edit' ? 'Edit' : 'Create New'} {isGlobalRules ? 'Global Rules' : isNewClient ? 'Client/Brand' : 'Campaign'}
                      </CardTitle>
                      <CardDescription>
                        {isGlobalRules 
                          ? 'Editing: prompts/global/rules_v1.md'
                          : selectedType === 'edit' 
                          ? `Editing: clients/${isNewClient ? clientName : selectedClient}/${isNewClient ? '_brand' : campaignName}_v${currentVersion}.md`
                          : `Creating: clients/${isNewClient ? clientName : selectedClient}/${isNewClient ? '_brand' : campaignName}_v1.md`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedType === 'edit' && versions.length > 1 && (
                        <Select 
                          value={currentVersion.toString()} 
                          onValueChange={(v) => loadVersion(parseInt(v))}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.map(v => (
                              <SelectItem key={v.version} value={v.version.toString()}>
                                Version {v.version}
                                {v.status === 'active' && <Badge className="ml-2" variant="default">Active</Badge>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowVersionHistory(true)
                        loadVersions()
                      }}>
                        <GitBranch className="h-4 w-4 mr-1" />
                        History
                      </Button>
                      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'form' | 'raw')}>
                        <TabsList>
                          <TabsTrigger value="form">
                            <Eye className="h-4 w-4 mr-1" />
                            Form
                          </TabsTrigger>
                          <TabsTrigger value="raw">
                            <Code className="h-4 w-4 mr-1" />
                            Raw
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === 'form' ? (
                    <div className="space-y-4">
                      {isGlobalRules ? (
                        <>
                          <div className="space-y-4">
                            <Label className="text-base">Global Rules Sections</Label>
                            <p className="text-sm text-muted-foreground">
                              Define global rules that apply to all slide generation
                            </p>
                          </div>
                        </>
                      ) : isNewClient ? (
                        <>
                          <div>
                            <Label htmlFor="client-name">Client Name</Label>
                            <Input
                              id="client-name"
                              placeholder="e.g., vibit, pupscan"
                              value={clientName}
                              onChange={(e) => {
                                setClientName(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                                setSelectedClient(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                              }}
                              disabled={selectedType === 'edit'}
                            />
                          </div>

                          <div>
                            <Label htmlFor="brand-voice">Brand Voice</Label>
                            <Textarea
                              id="brand-voice"
                              placeholder="e.g., playful health advocate"
                              value={brandVoice}
                              onChange={(e) => setBrandVoice(e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div>
                            <Label htmlFor="integration-rule">Integration Rule</Label>
                            <Textarea
                              id="integration-rule"
                              placeholder="e.g., mention vibit on slide {{product_slide}}"
                              value={integrationRule}
                              onChange={(e) => setIntegrationRule(e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div>
                            <Label htmlFor="image-buckets">Image Buckets</Label>
                            <Textarea
                              id="image-buckets"
                              placeholder="hook: vibit/hook&#10;problem: vibit/problem"
                              value={imageBuckets}
                              onChange={(e) => setImageBuckets(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="tone-strength">Tone Strength</Label>
                              <Input
                                id="tone-strength"
                                type="number"
                                min="0"
                                max="100"
                                value={toneStrength}
                                onChange={(e) => setToneStrength(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="cta-variant">CTA Variant</Label>
                              <Select value={ctaVariant} onValueChange={setCtaVariant}>
                                <SelectTrigger id="cta-variant">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="soft">Soft</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="banned-words">Banned Words</Label>
                            <Input
                              id="banned-words"
                              placeholder="boomer, orthotics, ageist"
                              value={bannedWords}
                              onChange={(e) => setBannedWords(e.target.value)}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor="campaign-name">Campaign Name</Label>
                            <Input
                              id="campaign-name"
                              placeholder="e.g., older, yoga, supernatural"
                              value={campaignName}
                              onChange={(e) => handleCampaignNameChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                              onBlur={() => {
                                if (selectedType === 'edit') {
                                  loadClients()
                                }
                              }}
                            />
                          </div>

                          <div>
                            <Label htmlFor="audience">Target Audience</Label>
                            <Input
                              id="audience"
                              placeholder="e.g., 45-65yo"
                              value={audience}
                              onChange={(e) => setAudience(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="rage-bait">Rage Bait Intensity</Label>
                            <div className="flex items-center gap-4">
                              <Input
                                id="rage-bait"
                                type="number"
                                min="0"
                                max="100"
                                value={rageBaitIntensity}
                                onChange={(e) => setRageBaitIntensity(e.target.value)}
                                className="w-24"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="campaign-notes">Campaign Notes</Label>
                            <Textarea
                              id="campaign-notes"
                              placeholder="Campaign-specific rules and notes"
                              value={campaignNotes}
                              onChange={(e) => setCampaignNotes(e.target.value)}
                              rows={4}
                            />
                          </div>
                        </>
                      )}

                      {/* Dynamic Fields */}
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base">Additional Sections</Label>
                          <Button size="sm" variant="outline" onClick={addDynamicField}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Section
                          </Button>
                        </div>
                        
                        {dynamicFields.map(field => (
                          <div key={field.key} className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <Input
                                value={field.label}
                                onChange={(e) => updateDynamicField(field.key, { label: e.target.value })}
                                placeholder="Section Title"
                                className="font-medium"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeDynamicField(field.key)}
                              >
                                ×
                              </Button>
                            </div>
                            <Textarea
                              value={field.value}
                              onChange={(e) => updateDynamicField(field.key, { value: e.target.value })}
                              placeholder="Section content..."
                              rows={3}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full">
                      <Textarea
                        value={rawPrompt}
                        onChange={(e) => {
                          setRawPrompt(e.target.value)
                          parseRawPrompt(e.target.value)
                        }}
                        className={cn(
                          "font-mono text-sm resize-none",
                          isNewCampaign ? "min-h-[900px]" : "min-h-[600px]"
                        )}
                        placeholder="Enter raw prompt with frontmatter..."
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Use ## to create new sections that will appear as form fields
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleSave} 
                    className="w-full mt-4"
                    disabled={
                      isGlobalRules ? false : isNewClient ? (!clientName || !brandVoice) : (!selectedClient || !campaignName)
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isGlobalRules ? 'Save Global Rules' : selectedType === 'edit' ? 'Save New Version' : 'Create'} {!isGlobalRules && (isNewClient ? 'Client' : 'Campaign')}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Section */}
              <Card>
                <CardHeader>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-0"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <div className="flex items-center gap-2">
                      <CardTitle>Preview</CardTitle>
                      <CardDescription>See how your prompt looks with variables filled</CardDescription>
                    </div>
                    {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                {showPreview && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Preview Variables</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label htmlFor="preview-product-slide" className="text-xs">Product Slide</Label>
                          <Input
                            id="preview-product-slide"
                            type="number"
                            value={previewVariables.product_slide}
                            onChange={(e) => setPreviewVariables({
                              ...previewVariables,
                              product_slide: e.target.value
                            })}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Rendered Preview</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(previewContent)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">{previewContent}</pre>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Full Chain Section */}
              <Card>
                <CardHeader>
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-0"
                    onClick={() => setShowFullChain(!showFullChain)}
                  >
                    <div className="flex items-center gap-2">
                      <CardTitle>Full Prompt Chain</CardTitle>
                      <CardDescription>Complete prompt chain including global rules, brand, and campaign</CardDescription>
                    </div>
                    {showFullChain ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                {showFullChain && (
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Full Chain</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(fullPromptChain)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy Full Chain
                        </Button>
                      </div>
                      <div className="p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">{fullPromptChain}</pre>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {!isNewClient && !isNewCampaign && !isGlobalRules && (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                Select a client or campaign from the sidebar to edit, or create a new one
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and manage different versions of this prompt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {versions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No version history available</p>
            ) : (
              versions.map((version) => (
                <div key={version.version} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Version {version.version}</div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(version.createdAt).toLocaleString()}
                      </div>
                      {version.modifiedAt !== version.createdAt && (
                        <div className="text-sm text-muted-foreground">
                          Modified: {new Date(version.modifiedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={version.status === 'active' ? 'default' : 'secondary'}>
                        {version.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          loadVersion(version.version)
                          setShowVersionHistory(false)
                        }}
                      >
                        Load
                      </Button>
                      {version.status !== 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateVersion(version.version)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}