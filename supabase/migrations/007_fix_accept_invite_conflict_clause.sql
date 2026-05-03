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
  on conflict on constraint project_members_project_id_user_id_key do update
    set email = excluded.email,
        display_name = excluded.display_name,
        role = excluded.role;

  update public.project_invites
  set accepted_at = now(),
      accepted_by = auth.uid()
  where id = invite_row.id;

  select p.id, p.title
  into project_id, project_title
  from public.projects p
  where p.id = invite_row.project_id;

  return next;
end;
$$;

grant execute on function public.accept_project_invite(text) to authenticated;
