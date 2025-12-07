
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LayoutGrid, List, Plus, Upload, X, Trash2, CheckSquare, Square, RefreshCw, FolderOpen } from 'lucide-react'
import LinkCard from './LinkCard'
import LinkList from './LinkList'
import clsx from 'clsx'

interface FolderViewProps {
  folderId: string | null
  folderName: string
  onOpenNote: (linkId: string) => void
  canEdit: boolean
}

interface LinkType {
  id: string
  url: string
  title: string | null
  image_url: string | null
  note: string | null
  created_at: string
}

export default function FolderView({ folderId, folderName, onOpenNote, canEdit }: FolderViewProps) {
  const [links, setLinks] = useState<LinkType[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [refetchingLinkIds, setRefetchingLinkIds] = useState<Set<string>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [importText, setImportText] = useState('')
  const [importProgress, setImportProgress] = useState(0)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(new Set())
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [linkToMove, setLinkToMove] = useState<string | null>(null)
  const [availableFolders, setAvailableFolders] = useState<{id: string, name: string}[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

  useEffect(() => {
    if (!isMoveModalOpen || !folderId) return

    const loadFolders = async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .neq('id', folderId)
        .order('name')

      if (error) {
        console.error('Error fetching folders:', error)
      } else {
        setAvailableFolders(data || [])
      }
    }

    loadFolders()
  }, [isMoveModalOpen, folderId])

  useEffect(() => {
    if (folderId) {
      fetchLinks()
      setSelectedLinkIds(new Set())
      setIsSelectionMode(false)
    } else {
      setLinks([])
    }
  }, [folderId])

  // Persist view mode across openings/closures
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('woods:viewMode')
    if (saved === 'card' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  const setViewModePersisted = (mode: 'card' | 'list') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('woods:viewMode', mode)
    }
  }

  const fetchLinks = async () => {
    if (!folderId) return
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching links:', error)
    } else {
      setLinks(data || [])
    }
  }

  const fetchMetadata = async (url: string) => {
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error('Failed to fetch metadata')
      return await res.json()
    } catch (error) {
      // console.error(error) // Suppress error to avoid console noise
      return { title: url, description: '', image: '' }
    }
  }

  const addLink = async () => {
    if (!canEdit || !newLinkUrl.trim() || !folderId) return

    setIsLoadingMetadata(true)
    const { title, image } = await fetchMetadata(newLinkUrl)
    setIsLoadingMetadata(false)

    const finalImage = image || `https://www.google.com/s2/favicons?sz=64&domain_url=${newLinkUrl}`

    const { data, error } = await supabase
      .from('links')
      .insert([{ 
        folder_id: folderId, 
        url: newLinkUrl,
        title: title || newLinkUrl,
        image_url: finalImage
      }])
      .select()

    if (error) {
      console.error('Error adding link:', error)
    } else {
      setLinks([data[0], ...links])
      setNewLinkUrl('')
      setIsAdding(false)
    }
  }

  const importLinks = async () => {
    if (!canEdit || !importText.trim() || !folderId) return

    const lines = importText.split('\n').filter(url => url.trim())
    // Deduplicate or validate? Basic validation.
    const validUrls: string[] = []
    
    for (const line of lines) {
      try {
        new URL(line.trim())
        validUrls.push(line.trim())
      } catch (e) {
        // Skip
      }
    }
    
    if (validUrls.length === 0) {
      setIsImporting(false)
      return
    }

    setImportProgress(10) // Started
    
    const total = validUrls.length
    let processed = 0
    const now = new Date()

    const linksToInsert = await Promise.all(validUrls.map(async (url, index) => {
      try {
        const { title, image } = await fetchMetadata(url)
        processed++
        setImportProgress(10 + Math.floor((processed / total) * 80)) // Up to 90%
        
        // Decrement time by 1 second for each subsequent item so the FIRST item has the LATEST time
        // This ensures First (Top) of list -> Newest time -> Top of View (Sort DESC)
        const time = new Date(now.getTime() - index * 1000).toISOString()

        return {
          folder_id: folderId,
          url: url,
          title: title || url,
          image_url: image || `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`,
          created_at: time
        }
      } catch (e) {
        console.error(`Failed to fetch metadata for ${url}`, e)
        processed++
        // Even if metadata fails, insert with raw URL
        const time = new Date(now.getTime() - index * 1000).toISOString()
        return {
           folder_id: folderId,
           url: url,
           title: url,
           image_url: `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`,
           created_at: time
        }
      }
    }))
    
    setImportProgress(95)

    const { data, error } = await supabase
      .from('links')
      .insert(linksToInsert)
      .select()

    if (error) {
      console.error('Error importing links:', error)
    } else if (data) {
      fetchLinks() 
    }

    setImportProgress(100)
    setImportText('')
    setIsImporting(false)
    setImportProgress(0)
  }

  const refreshMetadata = async () => {
    if (!canEdit || selectedLinkIds.size === 0) return
    
    const linksToRefresh = links.filter(l => selectedLinkIds.has(l.id))
    
    // Process sequentially or in small batches to avoid overwhelming the server/browser
    for (const link of linksToRefresh) {
      setRefetchingLinkIds(prev => {
        const next = new Set(prev)
        next.add(link.id)
        return next
      })

      try {
        const { title, image } = await fetchMetadata(link.url)
        const finalImage = image || `https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`
        
        const { error } = await supabase
          .from('links')
          .update({ title: title || link.url, image_url: finalImage })
          .eq('id', link.id)

        if (!error) {
          setLinks(prev => {
            const updated = [...prev]
            const index = updated.findIndex(l => l.id === link.id)
            if (index !== -1) {
              updated[index] = { ...updated[index], title: title || link.url, image_url: finalImage }
            }
            return updated
          })
        }
      } finally {
        setRefetchingLinkIds(prev => {
          const next = new Set(prev)
          next.delete(link.id)
          return next
        })
      }
    }
    
    setSelectedLinkIds(new Set())
    setIsSelectionMode(false)
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedLinkIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedLinkIds(newSelection)
  }

  const selectAll = () => {
    if (selectedLinkIds.size === links.length) {
      setSelectedLinkIds(new Set())
    } else {
      setSelectedLinkIds(new Set(links.map(l => l.id)))
    }
  }

  const deleteSelected = async () => {
    if (selectedLinkIds.size === 0) return
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedLinkIds.size} links?`)
    if (!confirmed) return

    const { error } = await supabase
      .from('links')
      .delete()
      .in('id', Array.from(selectedLinkIds))

    if (error) {
      console.error('Error deleting links:', error)
    } else {
      setLinks(links.filter(l => !selectedLinkIds.has(l.id)))
      setSelectedLinkIds(new Set())
      setIsSelectionMode(false)
    }
  }



  const openMoveModal = async () => {
    if (!canEdit || selectedLinkIds.size === 0) return
    
    // Fetch folders to move to
    const { data, error } = await supabase
      .from('folders')
      .select('id, name')
      .neq('id', folderId)
      .order('name')
    
    if (error) {
      console.error('Error fetching folders:', error)
      return
    }
    
    setAvailableFolders(data || [])
    setIsMoveModalOpen(true)
  }

  const deleteLink = async (id: string) => {
    if (!canEdit) return
    if (!window.confirm('Are you sure you want to delete this link?')) return

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting link:', error)
    } else {
      setLinks(links.filter(l => l.id !== id))
    }
  }

  const clearNote = async (id: string) => {
    if (!canEdit) return
    if (!window.confirm('Are you sure you want to clear the notes for this link?')) return

    const { error } = await supabase
      .from('links')
      .update({ note: '' })
      .eq('id', id)

    if (error) {
      console.error('Error clearing note:', error)
    } else {
      setLinks(links.map(l => l.id === id ? { ...l, note: '' } : l))
    }
  }

  const moveLink = async (linkId: string, targetFolderId: string) => {
    if (!canEdit) return
    const { error } = await supabase
      .from('links')
      .update({ folder_id: targetFolderId })
      .eq('id', linkId)

    if (error) {
      console.error('Error moving link:', error)
    } else {
      setLinks(links.filter(l => l.id !== linkId))
      setIsMoveModalOpen(false)
    }
  }

  const refetchMetadata = async (linkId: string, url: string) => {
    if (!canEdit) return
    setRefetchingLinkIds(prev => {
      const next = new Set(prev)
      next.add(linkId)
      return next
    })

    let attempts = 0
    const maxAttempts = 3

    try {
      while (attempts < maxAttempts) {
        try {
          const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
          const data = await res.json()
          
          if (data.title) {
            const { error } = await supabase
              .from('links')
              .update({ 
                title: data.title,
                description: data.description,
                image_url: data.image 
              })
              .eq('id', linkId)

            if (error) throw error

            setLinks(prev => prev.map(l => l.id === linkId ? { 
              ...l, 
              title: data.title,
              image_url: data.image 
            } : l))
            return // Success
          }
          break // If no title but successful fetch, don't retry
        } catch (error) {
          attempts++
          if (attempts < maxAttempts) {
            // Wait 1s before retrying
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          // If max attempts reached, we just exit the loop and function ends (ignoring error)
        }
      }
    } finally {
      setRefetchingLinkIds(prev => {
        const next = new Set(prev)
        next.delete(linkId)
        return next
      })
    }
  }

  const moveSelected = async (targetFolderId: string) => {
    // If we have a single link selected for move (via menu), use that
    if (linkToMove) {
      await moveLink(linkToMove, targetFolderId)
      setLinkToMove(null)
      return
    }

    const { error } = await supabase
      .from('links')
      .update({ folder_id: targetFolderId })
      .in('id', Array.from(selectedLinkIds))

    if (error) {
      console.error('Error moving links:', error)
    } else {
      setLinks(links.filter(l => !selectedLinkIds.has(l.id)))
      setSelectedLinkIds(new Set())
      setIsSelectionMode(false)
      setIsMoveModalOpen(false)
    }
  }

  if (!folderId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-zinc-950">
        <p>Select a folder to view links</p>
      </div>
    )
  }

  // Move Modal
  if (isMoveModalOpen) {
    const moveCount = linkToMove ? 1 : selectedLinkIds.size
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-zinc-800">
          <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Move {moveCount} link{moveCount === 1 ? '' : 's'} to...</h3>
            <button onClick={() => setIsMoveModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>
          <div className="p-2 max-h-[60vh] overflow-y-auto">
            {availableFolders.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No other folders available.</p>
            ) : (
              <div className="space-y-1">
                {availableFolders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => moveSelected(folder.id)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <FolderOpen size={16} />
                    </span>
                    <span className="font-medium truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950 relative">


      {/* Header */}
      <div className="py-6 px-6 lg:px-8 xl:px-10 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-10 overflow-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">{folderName}</h2>
          
          <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                  onClick={() => setViewModePersisted('card')}
                  className={clsx(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'card' ? "bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewModePersisted('list')}
                  className={clsx(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'list' ? "bg-white dark:bg-zinc-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
            >
              <List size={18} />
            </button>
          </div>

          {isSelectionMode && canEdit ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {selectedLinkIds.size === links.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={openMoveModal}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Move
              </button>
              <button
                onClick={refreshMetadata}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Refresh Metadata
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                {selectedLinkIds.size} selected
              </span>
              <button
                onClick={deleteSelected}
                disabled={selectedLinkIds.size === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false)
                  setSelectedLinkIds(new Set())
                }}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : canEdit ? (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Select Items"
              >
                <CheckSquare size={18} />
              </button>
              <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
              <button
                onClick={() => setIsImporting(true)}
                disabled={!canEdit}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  canEdit
                    ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                )}
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Import</span>
              </button>

              <button
                onClick={() => setIsAdding(true)}
                disabled={!canEdit}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm",
                  canEdit
                    ? "text-white bg-gray-900 dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    : "text-gray-400 bg-gray-200 dark:bg-zinc-800 cursor-not-allowed"
                )}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Link</span>
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto py-6 px-4 sm:px-6"
      >
        {isAdding && canEdit && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="Paste URL here..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLink()
                  if (e.key === 'Escape') setIsAdding(false)
                }}
              />
              <button
                onClick={addLink}
                disabled={isLoadingMetadata}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 font-medium disabled:opacity-50"
              >
                {isLoadingMetadata ? 'Fetching...' : 'Save'}
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isImporting && canEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Links</h3>
                <button onClick={() => setIsImporting(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste URLs here (one per line)..."
                className="w-full h-48 p-3 mb-4 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-mono"
                disabled={importProgress > 0}
              />
              
              {importProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                     <span>Importing...</span>
                     <span>{importProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsImporting(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                  disabled={importProgress > 0}
                >
                  Cancel
                </button>
                <button
                  onClick={importLinks}
                  disabled={!importText.trim() || importProgress > 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importProgress > 0 ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {links.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
            <p>No links yet. Add one to get started.</p>
          </div>
        ) : (
          <div className={clsx(
            viewMode === 'card' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "flex flex-col gap-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden"
          )}>
            {links.map(link => (
              <div key={link.id} className="relative group">
                {/** Individual refetch indicator is managed per-link to avoid clearing metadata before its turn */} 
                {isSelectionMode && canEdit && (
                  <div className="absolute top-2 left-2 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelection(link.id)
                      }}
                      className={clsx(
                        "p-1 rounded bg-white dark:bg-zinc-800 shadow-sm border transition-colors",
                        selectedLinkIds.has(link.id) 
                          ? "border-blue-500 text-blue-500" 
                          : "border-gray-200 dark:border-zinc-700 text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {selectedLinkIds.has(link.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </div>
                )}
                {viewMode === 'card' ? (
                  <LinkCard 
                    link={link}
                    isRefetching={refetchingLinkIds.has(link.id)}
                    canEdit={canEdit}
                    onOpenNote={() => onOpenNote(link.id)} 
                    onDeleteLink={() => deleteLink(link.id)}
                    onDeleteNote={() => clearNote(link.id)}
                    onMove={() => {
                      setLinkToMove(link.id)
                      setIsMoveModalOpen(true)
                    }}
                    onRefetch={() => refetchMetadata(link.id, link.url)}
                  />
                ) : (
                  <LinkList 
                    link={link}
                    isRefetching={refetchingLinkIds.has(link.id)}
                    canEdit={canEdit}
                    onOpenNote={() => onOpenNote(link.id)} 
                    onDeleteLink={() => deleteLink(link.id)}
                    onDeleteNote={() => clearNote(link.id)}
                    onMove={() => {
                      setLinkToMove(link.id)
                      setIsMoveModalOpen(true)
                    }}
                    onRefetch={() => refetchMetadata(link.id, link.url)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
