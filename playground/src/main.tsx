import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { makeView } from '../../src'

function App() {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editorRef.current || !containerRef.current) {
      console.error('Editor or container ref not found')
      return
    }

    const editor = editorRef.current
    const container = containerRef.current

    // Initialize emoji picker
    makeView({
      container,
      callback: (emoji: string, multiSelect: boolean) => {
        if (!editor) return

        const start = editor.selectionStart
        const end = editor.selectionEnd
        const text = editor.value
        
        const newText = text.substring(0, start) + emoji + text.substring(end)
        editor.value = newText
        
        // Update cursor position
        const newPosition = start + emoji.length
        editor.selectionStart = newPosition
        editor.selectionEnd = newPosition
        
        // Focus editor unless multiSelect is true
        if (!multiSelect) {
          editor.focus()
        }
      }
    })
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