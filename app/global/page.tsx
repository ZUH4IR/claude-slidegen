'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, FileText, Shield } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { useToast } from '@/hooks/use-toast'

export default function GlobalRulesPage() {
  const { toast } = useToast()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadGlobalRules()
  }, [])

  const loadGlobalRules = async () => {
    try {
      const res = await fetch('/api/global-rules')
      const data = await res.json()
      setContent(data.content || '')
      setOriginalContent(data.content || '')
    } catch (err) {
      console.error('Failed to load global rules:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveGlobalRules = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/global-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      
      if (res.ok) {
        setOriginalContent(content)
        toast({
          title: 'Saved',
          description: 'Global rules have been updated successfully'
        })
      }
    } catch (err) {
      console.error('Failed to save global rules:', err)
      toast({
        title: 'Error',
        description: 'Failed to save global rules',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = content !== originalContent

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading global rules...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Global Rules</h1>
        </div>
        <p className="text-muted-foreground">
          Define rules that apply to all generated content across all brands and campaigns
        </p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                global-rules.md
              </CardTitle>
              <CardDescription>
                These rules are prepended to every prompt when generating content
              </CardDescription>
            </div>
            <Button
              onClick={saveGlobalRules}
              disabled={!hasChanges || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <CodeMirror
            value={content}
            height="100%"
            theme={undefined}
            extensions={[markdown()]}
            onChange={(val) => setContent(val)}
            className="h-full"
          />
        </CardContent>
      </Card>
    </div>
  )
}