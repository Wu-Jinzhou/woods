
'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import FolderView from '@/components/FolderView'
import NoteEditor from '@/components/NoteEditor'
import { supabase } from '@/lib/supabase'
import clsx from 'clsx'
import { Session } from '@supabase/supabase-js'

interface LinkType {
  id: string
  url: string
  title: string | null
  image_url: string | null
  note: string | null
  created_at: string
}

export default function Home() {
  const AUTHORIZED_EMAIL = process.env.NEXT_PUBLIC_AUTH_EMAIL || ''

  const [folders, setFolders] = useState<{ id: string, name: string }[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [links, setLinks] = useState<any[]>([])
  const [openLinks, setOpenLinks] = useState<{ id: string; title: string | null; url: string; note: string | null }[]>([])
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetchFolders()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setIsSidebarCollapsed(mobile ? true : false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setAuthChecked(true)
    }
    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSelectedFolderId(null)
    setActiveLinkId(null)
  }

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching folders:', error)
    } else {
      setFolders(data || [])
    }
  }

  const handleAddFolder = async (name: string) => {
    if (!canEdit) return
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
    if (!canEdit) return
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
      setSelectedFolderId(null)
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
  const isMobileSidebarOpen = isMobile && !isSidebarCollapsed
  const isAuthorized = session?.user?.email === AUTHORIZED_EMAIL
  const canEdit = !!isAuthorized

  if (!authChecked) {
    return (
      <main className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
        <p className="text-sm text-gray-500 dark:text-gray-400">Checking authentication…</p>
      </main>
    )
  }

  return (
    <main className={clsx(
      "relative flex h-screen w-full bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 font-sans",
      isMobileSidebarOpen ? "overflow-hidden" : "overflow-hidden md:overflow-auto"
    )}>
      <Sidebar 
        folders={folders}
        selectedFolderId={selectedFolderId} 
        onSelectFolder={(id) => {
          setSelectedFolderId(id)
          setActiveLinkId(null) // Go back to folder view when selecting a folder
          if (isMobile) setIsSidebarCollapsed(true)
        }}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
        openLinks={openLinks.map(l => ({ id: l.id, title: l.title, url: l.url }))}
        activeLinkId={activeLinkId}
        onSelectOpenLink={setActiveLinkId}
        onCloseOpenLink={handleCloseNote}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogoClick={() => {
          setSelectedFolderId(null)
          setActiveLinkId(null)
          if (isMobile) setIsSidebarCollapsed(true)
        }}
        canEdit={canEdit}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isAuthorized={isAuthorized}
      />

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 md:hidden z-40"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <div className={clsx(
        "flex-1 h-full relative transition-all duration-200",
        isMobileSidebarOpen ? "hidden md:block" : "block ml-12 md:ml-0"
      )}>
          {activeLink ? (
            <NoteEditor
              key={activeLink.id} // Force re-mount on link change to reset editor content
              linkId={activeLink.id}
              initialContent={activeLink.note}
              url={activeLink.url}
              title={activeLink.title}
              canEdit={canEdit}
              onClose={() => handleCloseNote(activeLink.id)}
              onTitleChange={(newTitle) => {
                setOpenLinks(openLinks.map(l => l.id === activeLink.id ? { ...l, title: newTitle } : l))
              }}
            />
          ) : (
            selectedFolderId ? (
              <FolderView 
                folderId={selectedFolderId} 
                folderName={folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}
                canEdit={canEdit}
                onOpenNote={handleOpenNote}
              />
            ) : (
              <div className="h-full flex flex-col px-8 py-8">
                <div className="flex-1 flex items-center justify-center">
                  <div className="max-w-3xl text-center space-y-6">
                    <p className="text-xl md:text-2xl font-serif leading-relaxed text-gray-800 dark:text-gray-200 ">
                      “I went to the <span className="inline-block align-middle"><img src="/images/woods_text_logo.png" alt="Woods" className="inline h-3 md:h-4 align-middle dark:invert mb-1 mx-[1px]" /></span> because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.” <br /> — <span className="italic">Walden</span>, Henry David Thoreau
                    </p>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
                      Hermann Ebbinghaus’ forgetting curve shows we lose about 50% of new information within an hour and roughly 70–80% by the next day. <span className="inline-block align-middle"><img src="/images/woods_text_logo.png" alt="Woods" className="inline h-2 md:h-3 align-middle dark:invert mb-[5px] mx-[1px]" /></span> helps you remember.
                    </p>
                  </div>
                </div>
                <div className="pt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1 text-center">
                  <p>Woods is my personal knowledge base that helps me organize knowledge and tabs.</p>
                  <p>It is currently being developed for my personal use and is expected to roll out to other users in the future.</p>
                </div>
              </div>
            )
          )}
      </div>
    </main>
  )
}
