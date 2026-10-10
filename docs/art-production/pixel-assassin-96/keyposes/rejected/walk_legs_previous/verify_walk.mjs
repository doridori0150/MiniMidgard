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
const supportRuns=[{side:'near',indices:[0,1,2,3],nextContact:4},{side:'far',indices:[4,5,6,7],nextContact:0}].map(run=>{
 const xs=run.indices.map(i=>supportCenter(i,run.side)),steps=xs.slice(1).map((x,i)=>x-xs[i]);
 for(const step of steps)assert.ok(Math.abs(step+5)<=.5,'new phase planted foot must move about5px: '+step);
 assert.ok(Math.abs(xs[0]-xs.at(-1)-15)<=.5);
 return {...run,centers:xs,steps,newPhaseTravel:xs[0]-xs.at(-1),fixedContactTransition:supportCenter(run.nextContact,run.side)-xs.at(-1)};
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
assert.equal(fs.readFileSync(path.join(root,'REQUEST_WALK_INBETWEENS.md'),'utf8'),fs.readFileSync(path.join(project,'docs/art/requests/2026-10-10-assassin-96-walk-inbetweens.md'),'utf8'));
const sourceNotes=fs.readFileSync(path.join(root,'NOTES.md'),'utf8');
for(const line of ['"모션은 최소 6~8장은 써야 할 거 같아."','"앞쪽 지지발과 뒷쪽 발이 흔들려서 캐릭터 전체가 흔들려 보여."','등신대, 컨셉 스타일, 전반적인 크기 영역을 맞출 것','레퍼런스를 체크할 것','스프라이트 애니메이션을 사전에 어떤 동작을 할지 고려하여, 1장씩 생성하고, 연결할 것'])assert.ok(sourceNotes.includes(line),'verbatim missing '+line);
const prompts=JSON.parse(fs.readFileSync(path.join(root,'PROMPTS_WALK_INBETWEENS.json'))).sequence;
assert.equal(prompts.length,8);assert.equal(prompts.filter(p=>p.status==='accepted').length,6);assert.equal(prompts.filter(p=>p.status==='rejected').length,2);
for(const p of prompts){assert.ok(p.idleReattached);assert.ok(fs.existsSync(path.join(root,p.source)));if(p.status==='rejected')assert.ok(fs.existsSync(path.join(root,p.id,'REASON.md')));}
for(const id of ['walk_2_pass_near','walk_4_pass_far'])assert.ok(fs.existsSync(path.join(root,'rejected/walk_previous',id,'composite.png')));
const before=JSON.parse(fs.readFileSync(path.join(root,'walk-scope-before.json'))),after=preserve();
const changed=Object.keys(before.outside).filter(k=>before.outside[k]!==after[k]),added=Object.keys(after).filter(k=>!(k in before.outside));
assert.deepEqual(changed,[],'outside files changed');assert.deepEqual(added,[],'outside files added');
for(const [file,hash]of Object.entries(before.protectedFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),hash,'protected '+file);
const result={structuralChecksPassed:true,artApproval:'사용자 시각 승인 전',poses:8,generated:8,accepted:6,rejectedNew:2,archivedOldPassing:2,frames,supportRuns,limitations:['고정 접지 장까지 포함하면 한 지지 주기의 실제 이동은 가까운 발34px, 먼 발26.5px다. 새 세 구간의 약15px 조건과 완전 균등 이동은 동시에 만족할 수 없어 고정 접지 보존을 우선했다.','브라우저 연결 없음 및 Safari 도구 승인 제한으로 HTML의 실시간 재생 화면 검수는 하지 못했다. 8장 시각 대조 및 APNG 픽셀·90ms 타이밍 검증을 수행했다.'],outsideScope:{checkedFiles:Object.keys(before.outside).length,changed,added},protectedFiles:Object.keys(before.protectedFiles).length};
json('validation_walk.json',result);console.log(JSON.stringify({structuralChecksPassed:true,poses:8,supportRuns,outsideFiles:result.outsideScope.checkedFiles,protectedFiles:result.protectedFiles},null,2));
