
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, CheckSquare, Quote, Code, Link as LinkIcon,
  Heading1, Heading2, Heading3, X, ExternalLink
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
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)]',
      },
    },
  })

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

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto pb-20">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
