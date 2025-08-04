'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material'
import {
  ContentCopy,
  Download,
  Edit,
  Delete,
  Add,
} from '@mui/icons-material'
import { GenerationConfig, GenerationResult } from '@/lib/types'

interface PromptOptions {
  brands: string[]
  campaigns: string[]
  blueprints: string[]
}

export default function GeneratorTab() {
  const [config, setConfig] = useState<GenerationConfig>({
    brandSlug: 'vibit',
    campSlug: 'none',
    blueprint: 'story_6',
    rows: 2,
    persona: 'older',
    hookAppeal: 'drama',
    topic: 'doctor said never run again but i proved him wrong',
    charCapHook: 95,
    addSelfAwareJoke: true,
    productSlide: 5,
  })
  
  const [options, setOptions] = useState<PromptOptions>({
    brands: [],
    campaigns: [],
    blueprints: []
  })
  
  const [hooks, setHooks] = useState<string[]>([])
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'config' | 'hooks' | 'csv'>('config')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/prompts')
      const data = await response.json()
      setOptions({
        brands: data.brands,
        campaigns: ['none', ...data.campaigns],
        blueprints: data.blueprints
      })
    } catch (err) {
      setError('Failed to load options')
    }
  }

  const generateHooks = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/generate/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setHooks(data.hooks)
      setStep('hooks')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate hooks')
    } finally {
      setLoading(false)
    }
  }

  const generateCSV = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/generate/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, hooks })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setResult(data)
      setStep('csv')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate CSV')
    } finally {
      setLoading(false)
    }
  }

  const updateHook = (index: number, value: string) => {
    const newHooks = [...hooks]
    newHooks[index] = value
    setHooks(newHooks)
  }

  const addHook = () => {
    setHooks([...hooks, ''])
  }

  const removeHook = (index: number) => {
    setHooks(hooks.filter((_, i) => i !== index))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadCSV = () => {
    if (!result?.csv) return
    const blob = new Blob([result.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slidegen-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetToConfig = () => {
    setStep('config')
    setHooks([])
    setResult(null)
    setError('')
  }

  if (step === 'config') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Generation Configuration
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Basic Settings</Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={config.brandSlug}
                  onChange={(e) => setConfig({ ...config, brandSlug: e.target.value })}
                >
                  {options.brands.map(brand => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Campaign</InputLabel>
                <Select
                  value={config.campSlug}
                  onChange={(e) => setConfig({ ...config, campSlug: e.target.value })}
                >
                  {options.campaigns.map(campaign => (
                    <MenuItem key={campaign} value={campaign}>{campaign}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Blueprint</InputLabel>
                <Select
                  value={config.blueprint}
                  onChange={(e) => setConfig({ ...config, blueprint: e.target.value })}
                >
                  {options.blueprints.map(blueprint => (
                    <MenuItem key={blueprint} value={blueprint}>{blueprint}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Topic"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                sx={{ mb: 2 }}
                multiline
                rows={2}
              />
              
              <TextField
                fullWidth
                label="Persona"
                value={config.persona}
                onChange={(e) => setConfig({ ...config, persona: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Hook Appeal"
                value={config.hookAppeal}
                onChange={(e) => setConfig({ ...config, hookAppeal: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Advanced Settings</Typography>
              
              <Typography gutterBottom>Rows: {config.rows}</Typography>
              <Slider
                value={config.rows}
                onChange={(_, value) => setConfig({ ...config, rows: value as number })}
                min={1}
                max={15}
                marks
                sx={{ mb: 3 }}
              />
              
              <Typography gutterBottom>Hook Character Cap: {config.charCapHook}</Typography>
              <Slider
                value={config.charCapHook}
                onChange={(_, value) => setConfig({ ...config, charCapHook: value as number })}
                min={40}
                max={120}
                sx={{ mb: 3 }}
              />
              
              <Typography gutterBottom>Product Slide: {config.productSlide}</Typography>
              <Slider
                value={config.productSlide}
                onChange={(_, value) => setConfig({ ...config, productSlide: value as number })}
                min={4}
                max={6}
                marks
                sx={{ mb: 3 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.addSelfAwareJoke}
                    onChange={(e) => setConfig({ ...config, addSelfAwareJoke: e.target.checked })}
                  />
                }
                label="Add Self-Aware Joke"
              />
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={generateHooks}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Generating...' : 'Generate Hooks'}
          </Button>
        </Box>
      </Box>
    )
  }
  
  if (step === 'hooks') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Edit Hooks
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Paper sx={{ p: 3, mb: 3 }}>
          {hooks.map((hook, index) => (
            <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <TextField
                fullWidth
                label={`Hook ${index + 1}`}
                value={hook}
                onChange={(e) => updateHook(index, e.target.value)}
                multiline
                rows={2}
                helperText={`${hook.length}/${config.charCapHook} characters`}
                error={hook.length > config.charCapHook}
              />
              <IconButton color="error" onClick={() => removeHook(index)}>
                <Delete />
              </IconButton>
            </Box>
          ))}
          
          <Button startIcon={<Add />} onClick={addHook} sx={{ mt: 1 }}>
            Add Hook
          </Button>
        </Paper>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={resetToConfig}>
            Back to Config
          </Button>
          <Button
            variant="contained"
            onClick={generateCSV}
            disabled={loading || hooks.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Generating...' : 'Generate CSV'}
          </Button>
        </Box>
      </Box>
    )
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Generated CSV
      </Typography>
      
      {result?.errors && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Validation errors: {result.errors.join(', ')}
        </Alert>
      )}
      
      {!result?.errors && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ CSV validation passed!
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">CSV Output</Typography>
          <Box>
            <IconButton onClick={() => copyToClipboard(result?.csv || '')}>
              <ContentCopy />
            </IconButton>
            <IconButton onClick={downloadCSV}>
              <Download />
            </IconButton>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={20}
          value={result?.csv || ''}
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
          }}
        />
      </Paper>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={resetToConfig}>
          Start Over
        </Button>
        <Button variant="outlined" onClick={() => setStep('hooks')}>
          Edit Hooks
        </Button>
      </Box>
    </Box>
  )
}