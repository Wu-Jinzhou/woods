-- Create folders table
create table folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Create links table
create table links (
  id uuid default gen_random_uuid() primary key,
  folder_id uuid references folders(id) on delete cascade,
  url text not null,
  title text,
  image_url text,
  note text, -- Stores HTML/JSON from Tiptap
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table folders enable row level security;
alter table links enable row level security;

-- Create policies (allow all for now since auth is not implemented yet, but good practice to have RLS enabled)
create policy "Allow all access to folders" on folders for all using (true);
create policy "Allow all access to links" on links for all using (true);
