(function(){
 'use strict';
 var api=window.webapis&&window.webapis.avplay;
 if(!api)return;
 var generation=0,failedGeneration=-1,current='',position=0,duration=0,frame=false,rect=[0,0,1,1],object=null,lastError='',prepared=false;
 function event(name,data){if(window.HongguoNativePlayback)window.HongguoNativePlayback.event(current,name,data||{});}
 function report(text){try{var xhr=new XMLHttpRequest();window.HongguoRawXHR.open.call(xhr,'GET','http://127.0.0.1:17658/__remote-event?event='+encodeURIComponent('avplay '+text));window.HongguoRawXHR.send.call(xhr);}catch(ignore){}}
 function ensureObject(){if(object)return;object=document.createElement('object');object.type='application/avplayer';object.id='samsung-native-video';object.style.cssText='position:fixed;pointer-events:none;z-index:0';document.body.insertBefore(object,document.body.firstChild);}
 function bounds(){ensureObject();object.style.left=(rect[0]*100)+'%';object.style.top=(rect[1]*100)+'%';object.style.width=(rect[2]*100)+'%';object.style.height=(rect[3]*100)+'%';try{if(api.getState()!=='NONE'){api.setDisplayRect(Math.round(rect[0]*1920),Math.round(rect[1]*1080),Math.max(1,Math.round(rect[2]*1920)),Math.max(1,Math.round(rect[3]*1080)));api.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');}}catch(error){report('bounds '+error.message);}}
 function stop(){generation++;prepared=false;try{var state=api.getState();if(state!=='NONE'&&state!=='IDLE')api.stop();}catch(ignore){}try{api.close();}catch(ignore){}if(object)object.style.visibility='hidden';}
 function failure(error){if(failedGeneration===generation)return;failedGeneration=generation;prepared=false;lastError=String(error&&error.message||error);report('error '+lastError);event('error',{kind:lastError});}
 window.HongguoNativePlayer={
  isAvailable:function(){return true;},engine:function(){return 'avplay';},
  begin:function(id){stop();current=id;},stop:stop,
  bounds:function(x,y,w,h){rect=[x,y,w,h];bounds();},
  play:function(id,json){stop();current=id;var ticket=generation,options=JSON.parse(json),source=String(options.source||'');var route=source.indexOf('/minireel-proxy/');if(route>=0)source='http://127.0.0.1:17658'+source.slice(route);position=Math.max(0,Number(options.start_position)||0)*1000;duration=0;frame=false;lastError='';ensureObject();object.style.visibility='visible';
   function valid(){return ticket===generation&&id===current;}
   try{api.open(source);try{api.setStreamingProperty("ADAPTIVE_INFO","FIXED_MAX_RESOLUTION=3840X2160");report("uhd-decoder-requested");}catch(modeError){report("uhd-mode "+modeError.message);}bounds();api.setListener({
    onbufferingstart:function(){if(valid())event('buffering');},
    onbufferingcomplete:function(){if(valid())report('buffering-complete');},
    oncurrentplaytime:function(time){if(!valid())return;position=Number(time)||0;try{duration=api.getDuration();}catch(ignore){}if(window.HongguoNativePlayback)window.HongguoNativePlayback.progress(current,position,duration);if(!frame&&position>0){frame=true;var width=0,height=0;try{api.getTotalTrackInfo().forEach(function(track){if(track.type==='VIDEO'){var info=JSON.parse(track.extra_info);width=Number(info.Width||info.width)||0;height=Number(info.Height||info.height)||0;}});}catch(ignore){}event('frame',{width:width,height:height});event('playing');report('first-progress '+position+' duration='+duration);}},
    onstreamcompleted:function(){if(!valid())return;report('ended '+duration);try{api.stop();}catch(ignore){}prepared=false;event('ended');},
    onerror:function(error){if(valid())failure(error);}
   });event('buffering');api.prepareAsync(function(){if(!valid())return;prepared=true;duration=api.getDuration();bounds();function start(){if(!valid())return;try{api.play();report('playing '+source.split('/').pop());}catch(error){failure(error);}}if(position>0)api.seekTo(Math.min(position,Math.max(0,duration-500)),start,function(){start();});else start();},function(error){if(valid())failure(error);});
   }catch(error){failure(error);}
  },
  pause:function(){if(prepared&&api.getState()==='PLAYING'){api.pause();event('paused');}},
  resume:function(){if(prepared&&(api.getState()==='PAUSED'||api.getState()==='READY')){api.play();event('playing');}},
  seekTo:function(seconds){position=Math.max(0,Number(seconds)||0)*1000;if(!prepared)return;var ticket=generation;try{api.seekTo(Math.min(position,Math.max(0,duration-500)),function(){if(ticket===generation&&window.HongguoNativePlayback)window.HongguoNativePlayback.progress(current,position,duration);},function(error){if(ticket===generation)failure(error);});}catch(error){if(ticket===generation)failure(error);}},
  setSpeed:function(speed){if(prepared)try{api.setSpeed(Number(speed)||1);}catch(ignore){}},
  diagnostics:function(){return JSON.stringify({engine:'avplay',state:api.getState(),position_ms:position,duration_ms:duration,error:lastError});}
 };
 window.addEventListener('unload',stop);
})();

