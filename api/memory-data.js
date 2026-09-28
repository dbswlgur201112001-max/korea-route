'use strict';
const m=require('../server/memory/core');
module.exports=m.handler(async(req,res)=>{
  const c=m.config();if(req.method!=='GET')m.origin(req,c);const u=await m.session(req,res,c);
  const action=req.query?.action;
  const call=(path,method='GET',data)=>m.request(c,'/rest/v1/'+path,{token:u.token,method,data,prefer:'return=representation'});
  if(req.method==='GET'&&action==='journeys')return m.json(res,200,{journeys:await call('memory_journeys?select=id,city,trip_date,title,created_at,updated_at&order=created_at.desc')});
  if(req.method==='GET'&&action==='memories'){const journey=m.id(req.query.journey);return m.json(res,200,{memories:await call('travel_memories?select=id,journey_id,card_id,note,revision,created_at,updated_at&deleted_at=is.null&journey_id=eq.'+journey)});}
  if(req.method!=='POST')m.fail(405,'METHOD_NOT_ALLOWED');const b=m.body(req);
  if(action==='create-journey')return m.json(res,201,{journey:(await call('memory_journeys','POST',{user_id:u.id,city:'Suwon',trip_date:m.date(b.tripDate),title:b.title==null?null:m.plain(b.title,100)}))[0]});
  if(action==='create-memory'){
    if(!m.CARDS.includes(b.cardId))m.fail(400,'INVALID_INPUT');
    return m.json(res,201,{memory:(await call('travel_memories','POST',{journey_id:m.id(b.journeyId),user_id:u.id,card_id:b.cardId,note:m.plain(b.note||'')}))[0]});
  }
  if(action==='update-memory'){
    if(!Number.isSafeInteger(b.revision)||b.revision<1)m.fail(400,'INVALID_INPUT');
    const rows=await call('travel_memories?id=eq.'+m.id(b.id)+'&revision=eq.'+b.revision+'&deleted_at=is.null','PATCH',{note:m.plain(b.note)});
    if(!rows.length)m.fail(409,'CONFLICT');return m.json(res,200,{memory:rows[0]});
  }
  m.fail(404,'NOT_FOUND');
});
