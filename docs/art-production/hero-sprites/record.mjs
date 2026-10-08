import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {read,bounds} from './raster.mjs';
const R=path.dirname(new URL(import.meta.url).pathname),root=path.resolve(R,'../../..'),base=path.relative(root,R);
const M=JSON.parse(fs.readFileSync(path.join(R,'game-manifest.json'))),out=JSON.parse(fs.readFileSync(path.join(R,'manifest.json'))),gen=JSON.parse(fs.readFileSync(path.join(R,'generation.json')));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function evidence(file){const bytes=fs.readFileSync(path.join(root,file)),im=read(path.join(root,file));return {sha256:sha(bytes),rgba_sha256:sha(im.data),bounds:bounds(im,1),rect:[0,0,im.width,im.height]};}
for(const s of out.sheets){s.cell=M.canvas.size;s.grid=[s.frames.length,1];s.layout='frames';for(const f of s.frames){const g=M.characters[s.id].frames[f.name];Object.assign(f,evidence(f.file),{source:path.join(base,g.source),uniform_scale:g.uniform_scale});f.layer_sha256={hair:sha(fs.readFileSync(path.join(root,f.masks.hair))),grip:sha(fs.readFileSync(path.join(root,f.overlays.grip)))};}}
for(const [id,w] of Object.entries(M.weapons)){const file=path.join(base,w.image),g=gen.sources.find(s=>s.id===id),e=evidence(file);out.sheets.push({id,kind:'weapon',category:'image',file,size:[256,256],cell:[256,256],grid:[1,1],sha256:e.sha256,frames:[{...e,pivot:w.pivot,source:path.join(base,g.source),uniform_scale:g.uniform_scale}]});}
for(const a of Object.values(out.attachments))a.sha256=sha(fs.readFileSync(path.join(root,a.file)));
out.bundles=Object.entries(M.characters).map(([id,c])=>({id,character:id,animations:Object.keys(M.animations),weapon:c.defaultWeapon,headgear:Object.keys(M.headgear)}));
out.source.gameManifest=path.join(base,'game-manifest.json');out.source.gameManifest_sha256=sha(fs.readFileSync(path.join(R,'game-manifest.json')));out.source.enrichment='record.mjs: only source/scale, hashes, raster bounds, weapon sheets and bundle evidence added after standard converter.';
fs.writeFileSync(path.join(R,'manifest.json'),JSON.stringify(out,null,2)+'\n');console.log('Added reproducible frame/source/layer hashes and uniform-scale evidence.');
