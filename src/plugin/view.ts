import { makeFilter } from './filter'
import './view.css'

import defaultEmojis from '../config/emojis.json'
import defaultKeywords from '../config/keywords.json'

interface ViewConfig {
  emojis?: Record<string, any>
  keywords?: Record<string, string>
  container: HTMLElement
  onSelect: (emoji: string, multiSelect: boolean) => void
}

interface ViewState {
  filter: ReturnType<typeof makeFilter>
  selectedEmoji: string | null
  container: HTMLElement
  tree: HTMLElement
  searchInput: HTMLInputElement
  onSelect: (emoji: string, multiSelect: boolean) => void
}

function sanitizeText (text: string) {
  return text.replace(/[^a-zA-Z]/g, '')
}

/**
 * Creates an emoji picker view
 */
export function makeView (config: ViewConfig) {
  const state: ViewState = {
    filter: makeFilter(
      config.emojis || defaultEmojis,
      config.keywords || defaultKeywords,
    ),
    selectedEmoji: null,
    container: config.container,
    tree: document.createElement('div'),
    searchInput: document.createElement('input'),
    onSelect: config.onSelect,
  }

  initializeView(state)
  initializeNavigation(state)
  renderTree(state)

  return {
    scrollToSelected: () => scrollToSelected(state),
    destroy: () => destroyView(state),
    show (text: string = 'happy') {
      state.searchInput.value = sanitizeText(text)
      renderTree(state)
      setTimeout(() => {
        state.searchInput.focus()
        if (state.selectedEmoji) {
          scrollToSelected(state)
        }
        else {
          state.tree.parentElement!.scrollTop = 0
        }
      })
    }
  }
}

function initializeView (state: ViewState) {
  // Clear container
  state.container.innerHTML = ''
  state.container.className = 'emoji-picker'

  // Create search section
  const searchContainer = document.createElement('div')
  searchContainer.className = 'search'

  state.searchInput.className = 'search__input'
  state.searchInput.placeholder = 'Search emojis...'
  state.searchInput.type = 'text'

  searchContainer.appendChild(state.searchInput)

  // Create tree container
  const treeContainer = document.createElement('div')
  treeContainer.className = 'tree__container'

  state.tree.className = 'tree'
  treeContainer.appendChild(state.tree)

  // Add elements to container
  state.container.appendChild(searchContainer)
  state.container.appendChild(treeContainer)

  // Add event listeners
  state.searchInput.addEventListener('input', () => {
    renderTree(state)
  })

  state.tree.addEventListener('click', (e) => {
    // button click
    const button = (e.target as HTMLElement).closest('button')
    if (button) {
      const emoji = button.innerHTML
      state.selectedEmoji = emoji
      state.onSelect(emoji, e.ctrlKey || e.metaKey)
    }
  })

  state.tree.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement)!.tagName !== 'BUTTON') {
      const row = (e.target as HTMLElement).closest('.tree__row') as HTMLElement
      if (row) {
        const emoji = row.querySelector('.tree__emoji') as HTMLElement
        if (emoji) {
          setTimeout(() => {
            emoji.focus()
          })
        }
      }
    }
  })
}

/**
 * Initializes keyboard navigation for the emoji picker
 */
function initializeNavigation (state: ViewState) {
  state.container.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement
    const isInput = target === state.searchInput
    const isButton = target.tagName === 'BUTTON' && target.classList.contains('tree__emoji')

    // Tab key handling
    if (e.key === 'Tab') {
      if (isInput && !e.shiftKey) {
        const firstButton = state.tree.querySelector('.tree__emoji') as HTMLButtonElement
        if (firstButton) {
          e.preventDefault()
          firstButton.focus()
        }
      }

      // button
      else if (isButton) {
        e.preventDefault()
        state.searchInput.focus()
      }
    }

    // Arrow key navigation for buttons
    if (isButton) {
      const allButtons = Array.from(state.tree.querySelectorAll('.tree__emoji')) as HTMLButtonElement[]
      const currentIndex = allButtons.indexOf(target as HTMLButtonElement)

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentIndex < allButtons.length - 1) {
          allButtons[currentIndex + 1].focus()
        }
      }
      else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentIndex > 0) {
          allButtons[currentIndex - 1].focus()
        }
      }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()

        // Find the button's row
        const buttonRow = (target as HTMLElement).closest('.tree__emojis')
        if (!buttonRow) return

        // Find all rows
        const allRows = Array.from(state.tree.querySelectorAll('.tree__emojis'))
        const rowIndex = allRows.indexOf(buttonRow as HTMLElement)

        // Get position in current row
        const buttonsInCurrentRow = Array.from(buttonRow.querySelectorAll('.tree__emoji'))
        const positionInRow = buttonsInCurrentRow.indexOf(target as HTMLButtonElement)

        if (e.key === 'ArrowUp') {
          // Go to button in row above
          if (rowIndex > 0) {
            const targetRow = allRows[rowIndex - 1]
            const buttonsInTargetRow = Array.from(targetRow.querySelectorAll('.tree__emoji')) as HTMLButtonElement[]
            const targetButton = buttonsInTargetRow[Math.min(positionInRow, buttonsInTargetRow.length - 1)]
            if (targetButton) targetButton.focus()
          }
          else {
            state.searchInput.focus()
          }
        }
        else if (e.key === 'ArrowDown') {
          // Go to button in row below
          if (rowIndex < allRows.length - 1) {
            const targetRow = allRows[rowIndex + 1]
            const buttonsInTargetRow = Array.from(targetRow.querySelectorAll('.tree__emoji')) as HTMLButtonElement[]
            const targetButton = buttonsInTargetRow[Math.min(positionInRow, buttonsInTargetRow.length - 1)]
            if (targetButton) targetButton.focus()
          }
        }
      }

      // page up / down
      else if (e.key === 'PageUp' || e.key === 'PageDown') {
        e.preventDefault()

        // Find the current tree_row by working up the DOM
        let currentElement = target as HTMLElement
        let currentRow = null

        while (currentElement && currentElement !== state.tree) {
          if (currentElement.classList.contains('tree__row')) {
            currentRow = currentElement
            break
          }
          currentElement = currentElement.parentElement as HTMLElement
        }

        if (currentRow) {
          // Get all category rows in order of appearance
          const allRows = Array.from(state.tree.querySelectorAll('.tree__row'))
          const rowIndex = allRows.indexOf(currentRow)

          let targetRow = null
          if (e.key === 'PageUp' && rowIndex > 0) {
            // Find the previous row
            targetRow = allRows[rowIndex - 1]
          }
          else if (e.key === 'PageDown' && rowIndex < allRows.length - 1) {
            // Find the next row
            targetRow = allRows[rowIndex + 1]
          }

          if (targetRow) {
            // Focus the first emoji button in the target row
            const firstButton = targetRow.querySelector('.tree__emoji') as HTMLButtonElement
            if (firstButton) {
              firstButton.focus()
            }
          }
        }
      }

      // cancel
      else if (e.key === 'Escape') {
        e.preventDefault()
        state.searchInput.focus()
      }

      else if (
        /^[a-zA-Z0-9]$/.test(e.key) ||
        e.key === 'Backspace' ||
        e.key === 'Delete'
      ) {
        // If typing while buttons are focused, move focus to input
        state.searchInput.focus()
        // Let the keypress propagate to the input
      }
    }

    // Input-specific keyboard navigation
    if (isInput) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const firstButton = state.tree.querySelector('.tree__emoji') as HTMLButtonElement
        if (firstButton) firstButton.focus()
      }

      else if (e.key === 'Escape') {
        e.preventDefault()
        if (state.searchInput.value !== '') {
          state.searchInput.value = ''
          renderTree(state)
        }
        else {
          state.onSelect('', false)
        }
      }
    }
  })
}

function renderTree (state: ViewState) {
  const filteredEmojis = state.filter(state.searchInput.value)
  state.tree.innerHTML = ''
  
  if (filteredEmojis) {
    renderNode(filteredEmojis, state.tree, 0)
  }
  else {
    const noResults = document.createElement('div')
    noResults.className = 'tree__empty'
    noResults.textContent = 'No emojis found'
    state.tree.appendChild(noResults)
  }
}

function renderNode (
  node: Record<string, any>,
  parent: HTMLElement,
  depth: number,
) {
  for (const [key, value] of Object.entries(node)) {
    // variables
    const isGroup = Array.isArray(value)

    // container
    const container = document.createElement('div')
    container.setAttribute('data-index', parent.children!.length.toString())
    container.setAttribute('data-depth', depth.toString())
    container.className = isGroup
      ? 'tree__row tree__group'
      : 'tree__row tree__category'

    // attach
    parent.appendChild(container)

    // title
    const title = document.createElement('label')
    title.textContent = key
    title.className = 'tree__title'
    container.appendChild(title)

    // render category
    if (!isGroup) {
      renderNode(value, parent, depth + 1)
    }

    // render group
    else {
      const emojisContainer = document.createElement('div')
      emojisContainer.className = 'tree__emojis'
      container.appendChild(emojisContainer)

      // add emojis
      value.forEach((item: { emoji: string, keywords: string }) => {
        const button = document.createElement('button')
        button.className = 'tree__emoji'
        button.innerHTML = item.emoji
        button.title = item.keywords.split(',').map(text => text.trim()).filter(Boolean).join('\n')
        emojisContainer.appendChild(button)
      })
    }
  }
}

function scrollToSelected (state: ViewState) {
  if (state.selectedEmoji) {
    const button = Array
      .from(state.tree.querySelectorAll(`button.tree__emoji`))
      .find(button => button.innerHTML === state.selectedEmoji)
    button?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

function destroyView (state: ViewState) {
  state.container.innerHTML = ''
}
