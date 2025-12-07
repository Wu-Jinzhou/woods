'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Folder, Plus, Trash2, ChevronLeft, ChevronRight, X,
  MoreVertical, Edit2, Check, FileText
} from 'lucide-react'
import clsx from 'clsx'
import Image from 'next/image'

interface SidebarProps {
  folders: { id: string, name: string }[]
  selectedFolderId: string | null
  onSelectFolder: (id: string) => void
  onAddFolder: (name: string) => Promise<void>
  onDeleteFolder: (id: string) => Promise<void>
  isCollapsed: boolean
  onToggleCollapse: () => void
  openLinks: { id: string, title: string | null, url: string }[]
  activeLinkId: string | null
  onSelectOpenLink: (id: string) => void
  onCloseOpenLink: (id: string) => void
  onLogoClick?: () => void
}

export default function Sidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  onDeleteFolder,
  isCollapsed,
  onToggleCollapse,
  openLinks,
  activeLinkId,
  onSelectOpenLink,
  onCloseOpenLink,
  onLogoClick
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const handleCreateFolder = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    await onAddFolder(newFolderName)
    setNewFolderName('')
    setIsCreating(false)
  }

  const handleDeleteFolder = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this folder? All links inside will be deleted.')) {
      await onDeleteFolder(id)
      if (selectedFolderId === id) {
        onSelectFolder('')
      }
    }
  }

  if (isCollapsed) {
    return (
      <div className={clsx(
        "bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 h-screen flex flex-col items-center py-4 transition-all duration-300 w-12",
        "fixed md:relative top-0 left-0 z-50 md:z-auto"
      )}>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg mb-4"
        >
          <ChevronRight size={20} />
        </button>
        <div className="flex flex-col gap-2 w-full px-2">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={clsx(
                "p-2 rounded-lg flex justify-center transition-colors",
                selectedFolderId === folder.id
                  ? "bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50"
              )}
              title={folder.name}
            >
              <Folder size={20} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(
      "bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 h-screen flex flex-col transition-all duration-300 w-full md:w-64",
      "fixed md:relative inset-0 md:inset-auto z-50 md:z-auto"
    )}>
      <div className="p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-2 focus:outline-none"
        >
          <img src="/images/woods_text_logo.png" alt="Woods" className="h-6 object-contain dark:invert" />
        </button>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2">Folders</h3>
          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder.id}>
                <div
                  onClick={() => onSelectFolder(folder.id)}
                  className={clsx(
                    "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                    selectedFolderId === folder.id 
                      ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder size={18} className={clsx(
                      selectedFolderId === folder.id ? "text-blue-500 fill-blue-500/20" : "text-gray-400 dark:text-gray-500"
                    )} />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Open Tabs for this folder */}
                {selectedFolderId === folder.id && openLinks.length > 0 && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-100 dark:border-zinc-800 pl-2">
                    {openLinks.map(link => (
                      <div 
                        key={link.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectOpenLink(link.id)
                        }}
                        className={clsx(
                          "group/link flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors",
                          activeLinkId === link.id
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={12} />
                          <span className="truncate">{link.title || link.url}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onCloseOpenLink(link.id)
                          }}
                          className="opacity-0 group-hover/link:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
        {/* 1. Create Folder Button (Top) */}
        {isCreating ? (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder(e)
                if (e.key === 'Escape') setIsCreating(false)
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolder}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-900 dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-zinc-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black hover:opacity-90 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Folder
          </button>
        )}

        {/* 3. Links */}
        <div className="text-sm text-black dark:text-white space-y-2 p-3 rounded-lg bg-gray-100 dark:bg-zinc-800">
          <ul className="font-sans flex flex-col space-y-2">
            <li>
              <a
                className="flex items-center transition-all hover:text-gray-500"
                rel="noopener noreferrer"
                target="_blank"
                href="https://github.com/Wu-Jinzhou/woods"
              >
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                  </svg>
                </span>
                <p className="ml-2 h-6 leading-6">Github</p>
              </a>
            </li>
            <li>
              <a
                className="flex items-center transition-all hover:text-gray-500"
                rel="noopener noreferrer"
                target="_blank"
                href="https://www.jinzhouwu.com/"
              >
                <span className="inline-flex items-center justify-center w-5 h-5">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z" fill="currentColor" />
                  </svg>
                </span>
                <p className="ml-2 h-6 leading-6">Home</p>
              </a>
            </li>
          </ul>
          <p className="ml-[2px] text-xs text-gray-600 dark:text-gray-300">Made by Jinzhou Wu</p>
        </div>
      </div>
    </div>
  )
}
