import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import{root,project,order,ref,read,blank,paste,scale,crop,bbox,ranges,json,preserve}from './work.mjs';
const motions={idle:['idle_1_breath_out'],walk:['walk_1_contact_near','walk_2_pass_near','walk_3_contact_far','walk_4_pass_far'],attack:['attack_1_wind_up','attack_2_apex','attack_5_swing','attack_3_contact','attack_4_recovery']};
const ids=Object.values(motions).flat(),rows=[];
const same=(a,b)=>a.width===b.width&&a.height===b.height&&Buffer.from(a.data).equals(Buffer.from(b.data));
const hairColors=new Set(['250,240,215','225,205,184','180,155,145','73,52,47']);
for(const id of ids){
 const dir=path.join(root,id),p=JSON.parse(fs.readFileSync(path.join(dir,'pose.json'))),a=read(path.join(dir,'composite.png')),layers=Object.fromEntries(order.map(n=>[n,read(path.join(dir,n+'.png'))]));
 assert.equal(a.width,256,id);assert.equal(a.height,240,id);let rebuilt=blank();
 for(const [n,im]of Object.entries(layers)){assert.equal(im.width,256);assert.equal(im.height,240);assert.ok(bbox(im),id+' empty '+n);for(let i=0;i<im.data.length;i+=4){assert.ok(im.data[i+3]===0||im.data[i+3]===255,id+' alpha');if(n.startsWith('hair')&&im.data[i+3])assert.ok(hairColors.has(im.data.subarray(i,i+3).join(',')),id+' hair palette');}paste(rebuilt,im);}
 assert.ok(same(a,rebuilt),id+' layers');assert.ok(same(scale(a,4),read(path.join(dir,'composite_4x.png'))),id+' 4x');
 const hb=bbox(paste(paste(blank(),layers.hair_back),layers.hair_front));assert.equal(hb[2]-hb[0]+1,55,id+' head');assert.equal(p.head.crownY,hb[1]);assert.equal(bbox(a)[3],223,id+' baseline');assert.deepEqual(p.feet.opaqueRanges,ranges(a,223));assert.equal(p.backFoot.rearmostX,bbox(a,220,223)[0]);
 for(const [n,pt]of [['grip',p.weapon.gripPoint],['katar',p.weapon.tipPoint]])assert.ok(layers[n].data[(pt[1]*256+pt[0])*4+3],id+' anchor '+n);
 if(id.startsWith('attack_')){assert.equal(p.backFoot.rearmostX,105);assert.ok(same(crop(a,100,216,25,8),crop(ref,100,216,25,8)),id+' back boot moved');assert.ok(p.feet.far&&p.feet.near,id+' both feet planted');}
 rows.push({id,crownY:p.head.crownY,headWidth:p.head.width,backFootX:p.backFoot.rearmostX,feet:p.feet,grip:p.weapon.gripPoint,tip:p.weapon.tipPoint});
}
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
const idle=read(path.join(root,'idle_1_breath_out/composite.png'));assert.ok(same(crop(idle,0,212,256,28),crop(ref,0,212,256,28)),'idle feet not exact');assert.equal(byId.idle_1_breath_out.crownY,130);
for(const n of ['hair_back','hair_front','katar','grip'])assert.ok(same(read(path.join(root,'idle_1_breath_out',n+'.png')),paste(blank(),read(path.resolve(root,'../idle',n+'.png')),0,2)),'idle '+n+' displacement');
assert.deepEqual(motions.walk.map(id=>byId[id].crownY),[130,127,130,127]);
for(const id of [motions.walk[0],motions.walk[2]]){const f=byId[id].feet;const distance=Math.abs((f.near[0]+f.near[1]-f.far[0]-f.far[1])/2);assert.ok(distance>=30&&distance<=36,id+' stride distance '+distance);}
const front=motions.attack.slice(1,4).map(id=>byId[id].feet.near);assert.ok(front[0][1]<front[1][1]&&front[1][1]<front[2][1],'apex swing contact front foot order');
assert.ok(motions.attack.filter(id=>id!=='attack_3_contact').every(id=>byId[id].tip[0]<byId.attack_3_contact.tip[0]),'contact tip not furthest');
for(const [motion,list]of Object.entries(motions)){const s=read(path.join(root,'keyposes_'+motion+'.png'));assert.equal(s.width,256*(list.length+1));assert.equal(s.height,240);assert.ok(same(crop(s,0,0,256,240),ref));list.forEach((id,j)=>assert.ok(same(crop(s,(j+1)*256,0,256,240),read(path.join(root,id,'composite.png')))));assert.ok(same(scale(s,4),read(path.join(root,'keyposes_'+motion+'_4x.png'))));}
const oldNames=['1_wind_up','2_apex','5_swing','3_contact','4_recovery'],pair=read(path.join(root,'side_by_side_attack.png'));assert.equal(pair.width,512);assert.equal(pair.height,1200);
motions.attack.forEach((id,j)=>{assert.ok(same(crop(pair,256,j*240,256,240),read(path.join(root,id,'composite.png'))));const old=read(path.resolve(root,'../../pixel-assassin-attack-keyposes/poses',oldNames[j],'composite.png'));assert.ok(same(crop(pair,0,j*240,256,240),scale(old,2)));});
assert.equal(fs.readFileSync(path.join(root,'REQUEST.md'),'utf8'),fs.readFileSync(path.join(project,'docs/art/requests/2026-10-10-assassin-96-keyposes.md'),'utf8'));
const before=JSON.parse(fs.readFileSync(path.join(root,'scope-before.json'))),after=preserve(),changed=Object.keys(before).filter(k=>before[k]!==after[k]),added=Object.keys(after).filter(k=>!(k in before));assert.deepEqual(changed,[],'outside files changed');assert.deepEqual(added,[],'outside files added');
json('validation.json',{passed:true,poseCount:ids.length,checks:['five nonempty layers; binary alpha; correct four hair colors','composite pixel equality and nearest 4x','head width55, baseline223, anchor pixels, actual foot ranges','idle feet and lower legs exact; head, katar and grip shifted2','walk crowns130/127/130/127, contact spacing30..36','all five attack back boots identical to SSOT and rear x105','apex to swing to contact front-foot advance; contact tip furthest','SSOT-first motion sheets and play-order attack; 48px x2 comparison','request verbatim and outside-scope SHA256 unchanged'],poses:rows,outsideScope:{checkedFiles:Object.keys(before).length,changed,added}});
console.log('PASS: '+ids.length+' poses; '+Object.keys(before).length+' outside files unchanged.');
