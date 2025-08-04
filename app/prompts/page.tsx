'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Save, FolderOpen, FileText, Clock, CheckCircle2, ChevronRight, Edit, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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

export default function PromptsPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientData[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [selectedType, setSelectedType] = useState<'new' | 'edit'>('new')
  const [isNewClient, setIsNewClient] = useState(false)
  const [isNewCampaign, setIsNewCampaign] = useState(false)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  
  // Form fields
  const [clientName, setClientName] = useState('')
  const [campaignName, setCampaignName] = useState('')
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

  useEffect(() => {
    loadClients()
  }, [])

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

  const handleEditClient = async (clientName: string) => {
    try {
      const res = await fetch(`/api/prompts/load?type=brand&client=${clientName}`)
      const data = await res.json()
      
      setSelectedClient(clientName)
      setSelectedType('edit')
      setIsNewClient(true)
      setIsNewCampaign(false)
      setClientName(clientName)
      
      // Parse the content and frontmatter
      setBrandVoice(data.content.match(/voice: (.+)/)?.[1] || '')
      setIntegrationRule(data.content.match(/integration_rule: (.+)/)?.[1] || '')
      setImageBuckets(data.frontmatter.image_buckets || '')
      setToneStrength(data.frontmatter.tone_strength?.toString() || '80')
      setCtaVariant(data.frontmatter.cta_variant || 'soft')
      setBannedWords(data.frontmatter.banned_words?.join(', ') || '')
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
      setCampaignName(campaignName)
      
      // Parse the campaign data
      setAudience(data.frontmatter.audience || '')
      setRageBaitIntensity(data.frontmatter.rage_bait_intensity?.toString() || '50')
      setCampaignNotes(data.content)
    } catch (err) {
      console.error('Failed to load campaign:', err)
    }
  }

  const handleSave = async () => {
    try {
      const fileName = isNewCampaign 
        ? `${selectedClient}/${campaignName}_v${selectedType === 'edit' ? '2' : '1'}.md`
        : `${selectedClient}/_brand_v${selectedType === 'edit' ? '2' : '1'}.md`

      const frontmatter = isNewCampaign ? {
        version: selectedType === 'edit' ? 2 : 1,
        status: 'active',
        audience,
        rage_bait_intensity: parseInt(rageBaitIntensity),
        notes: campaignNotes
      } : {
        version: selectedType === 'edit' ? 2 : 1,
        status: 'active',
        image_buckets: imageBuckets,
        tone_strength: parseInt(toneStrength),
        cta_variant: ctaVariant,
        banned_words: bannedWords.split(',').map(w => w.trim())
      }

      const content = isNewCampaign 
        ? campaignNotes
        : `voice: ${brandVoice}\nintegration_rule: ${integrationRule}`

      await fetch('/api/prompts/save-structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: fileName,
          frontmatter,
          content
        })
      })

      toast({
        title: 'Saved',
        description: `${isNewCampaign ? 'Campaign' : 'Brand'} prompt saved successfully`
      })

      loadClients()
      resetForm()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save prompt',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setIsNewClient(false)
    setIsNewCampaign(false)
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
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10 overflow-y-auto">
        <div className="p-4">
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Prompt Management</h1>
            <p className="text-muted-foreground">
              Create and manage brand voices and campaign prompts
            </p>
          </div>

          {/* Client/Brand Form */}
          {isNewClient && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedType === 'edit' ? 'Edit' : 'Create New'} Client/Brand
                </CardTitle>
                <CardDescription>
                  {selectedType === 'edit' 
                    ? `Editing: clients/${clientName}/_brand_v2.md`
                    : `This will create a new folder at: clients/${clientName}/_brand_v1.md`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Use lowercase, no spaces (will be converted automatically)
                  </p>
                </div>

                <div>
                  <Label htmlFor="brand-voice">Brand Voice</Label>
                  <Textarea
                    id="brand-voice"
                    placeholder="e.g., betrayed patient, fiery"
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Define image bucket paths for each slide type
                  </p>
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Comma-separated list of words to avoid
                  </p>
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

                <Button 
                  onClick={handleSave} 
                  disabled={!clientName || !brandVoice}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {selectedType === 'edit' ? 'Update' : 'Create'} Client
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Campaign Form */}
          {isNewCampaign && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedType === 'edit' ? 'Edit' : 'Create New'} Campaign
                </CardTitle>
                <CardDescription>
                  {selectedType === 'edit'
                    ? `Editing: clients/${selectedClient}/${campaignName}_v2.md`
                    : `This will create: clients/${selectedClient}/${campaignName}_v1.md`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., older, yoga, supernatural"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    disabled={selectedType === 'edit'}
                  />
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., 60-75yo"
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
                    placeholder="e.g., emphasise medical ageism in slides 2-3"
                    value={campaignNotes}
                    onChange={(e) => setCampaignNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={!selectedClient || !campaignName}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {selectedType === 'edit' ? 'Update' : 'Create'} Campaign
                </Button>
              </CardContent>
            </Card>
          )}

          {!isNewClient && !isNewCampaign && (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                Select a client or campaign from the sidebar to edit, or create a new one
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}