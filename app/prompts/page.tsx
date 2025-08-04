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
import { VariableLegend } from '@/components/VariableLegend'
import { FolderTree } from '@/components/FolderTree'
import { ColorCodedEditor } from '@/components/ColorCodedEditor'
import { VersionDiff } from '@/components/VersionDiff'

interface PromptVersion {
  version: number
  status: 'active' | 'archived'
  createdAt: string
  modifiedAt?: string
  content?: string
  frontmatter?: any
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
  type: 'text' | 'textarea' | 'number' | 'checkbox'
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
  const [selectedPath, setSelectedPath] = useState('')
  
  // Form fields
  const [clientName, setClientName] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [rawPrompt, setRawPrompt] = useState('')
  const [frontmatter, setFrontmatter] = useState<any>({})
  const [dynamicFields, setDynamicFields] = useState<FormField[]>([])
  
  // Standard fields
  const [clientVoice, setClientVoice] = useState('')
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
    client_name: selectedClient || 'client',
    campaign_name: campaignName || 'campaign'
  })
  
  // Available variables for color coding
  const [availableVariables, setAvailableVariables] = useState<Array<{key: string, scope: 'global' | 'client' | 'campaign'}>>([])

  useEffect(() => {
    loadClients()
  }, [])
  
  // Load available variables for color coding
  useEffect(() => {
    if (!selectedClient && !isGlobalRules) {
      setAvailableVariables([])
      return
    }
    
    const loadVariables = async () => {
      try {
        const params = new URLSearchParams({ client: selectedClient || 'global' })
        if (campaignName && !isNewClient) {
          params.append('campaign', campaignName)
        }
        
        const res = await fetch(`/api/legend?${params}`)
        const data = await res.json()
        
        if (data.variables) {
          setAvailableVariables(
            data.variables.map((v: any) => ({
              key: v.key,
              scope: v.scope
            }))
          )
        }
      } catch (err) {
        console.error('Failed to load variables:', err)
      }
    }
    
    loadVariables()
  }, [selectedClient, campaignName, isGlobalRules, isNewClient])

  // Sync form fields with raw prompt
  useEffect(() => {
    if (viewMode === 'form') {
      updateRawFromForm()
    }
  }, [clientVoice, integrationRule, imageBuckets, toneStrength, ctaVariant, bannedWords, audience, rageBaitIntensity, campaignNotes, dynamicFields])

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
      
      let content = `voice: ${clientVoice}\nintegration_rule: ${integrationRule}`
      
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
          setClientVoice(line.substring(7))
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
      
      // Update standard fields from frontmatter
      const frontmatter = fm as any
      if (frontmatter.image_buckets) {
        setImageBuckets(typeof frontmatter.image_buckets === 'object' ? 
          Object.entries(frontmatter.image_buckets).map(([k, v]) => `${k}: ${v}`).join('\n') : 
          frontmatter.image_buckets)
      }
      if (frontmatter.client_voice) setClientVoice(frontmatter.client_voice)
      if (frontmatter.integration_rule) setIntegrationRule(frontmatter.integration_rule)
      if (frontmatter.tone_strength) setToneStrength(frontmatter.tone_strength.toString())
      if (frontmatter.cta_variant) setCtaVariant(frontmatter.cta_variant)
      if (frontmatter.banned_words) setBannedWords(Array.isArray(frontmatter.banned_words) ? frontmatter.banned_words.join(', ') : frontmatter.banned_words)
      if (frontmatter.audience) setAudience(frontmatter.audience)
      if (frontmatter.ragebait_intensity || frontmatter.rage_bait_intensity) {
        setRageBaitIntensity((frontmatter.ragebait_intensity || frontmatter.rage_bait_intensity).toString())
      }
      if (frontmatter.campaign_notes) setCampaignNotes(frontmatter.campaign_notes)
      
      // Generate form fields for any non-standard frontmatter keys
      const standardKeys = ['version', 'status', 'description', 'client_voice', 'integration_rule', 
                           'image_buckets', 'tone_strength', 'cta_variant', 'banned_words', 
                           'audience', 'ragebait_intensity', 'rage_bait_intensity', 'campaign_notes']
      
      const generatedFields: FormField[] = []
      Object.entries(frontmatter).forEach(([key, value]) => {
        if (!standardKeys.includes(key)) {
          // Create dynamic field for custom frontmatter key
          const fieldType = typeof value === 'boolean' ? 'checkbox' : 
                           (typeof value === 'number' ? 'number' : 
                           (Array.isArray(value) || typeof value === 'object' ? 'textarea' : 'text'))
          
          generatedFields.push({
            key: `fm_${key}`,
            label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            value: Array.isArray(value) ? value.join(', ') : 
                   (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)),
            type: fieldType as 'text' | 'textarea' | 'number' | 'checkbox'
          })
        }
      })
      
      // Combine generated fields with parsed sections
      setDynamicFields([...generatedFields, ...sections])
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
      setSelectedPath('global/rules')
      
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
      const res = await fetch(`/api/prompts/load?type=client&client=${clientName}`)
      const data = await res.json()
      
      setSelectedClient(clientName)
      setSelectedType('edit')
      setIsNewClient(true)
      setIsNewCampaign(false)
      setIsGlobalRules(false)
      setClientName(clientName)
      setSelectedPath(`clients/${clientName}/_client`)
      
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
      setSelectedPath(`clients/${clientName}/${campaignName}`)
      
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
        type: isNewClient ? 'client' : 'campaign',
        ...(isNewCampaign && { campaign: campaignName })
      })
      
      const res = await fetch(`/api/prompts/versions?${params}`)
      const data = await res.json()
      
      // Load content for each version for diff view
      const versionsWithContent = await Promise.all(
        (data.versions || []).map(async (v: any) => {
          try {
            const contentRes = await fetch(`/api/prompts/load?type=${isNewCampaign ? 'campaign' : 'client'}&client=${selectedClient}&campaign=${campaignName}&version=${v.version}`)
            const contentData = await contentRes.json()
            return {
              ...v,
              content: contentData.content || '',
              frontmatter: contentData.frontmatter || {}
            }
          } catch {
            return v
          }
        })
      )
      
      setVersions(versionsWithContent)
    } catch (err) {
      console.error('Failed to load versions:', err)
    }
  }

  const loadVersion = async (version: number) => {
    try {
      const fileName = isNewCampaign 
        ? `${campaignName}_v${version}.md`
        : `_client_v${version}.md`
      
      const res = await fetch(`/api/prompts/load?type=${isNewCampaign ? 'campaign' : 'client'}&client=${selectedClient}&campaign=${campaignName}&version=${version}`)
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
          type: isNewClient ? 'client' : 'campaign',
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
      
      // Load client prompt
      if (selectedClient) {
        try {
          const clientRes = await fetch(`/api/prompts/load?type=client&client=${selectedClient}`)
          const clientData = await clientRes.json()
          fullChain += `## Client: ${selectedClient}\n\n`
          fullChain += clientData.content + '\n\n'
        } catch (err) {
          console.log('No client prompt found')
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

      let fm: any = {}
      let content = rawPrompt
      
      if (viewMode === 'form') {
        // Build frontmatter from form fields
        fm = { ...frontmatter }
        
        // Add standard fields
        if (isNewClient) {
          if (clientVoice) fm.client_voice = clientVoice
          if (integrationRule) fm.integration_rule = integrationRule
          if (imageBuckets) {
            const buckets: any = {}
            imageBuckets.split('\n').forEach(line => {
              const [key, value] = line.split(':').map(s => s.trim())
              if (key && value) buckets[key] = value
            })
            if (Object.keys(buckets).length > 0) fm.image_buckets = buckets
          }
          if (toneStrength !== '80') fm.tone_strength = parseInt(toneStrength)
          if (ctaVariant !== 'soft') fm.cta_variant = ctaVariant
          if (bannedWords) fm.banned_words = bannedWords.split(',').map(s => s.trim()).filter(Boolean)
        }
        
        if (isNewCampaign) {
          if (audience) fm.audience = audience
          if (rageBaitIntensity !== '50') fm.ragebait_intensity = parseInt(rageBaitIntensity)
          if (campaignNotes) fm.campaign_notes = campaignNotes
        }
        
        // Add custom frontmatter fields
        dynamicFields.forEach(field => {
          if (field.key.startsWith('fm_')) {
            const key = field.key.substring(3)
            let value: any = field.value
            
            // Convert value based on type
            if (field.type === 'checkbox') {
              value = field.value === 'true'
            } else if (field.type === 'number') {
              value = parseFloat(field.value) || 0
            } else if (field.type === 'textarea' && field.value.includes(',')) {
              // Try to parse as array
              const parts = field.value.split(',').map(s => s.trim()).filter(Boolean)
              if (parts.length > 1) value = parts
            }
            
            fm[key] = value
          }
        })
        
        // Build content from sections
        const sections = dynamicFields.filter(f => f.key.startsWith('section_'))
        content = sections.map(section => `## ${section.label}\n\n${section.value}`).join('\n\n')
        
        // Build the full raw prompt
        setRawPrompt(matter.stringify(content, fm))
      } else {
        // In raw mode, parse the existing frontmatter
        const parsed = matter(rawPrompt)
        fm = parsed.data
        content = parsed.content
      }
      
      // Determine next version number
      let nextVersion = 1
      if (selectedType === 'edit') {
        // Get current versions to find the highest
        const params = new URLSearchParams({
          client: selectedClient,
          type: isNewClient ? 'client' : 'campaign',
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
        : `${selectedClient}/_client_v${nextVersion}.md`

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
        description: `${isNewCampaign ? 'Campaign' : 'Client'} prompt saved as version ${nextVersion}`
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
    setClientVoice('')
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

  const handleNewVersion = async () => {
    try {
      const { data: fm, content } = matter(rawPrompt)
      
      // Determine next version number
      const nextVersion = currentVersion + 1
      
      // Update frontmatter
      fm.version = nextVersion
      fm.status = 'active'
      
      // Save as new version
      const res = await fetch('/api/prompts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: selectedClient,
          campaign: isNewCampaign ? campaignName : undefined,
          version: nextVersion,
          content: matter.stringify(content, fm)
        })
      })
      
      if (!res.ok) throw new Error('Failed to create new version')
      
      toast({
        title: 'New Version Created',
        description: `Version ${nextVersion} is now active`
      })
      
      setCurrentVersion(nextVersion)
      loadVersions()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create new version',
        variant: 'destructive'
      })
    }
  }

  const handleDiff = async (compareVersion: number) => {
    if (compareVersion < 1) return
    
    try {
      const res = await fetch(`/api/prompts/diff?client=${selectedClient}&campaign=${campaignName || ''}&v1=${compareVersion}&v2=${currentVersion}`)
      const data = await res.json()
      
      // Show diff in a dialog
      // For now, just show a toast
      toast({
        title: 'Diff View',
        description: `Comparing v${compareVersion} to v${currentVersion}`
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load diff',
        variant: 'destructive'
      })
    }
  }

  const runLinter = () => {
    const issues: string[] = []
    
    // Check character caps
    const lines = rawPrompt.split('\n')
    lines.forEach((line, idx) => {
      if (line.length > 120 && !line.startsWith('#')) {
        issues.push(`Line ${idx + 1}: Exceeds 120 characters`)
      }
    })
    
    // Check for missing hashtags
    if (!rawPrompt.includes('#')) {
      issues.push('Missing section headers (use # or ##)')
    }
    
    // Check for banned words
    const bannedList = bannedWords.split(',').map(w => w.trim()).filter(Boolean)
    bannedList.forEach(word => {
      if (rawPrompt.toLowerCase().includes(word.toLowerCase())) {
        issues.push(`Contains banned word: "${word}"`)
      }
    })
    
    if (issues.length === 0) {
      toast({
        title: 'Linter Results',
        description: 'No issues found!'
      })
    } else {
      toast({
        title: 'Linter Results',
        description: `Found ${issues.length} issues`,
        variant: 'destructive'
      })
    }
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
        <FolderTree
          selectedPath={selectedPath}
          onSelect={(path, type, metadata) => {
            if (type === 'global') {
              handleEditGlobalRules()
            } else if (type === 'client' && metadata?.clientName) {
              handleEditClient(metadata.clientName)
            } else if (type === 'campaign' && metadata?.clientName && metadata?.campaignName) {
              handleEditCampaign(metadata.clientName, metadata.campaignName)
            }
          }}
          onNewClient={() => {
            resetForm()
            setIsNewClient(true)
          }}
          onNewCampaign={(clientName) => {
            resetForm()
            setSelectedClient(clientName)
            setIsNewCampaign(true)
          }}
          onRefresh={loadClients}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Prompt Management</h1>
            <p className="text-muted-foreground">
              Create and manage client voices and campaign prompts
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
                        {selectedType === 'edit' ? 'Edit' : 'Create New'} {isGlobalRules ? 'Global Rules' : isNewClient ? 'Client/Client' : 'Campaign'}
                      </CardTitle>
                      <CardDescription>
                        {isGlobalRules 
                          ? 'Editing: prompts/global/rules_v1.md'
                          : selectedType === 'edit' 
                          ? `Editing: clients/${isNewClient ? clientName : selectedClient}/${isNewClient ? '_client' : campaignName}_v${currentVersion}.md`
                          : `Creating: clients/${isNewClient ? clientName : selectedClient}/${isNewClient ? '_client' : campaignName}_v1.md`}
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
                      {/* Quick Actions Toolbar */}
                      <div className="flex items-center gap-1 border-r pr-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleNewVersion}
                          title="New version (↗)"
                          className="h-8 w-8 p-0"
                        >
                          <span className="text-lg">↗</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDiff(currentVersion - 1)}
                          disabled={currentVersion <= 1}
                          title="Diff against v-1 (Δ)"
                          className="h-8 w-8 p-0"
                        >
                          <span className="text-lg">Δ</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={runLinter}
                          title="Linter (⚠)"
                          className="h-8 w-8 p-0"
                        >
                          <span className="text-lg">⚠</span>
                        </Button>
                      </div>
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
                            <Label htmlFor="client-voice">Client Voice</Label>
                            <Textarea
                              id="client-voice"
                              placeholder="e.g., playful health advocate"
                              value={clientVoice}
                              onChange={(e) => setClientVoice(e.target.value)}
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
                              <Label className="font-medium">
                                {field.key.startsWith('fm_') ? field.label : (
                                  <Input
                                    value={field.label}
                                    onChange={(e) => updateDynamicField(field.key, { label: e.target.value })}
                                    placeholder="Section Title"
                                    className="font-medium"
                                  />
                                )}
                              </Label>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeDynamicField(field.key)}
                              >
                                ×
                              </Button>
                            </div>
                            {field.type === 'textarea' ? (
                              <Textarea
                                value={field.value}
                                onChange={(e) => updateDynamicField(field.key, { value: e.target.value })}
                                placeholder={field.key.startsWith('fm_') ? `Enter ${field.label.toLowerCase()}...` : "Section content..."}
                                rows={3}
                              />
                            ) : field.type === 'checkbox' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value === 'true'}
                                  onChange={(e) => updateDynamicField(field.key, { value: e.target.checked.toString() })}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm text-muted-foreground">Enable {field.label}</span>
                              </div>
                            ) : field.type === 'number' ? (
                              <Input
                                type="number"
                                value={field.value}
                                onChange={(e) => updateDynamicField(field.key, { value: e.target.value })}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                              />
                            ) : (
                              <Input
                                type="text"
                                value={field.value}
                                onChange={(e) => updateDynamicField(field.key, { value: e.target.value })}
                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full">
                      <ColorCodedEditor
                        value={rawPrompt}
                        onChange={(value) => {
                          setRawPrompt(value)
                          parseRawPrompt(value)
                        }}
                        variables={availableVariables}
                        maxLineLength={120}
                        bannedWords={bannedWords.split(',').map(s => s.trim()).filter(Boolean)}
                        className={cn(
                          "resize-none",
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
                      isGlobalRules ? false : isNewClient ? (!clientName || !clientVoice) : (!selectedClient || !campaignName)
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isGlobalRules ? 'Save Global Rules' : selectedType === 'edit' ? 'Save New Version' : 'Create'} {!isGlobalRules && (isNewClient ? 'Client' : 'Campaign')}
                  </Button>
                </CardContent>
              </Card>


              {/* Variable Legend */}
              {(selectedClient || isGlobalRules) && (
                <VariableLegend 
                  client={selectedClient || 'global'}
                  campaign={!isNewClient && campaignName ? campaignName : undefined}
                  onVariableClick={(varName) => {
                    // Jump to first occurrence in editor
                    if (viewMode === 'raw') {
                      // Find the textarea inside ColorCodedEditor
                      const textarea = document.querySelector('.relative textarea') as HTMLTextAreaElement
                      if (textarea) {
                        const text = textarea.value
                        const varPattern = new RegExp(`{{\\s*${varName}\\s*}}`, 'i')
                        const match = text.match(varPattern)
                        if (match && match.index !== undefined) {
                          textarea.focus()
                          textarea.setSelectionRange(match.index, match.index + match[0].length)
                          // Scroll to selection
                          const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
                          const lines = text.substring(0, match.index).split('\n').length
                          textarea.scrollTop = (lines - 5) * lineHeight
                        }
                      }
                    }
                  }}
                />
              )}

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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowFullChain(!showFullChain)
                              if (!showFullChain) loadFullPromptChain()
                            }}
                          >
                            <Link className="h-3 w-3 mr-1" />
                            {showFullChain ? 'Hide' : 'Show'} Full Chain
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(previewContent)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg max-h-[400px] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">{showFullChain ? fullPromptChain : previewContent}</pre>
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and compare different versions of this prompt
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="list" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Version List</TabsTrigger>
              <TabsTrigger value="diff">Compare Versions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-2 max-h-[60vh] overflow-y-auto">
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
                        {version.modifiedAt && version.modifiedAt !== version.createdAt && (
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
            </TabsContent>
            
            <TabsContent value="diff">
              {versions.length >= 2 ? (
                <VersionDiff 
                  versions={versions.map(v => ({
                    ...v,
                    content: v.content || '',
                    frontmatter: v.frontmatter || {}
                  }))}
                  currentVersion={currentVersion}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Need at least 2 versions to compare
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}