create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'editor' check (role in ('editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('editor')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists project_members_user_id_idx on public.project_members(user_id);
create index if not exists project_invites_project_id_idx on public.project_invites(project_id);
create index if not exists project_invites_email_idx on public.project_invites(email);

drop trigger if exists project_members_set_updated_at on public.project_members;
create trigger project_members_set_updated_at
before update on public.project_members
for each row execute function public.set_updated_at();

drop trigger if exists project_invites_set_updated_at on public.project_invites;
create trigger project_invites_set_updated_at
before update on public.project_invites
for each row execute function public.set_updated_at();

create or replace function public.project_has_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = p_project_id
            and pm.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.create_project_invite(
  p_project_id uuid,
  p_email text,
  p_role text default 'editor'
)
returns table (
  invite_id uuid,
  token text,
  email text,
  role text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  raw_token text := encode(gen_random_bytes(32), 'hex');
  invite_role text := 'editor';
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if normalized_email = '' then
    raise exception 'Email is required.';
  end if;

  if p_role is not null and p_role <> 'editor' then
    raise exception 'Unsupported invite role.';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = p_project_id
      and owner_id = auth.uid()
  ) then
    raise exception 'Only the project owner can invite members.';
  end if;

  insert into public.project_invites (
    project_id,
    email,
    role,
    token_hash,
    invited_by
  ) values (
    p_project_id,
    normalized_email,
    invite_role,
    encode(digest(raw_token, 'sha256'), 'hex'),
    auth.uid()
  )
  returning id, email, role, expires_at into invite_id, email, role, expires_at;

  token := raw_token;
  return next;
end;
$$;

create or replace function public.accept_project_invite(p_token text)
returns table (
  project_id uuid,
  project_title text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.project_invites%rowtype;
  current_email text;
  current_display_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select
    lower(coalesce(p.email, auth_user.email)),
    coalesce(p.display_name, auth_user.raw_user_meta_data ->> 'full_name', auth_user.raw_user_meta_data ->> 'name')
  into current_email, current_display_name
  from auth.users auth_user
  left join public.profiles p on p.id = auth.uid()
  where auth_user.id = auth.uid();

  if current_email is null then
    raise exception 'Unable to resolve the signed in account email.';
  end if;

  select *
  into invite_row
  from public.project_invites
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'Invite not found or expired.';
  end if;

  if lower(invite_row.email) <> current_email then
    raise exception 'This invite was sent to a different email address.';
  end if;

  insert into public.project_members (
    project_id,
    user_id,
    email,
    display_name,
    role
  ) values (
    invite_row.project_id,
    auth.uid(),
    current_email,
    current_display_name,
    invite_row.role
  )
  on conflict (project_id, user_id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        role = excluded.role;

  update public.project_invites
  set accepted_at = now(),
      accepted_by = auth.uid()
  where id = invite_row.id;

  return query
  select p.id, p.title
  from public.projects p
  where p.id = invite_row.project_id;
end;
$$;

alter table public.project_members enable row level security;
alter table public.project_invites enable row level security;

drop policy if exists "project members read accessible projects" on public.project_members;
create policy "project members read accessible projects"
on public.project_members for select
using (public.project_has_access(project_id));

drop policy if exists "project members insert own project" on public.project_members;
create policy "project members insert own project"
on public.project_members for insert
with check (
  exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = auth.uid()
  )
);

drop policy if exists "project members delete own or owner" on public.project_members;
create policy "project members delete own or owner"
on public.project_members for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = auth.uid()
  )
);

drop policy if exists "project invites read owner" on public.project_invites;
create policy "project invites read owner"
on public.project_invites for select
using (
  exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = auth.uid()
  )
);

drop policy if exists "project invites insert owner" on public.project_invites;
create policy "project invites insert owner"
on public.project_invites for insert
with check (
  exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = auth.uid()
  )
);

drop policy if exists "project invites delete owner" on public.project_invites;
create policy "project invites delete owner"
on public.project_invites for delete
using (
  exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = auth.uid()
  )
);

drop policy if exists "projects read shared" on public.projects;
create policy "projects read shared"
on public.projects for select
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.project_members
    where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
  )
);

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

drop policy if exists "sections read shared projects" on public.sections;
create policy "sections read shared projects"
on public.sections for select
using (public.project_has_access(project_id));

drop policy if exists "sections insert shared projects" on public.sections;
create policy "sections insert shared projects"
on public.sections for insert
with check (public.project_has_access(project_id));

drop policy if exists "sections update shared projects" on public.sections;
create policy "sections update shared projects"
on public.sections for update
using (public.project_has_access(project_id))
with check (public.project_has_access(project_id));

drop policy if exists "sections delete shared projects" on public.sections;
create policy "sections delete shared projects"
on public.sections for delete
using (public.project_has_access(project_id));

drop policy if exists "milestones read shared projects" on public.milestones;
create policy "milestones read shared projects"
on public.milestones for select
using (public.project_has_access(project_id));

drop policy if exists "milestones insert shared projects" on public.milestones;
create policy "milestones insert shared projects"
on public.milestones for insert
with check (
  public.project_has_access(project_id)
  and exists (
    select 1
    from public.sections
    where sections.id = milestones.section_id
      and sections.project_id = milestones.project_id
  )
);

drop policy if exists "milestones update shared projects" on public.milestones;
create policy "milestones update shared projects"
on public.milestones for update
using (public.project_has_access(project_id))
with check (
  public.project_has_access(project_id)
  and exists (
    select 1
    from public.sections
    where sections.id = milestones.section_id
      and sections.project_id = milestones.project_id
  )
);

drop policy if exists "milestones delete shared projects" on public.milestones;
create policy "milestones delete shared projects"
on public.milestones for delete
using (public.project_has_access(project_id));
