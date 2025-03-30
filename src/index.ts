import type { EmojiConfig, EmojiPickerOptions } from './types'
import { EmojiPickerUI } from './ui'
import { parseConfig, enrichKeywords } from './parser'

interface EmojiKeywords {
  [emoji: string]: string
}

/**
 * EmojiPicker - A plugin for JavaScript text editors
 */
export class EmojiPicker {
  private ui?: EmojiPickerUI
  private config?: EmojiConfig
  private editor?: HTMLTextAreaElement | HTMLInputElement
  private keywords?: EmojiKeywords

  constructor() {
    // Initialize the picker
  }

  /**
   * Initialize the emoji picker with the given options
   */
  async init(options: EmojiPickerOptions): Promise<void> {
    const { editor, onSelect = () => {}, config } = options
    this.editor = editor

    try {
      // Use provided config or load default
      if (config) {
        this.config = typeof config === 'string' 
          ? parseConfig(config) as EmojiConfig 
          : config
      } else {
        console.log('Loading default config...')
        const response = await fetch('/src/config/emojis.yml')
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.statusText}`)
        }
        const yaml = await response.text()
        console.log('Loaded config:', yaml)
        this.config = parseConfig(yaml) as EmojiConfig
      }

      if (!this.config) {
        throw new Error('Failed to load emoji configuration')
      }

      // Load keywords
      console.log('Loading keywords...')
      const keywordsResponse = await fetch('/src/config/keywords.yml')
      if (!keywordsResponse.ok) {
        throw new Error(`Failed to load keywords: ${keywordsResponse.statusText}`)
      }
      const keywordsYaml = await keywordsResponse.text()
      const rawKeywords = parseConfig(keywordsYaml) as EmojiKeywords
      
      // Enrich keywords with category information
      this.keywords = enrichKeywords(rawKeywords, this.config)

      console.log('Parsed config:', this.config)
      console.log('Parsed keywords:', this.keywords)

      // Initialize UI
      this.ui = new EmojiPickerUI(this.config, onSelect, editor, this.keywords)
      console.log('UI initialized')
    } catch (error) {
      console.error('Failed to initialize EmojiPicker:', error)
      throw error
    }
  }

  /**
   * Mount the emoji picker to the specified element
   */
  mount(target: HTMLElement): void {
    if (!this.ui) {
      throw new Error('EmojiPicker not initialized. Call init() first.')
    }
    console.log('Mounting picker to target')
    this.ui.mount(target)
  }

  toggle(): void {
    if (!this.ui) {
      throw new Error('EmojiPicker not initialized. Call init() first.')
    }
    console.log('Toggle called')
    this.ui.toggle()
  }
} 