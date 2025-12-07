import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import katex from 'katex'

export interface MathExtensionOptions {
  HTMLAttributes: Record<string, any>
}

export const MathExtension = Node.create<MathExtensionOptions>({
  name: 'mathematics',

  group: 'inline', // For inline math. For block, it's complicated in Tiptap schema, but 'inline' with display:block styling often works best for mixed content.
  
  inline: true, // We treat it as an inline node that *can* be rendered as block

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'math-node',
      },
    }
  },

  addAttributes() {
    return {
      latex: {
        default: 'x',
        parseHTML: element => element.getAttribute('data-latex'),
        renderHTML: attributes => {
          return {
            'data-latex': attributes.latex,
          }
        },
      },
      displayMode: {
        default: false, // false = inline, true = block
        parseHTML: element => element.getAttribute('data-display-mode') === 'true',
        renderHTML: attributes => {
          return {
            'data-display-mode': attributes.displayMode,
          }
        },
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="mathematics"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'mathematics' }), 0]
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos }) => {
      const dom = document.createElement('span')
      const content = document.createElement('span')
      
      dom.classList.add('math-node-view')
      if (node.attrs.displayMode) {
        dom.classList.add('math-block')
        dom.style.display = 'block'
        dom.style.textAlign = 'center'
        dom.style.margin = '1em 0'
      } else {
        dom.classList.add('math-inline')
        dom.style.display = 'inline-block'
      }

      dom.appendChild(content)

      // Render function
      const render = () => {
         try {
          katex.render(node.attrs.latex, content, {
            throwOnError: false,
            displayMode: node.attrs.displayMode,
          })
        } catch (e) {
          content.textContent = node.attrs.latex
        }
      }

      render()

      // Click handler to edit
      dom.addEventListener('click', (e) => {
        e.preventDefault()
        // Simple prompt for editing. In a real app, use a modal.
        // We allow changing the code. To toggle block mode, we could ask or use a command.
        const newLatex = prompt('Edit Equation (LaTeX):', node.attrs.latex)
        if (newLatex !== null) {
           if (typeof getPos === 'function') {
             // Ask for display mode if it's changing or new? 
             // For simplicity, just update latex. 
             // To toggle display mode, user would ideally use a context menu, but here we can just detect if it starts/ends with $$ maybe? 
             // Or just keep the current mode.
             // Let's stick to updating content for now.
             // @ts-ignore
             this.editor.view.dispatch(this.editor.view.state.tr.setNodeMarkup(getPos(), undefined, { 
               ...node.attrs,
               latex: newLatex 
             }))
           }
        }
      })
      
      dom.style.cursor = 'pointer'
      dom.title = 'Click to edit equation'

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false
          
          if (updatedNode.attrs.latex !== node.attrs.latex || updatedNode.attrs.displayMode !== node.attrs.displayMode) {
             // Re-render if attributes changed
             node.attrs.latex = updatedNode.attrs.latex
             node.attrs.displayMode = updatedNode.attrs.displayMode
             
             // Update styling
             if (node.attrs.displayMode) {
                dom.style.display = 'block'
                dom.style.textAlign = 'center'
                dom.style.margin = '1em 0'
             } else {
                dom.style.display = 'inline-block'
                dom.style.textAlign = 'unset'
                dom.style.margin = 'unset'
             }
             
             render()
          }
          return true
        },
      }
    }
  },

  addInputRules() {
    return [
      // Block math: $$ ... $$
      nodeInputRule({
        find: /\$\$(.+)\$\$/,
        type: this.type,
        getAttributes: match => {
          return {
            latex: match[1],
            displayMode: true,
          }
        },
      }),
      // Inline math: $ ... $
      nodeInputRule({
        find: /\$(.+)\$/,
        type: this.type,
        getAttributes: match => {
          return {
            latex: match[1],
            displayMode: false,
          }
        },
      }),
    ]
  },
})
