
'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import FolderView from '@/components/FolderView'
import NoteEditor from '@/components/NoteEditor'
import { supabase } from '@/lib/supabase'

interface LinkType {
  id: string
  url: string
  title: string | null
  image_url: string | null
  note: string | null
  created_at: string
}

export default function Home() {
  const [folders, setFolders] = useState<{ id: string, name: string }[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [links, setLinks] = useState<any[]>([])
  const [openLinks, setOpenLinks] = useState<{ id: string; title: string | null; url: string; note: string | null }[]>([])
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching folders:', error)
    } else {
      setFolders(data || [])
      // Select first folder by default if none selected
      if (data && data.length > 0 && !selectedFolderId) {
        setSelectedFolderId(data[0].id)
      }
    }
  }

  const handleAddFolder = async (name: string) => {
    const { data, error } = await supabase
      .from('folders')
      .insert([{ name }])
      .select()

    if (error) {
      console.error('Error creating folder:', error)
    } else {
      setFolders([...folders, data[0]])
      setSelectedFolderId(data[0].id)
    }
  }

  const handleDeleteFolder = async (id: string) => {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting folder:', error)
    } else {
      const newFolders = folders.filter(f => f.id !== id)
      setFolders(newFolders)
      if (selectedFolderId === id) {
        setSelectedFolderId(newFolders.length > 0 ? newFolders[0].id : null)
      }
    }
  }

  useEffect(() => {
    if (selectedFolderId) {
      // fetchLinks(selectedFolderId) // FolderView handles its own fetching now, but we might want to sync?
      // Actually FolderView takes folderId and fetches.
    }
  }, [selectedFolderId])

  const handleOpenNote = (linkId: string) => {
    const link = links.find(l => l.id === linkId)
    // We need to find the link details. If it's not in the current view (unlikely if clicked), we might need to fetch.
    // But handleOpenNote is passed to FolderView which has the links.
    // Wait, FolderView has the links state. page.tsx doesn't know about links unless we lift that too or pass it up.
    // Currently FolderView passes `onOpenNote` which just sends the ID.
    // We need to fetch the link details or have FolderView pass them.
    // Let's fetch it to be safe and simple.
    fetchLinkAndOpen(linkId)
  }

  const fetchLinkAndOpen = async (linkId: string) => {
    // Check if already open
    const existing = openLinks.find(l => l.id === linkId)
    if (existing) {
      setActiveLinkId(linkId)
      return
    }

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', linkId)
      .single()

    if (error) {
      console.error('Error fetching link:', error)
      return
    }

    setOpenLinks([...openLinks, { id: data.id, title: data.title, url: data.url, note: data.note }])
    setActiveLinkId(data.id)
  }

  const handleCloseNote = (linkId: string) => {
    const newOpenLinks = openLinks.filter(l => l.id !== linkId)
    setOpenLinks(newOpenLinks)
    if (activeLinkId === linkId) {
      setActiveLinkId(null)
    }
  }

  const activeLink = openLinks.find(l => l.id === activeLinkId)

  return (
    <main className="flex h-screen w-full bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      <Sidebar 
        folders={folders}
        selectedFolderId={selectedFolderId} 
        onSelectFolder={(id) => {
          setSelectedFolderId(id)
          setActiveLinkId(null) // Go back to folder view when selecting a folder
        }}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
        openLinks={openLinks.map(l => ({ id: l.id, title: l.title, url: l.url }))}
        activeLinkId={activeLinkId}
        onSelectOpenLink={setActiveLinkId}
        onCloseOpenLink={handleCloseNote}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className="flex-1 h-full relative">
        {activeLink ? (
          <NoteEditor
            key={activeLink.id} // Force re-mount on link change to reset editor content
            linkId={activeLink.id}
            initialContent={activeLink.note}
            url={activeLink.url}
            title={activeLink.title}
            onClose={() => handleCloseNote(activeLink.id)}
            onTitleChange={(newTitle) => {
              setOpenLinks(openLinks.map(l => l.id === activeLink.id ? { ...l, title: newTitle } : l))
            }}
          />
        ) : (
          <FolderView 
            folderId={selectedFolderId} 
            folderName={folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}
            onOpenNote={handleOpenNote}
          />
        )}
      </div>
    </main>
  )
}
