'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LintIssue, formatLintMessage } from '@/lib/linter'

interface LintIndicatorProps {
  issues: LintIssue[]
  className?: string
  onIssuClick?: (issue: LintIssue) => void
}

export function LintIndicator({ issues, className, onIssuClick }: LintIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const infoCount = issues.filter(i => i.severity === 'info').length
  
  const getIcon = () => {
    if (errorCount > 0) return <AlertCircle className="h-4 w-4" />
    if (warningCount > 0) return <AlertTriangle className="h-4 w-4" />
    if (infoCount > 0) return <Info className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }
  
  const getColor = () => {
    if (errorCount > 0) return 'text-red-500'
    if (warningCount > 0) return 'text-amber-500'
    if (infoCount > 0) return 'text-blue-500'
    return 'text-green-500'
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-500 bg-red-50 border-red-200'
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return ''
    }
  }
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-3 w-3" />
      case 'warning': return <AlertTriangle className="h-3 w-3" />
      case 'info': return <Info className="h-3 w-3" />
      default: return null
    }
  }
  
  useEffect(() => {
    // Auto-open if there are new errors
    if (errorCount > 0 && !isOpen) {
      setIsOpen(true)
    }
  }, [errorCount])
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", className)}
        >
          <span className={getColor()}>{getIcon()}</span>
          <span className="text-xs">
            {issues.length === 0 ? (
              'No issues'
            ) : (
              <div className="flex items-center gap-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    {errorCount}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="outline" className="text-xs px-1 py-0 text-amber-600 border-amber-300">
                    {warningCount}
                  </Badge>
                )}
                {infoCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {infoCount}
                  </Badge>
                )}
              </div>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="text-sm font-semibold">Lint Results</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {issues.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All checks passed!</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="p-2 space-y-1">
              {issues.map((issue, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-full text-left p-2 rounded-md border text-xs hover:bg-muted/50 transition-colors",
                    getSeverityColor(issue.severity)
                  )}
                  onClick={() => {
                    onIssuClick?.(issue)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 space-y-1">
                      <p className="font-medium leading-tight">
                        {formatLintMessage(issue)}
                      </p>
                      {issue.suggestion && (
                        <p className="text-muted-foreground leading-tight">
                          💡 {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}