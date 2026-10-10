import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {root,read,blank,paste,scale,bbox} from './prepare.mjs';
const dir=path.join(root,'poses/5_swing');
const meta=JSON.parse(fs.readFileSync(path.join(dir,'pose.json')));
const approved=JSON.parse(fs.readFileSync(path.join(root,'poses/2_apex/pose.json')));
assert.deepEqual(Object.keys(meta).sort(),Object.keys(approved).sort());
assert.equal(meta.role,'swing');assert.equal(meta.weapon.smear,true);
assert.deepEqual(meta.canvas,[128,120]);assert.deepEqual(meta.origin,[64,112]);
const layers=Object.fromEntries(meta.layerOrder.map(n=>[n,read(path.join(dir,n+'.png'))]));
const composite=read(path.join(dir,'composite.png')),composed=blank();
const colorSet=a=>{const s=new Set();for(let i=0;i<a.data.length;i+=4)if(a.data[i+3])s.add(Buffer.from(a.data.slice(i,i+3)).toString('hex'));return s;};
const palette=colorSet(read(path.resolve(root,'../../art/ssot/look_assassin_idle0_1x.png')));
const hairSet=new Set(['faf0d7','e1cdb8','b49b91','49342f']);
for(const [n,a] of Object.entries(layers)){
 assert.equal(a.width,128);assert.equal(a.height,120);assert.ok(bbox(a));
 for(let i=3;i<a.data.length;i+=4)assert.ok(a.data[i]===0||a.data[i]===255);
 for(const c of colorSet(a))assert.ok((n.startsWith('hair')?hairSet:palette).has(c),n+': '+c);
 paste(composed,a);
}
assert.ok(Buffer.from(composed.data).equals(Buffer.from(composite.data)));
const enlarged=read(path.join(dir,'composite_4x.png'));
assert.equal(enlarged.width,512);assert.equal(enlarged.height,480);assert.ok(Buffer.from(enlarged.data).equals(Buffer.from(scale(composite,4).data)));
const hair=blank();paste(hair,layers.hair_back);paste(hair,layers.hair_front);
const hb=bbox(hair),cb=bbox(composite),height=cb[3]-cb[1]+1;
assert.ok(hb[2]-hb[0]+1<=30);assert.ok(height>=41&&height<=44);assert.equal(cb[3],111);
const xs=(a,y)=>Array.from({length:128},(_,x)=>x).filter(x=>a.data[(y*128+x)*4+3]);
const footRows=Object.fromEntries([108,109,110,111].map(y=>[y,xs(layers.body,y)]));
const rear=Math.min(...Object.values(footRows).flat());assert.equal(rear,52);
const front=xs(layers.body,111).filter(x=>x>64);assert.ok(front.length);
// 첨부 원본의 전방 발끝: apex x82, contact x80 (contact 앞발 최하단 y110).
const endpointToe=(name)=>{const a=read(path.join(root,'poses',name,'body.png'));return Math.max(...[108,109,110,111].flatMap(y=>xs(a,y).filter(x=>x>64)));};
const apexToe=endpointToe('2_apex'),contactToe=endpointToe('3_contact'),swingToe=Math.max(...front);
assert.ok(swingToe>=Math.min(apexToe,contactToe)&&swingToe<=Math.max(apexToe,contactToe));
for(const [n,p] of [['grip',meta.weapon.gripPoint],['katar',meta.weapon.tipPoint]])assert.equal(layers[n].data[(p[1]*128+p[0])*4+3],255);
// 잔상의 양끝과 아래쪽 곡선은 무기에 있고 몸에는 없다.
const trailPoints=[[46,96],[95,93],[75,105],[95,104]];
for(const [x,y] of trailPoints){assert.equal(layers.katar.data[(y*128+x)*4+3],255);assert.equal(layers.body.data[(y*128+x)*4+3],0);}
const hashes=JSON.parse(fs.readFileSync(path.join(root,'swing-preservation.json')));
for(const [p,h] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),h,p+' changed');
assert.equal(fs.readFileSync(path.join(root,'SWING_REQUEST.md'),'utf8'),fs.readFileSync(path.resolve(root,'../../art/requests/2026-10-10-assassin-attack-swing.md'),'utf8'));
const report={passed:true,role:meta.role,slot:'between:1>2',canvas:meta.canvas,origin:meta.origin,bounds:cb,height,headWidth:hb[2]-hb[0]+1,rearFootMinX:rear,footRows,frontFoot:{row:111,x:front,toe:swingToe,apexToe,contactToe,comparison:'attached native pose coordinates; assembly remains unchanged'},binaryAlpha:true,paletteMatch:true,hairFourColors:true,compositeMatchesLayers:true,nearest4x:true,smearLayer:'katar',preservedFileCount:Object.keys(hashes).length,animationAssembled:false};
fs.writeFileSync(path.join(root,'swing-validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
