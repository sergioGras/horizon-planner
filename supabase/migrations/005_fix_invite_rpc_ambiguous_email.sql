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

grant execute on function public.create_project_invite(uuid, text, text) to authenticated;
