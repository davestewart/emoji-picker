import type { EmojiConfig } from './types'
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
  private table: HTMLTableElement
  private lastColumnIndex = 0
  private config: EmojiConfig
  private onEmojiSelect: (emoji: string, keepOpen: boolean) => void
  private lastChosenEmoji: string | null = null
  private keywords: Record<string, string>
  private currentFilter = ''

  constructor(
    config: EmojiConfig,
    onEmojiSelect: (emoji: string, keepOpen: boolean) => void,
    keywords?: Record<string, string>
  ) {
    console.log('Creating EmojiView with config:', config)
    this.config = config
    this.onEmojiSelect = onEmojiSelect
    this.keywords = keywords || {}
    this.table = this.createTable()
    this.render()
  }

  private createTable(): HTMLTableElement {
    const table = document.createElement('table')
    table.style.cssText = `
      border-collapse: collapse;
      width: 100%;
      border: 1px solid #ccc;
      margin-top: 1rem;
    `
    return table
  }

  render(): void {
    console.log('Rendering EmojiView')
    this.table.innerHTML = ''
    
    let hasVisibleEmojis = false
    
    for (const [category, subcategories] of Object.entries(this.config)) {
      console.log('Processing category:', category, 'subcategories:', subcategories)
      const visibleSubcategories: Record<string, string[]> = {}
      
      for (const [subcategory, emojis] of Object.entries(subcategories)) {
        console.log('Processing subcategory:', subcategory, 'emojis:', emojis)
        const emojiArray = typeof emojis === 'string' ? splitEmojis(emojis) : []
        console.log('Split emojis:', emojiArray)
        const filteredEmojis = emojiArray.filter((emoji: string) => {
          if (!this.currentFilter) return true
          const name = this.keywords[emoji]?.toLowerCase() || ''
          return name.includes(this.currentFilter)
        })
        
        if (filteredEmojis.length > 0) {
          visibleSubcategories[subcategory] = filteredEmojis
          hasVisibleEmojis = true
        }
      }
      
      if (Object.keys(visibleSubcategories).length > 0) {
        this.renderCategory(category, visibleSubcategories)
      }
    }

    if (!hasVisibleEmojis) {
      const row = this.table.insertRow()
      const cell = row.insertCell()
      cell.colSpan = 2
      cell.textContent = 'No emojis found for that filter'
      cell.style.cssText = `
        text-align: center;
        padding: 1rem;
        color: #666;
        font-style: italic;
      `
    }
    console.log('EmojiView rendered, table:', this.table.innerHTML)
  }

  private renderCategory(category: string, subcategories: Record<string, string[]>): void {
    // Render category header
    const categoryRow = this.table.insertRow()
    const categoryCell = categoryRow.insertCell()
    categoryCell.colSpan = 2
    categoryCell.textContent = category
    categoryCell.style.cssText = `
      font-weight: bold;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      font-size: 0.9rem;
      border-radius: 4px;
    `

    // Render subcategories
    for (const [subcategory, emojis] of Object.entries(subcategories)) {
      this.renderSubcategory(subcategory, emojis)
    }
  }

  private renderSubcategory(subcategory: string, emojis: string[]): void {
    const row = this.table.insertRow()
    
    // Subcategory label
    const labelCell = row.insertCell()
    labelCell.textContent = subcategory
    labelCell.style.cssText = `
      padding: 0.25rem 0.5rem;
      padding-left: 1.25rem;
      font-size: 0.85rem;
      color: #666;
    `

    // Emoji buttons
    const emojiCell = row.insertCell()
    emojiCell.style.cssText = `
      padding: 0.25rem;
      white-space: nowrap;
      line-height: 1;
    `

    emojis.forEach(emoji => this.renderEmojiButton(emoji, emojiCell))
  }

  private renderEmojiButton(emoji: string, container: HTMLTableCellElement): void {
    const button = document.createElement('button')
    button.textContent = emoji
    button.title = (this.keywords[emoji] || '').split(',').shift() || ''
    button.style.cssText = `
      font-size: 1.2rem;
      padding: 0.15rem;
      margin: 0.1rem;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
      line-height: 1;
      vertical-align: middle;
      outline: none;
    `

    button.addEventListener('mouseover', () => button.style.backgroundColor = '#f0f0f0')
    button.addEventListener('mouseout', () => button.style.backgroundColor = 'transparent')
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
    })
    button.addEventListener('blur', () => {
      button.style.backgroundColor = 'transparent'
      button.style.boxShadow = 'none'
    })

    container.appendChild(button)
  }

  handleKeydown(e: KeyboardEvent): void {
    const buttons = Array.from(this.table.getElementsByTagName('button')) as HTMLButtonElement[]
    const currentIndex = buttons.findIndex(button => button === document.activeElement)

    if (currentIndex === -1) {
      // If no current focus, try to focus the last chosen emoji first
      if (this.lastChosenEmoji) {
        const lastChosenButton = buttons.find(button => button.textContent === this.lastChosenEmoji)
        if (lastChosenButton) {
          lastChosenButton.focus()
          return
        }
      }
      // Only focus first button if no last chosen emoji or it's not visible
      if (buttons.length > 0) {
        buttons[0].focus()
        this.lastColumnIndex = 0
      }
      return
    }

    const currentPosition = this.getCurrentRowPosition()
    if (!currentPosition) return

    const { rowButtons, columnIndex } = currentPosition
    this.lastColumnIndex = columnIndex

    this.handleNavigationKey(e, buttons, currentIndex, rowButtons)
  }

  private handleNavigationKey(
    e: KeyboardEvent, 
    buttons: HTMLButtonElement[], 
    currentIndex: number,
    rowButtons: HTMLButtonElement[]
  ): void {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        if (currentIndex < buttons.length - 1) {
          buttons[currentIndex + 1].focus()
          this.lastChosenEmoji = buttons[currentIndex + 1].textContent || ''
        }
        break

      case 'ArrowLeft':
        e.preventDefault()
        if (currentIndex > 0) {
          buttons[currentIndex - 1].focus()
          this.lastChosenEmoji = buttons[currentIndex - 1].textContent || ''
        }
        break

      case 'ArrowDown':
        e.preventDefault()
        this.navigateVertically(rowButtons, 'next')
        break

      case 'ArrowUp':
        e.preventDefault()
        this.navigateVertically(rowButtons, 'prev')
        break

      case 'Enter':
        e.preventDefault()
        if (document.activeElement instanceof HTMLButtonElement) {
          const keepOpen = e.metaKey || e.ctrlKey
          this.lastChosenEmoji = document.activeElement.textContent || ''
          this.onEmojiSelect(this.lastChosenEmoji, keepOpen)
        }
        break

      case ' ':
        e.preventDefault()
        if (document.activeElement instanceof HTMLButtonElement) {
          this.lastChosenEmoji = document.activeElement.textContent || ''
          this.onEmojiSelect(this.lastChosenEmoji, true)
        }
        break
    }
  }

  private navigateVertically(rowButtons: HTMLButtonElement[], direction: 'next' | 'prev'): void {
    const currentRow = rowButtons[0].closest('tr')
    if (!currentRow) return

    let targetRow = direction === 'next' 
      ? currentRow.nextElementSibling 
      : currentRow.previousElementSibling

    // Skip category header rows
    while (targetRow && !targetRow.getElementsByTagName('button').length) {
      targetRow = direction === 'next'
        ? targetRow.nextElementSibling
        : targetRow.previousElementSibling
    }

    if (targetRow) {
      const targetButtons = Array.from(targetRow.getElementsByTagName('button')) as HTMLButtonElement[]
      if (targetButtons.length > 0) {
        const targetIndex = Math.min(this.lastColumnIndex, targetButtons.length - 1)
        targetButtons[targetIndex].focus()
      }
    }
  }

  private getCurrentRowPosition(): { rowButtons: HTMLButtonElement[], columnIndex: number } | null {
    const currentButton = document.activeElement as HTMLButtonElement
    if (!currentButton || !(currentButton instanceof HTMLButtonElement)) return null

    const currentRow = currentButton.closest('tr')
    if (!currentRow) return null

    const rowButtons = Array.from(currentRow.getElementsByTagName('button')) as HTMLButtonElement[]
    const columnIndex = rowButtons.indexOf(currentButton)
    
    return { rowButtons, columnIndex }
  }

  getElement(): HTMLTableElement {
    console.log('Getting EmojiView element:', this.table)
    return this.table
  }

  getLastChosenEmoji(): string | null {
    return this.lastChosenEmoji
  }

  focusLastChosenEmoji(): void {
    if (!this.lastChosenEmoji) {
      // If no last chosen emoji, focus the first button
      const firstButton = this.table.querySelector('button')
      if (firstButton) {
        firstButton.focus()
      }
      return
    }

    // Find and focus the last chosen emoji button
    const buttons = Array.from(this.table.getElementsByTagName('button')) as HTMLButtonElement[]
    const lastChosenButton = buttons.find(button => button.textContent === this.lastChosenEmoji)
    if (lastChosenButton) {
      lastChosenButton.focus()
    } else {
      // If not found, focus the first button
      const firstButton = buttons[0]
      if (firstButton) {
        firstButton.focus()
      }
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

    // Create a scroll container for the table
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
    console.log('EmojiPickerUI mounted, container:', container.innerHTML)
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
    // Handle typing in the table
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      
      // Clear any existing timeout
      if (this.searchTimeout) {
        window.clearTimeout(this.searchTimeout)
      }
      
      // If we're in the table view, use the search input's current value as the base
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