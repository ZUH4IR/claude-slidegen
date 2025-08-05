'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Download, 
  Upload, 
  Save, 
  Copy, 
  Trash2, 
  Plus, 
  FileSpreadsheet,
  Check,
  X,
  RefreshCw,
  Filter,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { stringify } from 'csv-stringify/sync'
import * as XLSX from 'xlsx'

interface ReviewSheetProps {
  data: any[][]
  headers?: string[]
  onChange?: (data: any[][]) => void
  onSave?: (data: any[][]) => void
  title?: string
  description?: string
  readOnly?: boolean
  showStats?: boolean
  className?: string
}

interface CellSelection {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

interface CellEdit {
  row: number
  col: number
  value: string
}

export function ReviewSheet({
  data: initialData = [],
  headers = [],
  onChange,
  onSave,
  title = "Review Sheet",
  description,
  readOnly = false,
  showStats = true,
  className
}: ReviewSheetProps) {
  const [data, setData] = useState<any[][]>(initialData)
  const [selectedCells, setSelectedCells] = useState<CellSelection | null>(null)
  const [editingCell, setEditingCell] = useState<CellEdit | null>(null)
  const [copiedCells, setCopiedCells] = useState<any[][]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [filters, setFilters] = useState<{ [key: number]: string }>({})
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const tableRef = useRef<HTMLDivElement>(null)

  // Initialize data with headers if provided
  useEffect(() => {
    if (headers.length > 0 && data.length === 0) {
      setData([headers])
    }
  }, [headers])

  // Update parent when data changes
  useEffect(() => {
    if (onChange && data !== initialData) {
      onChange(data)
    }
  }, [data])

  const getColumnLetter = (index: number): string => {
    let letter = ''
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter
      index = Math.floor(index / 26) - 1
    }
    return letter
  }

  const getCellKey = (row: number, col: number): string => {
    return `${getColumnLetter(col)}${row + 1}`
  }

  const handleCellClick = (row: number, col: number, shiftKey: boolean) => {
    if (readOnly) return

    if (shiftKey && selectedCells) {
      // Extend selection
      setSelectedCells({
        startRow: selectedCells.startRow,
        startCol: selectedCells.startCol,
        endRow: row,
        endCol: col
      })
    } else {
      // New selection
      setSelectedCells({
        startRow: row,
        startCol: col,
        endRow: row,
        endCol: col
      })
    }
  }

  const handleCellDoubleClick = (row: number, col: number) => {
    if (readOnly) return
    setEditingCell({ row, col, value: data[row]?.[col] || '' })
  }

  const handleCellEdit = (value: string) => {
    if (!editingCell) return
    
    const newData = [...data]
    if (!newData[editingCell.row]) {
      newData[editingCell.row] = []
    }
    newData[editingCell.row][editingCell.col] = value
    setData(newData)
  }

  const finishEditing = () => {
    if (!editingCell) return
    handleCellEdit(editingCell.value)
    setEditingCell(null)
  }

  const cancelEditing = () => {
    setEditingCell(null)
  }

  const handleCopy = () => {
    if (!selectedCells) return
    
    const { startRow, startCol, endRow, endCol } = selectedCells
    const minRow = Math.min(startRow, endRow)
    const maxRow = Math.max(startRow, endRow)
    const minCol = Math.min(startCol, endCol)
    const maxCol = Math.max(startCol, endCol)
    
    const copied = []
    for (let r = minRow; r <= maxRow; r++) {
      const row = []
      for (let c = minCol; c <= maxCol; c++) {
        row.push(data[r]?.[c] || '')
      }
      copied.push(row)
    }
    
    setCopiedCells(copied)
    
    // Also copy to clipboard
    const text = copied.map(row => row.join('\t')).join('\n')
    navigator.clipboard.writeText(text)
  }

  const handlePaste = () => {
    if (!selectedCells || copiedCells.length === 0) return
    
    const { startRow, startCol } = selectedCells
    const newData = [...data]
    
    copiedCells.forEach((row, rIdx) => {
      row.forEach((value, cIdx) => {
        const targetRow = startRow + rIdx
        const targetCol = startCol + cIdx
        
        if (!newData[targetRow]) {
          newData[targetRow] = []
        }
        newData[targetRow][targetCol] = value
      })
    })
    
    setData(newData)
  }

  const handleDelete = () => {
    if (!selectedCells) return
    
    const { startRow, startCol, endRow, endCol } = selectedCells
    const minRow = Math.min(startRow, endRow)
    const maxRow = Math.max(startRow, endRow)
    const minCol = Math.min(startCol, endCol)
    const maxCol = Math.max(startCol, endCol)
    
    const newData = [...data]
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (newData[r]) {
          newData[r][c] = ''
        }
      }
    }
    
    setData(newData)
  }

  const addRow = () => {
    const newRow = new Array(Math.max(...data.map(r => r.length), headers.length)).fill('')
    setData([...data, newRow])
  }

  const addColumn = () => {
    const newData = data.map(row => [...row, ''])
    if (newData.length === 0) {
      newData.push([''])
    }
    setData(newData)
  }

  const exportCSV = () => {
    const csvContent = stringify(data)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (file.name.endsWith('.csv')) {
        const rows = content.split('\n').map(row => row.split(',').map(cell => cell.trim()))
        setData(rows)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(content, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        setData(jsonData)
      }
    }
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const getFilteredData = () => {
    let filtered = [...data]
    
    // Apply filters
    Object.entries(filters).forEach(([colIndex, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row => 
          row[parseInt(colIndex)]?.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })
    
    // Apply sorting
    if (sortColumn !== null) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn] || ''
        const bVal = b[sortColumn] || ''
        const comparison = aVal.toString().localeCompare(bVal.toString())
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }
    
    return filtered
  }

  const stats = showStats ? {
    rows: data.length,
    columns: Math.max(...data.map(r => r.length), 0),
    filled: data.flat().filter(cell => cell !== '' && cell !== null && cell !== undefined).length,
    total: data.length * Math.max(...data.map(r => r.length), 0)
  } : null

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return
      
      if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleCopy()
      } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handlePaste()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!editingCell) {
          e.preventDefault()
          handleDelete()
        }
      } else if (e.key === 'Escape' && editingCell) {
        cancelEditing()
      } else if (e.key === 'Enter' && editingCell) {
        finishEditing()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCells, editingCell, copiedCells, readOnly])

  const displayData = getFilteredData()

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{stats.rows} rows</span>
                <span>{stats.columns} columns</span>
                <span>{stats.filled}/{stats.total} filled</span>
              </div>
            )}
            {!readOnly && (
              <>
                <Button size="sm" variant="outline" onClick={addRow}>
                  <Plus className="h-4 w-4 mr-1" />
                  Row
                </Button>
                <Button size="sm" variant="outline" onClick={addColumn}>
                  <Plus className="h-4 w-4 mr-1" />
                  Column
                </Button>
              </>
            )}
            <div className="flex gap-1">
              <label htmlFor="import-file">
                <Button size="sm" variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={importFile}
                className="hidden"
              />
              <Button size="sm" variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button size="sm" variant="outline" onClick={exportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
            </div>
            {onSave && (
              <Button size="sm" onClick={() => onSave(data)}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-auto" ref={tableRef}>
          <table className="w-full">
            <thead>
              {headers.length > 0 && (
                <tr className="bg-muted/50">
                  <th className="sticky left-0 bg-muted/50 border-r w-12 p-2 text-xs font-medium text-muted-foreground"></th>
                  {headers.map((header, colIndex) => (
                    <th 
                      key={colIndex} 
                      className="border-r p-2 text-left font-medium cursor-pointer hover:bg-muted/80"
                      onClick={() => {
                        if (sortColumn === colIndex) {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortColumn(colIndex)
                          setSortDirection('asc')
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {header}
                        {sortColumn === colIndex && (
                          <ChevronDown className={cn(
                            "h-3 w-3",
                            sortDirection === 'desc' && "rotate-180"
                          )} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              )}
              <tr className="bg-muted/30">
                <th className="sticky left-0 bg-muted/30 border-r p-1">
                  <Filter className="h-3 w-3 mx-auto" />
                </th>
                {(headers.length > 0 ? headers : data[0] || []).map((_, colIndex) => (
                  <th key={colIndex} className="border-r p-1">
                    <input
                      type="text"
                      value={filters[colIndex] || ''}
                      onChange={(e) => setFilters({ ...filters, [colIndex]: e.target.value })}
                      placeholder="Filter..."
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/20">
                  <td className="sticky left-0 bg-background border-r w-12 p-2 text-xs font-medium text-muted-foreground text-center">
                    {rowIndex + 1}
                  </td>
                  {row.map((cell, colIndex) => {
                    const isSelected = selectedCells && 
                      rowIndex >= Math.min(selectedCells.startRow, selectedCells.endRow) &&
                      rowIndex <= Math.max(selectedCells.startRow, selectedCells.endRow) &&
                      colIndex >= Math.min(selectedCells.startCol, selectedCells.endCol) &&
                      colIndex <= Math.max(selectedCells.startCol, selectedCells.endCol)
                    
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex
                    
                    return (
                      <td
                        key={colIndex}
                        className={cn(
                          "border-r border-b p-2 cursor-cell relative",
                          isSelected && "bg-primary/10",
                          isEditing && "ring-2 ring-primary"
                        )}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e.shiftKey)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <Textarea
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onBlur={finishEditing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                finishEditing()
                              } else if (e.key === 'Escape') {
                                cancelEditing()
                              }
                            }}
                            className="absolute inset-0 w-full h-full resize-none border-0 p-2"
                            autoFocus
                          />
                        ) : (
                          <div className="text-sm truncate">
                            {cell || <span className="text-muted-foreground">-</span>}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!readOnly && selectedCells && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Selected: {getCellKey(selectedCells.startRow, selectedCells.startCol)}
              {(selectedCells.startRow !== selectedCells.endRow || selectedCells.startCol !== selectedCells.endCol) && 
                ` to ${getCellKey(selectedCells.endRow, selectedCells.endCol)}`}
            </span>
            <div className="flex gap-1 ml-auto">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={handlePaste} disabled={copiedCells.length === 0}>
                <Copy className="h-3 w-3 mr-1" />
                Paste
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}