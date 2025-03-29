import type { EmojiConfig, EmojiPickerOptions } from './types'
import { EmojiPickerUI } from './ui'
import { parseConfig } from './parser'

/**
 * EmojiPicker - A plugin for JavaScript text editors
 */
export class EmojiPicker {
  private ui?: EmojiPickerUI
  private config?: EmojiConfig
  private editor?: HTMLTextAreaElement | HTMLInputElement

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
        this.config = typeof config === 'string' ? parseConfig(config) : config
      } else {
        console.log('Loading default config...')
        const response = await fetch('/src/config.yml')
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.statusText}`)
        }
        const yaml = await response.text()
        console.log('Loaded config:', yaml)
        this.config = parseConfig(yaml)
      }

      console.log('Parsed config:', this.config)

      // Initialize UI
      this.ui = new EmojiPickerUI(this.config, onSelect, editor)
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