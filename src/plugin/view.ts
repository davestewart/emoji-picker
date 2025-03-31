import { makeFilter } from './filter'
import './view.css'

import defaultEmojis from '../config/emojis.json'
import defaultKeywords from '../config/keywords.json'

interface ViewConfig {
  emojis?: Record<string, any>
  keywords?: Record<string, string>
  container: HTMLElement
  callback: (emoji: string, multiSelect: boolean) => void
}

interface ViewState {
  filter: ReturnType<typeof makeFilter>
  selectedEmoji: string | null
  container: HTMLElement
  treeContainer: HTMLElement
  searchInput: HTMLInputElement
  callback: (emoji: string, multiSelect: boolean) => void
}

/**
 * Creates an emoji picker view
 */
export function makeView(config: ViewConfig) {
  const state: ViewState = {
    filter: makeFilter(
      config.emojis || defaultEmojis,
      config.keywords || defaultKeywords
    ),
    selectedEmoji: null,
    container: config.container,
    treeContainer: document.createElement('div'),
    searchInput: document.createElement('input'),
    callback: config.callback
  }

  initializeView(state)
  renderTree(state)

  return {
    scrollToSelected: () => scrollToSelected(state),
    destroy: () => destroyView(state)
  }
}

function initializeView(state: ViewState) {
  // Clear container
  state.container.innerHTML = ''
  state.container.className = 'emoji-picker'

  // Create search section
  const searchContainer = document.createElement('div')
  searchContainer.className = 'search'

  state.searchInput.className = 'search__input'
  state.searchInput.placeholder = 'Search emojis...'
  state.searchInput.type = 'text'

  const clearButton = document.createElement('button')
  clearButton.className = 'search__clear'
  clearButton.textContent = '×'
  clearButton.style.display = 'none'

  searchContainer.appendChild(state.searchInput)
  searchContainer.appendChild(clearButton)

  // Create tree container
  state.treeContainer.className = 'tree'

  // Add elements to container
  state.container.appendChild(searchContainer)
  state.container.appendChild(state.treeContainer)

  // Add event listeners
  state.searchInput.addEventListener('input', () => {
    clearButton.style.display = state.searchInput.value ? 'block' : 'none'
    renderTree(state)
  })

  clearButton.addEventListener('click', () => {
    state.searchInput.value = ''
    clearButton.style.display = 'none'
    renderTree(state)
    state.searchInput.focus()
  })

  state.treeContainer.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest('button')
    if (button) {
      const emoji = button.innerHTML
      state.selectedEmoji = emoji
      state.callback(emoji, e.ctrlKey || e.metaKey)
    }
  })
}

function renderTree(state: ViewState) {
  const filteredEmojis = state.filter(state.searchInput.value)
  state.treeContainer.innerHTML = ''

  if (filteredEmojis) {
    renderNode(filteredEmojis, state.treeContainer, 0)
  } 
  else {
    const noResults = document.createElement('div')
    noResults.className = 'tree__empty'
    noResults.textContent = 'No emojis found'
    state.treeContainer.appendChild(noResults)
  }
}

function renderNode(
  node: Record<string, any>,
  parent: HTMLElement,
  depth: number
) {
  for (const [key, value] of Object.entries(node)) {
    // variables
    const isGroup = Array.isArray(value)

    // container
    const container = document.createElement('div')
    container.setAttribute('data-depth', depth.toString())
    container.className = isGroup
      ? 'tree__row tree__group'
      : 'tree__row tree__category'

    // attach
    parent.appendChild(container)

    // title  
    const title = document.createElement('div')
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
        button.title = item.keywords.split(',').shift() || ''
        emojisContainer.appendChild(button)
      })
    }
  }
}

function scrollToSelected(state: ViewState) {
  if (state.selectedEmoji) {
    const button = state.treeContainer.querySelector(
      `button[value="${state.selectedEmoji}"]`
    )
    button?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

function destroyView(state: ViewState) {
  state.container.innerHTML = ''
}
