import React, { useState, useEffect } from 'react'

const BlueprintEditor = ({ file, onSave, saving }) => {
  const [blueprints, setBlueprints] = useState({})
  const [selectedBlueprint, setSelectedBlueprint] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      // Parse YAML content manually for simple structure
      const lines = file.content.split('\n')
      const parsed = {}
      let currentBlueprint = ''
      
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.endsWith(':') && !trimmed.startsWith('-') && !trimmed.startsWith(' ')) {
          currentBlueprint = trimmed.slice(0, -1)
          parsed[currentBlueprint] = { order: [] }
        } else if (trimmed.startsWith('- ') && currentBlueprint) {
          parsed[currentBlueprint].order.push(trimmed.slice(2))
        }
      }
      
      setBlueprints(parsed)
      setError(null)
    } catch (err) {
      setError('Failed to parse blueprint file')
    }
  }, [file.content])

  const generateYAML = () => {
    let yaml = ''
    for (const [name, data] of Object.entries(blueprints)) {
      yaml += `${name}:\n`
      yaml += `  order:\n`
      for (const step of data.order) {
        yaml += `    - ${step}\n`
      }
      yaml += '\n'
    }
    return yaml.trim()
  }

  const handleSave = async () => {
    const yamlContent = generateYAML()
    await onSave(yamlContent)
  }

  const addBlueprint = () => {
    const name = prompt('Enter blueprint name:')
    if (name && !blueprints[name]) {
      setBlueprints({
        ...blueprints,
        [name]: { order: ['hook'] }
      })
    }
  }

  const deleteBlueprint = (name) => {
    const { [name]: deleted, ...rest } = blueprints
    setBlueprints(rest)
    if (selectedBlueprint === name) {
      setSelectedBlueprint(null)
    }
  }

  const addStep = () => {
    if (!selectedBlueprint) return
    const step = prompt('Enter step name:')
    if (step) {
      setBlueprints({
        ...blueprints,
        [selectedBlueprint]: {
          ...blueprints[selectedBlueprint],
          order: [...blueprints[selectedBlueprint].order, step]
        }
      })
    }
  }

  const deleteStep = (stepIndex) => {
    if (!selectedBlueprint) return
    const newOrder = [...blueprints[selectedBlueprint].order]
    newOrder.splice(stepIndex, 1)
    setBlueprints({
      ...blueprints,
      [selectedBlueprint]: {
        ...blueprints[selectedBlueprint],
        order: newOrder
      }
    })
  }

  const editStep = (stepIndex, newValue) => {
    if (!selectedBlueprint) return
    const newOrder = [...blueprints[selectedBlueprint].order]
    newOrder[stepIndex] = newValue
    setBlueprints({
      ...blueprints,
      [selectedBlueprint]: {
        ...blueprints[selectedBlueprint],
        order: newOrder
      }
    })
  }

  const hasChanges = generateYAML() !== file.content

  if (error) {
    return (
      <div className="card">
        <div style={{ color: '#f56565', marginBottom: '1rem' }}>
          {error}
        </div>
        <textarea
          value={file.content}
          className="textarea"
          style={{ minHeight: '400px', fontFamily: 'monospace' }}
          readOnly
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Blueprint Editor</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={addBlueprint}>
            + Add Blueprint
          </button>
          <button 
            className="btn" 
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div style={{ 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: '#3b82f6'
        }}>
          You have unsaved changes
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {Object.keys(blueprints).map((name) => (
          <button
            key={name}
            className={selectedBlueprint === name ? 'btn' : 'btn btn-secondary'}
            onClick={() => setSelectedBlueprint(name)}
            style={{ position: 'relative' }}
          >
            {name}
            <span 
              onClick={(e) => {
                e.stopPropagation()
                deleteBlueprint(name)
              }}
              style={{
                marginLeft: '0.5rem',
                cursor: 'pointer',
                color: '#ef4444',
                fontWeight: 'bold'
              }}
            >
              ×
            </span>
          </button>
        ))}
      </div>

      {selectedBlueprint && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>{selectedBlueprint} Blueprint Steps</h3>
            <button className="btn btn-secondary" onClick={addStep}>
              + Add Step
            </button>
          </div>

          <div>
            {blueprints[selectedBlueprint].order.map((step, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                borderRadius: '8px'
              }}>
                <span style={{ cursor: 'grab', padding: '0.25rem' }}>⋮⋮</span>
                
                <input
                  type="text"
                  value={step}
                  onChange={(e) => editStep(index, e.target.value)}
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="Step name"
                />
                
                <button
                  className="btn btn-secondary"
                  onClick={() => deleteStep(index)}
                  style={{ 
                    backgroundColor: '#ef4444',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.8rem'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {blueprints[selectedBlueprint].order.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              No steps defined. Click "Add Step" to get started.
            </div>
          )}
        </div>
      )}

      {!selectedBlueprint && Object.keys(blueprints).length > 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Select a blueprint above to edit its steps
        </div>
      )}

      {Object.keys(blueprints).length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          No blueprints found. Click "Add Blueprint" to create one.
        </div>
      )}
    </div>
  )
}

export default BlueprintEditor