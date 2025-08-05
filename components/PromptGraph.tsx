'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  ConnectionMode,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Globe, Users, Target, Zap, DollarSign, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import matter from 'gray-matter'

interface NodeData {
  label: string
  type: 'global' | 'brand' | 'campaign' | 'merge' | 'claude'
  file?: string
  content?: string
  variables?: any
  tokens?: number
  cost?: number
}

// Custom node component
function CustomNode({ data, selected }: NodeProps<NodeData>) {
  const getIcon = () => {
    switch (data.type) {
      case 'global':
        return <Globe className="h-4 w-4" />
      case 'brand':
        return <Users className="h-4 w-4" />
      case 'campaign':
        return <Target className="h-4 w-4" />
      case 'merge':
        return <Zap className="h-4 w-4" />
      case 'claude':
        return <FileText className="h-4 w-4" />
      default:
        return null
    }
  }

  const getNodeColor = () => {
    switch (data.type) {
      case 'global':
        return 'border-gray-300 bg-gray-50'
      case 'brand':
        return 'border-blue-300 bg-blue-50'
      case 'campaign':
        return 'border-green-300 bg-green-50'
      case 'merge':
        return 'border-purple-300 bg-purple-50'
      case 'claude':
        return 'border-orange-300 bg-orange-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <Card className={cn(
      "min-w-[200px] transition-all",
      getNodeColor(),
      selected && "ring-2 ring-primary"
    )}>
      <Handle type="target" position={Position.Top} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {getIcon()}
          <span className="font-medium">{data.label}</span>
        </div>
        {data.file && (
          <p className="text-xs text-muted-foreground">{data.file}</p>
        )}
        {data.tokens && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {data.tokens.toLocaleString()} tokens
            </Badge>
            {data.cost && (
              <Badge variant="secondary" className="text-xs">
                ${data.cost.toFixed(4)}
              </Badge>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </Card>
  )
}

const nodeTypes = {
  custom: CustomNode
}

interface PromptGraphProps {
  client?: string
  campaign?: string
}

export function PromptGraph({ client, campaign }: PromptGraphProps) {
  const { toast } = useToast()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadGraphData = useCallback(async () => {
    if (!client) return

    setLoading(true)
    try {
      // Build nodes
      const newNodes: Node<NodeData>[] = []
      const newEdges: Edge[] = []

      // Global node
      newNodes.push({
        id: 'global',
        type: 'custom',
        position: { x: 250, y: 0 },
        data: {
          label: 'Global Rules',
          type: 'global',
          file: 'global/rules_v1.md'
        }
      })

      // Brand node
      newNodes.push({
        id: 'brand',
        type: 'custom',
        position: { x: 250, y: 150 },
        data: {
          label: `${client} Brand`,
          type: 'brand',
          file: `clients/${client}/_brand_v1.md`
        }
      })

      // Edge from global to brand
      newEdges.push({
        id: 'e-global-brand',
        source: 'global',
        target: 'brand',
        animated: true,
        style: { stroke: '#9ca3af' }
      })

      let mergeY = 300
      let lastNodeId = 'brand'

      // Campaign node if specified
      if (campaign) {
        newNodes.push({
          id: 'campaign',
          type: 'custom',
          position: { x: 250, y: 300 },
          data: {
            label: `${campaign} Campaign`,
            type: 'campaign',
            file: `clients/${client}/${campaign}_v1.md`
          }
        })

        newEdges.push({
          id: 'e-brand-campaign',
          source: 'brand',
          target: 'campaign',
          animated: true,
          style: { stroke: '#9ca3af' }
        })

        lastNodeId = 'campaign'
        mergeY = 450
      }

      // Merge node
      newNodes.push({
        id: 'merge',
        type: 'custom',
        position: { x: 250, y: mergeY },
        data: {
          label: 'Merge & Process',
          type: 'merge',
          tokens: 2500 // Example token count
        }
      })

      newEdges.push({
        id: `e-${lastNodeId}-merge`,
        source: lastNodeId,
        target: 'merge',
        animated: true,
        style: { stroke: '#a855f7' }
      })

      // Claude node
      newNodes.push({
        id: 'claude',
        type: 'custom',
        position: { x: 250, y: mergeY + 150 },
        data: {
          label: 'Claude API',
          type: 'claude',
          tokens: 3500, // Example
          cost: 0.0105 // Example cost
        }
      })

      newEdges.push({
        id: 'e-merge-claude',
        source: 'merge',
        target: 'claude',
        animated: true,
        style: { stroke: '#f97316' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#f97316'
        }
      })

      setNodes(newNodes)
      setEdges(newEdges)

      // Load actual file data for nodes
      for (const node of newNodes) {
        if (node.data.file) {
          try {
            const res = await fetch(`/api/prompts/file?path=${node.data.file}`)
            if (res.ok) {
              const fileData = await res.json()
              const { data: frontmatter, content } = matter(fileData.content)
              
              setNodes(nodes => nodes.map(n => 
                n.id === node.id 
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        content,
                        variables: frontmatter,
                        tokens: Math.floor(content.length / 4) // Rough estimate
                      }
                    }
                  : n
              ))
            }
          } catch (err) {
            console.error(`Failed to load ${node.data.file}:`, err)
          }
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load graph data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [client, campaign, setNodes, setEdges, toast])

  useEffect(() => {
    loadGraphData()
  }, [loadGraphData])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node)
    setSheetOpen(true)
  }, [])

  return (
    <>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] max-w-full">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>{selectedNode?.data.label}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSheetOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          
          {selectedNode && (
            <Tabs defaultValue="content" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="mt-4">
                <div className="space-y-4">
                  {selectedNode.data.file && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{selectedNode.data.file}</span>
                    </div>
                  )}
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <pre className="text-sm whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                      {selectedNode.data.content || 'No content available'}
                    </pre>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="variables" className="mt-4">
                <div className="space-y-4">
                  {selectedNode.data.variables ? (
                    <div className="border rounded-lg p-4">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {JSON.stringify(selectedNode.data.variables, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No variables defined</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="info" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedNode.data.tokens && (
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Tokens</p>
                        <p className="text-2xl font-bold">
                          {selectedNode.data.tokens.toLocaleString()}
                        </p>
                      </Card>
                    )}
                    {selectedNode.data.cost && (
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Cost</p>
                        <p className="text-2xl font-bold">
                          ${selectedNode.data.cost.toFixed(4)}
                        </p>
                      </Card>
                    )}
                  </div>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">Node Type</p>
                    <Badge variant="outline" className="capitalize">
                      {selectedNode.data.type}
                    </Badge>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}