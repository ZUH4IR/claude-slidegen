export interface LintRule {
  id: string
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  check: (content: string, context?: LintContext) => LintIssue[]
}

export interface LintContext {
  bannedWords?: string[]
  maxLineLength?: number
  isGlobalRules?: boolean
  isClient?: boolean
  isCampaign?: boolean
}

export interface LintIssue {
  ruleId: string
  severity: 'error' | 'warning' | 'info'
  message: string
  line?: number
  column?: number
  suggestion?: string
}

// Built-in lint rules
export const rules: LintRule[] = [
  {
    id: 'line-length',
    name: 'Line Length',
    description: 'Check for lines exceeding maximum length',
    severity: 'warning',
    check: (content: string, context?: LintContext) => {
      const maxLength = context?.maxLineLength || 120
      const issues: LintIssue[] = []
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        if (line.length > maxLength && !line.startsWith('#')) {
          issues.push({
            ruleId: 'line-length',
            severity: 'warning',
            message: `Line ${index + 1} exceeds ${maxLength} characters (${line.length} chars)`,
            line: index + 1,
            column: maxLength + 1,
            suggestion: 'Consider breaking this line into multiple lines'
          })
        }
      })
      
      return issues
    }
  },
  
  {
    id: 'banned-words',
    name: 'Banned Words',
    description: 'Check for banned words in content',
    severity: 'error',
    check: (content: string, context?: LintContext) => {
      const bannedWords = context?.bannedWords || []
      const issues: LintIssue[] = []
      const lines = content.split('\n')
      
      lines.forEach((line, lineIndex) => {
        bannedWords.forEach(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi')
          let match
          while ((match = regex.exec(line)) !== null) {
            issues.push({
              ruleId: 'banned-words',
              severity: 'error',
              message: `Banned word "${word}" found`,
              line: lineIndex + 1,
              column: match.index + 1,
              suggestion: `Remove or replace the word "${word}"`
            })
          }
        })
      })
      
      return issues
    }
  },
  
  {
    id: 'missing-headers',
    name: 'Missing Headers',
    description: 'Check for missing section headers',
    severity: 'info',
    check: (content: string) => {
      const issues: LintIssue[] = []
      const hasHeaders = content.includes('#')
      
      if (!hasHeaders && content.trim().length > 100) {
        issues.push({
          ruleId: 'missing-headers',
          severity: 'info',
          message: 'No section headers found',
          suggestion: 'Consider adding headers (# or ##) to organize content'
        })
      }
      
      return issues
    }
  },
  
  {
    id: 'variable-format',
    name: 'Variable Format',
    description: 'Check for malformed variables',
    severity: 'error',
    check: (content: string) => {
      const issues: LintIssue[] = []
      const lines = content.split('\n')
      
      // Check for single braces or mismatched braces
      lines.forEach((line, index) => {
        // Find single { or } not part of {{}}
        const singleBraceRegex = /(?<!\{)\{(?!\{)|(?<!\})\}(?!\})/g
        let match
        while ((match = singleBraceRegex.exec(line)) !== null) {
          issues.push({
            ruleId: 'variable-format',
            severity: 'error',
            message: 'Single brace found - variables should use double braces {{}}',
            line: index + 1,
            column: match.index + 1,
            suggestion: 'Use {{variable_name}} format for variables'
          })
        }
        
        // Check for unclosed variables
        const openCount = (line.match(/\{\{/g) || []).length
        const closeCount = (line.match(/\}\}/g) || []).length
        if (openCount !== closeCount) {
          issues.push({
            ruleId: 'variable-format',
            severity: 'error',
            message: 'Unclosed variable brackets',
            line: index + 1,
            suggestion: 'Make sure all {{ have matching }}'
          })
        }
      })
      
      return issues
    }
  },
  
  {
    id: 'trailing-whitespace',
    name: 'Trailing Whitespace',
    description: 'Check for trailing whitespace',
    severity: 'warning',
    check: (content: string) => {
      const issues: LintIssue[] = []
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        if (line.endsWith(' ') || line.endsWith('\t')) {
          issues.push({
            ruleId: 'trailing-whitespace',
            severity: 'warning',
            message: 'Trailing whitespace detected',
            line: index + 1,
            column: line.length,
            suggestion: 'Remove trailing spaces or tabs'
          })
        }
      })
      
      return issues
    }
  },
  
  {
    id: 'frontmatter-syntax',
    name: 'Frontmatter Syntax',
    description: 'Check for YAML frontmatter issues',
    severity: 'error',
    check: (content: string) => {
      const issues: LintIssue[] = []
      
      // Check if content starts with --- but doesn't have closing ---
      if (content.startsWith('---\n')) {
        const lines = content.split('\n')
        let foundClosing = false
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === '---') {
            foundClosing = true
            break
          }
        }
        
        if (!foundClosing) {
          issues.push({
            ruleId: 'frontmatter-syntax',
            severity: 'error',
            message: 'Unclosed YAML frontmatter',
            line: 1,
            suggestion: 'Add closing --- to end the frontmatter section'
          })
        }
      }
      
      return issues
    }
  },
  
  {
    id: 'empty-sections',
    name: 'Empty Sections',
    description: 'Check for empty ## sections',
    severity: 'warning',
    check: (content: string) => {
      const issues: LintIssue[] = []
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## ')) {
          // Check if next non-empty line is another header or end of file
          let hasContent = false
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim()) {
              if (!lines[j].startsWith('#')) {
                hasContent = true
              }
              break
            }
          }
          
          if (!hasContent) {
            issues.push({
              ruleId: 'empty-sections',
              severity: 'warning',
              message: `Empty section: ${lines[i]}`,
              line: i + 1,
              suggestion: 'Add content to this section or remove it'
            })
          }
        }
      }
      
      return issues
    }
  }
]

export function runLinter(content: string, context?: LintContext): LintIssue[] {
  const allIssues: LintIssue[] = []
  
  // Run all rules
  rules.forEach(rule => {
    const issues = rule.check(content, context)
    allIssues.push(...issues)
  })
  
  // Sort by line number, then by severity
  return allIssues.sort((a, b) => {
    if (a.line && b.line) {
      return a.line - b.line
    }
    const severityOrder = { error: 0, warning: 1, info: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

export function formatLintMessage(issue: LintIssue): string {
  let message = issue.message
  if (issue.line) {
    message = `Line ${issue.line}: ${message}`
  }
  if (issue.suggestion) {
    message += ` (${issue.suggestion})`
  }
  return message
}