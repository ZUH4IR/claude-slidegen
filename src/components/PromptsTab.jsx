import React, { useState, useEffect } from 'react'

const PromptsTab = () => {
  const [prompts, setPrompts] = useState({})
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [editedContent, setEditedContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would fetch from the backend
    // For now, we'll simulate the prompt structure
    setPrompts({
      'universal_engine_v1.md': '### UNIVERSAL ENGINE v1\n\ncsv_header: {{ csv_header }}\nblueprint: {{ blueprint_id }}\n\n...',
      'clients/vibit/_brand_v1.md': '# VIBIT Brand Voice\n\n- Professional yet approachable\n- Focus on health and wellness\n- Emphasize transformation and results\n...',
      'clients/vibit/older_v1.md': '# Older Persona Campaign\n\n- Target audience: 40+ years\n- Focus on health concerns\n- Emphasize proven results\n...'
    })
    setLoading(false)
  }, [])

  const handlePromptSelect = (promptName) => {
    setSelectedPrompt(promptName)
    setEditedContent(prompts[promptName] || '')
  }

  const handleSave = () => {
    if (selectedPrompt) {
      setPrompts(prev => ({
        ...prev,
        [selectedPrompt]: editedContent
      }))
      // In a real app, this would save to the backend
      alert('Prompt saved!')
    }
  }

  const handleNewPrompt = () => {
    const name = prompt('Enter prompt name:')
    if (name) {
      setPrompts(prev => ({
        ...prev,
        [name]: '# New Prompt\n\nEnter your prompt content here...'
      }))
      setSelectedPrompt(name)
      setEditedContent('# New Prompt\n\nEnter your prompt content here...')
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Prompt Templates</h2>
        
        <div className="actions">
          <button className="btn btn-secondary" onClick={handleNewPrompt}>
            New Prompt
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          {Object.keys(prompts).map(promptName => (
            <div 
              key={promptName}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: selectedPrompt === promptName ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                cursor: 'pointer',
                border: selectedPrompt === promptName ? '1px solid #667eea' : '1px solid transparent'
              }}
              onClick={() => handlePromptSelect(promptName)}
            >
              {promptName}
            </div>
          ))}
        </div>
      </div>

      {selectedPrompt && (
        <div className="card">
          <h2>Edit: {selectedPrompt}</h2>
          
          <div className="form-group">
            <label>Prompt Content</label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="textarea"
              style={{ minHeight: '400px' }}
            />
          </div>

          <div className="actions">
            <button className="btn" onClick={handleSave}>
              Save Prompt
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigator.clipboard.writeText(editedContent)}
            >
              Copy to Clipboard
            </button>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3>Template Variables</h3>
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '1rem', 
              borderRadius: '8px',
              fontSize: '0.9rem'
            }}>
              <p><strong>Available variables:</strong></p>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                <li><code>{'{{ brand_name }}'}</code> - Brand name</li>
                <li><code>{'{{ blueprint_id }}'}</code> - Selected blueprint</li>
                <li><code>{'{{ csv_header }}'}</code> - CSV column headers</li>
                <li><code>{'{{ rows }}'}</code> - Number of rows to generate</li>
                <li><code>{'{{ persona }}'}</code> - Target persona</li>
                <li><code>{'{{ hook_appeal }}'}</code> - Hook appeal type</li>
                <li><code>{'{{ topic }}'}</code> - Main topic</li>
                <li><code>{'{{ char_cap_hook }}'}</code> - Hook character limit</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptsTab 