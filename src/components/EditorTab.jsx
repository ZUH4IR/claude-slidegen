import React, { useState, useEffect } from 'react'

const EditorTab = ({ data, onSave }) => {
  const [editedData, setEditedData] = useState([])
  const [headers, setHeaders] = useState([])

  useEffect(() => {
    if (data?.csv) {
      const lines = data.csv.trim().split('\n')
      const csvHeaders = lines[0].split(',')
      setHeaders(csvHeaders)
      
      const rows = lines.slice(1).map(line => {
        const values = line.split(',')
        return csvHeaders.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim() || ''
          return obj
        }, {})
      })
      setEditedData(rows)
    }
  }, [data])

  const handleCellEdit = (rowIndex, header, value) => {
    const newData = [...editedData]
    newData[rowIndex] = {
      ...newData[rowIndex],
      [header]: value
    }
    setEditedData(newData)
  }

  const handleSave = () => {
    const csvContent = [
      headers.join(','),
      ...editedData.map(row => 
        headers.map(header => row[header] || '').join(',')
      )
    ].join('\n')
    
    onSave({
      ...data,
      csv: csvContent
    })
  }

  const exportEditedCSV = () => {
    const csvContent = [
      headers.join(','),
      ...editedData.map(row => 
        headers.map(header => row[header] || '').join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited_slides.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!data) {
    return (
      <div className="card">
        <h2>Edit Results</h2>
        <p>No data to edit. Please generate some slides first.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Edit Generated Content</h2>
      
      <div className="actions">
        <button className="btn" onClick={handleSave}>
          Save Changes
        </button>
        <button className="btn btn-secondary" onClick={exportEditedCSV}>
          Export Edited CSV
        </button>
      </div>

      {editedData.length > 0 && (
        <div style={{ overflow: 'auto', marginTop: '1rem' }}>
          <table className="table">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {editedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, colIndex) => (
                    <td key={colIndex}>
                      <input
                        type="text"
                        value={row[header] || ''}
                        onChange={(e) => handleCellEdit(rowIndex, header, e.target.value)}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.9rem'
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.hooks && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Original Hooks</h3>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
            {data.hooks.map((hook, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                {index + 1}. {hook}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorTab 