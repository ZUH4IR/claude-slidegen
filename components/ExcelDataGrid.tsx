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

interface ExcelDataGridProps {
  data: { hook: string; slides: string[] }[]
  onDataChange: (data: { hook: string; slides: string[] }[]) => void
}

interface CellSelection {
  startRow: number
  startCol: string
  endRow: number
  endCol: string
}

export function ExcelDataGrid({ data, onDataChange }: ExcelDataGridProps) {
  // Transform data to flat structure for table
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

  const [selectedCells, setSelectedCells] = useState<CellSelection | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ row: number; col: string } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ row: number; col: string } | null>(null)
  const [columnSizing, setColumnSizing] = useState({})

  useEffect(() => {
    setTableData(
      data.map(row => ({
        hook: row.hook,
        slide1: row.slides[0] || '',
        slide2: row.slides[1] || '',
        slide3: row.slides[2] || '',
        slide4: row.slides[3] || '',
        slide5: row.slides[4] || '',
      }))
    )
  }, [data])

  const updateCell = (rowIndex: number, columnId: string, value: string) => {
    setTableData(old => {
      const newData = [...old]
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnId]: value,
      }
      
      // Transform back to original format
      const transformed = newData.map(row => ({
        hook: row.hook,
        slides: [row.slide1, row.slide2, row.slide3, row.slide4, row.slide5],
      }))
      onDataChange(transformed)
      
      return newData
    })
  }

  const handleDragFill = useCallback((endRow: number, endCol: string) => {
    if (!dragStart) return

    const startValue = tableData[dragStart.row][dragStart.col as keyof TableRow]
    const colIndex = ['hook', 'slide1', 'slide2', 'slide3', 'slide4', 'slide5'].indexOf(dragStart.col)
    const endColIndex = ['hook', 'slide1', 'slide2', 'slide3', 'slide4', 'slide5'].indexOf(endCol)

    setTableData(old => {
      const newData = [...old]
      
      // Fill down
      if (dragStart.col === endCol) {
        const startRowIdx = Math.min(dragStart.row, endRow)
        const endRowIdx = Math.max(dragStart.row, endRow)
        
        for (let i = startRowIdx; i <= endRowIdx; i++) {
          newData[i] = {
            ...newData[i],
            [dragStart.col]: startValue,
          }
        }
      }
      // Fill across
      else if (dragStart.row === endRow) {
        const startColIdx = Math.min(colIndex, endColIndex)
        const endColIdx = Math.max(colIndex, endColIndex)
        const cols = ['hook', 'slide1', 'slide2', 'slide3', 'slide4', 'slide5']
        
        for (let i = startColIdx; i <= endColIdx; i++) {
          newData[dragStart.row] = {
            ...newData[dragStart.row],
            [cols[i]]: startValue,
          }
        }
      }
      
      // Transform back
      const transformed = newData.map(row => ({
        hook: row.hook,
        slides: [row.slide1, row.slide2, row.slide3, row.slide4, row.slide5],
      }))
      onDataChange(transformed)
      
      return newData
    })
  }, [dragStart, tableData, onDataChange])

  const columnHelper = createColumnHelper<TableRow>()

  const columns = [
    columnHelper.display({
      id: 'rowNumber',
      header: '#',
      cell: ({ row }) => (
        <div className="px-2 py-2 text-sm text-gray-500 font-medium text-center bg-gray-50 select-none">
          {row.index + 1}
        </div>
      ),
      size: 40,
      enableResizing: false,
    }),
    columnHelper.accessor('hook', {
      header: 'Hook',
      cell: ({ getValue, row }) => (
        <div className="relative group">
          <input
            value={getValue()}
            onChange={e => updateCell(row.index, 'hook', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
            onMouseDown={() => setDragStart({ row: row.index, col: 'hook' })}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 opacity-0 group-hover:opacity-100 cursor-crosshair"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
              setDragStart({ row: row.index, col: 'hook' })
            }}
            onMouseUp={() => {
              setIsDragging(false)
              handleDragFill(row.index, 'hook')
            }}
          />
        </div>
      ),
      size: 200,
      minSize: 100,
    }),
    columnHelper.accessor('slide1', {
      header: 'Slide 1',
      cell: ({ getValue, row }) => (
        <div className="relative group">
          <input
            value={getValue()}
            onChange={e => updateCell(row.index, 'slide1', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
            onMouseDown={() => setDragStart({ row: row.index, col: 'slide1' })}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 opacity-0 group-hover:opacity-100 cursor-crosshair"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
              setDragStart({ row: row.index, col: 'slide1' })
            }}
            onMouseUp={() => {
              setIsDragging(false)
              handleDragFill(row.index, 'slide1')
            }}
          />
        </div>
      ),
      size: 150,
      minSize: 100,
    }),
    columnHelper.accessor('slide2', {
      header: 'Slide 2',
      cell: ({ getValue, row }) => (
        <div className="relative group">
          <input
            value={getValue()}
            onChange={e => updateCell(row.index, 'slide2', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
            onMouseDown={() => setDragStart({ row: row.index, col: 'slide2' })}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 opacity-0 group-hover:opacity-100 cursor-crosshair"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
              setDragStart({ row: row.index, col: 'slide2' })
            }}
            onMouseUp={() => {
              setIsDragging(false)
              handleDragFill(row.index, 'slide2')
            }}
          />
        </div>
      ),
      size: 150,
      minSize: 100,
    }),
    columnHelper.accessor('slide3', {
      header: 'Slide 3',
      cell: ({ getValue, row }) => (
        <div className="relative group">
          <input
            value={getValue()}
            onChange={e => updateCell(row.index, 'slide3', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
            onMouseDown={() => setDragStart({ row: row.index, col: 'slide3' })}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 opacity-0 group-hover:opacity-100 cursor-crosshair"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
              setDragStart({ row: row.index, col: 'slide3' })
            }}
            onMouseUp={() => {
              setIsDragging(false)
              handleDragFill(row.index, 'slide3')
            }}
          />
        </div>
      ),
      size: 150,
      minSize: 100,
    }),
    columnHelper.accessor('slide4', {
      header: 'Slide 4',
      cell: ({ getValue, row }) => (
        <div className="relative group">
          <input
            value={getValue()}
            onChange={e => updateCell(row.index, 'slide4', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
            onMouseDown={() => setDragStart({ row: row.index, col: 'slide4' })}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 opacity-0 group-hover:opacity-100 cursor-crosshair"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
              setDragStart({ row: row.index, col: 'slide4' })
            }}
            onMouseUp={() => {
              setIsDragging(false)
              handleDragFill(row.index, 'slide4')
            }}
          />
        </div>
      ),
      size: 150,
      minSize: 100,
    }),
    columnHelper.accessor('slide5', {
      header: 'Slide 5',
      cell: ({ getValue, row }) => (
        <div className="relative group">
          <input
            value={getValue()}
            onChange={e => updateCell(row.index, 'slide5', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
            onMouseDown={() => setDragStart({ row: row.index, col: 'slide5' })}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 opacity-0 group-hover:opacity-100 cursor-crosshair"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
              setDragStart({ row: row.index, col: 'slide5' })
            }}
            onMouseUp={() => {
              setIsDragging(false)
              handleDragFill(row.index, 'slide5')
            }}
          />
        </div>
      ),
      size: 150,
      minSize: 100,
    }),
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
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStart) {
        // Handle drag preview
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  return (
    <div className="w-full overflow-auto border-2 border-gray-300 rounded-lg bg-white shadow-sm">
      <div className="relative">
        <table className="w-full border-collapse" style={{ width: table.getCenterTotalSize() }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-gray-100 border-b border-gray-300">
                {headerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    className={`relative px-3 py-2 text-left font-semibold text-sm text-gray-700 select-none border-gray-200 ${
                      idx < headerGroup.headers.length - 1 ? 'border-r' : ''
                    }`}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 bg-gray-400 cursor-col-resize select-none touch-none ${
                          header.column.getIsResizing() ? 'bg-blue-500' : ''
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr key={row.id} className={`bg-white hover:bg-gray-50 ${
                rowIndex < table.getRowModel().rows.length - 1 ? 'border-b border-gray-200' : ''
              }`}>
                {row.getVisibleCells().map((cell, idx) => (
                  <td 
                    key={cell.id} 
                    className={`p-0 relative ${
                      idx < row.getVisibleCells().length - 1 ? 'border-r border-gray-200' : ''
                    }`}
                    style={{ width: cell.column.getSize() }}
                  >
                    <div className="w-full h-full">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
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