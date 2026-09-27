-- Run this once in Supabase Dashboard > SQL Editor.
-- Non-FTU accounts can create at most 2 posts per UTC calendar day.

create or replace function public.enforce_non_ftu_daily_post_limit()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requester_email text;
  posts_today integer;
  utc_day_start timestamptz := date_trunc('day', timezone('UTC', now()));
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a post.';
  end if;

  select lower(email)
    into requester_email
    from auth.users
   where id = auth.uid();

  if requester_email is null then
    raise exception 'Unable to identify the signed-in account.';
  end if;

  if lower(coalesce(new.user_email, '')) <> requester_email then
    raise exception 'The post owner does not match the signed-in account.';
  end if;

  -- FTU accounts are not subject to the non-FTU daily limit.
  if requester_email like '%@ftu.edu.vn' then
    return new;
  end if;

  -- Serialize requests from the same account so concurrent inserts cannot bypass the limit.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));

  select count(*)
    into posts_today
    from public.items
   where lower(user_email) = requester_email
     and created_at >= utc_day_start
     and created_at < utc_day_start + interval '1 day';

  if posts_today >= 2 then
    raise exception 'NON_FTU_DAILY_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_non_ftu_daily_post_limit on public.items;

create trigger enforce_non_ftu_daily_post_limit
before insert on public.items
for each row
execute function public.enforce_non_ftu_daily_post_limit();

revoke all on function public.enforce_non_ftu_daily_post_limit() from public;
