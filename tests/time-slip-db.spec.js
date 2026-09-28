const {test,expect}=require('@playwright/test');
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const J='33333333-3333-4333-8333-333333333333',K='44444444-4444-4444-8444-444444444444',M='55555555-5555-4555-8555-555555555555',N='66666666-6666-4666-8666-666666666666';
let db;
test.beforeEach(async()=>{
 db=new PGlite();await db.exec(`create role anon; create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to authenticated,anon,service_role;grant execute on function auth.uid() to authenticated,service_role;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema storage to authenticated;grant select on storage.objects to authenticated;`);
 await db.exec(fs.readFileSync('supabase/migrations/20260928085936_memory_foundation.sql','utf8').replace(/^\uFEFF/,''));
 await db.exec(`insert into memory_journeys(id,user_id,trip_date) values('${J}','${A}','2026-10-01'),('${K}','${B}','2030-10-01');
 insert into travel_memories(id,journey_id,user_id,card_id) values('${M}','${J}','${A}','suwon-002'),('${N}','${K}','${B}','suwon-002');`);
});
test.afterEach(async()=>{await db?.close();});
async function as(user,role='authenticated'){await db.exec(`reset role;set request.jwt.claim.sub='${user}';set role ${role};`);}
async function rows(sql){return (await db.query(sql)).rows;}
test('journey uniqueness preserves past and future memories',async()=>{
 await as(A);await expect(db.exec(`insert into travel_memories(journey_id,user_id,card_id) values('${J}','${A}','suwon-002')`)).rejects.toThrow(/unique/);
 const next=(await rows(`insert into memory_journeys(user_id,trip_date) values('${A}','2030-10-01') returning id`))[0].id;
 await db.exec(`insert into travel_memories(journey_id,user_id,card_id,note) values('${next}','${A}','suwon-002','New visit')`);
 expect((await rows('select * from travel_memories')).length).toBe(2);
 expect((await rows(`select note from travel_memories where id='${M}'`))[0].note).toBe('');
});
test('A/B/anonymous isolation, ownership transfer, cross-journey injection denied',async()=>{
 for(const [user,other] of [[A,B],[B,A]]){await as(user);expect(await rows(`select * from memory_journeys where user_id='${other}'`)).toEqual([]);expect(await rows(`select * from travel_memories where user_id='${other}'`)).toEqual([]);}
 await as(A);await expect(db.exec(`insert into travel_memories(journey_id,user_id,card_id) values('${K}','${A}','suwon-001')`)).rejects.toThrow(/foreign key/);
 await expect(db.exec(`update travel_memories set user_id='${B}' where id='${M}'`)).rejects.toThrow(/permission/);
 await expect(db.exec(`update travel_memories set journey_id='${K}' where id='${M}'`)).rejects.toThrow(/permission/);
 await expect(db.exec(`insert into memory_journeys(user_id,trip_date) values('${B}','2030-01-01')`)).rejects.toThrow(/row-level/);
 await as('','anon');for(const table of ['memory_journeys','travel_memories','memory_media','memory_operations'])await expect(db.exec('select * from '+table)).rejects.toThrow(/permission/);
});
test('plain text, server timestamps and revision are enforced by PostgreSQL',async()=>{
 await as(A);for(const note of ['<img>','data:image/jpeg;base64,abc','https://example.com/signed?token=x'])await expect(db.query('update travel_memories set note=$1 where id=$2',[note,M])).rejects.toThrow(/check constraint/);
 await db.exec(`update travel_memories set note='日本語の思い出' where id='${M}'`);expect((await rows(`select revision from travel_memories where id='${M}'`))[0].revision).toBe(2);
 await expect(db.exec(`update travel_memories set revision=100 where id='${M}'`)).rejects.toThrow(/permission/);
 const r=(await rows(`insert into memory_journeys(user_id,trip_date,created_at) values('${A}','2030-01-01','1900-01-01') returning created_at`))[0];expect(new Date(r.created_at).getUTCFullYear()).toBeGreaterThan(2020);
});
test('private storage RLS and five-photo/one-video capacity, no direct upload writes',async()=>{
 expect((await rows("select public from storage.buckets where id='travel-memories'"))[0].public).toBe(false);
 for(let i=0;i<5;i++){const id=`77777777-7777-4777-8777-77777777777${i}`;await db.exec(`insert into memory_media(id,memory_id,user_id,media_type,storage_path,sort_order,mime_type,size_bytes,status) values('${id}','${M}','${A}','photo','${A}/${M}/${id}.jpg',${i},'image/jpeg',100,'ready');insert into storage.objects(bucket_id,name) values('travel-memories','${A}/${M}/${id}.jpg')`);}
 await expect(db.exec(`insert into memory_media(id,memory_id,user_id,media_type,storage_path,sort_order,mime_type,size_bytes,status) values('77777777-7777-4777-8777-777777777779','${M}','${A}','photo','${A}/${M}/77777777-7777-4777-8777-777777777779.jpg',5,'image/jpeg',100,'ready')`)).rejects.toThrow(/check constraint/);
 const video='88888888-8888-4888-8888-888888888888';
 await db.exec(`insert into memory_media(id,memory_id,user_id,media_type,storage_path,sort_order,mime_type,size_bytes,status) values('${video}','${M}','${A}','video','${A}/${M}/${video}.mp4',0,'video/mp4',100,'reserved')`);
 await expect(db.exec(`insert into memory_media(id,memory_id,user_id,media_type,storage_path,sort_order,mime_type,size_bytes,status) values('99999999-9999-4999-8999-999999999999','${M}','${A}','video','${A}/${M}/99999999-9999-4999-8999-999999999999.mp4',0,'video/mp4',100,'reserved')`)).rejects.toThrow(/unique/);
 await as(B);expect(await rows('select * from memory_media')).toEqual([]);expect(await rows('select * from storage.objects')).toEqual([]);
 for(const sql of ["update memory_media set status='deleting'",'delete from memory_media',"insert into storage.objects(bucket_id,name) values('travel-memories','anything')"])await expect(db.exec(sql)).rejects.toThrow(/permission/);
 await as(A);expect((await rows('select * from storage.objects')).length).toBe(5);
});
test('account deletion blocks old JWT access and deleted memories disappear',async()=>{
 await db.exec(`insert into memory_operations(user_id,kind,target_id) values('${A}','delete_account','${A}')`);await as(A);expect((await rows('select memory_account_active() as active'))[0].active).toBe(false);expect(await rows('select * from travel_memories')).toEqual([]);
 await expect(db.exec(`insert into memory_journeys(user_id,trip_date) values('${A}','2030-01-01')`)).rejects.toThrow(/row-level/);
});
