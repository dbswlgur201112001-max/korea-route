'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const copy={
 en:{title:'My Suwon memory',intro:'A private space for your Suwon memories. Photo and video uploads are not available yet.',emailLabel:'Email',send:'Send sign-in link',verify:'Finish signing in',logout:'Sign out',back:'Back to Suwon',idle:'Sign in to see your saved journeys.',pending:'Check your email. Open the link in this browser, then finish signing in.',unavailable:'Cloud memories are not available yet. Please try again later.',expired:'This link expired or was opened in another browser. Request a new link here.',signed:'Signed in. Your saved journeys appear here.',empty:'No journeys saved yet.',out:'Signed out.',error:'Unable to complete this request. Please try again.'},
 ko:{title:'나의 수원 추억',intro:'수원의 추억을 나만 볼 수 있는 공간입니다. 사진과 영상 업로드는 아직 제공하지 않습니다.',emailLabel:'이메일',send:'로그인 링크 받기',verify:'로그인 완료',logout:'로그아웃',back:'수원으로 돌아가기',idle:'로그인하면 저장된 여행을 볼 수 있습니다.',pending:'이메일을 확인하세요. 이 브라우저에서 링크를 열고 로그인을 완료하세요.',unavailable:'추억 저장 서비스를 아직 사용할 수 없습니다. 나중에 다시 시도하세요.',expired:'링크가 만료되었거나 다른 브라우저에서 열렸습니다. 여기에서 새 링크를 요청하세요.',signed:'로그인되었습니다. 저장된 여행이 여기에 표시됩니다.',empty:'아직 저장된 여행이 없습니다.',out:'로그아웃되었습니다.',error:'요청을 완료하지 못했습니다. 다시 시도하세요.'},
 ja:{title:'私の水原の思い出',intro:'水原の思い出を自分だけで楽しむ場所です。写真・動画のアップロードはまだ利用できません。',emailLabel:'メールアドレス',send:'ログインリンクを受け取る',verify:'ログインを完了',logout:'ログアウト',back:'水原に戻る',idle:'ログインすると保存した旅行を確認できます。',pending:'メールを確認してください。このブラウザでリンクを開き、ログインを完了してください。',unavailable:'思い出の保存サービスはまだ利用できません。時間をおいてお試しください。',expired:'リンクの期限が切れたか、別のブラウザで開かれました。ここで新しいリンクをリクエストしてください。',signed:'ログインしました。保存した旅行がここに表示されます。',empty:'保存した旅行はまだありません。',out:'ログアウトしました。',error:'操作を完了できませんでした。もう一度お試しください。'}
 };
 const url=new URL(location.href);let token=new URLSearchParams(url.hash.slice(1)).get('token_hash');const state=url.searchParams.get('state');
 const card=url.searchParams.get('card');const returnTo='/memory.html'+(/^suwon-00[123]$/.test(card||'')?'?card='+card:'');
 if(url.hash||state)history.replaceState(null,'',returnTo); // Remove one-time credential before any request.
 let lang='en',status='idle',journeys=[];
 function render(){document.documentElement.lang=lang;document.title=copy[lang].title;for(const id of ['title','intro','emailLabel','send','verify','logout','back'])$(id).textContent=copy[lang][id];$('status').textContent=copy[lang][status];$('journeys').replaceChildren();for(const journey of journeys){const li=document.createElement('li');li.textContent=({en:'Suwon',ko:'수원',ja:'水原'}[lang])+' · '+journey.trip_date;$('journeys').append(li);}}
 async function call(api,action,data){const r=await fetch('/api/memory-'+api+'?action='+action,{method:data?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});let result;try{result=await r.json();}catch{throw {code:'MEMORY_NOT_CONFIGURED'};}if(!r.ok)throw {code:result.error};return result;}
 function error(e){status=e.code==='MEMORY_NOT_CONFIGURED'?'unavailable':/LINK|AUTH_FAILED/.test(e.code||'')?'expired':'error';render();}
 async function session(){try{await call('auth','session');$('login').hidden=true;$('logout').hidden=false;journeys=(await call('data','journeys')).journeys;status=journeys.length?'signed':'empty';render();}catch(e){if(e.code!=='SIGN_IN_REQUIRED')error(e);}}
 $('language').onchange=()=>{lang=$('language').value;render();};
 $('login').onsubmit=async event=>{event.preventDefault();$('send').disabled=true;try{await call('auth','request',{email:$('email').value,returnTo});status='pending';render();}catch(e){error(e);}finally{$('send').disabled=false;}};
 $('verify').onclick=async()=>{$('verify').disabled=true;try{const result=await call('auth','callback',{tokenHash:token,state});token=null;location.replace(result.returnTo);}catch(e){token=null;$('verify').hidden=true;error(e);}};
 $('logout').onclick=async()=>{try{await call('auth','logout',{});journeys=[];$('logout').hidden=true;$('login').hidden=false;status='out';render();}catch(e){error(e);}};
 render();if(token){$('verify').hidden=false;}else session();
})();
