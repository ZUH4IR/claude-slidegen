'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { History, Search, Download, Copy, Calendar, Hash } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface HistoryEntry {
  id: string
  timestamp: string
  config: {
    brand: string
    campaign: string
    blueprint: string
    rows: number
    topic: string
  }
  hooks: string[]
  csv: string
}

export default function HistoryPage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<HistoryEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    filterEntries()
  }, [searchTerm, entries])

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      setEntries(data.entries)
      setFilteredEntries(data.entries)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterEntries = () => {
    if (!searchTerm) {
      setFilteredEntries(entries)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = entries.filter(entry => 
      entry.config.brand.toLowerCase().includes(term) ||
      entry.config.campaign?.toLowerCase().includes(term) ||
      entry.config.topic.toLowerCase().includes(term) ||
      entry.config.blueprint.toLowerCase().includes(term)
    )
    setFilteredEntries(filtered)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'CSV copied to clipboard'
    })
  }

  const downloadCSV = (entry: HistoryEntry) => {
    const blob = new Blob([entry.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entry.config.brand}-${entry.timestamp.replace(/[:.]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Generation History</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage your previously generated content
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by brand, campaign, topic, or blueprint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredEntries.length} entries
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No history entries found
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>{entry.config.brand}</Badge>
                        {entry.config.campaign && (
                          <Badge variant="outline">{entry.config.campaign}</Badge>
                        )}
                        <Badge variant="secondary">{entry.config.blueprint}</Badge>
                      </div>
                      <p className="text-sm font-medium">{entry.config.topic}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {entry.config.rows} rows
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(entry.csv)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadCSV(entry)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Generation Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4 overflow-y-auto">
              <div>
                <h3 className="font-semibold mb-2">Configuration</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Brand: {selectedEntry.config.brand}</div>
                  <div>Campaign: {selectedEntry.config.campaign || 'None'}</div>
                  <div>Blueprint: {selectedEntry.config.blueprint}</div>
                  <div>Rows: {selectedEntry.config.rows}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Topic</h3>
                <p className="text-sm">{selectedEntry.config.topic}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Generated Hooks</h3>
                <div className="space-y-1">
                  {selectedEntry.hooks.map((hook, i) => (
                    <div key={i} className="text-sm p-2 bg-muted rounded">
                      {i + 1}. {hook}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">CSV Output</h3>
                <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
                  {selectedEntry.csv}
                </pre>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(selectedEntry.csv)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadCSV(selectedEntry)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}