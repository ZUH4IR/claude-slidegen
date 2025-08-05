'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, ChevronDown, ChevronRight, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JsonSchemaEditorProps {
  value: any
  onChange: (value: any) => void
  schema?: SchemaDefinition
  className?: string
}

interface SchemaDefinition {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    label?: string
    placeholder?: string
    description?: string
    required?: boolean
    default?: any
    options?: string[]
    min?: number
    max?: number
    itemType?: 'string' | 'number' | 'object'
  }
}

const DEFAULT_SCHEMA: SchemaDefinition = {
  version: { type: 'number', label: 'Version', default: 1, required: true },
  status: { type: 'string', label: 'Status', options: ['active', 'archived'], default: 'active' },
  description: { type: 'string', label: 'Description', placeholder: 'Brief description...' },
  client_voice: { type: 'string', label: 'Client Voice', placeholder: 'Brand voice and tone...' },
  integration_rule: { type: 'string', label: 'Integration Rule', placeholder: 'How to integrate product...' },
  image_buckets: { type: 'object', label: 'Image Buckets' },
  tone_strength: { type: 'number', label: 'Tone Strength', min: 0, max: 100, default: 80 },
  cta_variant: { type: 'string', label: 'CTA Variant', options: ['soft', 'medium', 'hard'], default: 'soft' },
  banned_words: { type: 'array', label: 'Banned Words', itemType: 'string' },
  audience: { type: 'string', label: 'Target Audience' },
  ragebait_intensity: { type: 'number', label: 'Ragebait Intensity', min: 0, max: 100 },
  campaign_notes: { type: 'string', label: 'Campaign Notes' },
  tracked_accounts: { type: 'array', label: 'Tracked Accounts', itemType: 'string' }
}

export function JsonSchemaEditor({ value = {}, onChange, schema = DEFAULT_SCHEMA, className }: JsonSchemaEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['required']))
  const [customFields, setCustomFields] = useState<{ key: string; value: any }[]>([])
  const [showRaw, setShowRaw] = useState(false)
  const [rawJson, setRawJson] = useState('')

  useEffect(() => {
    // Extract custom fields not in schema
    const schemaKeys = Object.keys(schema)
    const customEntries = Object.entries(value).filter(([key]) => !schemaKeys.includes(key))
    setCustomFields(customEntries.map(([key, val]) => ({ key, value: val })))
  }, [value, schema])

  const handleFieldChange = (key: string, val: any) => {
    onChange({ ...value, [key]: val })
  }

  const handleArrayChange = (key: string, index: number, val: string) => {
    const current = value[key] || []
    const updated = [...current]
    updated[index] = val
    handleFieldChange(key, updated)
  }

  const addArrayItem = (key: string) => {
    const current = value[key] || []
    handleFieldChange(key, [...current, ''])
  }

  const removeArrayItem = (key: string, index: number) => {
    const current = value[key] || []
    handleFieldChange(key, current.filter((_: any, i: number) => i !== index))
  }

  const handleObjectChange = (key: string, subKey: string, val: string) => {
    const current = value[key] || {}
    handleFieldChange(key, { ...current, [subKey]: val })
  }

  const addCustomField = () => {
    const newKey = `custom_${Date.now()}`
    setCustomFields([...customFields, { key: newKey, value: '' }])
    handleFieldChange(newKey, '')
  }

  const removeCustomField = (index: number) => {
    const field = customFields[index]
    const newValue = { ...value }
    delete newValue[field.key]
    onChange(newValue)
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (index: number, newKey: string, newValue: any) => {
    const oldKey = customFields[index].key
    const newCustomFields = [...customFields]
    newCustomFields[index] = { key: newKey, value: newValue }
    setCustomFields(newCustomFields)

    // Update the actual value object
    const newVal = { ...value }
    delete newVal[oldKey]
    newVal[newKey] = newValue
    onChange(newVal)
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const renderField = (key: string, config: any) => {
    const currentValue = value[key]

    switch (config.type) {
      case 'string':
        if (config.options) {
          return (
            <Select value={currentValue || config.default || ''} onValueChange={(val) => handleFieldChange(key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${config.label || key}...`} />
              </SelectTrigger>
              <SelectContent>
                {config.options.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        return key.includes('notes') || key.includes('voice') || key.includes('rule') ? (
          <Textarea
            value={currentValue || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={config.placeholder}
            className="min-h-[80px]"
          />
        ) : (
          <Input
            value={currentValue || ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={config.placeholder}
          />
        )

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue || config.default || 0}
              onChange={(e) => handleFieldChange(key, parseInt(e.target.value) || 0)}
              min={config.min}
              max={config.max}
              className="w-24"
            />
            {config.max && (
              <input
                type="range"
                value={currentValue || config.default || 0}
                onChange={(e) => handleFieldChange(key, parseInt(e.target.value))}
                min={config.min || 0}
                max={config.max}
                className="flex-1"
              />
            )}
            {config.max && <span className="text-sm text-muted-foreground w-12 text-right">{currentValue || config.default || 0}</span>}
          </div>
        )

      case 'boolean':
        return (
          <Switch
            checked={currentValue || false}
            onCheckedChange={(checked) => handleFieldChange(key, checked)}
          />
        )

      case 'array':
        const items = currentValue || []
        return (
          <div className="space-y-2">
            {items.map((item: any, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleArrayChange(key, index, e.target.value)}
                  placeholder={`Item ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem(key, index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(key)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {config.label || key}
            </Button>
          </div>
        )

      case 'object':
        const objValue = currentValue || {}
        return (
          <div className="space-y-2 ml-4">
            {Object.entries(objValue).map(([subKey, subVal]) => (
              <div key={subKey} className="flex gap-2">
                <Input
                  value={subKey}
                  onChange={(e) => {
                    const newObj = { ...objValue }
                    delete newObj[subKey]
                    newObj[e.target.value] = subVal
                    handleFieldChange(key, newObj)
                  }}
                  placeholder="Key"
                  className="w-1/3"
                />
                <Input
                  value={subVal as string}
                  onChange={(e) => handleObjectChange(key, subKey, e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newObj = { ...objValue }
                    delete newObj[subKey]
                    handleFieldChange(key, newObj)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleObjectChange(key, `key_${Date.now()}`, '')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        )
    }
  }

  // Group fields by required/optional
  const requiredFields = Object.entries(schema).filter(([_, config]) => config.required)
  const optionalFields = Object.entries(schema).filter(([_, config]) => !config.required)

  const handleRawJsonChange = (json: string) => {
    setRawJson(json)
    try {
      const parsed = JSON.parse(json)
      onChange(parsed)
    } catch (e) {
      // Invalid JSON, don't update
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>YAML Frontmatter</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowRaw(!showRaw)
              if (!showRaw) {
                setRawJson(JSON.stringify(value, null, 2))
              }
            }}
          >
            <Code className="h-4 w-4 mr-2" />
            {showRaw ? 'Schema' : 'JSON'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showRaw ? (
          <Textarea
            value={rawJson}
            onChange={(e) => handleRawJsonChange(e.target.value)}
            className="font-mono text-sm min-h-[400px]"
            placeholder="Enter valid JSON..."
          />
        ) : (
          <div className="space-y-6">
            {/* Required Fields */}
            {requiredFields.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('required')}
                  className="flex items-center gap-2 text-sm font-medium mb-4 hover:text-primary"
                >
                  {expandedSections.has('required') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Required Fields
                  <Badge variant="secondary" className="ml-2">{requiredFields.length}</Badge>
                </button>
                {expandedSections.has('required') && (
                  <div className="space-y-4">
                    {requiredFields.map(([key, config]) => (
                      <div key={key}>
                        <Label className="flex items-center gap-2">
                          {config.label || key}
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        </Label>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                        )}
                        {renderField(key, config)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Optional Fields */}
            {optionalFields.length > 0 && (
              <div>
                <button
                  onClick={() => toggleSection('optional')}
                  className="flex items-center gap-2 text-sm font-medium mb-4 hover:text-primary"
                >
                  {expandedSections.has('optional') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Optional Fields
                  <Badge variant="secondary" className="ml-2">{optionalFields.length}</Badge>
                </button>
                {expandedSections.has('optional') && (
                  <div className="space-y-4">
                    {optionalFields.map(([key, config]) => (
                      <div key={key}>
                        <Label>{config.label || key}</Label>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                        )}
                        {renderField(key, config)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom Fields */}
            <div>
              <button
                onClick={() => toggleSection('custom')}
                className="flex items-center gap-2 text-sm font-medium mb-4 hover:text-primary"
              >
                {expandedSections.has('custom') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Custom Fields
                <Badge variant="secondary" className="ml-2">{customFields.length}</Badge>
              </button>
              {expandedSections.has('custom') && (
                <div className="space-y-4">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={field.key}
                        onChange={(e) => updateCustomField(index, e.target.value, field.value)}
                        placeholder="Field name"
                        className="w-1/3"
                      />
                      <Input
                        value={field.value}
                        onChange={(e) => updateCustomField(index, field.key, e.target.value)}
                        placeholder="Field value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Field
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}