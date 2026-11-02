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
try {
 const {id}=await cdp('Extensions.loadUnpacked',{path:resolve('extension')});
 const {targetId}=await cdp('Target.createTarget',{url:`chrome-extension://${id}/index.html`});
 session=(await cdp('Target.attachToTarget',{targetId,flatten:true})).sessionId;
 await cdp('Page.enable',{},session);
 await cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false},session);
 await until("document.querySelectorAll('.video-card').length===24");
 await until("document.querySelector('.hero img')?.complete || document.querySelector('.hero-image')?.complete || document.querySelectorAll('.video-card img')[0]?.complete");
 await new Promise(r=>setTimeout(r,2000));
 async function shot(name){const s=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},session);await writeFile('store/assets/'+name,Buffer.from(s.data,'base64'));}
 await shot('01-discover-1280x800.png');
 await evaluate("document.querySelector('[data-detail]').click()");await until("document.querySelector('#detail').open");
 await new Promise(r=>setTimeout(r,500));await shot('02-details-1280x800.png');
 await evaluate("document.querySelector('#detail').close();document.querySelector('[data-save]').click();location.hash='later'");
 await until("document.querySelectorAll('.video-card').length===1");await shot('03-library-1280x800.png');
 console.log('Three real extension screenshots captured at 1280x800.');
} finally {await cdp('Browser.close').catch(()=>{});child.kill();}
