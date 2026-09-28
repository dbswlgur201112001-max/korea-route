'use strict';
const m=require('../server/memory/core');
const media=require('../server/memory/media');
module.exports=m.handler(async(req,res)=>{
 const c=m.config();if(req.method!=='POST')m.fail(405,'METHOD_NOT_ALLOWED');m.origin(req,c);
 const u=await m.session(req,res,c),b=m.body(req),action=req.query?.action;
 if(action==='reserve')media.reserveUpload();
 if(action==='finalize')media.finalizeUpload();
 if(action==='view')return m.json(res,200,await media.signedView(c,u,b.id));
 if(action==='delete-memory')return m.json(res,200,await media.deleteMemory(c,u.id,m.id(b.id)));
 m.fail(404,'NOT_FOUND');
});
