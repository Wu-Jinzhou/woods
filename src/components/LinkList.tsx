'use client'

import { ExternalLink, FileText, MoreVertical, Trash2, FileX, FolderInput, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface LinkListProps {
  link: {
    id: string
    url: string
    title: string | null
    image_url: string | null
    note: string | null
    created_at: string
  }
  isRefetching?: boolean
  onOpenNote: () => void
  onDeleteLink: () => void
  onDeleteNote: () => void
  onMove: () => void
  onRefetch: () => void
}

export default function LinkList({ link, isRefetching, onOpenNote, onDeleteLink, onDeleteNote, onMove, onRefetch }: LinkListProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div 
      className="group relative flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 cursor-pointer" onClick={onOpenNote}>
        {link.image_url ? (
          <img 
            src={link.image_url} 
            alt={link.title || link.url}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`
              e.currentTarget.className = "w-full h-full object-contain p-3 opacity-50"
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-600">
            <FileText size={20} />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenNote}>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 break-words" title={link.title || link.url}>
          {link.title || link.url}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate font-mono">
          {new URL(link.url).hostname.replace('www.', '')}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {isRefetching && (
          <div className="text-blue-600 dark:text-blue-400">
            <RefreshCw size={16} className="animate-spin" />
          </div>
        )}
        {link.note && (
          <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
            <FileText size={10} />
            Note
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap">
          {new Date(link.created_at).toLocaleDateString()}
        </span>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }} 
              />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-100 dark:border-zinc-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMove()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <FolderInput size={14} />
                  Move to Folder
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRefetch()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Refetch Metadata
                </button>
                <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteNote()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2"
                >
                  <FileX size={14} />
                  Clear Note
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteLink()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
