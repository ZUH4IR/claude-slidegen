import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'

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

const META_KEYS = ['version', 'status', 'description', 'clientName', 'campaignName']

export async function scanVars(
  client?: string,
  campaign?: string
): Promise<ScanResult> {
  const variables: Record<string, Variable> = {}
  const errors: string[] = []

  try {
    // Scan global files
    const globalDir = path.join(process.cwd(), 'prompts', 'global')
    try {
      const globalFiles = await fs.readdir(globalDir)
      for (const file of globalFiles) {
        if (file.endsWith('.md')) {
          const filePath = path.join(globalDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const { data } = matter(content)
          
          Object.entries(data).forEach(([key, value]) => {
            if (!META_KEYS.includes(key)) {
              variables[key] = {
                key,
                scope: 'global',
                default: value,
                file: `global/${file}`
              }
            }
          })
        }
      }
    } catch (err) {
      errors.push(`Failed to scan global directory: ${err}`)
    }

    // Scan brand files if client specified (skip if client is 'global')
    if (client && client !== 'global') {
      const clientDir = path.join(process.cwd(), 'prompts', 'clients', client)
      try {
        const files = await fs.readdir(clientDir)
        const brandFile = files.find(f => f.startsWith('_brand_v') && f.endsWith('.md'))
        
        if (brandFile) {
          const filePath = path.join(clientDir, brandFile)
          const content = await fs.readFile(filePath, 'utf-8')
          const { data } = matter(content)
          
          Object.entries(data).forEach(([key, value]) => {
            if (!META_KEYS.includes(key)) {
              if (variables[key]) {
                // Override global variable
                variables[key].override = value
              } else {
                variables[key] = {
                  key,
                  scope: 'brand',
                  default: value,
                  file: `clients/${client}/${brandFile}`
                }
              }
            }
          })
        }
      } catch (err) {
        errors.push(`Failed to scan client directory: ${err}`)
      }

      // Scan campaign file if specified
      if (campaign && client !== 'global') {
        try {
          const files = await fs.readdir(clientDir)
          const campaignFile = files.find(f => f.startsWith(`${campaign}_v`) && f.endsWith('.md'))
          
          if (campaignFile) {
            const filePath = path.join(clientDir, campaignFile)
            const content = await fs.readFile(filePath, 'utf-8')
            const { data } = matter(content)
            
            Object.entries(data).forEach(([key, value]) => {
              if (!META_KEYS.includes(key)) {
                if (variables[key]) {
                  // Override brand or global variable
                  variables[key].override = value
                } else {
                  variables[key] = {
                    key,
                    scope: 'campaign',
                    default: value,
                    file: `clients/${client}/${campaignFile}`
                  }
                }
              }
            })
          }
        } catch (err) {
          errors.push(`Failed to scan campaign file: ${err}`)
        }
      }
    }

    return {
      variables: Object.values(variables),
      errors
    }
  } catch (err) {
    return {
      variables: [],
      errors: [`Failed to scan variables: ${err}`]
    }
  }
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

// Get effective value for a variable (considering overrides)
export function getEffectiveValue(variable: Variable): any {
  return variable.override !== undefined ? variable.override : variable.default
}