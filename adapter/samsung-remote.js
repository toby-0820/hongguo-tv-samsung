(function(){
 'use strict';
 var last=0,images=[],timer,pending='紅果電視獨立版｜CH＋ 下一集 ／ CH－ 上一集';
 function report(text){if(images.length>=8)return;var image=new Image();images.push(image);image.onload=image.onerror=function(){var i=images.indexOf(image);if(i>=0)images.splice(i,1);};image.src='http://127.0.0.1:17658/__remote-event?source=standalone&event='+encodeURIComponent(text)+'&t='+Date.now();}
 function show(text){pending=text;var hint=document.getElementById('samsung-key-hint');if(!hint&&document.body){hint=document.createElement('div');hint.id='samsung-key-hint';hint.style.cssText='position:fixed;bottom:20px;right:20px;padding:12px 20px;background:#222;color:white;z-index:2147483647;font:24px sans-serif;pointer-events:none';document.body.appendChild(hint);}if(hint){hint.textContent=pending;hint.style.display='block';clearTimeout(timer);timer=setTimeout(function(){hint.style.display='none';},3500);}}
 document.addEventListener('DOMContentLoaded',function(){show(pending);report('DOM ready');var video=document.getElementById('hero-video'),previous=0;if(!video)return;video.preload='auto';['waiting','stalled','playing','error','loadedmetadata'].forEach(function(type){video.addEventListener(type,function(){var buffered=0;for(var i=0;i<video.buffered.length;i++)if(video.buffered.start(i)<=video.currentTime&&video.buffered.end(i)>=video.currentTime)buffered=video.buffered.end(i)-video.currentTime;report('video '+type+' position='+Math.round(video.currentTime||0)+' buffer='+Math.round(buffered)+' ready='+video.readyState+' error='+(video.error?video.error.code:0));});});video.addEventListener('timeupdate',function(){if(Date.now()-previous<10000)return;previous=Date.now();report('progress '+Math.round(video.currentTime||0));});});
 if(window.tizen&&tizen.tvinputdevice)['ChannelUp','ChannelDown','Info','MediaPlayPause','MediaPlay','MediaPause','MediaFastForward','MediaRewind','MediaStop'].forEach(function(key){try{tizen.tvinputdevice.registerKey(key);report('registered '+key);}catch(error){report('register error '+key);}});
 window.addEventListener('keydown',function(e){
  var code=e.keyCode||e.which;if(!e.repeat)report('key '+code+' '+e.key);
  var app=window.HongguoTV,commands={10252:'toggle',415:'play',19:'pause',417:'forward',412:'rewind',413:'pause'};
  if(app&&commands[code]){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat||code===417||code===412)app.mediaCommand(commands[code]);return;}
  if(app&&code===10009){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){if(!app.requestBack()&&window.tizen&&tizen.application)tizen.application.getCurrentApplication().exit();}return;}
  if(code!==427&&code!==428&&e.key!=='ChannelUp'&&e.key!=='ChannelDown')return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.repeat||Date.now()-last<500)return;last=Date.now();
  try{var ok=window.HongguoTV&&window.HongguoTV.channelStep(code===427||e.key==='ChannelUp'?1:-1);report('step '+!!ok);show(ok?(code===427?'下一集':'上一集'):'請先關閉選單並進入播放畫面');}catch(error){report('step error '+error.message);show('切集暫時失敗，請稍後重試');}
 },true);
})();
