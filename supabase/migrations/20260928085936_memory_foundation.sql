-- Stage 4B: dedicated Korea Route STAGING only; never apply to another project.
create function public.memory_plain(value text, max_length integer) returns boolean
language sql immutable set search_path = '' as $$
 select value is not null and length(value) <= max_length
 and value !~ '[<>[:cntrl:]]' and value !~* '(data:|base64|https?://|blob:)'
 and value !~ '[A-Za-z0-9+/]{128}';
$$;
create table public.memory_journeys (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 city text not null default 'Suwon' check(city='Suwon'), trip_date date not null,
 title text check(title is null or public.memory_plain(title,100)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,user_id)
);
create table public.travel_memories (
 id uuid primary key default gen_random_uuid(), journey_id uuid not null, user_id uuid not null references auth.users(id),
 card_id text not null check(card_id in ('suwon-001','suwon-002','suwon-003')),
 note text not null default '' check(public.memory_plain(note,1000)), revision integer not null default 1 check(revision>=1),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
 foreign key(journey_id,user_id) references public.memory_journeys(id,user_id),
 unique(journey_id,card_id), unique(id,user_id)
);
create table public.memory_media (
 id uuid primary key default gen_random_uuid(), memory_id uuid not null, user_id uuid not null references auth.users(id),
 media_type text not null check(media_type in ('photo','video')), storage_path text not null unique,
 sort_order integer not null, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','video/mp4')),
 size_bytes bigint not null check(size_bytes>0), status text not null check(status in ('reserved','ready','deleting')),
 created_at timestamptz not null default now(),
 foreign key(memory_id,user_id) references public.travel_memories(id,user_id),
 check((media_type='photo' and sort_order between 0 and 4 and mime_type like 'image/%') or (media_type='video' and sort_order=0 and mime_type='video/mp4')),
 check(storage_path=user_id::text||'/'||memory_id::text||'/'||id::text||case mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' when 'image/webp' then '.webp' when 'video/mp4' then '.mp4' end),
 unique(memory_id,media_type,sort_order)
);
create table public.memory_operations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
 kind text not null check(kind in ('delete_memory','delete_account')), target_id uuid not null,
 state text not null default 'pending' check(state in ('pending','storage_removed','done')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,kind,target_id)
);
create index memory_journeys_owner on public.memory_journeys(user_id);
create index travel_memories_owner on public.travel_memories(user_id);
create index memory_media_owner on public.memory_media(user_id);
create index memory_operations_owner on public.memory_operations(user_id);

create function public.memory_stamp() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if new.id<>old.id or new.user_id<>old.user_id then raise exception 'immutable ownership'; end if;
  new.created_at=old.created_at;
  if TG_TABLE_NAME='travel_memories' then
   if new.journey_id<>old.journey_id or new.card_id<>old.card_id then raise exception 'immutable memory parent'; end if;
   new.revision=old.revision+1;
  end if;
 else
  new.created_at=clock_timestamp();
  if TG_TABLE_NAME='travel_memories' then new.revision=1; end if;
 end if;
 new.updated_at=clock_timestamp();return new;
end $$;
create trigger memory_journey_stamp before insert or update on public.memory_journeys for each row execute function public.memory_stamp();
create trigger memory_record_stamp before insert or update on public.travel_memories for each row execute function public.memory_stamp();
create trigger memory_operation_stamp before insert or update on public.memory_operations for each row execute function public.memory_stamp();
create function public.memory_media_stamp() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  if (new.id,new.user_id,new.memory_id,new.storage_path,new.media_type,new.mime_type,new.sort_order,new.size_bytes)
   is distinct from (old.id,old.user_id,old.memory_id,old.storage_path,old.media_type,old.mime_type,old.sort_order,old.size_bytes)
  then raise exception 'immutable media reservation'; end if;
  new.created_at=old.created_at;
 else new.created_at=clock_timestamp(); end if;
 if not exists(select 1 from public.travel_memories where id=new.memory_id and user_id=new.user_id and deleted_at is null) then raise exception 'memory unavailable'; end if;
 return new;
end $$;
create trigger memory_media_stamp before insert or update on public.memory_media for each row execute function public.memory_media_stamp();

alter table public.memory_journeys enable row level security;
alter table public.travel_memories enable row level security;
alter table public.memory_media enable row level security;
alter table public.memory_operations enable row level security;
revoke all on public.memory_journeys,public.travel_memories,public.memory_media,public.memory_operations from anon,authenticated;
grant select,insert on public.memory_journeys,public.travel_memories to authenticated;
grant update(note) on public.travel_memories to authenticated;
grant select on public.memory_media,public.memory_operations to authenticated;
grant all on public.memory_journeys,public.travel_memories,public.memory_media,public.memory_operations to service_role;
create policy own_operations on public.memory_operations for select to authenticated using(user_id=(select auth.uid()));
create function public.memory_account_active() returns boolean language sql stable set search_path='' as $$
 select auth.uid() is not null and not exists(select 1 from public.memory_operations where user_id=auth.uid() and kind='delete_account');
$$;
revoke all on function public.memory_account_active() from public;
grant execute on function public.memory_account_active() to authenticated,service_role;
create policy own_journeys_read on public.memory_journeys for select to authenticated using(user_id=(select auth.uid()) and (select public.memory_account_active()));
create policy own_journeys_insert on public.memory_journeys for insert to authenticated with check(user_id=(select auth.uid()) and (select public.memory_account_active()));
create policy own_memories_read on public.travel_memories for select to authenticated using(user_id=(select auth.uid()) and deleted_at is null and (select public.memory_account_active()));
create policy own_memories_insert on public.travel_memories for insert to authenticated with check(user_id=(select auth.uid()) and deleted_at is null and (select public.memory_account_active()));
create policy own_memories_update on public.travel_memories for update to authenticated using(user_id=(select auth.uid()) and deleted_at is null and (select public.memory_account_active())) with check(user_id=(select auth.uid()) and deleted_at is null and (select public.memory_account_active()));
create policy own_media_read on public.memory_media for select to authenticated using(user_id=(select auth.uid()) and (select public.memory_account_active()) and exists(select 1 from public.travel_memories m where m.id=memory_id and m.deleted_at is null));

insert into storage.buckets(id,name,public) values('travel-memories','travel-memories',false) on conflict(id) do nothing;
do $$ begin if exists(select 1 from storage.buckets where id='travel-memories' and public) then raise exception 'private bucket required'; end if; end $$;
-- Read authorization only. Upload/finalize remain disabled until Stage 4C byte policy and MIME validation.
create policy memory_private_read on storage.objects for select to authenticated using(
 bucket_id='travel-memories' and exists(select 1 from public.memory_media m where m.storage_path=name and m.status='ready' and m.user_id=(select auth.uid()))
);
