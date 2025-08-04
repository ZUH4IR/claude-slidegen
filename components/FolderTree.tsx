'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, FileText, Folder, FolderOpen, Globe, Users, Hash, Plus, RefreshCw, Layout } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TreeNode {
  name: string
  type: 'folder' | 'file'
  path: string
  children?: TreeNode[]
  metadata?: {
    version?: number
    status?: string
    isGlobal?: boolean
    isClient?: boolean
    isCampaign?: boolean
    isBlueprint?: boolean
    clientName?: string
    campaignName?: string
  }
}

interface FolderTreeProps {
  onSelect?: (path: string, type: string, metadata?: any) => void
  selectedPath?: string
  onNewClient?: () => void
  onNewCampaign?: (clientName: string) => void
  onNewGlobalRule?: () => void
  onNewBlueprint?: () => void
  onRefresh?: () => void
}

export function FolderTree({ onSelect, selectedPath, onNewClient, onNewCampaign, onNewGlobalRule, onNewBlueprint, onRefresh }: FolderTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['global', 'clients']))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTree()
  }, [])

  const loadTree = async () => {
    try {
      const res = await fetch('/api/prompts/tree')
      const data = await res.json()
      
      // Transform flat structure to tree
      const treeData: TreeNode[] = [
        {
          name: 'global',
          type: 'folder',
          path: 'global',
          metadata: { isGlobal: true },
          children: data.global || []
        },
        {
          name: 'blueprints',
          type: 'folder',
          path: 'blueprints',
          metadata: { isBlueprint: true },
          children: data.blueprints || []
        },
        {
          name: 'clients',
          type: 'folder',
          path: 'clients',
          children: data.clients ? Object.entries(data.clients).map(([client, campaigns]: [string, any]) => ({
            name: client,
            type: 'folder' as const,
            path: `clients/${client}`,
            metadata: { isClient: true, clientName: client },
            children: [
              {
                name: '_client.md',
                type: 'file' as const,
                path: `clients/${client}/_client`,
                metadata: { isClient: true, version: campaigns._version || 1, clientName: client }
              },
              ...(campaigns.campaigns || []).map((campaign: string) => ({
                name: `${campaign}.md`,
                type: 'file' as const,
                path: `clients/${client}/${campaign}`,
                metadata: { isCampaign: true, clientName: client, campaignName: campaign }
              }))
            ]
          })) : []
        }
      ]
      
      setTree(treeData)
      onRefresh?.()
    } catch (err) {
      console.error('Failed to load tree:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const getIcon = (node: TreeNode) => {
    if (node.type === 'file') {
      return <FileText className="h-4 w-4 text-muted-foreground" />
    }
    
    if (node.metadata?.isGlobal) {
      return <Globe className="h-4 w-4 text-gray-500" />
    }
    
    if (node.metadata?.isBlueprint || node.path === 'blueprints') {
      return <Layout className="h-4 w-4 text-purple-500" />
    }
    
    if (node.path === 'clients') {
      return <Users className="h-4 w-4 text-blue-500" />
    }
    
    const isExpanded = expanded.has(node.path)
    return isExpanded ? 
      <FolderOpen className="h-4 w-4 text-blue-500" /> : 
      <Folder className="h-4 w-4 text-blue-500" />
  }

  const getNodeColor = (node: TreeNode) => {
    if (node.metadata?.isGlobal) return 'text-gray-700'
    if (node.metadata?.isBlueprint) return 'text-purple-700'
    if (node.metadata?.isClient) return 'text-blue-700'
    if (node.metadata?.isCampaign) return 'text-green-700'
    return 'text-foreground'
  }

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expanded.has(node.path)
    const isSelected = selectedPath === node.path
    
    return (
      <div key={node.path}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start h-8 px-2 hover:bg-accent",
            isSelected && "bg-accent",
            getNodeColor(node)
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleExpanded(node.path)
            } else {
              onSelect?.(node.path, node.metadata?.isGlobal ? 'global' : 
                        node.metadata?.isBlueprint ? 'blueprint' :
                        node.metadata?.isClient ? 'client' : 'campaign', node.metadata)
            }
          }}
        >
          {hasChildren && (
            <ChevronRight 
              className={cn(
                "h-3 w-3 mr-1 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          )}
          <span className="mr-2">{getIcon(node)}</span>
          <span className="flex-1 text-left truncate text-sm">
            {node.name.replace('.md', '')}
          </span>
          {node.metadata?.version && (
            <Badge variant="secondary" className="ml-auto h-5 text-xs">
              v{node.metadata.version}
            </Badge>
          )}
        </Button>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
            {node.metadata?.isClient && (
              <div style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }} className="mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full max-w-[200px] h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNewCampaign?.(node.metadata?.clientName || node.name)
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Campaign
                </Button>
              </div>
            )}
            {node.metadata?.isGlobal && node.children?.length === 0 && (
              <div style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }} className="mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full max-w-[200px] h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNewGlobalRule?.()
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Global Rule
                </Button>
              </div>
            )}
            {node.metadata?.isBlueprint && (
              <div style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }} className="mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full max-w-[200px] h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNewBlueprint?.()
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Blueprint
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="p-2">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Prompts</h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLoading(true)
                loadTree()
              }}
              disabled={loading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>
      {tree.map(node => renderNode(node))}
      {tree.find(n => n.name === 'clients') && (
        <div className="mt-2 px-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8"
            onClick={() => onNewClient?.()}
          >
            <Plus className="h-3 w-3 mr-1" />
            New Client
          </Button>
        </div>
      )}
    </div>
  )
}