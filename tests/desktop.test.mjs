import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {apiURL, externalURL, localAsset, isAllowedRequest, isAppDocument, APP_URL} from '../desktop/policy.mjs';
import {LibraryStorage, validateValue} from '../desktop/storage.mjs';
import {freshState} from '../extension/core.js';
const id = 'PUv66718DII';
test('API bridge accepts only bounded public catalog queries', () => {
  assert.equal(apiURL('/api/docs?vids='+id),'https://hackertube.org/api/docs?vids='+id);
  assert.ok(apiURL('/api/list?dur=xlong&offset=900&n=100'));
  for(const bad of ['https://evil.test/api/docs','//evil.test/api/docs','/api/../admin','/api/docs?vids='+id+'&secret=x','/api/docs?vids='+id+'&vids='+id,'/api/docs?vids='+Array(41).fill(id).join(','),'/api/list?dur=xlong&offset=1&n=100','/api/list?dur=xlong&offset=10000&n=100','/api/docs?vids=../../../etc/passwd','/api/docs?vids='+id+'#fragment']) assert.throws(()=>apiURL(bad),bad);
});
test('external links cannot invoke local programs or navigate to lookalike origins', () => {
  for(const good of ['https://www.youtube.com/watch?v='+id,'https://news.ycombinator.com/item?id=123','https://hackertube.org/data','https://huggingface.co/datasets/open-index/hacker-news','https://github.com/cq0206/HackerTube/releases']) assert.equal(externalURL(good),good);
  for(const bad of ['file:///etc/passwd','javascript:alert(1)','https://www.youtube.com.evil.test/watch?v='+id,'https://www.youtube.com@evil.test/watch?v='+id,'https://www.youtube.com/watch?v='+id+'&redirect=https://evil.test','https://github.com/evil/repo','https://hackertube.org/api/delete','https://news.ycombinator.com/item?id=-1']) assert.equal(externalURL(bad),null,bad);
});
test('local protocol serves a fixed asset list without filesystem traversal', () => {
  assert.equal(localAsset(APP_URL)[0],'index.html');
  for(const bad of ['hackertube://app/desktop/preload.cjs','hackertube://app/../desktop/main.mjs','hackertube://app/%2e%2e/package.json','hackertube://evil/index.html','hackertube://app/index.html?code=x']) assert.equal(localAsset(bad),null,bad);
  assert.ok(isAppDocument(APP_URL+'#liked'));
  assert.equal(isAppDocument('https://app/index.html'),false);
});
test('renderer network permits thumbnail and catalog sources only', () => {
  assert.ok(isAllowedRequest('https://i.ytimg.com/vi/'+id+'/hq2.jpg'));
  assert.ok(isAllowedRequest('https://hackertube.org/api/docs?vids='+id));
  for(const bad of ['https://example.com/pixel','http://i.ytimg.com/vi/'+id+'/hq2.jpg','https://i.ytimg.com/track','https://hackertube.org/account','file:///etc/passwd']) assert.equal(isAllowedRequest(bad),false,bad);
});
test('desktop storage serializes simultaneous writes and persists isolated copies', async () => {
  const dir=await mkdtemp(join(tmpdir(),'ht-storage-'));
  try {
    const file=join(dir,'library.json'),store=new LibraryStorage(file),state=freshState();state.liked=[id];
    await Promise.all([store.set('state',state),store.set('cinemaThemeApplied',true),store.set('longIndex',{ids:[id,id],at:1,complete:true})]);
    const copy=await store.get('state');copy.liked.length=0;
    assert.deepEqual((await store.get('state')).liked,[id]);
    const reloaded=new LibraryStorage(file);assert.deepEqual((await reloaded.get('state')).liked,[id]);
    assert.deepEqual((await reloaded.get('longIndex')).ids,[id]);
    if(process.platform!=='win32') assert.equal((await stat(file)).mode&0o777,0o600);
    assert.equal(JSON.parse(await readFile(file,'utf8')).cinemaThemeApplied,true);
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('invalid storage writes do not replace the last valid library', async () => {
  const dir=await mkdtemp(join(tmpdir(),'ht-storage-'));
  try {
    const file=join(dir,'library.json'),store=new LibraryStorage(file);
    await store.set('state',freshState());const before=await readFile(file,'utf8');
    assert.throws(()=>store.set('../secret',{}));
    assert.throws(()=>store.set('state',{...freshState(),liked:['bad']}));
    assert.throws(()=>store.set('metadata',{[id]:{duration:Infinity,at:1}}));
    assert.equal(await readFile(file,'utf8'),before);
    await store.set('cinemaThemeApplied',true);
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('corrupt local library is preserved for manual recovery', async () => {
  const dir=await mkdtemp(join(tmpdir(),'ht-storage-'));
  try {const file=join(dir,'library.json');await writeFile(file,'{broken');const store=new LibraryStorage(file);await assert.rejects(store.get('state'));await assert.rejects(store.set('state',freshState()));assert.equal(await readFile(file,'utf8'),'{broken');}
  finally {await rm(dir,{recursive:true,force:true});}
});
test('cache validation rejects unbounded or malformed metadata', () => {
  assert.throws(()=>validateValue('metadata',{[id]:{duration:-1,at:1}}));
  assert.throws(()=>validateValue('longIndex',{ids:['../bad'],at:1,complete:true}));
  assert.throws(()=>validateValue('cinemaThemeApplied','true'));
});
