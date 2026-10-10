import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {root,project,order,read,blank,paste,scale,crop,bbox,ranges,json,preserve} from './work.mjs';
import {decodePng} from '../../../../../asset-kit/tools/lib/png.mjs';
const playback=JSON.parse(fs.readFileSync(path.join(root,'walk_playback.json'))),ids=playback.frames.map(f=>f.id);
const crowns=[130,132,131,128,130,132,131,128];
const same=(a,b)=>a.width===b.width&&a.height===b.height&&Buffer.from(a.data).equals(Buffer.from(b.data));
const frames=[],hairColors=new Set(['250,240,215','225,205,184','180,155,145','73,52,47']);
for(const [index,id]of ids.entries()){
 const im=read(path.join(root,id,'composite.png')),p=JSON.parse(fs.readFileSync(path.join(root,id,'pose.json'))),layers={};
 assert.equal(im.width,256);assert.equal(im.height,240);assert.deepEqual(p.origin,[128,224]);
 let merged=blank();
 for(const n of order){
  const a=read(path.join(root,id,n+'.png'));layers[n]=a;assert.equal(a.width,256);assert.equal(a.height,240);assert.ok(bbox(a),id+' '+n+' empty');
  for(let i=0;i<a.data.length;i+=4){assert.ok(a.data[i+3]===0||a.data[i+3]===255,id+' alpha');if(n.startsWith('hair')&&a.data[i+3])assert.ok(hairColors.has(a.data.subarray(i,i+3).join(',')),id+' hair palette');}
  paste(merged,a);
 }
 assert.ok(same(merged,im),id+' layer reconstruction');assert.ok(same(scale(im,4),read(path.join(root,id,'composite_4x.png'))),id+' 4x');
 const hb=bbox(paste(paste(blank(),layers.hair_back),layers.hair_front));
 assert.equal(hb[1],crowns[index]);assert.equal(hb[2]-hb[0]+1,55);assert.deepEqual(hb,p.head.bounds);assert.equal(bbox(im)[3],223);assert.equal(bbox(im)[1],crowns[index]);
 assert.deepEqual(ranges(im,223),p.feet.opaqueRanges);assert.ok(p.feet.opaqueRanges.length);assert.ok(im.data[3]===0);
 for(const [n,pt]of [['grip',p.weapon.gripPoint],['katar',p.weapon.tipPoint]])assert.ok(layers[n].data[(pt[1]*256+pt[0])*4+3],id+' '+n+' anchor');
 assert.equal(p.weapon.hand,'near');
 if(index!==0&&index!==4){assert.equal(p.feet[index<4?'far':'near'],null);assert.ok(p.feet[index<4?'near':'far']);}
 frames.push({index:index+1,id,crownY:hb[1],headWidth:55,headBounds:hb,feet:p.feet,grip:p.weapon.gripPoint,tip:p.weapon.tipPoint});
}
const supportCenter=(i,side)=>{const r=frames[i].feet[side];return(r[0]+r[1])/2;};
const targets=[142.5,134,125,117,139,132,125,118];
for(let i=0;i<8;i++)assert.equal(supportCenter(i,i<4?'near':'far'),targets[i]);
const supportRuns=[{side:'near',indices:[0,1,2,3],nextContact:4},{side:'far',indices:[4,5,6,7],nextContact:0}].map(run=>{
 const xs=[...run.indices.map(i=>supportCenter(i,run.side)),supportCenter(run.nextContact,run.side)],steps=xs.slice(1).map((x,i)=>x-xs[i]);
 assert.ok(steps.every(n=>n<0&&n>=-9));assert.ok(Math.max(...steps)-Math.min(...steps)<=1.5);
 return {...run,centers:xs,steps,contactTransition:steps.at(-1)};
});
assert.equal(playback.totalMs,720);assert.equal(playback.frames.length,8);assert.ok(playback.loop);
playback.frames.forEach(f=>{assert.equal(f.ms,90);assert.equal(f.dx,0);assert.equal(f.dy,0);});
const sheet=read(path.join(root,'keyposes_walk.png'));assert.equal(sheet.width,2048);assert.equal(sheet.height,240);
ids.forEach((id,i)=>assert.ok(same(crop(sheet,i*256,0,256,240),read(path.join(root,id,'composite.png'))),id+' sheet order'));
assert.ok(same(scale(sheet,4),read(path.join(root,'keyposes_walk_4x.png'))));
// Parse the APNG and reconstruct every PNG frame, verifying actual pixels and delays.
const apng=fs.readFileSync(path.join(root,'walk_preview.apng'));let ihdr,groups=[],current,actl;
const chunk=(type,data)=>{const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);out.write(type,4);data.copy(out,8);return out;}; // decoder ignores CRC; original chunks retain their CRC on disk
for(let p=8;p<apng.length;){const n=apng.readUInt32BE(p),t=apng.toString('ascii',p+4,p+8),d=apng.subarray(p+8,p+8+n);if(t==='IHDR')ihdr=d;if(t==='acTL')actl=d;if(t==='fcTL'){current={delay:d.readUInt16BE(20)/d.readUInt16BE(22),data:[]};groups.push(current);}if(t==='IDAT')current.data.push(d);if(t==='fdAT')current.data.push(d.subarray(4));p+=n+12;}
assert.equal(actl.readUInt32BE(0),8);assert.equal(actl.readUInt32BE(4),0);assert.equal(groups.length,8);
groups.forEach((g,i)=>{assert.equal(g.delay,.09);const rebuilt=decodePng(Buffer.concat([apng.subarray(0,8),chunk('IHDR',ihdr),chunk('IDAT',Buffer.concat(g.data)),chunk('IEND',Buffer.alloc(0))]));assert.ok(same(rebuilt,scale(crop(read(path.join(root,ids[i],'composite.png')),80,120,96,108),4)),'APNG frame '+i);});
assert.equal(fs.readFileSync(path.join(root,'REQUEST_WALK_LEGS.md'),'utf8'),fs.readFileSync(path.join(project,'docs/art/requests/2026-10-10-assassin-96-walk-legs.md'),'utf8'));
const sourceNotes=fs.readFileSync(path.join(root,'NOTES.md'),'utf8');
for(const line of ['"앞쪽 지지발과 뒷쪽 발이 흔들려서 캐릭터 전체가 흔들려 보여."','등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것','레퍼런스를 체크할 것','스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것'])assert.ok(sourceNotes.includes(line));
const prompts=JSON.parse(fs.readFileSync(path.join(root,'PROMPTS_WALK_LEGS.json'))).sequence;
assert.equal(prompts.length,7);assert.equal(prompts.filter(p=>p.status==='accepted').length,6);assert.equal(prompts.filter(p=>p.status==='rejected').length,1);
for(const p of prompts){assert.ok(p.idleReattached);assert.ok(fs.existsSync(path.join(root,p.source)));}
const before=JSON.parse(fs.readFileSync(path.join(root,'legs-scope-before.json'))),after=preserve();
assert.deepEqual(after,before.outside,'outside scope unchanged including src');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const editIds=ids.filter((id,i)=>i!==0&&i!==4),pixelChecks=[];
let protectedFiles=0,archivedFiles=0;
for(const [file,h]of Object.entries(before.inside)){
 const top=file.split('/')[0];
 if(top.startsWith('idle_')||top.startsWith('attack_')||top==='walk_1_contact_near'||top==='walk_3_contact_far'||/^keyposes_(idle|attack)/.test(file)){
  assert.equal(hash(path.join(root,file)),h,'protected '+file);protectedFiles++;
 }
 if(editIds.includes(top)){assert.equal(hash(path.join(root,'rejected/walk_legs_previous',file)),h,'archived '+file);archivedFiles++;}
}
for(const id of editIds){
 const a=read(path.join(root,'rejected/walk_legs_previous',id,'composite.png')),b=read(path.join(root,id,'composite.png')),mask=read(path.join(root,id,'sources/leg_edit_mask.png')),cloth=read(path.join(root,id,'sources/protected_cloth_mask.png'));
 let changed=0,protectedChanged=0,aboveHipsChanged=0,clothChanged=0,minChangedY=240;
 for(let y=0;y<240;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(!Buffer.from(a.data.subarray(i,i+4)).equals(Buffer.from(b.data.subarray(i,i+4)))){changed++;minChangedY=Math.min(minChangedY,y);if(!mask.data[i+3])protectedChanged++;if(y<192)aboveHipsChanged++;if(cloth.data[i+3])clothChanged++;}}
 assert.ok(changed>0);assert.equal(protectedChanged,0);assert.equal(aboveHipsChanged,0);assert.equal(clothChanged,0);
 for(const n of order.filter(n=>n!=='body'))assert.equal(hash(path.join(root,id,n+'.png')),hash(path.join(root,'rejected/walk_legs_previous',id,n+'.png')));
 const p=JSON.parse(fs.readFileSync(path.join(root,id,'pose.json'))),old=JSON.parse(fs.readFileSync(path.join(root,'rejected/walk_legs_previous',id,'pose.json')));
 assert.deepEqual(p.head,old.head);assert.deepEqual(p.weapon,old.weapon);
 pixelChecks.push({id,changed,minChangedY,protectedChanged,aboveHipsChanged,clothChanged,plantedFootCenter:p.registration.actualSupportCenter,groundRow:223});
}
const result={passed:true,frames,supportRuns,pixelChecks,generated:7,accepted:6,rejectedNew:1,archivedFolders:6,archivedFiles,protectedFiles,outsideScope:{checkedFiles:Object.keys(after).length,changed:[],added:[]},checks:['256x240 canvas','binary alpha','layer reconstruction','4x nearest','crown and head width','foot center targets','continuous contact-inclusive steps','sheet order','APNG frame pixels and90ms','verbatim request and rules','non-leg pixel equality','cloth masks','unchanged head/weapon metadata','non-body byte equality','archive SHA256','outside SHA256'],artApproval:'사용자 시각 승인 전'};
json('validation_walk_legs.json',result);json('validation_walk.json',result);console.log(JSON.stringify({passed:true,supportRuns,pixelChecks,protectedFiles,archivedFiles,outsideFiles:Object.keys(after).length},null,2));
