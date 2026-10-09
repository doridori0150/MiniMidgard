import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {read,save,blank,bounds,transform,over} from './raster.mjs';

const R=path.dirname(new URL(import.meta.url).pathname),ROOT=path.resolve(R,'../../..');
const json=p=>JSON.parse(fs.readFileSync(path.join(R,p))),put=(p,o)=>fs.writeFileSync(path.join(R,p),JSON.stringify(o,null,2)+'\n');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(R+'/source/fix4',{recursive:true});
if(!fs.existsSync(R+'/source/fix4/game-manifest-before.json')){
  fs.copyFileSync(R+'/game-manifest.json',R+'/source/fix4/game-manifest-before.json');
  const files=new Set(Object.keys(json('source/fix3/before-hashes.json')));
  function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())scan(p);else files.add(path.relative(ROOT,p));}}
  for(const d of ['frames','masks','grips','equipment','rejected'])scan(R+'/'+d);
  put('source/fix4/before-hashes.json',Object.fromEntries([...files].filter(p=>fs.existsSync(path.join(ROOT,p))).map(p=>[p,sha(path.join(ROOT,p))])));
  for(const kind of ['frames','masks','grips'])for(const n of ['walk_1','walk_3']){const dest=`source/fix4/before/${kind}/swordsman`;fs.mkdirSync(R+'/'+dest,{recursive:true});fs.copyFileSync(`${R}/${kind}/swordsman/${n}.png`,`${R}/${dest}/${n}.png`);}
}
const M=json('source/fix4/game-manifest-before.json'),B=json('rejected/b/game-manifest.json'),updates=[];
const round=p=>p.map(x=>+x.toFixed(3));
function writeLayers(f,im,hair,grip){
  for(let q=0;q<hair.data.length;q+=4){hair.data[q+3]=255;if(im.data[q+3]<128)hair.data.set([0,0,0,255],q);}
  for(const [k,v]of [['image',im],['hairMask',hair],['gripOverlay',grip]])if(f[k]){fs.mkdirSync(path.dirname(R+'/'+f[k]),{recursive:true});save(R+'/'+f[k],v);}
}
function interp(v,knots){for(let i=1;i<knots.length;i++){const [a,b]=knots[i-1],[c,d]=knots[i];if(v<=c)return b+(d-b)*(v-a)/(c-a);}return knots.at(-1)[1];}
function rowWarp(im,knots,mask=false){
  const out=blank(512,400),inv=knots.map(([a,b])=>[b,a]);
  for(let y=0;y<400;y++){
    const sy=interp(y,inv),a=Math.floor(sy),t=sy-a;
    for(let x=0;x<512;x++){const q=(y*512+x)*4;if(mask){const yy=Math.round(sy);if(yy>=0&&yy<400)out.data.set(im.data.subarray((yy*512+x)*4,(yy*512+x)*4+4),q);continue;}
      let alpha=0,rgb=[0,0,0];for(const [yy,w]of [[a,1-t],[a+1,t]])if(yy>=0&&yy<400){const z=(yy*512+x)*4,aw=im.data[z+3]*w;alpha+=aw;for(let c=0;c<3;c++)rgb[c]+=im.data[z+c]*aw;}
      if(alpha){for(let c=0;c<3;c++)out.data[q+c]=Math.round(rgb[c]/alpha);out.data[q+3]=Math.round(alpha);}
    }
  }return out;
}
for(const [n,knots]of [
  ['walk_1',[[0,4],[170,174],[205,213],[230,235],[360,360],[400,400]]],
  ['walk_3',[[0,5],[170,175],[205,214],[230,238],[360,360],[400,400]]]
]){
  const rejected=M.fix3.unresolved.find(u=>u.frame===n&&u.id==='swordsman_male'),f=structuredClone(rejected.proposedFrame),p=`rejected/fix3/swordsman/${n}`;
  const im=rowWarp(read(R+'/'+p+'.png'),knots),hair=rowWarp(read(R+'/'+p+'-hair.png'),knots,true),grip=rowWarp(read(R+'/'+p+'-grip.png'),knots);
  for(const a of ['hand','crown','side'])f[a].point=round([f[a].point[0],interp(f[a].point[1],knots)]);
  f.source=p+'.png';f.uniform_scale=1;f.derivation={operation:'foot-locked continuous vertical registration',source:f.source,sourceYToOutputY:knots,originalGenerationSource:rejected.source};
  writeLayers(f,im,hair,grip);M.characters.swordsman_male.frames[n]=f;
  updates.push({id:'swordsman_male',frame:n,...f.derivation,anchors:Object.fromEntries(['hand','crown','side'].map(k=>[k,f[k]])),bounds:bounds(im,32)});
}
// Reuse original leg pixels, with independent trajectories and foreground ordering.
// Upper-body pixels, all attachment anchors, hair mask and grip remain byte-identical.
function alternateLegs(im,line){
  const donorPath=`rejected/b/frames/${line}/idle_0.png`,donor=read(R+'/'+donorPath);
  const thief=line==='thief';
  const hem=thief?[[0,291],[152,291],[158,298],[172,302],[184,299],[190,291],[260,291],[266,296],[512,296]]:[[0,292],[168,295],[194,301],[220,302],[248,299],[271,291],[512,291]];
  const srcPivots=thief?[[194,294],[244,294]]:[[194,300],[243,300]],dstPivots=thief?[[239,291],[206,291]]:[[238,300],[207,298]];
  const angles=thief?[-20,20]:[-20,20],layers=[];
  for(let i=0;i<2;i++){
    const leg=blank(512,400);
    for(let y=0;y<400;y++)for(let x=0;x<512;x++){
      const selected=thief?(i===0?x<220&&y>=(x<177?310:294):x>=220&&x<284&&y>=(x>268?310:294)):(i===0?x<220&&y>=298:x>=220&&y>=298);
      if(selected){const q=(y*512+x)*4;leg.data.set(donor.data.subarray(q,q+4),q);}
    }
    const r=angles[i]*Math.PI/180,c=Math.cos(r),s=Math.sin(r),[px,py]=srcPivots[i],[dx,dy]=dstPivots[i];
    const inv=[c,s,px-c*dx-s*dy,-s,c,py+s*dx-c*dy];
    let moved=transform(leg,512,400,inv);const b=bounds(moved,32),bottom=i===0?359:351,ys=(bottom-dy)/(b[3]-1-dy);
    moved=transform(moved,512,400,[1,0,0,0,1/ys,dy-dy/ys]);layers.push(moved);
  }
  const result=blank(512,400);over(result,layers[0]);over(result,layers[1]);
  for(let y=0;y<400;y++)for(let x=0;x<512;x++)if(y<=interp(x,hem)){const q=(y*512+x)*4;result.data.set(im.data.subarray(q,q+4),q);}
  return {result,detail:{operation:'idle_0 leg-only transplant, independently rotated at hips and grounded; far leg forward, near leg backward',attempt:2,donor:donorPath,sourcePivots:srcPivots,targetPivots:dstPivots,rotationDegrees:angles,legBottom:[360,352],hem,foreground:'near leg',upperBodyUnchanged:true}};
}
function scaleFrame(f,s,dy=0){
  const inv=[1/s,0,220-220/s,0,1/s,360-360/s-dy/s];
  const im=transform(read(R+'/'+f.image),512,400,inv),hair=transform(read(R+'/'+f.hairMask),512,400,inv,true),grip=transform(read(R+'/'+f.gripOverlay),512,400,inv);
  for(const a of ['hand','crown','side'])f[a].point=round([220+(f[a].point[0]-220)*s,360+(f[a].point[1]-360)*s+dy]);
  writeLayers(f,im,hair,grip);return bounds(im,16);
}
for(const [id,line]of [['thief_male','thief'],['merchant_female','merchant']]){
  const ch=structuredClone(B.characters[id]);M.characters[id]=ch;
  for(const f of Object.values(ch.frames)){
    for(const k of ['image','hairMask','gripOverlay'])if(f[k]){fs.mkdirSync(path.dirname(R+'/'+f[k]),{recursive:true});fs.copyFileSync(R+'/rejected/b/'+f[k],R+'/'+f[k]);}
    f.source=path.posix.normalize('rejected/b/'+f.source);
  }
  const f=ch.frames.walk_2,{result,detail}=alternateLegs(read(R+'/'+f.image),line);
  save(R+'/'+f.image,result);f.source='rejected/b/'+f.image;f.uniform_scale=1;f.derivation={...detail,source:f.source};updates.push({id,frame:'walk_2',...f.derivation});
  if(line==='thief'){
    const h=ch.frames.hurt_0,s=1.25;h.source='rejected/b/'+h.image;h.uniform_scale=s;h.derivation={operation:'uniform whole-figure enlargement about foot origin',scale:s,origin:[220,360],translation:[0,-0.6],note:'Subpixel raster registration; alpha>=16 occupied extent is y=110..359, foot baseline 360.'};
    updates.push({id,frame:'hurt_0',source:h.source,...h.derivation,bounds:scaleFrame(h,s,-0.6)});
    const a=ch.frames.attack_0,as=179/169;a.source='rejected/b/'+a.image;a.uniform_scale=as;a.derivation={operation:'uniform whole-figure head-width match to idle_0',scale:as,origin:[220,360],referenceHairWidth:179,candidateHairWidth:169};
    updates.push({id,frame:'attack_0',source:a.source,...a.derivation,bounds:scaleFrame(a,as)});
  }
}
M.fix4={request:'docs/art-requests/hero-sprites-fix4.md',status:'accepted_after_visual_review',visualReview:'verification/fix4-visual-review.json',unresolved:[],adopted:{swordsman_male:['walk_1','walk_3'],thief_male:Object.keys(B.characters.thief_male.frames),merchant_female:Object.keys(B.characters.merchant_female.frames)},updates,method:'Deterministic candidate processing and original-leg pixel compositing explicitly authorized by fix4; no image generation.'};
put('game-manifest.json',M);put('source/fix4/annotations.json',M.fix4);
const gen=json('generation.json');gen.fix4={...M.fix4,tool:'local raster.mjs processing',reference:'docs/art/concepts/round3/class_lineup.png',prompts:['swordsman_male-fix4-attempt1.txt','thief_male-fix4-attempt1.txt','thief_male-fix4-attempt2.txt','merchant_female-fix4-attempt1.txt','merchant_female-fix4-attempt2.txt'].map(p=>'prompts/'+p)};put('generation.json',gen);
for(const id of ['swordsman_male','thief_male','merchant_female'])fs.writeFileSync(`${R}/prompts/${id}-fix4-attempt${id==='swordsman_male'?1:2}.txt`,[
  '실제로 적용한 처리 지시 — 생성 모델 호출 없음.',
  '승인 외형 참조: docs/art/concepts/round3/class_lineup.png',
  '수정 4의 후보 채택 및 픽셀 처리·다리 합성 허용에 따라 fix4.mjs로 실행.',
  '머리·얼굴·몸 방향·무기 팔을 보존하고 캔버스 512x400, 원점 (220,360)을 유지.',
  JSON.stringify(updates.filter(u=>u.id===id),null,2)
].join('\n')+'\n');
gen.fix4.promptEvidence=gen.fix4.prompts.map(file=>({file,sha256:sha(R+'/'+file)}));
gen.fix4.sourceEvidence=[...new Set(updates.flatMap(u=>[u.source,u.donor].filter(Boolean)))].map(file=>({file,sha256:sha(R+'/'+file)}));
put('generation.json',gen);
console.log(JSON.stringify(updates,null,2));
