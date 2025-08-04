'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material'
import { Save, Refresh } from '@mui/icons-material'
import Editor from '@monaco-editor/react'
import { PromptFile } from '@/lib/types'
import BlueprintEditor from './BlueprintEditor'
import VariableHighlightEditor from './VariableHighlightEditor'
import StructuredEditor from './StructuredEditor'

export default function PromptsTab() {
  const [files, setFiles] = useState<PromptFile[]>([])
  const [selectedFile, setSelectedFile] = useState<PromptFile | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setFiles(data.files)
      setMessage(null)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load prompt files' })
    } finally {
      setLoading(false)
    }
  }

  const selectFile = (file: PromptFile) => {
    setSelectedFile(file)
    setEditedContent(file.content)
    setMessage(null)
  }

  const saveFile = async (content?: string) => {
    if (!selectedFile) return
    
    const contentToSave = content !== undefined ? content : editedContent
    
    setSaving(true)
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedFile.path,
          content: contentToSave
        })
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      // Update the file in state
      const updatedFiles = files.map(f => 
        f.path === selectedFile.path 
          ? { ...f, content: contentToSave }
          : f
      )
      setFiles(updatedFiles)
      setSelectedFile({ ...selectedFile, content: contentToSave })
      setEditedContent(contentToSave)
      
      setMessage({ type: 'success', text: 'File saved successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save file' })
    } finally {
      setSaving(false)
    }
  }

  const getFileLanguage = (path: string) => {
    if (path.endsWith('.md')) return 'markdown'
    if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml'
    return 'text'
  }

  const getFileIcon = (path: string) => {
    if (path.startsWith('brands/')) return '🏢'
    if (path.startsWith('campaigns/')) return '📢'
    if (path.includes('universal_engine')) return '⚙️'
    if (path.includes('blueprints')) return '📋'
    return '📄'
  }

  const hasUnsavedChanges = selectedFile && editedContent !== selectedFile.content

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Prompt Editor
      </Typography>
      
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ height: 'calc(100vh - 200px)' }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Prompt Files</Typography>
              <Button
                size="small"
                startIcon={<Refresh />}
                onClick={loadFiles}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                Refresh
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {files.map((file) => (
                  <ListItem key={file.path} disablePadding>
                    <ListItemButton
                      selected={selectedFile?.path === file.path}
                      onClick={() => selectFile(file)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{getFileIcon(file.path)}</span>
                            <span>{file.name}</span>
                            {selectedFile?.path === file.path && hasUnsavedChanges && (
                              <Chip size="small" label="Modified" color="warning" />
                            )}
                          </Box>
                        }
                        secondary={file.path}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {selectedFile ? (
              <>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Editing: {selectedFile.name}
                  </Typography>
                  {!selectedFile.path.includes('blueprints') && 
                   !selectedFile.path.includes('campaigns') && 
                   !selectedFile.path.includes('brands') && 
                   !selectedFile.path.includes('clients') && (
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={() => saveFile()}
                      disabled={saving || !hasUnsavedChanges}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {selectedFile.path.includes('blueprints') ? (
                    <BlueprintEditor
                      file={selectedFile}
                      onSave={saveFile}
                      saving={saving}
                    />
                  ) : (selectedFile.path.includes('campaigns') || selectedFile.path.includes('brands') || selectedFile.path.includes('clients')) ? (
                    <StructuredEditor
                      file={selectedFile}
                      onSave={saveFile}
                      saving={saving}
                    />
                  ) : (
                    <VariableHighlightEditor
                      value={editedContent}
                      onChange={setEditedContent}
                      language={getFileLanguage(selectedFile.path)}
                      placeholder={`Edit ${selectedFile.name}...`}
                    />
                  )}
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h6" color="text.secondary">
                  Select a file to edit
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}