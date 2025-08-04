import React, { useState, useEffect } from 'react'
import { Save, Plus, FileText, Eye, Edit3, Clock, GitCompare, ChevronDown, ChevronRight, Sparkles, Folder, X, Upload, Send, Copy } from 'lucide-react'
import promptStore from '../utils/promptStore'

const PromptEditor = () => {
  const [prompts, setPrompts] = useState({})
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [editedContent, setEditedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [compareVersion, setCompareVersion] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  const [previewVariables, setPreviewVariables] = useState({
    brand_name: 'vibit',
    blueprint_id: 'story_6',
    csv_header: 'hook_top_text,slide1_top,slide1_bottom...',
    rows: 3,
    persona: 'older',
    topic: 'doctor said never run again but i proved him wrong',
    hook_appeal: 'drama',
    char_cap_hook: 95,
    hooks: ['hook 1 example', 'hook 2 example', 'hook 3 example']
  })
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiMessages, setAiMessages] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [uploadedCsv, setUploadedCsv] = useState(null)
  const [showPromptChain, setShowPromptChain] = useState(false)

  // Load prompts from shared store
  useEffect(() => {
    const updatePrompts = (storePrompts) => {
      setPrompts(storePrompts || promptStore.getPrompts())
    }
    
    updatePrompts()
    
    // Subscribe to prompt store changes
    const unsubscribe = promptStore.subscribe(updatePrompts)
    return unsubscribe
  }, [])

  const handlePromptSelect = (promptPath) => {
    setSelectedPrompt(promptPath)
    const prompt = prompts[promptPath]
    if (prompt) {
      const activeVersion = prompt.versions.find(v => v.active) || prompt.versions[0]
      setSelectedVersion(activeVersion.version)
      setEditedContent(activeVersion.content)
      
      // Auto-detect brand from path
      const parts = promptPath.split('/')
      if (parts[1] === 'clients' && parts[2]) {
        const client = parts[2]
        const campaignFile = parts[3]?.replace(/_(v\d+)?\.md$/, '')
        const campaign = campaignFile === '_brand' ? 'brand' : campaignFile
        
        setPreviewVariables(prev => ({
          ...prev,
          brand_name: client,
          persona: campaign || prev.persona
        }))
      }
    }
  }

  const handleVersionSelect = (version) => {
    setSelectedVersion(version)
    const prompt = prompts[selectedPrompt]
    const versionData = prompt.versions.find(v => v.version === version)
    if (versionData) {
      setEditedContent(versionData.content)
    }
  }

  const handleSave = async () => {
    if (!selectedPrompt) return
    
    setSaving(true)
    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Use the prompt store to update the prompt
      promptStore.updatePrompt(selectedPrompt, editedContent)
      
      // Get the updated prompt data
      const updatedPrompts = promptStore.getPrompts()
      const updatedPrompt = updatedPrompts[selectedPrompt]
      const newVersion = updatedPrompt.versions.find(v => v.active)
      
      setSelectedVersion(newVersion.version)
      
    } catch (error) {
      console.error('Error saving prompt:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleNewPrompt = () => {
    const name = prompt('Enter prompt name (e.g., clients/newclient/campaign_v1.md):')
    if (name) {
      // Ensure the path starts with 'prompts/'
      const fullPath = name.startsWith('prompts/') ? name : `prompts/${name}`
      
      const defaultContent = '# New Prompt\n\nEnter your prompt content here...\n\n## Available Variables\n- {{ brand_name }}\n- {{ blueprint_id }}\n- {{ csv_header }}\n- {{ rows }}\n- {{ persona }}\n- {{ topic }}\n- {{ hook_appeal }}'
      
      // Use promptStore to create the new prompt
      promptStore.updatePrompt(fullPath, defaultContent)
      
      // Select the new prompt
      setSelectedPrompt(fullPath)
      setSelectedVersion('v1')
      setEditedContent(defaultContent)
    }
  }

  const getPromptsByCategory = () => {
    const organized = {
      universal: [],
      formats: [],
      clients: {}
    }
    
    Object.keys(prompts).forEach(path => {
      const parts = path.split('/')
      
      // Skip 'prompts/' prefix if present
      const cleanParts = parts[0] === 'prompts' ? parts.slice(1) : parts
      
      if (cleanParts[0] === 'global') {
        organized.universal.push(path)
      } else if (cleanParts[0] === 'blueprints' || path.includes('blueprint') || path.includes('.yaml')) {
        organized.formats.push(path)
      } else if (cleanParts[0] === 'clients' && cleanParts.length >= 3) {
        const client = cleanParts[1]
        if (!organized.clients[client]) {
          organized.clients[client] = {
            brand: null,
            campaigns: []
          }
        }
        
        const fileName = cleanParts[2]
        if (fileName.startsWith('_brand')) {
          organized.clients[client].brand = path
        } else {
          organized.clients[client].campaigns.push(path)
        }
      }
    })
    
    return organized
  }
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Create diff between two versions
  const createDiff = (oldContent, newContent) => {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const diff = []
    
    let oldIndex = 0
    let newIndex = 0
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex < oldLines.length && newIndex < newLines.length) {
        if (oldLines[oldIndex] === newLines[newIndex]) {
          // Same line
          diff.push({ type: 'same', content: oldLines[oldIndex], oldLine: oldIndex + 1, newLine: newIndex + 1 })
          oldIndex++
          newIndex++
        } else {
          // Check if it's a modification or addition/deletion
          let foundMatch = false
          
          // Look ahead to see if old line appears later in new content
          for (let i = newIndex + 1; i < Math.min(newIndex + 5, newLines.length); i++) {
            if (oldLines[oldIndex] === newLines[i]) {
              // Lines were added
              for (let j = newIndex; j < i; j++) {
                diff.push({ type: 'added', content: newLines[j], newLine: j + 1 })
              }
              diff.push({ type: 'same', content: oldLines[oldIndex], oldLine: oldIndex + 1, newLine: i + 1 })
              newIndex = i + 1
              oldIndex++
              foundMatch = true
              break
            }
          }
          
          if (!foundMatch) {
            // Look ahead to see if new line appears later in old content
            for (let i = oldIndex + 1; i < Math.min(oldIndex + 5, oldLines.length); i++) {
              if (newLines[newIndex] === oldLines[i]) {
                // Lines were removed
                for (let j = oldIndex; j < i; j++) {
                  diff.push({ type: 'removed', content: oldLines[j], oldLine: j + 1 })
                }
                diff.push({ type: 'same', content: newLines[newIndex], oldLine: i + 1, newLine: newIndex + 1 })
                oldIndex = i + 1
                newIndex++
                foundMatch = true
                break
              }
            }
          }
          
          if (!foundMatch) {
            // Modified line
            diff.push({ type: 'removed', content: oldLines[oldIndex], oldLine: oldIndex + 1 })
            diff.push({ type: 'added', content: newLines[newIndex], newLine: newIndex + 1 })
            oldIndex++
            newIndex++
          }
        }
      } else if (oldIndex < oldLines.length) {
        // Remaining old lines (removed)
        diff.push({ type: 'removed', content: oldLines[oldIndex], oldLine: oldIndex + 1 })
        oldIndex++
      } else {
        // Remaining new lines (added)
        diff.push({ type: 'added', content: newLines[newIndex], newLine: newIndex + 1 })
        newIndex++
      }
    }
    
    return diff
  }

  const handleAiImprove = () => {
    if (!selectedPrompt || !editedContent) return
    
    // Get full context for AI
    const context = getPromptContext()
    
    // Initialize chat with context
    setAiMessages([
      {
        role: 'system',
        content: `You are helping improve prompts for a TikTok-style CSV generation system. Current context:\n\n${context}\n\nThe user can provide example CSVs they like, and you should help improve the prompts to generate similar quality content.`
      },
      {
        role: 'assistant',
        content: `I'll help you improve this prompt. I have access to:
- Universal engine rules
- ${getClientFromPath(selectedPrompt)} brand voice guidelines
- Current prompt content

What would you like to improve? You can also upload an example CSV that you like, and I'll help adjust the prompts to generate similar content.`
      }
    ])
    
    setShowAiModal(true)
  }
  
  const getClientFromPath = (path) => {
    const parts = path.split('/')
    if (parts[1] === 'clients' && parts[2]) {
      return parts[2]
    }
    return 'global'
  }
  
  const getPromptContext = () => {
    if (!selectedPrompt) return ''
    
    const parts = selectedPrompt.split('/')
    let context = '### Current Prompt ###\n' + editedContent + '\n\n'
    
    // Add universal engine context
    const universalPrompt = prompts['prompts/global/universal_engine_v1.md']
    if (universalPrompt) {
      const activeVersion = universalPrompt.versions.find(v => v.active)
      if (activeVersion) {
        context += '### Universal Engine ###\n' + activeVersion.content + '\n\n'
      }
    }
    
    // Add brand voice context if editing a client prompt
    if (parts[1] === 'clients' && parts[2]) {
      const brandPath = `prompts/clients/${parts[2]}/_brand_v1.md`
      const brandPrompt = prompts[brandPath]
      if (brandPrompt) {
        const activeVersion = brandPrompt.versions.find(v => v.active)
        if (activeVersion) {
          context += `### ${parts[2]} Brand Voice ###\n` + activeVersion.content + '\n\n'
        }
      }
    }
    
    return context
  }
  
  const handleAiChat = async () => {
    if (!aiInput.trim()) return
    
    const userMessage = { role: 'user', content: aiInput }
    setAiMessages(prev => [...prev, userMessage])
    setAiInput('')
    setAiProcessing(true)
    
    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock AI response with improvements
      const improvedContent = editedContent + '\n\n## AI Improvements\n- Enhanced emotional appeal\n- Better brand alignment\n- Stronger hook structure'
      
      const aiResponse = {
        role: 'assistant',
        content: `Based on your request, here's an improved version:\n\n\`\`\`markdown\n${improvedContent}\n\`\`\`\n\n## Changes Made:\n- Added more emotional triggers for ${previewVariables.hook_appeal} appeal\n- Incorporated ${getClientFromPath(selectedPrompt)} brand-specific language\n- Enhanced clarity and flow\n- Strengthened call-to-action elements\n\nWould you like me to apply these changes or make further adjustments?`,
        improvedContent: improvedContent
      }
      
      setAiMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error in AI chat:', error)
    } finally {
      setAiProcessing(false)
    }
  }
  
  const handleCsvUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedCsv(e.target.result)
        const csvContent = e.target.result
        const lines = csvContent.split('\n')
        const preview = lines.length > 10 
          ? lines.slice(0, 10).join('\n') + '\n...(showing first 10 rows)'
          : csvContent
          
        setAiInput(`I've uploaded a CSV example with ${lines.length} rows. Please analyze it and suggest how to improve my prompts to generate similar quality content:\n\n\`\`\`csv\n${preview}\n\`\`\``)
        
        // Store full CSV for context
        setUploadedCsv(csvContent)
      }
      reader.readAsText(file)
    }
  }
  
  const getFullPromptChain = () => {
    const chain = []
    
    // 1. Selected Blueprint Template
    const blueprintPath = `prompts/blueprints/${previewVariables.blueprint_id}.md`
    const blueprintPrompt = prompts[blueprintPath]
    if (blueprintPrompt) {
      const activeVersion = blueprintPrompt.versions?.find(v => v.active) || blueprintPrompt.versions?.[0]
      if (activeVersion) {
        chain.push({
          title: `${previewVariables.blueprint_id} Blueprint Template`,
          path: blueprintPath,
          content: activeVersion.content,
          type: 'format'
        })
      }
    }
    
    // 2. Universal Engine
    const universalPrompt = prompts['prompts/global/universal_engine_v1.md']
    if (universalPrompt) {
      const activeVersion = universalPrompt.versions?.find(v => v.active) || universalPrompt.versions?.[0]
      if (activeVersion) {
        chain.push({
          title: 'Universal Engine Rules',
          path: 'prompts/global/universal_engine_v1.md',
          content: activeVersion.content,
          type: 'universal'
        })
      }
    }
    
    // 3. Brand Voice (if editing a client prompt)
    if (selectedPrompt) {
      const parts = selectedPrompt.split('/')
      if (parts[1] === 'clients' && parts[2]) {
        const brandPath = `prompts/clients/${parts[2]}/_brand_v1.md`
        const brandPrompt = prompts[brandPath]
        if (brandPrompt) {
          const activeVersion = brandPrompt.versions?.find(v => v.active) || brandPrompt.versions?.[0]
          if (activeVersion) {
            chain.push({
              title: `${parts[2]} Brand Voice`,
              path: brandPath,
              content: activeVersion.content,
              type: 'brand'
            })
          }
        }
      }
    }
    
    // 4. Current Prompt (Campaign or other)
    if (selectedPrompt && editedContent) {
      const parts = selectedPrompt.split('/')
      const fileName = parts[parts.length - 1].replace('.md', '').replace('_v1', '')
      chain.push({
        title: `${fileName} (Current)`,
        path: selectedPrompt,
        content: editedContent,
        type: 'current'
      })
    }
    
    return chain
  }
  
  const highlightVariables = (text) => {
    if (!text) return text
    
    // Color code different types of variables
    return text
      .replace(/{{\s*brand_name\s*}}/g, '<span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{ brand_name }}</span>')
      .replace(/{{\s*blueprint_id\s*}}/g, '<span style="background: #9333ea; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{ blueprint_id }}</span>')
      .replace(/{{\s*topic\s*}}/g, '<span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{ topic }}</span>')
      .replace(/{{\s*persona\s*}}/g, '<span style="background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{ persona }}</span>')
      .replace(/{{\s*hook_appeal\s*}}/g, '<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{ hook_appeal }}</span>')
      .replace(/{{\s*(csv_header|rows|char_cap_hook)\s*}}/g, '<span style="background: #6b7280; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{ $1 }}</span>')
      .replace(/{{\s*#(\w+)\s*}}/g, '<span style="background: #14b8a6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{#$1}}</span>')
      .replace(/{{\s*\/(\w+)\s*}}/g, '<span style="background: #14b8a6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{/$1}}</span>')
      .replace(/{{\s*\\\^(\w+)\s*}}/g, '<span style="background: #14b8a6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{^$1}}</span>')
      .replace(/{{\s*\.\s*}}/g, '<span style="background: #14b8a6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 600;">{{.}}</span>')
  }
  
  const getPreviewContent = () => {
    if (!editedContent) return ''
    
    let preview = editedContent
    
    // Replace variables with preview values
    Object.entries(previewVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      if (Array.isArray(value)) {
        preview = preview.replace(regex, value.join(', '))
      } else {
        preview = preview.replace(regex, value)
      }
    })
    
    // Handle conditional sections
    if (previewVariables.hooks && previewVariables.hooks.length > 0) {
      // Replace {{#hooks}} sections
      preview = preview.replace(/{{#hooks}}([\s\S]*?){{\/hooks}}/g, (match, content) => {
        return previewVariables.hooks.map(hook => content.replace(/{{\.}}/g, hook)).join('\n')
      })
      // Remove {{^hooks}} sections
      preview = preview.replace(/{{\\^hooks}}[\s\S]*?{{\/hooks}}/g, '')
    } else {
      // Remove {{#hooks}} sections
      preview = preview.replace(/{{#hooks}}[\s\S]*?{{\/hooks}}/g, '')
      // Show {{^hooks}} sections
      preview = preview.replace(/{{\\^hooks}}([\s\S]*?){{\/hooks}}/g, '$1')
    }
    
    return preview
  }

  const promptCategories = getPromptsByCategory()
  const selectedPromptData = selectedPrompt ? prompts[selectedPrompt] : null
  const currentVersion = selectedPromptData?.versions.find(v => v.version === selectedVersion)

  return (
    <div>
      <div className="title">Prompt Editor</div>
      <div className="subtitle">
        Edit prompt templates with WYSIWYG editor and version control
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', maxWidth: '100%', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Prompt Library</div>
              <button 
                className="btn btn-secondary"
                onClick={handleNewPrompt}
                style={{ padding: '0.5rem', fontSize: '0.75rem' }}
              >
                <Plus size={14} />
                New
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {/* Universal Prompts */}
              {promptCategories.universal.length > 0 && (
                <div style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => toggleSection('universal')}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {expandedSections.universal ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <FileText size={16} />
                    <span style={{ fontWeight: 600 }}>Universal Engine</span>
                  </button>
                  {expandedSections.universal && (
                    <div style={{ padding: '0 1rem 0.75rem 2.5rem' }}>
                      {promptCategories.universal.map(path => {
                        const prompt = prompts[path]
                        const activeVersion = prompt?.versions?.find(v => v.active)
                        const fileName = path.split('/').pop()
                        
                        return (
                          <div
                            key={path}
                            className={`list-item ${selectedPrompt === path ? 'selected' : ''}`}
                            onClick={() => handlePromptSelect(path)}
                            style={{ marginBottom: '0.25rem' }}
                          >
                            <div style={{ fontSize: '0.875rem' }}>{fileName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                              {activeVersion?.version} • {prompt?.versions?.length || 0} versions
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Client Prompts */}
              {Object.entries(promptCategories.clients).map(([client, clientData]) => (
                <div key={client} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => toggleSection(client)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {expandedSections[client] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Folder size={16} />
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{client}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                      {1 + clientData.campaigns.length} prompts
                    </span>
                  </button>
                  {expandedSections[client] && (
                    <div style={{ padding: '0 1rem 0.75rem 2.5rem' }}>
                      {/* Brand Voice */}
                      {clientData.brand && (
                        <div
                          className={`list-item ${selectedPrompt === clientData.brand ? 'selected' : ''}`}
                          onClick={() => handlePromptSelect(clientData.brand)}
                          style={{ marginBottom: '0.5rem' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                              width: '8px', 
                              height: '8px', 
                              background: 'var(--primary)', 
                              borderRadius: '50%' 
                            }} />
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Brand Voice</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                Core brand guidelines
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Campaigns */}
                      {clientData.campaigns.map(path => {
                        const prompt = prompts[path]
                        const activeVersion = prompt?.versions?.find(v => v.active)
                        const fileName = path.split('/').pop().replace('_v1.md', '')
                        
                        return (
                          <div
                            key={path}
                            className={`list-item ${selectedPrompt === path ? 'selected' : ''}`}
                            onClick={() => handlePromptSelect(path)}
                            style={{ marginBottom: '0.25rem' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ 
                                width: '8px', 
                                height: '8px', 
                                border: '1px solid var(--border)', 
                                borderRadius: '50%' 
                              }} />
                              <div>
                                <div style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                                  {fileName} Campaign
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                  {activeVersion?.version} • {prompt?.versions?.length || 0} versions
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Formats */}
              {promptCategories.formats.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('formats')}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {expandedSections.formats ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <FileText size={16} />
                    <span style={{ fontWeight: 600 }}>Formats</span>
                  </button>
                  {expandedSections.formats && (
                    <div style={{ padding: '0 1rem 0.75rem 2.5rem' }}>
                      {promptCategories.formats.map(path => {
                        const prompt = prompts[path]
                        const fileName = path.split('/').pop()
                        
                        return (
                          <div
                            key={path}
                            className={`list-item ${selectedPrompt === path ? 'selected' : ''}`}
                            onClick={() => handlePromptSelect(path)}
                            style={{ marginBottom: '0.25rem' }}
                          >
                            <div style={{ fontSize: '0.875rem' }}>{fileName}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor */}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          {selectedPrompt ? (
            <>
              {/* Version Selector */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-body" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
                      <label className="form-label">Version</label>
                      <select
                        className="form-select"
                        value={selectedVersion || ''}
                        onChange={(e) => handleVersionSelect(e.target.value)}
                      >
                        {selectedPromptData?.versions.map(version => (
                          <option key={version.version} value={version.version}>
                            {version.version} {version.active ? '(active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {currentVersion && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Created: {currentVersion.created}
                      </div>
                    )}
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={handleAiImprove}
                      >
                        <Sparkles size={16} />
                        AI Improve
                      </button>
                      <button
                        className={`btn ${showDiff ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowDiff(!showDiff)}
                      >
                        <GitCompare size={16} />
                        {showDiff ? 'Hide Diff' : 'Show History'}
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save as New Version'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version History Diff */}
              {showDiff && selectedPromptData && selectedPromptData.versions.length > 1 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-header">
                    <div className="card-title">Version History</div>
                    <div className="card-description">
                      Compare versions to see what changed
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
                        <label className="form-label">Compare from</label>
                        <select
                          className="form-select"
                          value={compareVersion || ''}
                          onChange={(e) => setCompareVersion(e.target.value)}
                        >
                          <option value="">Select version...</option>
                          {selectedPromptData.versions
                            .filter(v => v.version !== selectedVersion)
                            .map(version => (
                              <option key={version.version} value={version.version}>
                                {version.version} ({version.created})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', alignSelf: 'end', paddingBottom: '0.5rem' }}>
                        to <strong>{selectedVersion}</strong>
                      </div>
                    </div>

                    {compareVersion && (() => {
                      const oldVersion = selectedPromptData.versions.find(v => v.version === compareVersion)
                      const newVersion = selectedPromptData.versions.find(v => v.version === selectedVersion)
                      const diff = createDiff(oldVersion.content, newVersion.content)
                      
                      return (
                        <div style={{
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}>
                            <div style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '2px' }}></div>
                              {compareVersion}
                            </div>
                            <div style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <div style={{ width: '12px', height: '12px', background: '#28a745', borderRadius: '2px' }}></div>
                              {selectedVersion}
                            </div>
                          </div>
                          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                            {diff.map((line, index) => (
                              <div
                                key={index}
                                style={{
                                  display: 'flex',
                                  backgroundColor: 
                                    line.type === 'added' ? '#d4edda' :
                                    line.type === 'removed' ? '#f8d7da' : 
                                    'transparent',
                                  borderLeft: 
                                    line.type === 'added' ? '3px solid #28a745' :
                                    line.type === 'removed' ? '3px solid #dc3545' : 
                                    '3px solid transparent'
                                }}
                              >
                                <div style={{
                                  width: '60px',
                                  padding: '0.25rem 0.5rem',
                                  color: 'var(--text-tertiary)',
                                  fontSize: '0.75rem',
                                  textAlign: 'right',
                                  borderRight: '1px solid var(--border)',
                                  background: 'var(--bg-secondary)'
                                }}>
                                  {line.type === 'removed' ? line.oldLine : 
                                   line.type === 'added' ? line.newLine :
                                   line.oldLine}
                                </div>
                                <div style={{
                                  padding: '0.25rem 0.75rem',
                                  flex: 1,
                                  whiteSpace: 'pre',
                                  color: 
                                    line.type === 'added' ? '#155724' :
                                    line.type === 'removed' ? '#721c24' : 
                                    'var(--text-primary)'
                                }}>
                                  {line.type === 'added' && '+ '}
                                  {line.type === 'removed' && '- '}
                                  {line.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Editor */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Edit3 size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    {selectedPrompt}
                  </div>
                  <div className="card-description">
                    Editing {selectedVersion} • Use Markdown syntax
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Editor */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Raw Editor</label>
                      <textarea
                        className="form-textarea"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        style={{ 
                          minHeight: '400px',
                          fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                          fontSize: '0.875rem'
                        }}
                        placeholder="Enter your prompt content here..."
                      />
                    </div>
                    
                    {/* Variable-highlighted preview */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Variables Highlighted</label>
                      <div
                        style={{
                          minHeight: '400px',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem',
                          padding: '0.875rem',
                          fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                          fontSize: '0.875rem',
                          background: 'var(--bg-secondary)',
                          overflow: 'auto',
                          whiteSpace: 'pre-wrap'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlightVariables(editedContent).replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt Preview with Variables */}
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header">
                  <div style={{ flex: 1 }}>
                    <div className="card-title">
                      <Eye size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                      Live Preview
                    </div>
                    <div className="card-description">
                      See how your prompt looks with variables filled
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowPromptChain(true)}
                    style={{ fontSize: '0.875rem' }}
                  >
                    Show Full Prompt Chain
                  </button>
                </div>
                <div className="card-body">
                  {/* Variable Controls */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Preview Variables</h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1rem' 
                    }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Brand Name</label>
                        <input
                          className="form-input"
                          value={previewVariables.brand_name}
                          onChange={(e) => setPreviewVariables(prev => ({ ...prev, brand_name: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Blueprint</label>
                        <select
                          className="form-select"
                          value={previewVariables.blueprint_id}
                          onChange={(e) => setPreviewVariables(prev => ({ ...prev, blueprint_id: e.target.value }))}
                        >
                          <option value="story_6">story_6</option>
                          <option value="tutorial_5">tutorial_5</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Hook Appeal</label>
                        <select
                          className="form-select"
                          value={previewVariables.hook_appeal}
                          onChange={(e) => setPreviewVariables(prev => ({ ...prev, hook_appeal: e.target.value }))}
                        >
                          <option value="drama">drama</option>
                          <option value="curiosity">curiosity</option>
                          <option value="fear">fear</option>
                          <option value="desire">desire</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Character Limit</label>
                        <input
                          type="number"
                          className="form-input"
                          value={previewVariables.char_cap_hook}
                          onChange={(e) => setPreviewVariables(prev => ({ ...prev, char_cap_hook: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                      <label className="form-label">Topic</label>
                      <textarea
                        className="form-textarea"
                        value={previewVariables.topic}
                        onChange={(e) => setPreviewVariables(prev => ({ ...prev, topic: e.target.value }))}
                        style={{ minHeight: '60px' }}
                      />
                    </div>
                  </div>

                  {/* Preview Output */}
                  <div>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Rendered Output</h4>
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      {getPreviewContent() || 'Select a prompt to see preview...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Variables Reference */}
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-header">
                  <div className="card-title">Variable Reference</div>
                  <div className="card-description">
                    Available template variables
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <strong>Core Variables:</strong>
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                        <li><code>{'{{ brand_name }}'}</code></li>
                        <li><code>{'{{ blueprint_id }}'}</code></li>
                        <li><code>{'{{ csv_header }}'}</code></li>
                        <li><code>{'{{ rows }}'}</code></li>
                      </ul>
                    </div>
                    <div>
                      <strong>Content Variables:</strong>
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                        <li><code>{'{{ persona }}'}</code></li>
                        <li><code>{'{{ topic }}'}</code></li>
                        <li><code>{'{{ hook_appeal }}'}</code></li>
                        <li><code>{'{{ char_cap_hook }}'}</code></li>
                      </ul>
                    </div>
                    <div>
                      <strong>Conditionals:</strong>
                      <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                        <li><code>{'{{#hooks}}...{{/hooks}}'}</code></li>
                        <li><code>{'{{^hooks}}...{{/hooks}}'}</code></li>
                        <li><code>{'{{#if mode}}...{{/if}}'}</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
                <FileText size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                <div className="card-title">Select a Prompt</div>
                <div className="card-description">
                  Choose a prompt from the sidebar to start editing
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Improvement Modal */}
      {showAiModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            width: '90%',
            maxWidth: '800px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Sparkles size={24} />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>AI Prompt Improvement</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Chat with AI to improve your prompt. Upload example CSVs for better context.
                </p>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {aiMessages.filter(m => m.role !== 'system').map((message, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: message.role === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {message.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div style={{
                    background: message.role === 'user' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    maxWidth: '70%'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    {message.improvedContent && (
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: '1rem', fontSize: '0.875rem' }}
                        onClick={() => {
                          setEditedContent(message.improvedContent)
                          setShowAiModal(false)
                        }}
                      >
                        Apply Changes to Prompt
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {aiProcessing && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    AI
                  </div>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: '0.75rem'
                  }}>
                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '1rem'
            }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <Upload size={16} />
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  style={{ display: 'none' }}
                />
              </label>
              
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Ask AI how to improve your prompt..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAiChat()
                  }
                }}
                disabled={aiProcessing}
              />
              
              <button
                className="btn btn-primary"
                onClick={handleAiChat}
                disabled={!aiInput.trim() || aiProcessing}
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Prompt Chain Modal */}
      {showPromptChain && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            width: '90%',
            maxWidth: '1000px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <Folder size={24} />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Full Prompt Chain</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Shows how prompts are layered and merged for generation
                </p>
              </div>
              <button
                onClick={() => setShowPromptChain(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Chain Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
              {getFullPromptChain().map((item, index) => (
                <div key={index} style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 
                        item.type === 'format' ? '#9333ea' :
                        item.type === 'universal' ? '#3b82f6' :
                        item.type === 'brand' ? '#10b981' :
                        '#f59e0b',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{item.title}</h3>
                      <p style={{ 
                        margin: '0.25rem 0 0 0', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-tertiary)',
                        fontFamily: 'monospace'
                      }}>
                        {item.path}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflow: 'auto',
                    marginLeft: '3rem'
                  }}>
                    {item.content}
                  </div>
                  
                  {index < getFullPromptChain().length - 1 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '1.5rem 0',
                      color: 'var(--text-tertiary)'
                    }}>
                      <div style={{
                        width: '2px',
                        height: '30px',
                        background: 'var(--border)',
                        marginLeft: '1rem'
                      }} />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Final Merged Result */}
              <div style={{
                marginTop: '3rem',
                padding: '1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                border: '2px solid var(--primary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={20} />
                    Final Merged Prompt (with variables)
                  </h3>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const fullText = getFullPromptChain()
                        .map(item => `## ${item.title}\n\n${item.content}`)
                        .join('\n\n---\n\n')
                      navigator.clipboard.writeText(fullText)
                    }}
                    style={{ fontSize: '0.875rem' }}
                  >
                    <Copy size={16} />
                    Copy Full Chain
                  </button>
                </div>
                <div style={{
                  fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '400px',
                  overflow: 'auto',
                  padding: '1rem',
                  background: 'var(--bg-primary)',
                  borderRadius: '0.5rem'
                }}>
                  {getFullPromptChain()
                    .map(item => item.content)
                    .join('\n\n---\n\n')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromptEditor 