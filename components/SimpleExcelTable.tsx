'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface SimpleExcelTableProps {
  data: { hook: string; slides: string[] }[]
  onDataChange: (data: { hook: string; slides: string[] }[]) => void
}

export function SimpleExcelTable({ data, onDataChange }: SimpleExcelTableProps) {
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

  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [editValue, setEditValue] = useState('')

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
  }, [data])

  const startEdit = useCallback((rowIndex: number, columnId: string) => {
    const currentValue = tableData[rowIndex][columnId as keyof TableRow]
    setEditingCell({ row: rowIndex, col: columnId })
    setEditValue(currentValue)
  }, [tableData])

  const saveEdit = useCallback(() => {
    if (editingCell) {
      const newData = [...tableData]
      newData[editingCell.row] = {
        ...newData[editingCell.row],
        [editingCell.col]: editValue,
      }
      
      setTableData(newData)
      
      const transformed = newData.map(row => ({
        hook: row.hook,
        slides: [row.slide1, row.slide2, row.slide3, row.slide4, row.slide5],
      }))
      onDataChange(transformed)
      
      setEditingCell(null)
      setEditValue('')
    }
  }, [editingCell, editValue, tableData, onDataChange])

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const columnHelper = createColumnHelper<TableRow>()

  const createColumn = (accessor: keyof TableRow, header: string) => {
    return columnHelper.accessor(accessor, {
      header,
      size: accessor === 'hook' ? 250 : 150,
      cell: ({ getValue, row }) => {
        const isEditing = editingCell?.row === row.index && editingCell?.col === accessor
        
        if (isEditing) {
          return (
            <input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={handleKeyDown}
              className="w-full h-full px-3 py-2 text-sm border-2 border-blue-500 focus:outline-none"
              autoFocus
            />
          )
        }
        
        return (
          <div
            onClick={() => startEdit(row.index, accessor)}
            className="w-full h-full px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
          >
            {getValue()}
          </div>
        )
      },
    })
  }

  const columns = [
    columnHelper.display({
      id: 'rowNumber',
      header: '#',
      cell: ({ row }) => (
        <div className="px-2 py-2 text-xs text-gray-500 font-medium text-center">
          {row.index + 1}
        </div>
      ),
      size: 50,
      enableResizing: false,
    }),
    createColumn('hook', 'Hook'),
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
  })

  return (
    <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden">
      <div className="h-full overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="border-b border-r border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 text-left"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-gray-200">
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="border-r border-gray-200"
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