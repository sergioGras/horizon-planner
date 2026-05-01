create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  "order" integer not null default 0,
  color text not null default 'sage',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  date date not null,
  type text not null default 'commitment' check (type in ('commitment', 'intention')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists sections_project_id_idx on public.sections(project_id);
create index if not exists milestones_project_id_idx on public.milestones(project_id);
create index if not exists milestones_section_id_idx on public.milestones(section_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists sections_set_updated_at on public.sections;
create trigger sections_set_updated_at
before update on public.sections
for each row execute function public.set_updated_at();

drop trigger if exists milestones_set_updated_at on public.milestones;
create trigger milestones_set_updated_at
before update on public.milestones
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.sections enable row level security;
alter table public.milestones enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "projects read own" on public.projects;
create policy "projects read own"
on public.projects for select
using (owner_id = auth.uid());

drop policy if exists "projects insert own" on public.projects;
create policy "projects insert own"
on public.projects for insert
with check (owner_id = auth.uid());

drop policy if exists "projects update own" on public.projects;
create policy "projects update own"
on public.projects for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "projects delete own" on public.projects;
create policy "projects delete own"
on public.projects for delete
using (owner_id = auth.uid());

drop policy if exists "sections read own projects" on public.sections;
create policy "sections read own projects"
on public.sections for select
using (exists (
  select 1 from public.projects
  where projects.id = sections.project_id
    and projects.owner_id = auth.uid()
));

drop policy if exists "sections insert own projects" on public.sections;
create policy "sections insert own projects"
on public.sections for insert
with check (exists (
  select 1 from public.projects
  where projects.id = sections.project_id
    and projects.owner_id = auth.uid()
));

drop policy if exists "sections update own projects" on public.sections;
create policy "sections update own projects"
on public.sections for update
using (exists (
  select 1 from public.projects
  where projects.id = sections.project_id
    and projects.owner_id = auth.uid()
))
with check (exists (
  select 1 from public.projects
  where projects.id = sections.project_id
    and projects.owner_id = auth.uid()
));

drop policy if exists "sections delete own projects" on public.sections;
create policy "sections delete own projects"
on public.sections for delete
using (exists (
  select 1 from public.projects
  where projects.id = sections.project_id
    and projects.owner_id = auth.uid()
));

drop policy if exists "milestones read own projects" on public.milestones;
create policy "milestones read own projects"
on public.milestones for select
using (exists (
  select 1 from public.projects
  where projects.id = milestones.project_id
    and projects.owner_id = auth.uid()
));

drop policy if exists "milestones insert own projects" on public.milestones;
create policy "milestones insert own projects"
on public.milestones for insert
with check (
  exists (
    select 1 from public.projects
    where projects.id = milestones.project_id
      and projects.owner_id = auth.uid()
  )
  and exists (
    select 1 from public.sections
    where sections.id = milestones.section_id
      and sections.project_id = milestones.project_id
  )
);

drop policy if exists "milestones update own projects" on public.milestones;
create policy "milestones update own projects"
on public.milestones for update
using (exists (
  select 1 from public.projects
  where projects.id = milestones.project_id
    and projects.owner_id = auth.uid()
))
with check (
  exists (
    select 1 from public.projects
    where projects.id = milestones.project_id
      and projects.owner_id = auth.uid()
  )
  and exists (
    select 1 from public.sections
    where sections.id = milestones.section_id
      and sections.project_id = milestones.project_id
  )
);

drop policy if exists "milestones delete own projects" on public.milestones;
create policy "milestones delete own projects"
on public.milestones for delete
using (exists (
  select 1 from public.projects
  where projects.id = milestones.project_id
    and projects.owner_id = auth.uid()
));
