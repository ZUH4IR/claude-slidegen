'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PromptGraph } from '@/components/PromptGraph'
import { useToast } from '@/hooks/use-toast'

interface ClientData {
  name: string
  campaigns: string[]
}

export default function GraphPage() {
  const { toast } = useToast()
  const [clients, setClients] = useState<ClientData[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const res = await fetch('/api/prompts/clients')
      if (!res.ok) throw new Error('Failed to load clients')
      
      const data = await res.json()
      setClients(data.clients || [])
      
      // Set first client as default
      if (data.clients && data.clients.length > 0) {
        setSelectedClient(data.clients[0].name)
        if (data.clients[0].campaigns.length > 0) {
          setSelectedCampaign(data.clients[0].campaigns[0])
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClientChange = (client: string) => {
    setSelectedClient(client)
    const clientData = clients.find(c => c.name === client)
    if (clientData && clientData.campaigns.length > 0) {
      setSelectedCampaign(clientData.campaigns[0])
    } else {
      setSelectedCampaign('')
    }
  }

  const selectedClientData = clients.find(c => c.name === selectedClient)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Graph Visualization</CardTitle>
          <CardDescription>
            Visualize the flow of prompts from global rules through brand and campaign layers to Claude
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select 
                value={selectedClient} 
                onValueChange={handleClientChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.name} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Campaign (Optional)</Label>
              <Select 
                value={selectedCampaign} 
                onValueChange={setSelectedCampaign}
                disabled={!selectedClient || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign</SelectItem>
                  {selectedClientData?.campaigns.map(campaign => (
                    <SelectItem key={campaign} value={campaign}>
                      {campaign}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-[700px]">
        <CardContent className="h-full p-0">
          {selectedClient && (
            <PromptGraph 
              client={selectedClient} 
              campaign={selectedCampaign === 'none' ? undefined : selectedCampaign || undefined}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Understanding the Graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
            <span><strong>Global Rules:</strong> Universal guidelines and base prompts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
            <span><strong>Brand Module:</strong> Client-specific voice and customizations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
            <span><strong>Campaign Patch:</strong> Campaign-specific overrides and targeting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded" />
            <span><strong>Merge Node:</strong> Combines all layers and processes variables</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded" />
            <span><strong>Claude API:</strong> Final destination with token count and cost</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}