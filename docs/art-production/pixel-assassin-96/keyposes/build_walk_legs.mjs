import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {root,order,ref,read,save,blank,bbox,paste,scale,crop,inside,nearest,ranges,json} from './work.mjs';
const id=process.argv[2],source=process.argv[3];
const configs={
 walk_5_down_near:{target:134,side:'near',mask:[[119,195],[143,195],[146,198],[154,202],[164,210],[164,224],[99,224],[99,211],[112,207],[116,202],[119,198]],knee:205},
 walk_2_pass_near:{target:125,side:'near',mask:[[119,195],[144,195],[160,205],[165,224],[103,224],[103,211],[115,205]],knee:204},
 walk_6_up_near:{target:117,side:'near',mask:[[119,193],[143,193],[163,206],[167,224],[99,224],[99,210],[115,204]],knee:201},
 walk_7_down_far:{target:132,side:'far',mask:[[119,198],[143,198],[161,209],[165,224],[98,224],[98,213],[113,207]],knee:206},
 walk_4_pass_far:{target:125,side:'far',mask:[[120,195],[141,195],[164,207],[165,224],[103,224],[103,213],[119,205]],knee:204},
 walk_8_up_far:{target:118,side:'far',mask:[[119,192],[140,192],[162,204],[167,224],[99,224],[99,208],[115,201]],knee:201}
};
const c=configs[id];assert.ok(c,'unknown pose');const old=path.join(root,'rejected/walk_legs_previous',id),dir=path.join(root,id);fs.mkdirSync(path.join(dir,'sources'),{recursive:true});
fs.copyFileSync(source,path.join(dir,'sources/generated.png'));
const original=read(path.join(old,'composite.png')),meta=JSON.parse(fs.readFileSync(path.join(old,'pose.json')));
const src=read(source);for(let i=3;i<src.data.length;i+=4)src.data[i]=src.data[i]>=160?255:0;
const b=bbox(src),f=(224-meta.head.crownY)/(b[3]-b[1]+1),hb=bbox(src,b[1],Math.floor(b[1]+(b[3]-b[1])*.4));
const headCenter=(hb[0]+hb[2])/2,normalized=blank();
const palette=[...new Map(Array.from({length:ref.data.length/4},(_,i)=>i*4).filter(i=>ref.data[i+3]).map(i=>[ref.data.subarray(i,i+3).join(','),Array.from(ref.data.subarray(i,i+3))])).values()];
for(let y=meta.head.crownY;y<224;y++)for(let x=80;x<175;x++){
 const sx=Math.round(headCenter+(x-128)/f),sy=Math.min(b[3],Math.floor(b[1]+(y-meta.head.crownY+.5)/f));const j=(sy*src.width+sx)*4;
 if(src.data[j+3])normalized.data.set([...nearest(Array.from(src.data.subarray(j,j+3)),palette),255],(y*256+x)*4);
}
// Pixel-centre registration affects only the newly drawn planted leg below the knee.
const rr=ranges(normalized,223);assert.ok(rr.length);const measured=(rr[0][0]+rr.at(-1)[1])/2,dx=Math.round(c.target-measured),registered=blank();
for(let y=190;y<224;y++)for(let x=80;x<175;x++){
 const j=(y*256+x)*4;if(!normalized.data[j+3])continue;
 const support=y>=215 || (id.includes('down')?x>=125:x<=134);
 const shift=support?Math.round(dx*Math.min(1,Math.max(0,(y-c.knee)/(218-c.knee)))):0;
 registered.data.set(normalized.data.subarray(j,j+4),(y*256+x+shift)*4);
}
const layers=Object.fromEntries(order.map(n=>[n,read(path.join(old,n+'.png'))]));const mask=blank(),clothMask=blank();
// Preserve existing navy tails including their 1px outlines and brass tip neighbours.
const oldBody=layers.body;
for(let y=187;y<=211;y++)for(let x=90;x<=120;x++){
 const i=(y*256+x)*4,[r,g,b,a]=oldBody.data.subarray(i,i+4);
 if(a&&b>g&&g>=r)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)clothMask.data.set([255,255,255,255],((y+dy)*256+x+dx)*4);
}
const panels={walk_6_up_near:[[128,192],[134,192],[134,200],[131,202],[127,201]],walk_7_down_far:[[129,198],[135,198],[135,207],[132,210],[128,209]]};
if(panels[id])for(let y=190;y<=211;y++)for(let x=125;x<=136;x++)if(inside(x+.5,y+.5,panels[id]))clothMask.data.set([255,255,255,255],(y*256+x)*4);

for(let y=0;y<240;y++)for(let x=0;x<256;x++)if(inside(x+.5,y+.5,c.mask)&&!clothMask.data[(y*256+x)*4+3]){
 const i=(y*256+x)*4;mask.data.set([255,255,255,255],i);layers.body.data.set(registered.data.subarray(i,i+4),i);
}
let merged=blank();for(const n of order)paste(merged,layers[n]);
let foot=ranges(merged,223),center=(foot[0][0]+foot.at(-1)[1])/2;
// Odd sole width gives an exact integer centre; extend a single edge outline if needed.
if(center!==c.target){assert.equal(Math.abs(center-c.target),.5);const x=center<c.target?foot.at(-1)[1]+1:foot[0][0]-1,from=center<c.target?x-1:x+1;layers.body.data.set(layers.body.data.subarray((223*256+from)*4,(223*256+from)*4+4),(223*256+x)*4);merged=blank();for(const n of order)paste(merged,layers[n]);}
foot=ranges(merged,223);center=(foot[0][0]+foot.at(-1)[1])/2;assert.equal(center,c.target);
for(const n of order){if(n!=='body')fs.copyFileSync(path.join(old,n+'.png'),path.join(dir,n+'.png'));else save(path.join(dir,n+'.png'),layers[n]);}
save(path.join(dir,'composite.png'),merged);save(path.join(dir,'composite_4x.png'),scale(merged,4));save(path.join(dir,'sources/normalized.png'),normalized);save(path.join(dir,'sources/leg_edit_mask.png'),mask);save(path.join(dir,'sources/protected_cloth_mask.png'),clothMask);save(path.join(dir,'sources/final_detail_6x.png'),scale(crop(merged,80,120,96,108),6));
meta.feet={...meta.feet,opaqueRanges:foot,near:c.side==='near'?[foot[0][0],foot.at(-1)[1]]:null,far:c.side==='far'?[foot[0][0],foot.at(-1)[1]]:null};meta.bounds=bbox(merged);meta.backFoot.rearmostX=bbox(merged,220,223)[0];
meta.registration={targetSupportCenter:c.target,actualSupportCenter:center,sourceSupportCenter:measured,legFootDx:dx};meta.normalization='내장 image_gen 다리 재묘사; 최근접 축소; 승인 idle 팔레트; 다리 마스크 합성; 상체 및 나머지 4개 레이어 원본 보존';meta.notes='REQUEST_WALK_LEGS.md 기준. 접지 y223. 골반 위/머리/얼굴/상체/팔/카타르/천 원본 픽셀 보존. 생성 소스의 상체는 사용하지 않음.';
json(id+'/pose.json',meta);json(id+'/sources/normalization.json',{sourceCanvas:[src.width,src.height],bounds:b,scale:f,headCenter,alphaThreshold:160,mask:c.mask,dx,measured,target:c.target});
let changed=0,protectedChanged=0;for(let i=0;i<merged.data.length;i+=4)if(!merged.data.subarray(i,i+4).equals(original.data.subarray(i,i+4))){changed++;if(!mask.data[i+3])protectedChanged++;}assert.equal(protectedChanged,0);console.log(JSON.stringify({id,center,crown:meta.head.crownY,changed,protectedChanged}));
