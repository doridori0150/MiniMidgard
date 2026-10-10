import fs from 'node:fs';
import path from 'node:path';
import {root,order,ref,read,save,blank,bbox,paste,scale,crop,inside,hex,nearest,finish,ranges,json} from './work.mjs';

const id=process.argv[2];
const cfg=JSON.parse(fs.readFileSync(path.join(root,'walk_masks.json')))[id];
if(!cfg)throw Error('Unknown walk pose: '+id);
const palette=[...new Map(Array.from({length:ref.data.length/4},(_,i)=>i*4).filter(i=>ref.data[i+3]).map(i=>[ref.data.subarray(i,i+3).join(','),Array.from(ref.data.subarray(i,i+3))])).values()];
const hairPalette=['faf0d7','e1cdb8','b49b91','49342f'].map(hex);
const src=read(path.join(root,id,'sources/normalized.png'));
const layers=Object.fromEntries(order.map(n=>[n,blank()]));
for(let y=0;y<240;y++)for(let x=0;x<256;x++){
 const i=(y*256+x)*4;if(!src.data[i+3])continue;
 let n='body';
 if(inside(x+.5,y+.5,cfg.hair)&&!inside(x+.5,y+.5,cfg.face)&&!inside(x+.5,y+.5,cfg.ear))n=x<cfg.hairBackX&&y>cfg.hairBackY?'hair_back':'hair_front';
 if(inside(x+.5,y+.5,cfg.katar))n='katar';
 if(inside(x+.5,y+.5,cfg.gripMask))n='grip';
 const c=nearest(Array.from(src.data.subarray(i,i+3)),n.startsWith('hair')?hairPalette:palette);
 layers[n].data.set([...c,255],i);
}
// Remove isolated quantization speckles on the selected scalp only; keep outlines.
if(cfg.hairDenoise){
 for(let pass=0;pass<2;pass++)for(const n of ['hair_front','hair_back']){
  const src=layers[n],out={...src,data:Buffer.from(src.data)};
  for(let y=cfg.hair[0][1]+2;y<cfg.hairBackY;y++)for(let x=1;x<255;x++){
   const i=(y*256+x)*4;if(!src.data[i+3]||src.data[i]===73)continue;
   const counts=new Map();let total=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const j=((y+dy)*256+x+dx)*4;if(!src.data[j+3])continue;total++;
    const key=src.data.subarray(j,j+3).join(',');counts.set(key,(counts.get(key)||0)+1);
   }
   const best=[...counts].sort((a,b)=>b[1]-a[1])[0];
   if(total===9&&best[1]>=5&&best[0]!=='73,52,47')out.data.set(best[0].split(',').map(Number),i);
  }layers[n]=out;
 }
}
// Register whole drawing by head center, then normalize only head width.
let hb=bbox(paste(paste(blank(),layers.hair_back),layers.hair_front));
const dx=Math.round(128-(hb[0]+hb[2])/2);
for(const n of order)layers[n]=paste(blank(),layers[n],dx,0);
for(const k of ['grip','tip','head'])cfg[k][0]+=dx;
hb=hb.map((v,i)=>i%2===0?v+dx:v);
const hw=hb[2]-hb[0]+1;
if(hw!==55){
 for(const n of ['hair_back','hair_front','body']){
  const h=blank(),out=layers[n];
  for(let y=0;y<240;y++)for(let x=0;x<256;x++){
   const i=(y*256+x)*4;
   if(out.data[i+3]&&(n!=='body'||inside(x+.5-dx,y+.5,cfg.face)||inside(x+.5-dx,y+.5,cfg.ear))){h.data.set(out.data.subarray(i,i+4),i);out.data.fill(0,i,i+4);}
  }
  for(let y=0;y<240;y++)for(let x=101;x<=155;x++){
   const sx=hb[0]+Math.min(hw-1,Math.floor((x-101+.5)*hw/55));const si=(y*256+sx)*4;
   if(h.data[si+3])out.data.set(h.data.subarray(si,si+4),(y*256+x)*4);
  }
 }
}
// Recover silver edge pixels just outside the polygon without changing the composite.
const kb=bbox(layers.katar);
for(let y=kb[1]-3;y<=kb[3]+3;y++)for(let x=kb[0]-4;x<=kb[2]+4;x++){
 const i=(y*256+x)*4,c=Array.from(layers.body.data.subarray(i,i+3));
 if(layers.body.data[i+3]&&Math.min(...c)>105&&Math.max(...c)-Math.min(...c)<48){layers.katar.data.set(layers.body.data.subarray(i,i+4),i);layers.body.data.fill(0,i,i+4);}
}
// Small ankle registration tapers to zero at the knee; no frame translation.
let rr=ranges(layers.body,223);
if(!rr.length||rr.at(-1)[1]-rr[0][0]>22)throw Error(id+' must have only the support boot on row223: '+JSON.stringify(rr));
const measured=(rr[0][0]+rr.at(-1)[1])/2;
const footDx=Math.round(cfg.supportCenter-measured);
if(footDx){
 const a=layers.body,out=blank();
 for(let y=0;y<240;y++)for(let x=0;x<256;x++){
  const i=(y*256+x)*4;if(!a.data[i+3])continue;
  const selected=inside(x+.5-dx,y+.5,cfg.supportLeg);
  const tx=x+(selected?Math.round(footDx*Math.min(1,Math.max(0,(y-cfg.kneeY)/(cfg.ankleY-cfg.kneeY)))):0);
  out.data.set(a.data.subarray(i,i+4),(y*256+tx)*4);
 }layers.body=out;
}
cfg.normalization='내장 image_gen 생성; 최근접 단일 축소; 알파128 이진화; 승인 idle 팔레트; 머리 중심128 및 폭55 등록; 지지 무릎 아래 발 위치 미세 등록; 보이는 5레이어 분리';
cfg.notes='REQUEST_WALK_INBETWEENS.md 기준. 엔진 dx=dy=0. 생성 외형은 idle 재첨부, 동작은 승인 접지 참조. 가려진 면을 복원한 리그가 아닌 보이는 픽셀 분리.';
const meta=finish(id,layers,cfg);
const foot=ranges(read(path.join(root,id,'composite.png')),223);
const support=[foot[0][0],foot.at(-1)[1]];
meta.feet.near=cfg.support==='near'?support:null;
meta.feet.far=cfg.support==='far'?support:null;
meta.registration={headDx:dx,sourceHeadWidth:hw,footDx,targetSupportCenter:cfg.supportCenter,actualSupportCenter:(support[0]+support[1])/2};
meta.timing={ms:90,dx:0,dy:0};
json(id+'/pose.json',meta);
save(path.join(root,id,'sources/final_detail_6x.png'),scale(crop(read(path.join(root,id,'composite.png')),80,120,90,108),6));
console.log(JSON.stringify({id,head:meta.head,feet:meta.feet,registration:meta.registration}));
