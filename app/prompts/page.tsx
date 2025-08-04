'use client'

import { useState, useEffect } from 'react'
import { PromptTree } from '@/components/PromptTree'
import { CodeEditor } from '@/components/CodeEditor'
import { VersionHistory } from '@/components/VersionHistory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

interface PromptFile {
  type: 'brand' | 'campaign'
  brand: string
  campaign?: string
  content: string
  metadata: {
    name: string
    [key: string]: any
  }
}

export default function PromptsPage() {
  const [selectedFile, setSelectedFile] = useState<PromptFile | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [treeData, setTreeData] = useState<any[]>([])

  useEffect(() => {
    loadTreeData()
  }, [])

  const loadTreeData = async () => {
    try {
      const res = await fetch('/api/prompts/tree')
      const data = await res.json()
      setTreeData(data.tree)
    } catch (err) {
      console.error('Failed to load prompt tree:', err)
    }
  }

  const handleFileSelect = async (type: string, brand?: string, campaign?: string) => {
    if (type === 'global') {
      // Handle global rules - redirect to global page
      window.location.href = '/global'
      return
    }
    
    if (type === 'template') {
      // Handle template viewing (read-only)
      // TODO: Implement template viewer
      return
    }
    
    if (type === 'brand' || type === 'campaign') {
      try {
        const res = await fetch('/api/prompts/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand, campaign })
        })
        const data = await res.json()
        setSelectedFile(data)
      } catch (err) {
        console.error('Failed to load file:', err)
      }
    }
  }

  const handleSave = async (content: string) => {
    if (!selectedFile) return

    try {
      await fetch('/api/prompts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: selectedFile.brand,
          campaign: selectedFile.campaign,
          content
        })
      })
      // Reload the file to get updated metadata
      handleFileSelect(selectedFile.brand, selectedFile.campaign)
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={25} minSize={20}>
          <Card className="h-full rounded-none border-0 border-r">
            <CardHeader>
              <CardTitle>Prompt Explorer</CardTitle>
            </CardHeader>
            <CardContent>
              <PromptTree
                data={treeData}
                onSelect={handleFileSelect}
                onRefresh={loadTreeData}
              />
            </CardContent>
          </Card>
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={showVersions ? 50 : 75}>
          {selectedFile ? (
            <CodeEditor
              content={selectedFile.content}
              metadata={selectedFile.metadata}
              onSave={handleSave}
              onToggleVersions={() => setShowVersions(!showVersions)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a prompt file to edit
            </div>
          )}
        </ResizablePanel>
        
        {showVersions && selectedFile && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={25}>
              <VersionHistory
                brand={selectedFile.brand}
                campaign={selectedFile.campaign}
                onClose={() => setShowVersions(false)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}