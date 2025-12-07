# Woods - Project Overview

**Woods** is a personal knowledge management application designed for curating, organizing, and annotating links from the web. It combines a clean, premium aesthetic with powerful features like automated metadata extraction and rich text note-taking.

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Editor**: [Tiptap](https://tiptap.dev/) (Headless rich text editor)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Metadata Parsing**: `cheerio`, `pdf-parse`

## Key Features

- **Link Curation**: Save links with automatic metadata fetching (title, description, image).
- **Organization**: Group links into folders.
- **Rich Notes**: Attach rich text notes to any link using a Notion-style editor.
- **PDF Support**: Specialized handling for PDF URLs, including title extraction from binary content.
- **Theme System**: Fully supported Light, Dark, and System themes with a premium color palette.

## Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd woods
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.
