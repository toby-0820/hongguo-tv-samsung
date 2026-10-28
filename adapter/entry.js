'use strict';
var instance;
module.exports.onStart=function(){
 try {
 if(Number(process.versions.node.split('.')[0])<6)Object.defineProperty(Buffer,'from',{configurable:true,writable:true,value:function(value,encoding,length){if(typeof ArrayBuffer!=='undefined'&&value instanceof ArrayBuffer)return new Buffer(new Uint8Array(value,typeof encoding==='number'?encoding:0,length));return new Buffer(value,encoding);}});
 if(!Buffer.alloc)Buffer.alloc=function(size,fill,encoding){var value=new Buffer(size);value.fill(fill===undefined?0:fill,encoding);return value;};
 if(Number(process.versions.node.split('.')[0])<6){
  Object.defineProperty(Buffer.prototype,'map',{configurable:true,writable:true,value:function(fn,context){var result=new Buffer(this.length);for(var i=0;i<this.length;i++)result[i]=fn.call(context,this[i],i,this);return result;}});
  ['forEach','every','some','reduce','reduceRight'].forEach(function(name){Object.defineProperty(Buffer.prototype,name,{configurable:true,writable:true,value:Array.prototype[name]});});
 }
 if(!String.prototype.padStart)String.prototype.padStart=function(length,pad){var value=String(this);pad=pad||' ';while(value.length<length)value=pad+value;return value.slice(-Math.max(length,String(this).length));};
 var fs=require('fs'),path=require('path'),https=require('https'),http=require('http');
 var Server=require('net').Server;
 if(!('listening' in Server.prototype))Object.defineProperty(Server.prototype,'listening',{configurable:true,get:function(){return !!this._handle;}});
 var root=process.env.HONGGUO_STANDALONE_TEST_ROOT||'/home/owner/share/hongguo-HgSolo2026';
 process.env.HONGGUO_WEBOS_DATA_DIR=path.join(root,'hongguo-user');
 process.env.HONGGUO_WEBOS_CACHE_DIR=path.join(root,'hongguo-cache');
 https.globalAgent.options.ca=require('./roots.json');https.globalAgent.keepAlive=true;http.globalAgent.keepAlive=true;
 var provider=require('./provider'),basePrepare=provider.prepare,baseSearch=provider.search;
 provider.prepare=function(series,vid,quality,fallback,mode,prefetch,signal){var selectedMode=mode==='range'?'range':'full';return basePrepare(series,vid,quality,fallback,selectedMode,prefetch,signal).catch(function(error){if(error.code!=='VIDEO_MODEL_EMPTY'||signal&&signal.aborted)throw error;return new Promise(function(resolve){setTimeout(resolve,500);}).then(function(){if(signal&&signal.aborted)throw error;return basePrepare(series,vid,quality,fallback,selectedMode,prefetch,signal);});});};
 provider.search=function(query){return baseSearch(query).catch(function(original){return provider.suggestions(query).then(function(result){var seen={},items=(result.items||[]).map(function(item){return item.drama;}).filter(function(item){if(!item||!item.series_id||seen[item.series_id])return false;seen[item.series_id]=true;return true;});if(!items.length)throw original;return{items:items,source:'official-suggestions-fallback',partial:true,notice:'完整搜尋暫時無法連線，顯示官方搜尋建議。'};});});};
 var events=[];
 var network={createServer:function(handler){return http.createServer(function(req,res){
  if(req.url.indexOf('/__remote-event?')===0){events.push({time:Date.now(),event:require('url').parse(req.url,true).query.event});if(events.length>60)events.shift();res.writeHead(204,{'Access-Control-Allow-Origin':'*'});res.end();return;}
  if(req.url==='/__events'){res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(events.slice(-20)));return;}
  if(req.url==='/__standalone'){res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify({ok:true,node:process.version,onDevice:true,computerRequired:false,version:'0.3.20',upstream:'0.2.127'}));return;}
  if(req.url.indexOf('/api/')===0&&req.url.indexOf('/api/v1/health')!==0&&req.url.indexOf('cache-session')<0){events.push({time:Date.now(),event:'start '+req.url.split('?')[0]+' origin='+req.headers.origin});if(events.length>60)events.shift();}
  if(req.url.indexOf('/api/')===0&&req.url.indexOf('/api/v1/health')!==0&&req.url.indexOf('cache-session')<0){var end=res.end;res.end=function(body){var event={path:req.url.split('?')[0],status:res.statusCode};if(res.statusCode>=400&&body)try{var result=JSON.parse(String(body));event.error=result.error;event.message=result.message;}catch(ignore){}events.push({time:Date.now(),event:JSON.stringify(event)});if(events.length>60)events.shift();return end.apply(res,arguments);};}
  handler(req,res);
 });}};
 instance=require('./service')({port:17658,bindHost:'127.0.0.1',http:network,provider:provider,service:{register:function(){},activityManager:null}});
 instance.ensureReady().catch(function(error){console.error('Hongguo local service failed: '+error.message);});
 }catch(error){
  var failure={ok:false,stage:'service_start',error:String(error.message),stack:String(error.stack).slice(0,1600)};
  var http=require('http');
  http.createServer(function(req,res){res.writeHead(503,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(failure));}).listen(17658,'127.0.0.1');
 }
};
module.exports.onStop=function(){if(instance)instance.shutdown();};






















