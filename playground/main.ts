import { EmojiPicker } from '../src/index'

const editor = document.getElementById('editor') as HTMLTextAreaElement
if (!editor) {
  throw new Error('Editor element not found')
}

console.log('Creating EmojiPicker instance...')
const picker = new EmojiPicker()

// Create a container for the emoji picker
const container = document.createElement('div')
container.style.cssText = `
  position: relative;
  margin-bottom: 1rem;
`
editor.parentNode?.insertBefore(container, editor)

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Check for Cmd+E (Mac) or Ctrl+E (Windows/Linux)
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
    e.preventDefault() // Prevent default browser behavior
    picker.toggle() // We'll need to add this method to the EmojiPicker class
  }
})

// Initialize the picker
console.log('Initializing picker...')
picker.init({
  editor,
  // No need for onSelect - the plugin will handle caret management
}).then(() => {
  console.log('Picker initialized, mounting...')
  // Mount the picker
  picker.mount(container)
}).catch(error => {
  console.error('Failed to initialize picker:', error)
}) 