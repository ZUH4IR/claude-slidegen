import React, { useState, useEffect } from 'react'
import { Clock, GitBranch, Eye, FileText, ArrowRight } from 'lucide-react'

const History = () => {
  const [prompts, setPrompts] = useState({})
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [compareVersions, setCompareVersions] = useState({ from: null, to: null })
  const [showDiff, setShowDiff] = useState(false)

  // Mock history data
  useEffect(() => {
    const mockPrompts = {
      'clients/vibit/_brand_v1.md': {
        versions: [
          { 
            version: 'v1', 
            content: '# VIBIT Brand Voice\n\n## Core Values\n- Professional yet approachable\n- Focus on health and wellness transformation\n- Emphasize proven results and scientific backing\n- Target audience: health-conscious individuals 25-55\n\n## Tone Guidelines\n- Encouraging and supportive\n- Evidence-based claims\n- Avoid medical advice\n- Use "you" to create connection\n\n## Banned Words\n- "miracle"\n- "instant"\n- "guaranteed"\n- "cure"', 
            active: false, 
            created: '2024-01-15',
            author: 'PM Team',
            changes: 'Initial brand voice guidelines'
          },
          { 
            version: 'v2', 
            content: '# VIBIT Brand Voice v2\n\n## Core Values\n- Professional yet approachable\n- Focus on health and wellness transformation\n- Emphasize proven results and scientific backing\n- Target audience: health-conscious individuals 25-55\n\n## Tone Guidelines\n- Encouraging and supportive\n- Evidence-based claims\n- Avoid medical advice\n- Use "you" to create connection\n- Add personal stories when appropriate\n\n## Banned Words\n- "miracle"\n- "instant"\n- "guaranteed"\n- "cure"\n- "magic"', 
            active: false, 
            created: '2024-01-20',
            author: 'Sarah M.',
            changes: 'Added personal stories guideline, banned "magic"'
          },
          { 
            version: 'v3', 
            content: '# VIBIT Brand Voice v3\n\n## Core Values\n- Professional yet approachable and relatable\n- Focus on health and wellness transformation\n- Emphasize proven results and scientific backing\n- Target audience: health-conscious individuals 25-55\n\n## Tone Guidelines\n- Encouraging and supportive\n- Evidence-based claims\n- Avoid medical advice\n- Use "you" to create personal connection\n- Add personal stories when appropriate\n- Include social proof and testimonials\n\n## Banned Words\n- "miracle"\n- "instant"\n- "guaranteed"\n- "cure"\n- "magic"\n- "secret"\n\n## Approved Phrases\n- "science-backed"\n- "clinically proven"\n- "evidence-based"\n- "real results"', 
            active: true, 
            created: '2024-01-25',
            author: 'Marketing Team',
            changes: 'Added social proof guidelines, more banned words, approved phrases'
          }
        ]
      },
      'clients/vibit/older_v1.md': {
        versions: [
          { 
            version: 'v1', 
            content: '# Older Persona Campaign\n\n## Target Demographics\n- Age: 40+ years\n- Focus on health concerns and mobility\n- Emphasize proven, safe results\n- Address common fears about starting fitness\n\n## Messaging Focus\n- "It\'s never too late to start"\n- Gentle, encouraging approach\n- Highlight success stories from similar demographics\n- Emphasize gradual progress over dramatic changes', 
            active: false, 
            created: '2024-01-15',
            author: 'Content Team',
            changes: 'Initial older persona targeting'
          },
          { 
            version: 'v2', 
            content: '# Older Persona Campaign v2\n\n## Target Demographics\n- Age: 40+ years\n- Focus on health concerns and mobility\n- Emphasize proven, safe results\n- Address common fears about starting fitness\n- Consider joint health and low-impact options\n\n## Messaging Focus\n- "It\'s never too late to start"\n- Gentle, encouraging approach\n- Highlight success stories from similar demographics\n- Emphasize gradual progress over dramatic changes\n- Address age-specific concerns directly\n- Use mature, respectful language\n\n## Content Themes\n- Recovery and rehabilitation\n- Maintaining independence\n- Staying active with family\n- Preventing age-related decline', 
            active: true, 
            created: '2024-01-22',
            author: 'Sarah M.',
            changes: 'Added joint health focus, content themes, age-specific messaging'
          }
        ]
      }
    }
    setPrompts(mockPrompts)
  }, [])

  const handlePromptSelect = (promptPath) => {
    setSelectedPrompt(promptPath)
    setCompareVersions({ from: null, to: null })
    setShowDiff(false)
  }

  const handleCompareVersions = () => {
    if (compareVersions.from && compareVersions.to) {
      setShowDiff(true)
    }
  }

  const generateDiff = (oldText, newText) => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const diff = []
    
    const maxLines = Math.max(oldLines.length, newLines.length)
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || ''
      const newLine = newLines[i] || ''
      
      if (oldLine === newLine) {
        diff.push({ type: 'unchanged', oldLine, newLine, lineNum: i + 1 })
      } else if (oldLine && !newLine) {
        diff.push({ type: 'removed', oldLine, newLine: '', lineNum: i + 1 })
      } else if (!oldLine && newLine) {
        diff.push({ type: 'added', oldLine: '', newLine, lineNum: i + 1 })
      } else {
        diff.push({ type: 'changed', oldLine, newLine, lineNum: i + 1 })
      }
    }
    
    return diff
  }

  const selectedPromptData = selectedPrompt ? prompts[selectedPrompt] : null
  const fromVersion = selectedPromptData?.versions.find(v => v.version === compareVersions.from)
  const toVersion = selectedPromptData?.versions.find(v => v.version === compareVersions.to)
  const diff = (fromVersion && toVersion) ? generateDiff(fromVersion.content, toVersion.content) : []

  return (
    <div>
      <div className="title">Version History</div>
      <div className="subtitle">
        View version history and compare changes across prompt templates
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                Prompt Files
              </div>
              <div className="card-description">
                Select a file to view its history
              </div>
            </div>
            <div className="card-body">
              <div className="list">
                {Object.keys(prompts).map(path => {
                  const prompt = prompts[path]
                  const fileName = path.split('/').pop()
                  const activeVersion = prompt.versions.find(v => v.active)
                  
                  return (
                    <div
                      key={path}
                      className={`list-item ${selectedPrompt === path ? 'selected' : ''}`}
                      onClick={() => handlePromptSelect(path)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {fileName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {activeVersion?.version} • {prompt.versions.length} versions
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div>
          {selectedPrompt ? (
            <>
              {/* Version Timeline */}
              <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="card-header">
                  <div className="card-title">
                    <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Version Timeline: {selectedPrompt}
                  </div>
                  <div className="card-description">
                    History of changes and versions
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {selectedPromptData?.versions.slice().reverse().map((version, index) => (
                      <div 
                        key={version.version}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          background: version.active ? 'var(--success-light)' : 'var(--bg-secondary)',
                          border: `1px solid ${version.active ? 'var(--success)' : 'var(--border-primary)'}`,
                          borderRadius: '0.5rem'
                        }}
                      >
                        <div style={{ 
                          width: '2rem', 
                          height: '2rem', 
                          borderRadius: '50%', 
                          background: version.active ? 'var(--success)' : 'var(--accent-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {version.version}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600 }}>{version.version}</span>
                            {version.active && (
                              <span className="status-success" style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}>
                                Active
                              </span>
                            )}
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              by {version.author}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            {version.created}
                          </div>
                          <div style={{ fontSize: '0.875rem' }}>
                            {version.changes}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setCompareVersions(prev => ({ ...prev, from: version.version }))}
                          >
                            <Eye size={14} />
                            From
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setCompareVersions(prev => ({ ...prev, to: version.version }))}
                          >
                            <ArrowRight size={14} />
                            To
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Version Comparison */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <GitBranch size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Compare Versions
                  </div>
                  <div className="card-description">
                    Select two versions to see the differences
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">From Version</label>
                      <select
                        className="form-select"
                        value={compareVersions.from || ''}
                        onChange={(e) => setCompareVersions(prev => ({ ...prev, from: e.target.value }))}
                      >
                        <option value="">Select version...</option>
                        {selectedPromptData?.versions.map(version => (
                          <option key={version.version} value={version.version}>
                            {version.version} ({version.created})
                          </option>
                        ))}
                      </select>
                    </div>

                    <ArrowRight size={20} style={{ color: 'var(--text-tertiary)' }} />

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">To Version</label>
                      <select
                        className="form-select"
                        value={compareVersions.to || ''}
                        onChange={(e) => setCompareVersions(prev => ({ ...prev, to: e.target.value }))}
                      >
                        <option value="">Select version...</option>
                        {selectedPromptData?.versions.map(version => (
                          <option key={version.version} value={version.version}>
                            {version.version} ({version.created})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleCompareVersions}
                      disabled={!compareVersions.from || !compareVersions.to}
                    >
                      <Eye size={16} />
                      Compare
                    </button>
                  </div>

                  {showDiff && diff.length > 0 && (
                    <div style={{ 
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr',
                        background: 'var(--bg-tertiary)',
                        padding: '0.75rem',
                        borderBottom: '1px solid var(--border-primary)',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        <div>
                          {compareVersions.from} ({fromVersion?.created})
                        </div>
                        <div>
                          {compareVersions.to} ({toVersion?.created})
                        </div>
                      </div>
                      
                      <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                        {diff.map((line, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              fontSize: '0.875rem',
                              fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                              borderBottom: '1px solid var(--border-primary)',
                              background: 
                                line.type === 'added' ? 'rgba(16, 185, 129, 0.1)' :
                                line.type === 'removed' ? 'rgba(239, 68, 68, 0.1)' :
                                line.type === 'changed' ? 'rgba(245, 158, 11, 0.1)' :
                                'transparent'
                            }}
                          >
                            <div style={{ 
                              padding: '0.5rem',
                              borderRight: '1px solid var(--border-primary)',
                              color: line.type === 'removed' || line.type === 'changed' ? 'var(--error)' : 'inherit'
                            }}>
                              {line.oldLine}
                            </div>
                            <div style={{ 
                              padding: '0.5rem',
                              color: line.type === 'added' || line.type === 'changed' ? 'var(--success)' : 'inherit'
                            }}>
                              {line.newLine}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
                <Clock size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                <div className="card-title">Select a Prompt File</div>
                <div className="card-description">
                  Choose a prompt from the sidebar to view its version history
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default History 