import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { EmojiPicker } from 'emoji-picker'

function App() {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<EmojiPicker>(new EmojiPicker())
  const [currentEmoji, setCurrentEmoji] = useState('')
  const [insertPosition, setInsertPosition] = useState({ start: 0, end: 0 })

  useEffect(() => {
    debugger
    if (!editorRef.current || !containerRef.current) {
      console.error('Editor or container ref not found')
      return
    }

    const editor = editorRef.current

    // Update insert position on editor interactions
    const updatePosition = () => {
      setInsertPosition({
        start: editor.selectionStart,
        end: editor.selectionEnd
      })
    }

    // Add event listeners
    editor.addEventListener('mouseup', updatePosition)
    editor.addEventListener('keyup', updatePosition)
    editor.addEventListener('select', updatePosition)
    editor.addEventListener('click', updatePosition)

    console.log('Initializing picker with default config...')
    // Initialize picker
    pickerRef.current.init({
      onSelect: (emoji: string, options: { keepFocus: boolean }) => {
        console.log('Emoji selected:', emoji, options)
        // Handle emoji selection
        const editor = editorRef.current
        if (!emoji || !editor) return

        const { start, end } = insertPosition
        const text = editor.value
        const newText = text.substring(0, start) + emoji + text.substring(end)
        editor.value = newText
        
        // Calculate new position after emoji
        const newPosition = start + emoji.length
        
        // Update insert position for next insertion
        editor.selectionStart = newPosition
        editor.selectionEnd = newPosition
        setInsertPosition({ start: newPosition, end: newPosition })
        
        // Update current emoji
        setCurrentEmoji(emoji)
        
        // Focus editor if not keeping focus
        if (!options.keepFocus) {
          editor.focus()
        }
      }
    }).then(() => {
      console.log('Picker initialized successfully')
      // Mount the picker
      const container = containerRef.current
      if (!container) {
        console.error('Container ref lost during initialization')
        return
      }
      console.log('Mounting picker to container:', container)
      pickerRef.current?.mount(container)
      console.log('Picker mounted successfully')
    }).catch((error: Error) => {
      console.error('Failed to initialize picker:', error)
    })

    return () => {
      editor.removeEventListener('mouseup', updatePosition)
      editor.removeEventListener('keyup', updatePosition)
      editor.removeEventListener('select', updatePosition)
      editor.removeEventListener('click', updatePosition)
      pickerRef.current?.destroy()
    }
  }, [])

  return (
    <div className="App">
      <div className="editor-container">
        <textarea
          ref={editorRef}
          placeholder="Type something..."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '1rem',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}
        />
        <div className="picker-container">
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '400px',
              border: '1px solid #eee',
              borderRadius: '4px',
              padding: '1rem',
              background: 'white'
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Add some basic styles
const style = document.createElement('style')
style.textContent = `
  .App {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  .editor-container {
    position: relative;
    margin-bottom: 1rem;
  }
  .picker-container {
    margin-top: 1rem;
  }
`
document.head.appendChild(style)

// Mount the app
const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
const root = createRoot(container)
root.render(<App />) 