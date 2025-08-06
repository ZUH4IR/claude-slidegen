'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Save, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PromptTreeSimplified } from './PromptTreeSimplified'
import matter from 'gray-matter'

interface EditorState {
  type: 'none' | 'global' | 'client' | 'campaign' | 'template'
  clientName?: string
  campaignName?: string
  templateName?: string
  content: string
  path: string
  isEditing: boolean
}

export default function SimplePromptsPage() {
  const { toast } = useToast()
  const [treeData, setTreeData] = useState<any[]>([])
  const [editorState, setEditorState] = useState<EditorState>({
    type: 'none',
    content: '',
    path: '',
    isEditing: false
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTreeData()
  }, [])

  const loadTreeData = async () => {
    setLoading(true)
    try {
      const treeRes = await fetch('/api/prompts/tree')
      const treeJson = await treeRes.json()
      
      // Transform tree data for PromptTree component
      const transformedTree = []
      
      // Add Universal section
      if (treeJson.global && treeJson.global.length > 0) {
        transformedTree.push({
          name: 'Universal',
          type: 'section',
          children: treeJson.global.map((item: any) => ({
            name: item.name.replace('.md', ''),
            type: 'file',
            hasPrompt: true
          }))
        })
      }
      
      // Add Templates section
      if (treeJson.blueprints && treeJson.blueprints.length > 0) {
        transformedTree.push({
          name: 'Templates', 
          type: 'section',
          children: treeJson.blueprints.map((item: any) => ({
            name: item.name.replace('.md', ''),
            type: 'template',
            hasPrompt: true
          }))
        })
      }
      
      // Add Clients section
      if (treeJson.clients) {
        const clientNodes = Object.entries(treeJson.clients).map(([clientName, clientData]: [string, any]) => ({
          name: clientName,
          type: 'client',
          hasPrompt: clientData.hasClient,
          children: clientData.campaigns?.map((campaign: string) => ({
            name: campaign,
            type: 'campaign',
            hasPrompt: true
          })) || []
        }))
        
        transformedTree.push({
          name: 'Clients',
          type: 'section',
          children: clientNodes
        })
      }
      
      setTreeData(transformedTree)
    } catch (err) {
      console.error('Failed to load tree data:', err)
      toast({
        title: 'Error',
        description: 'Failed to load prompt tree',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (type: string, client?: string, campaign?: string) => {
    setLoading(true)
    try {
      let apiPath = ''
      let displayPath = ''
      let editorType: EditorState['type'] = 'none'
      
      if (type === 'global') {
        apiPath = `/api/prompts/load?type=global&client=global`
        displayPath = 'global/rules'
        editorType = 'global'
      } else if (type === 'template' && client) {
        apiPath = `/api/prompts/load?type=blueprint&blueprint=${client}`
        displayPath = `blueprints/${client}`
        editorType = 'template'
      } else if (type === 'client' && client) {
        apiPath = `/api/prompts/load?type=client&client=${client}`
        displayPath = `clients/${client}/_client`
        editorType = 'client'
      } else if (type === 'campaign' && client && campaign) {
        apiPath = `/api/prompts/load?type=campaign&client=${client}&campaign=${campaign}`
        displayPath = `clients/${client}/${campaign}`
        editorType = 'campaign'
      }

      if (apiPath) {
        const res = await fetch(apiPath)
        if (!res.ok) throw new Error(`Failed to load: ${res.statusText}`)
        
        const data = await res.json()
        
        // Handle different content formats
        let content = data.content || ''
        const frontmatter = data.frontmatter || {}
        
        // If we have frontmatter, combine it with content
        if (Object.keys(frontmatter).length > 0) {
          content = matter.stringify(content, frontmatter)
        }
        
        setEditorState({
          type: editorType,
          clientName: client,
          campaignName: campaign,
          templateName: type === 'template' ? client : undefined,
          content,
          path: displayPath,
          isEditing: true
        })
      }
    } catch (err) {
      console.error('Failed to load content:', err)
      toast({
        title: 'Error',
        description: 'Failed to load content',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editorState.isEditing) return
    
    setSaving(true)
    try {
      let apiPath = ''
      let requestBody: any = {}
      
      if (editorState.type === 'global') {
        apiPath = '/api/prompts/save-structured'
        requestBody = {
          path: 'global/rules_v1.md',
          frontmatter: {},
          content: editorState.content
        }
      } else if (editorState.type === 'template') {
        apiPath = '/api/prompts/save-structured'
        const parsed = matter(editorState.content)
        requestBody = {
          path: `blueprints/${editorState.templateName}.md`,
          frontmatter: parsed.data,
          content: parsed.content
        }
      } else if (editorState.type === 'client' && editorState.clientName) {
        apiPath = '/api/prompts/save-structured'
        const parsed = matter(editorState.content)
        // Increment version for new saves
        const version = (parsed.data.version || 0) + 1
        parsed.data.version = version
        parsed.data.status = 'active'
        
        requestBody = {
          path: `${editorState.clientName}/_client_v${version}.md`,
          frontmatter: parsed.data,
          content: parsed.content
        }
      } else if (editorState.type === 'campaign' && editorState.clientName && editorState.campaignName) {
        apiPath = '/api/prompts/save-structured'
        const parsed = matter(editorState.content)
        // Increment version for new saves
        const version = (parsed.data.version || 0) + 1
        parsed.data.version = version
        parsed.data.status = 'active'
        
        requestBody = {
          path: `${editorState.clientName}/${editorState.campaignName}_v${version}.md`,
          frontmatter: parsed.data,
          content: parsed.content
        }
      }

      if (apiPath) {
        const res = await fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (!res.ok) throw new Error('Save failed')

        toast({
          title: 'Saved',
          description: 'Content saved successfully'
        })
        
        // Refresh tree data
        loadTreeData()
      }
    } catch (err) {
      console.error('Save failed:', err)
      toast({
        title: 'Error',
        description: 'Failed to save content',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const getEditorTitle = () => {
    switch (editorState.type) {
      case 'global':
        return 'Global Rules'
      case 'template':
        return `Template: ${editorState.templateName}`
      case 'client':
        return `Client: ${editorState.clientName}`
      case 'campaign':
        return `Campaign: ${editorState.campaignName} (${editorState.clientName})`
      default:
        return 'Select an item to edit'
    }
  }

  const resetEditor = () => {
    setEditorState({
      type: 'none',
      content: '',
      path: '',
      isEditing: false
    })
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Prompt Tree</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={loadTreeData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <PromptTreeSimplified
            data={treeData}
            onSelect={handleSelect}
            onRefresh={loadTreeData}
          />
        </div>
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

          {editorState.isEditing ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{getEditorTitle()}</CardTitle>
                    <CardDescription>{editorState.path}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={resetEditor}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editorState.content}
                  onChange={(e) => setEditorState(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Enter your content here..."
                />
                
                {editorState.type !== 'global' && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use frontmatter (---) at the top for metadata</li>
                      <li>• Use {{'{variable_name}'}} for template variables</li>
                      <li>• Use ## for section headers</li>
                      <li>• Content will be versioned automatically on save</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  'Select a client, campaign, or template from the sidebar to edit'
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}