# Features & Functionality

## 1. Folder Management
- **Create Folders**: Users can create new folders to organize their links.
- **Navigation**: Sidebar navigation allows quick switching between folders.
- **Empty States**: Visual feedback when a folder is empty.

## 2. Link Management
- **Add Link**: Paste a URL to add it. The app automatically fetches metadata (Title, Description, Image).
- **Import Links**: Bulk import multiple URLs at once (one per line).
    - **Visual Progress**: A progress bar tracks the import status.
    - **Order Preservation**: Imported links are added such that the top URL in your list appears at the top of the view.
- **View Modes**: Toggle between **Card View** (visual grid) and **List View** (compact list).
- **Move Links**: Move links between folders individually or in bulk.
- **Delete Links**: Remove links individually or in bulk.
- **Selection Mode**: Bulk select links for mass actions (Move, Delete).

## 3. Note Taking
- **Rich Text Editor**: Powered by Tiptap, supporting:
    - Headings (H1, H2, H3)
    - Bold, Italic, Strikethrough
    - Bullet Lists, Ordered Lists
    - Blockquotes
    - Code Blocks
    - **LaTeX Equation Support**:
        - **Inline**: Type `$E=mc^2$` to insert inline math.
        - **Block**: Type `$$\sum_{i=0}^n i^2$$` to insert block math.
        - **Editing**: Click any equation to open a **Bubble Menu** and edit the LaTeX code directly.
    - **Readability**: Note body uses a roomier line height; block equations render larger and centered for easier reading.
- **Multi-line Titles**: Note titles auto-expand to fit long text.
- **Auto-save**: Notes and titles are saved automatically on blur or interaction.

## 4. Advanced Metadata Fetching
The application uses a sophisticated strategy to retrieve metadata:
- **Standard Sites**: Scrapes Open Graph (OG) tags and HTML meta tags.
- **PDFs**:
    - Detects PDF URLs and Content-Types.
    - Uses `pdf-parse` to extract the actual title from the PDF file header.
    - Handles "Just a moment..." Cloudflare blocks by falling back to filenames.
- **Academic Sources**:
    - **DOI**: Detects DOIs and queries the Crossref API for authoritative metadata.
    - **ArXiv**: Specialized parsing for ArXiv papers to get clean titles and abstracts.
- **Alignment Forum**: Custom headers to ensure successful scraping of Alignment Forum posts.
- **Retry Logic**: Automatically retries failed metadata fetches up to 3 times.

## 5. User Interface
- **Theme Support**:
    - Strictly follows the **System Theme** (Light/Dark) to blend seamlessly with the OS.
- **Responsive Design**: Adapts to different screen sizes (though primarily optimized for desktop/tablet).
- **Animations**: Subtle transitions and hover effects for a polished feel.
