'use client'

import { ExternalLink, FileText, MoreVertical, Trash2, FileX, FolderInput, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface LinkCardProps {
  link: {
    id: string
    url: string
    title: string | null
    image_url: string | null
    note: string | null
    created_at: string
  }
  isRefetching?: boolean
  canEdit?: boolean
  onOpenNote: (linkId: string) => void
  onDeleteLink: (linkId: string) => void
  onDeleteNote: (linkId: string) => void
  onMove: () => void
  onRefetch: () => void
}

export default function LinkCard({ link, isRefetching, canEdit = true, onOpenNote, onDeleteLink, onDeleteNote, onMove, onRefetch }: LinkCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div 
      className="group relative flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-visible hover:shadow-md transition-all duration-200 h-full"
    >
      <div className="aspect-video w-full bg-gray-100 dark:bg-zinc-800 relative overflow-hidden cursor-pointer" onClick={() => onOpenNote(link.id)}>
        {isRefetching && (
          <div className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-black/60 shadow-sm text-blue-600 dark:text-blue-400">
            <RefreshCw size={14} className="animate-spin" />
          </div>
        )}
        {link.image_url ? (
          <img 
            src={link.image_url} 
            alt={link.title || link.url}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = `/api/favicon?url=${encodeURIComponent(link.url)}`
              e.currentTarget.className = "w-full h-full object-contain p-8 opacity-50"
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-700">
            <FileText size={48} />
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1 cursor-pointer" onClick={() => onOpenNote(link.id)}>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={link.title || link.url}>
          {link.title || 'Untitled'}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-3 font-mono">
          {new URL(link.url).hostname.replace('www.', '')}
        </p>
        
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-600">
            {new Date(link.created_at).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2 relative">
            {link.note && (
              <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                <FileText size={10} />
                Note
              </span>
            )}

            {/* Menu Button */}
            {canEdit && (
              <div className="relative pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-black hover:text-gray-900 dark:hover:text-white transition-colors"
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
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                          onDeleteNote(link.id)
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
                          onDeleteLink(link.id)
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
