create table if not exists public.project_display_links (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists project_display_links_project_id_idx
on public.project_display_links(project_id);

create unique index if not exists project_display_links_one_active_per_project_idx
on public.project_display_links(project_id)
where revoked_at is null;

alter table public.project_display_links enable row level security;

revoke all on table public.project_display_links from anon;
grant select on table public.project_display_links to authenticated;

drop policy if exists "display links read owner" on public.project_display_links;
create policy "display links read owner"
on public.project_display_links for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_display_links.project_id
      and p.owner_id = auth.uid()
  )
);

create or replace function public.create_project_display_link(p_project_id uuid)
returns table (
  display_link_id uuid,
  token text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and p.owner_id = auth.uid()
  ) then
    raise exception 'Only the project owner can create display links.';
  end if;

  update public.project_display_links pdl
  set revoked_at = now()
  where pdl.project_id = p_project_id
    and pdl.revoked_at is null;

  insert into public.project_display_links (
    project_id,
    token_hash,
    created_by
  ) values (
    p_project_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    auth.uid()
  )
  returning
    project_display_links.id,
    project_display_links.created_at
  into display_link_id, created_at;

  token := raw_token;
  return next;
end;
$$;

create or replace function public.revoke_project_display_link(p_display_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  update public.project_display_links pdl
  set revoked_at = now()
  where pdl.id = p_display_link_id
    and pdl.revoked_at is null
    and exists (
      select 1
      from public.projects p
      where p.id = pdl.project_id
        and p.owner_id = auth.uid()
    );

  if not found then
    raise exception 'Display link not found or access denied.';
  end if;
end;
$$;

create or replace function public.get_display_roadmap(p_token text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, extensions
as $$
declare
  display_project_id uuid;
  payload jsonb;
begin
  select pdl.project_id
  into display_project_id
  from public.project_display_links pdl
  where pdl.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and pdl.revoked_at is null
  limit 1;

  if display_project_id is null then
    raise exception 'Display link not found or revoked.';
  end if;

  select jsonb_build_object(
    'project', jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'updatedAt', p.updated_at
    ),
    'sections', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'title', s.title,
          'order', s."order",
          'color', s.color
        )
        order by s."order"
      )
      from public.sections s
      where s.project_id = p.id
    ), '[]'::jsonb),
    'milestones', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'sectionId', m.section_id,
          'title', m.title,
          'description', m.description,
          'date', m.date,
          'type', m.type
        )
        order by m.date, m.created_at
      )
      from public.milestones m
      where m.project_id = p.id
    ), '[]'::jsonb)
  )
  into payload
  from public.projects p
  where p.id = display_project_id
    and p.archived_at is null;

  if payload is null then
    raise exception 'Display project not found.';
  end if;

  return payload;
end;
$$;

revoke all on function public.create_project_display_link(uuid) from public;
revoke all on function public.revoke_project_display_link(uuid) from public;
revoke all on function public.get_display_roadmap(text) from public;

grant execute on function public.create_project_display_link(uuid) to authenticated;
grant execute on function public.revoke_project_display_link(uuid) to authenticated;
grant execute on function public.get_display_roadmap(text) to anon, authenticated;
