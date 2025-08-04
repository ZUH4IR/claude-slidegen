'use client'

import { useState, useEffect, useRef } from 'react'
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

interface ExcelGridProps {
  data: { hook: string; slides: string[] }[]
  onDataChange: (data: { hook: string; slides: string[] }[]) => void
}

export function ExcelGrid({ data, onDataChange }: ExcelGridProps) {
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
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: string } | null>(null)

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
      
      const transformed = newData.map(row => ({
        hook: row.hook,
        slides: [row.slide1, row.slide2, row.slide3, row.slide4, row.slide5],
      }))
      onDataChange(transformed)
      
      return newData
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

    // Handle Shift+Tab
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      if (currentColIndex > 0) {
        const prevInput = document.querySelector(
          `[data-cell="${rowIndex}-${columns[currentColIndex - 1]}"]`
        ) as HTMLInputElement
        prevInput?.focus()
      }
    }
  }

  const handleCopy = (e: React.ClipboardEvent, value: string) => {
    e.clipboardData.setData('text/plain', value)
    e.preventDefault()
  }

  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, columnId: string) => {
    const pastedText = e.clipboardData.getData('text/plain')
    updateCell(rowIndex, columnId, pastedText)
    e.preventDefault()
  }

  const columnHelper = createColumnHelper<TableRow>()

  const createColumn = (accessor: keyof TableRow, header: string, size: number = 150) => {
    return columnHelper.accessor(accessor, {
      header,
      cell: ({ getValue, row }) => (
        <input
          data-cell={`${row.index}-${accessor}`}
          value={getValue()}
          onChange={e => updateCell(row.index, accessor, e.target.value)}
          onKeyDown={e => handleKeyDown(e, row.index, accessor)}
          onCopy={e => handleCopy(e, getValue())}
          onPaste={e => handlePaste(e, row.index, accessor)}
          onFocus={() => setSelectedCell({ row: row.index, col: accessor })}
          className="w-full h-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-500"
          style={{ minHeight: '36px' }}
        />
      ),
      size,
      minSize: 50,
      maxSize: 500,
    })
  }

  const columns = [
    columnHelper.display({
      id: 'rowNumber',
      header: '',
      cell: ({ row }) => (
        <div className="px-2 py-2 text-xs text-gray-500 font-medium text-center bg-gray-50 select-none h-full flex items-center justify-center">
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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse bg-white" style={{ minWidth: table.getCenterTotalSize() }}>
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="relative bg-gray-50 border-b border-r border-gray-300 last:border-r-0"
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
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="border-r border-gray-200 last:border-r-0 p-0"
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
      <div className="mt-2 text-xs text-gray-500">
        Tip: Use arrow keys to navigate • Tab to move right • Enter to move down • Drag column borders to resize
      </div>
    </div>
  )
}