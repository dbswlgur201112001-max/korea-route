// Executed DOM/storage/byte-contract checks; not a substitute for live layout QA.
const {JSDOM} = require(process.env.KR_QA_JSDOM || 'jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),base='29bc077e49f7b7830adee3f9804253069315153f';
const original=name=>execFileSync('git',['show',`${base}:${name}`],{cwd:root,maxBuffer:6e6});
const approvedScript=execFileSync('git',['show','ef20d0eb03cccc57fab43c8d4f27408eb7844a7e:nfc-card-landing.js'],{cwd:root}).toString();
const script=fs.readFileSync(path.join(root,'nfc-card-landing.js'),'utf8');
const css=fs.readFileSync(path.join(root,'nfc-card-landing.css'),'utf8');
const html=fs.readFileSync(path.join(root,'nfc-card.html'),'utf8');
const ck='koreaRouteCardCollection',keys=['koreaRouteHwahongmunMissionsV2','koreaRouteHaenggungMissionsV2','koreaRouteBanghwasuryujeongMissionsV2'];
const records=['001','002','003'].map(id=>({id:'suwon-'+id,firstTapAt:'2026-09-15T14:32:00+09:00',tapCount:3}));
const seed={[ck]:JSON.stringify(records),[keys[0]]:JSON.stringify({look:true,walk:false,photo:false}),[keys[1]]:JSON.stringify({look:false,walk:true,photo:false}),[keys[2]]:JSON.stringify({look:false,walk:false,photo:true}),koreaRouteLang:'ja',koreaRouteSavedTrip:'untouched'};
let count=0;
function test(name,fn){fn();count++;console.log('PASS',name);}
function visit(route,saved={},code=script,blocked=false){
 const dom=new JSDOM(html,{url:'https://preview.invalid'+route,runScripts:'outside-only'}),w=dom.window,images=[];
 Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));
 if(blocked)w.Storage.prototype.setItem=()=>{throw Error('quota');};
 const create=w.document.createElement.bind(w.document);
 w.document.createElement=(tag,...args)=>{const el=create(tag,...args);if(tag==='img')images.push(el);return el;};
 w.eval(code);
 return{w,d:w.document,images,text:w.document.body.textContent,close:()=>w.close(),saved:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]))};
}
const route=id=>'/t/suwon-'+id;
const ids=['001','002','003'];
test('all tracked base files except permitted runtime files are byte-identical',()=>{
 const allowed=new Set(['nfc-card-landing.js','nfc-card-landing.css']);
 const names=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root}).toString().trim().split('\n');
 for(const name of names)if(!allowed.has(name))assert(fs.readFileSync(path.join(root,name)).equals(original(name)),name);
});
test('original renderers, mission handlers and collection code remain byte-identical',()=>{
 const restored=script.replace(/  \/\/ SUWON TRAVEL PACK V1:[\s\S]*?(?=  function render\(\) \{)/,'').replace('      enhanceSuwonTravelPack(main, result);\n','');
 assert.equal(restored,original('nfc-card-landing.js').toString());
 assert(css.startsWith(original('nfc-card-landing.css').toString()));
 const extra=script.slice(script.indexOf('  // SUWON TRAVEL PACK V1:'),script.indexOf('  function render() {'));
 assert(!/localStorage|sessionStorage|fetch\(|XMLHttpRequest|geolocation/.test(extra));
});
test('selector and invalid routes preserve baseline DOM and storage',()=>{
 for(const r of ['/t','/t/','/t/suwon-999']){const before=visit(r,seed,original('nfc-card-landing.js').toString()),after=visit(r,seed);assert.equal(after.d.body.innerHTML,before.d.body.innerHTML);assert.deepEqual(after.saved(),before.saved());before.close();after.close();}
});
for(const [i,id] of ids.entries()){
 test(id+' renders the common ordered skeleton with distinct content',()=>{
  const o=visit(route(id));
  assert(o.d.querySelector('.kr-travel-pack'));assert.equal(o.d.querySelector('.kr-card-brand small').textContent,'SUWON TRAVEL PACK');
  assert.equal(o.d.querySelector('.tp-theme').textContent,['FOLLOW THE WATER','STEP INTO JEONGJO’S SUWON','PAUSE BY YONGYEON'][i]);
  assert.deepEqual([...o.d.querySelectorAll('main > section')].map(el=>el.id||'hero'),['hero','tp-start','tp-see','tp-missions','tp-photo','tp-routes','tp-local','tp-next','tp-collection','tp-open']);
  assert.equal(o.d.querySelectorAll('.tp-nav a').length,4);assert.equal(o.d.querySelectorAll('#tp-see li').length,3);assert.equal(o.d.querySelectorAll('.tp-local-pick').length,3);assert.equal(o.d.querySelectorAll('.tp-next').length,2);
  assert.equal(o.d.querySelector('.hw-primary').getAttribute('href'),'#tp-start');assert.equal(o.d.querySelectorAll('input[type=checkbox]').length,3);
  assert.deepEqual(['start','see','missions','routes','local','next'].map(id=>o.d.querySelector('#tp-'+id+' h2').textContent),['Your first move','Worth noticing','3 Suwon moments','Choose your pace','Selected for your visit','Continue your Suwon journey']);
  assert(!/best photo|most beautiful|most photographed|hidden gem|🎴|🏆/i.test(o.text));o.close();
 });
 test(id+' preserves all seeded storage apart from the existing tap increment',()=>{
  const before=visit(route(id),seed,original('nfc-card-landing.js').toString()),after=visit(route(id),seed);assert.deepEqual(after.saved(),before.saved());before.close();after.close();
 });
 test(id+' real image asset, successful load and error fallback',()=>{
  const o=visit(route(id)),img=o.images[0];const src=img.getAttribute('src');
  assert(src.startsWith('/nfc-suwon-'+id+'-'));assert(src.endsWith('.webp'));assert(img.alt);
  assert(fs.readFileSync(path.join(root,src.slice(1))).equals(original(src.slice(1))));
  Object.defineProperty(img,'naturalWidth',{value:468});img.dispatchEvent(new o.w.Event('load'));
  assert(o.d.querySelector('.tp-card-image img'));assert.equal(o.d.querySelector('.tp-card-image img').getAttribute('src'),src);
  const bad=visit(route(id));bad.images[0].dispatchEvent(new bad.w.Event('error'));assert.equal(bad.d.querySelectorAll('.tp-card-image img').length,0);assert(bad.d.querySelector('.tp-card-image').textContent.includes(id));o.close();bad.close();
 });
 test(id+' missions 0/3 → 3/3 persist, uncheck persists, other keys unchanged',()=>{
  const saved={...seed};delete saved[keys[i]];
  const o=visit(route(id),saved),collection=o.w.localStorage.getItem(ck);
  assert(o.d.querySelector('.hw-mission-progress').textContent.startsWith('0/3'));
  [...o.d.querySelectorAll('input')].forEach(el=>el.click());assert(o.d.querySelector('.hw-mission-progress').textContent.startsWith('3/3'));
  assert.equal(o.w.localStorage.getItem(ck),collection);
  keys.forEach((k,j)=>{if(i!==j)assert.equal(o.w.localStorage.getItem(k),seed[k]);});
  const again=visit(route(id),o.saved());assert([...again.d.querySelectorAll('input')].every(el=>el.checked));again.d.querySelector('input').click();
  const last=visit(route(id),again.saved());assert(!last.d.querySelector('input').checked);assert(last.d.querySelector('.hw-mission-progress').textContent.startsWith('2/3'));o.close();again.close();last.close();
 });
 test(id+' all three route choices contain 3–5 stops and do not mutate storage',()=>{
  const o=visit(route(id),seed),before=o.saved(),buttons=[...o.d.querySelectorAll('.tp-route-choices button')];
  assert.deepEqual(buttons.map(el=>el.textContent),['SHORT','STANDARD','EXTENDED']);
  buttons.forEach((b,index)=>{b.click();assert.equal(o.d.querySelectorAll('button[aria-pressed=true]').length,1);assert.equal(b.getAttribute('aria-pressed'),'true');assert.equal(o.d.querySelector('.tp-route-panel').dataset.route,String(index));const stops=o.d.querySelectorAll('.tp-route-panel li');assert(stops.length>=3&&stops.length<=5);assert(!/30 MIN|1 HOUR|2 HOURS|\d+\s*(minutes?|mins?|hours?|km|metres?|meters?)|ETA/i.test(o.d.getElementById('tp-routes').textContent));assert.deepEqual(o.saved(),before);});o.close();
 });
}
test('collection increments only tapCount; 0/3 → 3/3; completion gated by actual Suwon ids',()=>{
 let saved={},first;
 for(const [i,r] of ['/t',route('001'),route('001'),route('002'),route('003'),route('003')].entries()){
  const o=visit(r,saved);saved=o.saved();const list=JSON.parse(saved[ck]||'[]'),n=[0,1,1,2,3,3][i];assert.equal(list.length,n);
  if(n){first ||= list[0].firstTapAt;assert.equal(list[0].firstTapAt,first);assert.equal(o.d.querySelector('.hw-collection-count').textContent,`SUWON COLLECTION · ${n} OF 3`);assert(!/🎴|🏆/.test(o.text));assert(o.d.querySelector('.kr-card-status').textContent.includes(`CARD ${r.slice(-3)} ${[2,5].includes(i)?'IN YOUR COLLECTION':'ADDED'}`));}
  assert.equal(!!o.d.getElementById('tp-complete'),n===3);
  if(n===3){assert(o.text.includes('The Complete Suwon Route'));assert(o.text.includes('Your Suwon collection is complete'));assert(o.text.includes('Three cards. One curated day through Suwon.'));assert(o.text.includes('SUWON COLLECTION COMPLETE'));assert(o.d.querySelector('.kr-card-complete'));assert.equal(o.d.querySelectorAll('#tp-complete li').length,5);}
  o.close();
 }
 const list=JSON.parse(saved[ck]);assert.equal(list[0].tapCount,2);assert.equal(list[2].tapCount,2);
 const partial=visit(route('001'),{[ck]:JSON.stringify([records[0],{...records[1],id:'other-001'},{...records[2],id:'other-002'}])});assert(!partial.d.getElementById('tp-complete'));partial.close();
});
test('complete section appears on every collected card but not from missions alone',()=>{
 ids.forEach((id,i)=>{const complete=visit(route(id),seed);assert(complete.d.getElementById('tp-complete'));complete.close();const missions=visit(route(id),{[keys[i]]:JSON.stringify({look:true,walk:true,photo:true})});assert(!missions.d.getElementById('tp-complete'));missions.close();});
});
test('photo copy is place-level; external links, anchors and labels are structurally valid',()=>{
 for(const id of ids){const o=visit(route(id),seed);
  const text=o.d.getElementById('tp-photo').textContent;assert(!/angle|framing|lens|sunset|sunrise|degrees|coordinates|best|\d/i.test(text));
  for(const a of o.d.querySelectorAll('a')){const href=a.getAttribute('href');if(href.startsWith('#'))assert(o.d.getElementById(href.slice(1)),href);if(a.origin!=='https://preview.invalid'){const u=new URL(a.href);assert.equal(u.protocol,'https:');assert.equal(a.target,'_blank');assert(a.rel.includes('noopener'));if(u.hostname==='www.google.com'){assert.equal(u.pathname,'/maps/search/');assert.deepEqual([...u.searchParams.keys()].sort(),['api','query']);}}}
  const allIds=[...o.d.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(allIds).size,allIds.length);
  for(const el of o.d.querySelectorAll('[aria-labelledby]'))for(const label of el.getAttribute('aria-labelledby').split(' '))assert(o.d.getElementById(label),label);
  assert(!o.d.getElementById('kr-card-landing').hasAttribute('aria-live'));assert.equal(o.d.querySelectorAll('.hw-mission-progress[role=status]').length,1);o.close();
 }
});
test('local picks have branch/address/context, maps and supporting links; no prices/hours/ratings',()=>{
 for(const id of ids){const o=visit(route(id));const before=visit(route(id),{},approvedScript);
 const identity=d=>[...d.querySelectorAll('.tp-local-pick')].map(p=>({summary:p.querySelector('summary').textContent,address:p.querySelector('.tp-address').textContent,links:[...p.querySelectorAll('a')].map(a=>a.href)}));
 assert.deepEqual(identity(o.d),identity(before.d));assert.equal(o.d.querySelector('#tp-local > .tp-small').textContent,'Checked 16 Sep 2026. Confirm today’s opening before setting off.');before.close();
 const picks=[...o.d.querySelectorAll('.tp-local-pick')];assert.deepEqual(picks.map(el=>el.querySelector('.tp-category').textContent),['EAT','CAFE','LOCAL']);for(const p of picks){assert(p.querySelector('.tp-address').textContent.includes('Suwon'));assert.equal(p.querySelectorAll('a').length,2);assert(!/\d{1,2}:\d{2}|KRW|rating|discount/i.test(p.textContent));}o.close();}
});
test('malformed or unavailable storage preserves records and never unlocks completion',()=>{
 for(const [i,id] of ids.entries()){
  const bad=visit(route(id),{...seed,[ck]:'bad',[keys[i]]:'invalid'});bad.d.querySelector('input').click();assert.equal(bad.w.localStorage.getItem(ck),'bad');assert.equal(bad.w.localStorage.getItem(keys[i]),'invalid');assert(!bad.d.getElementById('tp-complete'));assert(bad.text.includes('this visit only'));bad.close();
  const blocked=visit(route(id),seed,script,true);blocked.d.querySelector('input').click();assert.deepEqual(blocked.saved(),seed);assert(!blocked.d.getElementById('tp-complete'));blocked.close();
 }
});
console.log(`${count} DOM/storage/contract checks passed. Live Preview and layout remain separate verdicts.`);
