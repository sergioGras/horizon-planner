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
set search_path = public, extensions
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
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
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    auth.uid()
  )
  returning
    project_invites.id,
    project_invites.email,
    project_invites.role,
    project_invites.expires_at
  into invite_id, email, role, expires_at;

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
set search_path = public, extensions
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
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
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
