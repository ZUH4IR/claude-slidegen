'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FolderOpen, FileText, Plus, RefreshCw, Globe, FileCode2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TreeNode {
  name: string
  type: 'section' | 'brand' | 'campaign' | 'file' | 'template'
  children?: TreeNode[]
  hasPrompt?: boolean
}

interface PromptTreeProps {
  data: TreeNode[]
  onSelect: (type: string, brand?: string, campaign?: string) => void
  onRefresh: () => void
}

export function PromptTree({ data, onSelect, onRefresh }: PromptTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Universal', 'Templates', 'Clients']))
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createType, setCreateType] = useState<'brand' | 'campaign'>('brand')
  const [createName, setCreateName] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
  }

  const handleCreate = async () => {
    try {
      await fetch('/api/prompts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: createType,
          name: createName,
          brand: createType === 'campaign' ? selectedBrand : undefined
        })
      })
      
      setShowCreateDialog(false)
      setCreateName('')
      onRefresh()
    } catch (err) {
      console.error('Failed to create:', err)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'section':
        return null
      case 'file':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'template':
        return <FileCode2 className="h-4 w-4 text-purple-500" />
      case 'brand':
        return <FolderOpen className="h-4 w-4 text-blue-500" />
      case 'campaign':
        return <FolderOpen className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getSectionIcon = (name: string) => {
    switch (name) {
      case 'Universal':
        return <Globe className="h-4 w-4 text-gray-600" />
      case 'Templates':
        return <FileCode2 className="h-4 w-4 text-purple-600" />
      case 'Clients':
        return <Users className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const renderNode = (node: TreeNode, path: string = '', level: number = 0) => {
    const fullPath = path ? `${path}/${node.name}` : node.name
    const isExpanded = expanded.has(fullPath)
    const hasChildren = node.children && node.children.length > 0

    if (node.type === 'section') {
      return (
        <div key={fullPath} className="mb-4">
          <div
            className="flex items-center gap-2 py-1.5 px-2 font-semibold text-sm uppercase tracking-wider text-muted-foreground hover:bg-accent rounded cursor-pointer"
            onClick={() => hasChildren && toggleExpand(fullPath)}
          >
            {hasChildren && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
            {!hasChildren && <div className="w-4" />}
            {getSectionIcon(node.name)}
            <span>{node.name}</span>
          </div>
          {isExpanded && hasChildren && (
            <div className="ml-2 mt-1">
              {node.children!.map(child => renderNode(child, fullPath, level + 1))}
            </div>
          )}
        </div>
      )
    }

    if (node.type === 'file') {
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer ml-6"
            onClick={() => onSelect('global')}
          >
            {getIcon(node.type)}
            <span>{node.name}</span>
          </div>
        </div>
      )
    }

    if (node.type === 'template') {
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer ml-6"
            onClick={() => onSelect('template', node.name)}
          >
            {getIcon(node.type)}
            <span>{node.name}</span>
          </div>
        </div>
      )
    }

    if (node.type === 'brand') {
      const clientsPath = path.split('/')[0] === 'Clients' ? path.split('/').slice(1).join('/') : ''
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer ml-6"
            onClick={() => toggleExpand(fullPath)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {getIcon(node.type)}
            <span className="flex-1">{node.name}</span>
          </div>
          {isExpanded && (
            <div className="ml-4">
              {node.hasPrompt && (
                <div
                  className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer"
                  onClick={() => onSelect('brand', node.name)}
                >
                  <FileText className="h-4 w-4 text-green-500 ml-6" />
                  <span>Brand Prompt</span>
                </div>
              )}
              {node.children?.map(child => renderNode(child, fullPath, level + 1))}
            </div>
          )}
        </div>
      )
    }

    if (node.type === 'campaign') {
      const pathParts = path.split('/')
      const brand = pathParts[pathParts.length - 1]
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer ml-10"
            onClick={() => node.hasPrompt && onSelect('campaign', brand, node.name)}
          >
            {getIcon(node.type)}
            <span className="flex-1">{node.name}</span>
          </div>
        </div>
      )
    }

    return null
  }

  // Get brands from the Clients section
  const clientsSection = data.find(d => d.name === 'Clients')
  const brands = clientsSection?.children || []

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {data.map(node => renderNode(node))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={createType} onValueChange={(v: 'brand' | 'campaign') => setCreateType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand">Client/Brand</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createType === 'campaign' && (
              <div>
                <label className="text-sm font-medium">Client/Brand</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.name} value={brand.name}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={createType === 'brand' ? 'Client name' : 'Campaign name'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!createName || (createType === 'campaign' && !selectedBrand)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}