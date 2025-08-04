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
import { Play, Copy, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Config {
  brand: string
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
  brands: string[]
  campaigns: { [brand: string]: string[] }
  blueprints: string[]
}

export default function GeneratorPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<Config>({
    brand: '',
    campaign: '',
    blueprint: '',
    rows: 2,
    hookAppeal: 'drama',
    charCap: 95,
    topic: '',
    productSlide: 5,
    addSelfAwareJoke: false,
    addBottomText: false,
  })
  
  const [options, setOptions] = useState<Options>({
    brands: [],
    campaigns: {},
    blueprints: []
  })
  
  const [loading, setLoading] = useState(false)
  const [hooks, setHooks] = useState<string[]>([])
  const [editedHooks, setEditedHooks] = useState<string[]>([])
  const [showHooksModal, setShowHooksModal] = useState(false)
  const [csvResult, setCsvResult] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const res = await fetch('/api/generator/options')
      const data = await res.json()
      setOptions(data)
      
      // Set first brand as default
      if (data.brands.length > 0) {
        setConfig(prev => ({ ...prev, brand: data.brands[0] }))
      }
    } catch (err) {
      setError('Failed to load options')
    }
  }

  const generateHooks = async () => {
    setLoading(true)
    setError('')
    
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
      setHooks(data.hooks)
      setEditedHooks(data.hooks)
      setShowHooksModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hooks')
    } finally {
      setLoading(false)
    }
  }

  const approveHooks = async () => {
    try {
      const res = await fetch('/api/generator/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          hooks: editedHooks
        })
      })
      
      const data = await res.json()
      setCsvResult(data.csv)
      setShowHooksModal(false)
      toast({
        title: 'CSV Ready',
        description: 'Your CSV has been generated successfully',
      })
    } catch (err) {
      setError('Failed to generate CSV')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(csvResult)
    toast({
      title: 'Copied',
      description: 'CSV copied to clipboard',
    })
  }

  const availableCampaigns = config.brand ? options.campaigns[config.brand] || [] : []

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Copy</h1>
        <p className="text-muted-foreground">Configure and generate TikTok-style copy</p>
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
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={config.brand}
                  onValueChange={(value) => setConfig({ ...config, brand: value, campaign: '' })}
                >
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blueprint">Blueprint</Label>
                <Select
                  value={config.blueprint}
                  onValueChange={(value) => setConfig({ ...config, blueprint: value })}
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

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select
                  value={config.campaign || 'none'}
                  onValueChange={(value) => setConfig({ ...config, campaign: value === 'none' ? '' : value })}
                  disabled={!config.brand}
                >
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Select campaign" />
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
                <Label htmlFor="rows">Rows</Label>
                <Input
                  id="rows"
                  type="number"
                  min={1}
                  max={15}
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
            <Label htmlFor="topic">Topic</Label>
            <Textarea
              id="topic"
              placeholder="Enter your topic..."
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              className="min-h-[100px]"
            />
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

                {config.brand && (
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
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={generateHooks}
              disabled={loading || !config.brand || !config.blueprint || !config.topic}
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

      {/* CSV Result */}
      {csvResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>CSV Output</CardTitle>
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              {csvResult}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Hooks Modal */}
      <Dialog open={showHooksModal} onOpenChange={setShowHooksModal}>
        <DialogContent className="max-w-screen-lg h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Review and Edit Generated Hooks</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="text-muted-foreground mb-4">
              Review the generated hooks below. You can edit them directly before proceeding to generate the full CSV.
            </p>
            {editedHooks.map((hook, index) => (
              <div key={index} className="space-y-2">
                <Label className="text-sm font-medium">Hook {index + 1}</Label>
                <Textarea
                  value={hook}
                  onChange={(e) => {
                    const updated = [...editedHooks]
                    updated[index] = e.target.value
                    setEditedHooks(updated)
                  }}
                  className="min-h-[80px] resize-none"
                  placeholder={`Enter hook ${index + 1}...`}
                />
              </div>
            ))}
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowHooksModal(false)}>
              Cancel
            </Button>
            <Button onClick={approveHooks}>
              Approve & Generate CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}