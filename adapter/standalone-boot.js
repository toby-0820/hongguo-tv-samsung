(function(){
 'use strict';
 var base='http://127.0.0.1:17658',open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;
 window.HongguoRawXHR={open:open,send:send};window.HongguoConnection={base:base};window.HongguoTrace=function(){};
 try{if(!localStorage.getItem('hongguo-tv-locale'))localStorage.setItem('hongguo-tv-locale','zh-TW');}catch(e){}
 var Params=window.URLSearchParams;
 if(Params){window.URLSearchParams=function(input){if(input&&typeof input==='object'&&!Array.isArray(input)&&!(input instanceof Params)){var values=input;input=Object.keys(values).map(function(key){return encodeURIComponent(key)+'='+encodeURIComponent(String(values[key]));}).join('&');}return new Params(input);};window.URLSearchParams.prototype=Params.prototype;}
 function health(done){var xhr=new XMLHttpRequest();open.call(xhr,'GET',base+'/__standalone');xhr.timeout=2500;xhr.onload=function(){try{var data=JSON.parse(xhr.responseText);done(xhr.status===200&&data.ok,data);}catch(e){done(false);}};xhr.onerror=xhr.ontimeout=function(){done(false);};send.call(xhr);}
 var startup=null;
 function ensure(){if(startup)return startup;startup=new Promise(function(resolve,reject){health(function(ok,data){if(ok)return resolve(data);var deadline=Date.now()+16000;function poll(){health(function(ready,result){if(ready)return resolve(result);if(Date.now()>deadline)return reject(new Error(result&&result.error||'電視內服務啟動逾時'));setTimeout(poll,500);});}try{tizen.application.launchAppControl(new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/service'),'HgSolo2026.Service',poll,function(error){tizen.application.launch('HgSolo2026.Service',poll,function(){reject(new Error(error.message||'無法啟動電視內服務'));});});}catch(e){reject(e);}});});var task=startup;task.then(function(){if(startup===task)startup=null;},function(){if(startup===task)startup=null;});return task;}
 window.webOS={service:{request:function(uri,opts){if(opts.method==='shutdown'){opts.onSuccess({returnValue:true});return {cancel:function(){}};}ensure().then(function(){opts.onSuccess({returnValue:true,ready:true});},function(error){opts.onFailure({errorCode:'TV_SERVICE_NOT_READY',errorText:error.message});});return {cancel:function(){}};}}};
 var panel,lastFocus;
 function close(){panel.style.display='none';if(lastFocus&&lastFocus.focus)lastFocus.focus();}
 function show(){lastFocus=document.activeElement;panel.style.display='block';panel.querySelector('button').focus();var video=document.getElementById('hero-video');var position=video?Math.floor(video.currentTime||0):0;health(function(ok,data){panel.querySelector('p').textContent=(ok?'電視內服務正常':'電視內服務未就緒')+'｜版本 0.3.20｜影片核心 0.2.127｜播放位置 '+position+' 秒。觀看時不需要開電腦。'+(!ok&&data&&data.error?' '+data.error:'');});}
 document.addEventListener('DOMContentLoaded',function(){panel=document.createElement('div');panel.style.cssText='display:none;position:fixed;left:12%;right:12%;top:24%;padding:38px;background:#20232e;color:white;border:2px solid #aaa;border-radius:15px;z-index:2147483646;font:26px sans-serif';panel.innerHTML='<h2>紅果電視獨立版</h2><p>正在讀取電視內服務狀態…</p><button style="font:24px sans-serif;padding:14px 30px">返回</button>';document.body.appendChild(panel);panel.querySelector('button').onclick=close;var sidebar=document.querySelector('.sidebar');if(sidebar){var button=document.createElement('button');button.className='side-item';button.dataset.focus='standalone-status';button.textContent='獨立版狀態';button.onclick=show;sidebar.appendChild(button);}});
 window.addEventListener('keydown',function(e){if(e.keyCode===457&&panel){e.preventDefault();e.stopImmediatePropagation();show();return;}if(panel&&panel.style.display==='block'){e.preventDefault();e.stopImmediatePropagation();if([13,27,10009].indexOf(e.keyCode)>=0)close();}},true);
})();


















