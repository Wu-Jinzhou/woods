
import type { Metadata } from "next";
import { Outfit, Newsreader } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from '@/components/ThemeProvider'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Woods',
  description: 'A personal knowledge base',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${newsreader.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
