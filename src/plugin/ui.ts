import type { EmojiConfig } from './types'

/**
 * Handles the emoji button that toggles the popup
 */
class EmojiButton {
  private button: HTMLButtonElement
  private currentEmoji = '😀'

  constructor(onClick: () => void) {
    this.button = this.createButton(onClick)
    console.log('EmojiButton created with onClick handler')
  }

  private createButton(onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = this.currentEmoji
    button.style.cssText = `
      font-size: 1.5rem;
      padding: 0.5rem;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;
    `
    button.addEventListener('mouseover', () => button.style.backgroundColor = '#f0f0f0')
    button.addEventListener('mouseout', () => button.style.backgroundColor = 'transparent')
    button.addEventListener('click', (e) => {
      e.preventDefault()
      console.log('Button clicked')
      onClick()
    })
    return button
  }

  updateEmoji(emoji: string): void {
    this.currentEmoji = emoji
    this.button.textContent = emoji
  }

  getElement(): HTMLButtonElement {
    return this.button
  }
}

/**
 * Handles the popup container and external events
 */
class EmojiPopup {
  private popup: HTMLDivElement
  private editor?: HTMLTextAreaElement | HTMLInputElement
  private insertPosition = { start: 0, end: 0 }
  private isMultiSelecting = false
  private button: HTMLButtonElement

  constructor(
    onOutsideClick: () => void,
    onKeydown: (e: KeyboardEvent) => void,
    button: HTMLButtonElement,
    editor?: HTMLTextAreaElement | HTMLInputElement
  ) {
    this.editor = editor
    this.button = button
    this.popup = this.createPopup()
    this.setupEventListeners(onOutsideClick, onKeydown)
  }

  private createPopup(): HTMLDivElement {
    const popup = document.createElement('div')
    popup.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 0.5rem;
      _max-height: 400px;
      display: none;
      z-index: 1000;
    `
    return popup
  }

  createTableContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.style.cssText = `
      max-height: 450px;
      overflow-y: auto;
      scroll-padding: 0.5rem;
      padding-right: 0.5rem;
    `
    return container
  }

  private setupEventListeners(onOutsideClick: () => void, onKeydown: (e: KeyboardEvent) => void): void {
    // Editor events
    if (this.editor) {
      const updatePosition = () => this.updateInsertPosition()
      this.editor.addEventListener('mouseup', updatePosition)
      this.editor.addEventListener('keyup', updatePosition)
      this.editor.addEventListener('select', updatePosition)
      this.editor.addEventListener('click', updatePosition)
    }

    // Outside clicks
    document.addEventListener('click', (e) => {
      const target = e.target as Node
      const isOutsideClick = !this.popup.contains(target) && 
                           target !== this.button
      if (isOutsideClick) {
        onOutsideClick()
      }
    })

    // Keyboard navigation
    this.popup.addEventListener('keydown', onKeydown)
  }

  updateInsertPosition(position?: number): void {
    if (!this.editor) return
    
    if (position !== undefined) {
      this.insertPosition = { start: position, end: position }
      return
    }
    
    const start = this.editor.selectionStart
    const end = this.editor.selectionEnd
    
    if (start !== null && end !== null) {
      this.insertPosition = { start, end }
    }
  }

  show(): void {
    this.updateInsertPosition()
    this.isMultiSelecting = false
    this.popup.style.display = 'block'
  }

  hide(): void {
    this.popup.style.display = 'none'
    
    // Focus editor if not in multi-select mode
    if (this.editor && !this.isMultiSelecting) {
      this.editor.focus()
      this.editor.selectionStart = this.insertPosition.start
      this.editor.selectionEnd = this.insertPosition.end
    }

    this.isMultiSelecting = false
  }

  isVisible(): boolean {
    return this.popup.style.display !== 'none'
  }

  getElement(): HTMLDivElement {
    return this.popup
  }

  getInsertPosition(): { start: number, end: number } {
    return this.insertPosition
  }

  setMultiSelecting(value: boolean): void {
    this.isMultiSelecting = value
  }

  getMultiSelecting(): boolean {
    return this.isMultiSelecting
  }
}

/**
 * Handles the search functionality for emojis
 */
class EmojiSearch {
  private input: HTMLInputElement
  private keywords: Record<string, string>
  private onSearch: (filter: string) => void

  constructor(keywords: Record<string, string>, onSearch: (filter: string) => void) {
    this.keywords = keywords
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

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        input.value = ''
        this.onSearch('')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        // Let the parent handle focus
        this.onSearch(input.value.toLowerCase())
      }
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
}

/**
 * Handles the emoji table and keyboard navigation
 */
class EmojiView {
  private table: HTMLTableElement
  private lastColumnIndex = 0
  private config: EmojiConfig
  private onEmojiSelect: (emoji: string, keepOpen: boolean) => void
  private editor?: HTMLTextAreaElement | HTMLInputElement
  private lastChosenEmoji: string | null = null
  private currentCategoryIndex = 0
  private currentSubcategoryIndex = 0
  private keywords: Record<string, string>
  private currentFilter = ''

  constructor(
    config: EmojiConfig,
    onEmojiSelect: (emoji: string, keepOpen: boolean) => void,
    editor?: HTMLTextAreaElement | HTMLInputElement,
    keywords?: Record<string, string>
  ) {
    this.config = config
    this.onEmojiSelect = onEmojiSelect
    this.editor = editor
    this.keywords = keywords || {}
    this.table = this.createTable()
  }

  private createTable(): HTMLTableElement {
    const table = document.createElement('table')
    table.style.cssText = 'border-collapse: collapse; width: 100%;'
    return table
  }

  render(): void {
    this.table.innerHTML = ''
    
    let hasVisibleEmojis = false
    
    for (const [category, subcategories] of Object.entries(this.config)) {
      const visibleSubcategories: Record<string, string[]> = {}
      
      for (const [subcategory, emojis] of Object.entries(subcategories)) {
        const filteredEmojis = emojis.filter(emoji => {
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

      case 'PageDown':
        e.preventDefault()
        this.navigateToNextSection('next')
        break

      case 'PageUp':
        e.preventDefault()
        this.navigateToNextSection('prev')
        break

      case 'Tab':
        e.preventDefault()
        // Store the current emoji before navigating
        if (document.activeElement instanceof HTMLButtonElement) {
          this.lastChosenEmoji = document.activeElement.textContent || ''
        }
        this.navigateToNextSection(e.shiftKey ? 'prev' : 'next')
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

      case 'Escape':
        e.preventDefault()
        this.onEmojiSelect('', false) // Signal to close popup
        if (this.editor) {
          this.editor.focus()
        }
        break
    }
  }

  private navigateToNextSection(direction: 'next' | 'prev'): void {
    const categories = Object.entries(this.config)
    const currentCategory = categories[this.currentCategoryIndex]
    if (!currentCategory) return

    const [categoryName, subcategories] = currentCategory
    const subcategoryEntries = Object.entries(subcategories)
    const currentSubcategory = subcategoryEntries[this.currentSubcategoryIndex]
    if (!currentSubcategory) return

    // Find next/previous category with emojis
    let nextCategoryIndex = this.currentCategoryIndex
    let nextSubcategoryIndex = 0
    let found = false

    if (direction === 'next') {
      // Look forward
      for (let i = this.currentCategoryIndex + 1; i < categories.length; i++) {
        const [, subcategories] = categories[i]
        const subcategoryEntries = Object.entries(subcategories)
        if (subcategoryEntries.length > 0) {
          nextCategoryIndex = i
          nextSubcategoryIndex = 0
          found = true
          break
        }
      }
    } else {
      // Look backward
      for (let i = this.currentCategoryIndex - 1; i >= 0; i--) {
        const [, subcategories] = categories[i]
        const subcategoryEntries = Object.entries(subcategories)
        if (subcategoryEntries.length > 0) {
          nextCategoryIndex = i
          nextSubcategoryIndex = 0  // Always go to first subcategory when going up
          found = true
          break
        }
      }
    }

    if (found) {
      // Store the current indices before updating
      const oldCategoryIndex = this.currentCategoryIndex
      const oldSubcategoryIndex = this.currentSubcategoryIndex
      
      // Update indices
      this.currentCategoryIndex = nextCategoryIndex
      this.currentSubcategoryIndex = nextSubcategoryIndex
      
      // Render and focus
      this.render()
      this.focusFirstEmojiInSection(nextCategoryIndex, nextSubcategoryIndex, oldCategoryIndex)
    }
  }

  private focusFirstEmojiInSection(categoryIndex: number, subcategoryIndex: number, oldCategoryIndex?: number): void {
    const categories = Object.entries(this.config)
    const [, subcategories] = categories[categoryIndex]
    const subcategoryEntries = Object.entries(subcategories)
    const [, emojis] = subcategoryEntries[subcategoryIndex]

    if (emojis.length > 0) {
      const buttons = Array.from(this.table.getElementsByTagName('button')) as HTMLButtonElement[]
      const targetButton = buttons.find(button => button.textContent === emojis[0])
      if (targetButton) {
        targetButton.focus()
        this.lastChosenEmoji = emojis[0]  // Store the first emoji in the new section
        
        // Find the category header
        const categoryHeader = targetButton.closest('tr')?.previousElementSibling
        if (categoryHeader instanceof HTMLTableRowElement && 
            categoryHeader.cells.length === 1 && 
            categoryHeader.cells[0].colSpan === 2) {
          // Use the old category index to determine scroll direction
          const isGoingBackward = oldCategoryIndex !== undefined && categoryIndex < oldCategoryIndex
          categoryHeader.scrollIntoView({ 
            block: isGoingBackward ? 'end' : 'start',
            behavior: 'smooth' 
          })
        }
      }
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
    // Store the current last chosen emoji before filtering
    const lastChosenEmoji = this.lastChosenEmoji
    this.currentFilter = filter
    this.render()
    
    // After rendering, try to focus the last chosen emoji if it's still visible
    if (lastChosenEmoji) {
      const buttons = Array.from(this.table.getElementsByTagName('button')) as HTMLButtonElement[]
      const lastChosenButton = buttons.find(button => button.textContent === lastChosenEmoji)
      if (lastChosenButton) {
        lastChosenButton.focus()
        this.lastChosenEmoji = lastChosenEmoji  // Restore the last chosen emoji
      } else {
        // If the last chosen emoji is not visible in the filtered view,
        // focus the first visible button
        const firstButton = buttons[0]
        if (firstButton) {
          firstButton.focus()
          this.lastChosenEmoji = firstButton.textContent || null  // Update last chosen emoji
        }
      }
    } else {
      // If no last chosen emoji, focus the first button
      const firstButton = this.table.querySelector('button')
      if (firstButton) {
        firstButton.focus()
        this.lastChosenEmoji = firstButton.textContent || null  // Update last chosen emoji
      }
    }
  }
}

/**
 * Main UI component that coordinates the button, popup, and view
 */
export class EmojiPickerUI {
  private button: EmojiButton
  private popup: EmojiPopup
  private view: EmojiView
  private search: EmojiSearch
  private editor?: HTMLTextAreaElement | HTMLInputElement
  private onSelect: (emoji: string, options: { keepFocus: boolean }) => void
  private searchBuffer = ''
  private searchTimeout: number | null = null

  constructor(
    config: EmojiConfig, 
    onSelect: (emoji: string, options: { keepFocus: boolean }) => void,
    editor?: HTMLTextAreaElement | HTMLInputElement,
    keywords?: Record<string, string>
  ) {
    this.editor = editor
    this.onSelect = onSelect

    console.log('Creating EmojiPickerUI components...')

    // Create components
    this.button = new EmojiButton(() => {
      console.log('Button click handler called')
      this.togglePopup()
    })
    
    this.search = new EmojiSearch(keywords || {}, (filter) => {
      this.view.filterEmojis(filter)
    })
    
    this.popup = new EmojiPopup(
      () => this.hidePopup(),
      (e) => this.handleKeydown(e),
      this.button.getElement(),
      editor
    )
    
    this.view = new EmojiView(config, (emoji, keepOpen) => this.selectEmoji(emoji, keepOpen), editor, keywords)

    // Mount components
    const popupElement = this.popup.getElement()
    popupElement.appendChild(this.search.getElement())
    
    const tableContainer = this.popup.createTableContainer()
    tableContainer.appendChild(this.view.getElement())
    popupElement.appendChild(tableContainer)
    
    console.log('EmojiPickerUI components created and mounted')
  }

  mount(target: HTMLElement): void {
    console.log('Mounting EmojiPickerUI to target')
    target.appendChild(this.button.getElement())
    target.appendChild(this.popup.getElement())
  }

  toggle(): void {
    console.log('Toggle called')
    this.togglePopup()
  }

  private togglePopup(): void {
    console.log('Toggle popup called, current visibility:', this.popup.isVisible())
    if (this.popup.isVisible()) {
      this.hidePopup()
    } else {
      this.showPopup()
    }
  }

  private showPopup(): void {
    console.log('Showing popup')
    this.view.render()
    this.popup.show()
    
    // Focus last chosen emoji or first button
    this.view.focusLastChosenEmoji()
  }

  private hidePopup(): void {
    console.log('Hiding popup')
    this.popup.hide()
    
    // Only clear the search input value, not the filter or buffer
    this.search.getElement().value = ''
    
    // Clear timeout if it exists
    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout)
      this.searchTimeout = null
    }
  }

  private selectEmoji(emoji: string, keepOpen = false): void {
    if (!emoji) {
      this.hidePopup()
      return
    }

    console.log('Selecting emoji:', emoji)
    this.button.updateEmoji(emoji)
    this.popup.setMultiSelecting(keepOpen)

    // Clear the filter and search buffer
    this.search.getElement().value = ''
    this.view.filterEmojis('')
    this.searchBuffer = ''
    if (this.searchTimeout) {
      window.clearTimeout(this.searchTimeout)
      this.searchTimeout = null
    }

    if (this.editor) {
      const text = this.editor.value
      const { start, end } = this.popup.getInsertPosition()
      
      // Insert the emoji
      this.editor.value = text.substring(0, start) + emoji + text.substring(end)
      
      // Calculate new position after emoji
      const newPosition = start + emoji.length
      
      // Update insert position for next insertion
      this.editor.selectionStart = newPosition
      this.editor.selectionEnd = newPosition
      
      // Update the popup's insert position
      this.popup.updateInsertPosition(newPosition)
    }

    // Call onSelect if provided (for custom handling)
    if (this.onSelect) {
      this.onSelect(emoji, { keepFocus: keepOpen })
    }
    
    if (!keepOpen) {
      this.hidePopup()
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
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
      this.search.getElement().value = this.searchBuffer
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
    if (!['Delete', 'Backspace', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
      this.searchBuffer = this.search.getValue()
      if (this.searchTimeout) {
        window.clearTimeout(this.searchTimeout)
        this.searchTimeout = null
      }
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      // If there's a search value, clear it first
      if (this.searchBuffer || this.search.getValue()) {
        console.log('Clearing search filter, last chosen emoji:', this.view.getLastChosenEmoji())
        
        // Clear the search
        this.search.getElement().value = ''
        this.view.filterEmojis('')
        this.searchBuffer = ''
        
        // Use setTimeout to ensure the DOM has updated
        setTimeout(() => {
          console.log('Focusing last chosen emoji after filter clear')
          this.view.focusLastChosenEmoji()
        }, 0)
      } else {
        this.hidePopup()
      }
    } else if (e.key === 'ArrowDown' && document.activeElement === this.search.getElement()) {
      e.preventDefault()
      this.view.focusLastChosenEmoji()
    } else if (['Delete', 'Backspace'].includes(e.key)) {
      this.search.focus()
      this.searchBuffer = ''
    } else {
      this.view.handleKeydown(e)
    }
  }
} 