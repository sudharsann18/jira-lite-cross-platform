begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  username text not null,
  push_token text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists push_token text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

insert into public.profiles (id, username)
select
  user_row.id,
  case
    when user_row.username_count = 1 then lower(btrim(user_row.raw_username))
    else 'user_' || replace(user_row.id::text, '-', '')
  end
from (
  select
    id,
    raw_user_meta_data ->> 'username' as raw_username,
    count(*) over (
      partition by lower(btrim(raw_user_meta_data ->> 'username'))
    ) as username_count
  from auth.users
) as user_row
where nullif(btrim(user_row.raw_username), '') is not null
   or user_row.username_count > 1
on conflict (id) do nothing;

insert into public.profiles (id, username)
select id, 'user_' || replace(id::text, '-', '')
from auth.users
where nullif(btrim(raw_user_meta_data ->> 'username'), '') is null
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'profiles_username_lower_uidx'
  ) then
    if exists (
      select lower(username)
      from public.profiles
      group by lower(username)
      having count(*) > 1
    ) then
      raise warning 'Duplicate profile usernames found; profiles_username_lower_uidx was not created.';
    else
      create unique index profiles_username_lower_uidx on public.profiles (lower(username));
    end if;
  end if;
end
$$;

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(lower(btrim(p_username)), '') is not null
    and not exists (
      select 1
      from public.profiles
      where lower(username) = lower(btrim(p_username))
    );
$$;

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_username text;
begin
  new_username := nullif(lower(btrim(new.raw_user_meta_data ->> 'username')), '');
  if new_username is null then
    new_username := 'user_' || replace(new.id::text, '-', '');
  end if;

  insert into public.profiles (id, username)
  values (new.id, new_username)
  on conflict (id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created_profile'
      and not tgisinternal
  ) then
    create trigger on_auth_user_created_profile
      after insert on auth.users
      for each row execute function public.handle_new_auth_user_profile();
  end if;
end
$$;

alter table public.teams add column if not exists admin_profile_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.teams'::regclass
      and conname = 'teams_admin_profile_id_fkey'
  ) then
    alter table public.teams
      add constraint teams_admin_profile_id_fkey
      foreign key (admin_profile_id) references public.profiles(id)
      not valid;
  end if;
end
$$;

update public.teams
set admin_profile_id = admin_id::uuid
where admin_profile_id is null
  and admin_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1 from public.profiles p where p.id = public.teams.admin_id::uuid
  );

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'teams_name_code_uidx'
  ) then
    if exists (
      select team_name, team_code
      from public.teams
      group by team_name, team_code
      having count(*) > 1
    ) then
      raise warning 'Duplicate team names/codes found; teams_name_code_uidx was not created.';
    else
      create unique index teams_name_code_uidx on public.teams (team_name, team_code);
    end if;
  end if;
end
$$;

alter table public.team_members add column if not exists profile_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.team_members'::regclass
      and conname = 'team_members_profile_id_fkey'
  ) then
    alter table public.team_members
      add constraint team_members_profile_id_fkey
      foreign key (profile_id) references public.profiles(id)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.team_members'::regclass
      and conname = 'team_members_team_id_id_key'
  ) then
    alter table public.team_members
      add constraint team_members_team_id_id_key unique (team_id, id);
  end if;
end
$$;

create index if not exists team_members_team_id_idx on public.team_members (team_id);

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'team_members_team_profile_uidx'
  ) then
    create unique index team_members_team_profile_uidx
      on public.team_members (team_id, profile_id)
      where profile_id is not null;
  end if;
end
$$;

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  invited_profile_id uuid not null references public.profiles(id),
  invited_email text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists team_invites_invited_profile_status_idx
  on public.team_invites (invited_profile_id, status);

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'team_invites_team_profile_uidx'
  ) then
    create unique index team_invites_team_profile_uidx
      on public.team_invites (team_id, invited_profile_id);
  end if;
end
$$;

alter table public.tasks add column if not exists created_at timestamptz not null default now();
alter table public.tasks add column if not exists archived_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.team_members'::regclass
      and conname = 'team_members_team_id_id_key'
  ) then
    raise exception 'team_members_team_id_id_key is required before adding task assignment integrity.';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_team_assignment_same_team_fkey'
  ) then
    alter table public.tasks
      add constraint tasks_team_assignment_same_team_fkey
      foreign key (team_id, assigned_to)
      references public.team_members(team_id, id)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_status_allowed_check'
  ) then
    alter table public.tasks
      add constraint tasks_status_allowed_check
      check (status is null or status in ('todo', 'inprocess', 'review', 'completed'))
      not valid;
  end if;
end
$$;

create index if not exists tasks_team_id_idx on public.tasks (team_id);
create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);

create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.teams t
    where t.id = p_team_id
      and (t.admin_profile_id = auth.uid() or t.admin_id = auth.uid()::text)
  );
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = p_team_id and m.profile_id = auth.uid()
  );
$$;

create or replace function public.has_pending_team_invite(p_team_id uuid, p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_invites i
    where i.team_id = p_team_id
      and i.invited_profile_id = p_profile_id
      and i.status = 'pending'
  );
$$;

create or replace function public.is_assigned_team_member(p_team_id uuid, p_member_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = p_team_id
      and m.id = p_member_id
      and m.profile_id = auth.uid()
  );
$$;

create or replace function public.accept_team_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_row record;
  member_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select team_id, invited_profile_id, status
  into invite_row
  from public.team_invites
  where id = p_invite_id
  for update;

  if not found or invite_row.invited_profile_id <> auth.uid() then
    raise exception 'Invite not found';
  end if;
  if invite_row.status <> 'pending' then
    raise exception 'Invite is no longer pending';
  end if;

  select username into member_name
  from public.profiles
  where id = auth.uid();

  if member_name is null then
    raise exception 'Profile not found';
  end if;

  insert into public.team_members (id, name, team_id, profile_id)
  values (auth.uid()::text || '-' || invite_row.team_id::text, member_name, invite_row.team_id, auth.uid())
  on conflict (team_id, profile_id) where profile_id is not null do nothing;

  update public.team_invites
  set status = 'accepted'
  where id = p_invite_id;

  return invite_row.team_id;
end;
$$;

create or replace function public.archive_task(p_task_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_team_id uuid;
begin
  select team_id into target_team_id
  from public.tasks
  where id = p_task_id;

  if not found or not public.is_team_admin(target_team_id) then
    raise exception 'Task not found or admin access required';
  end if;

  update public.tasks
  set archived_at = coalesce(archived_at, now())
  where id = p_task_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.team_invites enable row level security;

revoke all on table public.profiles, public.teams, public.team_members,
  public.tasks, public.team_invites from anon, authenticated;

grant select (id, username) on public.profiles to authenticated;
grant update (push_token) on public.profiles to authenticated;
grant select, insert on public.teams to authenticated;
grant select, insert on public.team_members to authenticated;
grant select, insert on public.tasks to authenticated;
grant update (status) on public.tasks to authenticated;
grant select, insert on public.team_invites to authenticated;
grant update (status) on public.team_invites to authenticated;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
revoke all on function public.is_team_admin(uuid) from public;
revoke all on function public.is_team_member(uuid) from public;
revoke all on function public.has_pending_team_invite(uuid, uuid) from public;
revoke all on function public.is_assigned_team_member(uuid, text) from public;
grant execute on function public.is_team_admin(uuid) to authenticated;
grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.has_pending_team_invite(uuid, uuid) to authenticated;
grant execute on function public.is_assigned_team_member(uuid, text) to authenticated;
revoke all on function public.accept_team_invite(uuid) from public;
grant execute on function public.accept_team_invite(uuid) to authenticated;
revoke all on function public.archive_task(text) from public;
grant execute on function public.archive_task(text) to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_directory_select') then
    create policy profiles_directory_select on public.profiles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_update_push_token') then
    create policy profiles_self_update_push_token on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'teams' and policyname = 'teams_member_admin_invitee_select') then
    create policy teams_member_admin_invitee_select on public.teams for select to authenticated using (public.is_team_admin(id) or public.is_team_member(id) or public.has_pending_team_invite(id, auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'teams' and policyname = 'teams_owner_insert') then
    create policy teams_owner_insert on public.teams for insert to authenticated with check (admin_profile_id = auth.uid() and admin_id = auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_members' and policyname = 'team_members_team_select') then
    create policy team_members_team_select on public.team_members for select to authenticated using (profile_id = auth.uid() or public.is_team_admin(team_id) or public.is_team_member(team_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_members' and policyname = 'team_members_accept_invite_insert') then
    create policy team_members_accept_invite_insert on public.team_members for insert to authenticated with check (profile_id = auth.uid() and public.has_pending_team_invite(team_id, auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_team_select') then
    create policy tasks_team_select on public.tasks for select to authenticated using (public.is_team_admin(team_id) or public.is_team_member(team_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_admin_insert') then
    create policy tasks_admin_insert on public.tasks for insert to authenticated with check (public.is_team_admin(team_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_admin_or_assignee_status_update') then
    create policy tasks_admin_or_assignee_status_update on public.tasks for update to authenticated using (public.is_team_admin(team_id) or public.is_assigned_team_member(team_id, assigned_to)) with check (public.is_team_admin(team_id) or public.is_assigned_team_member(team_id, assigned_to));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_invites' and policyname = 'team_invites_participant_select') then
    create policy team_invites_participant_select on public.team_invites for select to authenticated using (invited_profile_id = auth.uid() or public.is_team_admin(team_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_invites' and policyname = 'team_invites_admin_insert') then
    create policy team_invites_admin_insert on public.team_invites for insert to authenticated with check (public.is_team_admin(team_id) and invited_profile_id <> auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_invites' and policyname = 'team_invites_invitee_reject') then
    create policy team_invites_invitee_reject on public.team_invites for update to authenticated using (invited_profile_id = auth.uid() and status = 'pending') with check (invited_profile_id = auth.uid() and status = 'rejected');
  end if;
end
$$;

commit;