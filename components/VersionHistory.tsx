'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, GitBranch, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ReactDiffViewer from 'react-diff-viewer-continued'

interface Version {
  hash: string
  message: string
  date: string
  author: string
}

interface VersionHistoryProps {
  brand: string
  campaign?: string
  onClose: () => void
}

export function VersionHistory({ brand, campaign, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [diffData, setDiffData] = useState<{ old: string; new: string } | null>(null)

  useEffect(() => {
    loadVersions()
  }, [brand, campaign])

  const loadVersions = async () => {
    try {
      const res = await fetch('/api/prompts/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, campaign })
      })
      const data = await res.json()
      setVersions(data.versions)
    } catch (err) {
      console.error('Failed to load versions:', err)
    }
  }

  const showVersionDiff = async (hash: string) => {
    try {
      const res = await fetch('/api/prompts/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, campaign, hash })
      })
      const data = await res.json()
      setDiffData(data)
      setSelectedVersion(hash)
      setShowDiff(true)
    } catch (err) {
      console.error('Failed to load diff:', err)
    }
  }

  const restoreVersion = async (hash: string) => {
    try {
      await fetch('/api/prompts/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, campaign, hash })
      })
      onClose()
    } catch (err) {
      console.error('Failed to restore version:', err)
    }
  }

  return (
    <Card className="h-full rounded-none border-0 border-l">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          <CardTitle>Version History</CardTitle>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.map((version) => (
          <div
            key={version.hash}
            className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
            onClick={() => showVersionDiff(version.hash)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">{version.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(version.date).toLocaleString()}</span>
                  <span>•</span>
                  <span>{version.author}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Dialog open={showDiff} onOpenChange={setShowDiff}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Version Diff</DialogTitle>
            </DialogHeader>
            {diffData && (
              <div className="overflow-auto">
                <ReactDiffViewer
                  oldValue={diffData.old}
                  newValue={diffData.new}
                  splitView={false}
                  useDarkTheme={false}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDiff(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => selectedVersion && restoreVersion(selectedVersion)}>
                    Restore This Version
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}