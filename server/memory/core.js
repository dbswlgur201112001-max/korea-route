'use strict';
const crypto = require('node:crypto');
const COOKIE = '__Host-kr-memory';
const FLOW = '__Host-kr-memory-flow';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CARDS = ['suwon-001','suwon-002','suwon-003'];
class Fault extends Error { constructor(status, code) { super(code); this.status=status; this.code=code; } }
function fail(status, code) { throw new Fault(status,code); }
function config(env=process.env) {
  if(env.VERCEL_ENV==='production' || env.MEMORY_ENV!=='staging') fail(503,'MEMORY_NOT_CONFIGURED');
  const {SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key,MEMORY_APP_ORIGIN:origin,MEMORY_COOKIE_KEY:cookieKey}=env;
  if(!url||!key||!origin||!cookieKey||!env.MEMORY_STAGING_PROJECT_REF) fail(503,'MEMORY_NOT_CONFIGURED');
  let u,o;try{u=new URL(url);o=new URL(origin);}catch{fail(503,'MEMORY_NOT_CONFIGURED');}
  if(u.origin!==url || u.hostname!==env.MEMORY_STAGING_PROJECT_REF+'.supabase.co' || u.protocol!=='https:' || o.origin!==origin || o.protocol!=='https:' || !o.hostname.endsWith('.vercel.app') || ['korea-route.vercel.app'].includes(o.hostname) || !/^[a-f0-9]{64}$/i.test(cookieKey)) fail(503,'MEMORY_NOT_CONFIGURED');
  return {url,key,origin,cookieKey,secret:env.SUPABASE_SECRET_KEY,bucket:'travel-memories'};
}
function headers(res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control','no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');
  res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
}
function json(res,status,value){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));}
function cookies(req){const out={};for(const part of String(req.headers.cookie||'').split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=part.slice(i+1).trim();}return out;}
function seal(value,c){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',Buffer.from(c.cookieKey,'hex'),iv);const data=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url');}
function unseal(raw,c){try{const b=Buffer.from(raw||'','base64url');const d=crypto.createDecipheriv('aes-256-gcm',Buffer.from(c.cookieKey,'hex'),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString());}catch{return null;}}
function setCookie(res,name,value,age){const cookie=`${name}=${value}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Lax`;const prev=res.getHeader('Set-Cookie')||[];res.setHeader('Set-Cookie',[...(Array.isArray(prev)?prev:[prev]),cookie]);}
function clear(res){setCookie(res,COOKIE,'',0);setCookie(res,FLOW,'',0);}
function writeSession(res,session,c){
  if(!session.access_token||!session.refresh_token)fail(502,'AUTH_FAILED');
  const value=seal({access:session.access_token,refresh:session.refresh_token,expires:Date.now()+Number(session.expires_in||0)*1000},c);
  if(value.length>3800)fail(502,'SESSION_TOO_LARGE');setCookie(res,COOKIE,value,60*60*24*7);
}
function origin(req,c){if(req.headers.origin!==c.origin)fail(403,'ORIGIN_DENIED');}
function body(req){let b=req.body;if(typeof b==='string'){if(Buffer.byteLength(b)>8192)fail(413,'INVALID_INPUT');try{b=JSON.parse(b);}catch{fail(400,'INVALID_INPUT');}}if(!b||typeof b!=='object'||Array.isArray(b)||Buffer.byteLength(JSON.stringify(b))>8192)fail(400,'INVALID_INPUT');return b;}
function id(value){if(typeof value!=='string'||!UUID.test(value))fail(400,'INVALID_INPUT');return value;}
function plain(value,max=1000){if(typeof value!=='string'||value.length>max||/[<>\r\n\x00-\x1f]|data:|base64|https?:\/\/|blob:/i.test(value)||/[A-Za-z0-9+/]{128}/.test(value))fail(400,'INVALID_INPUT');return value;}
function date(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))fail(400,'INVALID_INPUT');const d=new Date(value+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==value)fail(400,'INVALID_INPUT');return value;}
function destination(value){return typeof value==='string'&&/^\/memory\.html(?:\?card=suwon-00[123])?$/.test(value)?value:'/memory.html';}
async function request(c,path,{token,admin=false,method='GET',data,prefer}={},fetcher=fetch){
  if(admin&&!c.secret)fail(503,'MEMORY_NOT_CONFIGURED');
  const key=admin?c.secret:c.key;const h={apikey:key,'Content-Type':'application/json'};
  if(token)h.Authorization='Bearer '+token;else if(admin&&key.startsWith('eyJ'))h.Authorization='Bearer '+key;
  if(prefer)h.Prefer=prefer;
  let r;try{r=await fetcher(c.url+path,{method,headers:h,body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(10000)});}catch{fail(503,'CLOUD_UNAVAILABLE');}
  let result;try{result=await r.json();}catch{result=null;}
  if(!r.ok){if(r.status===401)fail(401,'SIGN_IN_REQUIRED');if(r.status===403)fail(403,'ACCESS_DENIED');if(r.status===409)fail(409,'CONFLICT');if(r.status===429)fail(429,'TRY_LATER');fail(502,'CLOUD_REQUEST_FAILED');}
  return result;
}
async function session(req,res,c,fetcher=fetch){
  let s=unseal(cookies(req)[COOKIE],c);if(!s?.refresh||!s?.access)fail(401,'SIGN_IN_REQUIRED');
  if(s.expires<Date.now()+30000){const fresh=await request(c,'/auth/v1/token?grant_type=refresh_token',{method:'POST',data:{refresh_token:s.refresh}},fetcher);writeSession(res,fresh,c);s={access:fresh.access_token,refresh:fresh.refresh_token};}
  const user=await request(c,'/auth/v1/user',{token:s.access},fetcher);if(!UUID.test(user?.id||''))fail(401,'SIGN_IN_REQUIRED');
  const active=await request(c,'/rest/v1/rpc/memory_account_active',{method:'POST',token:s.access,data:{}},fetcher);if(active!==true)fail(403,'ACCOUNT_UNAVAILABLE');
  return {id:user.id,token:s.access};
}
function handler(fn){return async(req,res)=>{headers(res);try{await fn(req,res);}catch(e){if(e.status===401)clear(res);json(res,e instanceof Fault?e.status:500,{error:e instanceof Fault?e.code:'MEMORY_ERROR'});}};}
module.exports={COOKIE,FLOW,CARDS,Fault,fail,config,headers,json,cookies,seal,unseal,setCookie,clear,writeSession,origin,body,id,plain,date,destination,request,session,handler};
