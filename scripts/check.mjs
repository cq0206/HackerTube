import {readFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const m=JSON.parse(await readFile('extension/manifest.json','utf8'));
if(m.manifest_version!==3)throw Error('Manifest V3 required');
if(JSON.stringify(m.permissions)!=='["storage"]')throw Error('Unexpected permissions');
for(const f of ['index.html','app.js','core.js','icons.js','platform.js','styles.css',m.background.service_worker,...Object.values(m.icons)])await access('extension/'+f);
for(const f of ['app.js','core.js','icons.js','platform.js','background.js'])execFileSync(process.execPath,['--check','extension/'+f]);
const html=await readFile('extension/index.html','utf8');
if(/<script[^>]*>\s*[^<\s]/.test(html)||/\son\w+=/.test(html))throw Error('Inline code is incompatible with CSP');
console.log('Manifest, assets, module syntax and inline-script checks passed.');

for (const f of ['main.mjs','policy.mjs','storage.mjs','preload.cjs']) execFileSync(process.execPath,['--check','desktop/'+f]);
