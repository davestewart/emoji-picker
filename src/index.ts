import type { EmojiConfig, EmojiKeywords } from './plugin/types'
import defaultConfig from './config/emojis.json'
import defaultKeywords from './config/keywords.json'
import { EmojiPickerUI } from './plugin/ui'

export interface EmojiPickerOptions {
  emojis?: EmojiConfig
  keywords?: EmojiKeywords
  onSelect?: (emoji: string, options: { keepFocus: boolean }) => void
}

/**
 * EmojiPicker - A plugin for JavaScript text editors
 */
export class EmojiPicker {
  private config: EmojiConfig
  private keywords: EmojiKeywords
  private onSelect: (emoji: string, options: { keepFocus: boolean }) => void
  private container: HTMLElement | null = null
  private isVisible = true // Changed to true by default since we're not toggling in playground
  private ui: EmojiPickerUI | null = null
  private pickerElement: HTMLDivElement | null = null

  constructor() {
    console.log('Creating EmojiPicker with default config:', defaultConfig)
    if (!defaultConfig || typeof defaultConfig !== 'object') {
      console.error('Invalid default config:', defaultConfig)
      this.config = {}
    } else {
      this.config = defaultConfig
    }
    
    if (!defaultKeywords || typeof defaultKeywords !== 'object') {
      console.error('Invalid default keywords:', defaultKeywords)
      this.keywords = {}
    } else {
      this.keywords = defaultKeywords
    }
    
    this.onSelect = () => {}
  }

  /**
   * Initialize the emoji picker with configuration
   */
  async init(options: EmojiPickerOptions): Promise<void> {
    console.log('Initializing EmojiPicker with options:', options)
    if (options.emojis) {
      this.config = options.emojis
      console.log('Using provided emoji config')
    }
    if (options.keywords) {
      this.keywords = options.keywords
      console.log('Using provided keywords')
    }
    if (options.onSelect) {
      this.onSelect = options.onSelect
      console.log('Using provided onSelect callback')
    }

    // Create picker element once during initialization
    this.pickerElement = document.createElement('div')
    this.pickerElement.style.cssText = `
      position: relative;
      background: white;
      width: 100%;
      height: 100%;
      min-height: 400px;
      overflow: auto;
    `

    // Create UI instance once during initialization
    console.log('Creating EmojiPickerUI with config:', this.config)
    this.ui = new EmojiPickerUI(
      this.config,
      (emoji, options) => {
        this.onSelect(emoji, options)
        if (!options.keepFocus) {
          this.toggle()
        }
      },
      this.keywords
    )

    // Add keyboard event listener
    this.pickerElement.addEventListener('keydown', (e) => {
      if (this.ui) {
        this.ui.handleKeydown(e)
      }
    })
  }

  /**
   * Mount the picker to a container element
   */
  mount(container: HTMLElement): void {
    console.log('Mounting EmojiPicker to container:', container)
    this.container = container
    
    if (!this.pickerElement || !this.ui) {
      console.error('EmojiPicker not initialized. Call init() first.')
      return
    }

    // Clear container and append picker element
    this.container.innerHTML = ''
    this.container.appendChild(this.pickerElement)

    // Mount UI to picker element
    this.ui.mount(this.pickerElement)
    console.log('EmojiPicker mounted successfully')
  }

  /**
   * Unmount the picker from its container
   */
  destroy(): void {
    console.log('Destroying EmojiPicker')
    if (this.container) {
      this.container.innerHTML = ''
      this.container = null
    }
    this.ui = null
    this.pickerElement = null
  }

  /**
   * Toggle the picker's visibility
   */
  toggle(): void {
    this.isVisible = !this.isVisible
    if (this.container) {
      this.container.style.display = this.isVisible ? 'block' : 'none'
    }
  }
} 