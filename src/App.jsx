import React, { useState } from 'react'
import { FileText, Settings, History as HistoryIcon, Play, Edit3 } from 'lucide-react'
import Generator from './components/Generator'
import EnhancedPromptsTab from './components/EnhancedPromptsTab'
import History from './components/History'

function App() {
  const [activeView, setActiveView] = useState('generator')
  const [generatedData, setGeneratedData] = useState(null)

  const navItems = [
    { id: 'generator', label: 'Generator', icon: Play, description: 'Generate slide copy' },
    { id: 'prompts', label: 'Prompts', icon: Edit3, description: 'Edit prompt templates' },
    { id: 'history', label: 'History', icon: HistoryIcon, description: 'View version history' }
  ]

  const renderActiveView = () => {
    switch (activeView) {
      case 'generator':
        return <Generator onDataGenerated={setGeneratedData} generatedData={generatedData} />
      case 'prompts':
        return <EnhancedPromptsTab />
      case 'history':
        return <History />
      default:
        return <Generator onDataGenerated={setGeneratedData} generatedData={generatedData} />
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="nav-section">
          <h1 className="title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            SlideGen
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            TikTok-style copy generator
          </p>
        </div>

        <div className="nav-section">
          <h3>Tools</h3>
          <div className="list">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon size={18} />
                  <div>
                    <div>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      {item.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* Main Content */}
      <div className="main-content">
        {renderActiveView()}
      </div>
      
      {/* Quick Stats - Sticky Bottom Left */}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 100
      }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Quick Stats
        </div>
        <div style={{ marginBottom: '0.25rem' }}>
          Clients: 2 (vibit, pupscan)
        </div>
        <div style={{ marginBottom: '0.25rem' }}>
          Prompts: 4 active
        </div>
        <div>
          Last generated: {generatedData ? 'Just now' : 'Never'}
        </div>
      </div>
    </div>
  )
}

export default App 