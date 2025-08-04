'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { History, Search, Download, Copy, Calendar, Hash, FileSpreadsheet } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ExcelTable } from '@/components/ExcelTable'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

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
  const [selectedTableData, setSelectedTableData] = useState<{ hook: string; slides: string[] }[]>([])
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

  const parseCSVToTableData = (csv: string): { hook: string; slides: string[] }[] => {
    const rows = csv.split('\n').filter(row => row.trim())
    const parsedData: { hook: string; slides: string[] }[] = []
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      // Parse CSV row handling quoted values
      const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
      if (matches && matches.length >= 6) {
        const cleanedMatches = matches.map(field => field.replace(/^"|"$/g, ''))
        parsedData.push({
          hook: cleanedMatches[0],
          slides: cleanedMatches.slice(1, 6)
        })
      }
    }
    
    return parsedData
  }

  const handleEntryClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry)
    const tableData = parseCSVToTableData(entry.csv)
    setSelectedTableData(tableData)
  }

  const exportToExcel = (entry: HistoryEntry) => {
    const tableData = parseCSVToTableData(entry.csv)
    
    let html = '<html><head><meta charset="utf-8"></head><body><table border="1">'
    
    // Header row
    html += '<tr>'
    html += '<th style="background-color:#f0f0f0;font-weight:bold;padding:8px">Hook</th>'
    for (let i = 1; i <= 5; i++) {
      html += `<th style="background-color:#f0f0f0;font-weight:bold;padding:8px">Slide ${i}</th>`
    }
    html += '</tr>'
    
    // Data rows
    tableData.forEach(row => {
      html += '<tr>'
      html += `<td style="padding:8px">${row.hook}</td>`
      row.slides.forEach(slide => {
        html += `<td style="padding:8px">${slide}</td>`
      })
      html += '</tr>'
    })
    
    html += '</table></body></html>'

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${entry.config.brand}_${entry.timestamp.replace(/[:.]/g, '-')}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                  onClick={() => handleEntryClick(entry)}
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

      <Sheet open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] p-0 flex flex-col"
        >
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Generation History</SheetTitle>
            <SheetDescription>Review and export your previously generated content</SheetDescription>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                {selectedEntry && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge>{selectedEntry.config.brand}</Badge>
                    {selectedEntry.config.campaign && (
                      <Badge variant="outline">{selectedEntry.config.campaign}</Badge>
                    )}
                    <span>•</span>
                    <span>{formatDate(selectedEntry.timestamp)}</span>
                  </div>
                )}
              </div>
              {selectedEntry && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedEntry.csv)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCSV(selectedEntry)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToExcel(selectedEntry)}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>
          {selectedEntry && (
            <div className="flex-1 px-6 py-4" style={{ minHeight: 0 }}>
              <ExcelTable 
                data={selectedTableData} 
                onDataChange={setSelectedTableData}
              />
            </div>
          )}
          {selectedEntry && (
            <div className="px-6 py-3 border-t bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div><span className="text-muted-foreground">Topic:</span> <span className="font-medium">{selectedEntry.config.topic}</span></div>
                  <div className="flex gap-4">
                    <span><span className="text-muted-foreground">Blueprint:</span> <span className="font-medium">{selectedEntry.config.blueprint}</span></span>
                    <span><span className="text-muted-foreground">Rows:</span> <span className="font-medium">{selectedEntry.config.rows}</span></span>
                    <span><span className="text-muted-foreground">Hooks:</span> <span className="font-medium">{selectedEntry.hooks.length}</span></span>
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {selectedTableData.length} slides • Edit any cell and re-export
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}