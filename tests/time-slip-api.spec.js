const {test,expect}=require('@playwright/test');
const m=require('../server/memory/core'),media=require('../server/memory/media');
const auth=require('../api/memory-auth');
const A='11111111-1111-4111-8111-111111111111',M='55555555-5555-4555-8555-555555555555',I='77777777-7777-4777-8777-777777777777';
const env={MEMORY_ENV:'staging',VERCEL_ENV:'preview',SUPABASE_URL:'https://synthetic.supabase.co',SUPABASE_PUBLISHABLE_KEY:'synthetic-publishable',SUPABASE_SECRET_KEY:'synthetic-secret',MEMORY_STAGING_PROJECT_REF:'synthetic',MEMORY_APP_ORIGIN:'https://synthetic.vercel.app',MEMORY_COOKIE_KEY:'a'.repeat(64)};
let oldEnv,oldFetch;test.beforeEach(()=>{oldEnv={...process.env};Object.assign(process.env,env);oldFetch=global.fetch;});test.afterEach(()=>{process.env=oldEnv;global.fetch=oldFetch;});
function response(){return {h:{},setHeader(k,v){this.h[k]=v;},getHeader(k){return this.h[k];},end(v){this.data=JSON.parse(v);}};}
function req(action,body={},cookie=''){return {method:'POST',query:{action},headers:{origin:env.MEMORY_APP_ORIGIN,cookie},body};}
const ok=x=>new Response(JSON.stringify(x),{status:200});
test('encrypted secure session cookies, tampering and production fail closed',()=>{
 const c=m.config(),r=response();m.writeSession(r,{access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600},c);
 const cookie=r.h['Set-Cookie'][0];expect(cookie).toContain('Secure; HttpOnly; SameSite=Lax');expect(cookie).not.toContain('synthetic-access');const raw=cookie.split(';')[0].split('=')[1];expect(m.unseal(raw,c).refresh).toBe('synthetic-refresh');expect(m.unseal(raw.slice(0,-5)+'aaaaa',c)).toBeNull();expect(()=>m.config({...env,VERCEL_ENV:'production'})).toThrow('MEMORY_NOT_CONFIGURED');
});
test('magic link request binds browser; callback sets cookie and only allowed destination',async()=>{
 const calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return ok(url.includes('/verify')?{access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600}:{});};
 const r=response();await auth(req('request',{email:'a@example.invalid',returnTo:'/memory.html?card=suwon-002'}),r);expect(r.statusCode).toBe(202);expect(calls[0].url).toContain('/otp?redirect_to=');
 const cookie=r.h['Set-Cookie'][0].split(';')[0],flow=m.unseal(cookie.split('=')[1],m.config());
 const verified=response();await auth(req('callback',{tokenHash:'b'.repeat(64),state:flow.state},cookie),verified);expect(verified.statusCode).toBe(200);expect(verified.data.returnTo).toBe('/memory.html?card=suwon-002');expect(verified.h['Set-Cookie'].join('')).toContain('__Host-kr-memory=');expect(JSON.stringify(verified.data)).not.toContain('synthetic-access');
 expect(m.destination('https://evil.invalid')).toBe('/memory.html');
});
test('wrong origin, expired/browser-mismatched link rejected without upstream request',async()=>{
 global.fetch=async()=>{throw Error('must not call');};
 let r=response();await auth({...req('request',{email:'a@example.invalid'}),headers:{origin:'https://evil.invalid'}},r);expect(r.statusCode).toBe(403);
 r=response();await auth(req('callback',{tokenHash:'b'.repeat(64),state:'wrong'}),r);expect(r.data.error).toBe('LINK_EXPIRED_OR_WRONG_BROWSER');expect(r.h['Cache-Control']).toContain('no-store');
});
test('logout clears cookies even on upstream failure; upload and finalize closed',async()=>{
 global.fetch=async()=>new Response('{}',{status:503});const c=m.config(),cookie=m.COOKIE+'='+m.seal({access:'synthetic',refresh:'synthetic',expires:Date.now()+3600000},c),r=response();await auth(req('logout',{},cookie),r);expect(r.h['Set-Cookie'].filter(x=>x.includes('Max-Age=0'))).toHaveLength(2);expect(()=>media.reserveUpload()).toThrow('MEDIA_UPLOAD_NOT_ENABLED');expect(()=>media.finalizeUpload()).toThrow('MEDIA_UPLOAD_NOT_ENABLED');
});
test('signed view checks user ownership, private path and 60 second expiry',async()=>{
 let signed=0;global.fetch=async(url,opt)=>{if(url.includes('/rest/'))return ok([{id:I,memory_id:M,user_id:A,mime_type:'image/jpeg',storage_path:`${A}/${M}/${I}.jpg`}]);signed++;expect(JSON.parse(opt.body).expiresIn).toBe(60);return ok({signedURL:`/object/sign/travel-memories/${A}/${M}/${I}.jpg?token=synthetic`});};
 const result=await media.signedView(m.config(),{id:A,token:'synthetic'},I);expect(result.url).toContain('/storage/v1/object/sign/travel-memories/');expect(signed).toBe(1);
 await expect(media.signedView(m.config(),{id:M,token:'synthetic'},I)).rejects.toThrow('ACCESS_DENIED');expect(signed).toBe(1);
});
test('delete retains rows on storage failure; retry cleans storage before database',async()=>{
 let failStorage=true,operation=null,exists=true;const events=[];
 global.fetch=async(url,opt)=>{const method=opt.method;events.push(method+' '+new URL(url).pathname);
 if(url.includes('/storage/'))return failStorage?new Response('{}',{status:503}):ok([]);
 if(url.includes('memory_operations')){if(method==='POST')operation={id:I,state:'pending'};if(method==='PATCH')operation.state=JSON.parse(opt.body).state;return ok(operation?[operation]:[]);}
 if(url.includes('memory_media'))return ok(method==='GET'?[{id:I,memory_id:M,user_id:A,mime_type:'image/jpeg',storage_path:`${A}/${M}/${I}.jpg`}]:[]);
 if(url.includes('travel_memories')){if(method==='DELETE')exists=false;return ok(exists?[{id:M}]:[]);}throw Error('unexpected');};
 await expect(media.deleteMemory(m.config(),A,M)).rejects.toThrow('CLOUD_REQUEST_FAILED');expect(exists).toBe(true);expect(operation.state).toBe('pending');expect(events.some(x=>x==='DELETE /rest/v1/travel_memories')).toBe(false);
 failStorage=false;expect((await media.deleteMemory(m.config(),A,M)).status).toBe('DELETED');expect(exists).toBe(false);expect(operation.state).toBe('done');expect(events.indexOf('DELETE /storage/v1/object/travel-memories')).toBeLessThan(events.indexOf('DELETE /rest/v1/travel_memories'));expect((await media.deleteMemory(m.config(),A,M)).status).toBe('DELETED');
});
test('internal upload signer authorizes only owned reserved rows; public upload remains disabled',async()=>{
 let signed=0;global.fetch=async(url)=>{if(url.includes('/rest/'))return ok([{id:I,memory_id:M,user_id:A,status:'reserved',mime_type:'image/jpeg',storage_path:`${A}/${M}/${I}.jpg`}]);signed++;return ok({url:`/object/upload/sign/travel-memories/${A}/${M}/${I}.jpg?token=synthetic`});};
 expect((await media.authorizeUpload(m.config(),{id:A,token:'synthetic'},I)).url).toContain('/storage/v1/object/upload/sign/');
 await expect(media.authorizeUpload(m.config(),{id:M,token:'synthetic'},I)).rejects.toThrow('ACCESS_DENIED');expect(signed).toBe(1);expect(()=>media.reserveUpload()).toThrow('MEDIA_UPLOAD_NOT_ENABLED');
});
