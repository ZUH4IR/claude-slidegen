'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronRight, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Variable {
  key: string
  scope: 'global' | 'client' | 'campaign'
  default: any
  overrides?: {
    client?: any
    campaign?: any
  }
  effectiveValue: any
}

interface VariableLegendProps {
  client: string
  campaign?: string
  onVariableClick?: (varName: string) => void
  className?: string
}

export function VariableLegend({ client, campaign, onVariableClick, className }: VariableLegendProps) {
  const [variables, setVariables] = useState<Variable[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (!client) return
    
    const loadVariables = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ client })
        if (campaign) params.append('campaign', campaign)
        
        const res = await fetch(`/api/legend?${params}`)
        const data = await res.json()
        setVariables(data.variables || [])
      } catch (err) {
        console.error('Failed to load variables:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadVariables()
  }, [client, campaign])

  const getScopeBadge = (scope: string) => {
    const variants = {
      global: 'secondary',
      client: 'default',
      campaign: 'outline'
    } as const
    
    const colors = {
      global: 'bg-gray-100 text-gray-800 border-gray-200',
      client: 'bg-blue-100 text-blue-800 border-blue-200',
      campaign: 'bg-green-100 text-green-800 border-green-200'
    } as const
    
    return (
      <Badge 
        variant={variants[scope as keyof typeof variants]} 
        className={cn("text-xs", colors[scope as keyof typeof colors])}
      >
        {scope}
      </Badge>
    )
  }

  const getConflictIndicator = (variable: Variable) => {
    if (variable.overrides?.campaign && variable.overrides?.client) {
      return <div className="w-2 h-2 bg-red-500 rounded-full" title="Campaign overrides client" />
    }
    if (variable.overrides?.campaign || variable.overrides?.client) {
      return <div className="w-2 h-2 bg-orange-500 rounded-full" title="Override exists" />
    }
    return null
  }

  const formatValue = (value: any): string => {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  return (
    <Card className={cn("border-l-4 border-l-primary", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isOpen && "rotate-90"
                )} />
                <CardTitle className="text-sm font-medium">Variable Legend</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {variables.length} vars
                </Badge>
              </div>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading variables...</div>
            ) : variables.length === 0 ? (
              <div className="text-sm text-muted-foreground">No variables found</div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div className="col-span-3">Key</div>
                  <div className="col-span-2">Scope</div>
                  <div className="col-span-4">Default</div>
                  <div className="col-span-3">Overrides</div>
                </div>
                
                {variables.map((variable) => (
                  <div
                    key={variable.key}
                    className="grid grid-cols-12 gap-2 text-xs py-1.5 hover:bg-muted/50 cursor-pointer rounded-sm px-1 -mx-1"
                    onClick={() => onVariableClick?.(variable.key)}
                  >
                    <div className="col-span-3 font-mono flex items-center gap-1">
                      {getConflictIndicator(variable)}
                      <span className="truncate">{variable.key}</span>
                    </div>
                    <div className="col-span-2">
                      {getScopeBadge(variable.scope)}
                    </div>
                    <div className="col-span-4 truncate text-muted-foreground" title={formatValue(variable.default)}>
                      {formatValue(variable.default)}
                    </div>
                    <div className="col-span-3">
                      {variable.overrides && (
                        <div className="space-y-0.5">
                          {variable.overrides.client && (
                            <div className="flex items-center gap-1">
                              <Badge variant="default" className="text-xs h-4 bg-blue-100 text-blue-800">C</Badge>
                              <span className="truncate text-muted-foreground" title={formatValue(variable.overrides.client)}>
                                {formatValue(variable.overrides.client)}
                              </span>
                            </div>
                          )}
                          {variable.overrides.campaign && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs h-4 bg-green-100 text-green-800 border-green-200">CM</Badge>
                              <span className="truncate text-muted-foreground" title={formatValue(variable.overrides.campaign)}>
                                {formatValue(variable.overrides.campaign)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Click any variable to jump to its first occurrence in the editor.</p>
                  <p>Red dot: Campaign overrides client. Orange dot: Any override exists.</p>
                  <p className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-gray-200 rounded"></span> Global
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-200 rounded"></span> Client
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-200 rounded"></span> Campaign
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}