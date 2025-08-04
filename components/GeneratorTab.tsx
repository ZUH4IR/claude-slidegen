'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Copy,
  Download,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react'
import { GenerationConfig, GenerationResult } from '@/lib/types'

interface PromptOptions {
  brands: string[]
  campaigns: string[]
  blueprints: string[]
}

export default function GeneratorTab() {
  const [config, setConfig] = useState<GenerationConfig>({
    brandSlug: 'vibit',
    campSlug: 'none',
    blueprint: 'story_6',
    rows: 2,
    persona: 'older',
    hookAppeal: 'drama',
    topic: 'doctor said never run again but i proved him wrong',
    charCapHook: 95,
    addSelfAwareJoke: true,
    productSlide: 5,
  })
  
  const [options, setOptions] = useState<PromptOptions>({
    brands: [],
    campaigns: [],
    blueprints: []
  })
  
  const [hooks, setHooks] = useState<string[]>([])
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'config' | 'hooks' | 'csv'>('config')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/prompts')
      const data = await response.json()
      
      // Extract brands from files
      const brands = new Set<string>()
      const campaigns = new Set<string>()
      const blueprints: string[] = []
      
      data.files.forEach((file: any) => {
        if (file.path.includes('brands/')) {
          const brandName = file.path.split('/')[1].replace('.md', '')
          brands.add(brandName)
        } else if (file.path.includes('campaigns/')) {
          const filename = file.path.split('/').pop() || ''
          const brandName = filename.split('_')[0]
          const campaignName = filename.replace('.md', '')
          brands.add(brandName)
          campaigns.add(campaignName)
        } else if (file.path.includes('clients/')) {
          const brandName = file.path.split('/')[1]
          brands.add(brandName)
        }
      })
      
      // Parse blueprints from YAML file
      const blueprintFile = data.files.find((f: any) => f.path.includes('blueprints'))
      if (blueprintFile) {
        const lines = blueprintFile.content.split('\n')
        lines.forEach((line: string) => {
          if (line.match(/^[a-z_]+_\d+:$/)) {
            blueprints.push(line.replace(':', ''))
          }
        })
      }
      
      setOptions({
        brands: Array.from(brands).sort(),
        campaigns: ['none', ...Array.from(campaigns).sort()],
        blueprints: blueprints
      })
      
      // Update config to use first available brand
      if (Array.from(brands).length > 0 && !brands.has(config.brandSlug)) {
        setConfig({ ...config, brandSlug: Array.from(brands)[0] })
      }
    } catch (err) {
      setError('Failed to load options')
    }
  }

  const generateHooks = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/generate/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setHooks(data.hooks)
      setStep('hooks')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hooks')
    } finally {
      setLoading(false)
    }
  }

  const generateCSV = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/generate/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          hooks
        })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setResult(data)
      setStep('csv')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate CSV')
    } finally {
      setLoading(false)
    }
  }

  const updateHook = (index: number, value: string) => {
    const newHooks = [...hooks]
    newHooks[index] = value
    setHooks(newHooks)
  }

  const addHook = () => {
    setHooks([...hooks, ''])
  }

  const removeHook = (index: number) => {
    setHooks(hooks.filter((_, i) => i !== index))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadCSV = () => {
    if (!result?.csv) return
    
    const blob = new Blob([result.csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slidegen_${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetToConfig = () => {
    setStep('config')
    setHooks([])
    setResult(null)
    setError('')
  }

  if (step === 'config') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select value={config.brandSlug} onValueChange={(value) => setConfig({...config, brandSlug: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select value={config.campSlug} onValueChange={(value) => setConfig({...config, campSlug: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.campaigns.map((campaign) => (
                      <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blueprint">Blueprint</Label>
                <Select value={config.blueprint} onValueChange={(value) => setConfig({...config, blueprint: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blueprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.blueprints.map((blueprint) => (
                      <SelectItem key={blueprint} value={blueprint}>{blueprint}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Textarea
                  id="topic"
                  value={config.topic}
                  onChange={(e) => setConfig({...config, topic: e.target.value})}
                  placeholder="Enter your topic..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona">Persona</Label>
                <Input
                  id="persona"
                  value={config.persona}
                  onChange={(e) => setConfig({...config, persona: e.target.value})}
                  placeholder="Enter persona..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hookAppeal">Hook Appeal</Label>
                <Input
                  id="hookAppeal"
                  value={config.hookAppeal}
                  onChange={(e) => setConfig({...config, hookAppeal: e.target.value})}
                  placeholder="Enter hook appeal..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rows: {config.rows}</Label>
                <Slider
                  value={[config.rows]}
                  onValueChange={(value) => setConfig({...config, rows: value[0]})}
                  max={15}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Hook Character Cap: {config.charCapHook}</Label>
                <Slider
                  value={[config.charCapHook]}
                  onValueChange={(value) => setConfig({...config, charCapHook: value[0]})}
                  max={120}
                  min={40}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Product Slide: {config.productSlide}</Label>
                <Slider
                  value={[config.productSlide]}
                  onValueChange={(value) => setConfig({...config, productSlide: value[0]})}
                  max={6}
                  min={4}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="selfAwareJoke"
                  checked={config.addSelfAwareJoke}
                  onCheckedChange={(checked) => setConfig({...config, addSelfAwareJoke: checked})}
                />
                <Label htmlFor="selfAwareJoke">Add Self-Aware Joke</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={generateHooks} 
            disabled={loading}
            size="lg"
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Hooks'
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'hooks') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Review & Edit Hooks</h2>
          <Button variant="outline" onClick={resetToConfig}>
            Back to Config
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {hooks.map((hook, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="secondary">Hook {index + 1}</Badge>
                                     <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => removeHook(index)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
                <Textarea
                  value={hook}
                  onChange={(e) => updateHook(index, e.target.value)}
                  placeholder="Edit hook..."
                  rows={3}
                />
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addHook} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Hook
          </Button>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={resetToConfig}>
            Back to Config
          </Button>
          <Button 
            onClick={generateCSV} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating CSV...
              </>
            ) : (
              'Generate CSV'
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'csv' && result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Generated CSV</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={resetToConfig}>
              Start Over
            </Button>
            <Button onClick={downloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CSV Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm whitespace-pre-wrap">{result.csv}</pre>
            </div>
                         <div className="flex justify-end mt-4">
               <Button
                 variant="outline"
                 onClick={() => copyToClipboard(result.csv || '')}
               >
                 <Copy className="mr-2 h-4 w-4" />
                 Copy to Clipboard
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}