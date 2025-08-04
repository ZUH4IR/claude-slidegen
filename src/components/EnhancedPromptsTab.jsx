import React, { useState, useEffect } from 'react'
import BlueprintEditor from './BlueprintEditor'

const VARIABLES = [
  'brand_name',
  'blueprint_id', 
  'csv_header',
  'rows',
  'persona',
  'topic',
  'hook_appeal',
  'voice_addons',
  'image_buckets',
  'integration_rule'
]

const VariableHighlightEditor = ({ value, onChange, placeholder }) => {
  const insertVariable = (variable) => {
    const textarea = document.getElementById('content-editor')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.slice(0, start) + `{{ ${variable} }}` + value.slice(end)
    
    onChange(newValue)
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      const newPosition = start + `{{ ${variable} }}`.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  const highlightVariables = (text) => {
    return text.replace(
      /\{\{\s*([^}]+)\s*\}\}/g,
      (match, variable) => {
        const cleanVar = variable.trim()
        const isKnownVar = VARIABLES.includes(cleanVar)
        const color = isKnownVar ? '#4caf50' : '#ff9800'
        return `<span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${match}</span>`
      }
    )
  }

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: 2 }}>
        <textarea
          id="content-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="textarea"
          style={{ 
            minHeight: '500px', 
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        />
      </div>
      
      <div style={{ flex: 1 }}>
        <div className="card" style={{ position: 'sticky', top: '1rem' }}>
          <h3>Available Variables</h3>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
            Click to insert at cursor position
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {VARIABLES.map((variable) => (
              <button
                key={variable}
                onClick={() => insertVariable(variable)}
                className="btn btn-secondary"
                style={{ 
                  textAlign: 'left',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '0.8rem'
                }}
              >
                {`{{ ${variable} }}`}
              </button>
            ))}
          </div>

          <h4>Preview</h4>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            padding: '1rem', 
            borderRadius: '8px',
            maxHeight: '200px', 
            overflow: 'auto',
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            {value ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: highlightVariables(value.replace(/\n/g, '<br/>')) 
                }}
              />
            ) : (
              <span style={{ color: '#9ca3af' }}>
                Start typing to see preview with highlighted variables
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const StructuredEditor = ({ file, onSave, saving }) => {
  const [content, setContent] = useState({
    frontMatter: {},
    sections: {},
    rawContent: file.content
  })
  const [editMode, setEditMode] = useState('structured')

  useEffect(() => {
    parseContent(file.content)
  }, [file.content])

  const parseContent = (text) => {
    const lines = text.split('\n')
    const frontMatter = {}
    const sections = {}

    let currentSection = ''
    let sectionContent = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Handle front matter (YAML style)
      if (line.includes(':') && !line.startsWith('#') && !line.startsWith(' ')) {
        const [key, ...valueParts] = line.split(':')
        const value = valueParts.join(':').trim()
        frontMatter[key.trim()] = value
      }
      // Handle markdown sections
      else if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = sectionContent.trim()
        }
        currentSection = line.replace('## ', '')
        sectionContent = ''
      }
      // Handle section content
      else if (currentSection) {
        sectionContent += line + '\n'
      }
    }

    // Add last section
    if (currentSection) {
      sections[currentSection] = sectionContent.trim()
    }

    setContent({ frontMatter, sections, rawContent: text })
  }

  const generateContent = () => {
    let output = ''
    
    // Add front matter
    for (const [key, value] of Object.entries(content.frontMatter)) {
      if (value.trim()) {
        output += `${key}: ${value}\n`
      }
    }
    
    if (Object.keys(content.frontMatter).length > 0) {
      output += '\n'
    }

    // Add sections
    for (const [title, sectionContent] of Object.entries(content.sections)) {
      if (sectionContent.trim()) {
        output += `## ${title}\n\n${sectionContent}\n\n`
      }
    }

    return output.trim()
  }

  const handleSave = async () => {
    const finalContent = editMode === 'structured' ? generateContent() : content.rawContent
    await onSave(finalContent)
  }

  const updateFrontMatter = (key, value) => {
    setContent(prev => ({
      ...prev,
      frontMatter: { ...prev.frontMatter, [key]: value }
    }))
  }

  const updateSection = (title, sectionContent) => {
    setContent(prev => ({
      ...prev,
      sections: { ...prev.sections, [title]: sectionContent }
    }))
  }

  const addSection = (title) => {
    setContent(prev => ({
      ...prev,
      sections: { ...prev.sections, [title]: '' }
    }))
  }

  const deleteSection = (title) => {
    const { [title]: deleted, ...rest } = content.sections
    setContent(prev => ({
      ...prev,
      sections: rest
    }))
  }

  const isCampaignFile = file.name.includes('campaign') || file.path?.includes('campaigns')
  const isBrandFile = file.name.includes('brand') || file.path?.includes('brands')

  const hasChanges = generateContent() !== file.content

  // Ensure default sections exist
  useEffect(() => {
    if (editMode === 'structured') {
      const defaultSections = isCampaignFile 
        ? ['Target Demographics', 'Hook Examples', 'Voice & Tone', 'Key Messages']
        : isBrandFile 
        ? ['Brand Voice', 'Visual Style', 'Key Values', 'Messaging Guidelines']
        : []
      
      defaultSections.forEach(section => {
        if (!content.sections[section]) {
          addSection(section)
        }
      })
    }
  }, [editMode])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>
          {isCampaignFile ? 'Campaign Editor' : isBrandFile ? 'Brand Editor' : 'Content Editor'}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={editMode === 'structured' ? 'btn' : 'btn btn-secondary'}
            onClick={() => setEditMode('structured')}
          >
            Structured
          </button>
          <button
            className={editMode === 'raw' ? 'btn' : 'btn btn-secondary'}
            onClick={() => setEditMode('raw')}
          >
            Raw
          </button>
          <button
            className="btn"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {editMode === 'structured' ? (
        <div>
          {/* Front Matter Section */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {isBrandFile && (
                <>
                  <div className="form-group">
                    <label>Brand Name</label>
                    <input
                      type="text"
                      className="input"
                      value={content.frontMatter.brand_name || ''}
                      onChange={(e) => updateFrontMatter('brand_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Voice Addons</label>
                    <input
                      type="text"
                      className="input"
                      value={content.frontMatter.voice_addons || ''}
                      onChange={(e) => updateFrontMatter('voice_addons', e.target.value)}
                      placeholder="e.g., betrayed patient, fiery"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Integration Rule</label>
                    <input
                      type="text"
                      className="input"
                      value={content.frontMatter.integration_rule || ''}
                      onChange={(e) => updateFrontMatter('integration_rule', e.target.value)}
                      placeholder="e.g., mention brand on slide5"
                    />
                  </div>
                </>
              )}
              
              {Object.entries(content.frontMatter).map(([key, value]) => {
                if (isBrandFile && ['brand_name', 'voice_addons', 'integration_rule'].includes(key)) {
                  return null
                }
                return (
                  <div key={key} className="form-group">
                    <label>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                    <input
                      type="text"
                      className="input"
                      value={value}
                      onChange={(e) => updateFrontMatter(key, e.target.value)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Image Buckets Section for Brand Files */}
          {isBrandFile && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>Image Drive Categories</h3>
              <div className="form-group">
                <label>Image Buckets</label>
                <textarea
                  className="textarea"
                  rows={4}
                  value={content.frontMatter.image_buckets || ''}
                  onChange={(e) => updateFrontMatter('image_buckets', e.target.value)}
                  placeholder="hook:brand/hook, problem:brand/problem, plug:brand/plug, insight:brand/insight, happy:brand/happy"
                />
                <small style={{ color: '#9ca3af' }}>Format: category:folder/path, category:folder/path</small>
              </div>
            </div>
          )}

          {/* Sections */}
          {Object.entries(content.sections).map(([title, sectionContent]) => (
            <div key={title} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4>{title}</h4>
                <button
                  className="btn btn-secondary"
                  onClick={() => deleteSection(title)}
                  style={{ backgroundColor: '#ef4444', fontSize: '0.8rem' }}
                >
                  Delete
                </button>
              </div>
              <textarea
                className="textarea"
                rows={6}
                value={sectionContent}
                onChange={(e) => updateSection(title, e.target.value)}
                placeholder={`Enter ${title.toLowerCase()} content...`}
              />
            </div>
          ))}

          {/* Add Section Button */}
          <button
            className="btn btn-secondary"
            onClick={() => {
              const title = prompt('Enter section title:')
              if (title) addSection(title)
            }}
            style={{ marginTop: '1rem' }}
          >
            + Add Section
          </button>
        </div>
      ) : (
        <textarea
          className="textarea"
          rows={25}
          value={content.rawContent}
          onChange={(e) => setContent(prev => ({ ...prev, rawContent: e.target.value }))}
          placeholder="Edit raw content..."
          style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
        />
      )}
    </div>
  )
}

const EnhancedPromptsTab = () => {
  const [prompts, setPrompts] = useState({})
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [editedContent, setEditedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load prompts including the new sample files
    setPrompts({
      'universal_engine_v1.md': '### UNIVERSAL ENGINE v1\n\ncsv_header: {{ csv_header }}\nblueprint: {{ blueprint_id }}\n\nglobal_rules:\n- lowercase conversational, no periods line-end, no em-dashes\n- char caps: hook ≤95, slide_top ≤55, caption ≤50 + 4 hashtags\n- {{ brand_name }} appears on slide5 and caption',
      'blueprints.yaml': 'story_6:\n  order:\n    - hook\n    - problem\n    - agitate\n    - solution\n    - product\n    - cta\n\ntutorial_5:\n  order:\n    - hook\n    - step1\n    - step2\n    - step3\n    - product',
      'clients/vibit/_brand_v1.md': 'brand_name: Vibit\nvoice_addons: betrayed patient, fiery\nimage_buckets: hook:vibit/hook, problem:vibit/problem, plug:vibit/plug, insight:vibit/insight, happy:vibit/happy\nintegration_rule: mention vibit on slide5',
      'campaigns/example_campaign.md': 'campaign_name: Example Campaign\ncampaign_type: awareness\nduration: 30 days\n\n## Target Demographics\n\nYoung professionals aged 25-35, tech-savvy, living in urban areas. Interested in productivity tools and work-life balance. Active on social media platforms.\n\n## Hook Examples\n\n- "Stop wasting 3 hours a day on..."\n- "This simple trick changed my productivity forever"\n- "Why successful people never..."\n- "The #1 mistake everyone makes with..."\n\n## Voice & Tone\n\nConversational yet authoritative. Use "you" language to create connection. Avoid jargon but be informative. Slightly urgent but not pushy.\n\n## Key Messages\n\n1. Efficiency is achievable for everyone\n2. Small changes lead to big results\n3. Time is your most valuable asset\n4. Success comes from systems, not motivation',
      'brands/example_brand.md': 'brand_name: Example Brand\nvoice_addons: confident, relatable, innovative\nimage_buckets: hook:example/hook, problem:example/problem, solution:example/solution, product:example/product, happy:example/happy\nintegration_rule: mention Example Brand on slide5 and in caption\n\n## Brand Voice\n\nConfident yet approachable. We speak as the friend who\'s figured things out and wants to help. Never condescending, always encouraging.\n\n## Visual Style\n\nClean, modern aesthetic with bright accent colors. Focus on real people in real situations. Avoid stock photo feel.\n\n## Key Values\n\n1. Authenticity over perfection\n2. Progress over perfection\n3. Community over competition\n4. Innovation with purpose\n\n## Messaging Guidelines\n\n- Always lead with benefits, not features\n- Use social proof when possible\n- Address pain points directly\n- End with clear next steps'
    })
    setLoading(false)
  }, [])

  const handlePromptSelect = (promptName) => {
    setSelectedPrompt(promptName)
    setEditedContent(prompts[promptName] || '')
  }

  const handleSave = async (content) => {
    if (!selectedPrompt) return
    
    const contentToSave = content !== undefined ? content : editedContent
    setSaving(true)
    
    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setPrompts(prev => ({
        ...prev,
        [selectedPrompt]: contentToSave
      }))
      setEditedContent(contentToSave)
      
      alert('Prompt saved successfully!')
    } catch (err) {
      alert('Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  const getFileIcon = (path) => {
    if (path.includes('brand')) return '🏢'
    if (path.includes('campaign')) return '📢'
    if (path.includes('universal_engine')) return '⚙️'
    if (path.includes('blueprints')) return '📋'
    return '📄'
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

  const selectedFile = selectedPrompt ? {
    name: selectedPrompt.split('/').pop(),
    path: selectedPrompt,
    content: prompts[selectedPrompt]
  } : null

  return (
    <div className="grid">
      <div className="card">
        <h2>Prompt Templates</h2>

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
                border: selectedPrompt === promptName ? '1px solid #667eea' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => handlePromptSelect(promptName)}
            >
              <span>{getFileIcon(promptName)}</span>
              <span>{promptName}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedFile && (
        <div className="card">
          <h2>Editing: {selectedFile.name}</h2>
          
          {selectedFile.path.includes('blueprints') ? (
            <BlueprintEditor
              file={selectedFile}
              onSave={handleSave}
              saving={saving}
            />
          ) : (selectedFile.path.includes('campaigns') || selectedFile.path.includes('brands') || selectedFile.path.includes('clients')) ? (
            <StructuredEditor
              file={selectedFile}
              onSave={handleSave}
              saving={saving}
            />
          ) : (
            <div>
              <VariableHighlightEditor
                value={editedContent}
                onChange={setEditedContent}
                placeholder={`Edit ${selectedFile.name}...`}
              />
              
              <div className="actions" style={{ marginTop: '2rem' }}>
                <button 
                  className="btn" 
                  onClick={() => handleSave()}
                  disabled={saving || editedContent === selectedFile.content}
                >
                  {saving ? 'Saving...' : 'Save Prompt'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigator.clipboard.writeText(editedContent)}
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedPromptsTab