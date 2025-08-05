// Client-side types and utilities for scanVars
// This file contains only the types and client-safe functions

export interface Variable {
  key: string
  scope: 'global' | 'brand' | 'campaign'
  default: any
  override?: any
  file: string
}

export interface ScanResult {
  variables: Variable[]
  errors: string[]
}

// Get effective value for a variable (considering overrides)
export function getEffectiveValue(variable: Variable): any {
  return variable.override !== undefined ? variable.override : variable.default
}

// Extract variables from prompt text ({{variable_name}})
export function extractVarsFromPrompt(prompt: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const vars = new Set<string>()
  let match
  
  while ((match = regex.exec(prompt)) !== null) {
    vars.add(match[1].trim())
  }
  
  return Array.from(vars)
}