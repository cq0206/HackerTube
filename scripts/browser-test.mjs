import {spawn} from 'node:child_process';
import {mkdir,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const profile=await mkdtemp(tmpdir()+'/hackertube-qa-');
const child=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--disable-gpu','--remote-debugging-pipe','--enable-unsafe-extension-debugging','--user-data-dir='+profile],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let next=0,buffer='',pending=new Map(),errors=[];
child.stderr.on('data',()=>{});
child.stdio[4].on('data',chunk=>{buffer+=chunk.toString();let i;while((i=buffer.indexOf('\0'))>=0){const raw=buffer.slice(0,i);buffer=buffer.slice(i+1);if(!raw)continue;const msg=JSON.parse(raw);if(msg.id){const p=pending.get(msg.id);if(p){clearTimeout(p.timer);pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text);else if(msg.method==='Log.entryAdded'&&msg.params.entry.source==='security')errors.push(msg.params.entry.text);}});
function cdp(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},30000);pending.set(id,{resolve,reject,timer});child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');});}
let session;
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},session);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function until(expression,ms=15000){const until=Date.now()+ms;do{const r=await evaluate(expression);if(r)return r;await new Promise(r=>setTimeout(r,120));}while(Date.now()<until);throw Error('Condition timeout: '+expression);}
const results=[];
function pass(name){results.push(name);console.log('PASS '+name);}
try{
 const {id}=await cdp('Extensions.loadUnpacked',{path:resolve('extension')});pass('Chrome loads unpacked Manifest V3 extension');
 const {targetId}=await cdp('Target.createTarget',{url:`chrome-extension://${id}/index.html`});
 session=(await cdp('Target.attachToTarget',{targetId,flatten:true})).sessionId;
 await cdp('Runtime.enable',{},session);await cdp('Log.enable',{},session);await cdp('Page.enable',{},session);
 await until("document.querySelectorAll('.video-card').length===24");
 assert.equal(await evaluate("document.querySelector('#total-count').textContent"),'6,454');pass('Bundled full catalog renders inside extension CSP');
 const saved=await evaluate("(()=>{const b=document.querySelector('[data-save]');const id=b.dataset.save;b.click();return id})()");
 await until(`document.querySelector('#later-count').textContent==='1'`);
 const st=await evaluate("chrome.storage.local.get('state')");assert.ok(st.state.later.includes(saved));
 await cdp('Page.reload',{},session);await until("document.querySelector('#later-count')?.textContent==='1'");pass('Saved videos persist in chrome.storage.local after reload');
 await evaluate("location.hash='later'");await until("document.querySelectorAll('.video-card').length===1");assert.equal(await evaluate("document.querySelector('.video-card').dataset.id"),saved);pass('Watch-later navigation');
 await evaluate("location.hash='discover'");await until("document.querySelectorAll('.video-card').length===24");
 await evaluate("document.querySelector('[data-detail]').click()");await until("document.querySelector('#detail').open");
 await evaluate("document.querySelector('[data-like]').click()");await until("document.querySelector('#liked-count').textContent==='1'");
 assert.ok(await evaluate("document.querySelector('blockquote a').href.startsWith('https://news.ycombinator.com/item?id=')"));
 await evaluate("document.querySelector('[data-hide]').click()");const hidden=await evaluate("document.querySelector('[data-hide]').dataset.hide");
 await evaluate("document.querySelector('#detail').close()");assert.equal(await evaluate(`!!document.querySelector('.video-card[data-id="${hidden}"]')`),false);pass('Details, like, HN evidence, hide from discovery');
 await evaluate("(()=>{const q=document.querySelector('#search');q.value='linear algebra';q.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await until("document.querySelector('#collection-title').textContent.includes('linear algebra')");assert.ok(await evaluate("document.querySelectorAll('.video-card').length>0"));pass('Debounced local search');
 await evaluate("document.querySelector('#theme').click()");assert.equal(await evaluate("document.documentElement.dataset.theme"),'light');
 await evaluate("document.querySelector('#settings').click()");await until("document.querySelector('#settings-dialog').open");await evaluate("document.querySelector('#frames').click()");assert.ok(await evaluate("[...document.querySelectorAll('.thumbnail img')].every(x=>x.src.endsWith('hqdefault.jpg'))"));await evaluate("document.querySelector('#settings-dialog').close()");pass('Dark theme and thumbnail preference');
 await cdp('Network.enable',{},session);await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0},session);
 await cdp('Page.reload',{},session);await until("document.querySelectorAll('.video-card').length>0");pass('Offline extension reload still reads bundled catalog');
 await evaluate("location.hash='longs'");await until("document.querySelector('#network-status').textContent.includes('无法连接')",20000);pass('Offline Longs explains network requirement');
 await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1},session);
 await evaluate("document.querySelector('#retry-longs').click()");
 await until("document.querySelector('#network-status').hidden && document.querySelectorAll('.video-card').length>0",90000);
 const cached=await evaluate("chrome.storage.local.get(['longIndex','metadata'])");
 assert.ok(cached.longIndex.complete&&cached.longIndex.ids.length>100);
 assert.ok(cached.longIndex.ids.every(id=>cached.metadata[id]?.duration>3600));
 pass('Live Longs pagination and verified durations cache: '+cached.longIndex.ids.length+' videos');
 await cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0},session);
 await cdp('Page.reload',{},session);await until("document.querySelectorAll('.video-card').length===24");
 assert.equal(await evaluate("document.querySelector('#network-status').hidden"),true);pass('Cached Longs reloads offline');
 await cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1},session);
 await evaluate("location.hash='discover'");await until("document.querySelectorAll('.video-card').length===24");
 await evaluate("document.querySelector('#theme').click(); document.querySelector('#settings').click(); document.querySelector('#frames').click(); document.querySelector('#settings-dialog').close()");
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false},session);
 await new Promise(r=>setTimeout(r,2000));
 await mkdir('artifacts',{recursive:true});const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},session);await writeFile('artifacts/preview.png',Buffer.from(shot.data,'base64'));
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},session);
 assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth"),false);pass('390px responsive layout has no horizontal overflow');
 await evaluate("document.querySelector('[data-open-settings]').click()");await until("document.querySelector('#settings-dialog').open");await evaluate("document.querySelector('#settings-dialog').close()");pass('Mobile settings remains reachable');
 const mobile=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},session);await writeFile('artifacts/preview-mobile.png',Buffer.from(mobile.data,'base64'));
 await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false},session);
 await evaluate("document.querySelector('[data-detail]').click()");await until("document.querySelector('#detail').open");
 const detail=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},session);await writeFile('artifacts/preview-detail.png',Buffer.from(detail.data,'base64'));
 assert.deepEqual(errors,[]);pass('No JavaScript exceptions or CSP errors');
 await writeFile('artifacts/browser-test.json',JSON.stringify({extensionId:id,results,errors},null,2));
 console.log('Browser checks complete.');
}finally{await cdp('Browser.close').catch(()=>{});child.kill();}
