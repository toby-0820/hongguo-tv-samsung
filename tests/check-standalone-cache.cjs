'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const createCache = require('./../build/hongguo-standalone/service/media-cache');
const MiB = 1024 * 1024;
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hongguo-cache-test-'));
let now = 1793200000000;
const options = { maxBytes: 256 * MiB, handoffMs: 8000, now: () => now };
const token = n => n.toString(16).padStart(24, '0');
const mediaPath = (dir, key) => path.join(dir, key, key + '.mp4');
function fixture(name) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  return { dir, cache: createCache(dir, options) };
}
function writeMedia(dir, key, bytes) {
  fs.mkdirSync(path.join(dir, key), { recursive: true });
  const file = mediaPath(dir, key);
  fs.closeSync(fs.openSync(file, 'w'));
  fs.truncateSync(file, bytes);
  fs.utimesSync(file, new Date(now), new Date(now));
  return file;
}
try {
  // A normal episode over the former 64 MiB ceiling must be admitted.
  {
    const { cache } = fixture('large-episode');
    const key = token(1), release = cache.protect(key);
    cache.reserve(key, 80 * MiB);
    assert.strictEqual(cache.diagnostics().reserved_bytes, 80 * MiB);
    cache.finishDownload(key);
    release();
    cache.prune(true);
    assert.strictEqual(cache.diagnostics().reserved_bytes, 0);
    cache.close();
  }
  // The current episode and incoming next episode fit together; stale LRU
  // content is reclaimed while the actual playing file stays intact.
  {
    const { dir, cache } = fixture('playing-and-next');
    const current = token(2), old = token(3), next = token(4);
    const oldFile = writeMedia(dir, old, 40 * MiB);
    now += 1000;
    const currentFile = writeMedia(dir, current, 150 * MiB);
    const session = cache.updateSession({ action: 'open' }).session;
    cache.updateSession({ action: 'update', session, revision: 1, token: current });
    const release = cache.protect(next);
    cache.reserve(next, 80 * MiB);
    assert(!fs.existsSync(oldFile), 'old LRU content should be reclaimed');
    assert(fs.existsSync(currentFile), 'playing file must survive eviction');
    assert.strictEqual(cache.diagnostics().bytes, 230 * MiB);
    // A truly impossible request must fail without deleting the current movie.
    assert.throws(() => cache.reserve(next, 300 * MiB), e => e.code === 'MEDIA_CACHE_FULL');
    assert(fs.existsSync(currentFile));
    cache.finishDownload(next);
    release();
    cache.close();
  }
  // Recently handed-off content has a short safety window, then becomes
  // reclaimable under pressure even though its normal TTL has not expired.
  {
    const { dir, cache } = fixture('handoff-expiry');
    const previous = token(5), next = token(6);
    const previousFile = writeMedia(dir, previous, 180 * MiB);
    cache.touch(previous, true);
    const release = cache.protect(next);
    assert.throws(() => cache.reserve(next, 100 * MiB), e => e.code === 'MEDIA_CACHE_FULL');
    assert(fs.existsSync(previousFile), 'handoff window should preserve returned media');
    now += 8001;
    cache.reserve(next, 100 * MiB);
    assert(!fs.existsSync(previousFile), 'expired handoff should allow eviction');
    cache.finishDownload(next);
    release();
    cache.close();
  }
  // Several episode changes should not pin every previous file. Session
  // updates release old current files but preserve the latest current file.
  {
    const { dir, cache } = fixture('repeated-switch');
    const session = cache.updateSession({ action: 'open' }).session;
    let current;
    for (let i = 0; i < 12; i++) {
      const key = token(100 + i), release = cache.protect(key);
      cache.reserve(key, 55 * MiB);
      writeMedia(dir, key, 55 * MiB);
      cache.finishDownload(key);
      cache.touch(key, true);
      cache.updateSession({ action: 'update', session, revision: i, token: key });
      release();
      current = mediaPath(dir, key);
      now += 9000;
      cache.prune(true);
      assert(fs.existsSync(current));
      assert(cache.diagnostics().bytes <= options.maxBytes);
    }
    assert(cache.diagnostics().files <= 4, 'old episode count should remain bounded');
    cache.close();
  }
  const provider = fs.readFileSync(path.join(__dirname, '../build/hongguo-standalone/service/provider.js'), 'utf8');
  assert(provider.includes('maxBytes:268435456'), 'built TV provider must use tested 256 MiB bound');
  assert(provider.includes('handoffMs:8000'), 'built TV provider must use tested handoff window');
  console.log('PASS: >64 MiB episode, playing+next, LRU eviction, capacity failure preservation, handoff expiry, 12 switches');
} finally {
  const resolved = path.resolve(root);
  assert(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
  assert(path.basename(resolved).startsWith('hongguo-cache-test-'));
  fs.rmSync(resolved, { recursive: true, force: true });
}
