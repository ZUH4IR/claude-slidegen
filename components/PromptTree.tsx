'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FolderOpen, FileText, Plus, RefreshCw, Globe, FileCode2, Users, MoreVertical, Edit, Trash2, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface TreeNode {
  name: string
  type: 'section' | 'client' | 'campaign' | 'file' | 'template'
  children?: TreeNode[]
  hasPrompt?: boolean
}

interface PromptTreeProps {
  data: TreeNode[]
  onSelect: (type: string, client?: string, campaign?: string) => void
  onRefresh: () => void
}

export function PromptTree({ data, onSelect, onRefresh }: PromptTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Universal', 'Templates', 'Clients']))
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createType, setCreateType] = useState<'client' | 'campaign'>('client')
  const [createName, setCreateName] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{type: string, client?: string, campaign?: string, currentName: string}>()
  const [newName, setNewName] = useState('')
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [versionTarget, setVersionTarget] = useState<{type: string, client?: string, campaign?: string}>()
  const [versions, setVersions] = useState<string[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const { toast } = useToast()

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
          client: createType === 'campaign' ? selectedClient : undefined
        })
      })
      
      setShowCreateDialog(false)
      setCreateName('')
      onRefresh()
    } catch (err) {
      console.error('Failed to create:', err)
    }
  }

  const handleRename = async () => {
    if (!renameTarget || !newName) return
    
    try {
      const response = await fetch('/api/prompts/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: renameTarget.type,
          oldName: renameTarget.currentName,
          newName: newName,
          client: renameTarget.client,
          campaign: renameTarget.campaign
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Renamed to ${newName}`,
        })
        setShowRenameDialog(false)
        setNewName('')
        onRefresh()
      } else {
        const error = await response.text()
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error('Failed to rename:', err)
      toast({
        title: 'Error',
        description: 'Failed to rename',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (type: string, name: string, client?: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    
    try {
      const body: any = { type, name }
      if (client) body.client = client
      if (type === 'template') body.path = `blueprints/${name}.md`
      
      const response = await fetch('/api/prompts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Deleted ${name}`,
        })
        onRefresh()
      } else {
        const error = await response.text()
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error('Failed to delete:', err)
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive'
      })
    }
  }

  const handleVersionChange = async () => {
    if (!versionTarget || !selectedVersion) return
    
    try {
      const response = await fetch('/api/prompts/set-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: versionTarget.type,
          client: versionTarget.client,
          campaign: versionTarget.campaign,
          version: selectedVersion
        })
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Switched to version ${selectedVersion}`,
        })
        setShowVersionDialog(false)
        setSelectedVersion('')
        onRefresh()
      } else {
        const error = await response.text()
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error('Failed to change version:', err)
      toast({
        title: 'Error',
        description: 'Failed to change version',
        variant: 'destructive'
      })
    }
  }

  const openVersionDialog = async (type: string, client?: string, campaign?: string) => {
    try {
      const response = await fetch('/api/prompts/versions?' + new URLSearchParams({
        type,
        ...(client && { client }),
        ...(campaign && { campaign })
      }))
      
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions)
        setSelectedVersion(data.current)
        setVersionTarget({ type, client, campaign })
        setShowVersionDialog(true)
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err)
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
      case 'client':
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
    console.log('Rendering node:', node.name, 'type:', node.type)

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
          >
            <div 
              className="flex items-center gap-2 flex-1"
              onClick={() => onSelect('global', node.name.replace('.md', '').replace('_v1', ''))}
            >
              {getIcon(node.type)}
              <span>{node.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50">
                <DropdownMenuItem onClick={() => openVersionDialog('global', node.name.replace('.md', '').replace('_v1', ''))}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Change Version
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )
    }

    if (node.type === 'template') {
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer ml-6"
          >
            <div 
              className="flex items-center gap-2 flex-1"
              onClick={() => onSelect('template', node.name)}
            >
              {getIcon(node.type)}
              <span>{node.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50">
                <DropdownMenuItem onClick={() => {
                  setRenameTarget({ type: 'template', currentName: node.name })
                  setNewName(node.name)
                  setShowRenameDialog(true)
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete('template', node.name)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )
    }

    if (node.type === 'client') {
      const clientsPath = path.split('/')[0] === 'Clients' ? path.split('/').slice(1).join('/') : ''
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer ml-6"
          >
            <div 
              className="flex items-center gap-2 flex-1"
              onClick={() => hasChildren ? toggleExpand(fullPath) : onSelect('client', node.name)}
            >
              {hasChildren && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
              {!hasChildren && <div className="w-4" />}
              {getIcon(node.type)}
              <span>{node.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50">
                <DropdownMenuItem onClick={() => {
                  setRenameTarget({ type: 'client', currentName: node.name })
                  setNewName(node.name)
                  setShowRenameDialog(true)
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                {node.hasPrompt && (
                  <DropdownMenuItem onClick={() => openVersionDialog('client', node.name)}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Change Version
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete('client', node.name)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isExpanded && hasChildren && (
            <div className="ml-4">
              {node.children?.map(child => renderNode(child, fullPath, level + 1))}
            </div>
          )}
        </div>
      )
    }

    if (node.type === 'campaign') {
      const pathParts = path.split('/')
      const client = pathParts[pathParts.length - 1]
      return (
        <div key={fullPath}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer ml-10"
          >
            <div 
              className="flex items-center gap-2 flex-1"
              onClick={() => onSelect('campaign', client, node.name)}
            >
              {getIcon(node.type)}
              <span>{node.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50">
                <DropdownMenuItem onClick={() => {
                  setRenameTarget({ type: 'campaign', client, campaign: node.name, currentName: node.name })
                  setNewName(node.name)
                  setShowRenameDialog(true)
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                {node.hasPrompt && (
                  <DropdownMenuItem onClick={() => openVersionDialog('campaign', client, node.name)}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Change Version
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete('campaign', node.name, client)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )
    }

    return null
  }

  // Get clients from the Clients section
  const clientsSection = data.find(d => d.name === 'Clients')
  const clients = clientsSection?.children || []

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
              <Select value={createType} onValueChange={(v: 'client' | 'campaign') => setCreateType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createType === 'campaign' && (
              <div>
                <label className="text-sm font-medium">Client</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
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
            )}

            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={createType === 'client' ? 'Client name' : 'Campaign name'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!createName || (createType === 'campaign' && !selectedClient)}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName || newName === renameTarget?.currentName}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Version</label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(version => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVersionChange} disabled={!selectedVersion}>
              Change Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}