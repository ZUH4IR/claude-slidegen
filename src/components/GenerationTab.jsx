import React, { useState, useEffect } from 'react'
import promptStore from '../utils/promptStore'

const GenerationTab = ({ onGenerate, loading, error, generatedData }) => {
  const [clientsAndCampaigns, setClientsAndCampaigns] = useState({})
  const [config, setConfig] = useState({
    brand_name: '',
    blueprint_id: 'story_6',
    rows: 2,
    persona: '',
    hook_appeal: 'drama',
    topic: 'doctor said never run again but i proved him wrong',
    char_cap_hook: 95,
    add_selfAwareJoke: true,
    product_slide: 5,
    brandSlug: '',
    campSlug: ''
  })

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
          persona: firstCampaign,
          brandSlug: `clients/${firstClient}/_brand_v1.md`,
          campSlug: firstCampaign ? `clients/${firstClient}/${firstCampaign}_v1.md` : ''
        }))
      }
    }
    
    updateClientsAndCampaigns()
    
    // Subscribe to prompt store changes
    const unsubscribe = promptStore.subscribe(updateClientsAndCampaigns)
    return unsubscribe
  }, [])

  const clients = Object.keys(clientsAndCampaigns)
  const campaigns = clientsAndCampaigns[config.brand_name] || []

  const handleSubmit = (e) => {
    e.preventDefault()
    onGenerate(config)
  }

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const exportCSV = () => {
    if (!generatedData?.csv) return
    
    const blob = new Blob([generatedData.csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'slides.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Generation Configuration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Brand Name</label>
            <select
              value={config.brand_name}
              onChange={(e) => {
                const newBrand = e.target.value
                const newCampaign = clientsAndCampaigns[newBrand]?.[0] || ''
                handleInputChange('brand_name', newBrand)
                handleInputChange('persona', newCampaign)
                handleInputChange('brandSlug', `clients/${newBrand}/_brand_v1.md`)
                handleInputChange('campSlug', newCampaign ? `clients/${newBrand}/${newCampaign}_v1.md` : '')
              }}
            >
              <option value="">Select Brand...</option>
              {clients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Blueprint</label>
            <select
              value={config.blueprint_id}
              onChange={(e) => handleInputChange('blueprint_id', e.target.value)}
            >
              <option value="story_6">Story 6</option>
              <option value="tutorial_5">Tutorial 5</option>
            </select>
          </div>

          <div className="form-group">
            <label>Number of Rows</label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.rows}
              onChange={(e) => handleInputChange('rows', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Campaign</label>
            <select
              value={config.persona}
              onChange={(e) => {
                const newCampaign = e.target.value
                handleInputChange('persona', newCampaign)
                handleInputChange('campSlug', newCampaign ? `clients/${config.brand_name}/${newCampaign}_v1.md` : '')
              }}
            >
              <option value="">Select Campaign...</option>
              {campaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Hook Appeal</label>
            <select
              value={config.hook_appeal}
              onChange={(e) => handleInputChange('hook_appeal', e.target.value)}
            >
              <option value="drama">Drama</option>
              <option value="curiosity">Curiosity</option>
              <option value="fear">Fear</option>
              <option value="desire">Desire</option>
            </select>
          </div>

          <div className="form-group">
            <label>Topic</label>
            <textarea
              value={config.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className="textarea"
            />
          </div>

          <div className="form-group">
            <label>Hook Character Limit</label>
            <input
              type="number"
              min="50"
              max="150"
              value={config.char_cap_hook}
              onChange={(e) => handleInputChange('char_cap_hook', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Product Slide Number</label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.product_slide}
              onChange={(e) => handleInputChange('product_slide', parseInt(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={config.add_selfAwareJoke}
                onChange={(e) => handleInputChange('add_selfAwareJoke', e.target.checked)}
              />
              Add Self-Aware Joke
            </label>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Slides'}
          </button>
        </form>

        {error && (
          <div className="error" style={{ marginTop: '1rem' }}>
            Error: {error}
          </div>
        )}
      </div>

      {generatedData && (
        <div className="card">
          <h2>Generated Results</h2>
          
          {generatedData.hooks && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>Generated Hooks</h3>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                {generatedData.hooks.map((hook, index) => (
                  <div key={index} style={{ marginBottom: '0.5rem' }}>
                    {index + 1}. {hook}
                  </div>
                ))}
              </div>
            </div>
          )}

          {generatedData.csv && (
            <div>
              <h3>CSV Output</h3>
              <div className="actions">
                <button className="btn btn-secondary" onClick={exportCSV}>
                  Export CSV
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigator.clipboard.writeText(generatedData.csv)}
                >
                  Copy to Clipboard
                </button>
              </div>
              <pre style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1rem', 
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {generatedData.csv}
              </pre>
            </div>
          )}

          {generatedData.validation && (
            <div style={{ marginTop: '1rem' }}>
              <span className={generatedData.validation.passed ? 'success' : 'error'}>
                {generatedData.validation.passed ? '✅' : '❌'} {generatedData.validation.message}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GenerationTab 