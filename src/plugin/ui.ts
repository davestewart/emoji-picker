import type { EmojiConfig, EmojiData } from './types'
import { splitEmojis } from './parser'

/**
 * Handles the search functionality for emojis
 */
class EmojiSearch {
  private input: HTMLInputElement
  private onSearch: (filter: string) => void

  constructor(onSearch: (filter: string) => void) {
    this.onSearch = onSearch
    this.input = this.createSearchInput()
  }

  private createSearchInput(): HTMLInputElement {
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Search emojis...'
    input.style.cssText = `
      box-sizing: border-box;
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      outline: none;
    `

    input.addEventListener('input', () => {
      this.onSearch(input.value.toLowerCase())
    })

    return input
  }

  getElement(): HTMLInputElement {
    return this.input
  }

  focus(): void {
    this.input.focus()
  }

  getValue(): string {
    return this.input.value
  }

  setValue(value: string): void {
    this.input.value = value
  }
}

/**
 * Handles the emoji grid and keyboard navigation
 */
class EmojiView {
  private container: HTMLDivElement
  private config: EmojiConfig
  private onEmojiSelect: (emoji: string, keepOpen: boolean) => void
  private lastChosenEmoji: string | null = null
  private keywords: Record<string, string>
  private currentFilter = ''
  private emojiButtons: HTMLButtonElement[] = []
  private highlightedIndex = -1

  constructor(
    config: EmojiConfig,
    onEmojiSelect: (emoji: string, keepOpen: boolean) => void,
    keywords?: Record<string, string>
  ) {
    console.log('Creating EmojiView with config:', config)
    this.config = config
    this.onEmojiSelect = onEmojiSelect
    this.keywords = keywords || {}
    this.container = this.createContainer()
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.classList.add('emoji-grid-container')
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    `
    return container
  }

  render(): void {
    console.log('Rendering EmojiView')
    this.container.innerHTML = ''
    this.emojiButtons = []
    
    let hasVisibleEmojis = false
    
    for (const [category, data] of Object.entries(this.config)) {
      const categoryContent = this.renderCategoryRecursive(category, data, 0)
      if (categoryContent) {
        this.container.appendChild(categoryContent)
        hasVisibleEmojis = true
      }
    }

    if (!hasVisibleEmojis) {
      const noResultsElement = document.createElement('div')
      noResultsElement.textContent = 'No emojis found for that filter'
      noResultsElement.style.cssText = `
        text-align: center;
        padding: 1rem;
        color: #666;
        font-style: italic;
      `
      this.container.appendChild(noResultsElement)
    }
  }

  private renderCategoryRecursive(name: string, data: EmojiData, level: number): HTMLElement | null {
    const container = document.createElement('div')
    container.classList.add('emoji-category')
    
    let hasContent = false
    
    // Create category header with appropriate indentation
    const header = document.createElement('div')
    header.classList.add('emoji-category-header')
    header.textContent = name
    header.style.cssText = `
      font-weight: ${level === 0 ? 'bold' : 'normal'};
      font-size: ${level === 0 ? '1rem' : '0.9rem'};
      background: ${level === 0 ? '#f5f5f5' : 'transparent'};
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      color: #333;
      margin-left: ${level * 12}px;
    `
    container.appendChild(header)
    
    // Create grid for the emojis
    const emojiGrid = document.createElement('div')
    emojiGrid.classList.add('emoji-grid')
    emojiGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
      gap: 4px;
      padding: 4px;
      margin-left: ${(level + 1) * 12}px;
    `
    
    // Process the data
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // This is a leaf node with emojis
        const emojis = splitEmojis(value)
        const filteredEmojis = this.filterEmojisArray(emojis)
        
        if (filteredEmojis.length > 0) {
          hasContent = true
          for (const emoji of filteredEmojis) {
            const button = this.createEmojiButton(emoji)
            emojiGrid.appendChild(button)
            this.emojiButtons.push(button)
          }
        }
      } else {
        // This is a nested category
        const nestedCategory = this.renderCategoryRecursive(key, value, level + 1)
        if (nestedCategory) {
          hasContent = true
          container.appendChild(nestedCategory)
        }
      }
    }
    
    // Only add the emoji grid if it has content
    if (emojiGrid.children.length > 0) {
      container.appendChild(emojiGrid)
    }
    
    return hasContent ? container : null
  }

  private filterEmojisArray(emojis: string[]): string[] {
    if (!this.currentFilter) return emojis
    
    return emojis.filter(emoji => {
      const name = this.keywords[emoji]?.toLowerCase() || ''
      return name.includes(this.currentFilter)
    })
  }

  private createEmojiButton(emoji: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = emoji
    button.title = (this.keywords[emoji] || '').split(',').shift() || ''
    button.style.cssText = `
      font-size: 1.2rem;
      padding: 0.15rem;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
      line-height: 1;
      vertical-align: middle;
      outline: none;
      width: 100%;
      height: 100%;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#f0f0f0'
      this.highlightedIndex = this.emojiButtons.indexOf(button)
    })
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = 'transparent'
    })
    
    button.addEventListener('click', (e) => {
      e.preventDefault()
      const keepOpen = e.metaKey || e.ctrlKey
      this.lastChosenEmoji = emoji
      this.onEmojiSelect(emoji, keepOpen)
    })

    // Add focus styles
    button.addEventListener('focus', () => {
      button.style.backgroundColor = '#e0e0e0'
      button.style.boxShadow = '0 0 0 2px #007bff'
      this.highlightedIndex = this.emojiButtons.indexOf(button)
    })
    
    button.addEventListener('blur', () => {
      button.style.backgroundColor = 'transparent'
      button.style.boxShadow = 'none'
    })

    return button
  }

  handleKeydown(e: KeyboardEvent): void {
    if (this.emojiButtons.length === 0) return
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        this.navigateButtons(1)
        break
        
      case 'ArrowLeft':
        e.preventDefault()
        this.navigateButtons(-1)
        break
        
      case 'ArrowDown':
        e.preventDefault()
        // Estimate number of columns based on container width
        const containerWidth = this.container.clientWidth
        const buttonWidth = 32 // Min width of emoji buttons
        const estimatedColumns = Math.floor(containerWidth / buttonWidth)
        this.navigateButtons(Math.max(estimatedColumns, 8))
        break
        
      case 'ArrowUp':
        e.preventDefault()
        const containerWidth2 = this.container.clientWidth
        const buttonWidth2 = 32
        const estimatedColumns2 = Math.floor(containerWidth2 / buttonWidth2)
        this.navigateButtons(-Math.max(estimatedColumns2, 8))
        break
        
      case 'Enter':
        e.preventDefault()
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.emojiButtons.length) {
          const button = this.emojiButtons[this.highlightedIndex]
          const emoji = button.textContent || ''
          const keepOpen = e.metaKey || e.ctrlKey
          this.lastChosenEmoji = emoji
          this.onEmojiSelect(emoji, keepOpen)
        }
        break
        
      case ' ':
        e.preventDefault()
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.emojiButtons.length) {
          const button = this.emojiButtons[this.highlightedIndex]
          const emoji = button.textContent || ''
          this.lastChosenEmoji = emoji
          this.onEmojiSelect(emoji, true)
        }
        break
    }
  }

  private navigateButtons(step: number): void {
    if (this.emojiButtons.length === 0) return
    
    // If nothing is highlighted, start from beginning
    if (this.highlightedIndex < 0 || this.highlightedIndex >= this.emojiButtons.length) {
      this.highlightedIndex = 0
    } else {
      this.highlightedIndex = (this.highlightedIndex + step + this.emojiButtons.length) % this.emojiButtons.length
    }
    
    const buttonToFocus = this.emojiButtons[this.highlightedIndex]
    if (buttonToFocus) {
      buttonToFocus.focus()
      
      // Ensure the button is in view
      buttonToFocus.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  getLastChosenEmoji(): string | null {
    return this.lastChosenEmoji
  }

  focusLastChosenEmoji(): void {
    if (this.emojiButtons.length === 0) return
    
    if (!this.lastChosenEmoji) {
      // If no last chosen emoji, focus the first button
      this.highlightedIndex = 0
      this.emojiButtons[0]?.focus()
      return
    }

    // Find and focus the last chosen emoji button
    const lastChosenIndex = this.emojiButtons.findIndex(button => button.textContent === this.lastChosenEmoji)
    if (lastChosenIndex >= 0) {
      this.highlightedIndex = lastChosenIndex
      this.emojiButtons[lastChosenIndex].focus()
    } else {
      // If not found, focus the first button
      this.highlightedIndex = 0
      this.emojiButtons[0]?.focus()
    }
  }

  filterEmojis(filter: string): void {
    console.log('Filtering emojis with:', filter)
    this.currentFilter = filter.toLowerCase()
    this.render()
  }
}

/**
 * Main UI component that handles the emoji grid and search functionality
 */
export class EmojiPickerUI {
  private view: EmojiView
  private search: EmojiSearch
  private onSelect: (emoji: string, options: { keepFocus: boolean }) => void
  private searchBuffer = ''
  private searchTimeout: number | null = null

  constructor(
    config: EmojiConfig, 
    onSelect: (emoji: string, options: { keepFocus: boolean }) => void,
    keywords?: Record<string, string>
  ) {
    console.log('Creating EmojiPickerUI with config:', config)
    this.onSelect = onSelect

    // Create components in correct order
    this.view = new EmojiView(config, (emoji, keepOpen) => this.selectEmoji(emoji, keepOpen), keywords)
    
    this.search = new EmojiSearch((filter) => {
      this.view.filterEmojis(filter)
    })
  }

  mount(target: HTMLElement): void {
    console.log('Mounting EmojiPickerUI to target:', target)
    
    // Create a container for the components
    const container = document.createElement('div')
    container.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    `

    // Create a scroll container for the grid
    const scrollContainer = document.createElement('div')
    scrollContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 1rem;
    `

    const searchElement = this.search.getElement()
    const viewElement = this.view.getElement()
    console.log('Search element:', searchElement)
    console.log('View element:', viewElement)
    
    // Clear target before appending new elements
    target.innerHTML = '' 
    
    container.appendChild(searchElement)
    scrollContainer.appendChild(viewElement)
    container.appendChild(scrollContainer)
    target.appendChild(container)
    
    // Force a re-render after mounting to populate the view
    this.view.render()
    console.log('EmojiPickerUI mounted')
  }

  private selectEmoji(emoji: string, keepOpen = false): void {
    if (!emoji) return

    // Clear the filter and search buffer
    this.search.setValue('')
    this.view.filterEmojis('')
    this.searchBuffer = ''
    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout)
      this.searchTimeout = null
    }

    // Call onSelect if provided
    if (this.onSelect) {
      this.onSelect(emoji, { keepFocus: keepOpen })
    }
  }

  handleKeydown(e: KeyboardEvent): void {
    // Handle typing in the grid
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      
      // Clear any existing timeout
      if (this.searchTimeout) {
        window.clearTimeout(this.searchTimeout)
      }
      
      // If we're in the grid view, use the search input's current value as the base
      if (document.activeElement?.tagName === 'BUTTON') {
        this.searchBuffer = this.search.getValue()
      }
      
      // Add the key to the buffer
      this.searchBuffer += e.key
      
      // Update the search input
      this.search.focus()
      this.search.setValue(this.searchBuffer)
      this.view.filterEmojis(this.searchBuffer)
      
      // Set a timeout to clear the buffer after 500ms of no typing
      this.searchTimeout = window.setTimeout(() => {
        this.searchBuffer = ''
      }, 500)
      
      return
    }

    // Handle Tab and Page navigation
    if (e.key === 'Tab' || e.key === 'PageDown' || e.key === 'PageUp') {
      e.preventDefault()
      this.view.handleKeydown(e)
      return
    }

    // Only clear search buffer on non-navigation keys
    if (!['Delete', 'Backspace', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      this.searchBuffer = this.search.getValue()
      if (this.searchTimeout) {
        window.clearTimeout(this.searchTimeout)
        this.searchTimeout = null
      }
    }

    if (e.key === 'ArrowDown' && document.activeElement === this.search.getElement()) {
      e.preventDefault()
      this.view.focusLastChosenEmoji()
    } else if (['Delete', 'Backspace'].includes(e.key)) {
      this.search.focus()
      this.searchBuffer = ''
    } else {
      this.view.handleKeydown(e)
    }
  }

  render(): void {
    this.view.render()
  }
} 