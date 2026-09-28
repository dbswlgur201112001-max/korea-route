'use strict';
const m=require('../server/memory/core');
const crypto=require('node:crypto');
module.exports=m.handler(async(req,res)=>{
  const c=m.config(),action=req.query?.action;
  if(req.method==='GET'&&action==='session'){
    const user=await m.session(req,res,c);return m.json(res,200,{authenticated:true,userId:user.id});
  }
  if(req.method!=='POST')m.fail(405,'METHOD_NOT_ALLOWED');m.origin(req,c);const b=m.body(req);
  if(action==='request'){
    if(typeof b.email!=='string'||b.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))m.fail(400,'INVALID_INPUT');
    const state=crypto.randomBytes(24).toString('hex');
    // Custom SMTP template uses RedirectTo plus TokenHash. No token-bearing GET API request.
    const returnTo=m.destination(b.returnTo);
    await m.request(c,'/auth/v1/otp?redirect_to='+encodeURIComponent(c.origin+'/memory.html?state='+state),{method:'POST',data:{email:b.email,create_user:true}});
    m.setCookie(res,m.FLOW,m.seal({state,returnTo,expires:Date.now()+60*60*1000},c),3600);
    return m.json(res,202,{status:'CHECK_EMAIL'});
  }
  if(action==='callback'){
    const f=m.unseal(m.cookies(req)[m.FLOW],c);
    if(!f||f.expires<Date.now()||typeof b.state!=='string'||b.state!==f.state)m.fail(400,'LINK_EXPIRED_OR_WRONG_BROWSER');
    if(typeof b.tokenHash!=='string'||! /^[a-f0-9]{32,256}$/i.test(b.tokenHash))m.fail(400,'INVALID_LINK');
    const result=await m.request(c,'/auth/v1/verify',{method:'POST',data:{token_hash:b.tokenHash,type:'email'}});
    m.writeSession(res,result,c);m.setCookie(res,m.FLOW,'',0);
    return m.json(res,200,{returnTo:f.returnTo});
  }
  if(action==='logout'){
    const s=m.unseal(m.cookies(req)[m.COOKIE],c);
    try{if(s?.access)await m.request(c,'/auth/v1/logout?scope=local',{method:'POST',token:s.access});}finally{m.clear(res);}
    return m.json(res,200,{status:'SIGNED_OUT'});
  }
  m.fail(404,'NOT_FOUND');
});
