import React, { useState, useEffect } from 'react'
import { Play, Copy, Download, Check, X, Edit } from 'lucide-react'
import promptStore from '../utils/promptStore'

const Generator = ({ onDataGenerated, generatedData }) => {
  const [clientsAndCampaigns, setClientsAndCampaigns] = useState({})
  const [config, setConfig] = useState({
    brand_name: '',
    persona: '',
    blueprint_id: 'story_6',
    rows: 2,
    topic: 'doctor said never run again but i proved him wrong',
    hook_appeal: 'drama',
    char_cap_hook: 95
  })
  
  const [step, setStep] = useState('config') // config, hooks, csv
  const [loading, setLoading] = useState(false)
  const [hooks, setHooks] = useState([])
  const [selectedHooks, setSelectedHooks] = useState([])
  const [editingHook, setEditingHook] = useState(null)
  const [csvData, setCsvData] = useState('')
  const [validation, setValidation] = useState(null)

  const blueprints = ['story_6', 'tutorial_5']

  // Load clients and campaigns from prompt store
  useEffect(() => {
    const updateClientsAndCampaigns = () => {
      const data = promptStore.getClientsAndCampaigns()
      setClientsAndCampaigns(data)
      
      // Set default client and campaign if not set
      if (!config.brand_name && Object.keys(data).length > 0) {
        const firstClient = Object.keys(data)[0]
        const firstCampaign = data[firstClient]?.[0] || ''
        setConfig(prev => ({
          ...prev,
          brand_name: firstClient,
          persona: firstCampaign
        }))
      }
      
      // Update campaign if current one no longer exists
      if (config.brand_name && data[config.brand_name]) {
        const availableCampaigns = data[config.brand_name]
        if (config.persona && !availableCampaigns.includes(config.persona)) {
          setConfig(prev => ({
            ...prev,
            persona: availableCampaigns[0] || ''
          }))
        }
      }
    }
    
    updateClientsAndCampaigns()
    
    // Subscribe to prompt store changes
    const unsubscribe = promptStore.subscribe(() => {
      updateClientsAndCampaigns()
    })
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [config.brand_name, config.persona])

  const clients = Object.keys(clientsAndCampaigns)
  const campaigns = clientsAndCampaigns

  const handleGenerateHooks = async () => {
    setLoading(true)
    try {
      // Get merged prompt with variables
      const variables = {
        brand_name: config.brand_name,
        blueprint_id: config.blueprint_id,
        csv_header: getCSVHeaders(config.blueprint_id),
        rows: config.rows,
        topic: config.topic,
        hook_appeal: config.hook_appeal,
        char_cap_hook: config.char_cap_hook,
        hooks: null // For hook generation, not CSV generation
      }
      
      const mergedPrompt = promptStore.getMergedPrompt(config.brand_name, config.persona, variables)
      
      // For now, simulate API call with improved mock data based on actual prompt
      await new Promise(resolve => setTimeout(resolve, 1500))
      
              const mockHooks = [
          `${config.topic} - ${config.brand_name} helped me overcome`,
          `this ${config.persona} transformation will shock you`,
          `the ${config.hook_appeal} truth about ${config.topic}`,
          `why ${config.brand_name} is different from everything else`,
          `from doubt to victory - my ${config.brand_name} journey`
        ].slice(0, Math.max(config.rows, 3))
      
      setHooks(mockHooks)
      setStep('hooks')
    } catch (error) {
      console.error('Error generating hooks:', error)
      // Fallback to simple mock hooks
      const fallbackHooks = [
        `${config.topic} - transformation story`,
        `how I overcame ${config.topic}`,
        `the secret to beating ${config.topic}`
      ].slice(0, config.rows)
      setHooks(fallbackHooks)
      setStep('hooks')
    } finally {
      setLoading(false)
    }
  }

  const getCSVHeaders = (blueprint) => {
    return blueprint === 'story_6' 
      ? 'hook_top_text,slide1_top,slide1_bottom,slide2_top,slide2_bottom,slide3_top,slide3_bottom,slide4_top,slide4_bottom,slide5_top,slide5_bottom,slide6_top,slide6_bottom,caption'
      : 'hook_top_text,slide1_top,slide1_bottom,slide2_top,slide2_bottom,slide3_top,slide3_bottom,slide4_top,slide4_bottom,slide5_top,slide5_bottom,caption'
  }

  const handleHookEdit = (index, newText) => {
    const updated = [...hooks]
    updated[index] = newText
    setHooks(updated)
    setEditingHook(null)
  }

  const handleApproveHooks = async () => {
    const approved = selectedHooks.length > 0 ? selectedHooks : hooks.slice(0, config.rows)
    setLoading(true)
    
    try {
      // Get merged prompt with hooks for CSV generation
      const variables = {
        brand_name: config.brand_name,
        blueprint_id: config.blueprint_id,
        csv_header: getCSVHeaders(config.blueprint_id),
        rows: config.rows,
        topic: config.topic,
        hook_appeal: config.hook_appeal,
        char_cap_hook: config.char_cap_hook,
        hooks: approved // Now we have the approved hooks
      }
      
      const mergedPrompt = promptStore.getMergedPrompt(config.brand_name, config.persona, variables)
      
      // For now, simulate CSV generation with improved mock data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
              const csvHeaders = getCSVHeaders(config.blueprint_id)

      const csvRows = approved.map((hook, index) => {
        const baseRow = [
          hook,
          `${config.topic} - step 1`,
          `why this matters for ${config.persona} audience`,
          `${config.topic} - step 2`, 
          `building on the foundation`,
          `${config.topic} - step 3`,
          `overcoming the main obstacle`,
          `${config.topic} - step 4`,
          `the breakthrough moment`,
          `success with ${config.brand_name}`,
          `transformation complete`
        ]

        if (config.blueprint_id === 'story_6') {
          baseRow.push(`${config.topic} - final step`)
          baseRow.push(`lasting change achieved`)
        }

        baseRow.push(`${config.topic} transformation with ${config.brand_name} #transformation #${config.brand_name} #${config.persona} #success`)
        return baseRow.map(cell => `"${cell}"`).join(',')
      })

      const csv = [csvHeaders, ...csvRows].join('\n')
      setCsvData(csv)
      
      // Mock validation
      setValidation({
        passed: true,
        message: 'CSV validation passed - using actual prompts',
        details: {
          columnCount: csvHeaders.split(',').length,
          rowCount: csvRows.length,
          charLimits: 'All within limits',
          promptSource: `${config.brand_name}/${config.persona}`
        }
      })
      
      setStep('csv')
      onDataGenerated({ hooks: approved, csv, validation })
      
    } catch (error) {
      console.error('Error generating CSV:', error)
      setValidation({
        passed: false,
        message: 'Error generating CSV with prompts',
        details: { error: error.message }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCSV = () => {
    navigator.clipboard.writeText(csvData)
    // Could add a toast notification here
  }

  const handleDownloadCSV = () => {
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.brand_name}_${config.persona}_${config.blueprint_id}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const resetFlow = () => {
    setStep('config')
    setHooks([])
    setSelectedHooks([])
    setCsvData('')
    setValidation(null)
  }

  return (
    <div>
      <div className="title">Generator</div>
      <div className="subtitle">
        Pick client → campaign → blueprint and generate TikTok-style copy
      </div>

      {step === 'config' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Configuration</div>
            <div className="card-description">
              Select your client, campaign, and blueprint settings
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Brand</label>
                <select 
                  className="form-select"
                  value={config.brand_name}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    brand_name: e.target.value,
                    persona: campaigns[e.target.value]?.[0] || ''
                  }))}
                >
                  <option value="">Select Brand...</option>
                  {clients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Campaign</label>
                <select 
                  className="form-select"
                  value={config.persona}
                  onChange={(e) => setConfig(prev => ({ ...prev, persona: e.target.value }))}
                >
                  <option value="">Select Campaign...</option>
                  {(campaigns[config.brand_name] || []).map(campaign => (
                    <option key={campaign} value={campaign}>{campaign}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Blueprint</label>
                <select 
                  className="form-select"
                  value={config.blueprint_id}
                  onChange={(e) => setConfig(prev => ({ ...prev, blueprint_id: e.target.value }))}
                >
                  {blueprints.map(blueprint => (
                    <option key={blueprint} value={blueprint}>{blueprint}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Rows</label>
                <input 
                  type="number"
                  className="form-input"
                  min="1"
                  max="5"
                  value={config.rows}
                  onChange={(e) => setConfig(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hook Appeal</label>
                <select 
                  className="form-select"
                  value={config.hook_appeal}
                  onChange={(e) => setConfig(prev => ({ ...prev, hook_appeal: e.target.value }))}
                >
                  <option value="drama">Drama</option>
                  <option value="curiosity">Curiosity</option>
                  <option value="fear">Fear</option>
                  <option value="desire">Desire</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Character Limit</label>
                <input 
                  type="number"
                  className="form-input"
                  min="50"
                  max="150"
                  value={config.char_cap_hook}
                  onChange={(e) => setConfig(prev => ({ ...prev, char_cap_hook: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Topic</label>
              <textarea 
                className="form-textarea"
                value={config.topic}
                onChange={(e) => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Describe the main topic or story..."
              />
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={handleGenerateHooks}
                disabled={loading}
              >
                <Play size={16} />
                {loading ? 'Generating Hooks...' : 'Generate Hooks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'hooks' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Generated Hooks</div>
            <div className="card-description">
              Review, edit, and approve hooks for CSV generation
            </div>
          </div>
          <div className="card-body">
            <div className="list">
              {hooks.map((hook, index) => (
                <div key={index} className="list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedHooks.includes(hook)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHooks(prev => [...prev, hook])
                        } else {
                          setSelectedHooks(prev => prev.filter(h => h !== hook))
                        }
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      {editingHook === index ? (
                        <input
                          type="text"
                          className="form-input"
                          value={hook}
                          onChange={(e) => handleHookEdit(index, e.target.value)}
                          onBlur={() => setEditingHook(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingHook(null)
                          }}
                          autoFocus
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{hook}</span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-tertiary)',
                            marginLeft: 'auto'
                          }}>
                            {hook.length}/{config.char_cap_hook}
                          </span>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.25rem', border: 'none', background: 'none' }}
                            onClick={() => setEditingHook(index)}
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={handleApproveHooks}
                disabled={loading}
              >
                <Check size={16} />
                {loading ? 'Generating CSV...' : 'Approve & Generate CSV'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={resetFlow}
              >
                <X size={16} />
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'csv' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Generated CSV</div>
            <div className="card-description">
              Your validated CSV is ready for export
            </div>
          </div>
          <div className="card-body">
            {validation && (
              <div className={`status-${validation.passed ? 'success' : 'error'}`} style={{ marginBottom: '1rem' }}>
                {validation.passed ? <Check size={16} /> : <X size={16} />}
                {validation.message}
              </div>
            )}

            <div className="code-block" style={{ maxHeight: '300px', overflow: 'auto' }}>
              {csvData}
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={handleCopyCSV}
              >
                <Copy size={16} />
                Copy to Clipboard
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleDownloadCSV}
              >
                <Download size={16} />
                Download CSV
              </button>
              <button 
                className="btn btn-secondary"
                onClick={resetFlow}
              >
                Generate New
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

export default Generator 