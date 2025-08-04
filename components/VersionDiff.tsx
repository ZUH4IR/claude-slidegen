'use client'

interface Version {
  version: number
  content: string
  frontmatter: any
  status: string
  createdAt: string
}

interface VersionDiffProps {
  versions: Version[]
  currentVersion: number
}

export function VersionDiff({ versions, currentVersion }: VersionDiffProps) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">Version comparison is temporarily unavailable.</p>
      <p className="text-sm mt-2">Current version: {currentVersion}</p>
      <p className="text-sm">Total versions: {versions.length}</p>
    </div>
  )
}