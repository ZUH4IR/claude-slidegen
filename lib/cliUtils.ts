import fs from 'fs'
import path from 'path'
import Mustache from 'mustache'
import YAML from 'yaml'
import Anthropic from '@anthropic-ai/sdk'

// Blueprint utilities
function loadBlueprints() {
  const blueprintsPath = path.join(process.cwd(), 'prompts', 'blueprints.yaml')
  return YAML.parse(fs.readFileSync(blueprintsPath, 'utf8'))
}

export function getHeader(bpId: string): string {
  const blue = loadBlueprints()
  if (!blue[bpId]) throw new Error('unknown blueprint ' + bpId)
  const order = blue[bpId].order
  const cols = [
    'icp', 'hook_appeal', 'hook_top_text', 'hook_bottom_text', 'hook_image_query'
  ]
  order.slice(1).forEach((_: any, i: number) => {
    cols.push(`slide${i+2}_top_text`)
    cols.push(`slide${i+2}_bottom_text`)
    cols.push(`slide${i+2}_image_query`)
  })
  cols.push('caption')
  return cols.join(',')
}

// Prompt loading utilities
export function loadPrompt(promptPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'prompts', promptPath), 'utf8')
}

export function mergePrompts(engine: string, brand: string, campaign: string, ctx: any): string {
  const txt = engine + '\n\n' + brand + (campaign ? '\n\n' + campaign : '')
  return Mustache.render(txt, ctx)
}

// Claude API
const claude = new Anthropic({ 
  apiKey: process.env.ANTHROPIC_API_KEY || '' 
})

export async function callClaude(systemPrompt: string, userPrompt = 'Please follow the instructions in the system prompt.'): Promise<string> {
  const res = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: 4096,
  })
  return res.content[0].type === 'text' ? res.content[0].text.trim() : ''
}

// Validation
export function validateCSV(csv: string, expectedColumnCount: number): string[] {
  const errors: string[] = []
  
  if (!csv || csv.trim() === '') {
    errors.push('CSV is empty')
    return errors
  }
  
  // Extract just the CSV data (find lines that look like CSV)
  const lines = csv.trim().split('\n')
  const csvLines: string[] = []
  let foundCsv = false
  
  for (const line of lines) {
    // Check if line has enough commas to be CSV
    const commaCount = (line.match(/,/g) || []).length
    if (commaCount >= 10) { // Expecting many columns
      foundCsv = true
      csvLines.push(line)
    } else if (foundCsv && line.trim() !== '') {
      // If we found CSV but this line doesn't have commas, we might be in a quoted field
      csvLines.push(line)
    }
  }
  
  if (csvLines.length < 2) {
    errors.push('CSV must have at least a header row and one data row')
    return errors
  }
  
  // Simple CSV parsing (doesn't handle all edge cases but good enough)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    if (current) {
      result.push(current.trim())
    }
    
    return result
  }
  
  // Check header column count
  const headerColumns = parseCSVLine(csvLines[0]).length
  if (headerColumns !== expectedColumnCount) {
    errors.push(`Expected ${expectedColumnCount} columns, but found ${headerColumns}`)
  }
  
  // Basic validation for each row
  csvLines.slice(1).forEach((line, index) => {
    const columns = parseCSVLine(line).length
    if (columns !== expectedColumnCount) {
      errors.push(`Row ${index + 2}: Expected ${expectedColumnCount} columns, but found ${columns}`)
    }
  })
  
  return errors
}