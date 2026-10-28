(function(){
 'use strict';
 var raw=window.HongguoRawXHR,base='http://127.0.0.1:17658';
 window.fetch=function(input,options){
  options=options||{};var url=typeof input==='string'?input:input.url;
  if(url.indexOf('/api/')===0||url.indexOf('/minireel-proxy/')===0)url=base+url;
  return Promise.resolve().then(function(){return window.HongguoWebOS.wakeService();}).then(function(){return new Promise(function(resolve,reject){
   var xhr=new XMLHttpRequest(),signal=options.signal;
   function abort(){xhr.abort();var error=new Error('Request cancelled');error.name='AbortError';reject(error);}
   if(signal&&signal.aborted){abort();return;}
   raw.open.call(xhr,options.method||'GET',url,true);xhr.timeout=180000;
   Object.keys(options.headers||{}).forEach(function(name){xhr.setRequestHeader(name,options.headers[name]);});
   function cleanup(){if(signal&&signal.removeEventListener)signal.removeEventListener('abort',abort);}
   xhr.onload=function(){cleanup();var body=xhr.responseText;resolve({ok:xhr.status>=200&&xhr.status<300,status:xhr.status,json:function(){try{return Promise.resolve(JSON.parse(body));}catch(error){return Promise.reject(error);}},text:function(){return Promise.resolve(body);},headers:{get:function(name){return xhr.getResponseHeader(name);}}});};
   xhr.onerror=function(){cleanup();reject(new Error('電視內資料服務連線失敗'));};xhr.ontimeout=function(){cleanup();reject(new Error('來源準備逾時，請稍後重試'));};
   if(signal&&signal.addEventListener)signal.addEventListener('abort',abort);
   raw.send.call(xhr,options.body===undefined?null:options.body);
  });});
 };
})();
