
import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import katex from 'katex'

export interface MathExtensionOptions {
  HTMLAttributes: Record<string, any>
}

export const MathExtension = Node.create<MathExtensionOptions>({
  name: 'mathematics',

  group: 'inline',

  inline: true,

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
        default: false,
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
    return ({ node, HTMLAttributes, getPos, editor }) => {
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

      const render = () => {
         try {
          katex.render(node.attrs.latex, content, {
            throwOnError: false,
            displayMode: node.attrs.displayMode,
            errorColor: '#cc0000',
          })
        } catch (e) {
          content.textContent = node.attrs.latex
        }
      }

      render()

      dom.addEventListener('click', (e) => {
        // Prevent default selection behavior
        // e.preventDefault() 
        // We want to select the node, actually.
        
        if (!editor.isEditable) return
        
        const newLatex = prompt('Edit Equation (LaTeX):', node.attrs.latex)
        if (newLatex !== null) {
           if (typeof getPos === 'function') {
             const pos = getPos()
             if (typeof pos === 'number') {
               editor.view.dispatch(
                 editor.view.state.tr.setNodeMarkup(pos, undefined, { 
                   ...node.attrs,
                   latex: newLatex 
                 })
               )
             }
           }
        }
      })
      
      dom.style.cursor = 'pointer'
      dom.title = 'Click to edit equation'

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false
          
          if (
            updatedNode.attrs.latex !== node.attrs.latex ||
            updatedNode.attrs.displayMode !== node.attrs.displayMode
          ) {
            const nextDisplayMode = updatedNode.attrs.displayMode

            if (nextDisplayMode) {
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
        find: /\$\$([^$]+)\$\$/,
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
        find: /\$([^$]+)\$/,
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
