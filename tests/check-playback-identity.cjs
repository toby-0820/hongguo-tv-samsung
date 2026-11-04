'use strict';
const assert=require('assert');
const createIdentity=require('../build/hongguo-standalone/service/playback-identity');
const cancellation=require('../build/hongguo-standalone/service/audio-cancel');
function fixture(register){
  let now=100000,timerId=0;
  const timers=new Map();
  const identity=createIdentity(register,{now:()=>now,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)});
  return{identity,advance:ms=>{now+=ms;},timers};
}
(async()=>{
  // Parallel requests share one pending registration and the same result.
  {
    let calls=0,complete;
    const f=fixture(()=>{calls++;return new Promise(resolve=>{complete=resolve;});});
    const first=f.identity.get(),second=f.identity.get();
    await Promise.resolve();
    assert.equal(calls,1);
    const device={deviceID:'test-device-1'};
    complete(device);
    assert.strictEqual(await first,device);
    assert.strictEqual(await second,device);
    assert.strictEqual(await f.identity.get(),device);
    assert.equal(calls,1,'settled identity should be reused until a confirmed empty response');
    assert.equal(f.timers.size,0);
    f.identity.close();
  }
  // Confirmed empty media responses can recover again after two seconds,
  // while a one-second retry remains bounded by the cooldown.
  {
    let calls=0;
    const f=fixture(()=>Promise.resolve({deviceID:'test-device-'+(++calls)}));
    const first=await f.identity.get();
    const second=await f.identity.refreshAfterEmpty(first);
    assert.notStrictEqual(second,first);
    assert.equal(calls,2);
    f.advance(1000);
    await assert.rejects(f.identity.refreshAfterEmpty(second),e=>e.code==='PLAYBACK_IDENTITY_COOLDOWN');
    assert.equal(calls,2,'cooldown must not send a registration request');
    f.advance(1001);
    const third=await f.identity.refreshAfterEmpty(second);
    assert.notStrictEqual(third,second);
    assert.equal(calls,3,'new foreground video must recover after the shortened cooldown');
    assert.equal(f.timers.size,0);
    f.identity.close();
  }
  // A superseded identity cannot trigger another replacement: reuse the
  // newer identity already obtained by a concurrent foreground request.
  {
    let calls=0;
    const f=fixture(()=>Promise.resolve({deviceID:'test-device-'+(++calls)}));
    const first=await f.identity.get();
    const second=await f.identity.refreshAfterEmpty(first);
    assert.strictEqual(await f.identity.refreshAfterEmpty(first),second);
    assert.equal(calls,2);
    f.identity.close();
  }
  {
    let calls=0;
    const f=fixture(()=>{calls++;return Promise.resolve({deviceID:'unexpected'});});
    const abort=cancellation.create();abort.abort();
    await assert.rejects(f.identity.get(abort.signal),e=>e.name==='AbortError');
    await assert.rejects(f.identity.refreshAfterEmpty({},abort.signal),e=>e.name==='AbortError');
    assert.equal(calls,0,'already cancelled work must not register an anonymous identity');
    f.identity.close();
  }
  console.log('PASS: registration coalescing, cached reuse, two-second cooldown, one-second rejection, superseded identity and cancellation');
})().catch(error=>{console.error(error);process.exitCode=1;});
