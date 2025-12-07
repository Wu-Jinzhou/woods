# Architecture & Code Structure

## Directory Structure

```
woods/
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── api/             # API Routes (e.g., metadata fetching)
│   │   ├── globals.css      # Global styles and Tailwind config
│   │   ├── layout.tsx       # Root layout with ThemeProvider
│   │   └── page.tsx         # Main application page
│   ├── components/          # React components
│   │   ├── FolderView.tsx   # Main view for a selected folder
│   │   ├── LinkCard.tsx     # Card component for a link
│   │   ├── LinkList.tsx     # List item component for a link
│   │   ├── NoteEditor.tsx   # Tiptap rich text editor
│   │   └── Sidebar.tsx      # Navigation sidebar
│   └── lib/
│       └── supabase.ts      # Supabase client configuration
├── documentation/           # Project documentation
├── public/                  # Static assets
└── ...config files          # tsconfig, next.config, etc.
```

## Key Components

### `FolderView.tsx`
The central component that manages the display of links within a folder. It handles:
- Fetching links from Supabase.
- Managing state for view modes (Card/List), selection, and modals.
- Logic for adding, moving, and deleting links.
- Calling the metadata API.

### `NoteEditor.tsx`
A wrapper around the Tiptap editor. It manages:
- The editor content state.
- The editable note title (using an auto-expanding textarea).
- Saving changes to Supabase.
- Rendering the rich text toolbar.
- **Extensions**: Configured with `StarterKit`, `Link`, `TaskList`, `Mathematics` (Inline/Block), and `BubbleMenu` for inline formula editing.

### `api/metadata/route.ts`
A server-side API route that handles metadata extraction. It implements the logic for:
- Fetching HTML/PDF content.
- Parsing metadata using `cheerio` (for HTML) and `pdf-parse` (for PDFs).
- Handling specific domains (ArXiv, Crossref).

## Database Schema (Supabase)

### `folders`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary Key |
| `created_at` | timestamptz | Creation timestamp |
| `name` | text | Name of the folder |

### `links`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary Key |
| `created_at` | timestamptz | Creation timestamp |
| `url` | text | The saved URL |
| `title` | text | Fetched or user-edited title |
| `description`| text | Fetched description |
| `image_url` | text | Fetched OG image URL |
| `note` | text | HTML content of the user's note |
| `folder_id` | uuid | Foreign Key -> folders.id |

## Styling
- **Tailwind CSS v4**: Used for all styling.
- **Fonts**: `Outfit` (Sans) and `Newsreader` (Serif).
- **Dark Mode**: Implemented via CSS variables and the `.dark` class strategy.
