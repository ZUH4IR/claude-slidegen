'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnResizeMode,
} from '@tanstack/react-table'

interface TableRow {
  hook: string
  slide1: string
  slide2: string
  slide3: string
  slide4: string
  slide5: string
}

interface ExcelTableProps {
  data: { hook: string; slides: string[] }[]
  onDataChange: (data: { hook: string; slides: string[] }[]) => void
}

interface DragState {
  active: boolean
  startRow: number
  startCol: string
  endRow: number
  endCol: string
}

export function ExcelTable({ data, onDataChange }: ExcelTableProps) {
  const [tableData, setTableData] = useState<TableRow[]>(() =>
    data.map(row => ({
      hook: row.hook,
      slide1: row.slides[0] || '',
      slide2: row.slides[1] || '',
      slide3: row.slides[2] || '',
      slide4: row.slides[3] || '',
      slide5: row.slides[4] || '',
    }))
  )

  const [columnSizing, setColumnSizing] = useState({})
  const [initialColumnSizes, setInitialColumnSizes] = useState<Record<string, number>>({})
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: string } | null>(null)
  const [dragState, setDragState] = useState<DragState>({
    active: false,
    startRow: -1,
    startCol: '',
    endRow: -1,
    endCol: '',
  })

  // Calculate optimal column sizes based on content
  const calculateColumnSizes = (data: TableRow[]) => {
    const sizes: Record<string, number> = {}
    const columns = ['hook', 'slide1', 'slide2', 'slide3', 'slide4', 'slide5']
    const headers = ['Hook', 'Slide 1', 'Slide 2', 'Slide 3', 'Slide 4', 'Slide 5']
    
    // Create a temporary canvas to measure text
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return sizes
    
    // Set font to match table cells
    context.font = '14px system-ui, -apple-system, sans-serif'
    
    columns.forEach((col, idx) => {
      // Start with header width (with padding)
      const headerWidth = context.measureText(headers[idx]).width + 50 // padding
      
      // Find longest content in column
      let maxContentWidth = headerWidth
      data.forEach(row => {
        const content = row[col as keyof TableRow]
        const contentWidth = context.measureText(content).width + 40 // padding
        maxContentWidth = Math.max(maxContentWidth, contentWidth)
      })
      
      // Set reasonable min/max bounds
      sizes[col] = Math.min(Math.max(maxContentWidth, 120), 500)
    })
    
    return sizes
  }

  useEffect(() => {
    const newData = data.map(row => ({
      hook: row.hook,
      slide1: row.slides[0] || '',
      slide2: row.slides[1] || '',
      slide3: row.slides[2] || '',
      slide4: row.slides[3] || '',
      slide5: row.slides[4] || '',
    }))
    setTableData(newData)
    
    // Calculate initial column sizes when data changes
    if (data.length > 0) {
      const sizes = calculateColumnSizes(newData)
      setColumnSizing(sizes)
      setInitialColumnSizes(sizes)
    }
  }, [data])

  const updateCell = (rowIndex: number, columnId: string, value: string) => {
    setTableData(old => {
      const newData = [...old]
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnId]: value,
      }
      
      const transformed = newData.map(row => ({
        hook: row.hook,
        slides: [row.slide1, row.slide2, row.slide3, row.slide4, row.slide5],
      }))
      onDataChange(transformed)
      
      return newData
    })
  }

  const handleDragStart = (row: number, col: string) => {
    setDragState({
      active: true,
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col,
    })
  }

  const handleDragEnter = (row: number, col: string) => {
    if (dragState.active) {
      setDragState(prev => ({
        ...prev,
        endRow: row,
        endCol: col,
      }))
    }
  }

  const handleDragEnd = () => {
    if (dragState.active) {
      const { startRow, startCol, endRow, endCol } = dragState
      const columns = ['hook', 'slide1', 'slide2', 'slide3', 'slide4', 'slide5']
      const startColIndex = columns.indexOf(startCol)
      const endColIndex = columns.indexOf(endCol)
      
      const value = tableData[startRow][startCol as keyof TableRow]
      
      setTableData(old => {
        const newData = [...old]
        
        // Fill cells in the drag range
        const minRow = Math.min(startRow, endRow)
        const maxRow = Math.max(startRow, endRow)
        const minCol = Math.min(startColIndex, endColIndex)
        const maxCol = Math.max(startColIndex, endColIndex)
        
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            newData[r] = {
              ...newData[r],
              [columns[c]]: value,
            }
          }
        }
        
        const transformed = newData.map(row => ({
          hook: row.hook,
          slides: [row.slide1, row.slide2, row.slide3, row.slide4, row.slide5],
        }))
        onDataChange(transformed)
        
        return newData
      })
    }
    
    setDragState({
      active: false,
      startRow: -1,
      startCol: '',
      endRow: -1,
      endCol: '',
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    const columns = ['hook', 'slide1', 'slide2', 'slide3', 'slide4', 'slide5']
    const currentColIndex = columns.indexOf(columnId)
    
    switch (e.key) {
      case 'Enter':
      case 'ArrowDown':
        e.preventDefault()
        if (rowIndex < tableData.length - 1) {
          const nextInput = document.querySelector(
            `[data-cell="${rowIndex + 1}-${columnId}"]`
          ) as HTMLInputElement
          nextInput?.focus()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (rowIndex > 0) {
          const prevInput = document.querySelector(
            `[data-cell="${rowIndex - 1}-${columnId}"]`
          ) as HTMLInputElement
          prevInput?.focus()
        }
        break
      case 'ArrowRight':
      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault()
          if (currentColIndex < columns.length - 1) {
            const nextInput = document.querySelector(
              `[data-cell="${rowIndex}-${columns[currentColIndex + 1]}"]`
            ) as HTMLInputElement
            nextInput?.focus()
          }
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (currentColIndex > 0) {
          const prevInput = document.querySelector(
            `[data-cell="${rowIndex}-${columns[currentColIndex - 1]}"]`
          ) as HTMLInputElement
          prevInput?.focus()
        }
        break
    }
  }

  const columnHelper = createColumnHelper<TableRow>()

  const createColumn = (accessor: keyof TableRow, header: string, defaultSize: number = 150) => {
    return columnHelper.accessor(accessor, {
      header,
      size: initialColumnSizes[accessor] || defaultSize,
      cell: ({ getValue, row }) => (
        <div className="relative h-full group">
          <input
            data-cell={`${row.index}-${accessor}`}
            value={getValue()}
            onChange={e => updateCell(row.index, accessor, e.target.value)}
            onKeyDown={e => handleKeyDown(e, row.index, accessor)}
            onFocus={() => setFocusedCell({ row: row.index, col: accessor })}
            onMouseEnter={() => handleDragEnter(row.index, accessor)}
            className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500"
            style={{ minHeight: '36px' }}
          />
          {focusedCell?.row === row.index && focusedCell?.col === accessor && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-crosshair opacity-0 group-hover:opacity-100"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDragStart(row.index, accessor)
              }}
              style={{
                borderRadius: '0 0 2px 0',
              }}
            />
          )}
          {dragState.active && (
            (() => {
              const columns = ['hook', 'slide1', 'slide2', 'slide3', 'slide4', 'slide5']
              const currentColIndex = columns.indexOf(accessor)
              const startColIndex = columns.indexOf(dragState.startCol)
              const endColIndex = columns.indexOf(dragState.endCol)
              
              const inRowRange = row.index >= Math.min(dragState.startRow, dragState.endRow) &&
                                row.index <= Math.max(dragState.startRow, dragState.endRow)
              const inColRange = currentColIndex >= Math.min(startColIndex, endColIndex) &&
                                currentColIndex <= Math.max(startColIndex, endColIndex)
              
              if (inRowRange && inColRange) {
                return (
                  <div className="absolute inset-0 bg-blue-100 bg-opacity-30 pointer-events-none" />
                )
              }
              return null
            })()
          )}
        </div>
      ),
      minSize: 50,
      maxSize: 500,
    })
  }

  const columns = [
    columnHelper.display({
      id: 'rowNumber',
      header: '',
      cell: ({ row }) => (
        <div className="px-2 py-2 text-xs text-gray-500 font-medium text-center bg-gray-50 select-none h-full flex items-center justify-center sticky left-0 z-10">
          {row.index + 1}
        </div>
      ),
      size: 40,
      enableResizing: false,
    }),
    createColumn('hook', 'Hook', 200),
    createColumn('slide1', 'Slide 1'),
    createColumn('slide2', 'Slide 2'),
    createColumn('slide3', 'Slide 3'),
    createColumn('slide4', 'Slide 4'),
    createColumn('slide5', 'Slide 5'),
  ]

  const table = useReactTable({
    data: tableData,
    columns,
    columnResizeMode: 'onChange' as ColumnResizeMode,
    getCoreRowModel: getCoreRowModel(),
    onColumnSizingChange: setColumnSizing,
    state: {
      columnSizing,
    },
  })

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragState.active) {
        handleDragEnd()
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [dragState])

  return (
    <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="h-full overflow-auto relative">
        <table className="border-collapse" style={{ minWidth: table.getCenterTotalSize() }}>
          <thead className="sticky top-0 z-20 bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    className={`relative border-b border-r border-gray-300 ${
                      idx === 0 ? 'sticky left-0 z-30 bg-gray-50' : ''
                    }`}
                    style={{ width: header.getSize() }}
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider select-none">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </div>
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute inset-y-0 right-0 w-4 cursor-col-resize select-none touch-none group"
                        style={{ marginRight: '-8px' }}
                      >
                        <div 
                          className="absolute inset-y-0 right-2 w-px bg-gray-300 group-hover:bg-blue-500 transition-colors"
                          style={{
                            transform: header.column.getIsResizing()
                              ? 'scaleX(3)'
                              : '',
                          }}
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-gray-200 last:border-b-0">
                {row.getVisibleCells().map((cell, idx) => (
                  <td
                    key={cell.id}
                    className={`border-r border-gray-200 last:border-r-0 p-0 ${
                      idx === 0 ? 'sticky left-0 z-10 bg-gray-50' : ''
                    }`}
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}