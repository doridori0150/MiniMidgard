import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {root,project,order,ref,read,blank,paste,scale,crop,bbox,ranges,preserve,json} from './work.mjs';
const ids=['attack_5_swing','attack_3_contact'];
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const equal=(a,b)=>Buffer.from(a).equals(Buffer.from(b));
const same=(a,b)=>a.width===b.width&&a.height===b.height&&equal(a.data,b.data);
const before=JSON.parse(fs.readFileSync(path.join(root,'backleg-scope-before.json')));
assert.deepEqual(preserve(),before.outside,'keyposes 외부 파일 변경');
assert.ok(fs.readFileSync(path.join(root,'REQUEST_SWING_BACKLEG.md')).equals(fs.readFileSync(path.join(project,'docs/art/requests/2026-10-11-assassin-96-swing-backleg.md'))));
const allowed=new Set(['NOTES.md','keyposes_attack.png','keyposes_attack_4x.png','side_by_side_attack.png','review_attack_3x.png','review_layers_3x.png']);
let untouched=0,archived=0;
for(const [file,hash] of Object.entries(before.inside)){
 const id=ids.find(id=>file.startsWith(id+'/'));
 if(id){assert.equal(sha(path.join(root,'rejected',id+'_backleg_previous',file.slice(id.length+1))),hash,'교체 전 파일 보존: '+file);archived++;}
 else if(!allowed.has(file)){assert.equal(sha(path.join(root,file)),hash,'다른 프레임/기존 기록 보존: '+file);untouched++;}
}
const frames=[];
for(const id of ids){
 const dir=path.join(root,id),old=path.join(root,'rejected',id+'_backleg_previous');
 const layers=Object.fromEntries(order.map(n=>[n,read(path.join(dir,n+'.png'))]));
 for(const name of ['hair_back','hair_front','grip','katar'])assert.equal(sha(path.join(dir,name+'.png')),sha(path.join(old,name+'.png')),id+' '+name);
 const body=layers.body,prior=read(path.join(old,'body.png')),mask=read(path.join(dir,'sources/backleg_mask.png')),clothMask=read(path.join(dir,'sources/cloth_end_edit_mask.png'));
 let changed=0,outside=0,clothChanges=0,frontLegChanges=0,upperBodyChanges=0;
 for(let i=0;i<body.data.length;i+=4){
  assert.ok([0,255].includes(body.data[i+3]),'binary alpha');
  if(!equal(body.data.subarray(i,i+4),prior.data.subarray(i,i+4))){
   changed++;const x=i/4%256,y=Math.floor(i/4/256);if(!mask.data[i+3])outside++;if(clothMask.data[i+3])clothChanges++;
   if(x>=159&&y>=192)frontLegChanges++;if(y<195)upperBodyChanges++;
  }
 }
 assert.equal(outside,0);assert.equal(frontLegChanges,0);assert.equal(upperBodyChanges,0);
 // Independent 4-neighbour check follows the rear leg only, excluding the front leg.
 const visited=new Set(),queue=[[110,223]];let qi=0;
 while(qi<queue.length){const [x,y]=queue[qi++],key=y*256+x;if(x<104||x>158||y<195||y>223||visited.has(key)||!body.data[key*4+3])continue;visited.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}
 const hip=id==='attack_5_swing'?[148,197]:[152,197];assert.ok(visited.has(hip[1]*256+hip[0]),id+' hip to boot continuity');
 const connectedWidths=[];for(let y=198;y<=223;y++){let n=0;for(let x=104;x<=158;x++)if(visited.has(y*256+x))n++;assert.ok(n>=5,id+' substantial leg row '+y);connectedWidths.push([y,n]);}
 const bootRows=[];for(let y=215;y<=223;y++){
  const rr=ranges(body,y).filter(([a,b])=>a>=104&&b<125);assert.ok(rr.length,id+' boot row '+y);bootRows.push({y,ranges:rr,width:rr.reduce((s,[a,b])=>s+b-a+1,0)});
 }
 const composite=read(path.join(dir,'composite.png')),merged=blank();for(const n of order)paste(merged,layers[n]);assert.ok(same(composite,merged),'layer assembly');assert.ok(same(read(path.join(dir,'composite_4x.png')),scale(composite,4)),'4x nearest');
 assert.deepEqual([composite.width,composite.height],[256,240]);assert.equal(bbox(composite)[3],223);assert.equal(bbox(composite,220,223)[0],105);
 const boot=ranges(composite,223)[0];assert.equal(boot[0],105);assert.ok(boot[1]-boot[0]+1>=8);
 let smear=0;for(let y=213;y<=223;y++)for(let x=0;x<150;x++)if(layers.katar.data[(y*256+x)*4+3])smear++;assert.equal(smear,0);
 let shinCloth=0;if(id==='attack_3_contact')for(let y=206;y<=223;y++)for(let x=104;x<=135;x++){const [r,g,b,a]=body.data.subarray((y*256+x)*4,(y*256+x)*4+4);if(a&&b>g&&g>=r)shinCloth++;}assert.equal(shinCloth,0);
 const meta=JSON.parse(fs.readFileSync(path.join(dir,'pose.json'))),oldMeta=JSON.parse(fs.readFileSync(path.join(old,'pose.json')));assert.deepEqual(meta.head,oldMeta.head);assert.deepEqual(meta.weapon,oldMeta.weapon);assert.deepEqual(meta.feet.near,oldMeta.feet.near);assert.deepEqual(meta.feet.opaqueRanges,ranges(composite,223));
 frames.push({id,bootRow223:boot,bootRows:[215,223],bootHeight:bootRows.length,bootRowWidths:bootRows,changedBodyPixels:changed,clothEndChangedPixels:clothChanges,changedOutsideBacklegAndClothEnds:outside,frontLegChangedPixels:frontLegChanges,upperBodyChangedPixels:upperBodyChanges,smearPixelsInForbiddenArea:smear,katarChangedPixels:0,protectedLayerChangedPixels:0,hip,hipToBootConnected:true,connectedRowWidths:connectedWidths,navyPixelsOnContactShinOrBoot:shinCloth});
}
const motion=['attack_1_wind_up','attack_2_apex','attack_5_swing','attack_3_contact','attack_4_recovery'];
const sheet=read(path.join(root,'keyposes_attack.png'));assert.deepEqual([sheet.width,sheet.height],[1536,240]);assert.ok(same(crop(sheet,0,0,256,240),ref));motion.forEach((id,j)=>assert.ok(same(crop(sheet,(j+1)*256,0,256,240),read(path.join(root,id,'composite.png')))));assert.ok(same(read(path.join(root,'keyposes_attack_4x.png')),scale(sheet,4)));
const pair=read(path.join(root,'side_by_side_attack.png')),oldNames=['1_wind_up','2_apex','5_swing','3_contact','4_recovery'];assert.deepEqual([pair.width,pair.height],[512,1200]);motion.forEach((id,j)=>{assert.ok(same(crop(pair,256,j*240,256,240),read(path.join(root,id,'composite.png'))));assert.ok(same(crop(pair,0,j*240,256,240),scale(read(path.resolve(root,'../../pixel-assassin-attack-keyposes/poses',oldNames[j],'composite.png')),2)));});
const tips=motion.map(id=>JSON.parse(fs.readFileSync(path.join(root,id,'pose.json'))).weapon.tipPoint[0]);assert.equal(tips[3],Math.max(...tips),'contact farthest actual blade tip');
const result={passed:true,frames,scope:{outsideUnchangedFiles:Object.keys(before.outside).length,insideUnchangedFiles:untouched,archivedOriginalFiles:archived},sheets:{playOrder:['idle',...motion],keyposes:[1536,240],keyposes4x:[6144,960],sideBySide:[512,1200],verifiedPixelForPixel:true},generated:ids.map(id=>id+'/sources/generated.png'),rejected:ids.map(id=>'rejected/'+id+'_backleg_previous/'),referenceImagesCopied:false};json('validation_backleg.json',result);console.log(JSON.stringify(result,null,2));
