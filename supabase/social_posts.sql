-- Social posts table for DentAI social media manager
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  platforms text[] not null default '{facebook,instagram,linkedin,tiktok}',
  category text not null default 'post',
  status text not null default 'pending' check (status in ('pending', 'draft', 'scheduled', 'published', 'rejected', 'failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  media_urls text[] default '{}',
  ayrshare_id text,
  post_ids jsonb default '{}',
  created_at timestamptz default now() not null
);

-- RLS
alter table public.social_posts enable row level security;

create policy "Users can manage their own posts"
  on public.social_posts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for scheduled posts (cron query)
create index if not exists social_posts_status_scheduled_at
  on public.social_posts (status, scheduled_at)
  where status = 'scheduled';
