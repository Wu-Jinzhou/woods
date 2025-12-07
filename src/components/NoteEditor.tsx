
"use client"

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import { migrateMathStrings, InlineMath, BlockMath } from '@tiptap/extension-mathematics'
import 'katex/dist/katex.min.css'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, CheckSquare, Quote, Code, Sigma, ExternalLink, X,
  Heading1, Heading2, Heading3
} from 'lucide-react'
import clsx from 'clsx'

interface NoteEditorProps {
  linkId: string
  initialContent: string | null
  url: string
  title: string | null
  onClose: () => void
  onTitleChange?: (newTitle: string) => void
}

export default function NoteEditor({ linkId, initialContent, url, title, onClose, onTitleChange }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [editableTitle, setEditableTitle] = useState(title || '')
  const [mathInput, setMathInput] = useState('')
  const [activeMathType, setActiveMathType] = useState<'inline' | 'block' | null>(null)

  // Update local title if prop changes (e.g. from external refresh)
  useEffect(() => {
    setEditableTitle(title || '')
  }, [title])

  const saveTitle = async (newTitle: string) => {
    const { error } = await supabase
      .from('links')
      .update({ title: newTitle })
      .eq('id', linkId)

    if (error) {
      console.error('Error saving title:', error)
    } else {
      onTitleChange?.(newTitle)
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      InlineMath.configure({
        katexOptions: { throwOnError: false },
      }),
      BlockMath.configure({
        katexOptions: { throwOnError: false },
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)]',
      },
    },
    onCreate: ({ editor }) => {
      migrateMathStrings(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      // Sync math input when selection changes
      if (editor.isActive('inlineMath')) {
        setMathInput(editor.getAttributes('inlineMath').latex || '')
        setActiveMathType('inline')
      } else if (editor.isActive('blockMath')) {
        setMathInput(editor.getAttributes('blockMath').latex || '')
        setActiveMathType('block')
      } else {
        setActiveMathType(null)
        setMathInput('')
      }
    }
  })

  // Update mathInput when editor content updates (e.g. undo/redo)
  useEffect(() => {
    if (editor) {
      if (editor.isActive('inlineMath')) {
        setMathInput(editor.getAttributes('inlineMath').latex || '')
        setActiveMathType('inline')
      } else if (editor.isActive('blockMath')) {
        setMathInput(editor.getAttributes('blockMath').latex || '')
        setActiveMathType('block')
      } else {
        setActiveMathType(null)
        setMathInput('')
      }
    }
  }, [editor?.state.selection])


  const saveNote = async () => {
    if (!editor) return

    setIsSaving(true)
    const content = editor.getHTML()

    const { error } = await supabase
      .from('links')
      .update({ note: content })
      .eq('id', linkId)

    setIsSaving(false)

    if (error) {
      console.error('Error saving note:', error)
    }
  }

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (editor && editor.isFocused) {
        saveNote()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [editor])

  if (!editor) return null

  const ToolbarButton = ({ onClick, isActive, children, title }: any) => (
    <button
      onClick={onClick}
      className={clsx(
        "p-1.5 rounded-md transition-colors",
        isActive 
          ? "bg-gray-200 dark:bg-zinc-700 text-black dark:text-white" 
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-200"
      )}
      title={title}
    >
      {children}
    </button>
  )

  const insertInlineMath = () => {
    editor.chain().focus().insertInlineMath({ latex: 'E = mc^2' }).run()
  }

  const insertBlockMath = () => {
    editor.chain().focus().insertBlockMath({ latex: '\\sum_{i=0}^n i^2 = \\frac{(n^2+n)(2n+1)}{6}' }).run()
  }

  const updateMath = (latex: string) => {
    setMathInput(latex)
    if (editor.isActive('inlineMath')) {
      editor.chain().updateInlineMath({ latex }).run()
    } else if (editor.isActive('blockMath')) {
      editor.chain().updateBlockMath({ latex }).run()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
      {/* Header */}

      <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-950 z-10">
        <div className="flex-1 min-w-0 mr-4">
          <textarea
            value={editableTitle}
            onChange={(e) => {
              setEditableTitle(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            ref={(ref) => {
              if (ref) {
                ref.style.height = 'auto'
                ref.style.height = ref.scrollHeight + 'px'
              }
            }}
            onBlur={() => saveTitle(editableTitle)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            className="text-3xl font-bold text-gray-900 dark:text-white font-serif mb-2 w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-300 dark:placeholder-zinc-700 resize-none overflow-hidden block"
            placeholder="Untitled"
            rows={1}
          />
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit max-w-full"
          >
            <ExternalLink size={14} className="flex-shrink-0" />
            <span className="truncate">{url}</span>
          </a>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center gap-1 flex-wrap bg-white dark:bg-zinc-950 sticky top-0 z-10">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={18} />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
          <List size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List">
          <CheckSquare size={18} />
        </ToolbarButton>
        
        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote">
          <Quote size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
          <Code size={18} />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />
        <ToolbarButton onClick={insertInlineMath} isActive={editor.isActive('inlineMath')} title="Inline Equation">
          <Sigma size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={insertBlockMath} isActive={editor.isActive('blockMath')} title="Block Equation">
          <Sigma size={18} className="rotate-90" />
        </ToolbarButton>
      </div>

      {activeMathType && (
        <div className="px-8 py-3 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            {activeMathType === 'inline' ? 'Inline math' : 'Block math'}
          </span>
          <input
            type="text"
            value={mathInput}
            onChange={(e) => updateMath(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded px-3 py-2 text-sm font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            placeholder="Write LaTeX here (e.g. E = mc^2)"
          />
        </div>
      )}
      
      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto pb-20">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
