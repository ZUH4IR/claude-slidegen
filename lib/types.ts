export interface GenerationConfig {
  brandSlug: string
  campSlug: string
  blueprint: string
  rows: number
  persona: string
  hookAppeal: string
  topic: string
  charCapHook: number
  addSelfAwareJoke: boolean
  productSlide: number
}

export interface PromptFile {
  name: string
  path: string
  content: string
}

export interface GenerationResult {
  hooks: string[]
  csv?: string
  errors?: string[]
}