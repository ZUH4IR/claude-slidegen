'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Play, Copy, Loader2, Download, ChevronDown, FileSpreadsheet, Eye, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { PromptPreview } from '@/components/PromptPreview'
import { HooksTable, type Hook as HookType } from '@/components/HooksTable'
import { ContentTable, type ContentRow } from '@/components/ContentTable'

interface Config {
  client: string
  campaign: string
  blueprint: string
  rows: number
  hookAppeal: string
  charCap: number
  topic: string
  productSlide: number
  addSelfAwareJoke: boolean
  addBottomText: boolean
  toneStrength?: number
  rageBaitIntensity?: number
}

interface Options {
  clients: string[]
  campaigns: { [client: string]: string[] }
  blueprints: string[]
}



export default function GeneratorPage() {
  const { toast } = useToast()
  const [debugMode, setDebugMode] = useState(false)
  const [config, setConfig] = useState<Config>({
    client: '',
    campaign: '',
    blueprint: '',
    rows: 5,
    hookAppeal: 'drama',
    charCap: 95,
    topic: '',
    productSlide: 5,
    addSelfAwareJoke: false,
    addBottomText: false,
  })
  
  const [options, setOptions] = useState<Options>({
    clients: [],
    campaigns: {},
    blueprints: []
  })
  
  const [loading, setLoading] = useState(false)
  const [hooks, setHooks] = useState<HookType[]>([])
  const [showHooksModal, setShowHooksModal] = useState(false)
  const [showTablePreview, setShowTablePreview] = useState(false)
  const [tableData, setTableData] = useState<ContentRow[]>([])
  const [csvResult, setCsvResult] = useState('')
  const [error, setError] = useState('')
  const [showDebugPreview, setShowDebugPreview] = useState(false)
  const [debugPromptChain, setDebugPromptChain] = useState<any>(null)
  const [recentTopics, setRecentTopics] = useState<string[]>([])
  const [promptLastModified, setPromptLastModified] = useState<string | null>(null)
  const [generationTimestamp, setGenerationTimestamp] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  useEffect(() => {
    loadOptions()
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('generatorConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(prev => ({ ...prev, ...parsed }))
      } catch (err) {
        console.error('Failed to parse saved config:', err)
      }
    }
    
    // Load recent topics
    const savedTopics = localStorage.getItem('recentTopics')
    if (savedTopics) {
      try {
        setRecentTopics(JSON.parse(savedTopics))
      } catch (err) {
        console.error('Failed to parse recent topics:', err)
      }
    }
  }, [])

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (config.client || config.blueprint || config.topic) {
      localStorage.setItem('generatorConfig', JSON.stringify(config))
    }
  }, [config])
  
  // Check if prompts have been modified since last generation
  useEffect(() => {
    const checkStaleState = async () => {
      if (!config.client || !config.campaign) return
      
      try {
        // Check prompt modification time
        const res = await fetch(`/api/prompts/check-modified?client=${config.client}&campaign=${config.campaign}`)
        const data = await res.json()
        
        if (data.lastModified) {
          setPromptLastModified(data.lastModified)
          
          // Load generation timestamp from localStorage
          const genKey = `generation_${config.client}_${config.campaign}`
          const lastGen = localStorage.getItem(genKey)
          
          if (lastGen) {
            setGenerationTimestamp(lastGen)
            // Check if prompts were modified after last generation
            const isStaleNow = new Date(data.lastModified) > new Date(lastGen)
            setIsStale(isStaleNow)
          } else {
            setIsStale(false) // No previous generation
          }
        }
      } catch (err) {
        console.error('Failed to check prompt modification:', err)
      }
    }
    
    checkStaleState()
  }, [config.client, config.campaign])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to generate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!loading && config.client && config.blueprint && config.topic) {
          // Trigger button click instead of calling function directly
          const generateButton = document.querySelector('[data-generate-button]') as HTMLButtonElement
          if (generateButton) generateButton.click()
        }
      }
      
      // Cmd/Ctrl + D for debug preview
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && debugMode) {
        e.preventDefault()
        if (!loading && config.client && config.blueprint && config.topic) {
          // Trigger button click instead of calling function directly
          const previewButton = document.querySelector('[data-preview-button]') as HTMLButtonElement
          if (previewButton) previewButton.click()
        }
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        if (showHooksModal) setShowHooksModal(false)
        if (showTablePreview) setShowTablePreview(false)
        if (showDebugPreview) setShowDebugPreview(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config.client, config.blueprint, config.topic, loading, debugMode, showHooksModal, showTablePreview, showDebugPreview])

  const loadOptions = async () => {
    try {
      const res = await fetch('/api/generator/options')
      const data = await res.json()
      setOptions(data)
      
      // Set first client as default
      if (data.clients && data.clients.length > 0) {
        const firstClient = data.clients[0]
        const firstCampaign = data.campaigns[firstClient]?.[0] || ''
        setConfig(prev => ({ ...prev, client: firstClient, campaign: firstCampaign }))
      }
    } catch (err) {
      setError('Failed to load options')
    }
  }

  const generateHooks = async () => {
    setLoading(true)
    setError('')
    
    // Save topic to recent topics
    if (config.topic && !recentTopics.includes(config.topic)) {
      const updatedTopics = [config.topic, ...recentTopics.slice(0, 4)]
      setRecentTopics(updatedTopics)
      localStorage.setItem('recentTopics', JSON.stringify(updatedTopics))
    }
    
    try {
      const res = await fetch('/api/generator/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }
      
      const data = await res.json()
      // Convert hooks to the new format with selection state
      const formattedHooks = data.hooks.map((h: string, idx: number) => ({
        id: `hook-${idx}`,
        text: h,
        selected: true,
        edited: h
      }))
      setHooks(formattedHooks)
      setShowHooksModal(true)
      
      // Save generation timestamp
      const genKey = `generation_${config.client}_${config.campaign}`
      const timestamp = new Date().toISOString()
      localStorage.setItem(genKey, timestamp)
      setGenerationTimestamp(timestamp)
      setIsStale(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hooks')
    } finally {
      setLoading(false)
    }
  }


  const handleGenerateSlides = async (selectedHooks: HookType[]) => {
    try {
      const hookTexts = selectedHooks.map(h => h.edited || h.text)
      
      setLoading(true)
      const res = await fetch('/api/generator/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          hooks: hookTexts
        })
      })
      
      if (!res.ok) {
        throw new Error('Failed to generate content')
      }
      
      const data = await res.json()
      const csv = data.csv
      
      // Parse CSV into table data
      const rows = csv.split('\n').filter((row: string) => row.trim())
      const parsedData: ContentRow[] = []
      
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        // Parse CSV row handling quoted values
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        if (matches && matches.length >= 6) {
          const cleanedMatches = matches.map((field: string) => field.replace(/^"|"$/g, ''))
          parsedData.push({
            hook: cleanedMatches[0],
            slides: cleanedMatches.slice(1, 6)
          })
        }
      }
      
      setTableData(parsedData)
      setCsvResult(csv)
      setShowHooksModal(false)
      setShowTablePreview(true)
      
      toast({
        title: 'Content Generated',
        description: 'Review and edit your slides before exporting',
      })
    } catch (err) {
      setError('Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    const csv = generateCSVFromTable()
    navigator.clipboard.writeText(csv)
    toast({
      title: 'Copied',
      description: 'CSV copied to clipboard',
    })
  }

  const downloadCSV = () => {
    const csv = generateCSVFromTable()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${config.client}_${config.campaign || 'slides'}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  const generateCSVFromTable = () => {
    // Create CSV from table data
    const header = 'Hook,Slide 1,Slide 2,Slide 3,Slide 4,Slide 5'
    const rows = tableData.map(row => {
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
    
    const csv = [header, ...rows].join('\n')
    setCsvResult(csv)
    return csv
  }

  const exportToExcel = () => {
    // Create HTML table from table data
    let html = '<html><head><meta charset="utf-8"></head><body><table border="1">'
    
    // Header row
    html += '<tr>'
    html += '<th style="background-color:#f0f0f0;font-weight:bold;padding:8px">Hook</th>'
    for (let i = 1; i <= 5; i++) {
      html += `<th style="background-color:#f0f0f0;font-weight:bold;padding:8px">Slide ${i}</th>`
    }
    html += '</tr>'
    
    // Data rows
    tableData.forEach(row => {
      html += '<tr>'
      html += `<td style="padding:8px">${row.hook}</td>`
      row.slides.forEach(slide => {
        html += `<td style="padding:8px">${slide}</td>`
      })
      html += '</tr>'
    })
    
    html += '</table></body></html>'

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${config.client}_${config.campaign || 'slides'}_${new Date().toISOString().split('T')[0]}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loadDebugCSV = async () => {
    try {
      const res = await fetch('/api/debug-csv')
      if (!res.ok) throw new Error('Failed to load debug CSV')
      
      const data = await res.json()
      const csv = data.csv
      
      // Parse the complex CSV structure
      const rows = csv.split('\n').filter((row: string) => row.trim())
      const parsedData: ContentRow[] = []
      
      // Skip header row
      for (let i = 1; i < rows.length && i <= 6; i++) { // Limit to first 5 rows for display
        const row = rows[i]
        // Parse CSV row handling quoted values
        const columns = row.split(',').map((col: string) => col.trim())
        
        // Extract hook and slides from the complex structure
        // Assuming: hook_top_text (col 2), slide2_top_text (col 5), slide3_top_text (col 8), slide4_top_text (col 11), slide5_top_text (col 14)
        if (columns.length >= 15) {
          parsedData.push({
            hook: columns[2], // hook_top_text
            slides: [
              columns[2], // Slide 1 is same as hook
              columns[5], // slide2_top_text
              columns[8], // slide3_top_text
              columns[11], // slide4_top_text
              columns[14]  // slide5_top_text
            ]
          })
        }
      }
      
      setTableData(parsedData)
      setShowTablePreview(true)
      setCsvResult(csv)
      
      toast({
        title: 'Debug CSV Loaded',
        description: 'Showing first 5 rows from the example CSV',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load debug CSV',
        variant: 'destructive'
      })
    }
  }

  const availableCampaigns = config.client ? options.campaigns[config.client] || [] : []

  const previewPromptChain = async () => {
    if (!config.client || !config.blueprint || !config.topic) {
      toast({
        title: 'Missing Configuration',
        description: 'Please fill in all required fields first',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/generator/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!res.ok) {
        throw new Error('Failed to generate preview')
      }

      const data = await res.json()
      setDebugPromptChain(data)
      setShowDebugPreview(true)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to generate preview',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Generate Copy</h1>
          <p className="text-muted-foreground">Configure and generate TikTok-style copy</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Keyboard shortcuts help */}
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ Enter</kbd>
            <span>Generate</span>
            {debugMode && (
              <>
                <span className="mx-2">•</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ D</kbd>
                <span>Preview</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="debug-mode" className="text-sm">Debug Mode</Label>
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={setDebugMode}
            />
          </div>
        </div>
      </div>

      {/* Config Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={config.client}
                  onValueChange={(value) => {
                    const firstCampaign = options.campaigns[value]?.[0] || ''
                    setConfig({ ...config, client: value, campaign: firstCampaign })
                  }}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.clients.map(client => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blueprint">Blueprint</Label>
                <Select
                  value={config.blueprint}
                  onValueChange={(value) => {
                    // Smart defaults based on blueprint
                    const updates: Partial<Config> = { blueprint: value }
                    
                    // Set smart defaults based on blueprint type
                    if (value.toLowerCase().includes('story')) {
                      updates.hookAppeal = 'drama'
                      updates.charCap = 85
                    } else if (value.toLowerCase().includes('fact') || value.toLowerCase().includes('list')) {
                      updates.hookAppeal = 'curiosity'
                      updates.charCap = 95
                    } else if (value.toLowerCase().includes('meme') || value.toLowerCase().includes('joke')) {
                      updates.hookAppeal = 'humor'
                      updates.charCap = 70
                      updates.addSelfAwareJoke = true
                    } else if (value.toLowerCase().includes('contro')) {
                      updates.hookAppeal = 'controversy'
                      updates.charCap = 80
                    }
                    
                    setConfig({ ...config, ...updates })
                    toast({
                      title: 'Blueprint Selected',
                      description: `Applied smart defaults for ${value}`,
                    })
                  }}
                >
                  <SelectTrigger id="blueprint">
                    <SelectValue placeholder="Select blueprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.blueprints.map(bp => (
                      <SelectItem key={bp} value={bp}>{bp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hook-appeal">Hook Appeal</Label>
                <Select
                  value={config.hookAppeal}
                  onValueChange={(value) => setConfig({ ...config, hookAppeal: value })}
                >
                  <SelectTrigger id="hook-appeal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="curiosity">Curiosity</SelectItem>
                    <SelectItem value="humor">Humor</SelectItem>
                    <SelectItem value="controversy">Controversy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Smart suggestion for mismatched settings */}
            {config.blueprint && config.hookAppeal && (
              (() => {
                const blueprint = config.blueprint.toLowerCase()
                const mismatch = 
                  (blueprint.includes('story') && config.hookAppeal !== 'drama') ||
                  (blueprint.includes('fact') && config.hookAppeal !== 'curiosity') ||
                  (blueprint.includes('joke') && config.hookAppeal !== 'humor')
                
                return mismatch ? (
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs">
                      💡 Tip: {config.blueprint} blueprints typically work best with{' '}
                      {blueprint.includes('story') ? 'Drama' :
                       blueprint.includes('fact') ? 'Curiosity' :
                       blueprint.includes('joke') ? 'Humor' : 'different'} hooks
                    </AlertDescription>
                  </Alert>
                ) : null
              })()
            )}

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select
                  value={config.campaign || 'none'}
                  onValueChange={(value) => setConfig({ ...config, campaign: value === 'none' ? '' : value })}
                  disabled={!config.client}
                >
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder={availableCampaigns.length ? "Select campaign" : "No campaigns available"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableCampaigns.map(camp => (
                      <SelectItem key={camp} value={camp}>{camp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rows">Number of Hooks</Label>
                <Input
                  id="rows"
                  type="number"
                  min={1}
                  max={20}
                  value={config.rows}
                  onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="char-cap">Character Cap: {config.charCap}</Label>
                <Slider
                  id="char-cap"
                  min={40}
                  max={120}
                  step={5}
                  value={[config.charCap]}
                  onValueChange={(value) => setConfig({ ...config, charCap: value[0] })}
                />
              </div>
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="topic">Topic</Label>
              <span className="text-sm text-muted-foreground">
                {config.topic.length} / {config.charCap} characters
                {config.topic.length > config.charCap && (
                  <span className="text-destructive ml-2">(over limit)</span>
                )}
              </span>
            </div>
            <div className="relative">
              <Textarea
                id="topic"
                placeholder="Enter your topic..."
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                className={`min-h-[100px] ${config.topic.length > config.charCap ? 'border-destructive' : ''}`}
              />
              {recentTopics.length > 0 && !config.topic && (
                <div className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-md z-10">
                  <div className="p-2 text-xs text-muted-foreground">Recent topics:</div>
                  {recentTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      onClick={() => setConfig({ ...config, topic })}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {config.topic.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Preview: "{config.topic.slice(0, config.charCap)}{config.topic.length > config.charCap ? '...' : ''}"
                </p>
                {config.topic.length > config.charCap && config.charCap < 120 && (
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs flex items-center justify-between">
                      <span>Your topic is getting cut off.</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfig({ ...config, charCap: Math.min(120, config.topic.length + 10) })}
                      >
                        Increase limit to {Math.min(120, config.topic.length + 10)}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          {/* Advanced Options */}
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Options</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Product Slide</Label>
                  <RadioGroup
                    value={config.productSlide.toString()}
                    onValueChange={(value) => setConfig({ ...config, productSlide: parseInt(value) })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id="slide-4" />
                      <Label htmlFor="slide-4">Slide 4</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id="slide-5" />
                      <Label htmlFor="slide-5">Slide 5</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="self-aware"
                    checked={config.addSelfAwareJoke}
                    onCheckedChange={(checked) => setConfig({ ...config, addSelfAwareJoke: checked })}
                  />
                  <Label htmlFor="self-aware">Add Self-Aware Joke</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="bottom-text"
                    checked={config.addBottomText}
                    onCheckedChange={(checked) => setConfig({ ...config, addBottomText: checked })}
                  />
                  <Label htmlFor="bottom-text">Generate Hooks with Bottom Text</Label>
                </div>

                {config.client && (
                  <div className="space-y-2">
                    <Label>Tone Strength: {config.toneStrength || 80}%</Label>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[config.toneStrength || 80]}
                      onValueChange={(value) => setConfig({ ...config, toneStrength: value[0] })}
                    />
                  </div>
                )}

                {config.campaign && (
                  <div className="space-y-2">
                    <Label>Rage Bait Intensity: {config.rageBaitIntensity || 50}%</Label>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[config.rageBaitIntensity || 50]}
                      onValueChange={(value) => setConfig({ ...config, rageBaitIntensity: value[0] })}
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <div className="flex flex-1 items-center gap-3">
              {config.addBottomText && (
                <div className="text-sm text-muted-foreground">
                  Hooks will include bottom text format
                </div>
              )}
              {isStale && (
                <Alert className="flex-1 py-2 px-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Prompts have been updated since last generation
                    {generationTimestamp && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (last: {new Date(generationTimestamp).toLocaleTimeString()})
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            {debugMode && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={loadDebugCSV}
                >
                  Load Example CSV
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={previewPromptChain}
                  disabled={loading || !config.client || !config.blueprint || !config.topic}
                  title="Preview prompt chain (⌘/Ctrl+D)"
                  data-preview-button
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Prompt Chain
                </Button>
              </>
            )}
            <Button
              size="lg"
              onClick={generateHooks}
              disabled={loading || !config.client || !config.blueprint || !config.topic}
              title="Generate hooks (⌘/Ctrl+Enter)"
              data-generate-button
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generate Hooks
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table Preview Sheet */}
      <Sheet open={showTablePreview} onOpenChange={setShowTablePreview}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] p-0 flex flex-col"
        >
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Generated Content</SheetTitle>
            <SheetDescription>Edit any cell and your changes will be included in the export</SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <ContentTable
              data={tableData}
              onDataChange={setTableData}
              onExport={(format) => format === 'csv' ? downloadCSV() : exportToExcel()}
              onCopy={copyToClipboard}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Hooks Modal */}
      <Dialog open={showHooksModal} onOpenChange={setShowHooksModal}>
        <DialogContent className="max-w-screen-xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Review and Select Hooks</DialogTitle>
            <p className="text-muted-foreground mt-2">
              Select the hooks you want to use. You can edit them before generating slides.
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <HooksTable
              hooks={hooks}
              onHooksChange={setHooks}
              mode="edit"
              onGenerateSlides={handleGenerateSlides}
            />
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowHooksModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleGenerateSlides(hooks.filter(h => h.selected))}
              disabled={hooks.filter(h => h.selected).length === 0 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Slides...
                </>
              ) : (
                'Generate Slides for Selected Hooks'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Debug Preview Dialog */}
      <Dialog open={showDebugPreview} onOpenChange={setShowDebugPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debug Preview - Prompt Chain</DialogTitle>
          </DialogHeader>
          {debugPromptChain && (
            <PromptPreview
              globalContent={debugPromptChain.globalPrompt}
              clientContent={debugPromptChain.clientPrompt}
              campaignContent={debugPromptChain.campaignPrompt}
              mergedContent={debugPromptChain.fullPrompt}
              blueprint={debugPromptChain.blueprint}
              config={config}
              mode="full"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDebugPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}