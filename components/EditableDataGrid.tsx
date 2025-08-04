'use client'

import { useState, useEffect } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'

interface TableRow {
  hook: string
  slide1: string
  slide2: string
  slide3: string
  slide4: string
  slide5: string
}

interface EditableDataGridProps {
  data: { hook: string; slides: string[] }[]
  onDataChange: (data: { hook: string; slides: string[] }[]) => void
}

export function EditableDataGrid({ data, onDataChange }: EditableDataGridProps) {
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

  const columnHelper = createColumnHelper<TableRow>()

  const columns = [
    columnHelper.display({
      id: 'rowNumber',
      header: '#',
      cell: ({ row }) => (
        <div className="px-2 py-2 text-sm text-gray-500 font-medium text-center bg-gray-50">
          {row.index + 1}
        </div>
      ),
      size: 40,
    }),
    columnHelper.accessor('hook', {
      header: 'Hook',
      cell: ({ getValue, row }) => (
        <input
          value={getValue()}
          onChange={e => updateCell(row.index, 'hook', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
          style={{ minWidth: '200px' }}
        />
      ),
    }),
    columnHelper.accessor('slide1', {
      header: 'Slide 1',
      cell: ({ getValue, row }) => (
        <input
          value={getValue()}
          onChange={e => updateCell(row.index, 'slide1', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
          style={{ minWidth: '150px' }}
        />
      ),
    }),
    columnHelper.accessor('slide2', {
      header: 'Slide 2',
      cell: ({ getValue, row }) => (
        <input
          value={getValue()}
          onChange={e => updateCell(row.index, 'slide2', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
          style={{ minWidth: '150px' }}
        />
      ),
    }),
    columnHelper.accessor('slide3', {
      header: 'Slide 3',
      cell: ({ getValue, row }) => (
        <input
          value={getValue()}
          onChange={e => updateCell(row.index, 'slide3', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
          style={{ minWidth: '150px' }}
        />
      ),
    }),
    columnHelper.accessor('slide4', {
      header: 'Slide 4',
      cell: ({ getValue, row }) => (
        <input
          value={getValue()}
          onChange={e => updateCell(row.index, 'slide4', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
          style={{ minWidth: '150px' }}
        />
      ),
    }),
    columnHelper.accessor('slide5', {
      header: 'Slide 5',
      cell: ({ getValue, row }) => (
        <input
          value={getValue()}
          onChange={e => updateCell(row.index, 'slide5', e.target.value)}
          className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none focus:bg-blue-50"
          style={{ minWidth: '150px' }}
        />
      ),
    }),
  ]

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-auto border-2 border-gray-300 rounded-lg bg-white shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="bg-gray-100 border-b border-gray-300">
              {headerGroup.headers.map((header, idx) => (
                <th
                  key={header.id}
                  className={`px-3 py-2 text-left font-semibold text-sm text-gray-700 select-none border-gray-200 ${
                    idx < headerGroup.headers.length - 1 ? 'border-r' : ''
                  }`}
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
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr key={row.id} className={`bg-white hover:bg-gray-50 ${
              rowIndex < table.getRowModel().rows.length - 1 ? 'border-b border-gray-200' : ''
            }`}>
              {row.getVisibleCells().map((cell, idx) => (
                <td key={cell.id} className={`p-0 ${
                  idx < row.getVisibleCells().length - 1 ? 'border-r border-gray-200' : ''
                }`}>
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
  )
}