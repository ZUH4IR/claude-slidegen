'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight, AlertCircle, Info, ArrowUpDown, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Variable, getEffectiveValue } from '@/lib/scanVars-client'
import { useToast } from '@/hooks/use-toast'

interface VariableLegendProps {
  client: string
  campaign?: string
  onVariableClick?: (variable: Variable) => void
  className?: string
}

type SortField = 'key' | 'scope' | 'file'
type SortOrder = 'asc' | 'desc'

export function VariableLegend({ client, campaign, onVariableClick, className }: VariableLegendProps) {
  const { toast } = useToast()
  const [variables, setVariables] = useState<Variable[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(true)
  const [sortField, setSortField] = useState<SortField>('key')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const loadVariables = useCallback(async () => {
    if (!client) return

    setLoading(true)
    try {
      const params = new URLSearchParams({ client })
      if (campaign) params.append('campaign', campaign)
      
      const res = await fetch(`/api/scanvars?${params}`)
      const result = await res.json()
      
      if (result.errors && result.errors.length > 0) {
        toast({
          title: 'Warning',
          description: result.errors.join(', '),
          variant: 'destructive'
        })
      }
      
      setVariables(result.variables || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load variables',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [client, campaign, toast])

  useEffect(() => {
    loadVariables()
  }, [loadVariables])

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'global':
        return 'text-gray-600 bg-gray-100'
      case 'brand':
        return 'text-blue-600 bg-blue-100'
      case 'campaign':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getGutterColor = (scope: string) => {
    switch (scope) {
      case 'global':
        return 'bg-gray-400'
      case 'brand':
        return 'bg-blue-400'
      case 'campaign':
        return 'bg-green-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getConflictIndicator = (variable: Variable) => {
    if (variable.override !== undefined) {
      if (variable.scope === 'global' || variable.scope === 'brand') {
        return <Circle className="h-3 w-3 fill-orange-500 text-orange-500" />
      }
      return <Circle className="h-3 w-3 fill-red-500 text-red-500" />
    }
    return null
  }

  const sortedVariables = [...variables].sort((a, b) => {
    let aValue: string, bValue: string
    
    switch (sortField) {
      case 'key':
        aValue = a.key
        bValue = b.key
        break
      case 'scope':
        aValue = a.scope
        bValue = b.scope
        break
      case 'file':
        aValue = a.file
        bValue = b.file
        break
      default:
        aValue = a.key
        bValue = b.key
    }
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue)
    } else {
      return bValue.localeCompare(aValue)
    }
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-90"
              )} />
              <h3 className="font-medium">Variable Legend</h3>
              <Badge variant="secondary">{variables.length}</Badge>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-b bg-muted/50 px-4 py-2">
            <div className="grid grid-cols-4 gap-4 text-xs font-medium">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 justify-start"
                onClick={() => handleSort('key')}
              >
                Variable
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 justify-start"
                onClick={() => handleSort('scope')}
              >
                Scope
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
              <div>Value</div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 justify-start"
                onClick={() => handleSort('file')}
              >
                Source
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-1">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading variables...</div>
              ) : sortedVariables.length === 0 ? (
                <div className="text-sm text-muted-foreground">No variables found</div>
              ) : (
                sortedVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className={cn(
                      "grid grid-cols-4 gap-4 py-2 px-2 rounded text-sm cursor-pointer hover:bg-muted/50 relative",
                      "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1",
                      variable.scope === 'global' && "before:bg-gray-400",
                      variable.scope === 'brand' && "before:bg-blue-400",
                      variable.scope === 'campaign' && "before:bg-green-400"
                    )}
                    onClick={() => onVariableClick?.(variable)}
                  >
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {getConflictIndicator(variable)}
                      <span>{variable.key}</span>
                    </div>
                    <div>
                      <Badge variant="outline" className={cn("text-xs", getScopeColor(variable.scope))}>
                        {variable.scope}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {String(getEffectiveValue(variable))}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {variable.file.split('/').pop()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="border-t p-3 bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                <span>Campaign override</span>
              </div>
              <div className="flex items-center gap-1">
                <Circle className="h-3 w-3 fill-orange-500 text-orange-500" />
                <span>Brand override</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}