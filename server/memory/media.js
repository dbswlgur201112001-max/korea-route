'use strict';
const m=require('./core');
const rest=(c,path,method='GET',data)=>m.request(c,'/rest/v1/'+path,{admin:true,method,data,prefer:'return=representation'});
function pathOf(row,user){
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4'}[row.mime_type];
 if(!ext||row.user_id!==user||row.storage_path!==`${m.id(user)}/${m.id(row.memory_id)}/${m.id(row.id)}.${ext}`)m.fail(403,'ACCESS_DENIED');
 return row.storage_path;
}
async function signedView(c,user,mediaId){
 // User JWT (RLS), never a service-role lookup, authorizes each view.
 const rows=await m.request(c,'/rest/v1/memory_media?id=eq.'+m.id(mediaId)+'&status=eq.ready',{token:user.token});
 if(rows.length!==1)m.fail(404,'NOT_FOUND');const path=pathOf(rows[0],user.id);
 const result=await m.request(c,'/storage/v1/object/sign/'+c.bucket+'/'+path,{token:user.token,method:'POST',data:{expiresIn:60}});
 const url=new URL(result.signedURL.startsWith('/object/')?'/storage/v1'+result.signedURL:result.signedURL,c.url+'/storage/v1/');
 if(url.origin!==c.url||!url.pathname.startsWith('/storage/v1/object/sign/'+c.bucket+'/'))m.fail(502,'INVALID_SIGNED_URL');
 return {url:url.href,expiresIn:60};
}
// Internal future-stage signer only. No public route invokes it in Stage 4B.
async function authorizeUpload(c,user,mediaId){
 const rows=await m.request(c,'/rest/v1/memory_media?id=eq.'+m.id(mediaId)+'&status=eq.reserved',{token:user.token});
 if(rows.length!==1||rows[0].status!=='reserved')m.fail(404,'NOT_FOUND');
 const path=pathOf(rows[0],user.id);
 const result=await m.request(c,'/storage/v1/object/upload/sign/'+c.bucket+'/'+path,{admin:true,method:'POST',data:{}});
 const url=new URL(result.url.startsWith('/object/')?'/storage/v1'+result.url:result.url,c.url+'/storage/v1/');
 if(url.origin!==c.url||!url.pathname.startsWith('/storage/v1/object/upload/sign/'+c.bucket+'/'))m.fail(502,'INVALID_SIGNED_URL');
 return {url:url.href};
}
function reserveUpload(){m.fail(409,'MEDIA_UPLOAD_NOT_ENABLED');}
function finalizeUpload(){m.fail(409,'MEDIA_UPLOAD_NOT_ENABLED');}
async function operation(c,user,kind,target){
 const filter=`user_id=eq.${m.id(user)}&kind=eq.${kind}&target_id=eq.${m.id(target)}`;
 let rows=await rest(c,'memory_operations?'+filter);
 if(!rows.length){try{rows=await rest(c,'memory_operations','POST',{user_id:user,kind,target_id:target});}catch(e){if(e.code!=='CONFLICT')throw e;rows=await rest(c,'memory_operations?'+filter);}}
 if(!rows.length)m.fail(503,'DELETE_RETRY_REQUIRED');return rows[0];
}
async function deleteMemory(c,user,memoryId){
 m.id(user);m.id(memoryId);
 // Including tombstones permits retry after a partial storage failure.
 const rows=await rest(c,`travel_memories?id=eq.${memoryId}&user_id=eq.${user}`);
 if(!rows.length){const done=await rest(c,`memory_operations?user_id=eq.${user}&kind=eq.delete_memory&target_id=eq.${memoryId}`);if(done.length){await rest(c,'memory_operations?id=eq.'+done[0].id,'PATCH',{state:'done'});return {status:'DELETED'};}m.fail(404,'NOT_FOUND');}
 const op=await operation(c,user,'delete_memory',memoryId);
 await rest(c,`travel_memories?id=eq.${memoryId}&user_id=eq.${user}`,'PATCH',{deleted_at:new Date().toISOString()});
 const media=await rest(c,`memory_media?memory_id=eq.${memoryId}&user_id=eq.${user}`);
 const paths=media.map(row=>pathOf(row,user));
 // Storage removal is idempotent. Failure preserves metadata and pending operation for retry.
 if(paths.length)await m.request(c,'/storage/v1/object/'+c.bucket,{admin:true,method:'DELETE',data:{prefixes:paths}});
 await rest(c,'memory_operations?id=eq.'+op.id,'PATCH',{state:'storage_removed'});
 await rest(c,`memory_media?memory_id=eq.${memoryId}&user_id=eq.${user}`,'DELETE');
 await rest(c,`travel_memories?id=eq.${memoryId}&user_id=eq.${user}`,'DELETE');
 await rest(c,'memory_operations?id=eq.'+op.id,'PATCH',{state:'done'});
 return {status:'DELETED'};
}
// Internal worker foundation only: no public account-delete route until reauthentication UX exists.
async function deleteAccount(c,user){
 m.id(user);await operation(c,user,'delete_account',user); // Immediately blocks authenticated RLS/API access.
 const memories=await rest(c,'travel_memories?user_id=eq.'+user);
 for(const memory of memories)await deleteMemory(c,user,memory.id);
 await rest(c,'memory_journeys?user_id=eq.'+user,'DELETE');
 // Keep the operation until Auth deletion succeeds. Account rows use no cascading file deletion.
 // Auth soft deletion revokes identity while operation records remain retryable; hard purge is future retention policy.
 await m.request(c,'/auth/v1/admin/users/'+user,{admin:true,method:'DELETE',data:{should_soft_delete:true}});
 const ops=await rest(c,'memory_operations?user_id=eq.'+user+'&kind=eq.delete_account');
 if(ops.length)await rest(c,'memory_operations?id=eq.'+ops[0].id,'PATCH',{state:'done'});
 return {status:'DELETED'};
}
module.exports={pathOf,signedView,authorizeUpload,reserveUpload,finalizeUpload,deleteMemory,deleteAccount};
