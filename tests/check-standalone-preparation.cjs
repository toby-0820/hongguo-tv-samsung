'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '../build/hongguo-standalone/service/entry.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
const emptyError = () => Object.assign(new Error('empty video model'), { code: 'VIDEO_MODEL_EMPTY' });
function harness(outcomes) {
  const calls = [], timers = [], errors = [];
  const provider = {
    prepare: function () {
      calls.push(Array.from(arguments));
      const next = outcomes.shift();
      return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
    },
    search: () => Promise.resolve({ items: [] })
  };
  function Server() {}
  let captured;
  const dependencies = {
    fs: {}, path,
    https: { globalAgent: { options: {} } },
    http: { globalAgent: {}, createServer: () => { throw new Error('unexpected startup failure server'); } },
    net: { Server },
    './roots.json': [],
    './provider': provider,
    './service': opts => {
      captured = opts;
      return { ensureReady: () => Promise.resolve(), shutdown: () => {} };
    }
  };
  const context = {
    module: { exports: {} }, Buffer,
    process: { versions: { node: '6.0.0' }, env: {}, version: 'v6.0.0' },
    console: { error: error => errors.push(error) },
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    require: name => {
      if (!(name in dependencies)) throw new Error('unexpected require ' + name);
      return dependencies[name];
    }
  };
  vm.runInNewContext(source, context, { filename: 'service/entry.js' });
  context.module.exports.onStart();
  assert(captured, 'real entry should start the service');
  assert.strictEqual(captured.provider, provider);
  assert.deepStrictEqual(errors, []);
  return { provider, calls, timers };
}
(async () => {
  // These are behavior checks of the real onStart wrapper, not extracted code.
  for (const [requested, expected] of [['range', 'range'], ['full', 'full'], [undefined, 'full']]) {
    const result = { path: '/local/movie.mp4' };
    const h = harness([result]);
    const signal = { aborted: false };
    assert.strictEqual(await h.provider.prepare('series', 'vid', '720P', true, requested, false, signal), result);
    assert.deepStrictEqual(h.calls, [['series', 'vid', '720P', true, expected, false, signal]]);
    assert.strictEqual(h.calls[0][6], signal, 'original cancellation signal identity must survive');
  }
  {
    const failure = emptyError(), h = harness([failure]);
    const signal = { aborted: true };
    await assert.rejects(h.provider.prepare('series', 'vid', '', true, 'range', true, signal), e => e === failure);
    assert.strictEqual(h.calls.length, 1);
    assert.strictEqual(h.timers.length, 0, 'already aborted request must not schedule recovery');
  }
  {
    const result = { recovered: true }, h = harness([emptyError(), result]);
    const signal = { aborted: false };
    const pending = h.provider.prepare('series', 'vid', '540P', false, 'range', true, signal);
    await flush();
    assert.strictEqual(h.timers.length, 1);
    assert.strictEqual(h.timers[0].ms, 500);
    h.timers.shift().fn();
    assert.strictEqual(await pending, result);
    assert.strictEqual(h.calls.length, 2);
    assert.deepStrictEqual(h.calls[1], h.calls[0], 'recovery must preserve mode, quality, prefetch and signal');
  }
  {
    const failure = Object.assign(new Error('cache full'), { code: 'MEDIA_CACHE_FULL' });
    const h = harness([failure]);
    await assert.rejects(h.provider.prepare('series', 'vid', '', true, 'full', false), e => e === failure);
    assert.strictEqual(h.calls.length, 1);
    assert.strictEqual(h.timers.length, 0, 'cache failures must not trigger empty-model retry');
  }
  {
    const failure = emptyError(), h = harness([failure, { shouldNotHappen: true }]);
    const signal = { aborted: false };
    const pending = h.provider.prepare('series', 'vid', '', true, 'range', false, signal);
    await flush();
    signal.aborted = true;
    h.timers.shift().fn();
    await assert.rejects(pending, e => e === failure || e.name === 'AbortError');
    assert.strictEqual(h.calls.length, 1, 'request aborted during backoff must not start another network preparation');
  }
  console.log('PASS: real service startup, range/full selection, signal identity, guarded recovery, cancellation during retry delay');
})().catch(error => { console.error(error); process.exitCode = 1; });
