import fs from 'node:fs';import path from 'node:path';
import{root,project,order,ref,read,save,blank,bbox,paste,scale,crop,inside,hex,nearest,json,finish,ranges}from './work.mjs';
const palette=[...new Map(Array.from({length:ref.data.length/4},(_,i)=>i*4).filter(i=>ref.data[i+3]).map(i=>[ref.data.subarray(i,i+3).join(','),Array.from(ref.data.subarray(i,i+3))])).values()];
const hairPalette=['faf0d7','e1cdb8','b49b91','49342f'].map(hex);
const id=process.argv[2];
if(id==='idle_1_breath_out'){
 const layers=Object.fromEntries(order.map(n=>[n,blank()]));
 for(const n of order){const a=read(path.resolve(root,'../idle',n+'.png'));
  for(let y=0;y<240;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(!a.data[i+3])continue;let dy=0;
   if(n.startsWith('hair')||n==='grip'||n==='katar')dy=2;
   else if(y<183)dy=2; // head, neck and shoulders; legs and feet never move
   else if(y<188&&x<122)dy=1; // shoulder-to-elbow transition
   else if(x<112&&y>=190&&y<210)dy=1; // settle the two waist tails
   layers[n].data.set(a.data.subarray(i,i+4),((y+dy)*256+x)*4);
  }
 }
 const meta=finish(id,layers,{role:'breath_out',head:[133,162],grip:[127,195],tip:[140,203],nearFoot:[137,150],farFoot:[105,116],normalization:'SSOT integer pixel edit only; head/shoulder +2 y, katar/grip +2 y; settled cloth +1 y; legs/feet unchanged'});console.log(meta);process.exit();
}
const configs=JSON.parse(fs.readFileSync(path.join(root,'masks.json'),'utf8')),cfg=configs[id];if(!cfg)throw Error(id);
let a=read(path.join(root,id,'sources/normalized.png'));
if(cfg.shiftX){a=paste(blank(),a,cfg.shiftX,0);for(const k of ['hair','face','ear','katar','gripMask'])if(cfg[k])cfg[k]=cfg[k].map(([x,y])=>[x+cfg.shiftX,y]);for(const k of ['head','grip','tip'])cfg[k][0]+=cfg.shiftX;cfg.hairBackX+=cfg.shiftX;for(const k of ['nearFoot','farFoot'])if(cfg[k])cfg[k]=cfg[k].map(x=>x+cfg.shiftX);}
const layers=Object.fromEntries(order.map(n=>[n,blank()]));
for(let y=0;y<240;y++)for(let x=0;x<256;x++){
 const i=(y*256+x)*4;if(!a.data[i+3])continue;let n='body';const c=Array.from(a.data.subarray(i,i+3));
 if(inside(x+.5,y+.5,cfg.hair)&&!inside(x+.5,y+.5,cfg.face)&&!(cfg.ear&&inside(x+.5,y+.5,cfg.ear)))n=x<cfg.hairBackX&&y>cfg.hairBackY?'hair_back':'hair_front';
 if(inside(x+.5,y+.5,cfg.katar))n='katar';if(inside(x+.5,y+.5,cfg.gripMask))n='grip';
 const q=nearest(c,n.startsWith('hair')?hairPalette:palette);layers[n].data.set([...q,255],i);
}
// Pale blade/smear edge pixels just outside the hand-drawn polygon belong to katar too.
if(cfg.smear){for(let y=175;y<216;y++)for(let x=0;x<256;x++){
 const i=(y*256+x)*4,c=layers.body.data.subarray(i,i+4),ux=x-(cfg.shiftX??0);
 const region=cfg.role==='swing'?(y>=190||(ux>175&&y>=175)||(ux<120&&y>=178)):(ux>153&&y>=188&&y<=201);
 if(c[3]&&region&&Math.min(...c.subarray(0,3))>=95&&Math.max(...c.subarray(0,3))-Math.min(...c.subarray(0,3))<55){layers.katar.data.set(c,i);layers.body.data.fill(0,i,i+4);}
}}
// Match the authoritative 55px head width without scaling the torso or shrinking crouches.
const hb=bbox(paste(paste(blank(),layers.hair_back),layers.hair_front)),hw=hb[2]-hb[0]+1;
if(hw!==55){
 const left=Math.round((hb[0]+hb[2])/2-27),factor=55/hw;
 for(const n of ['hair_back','hair_front','body']){
  const h=blank(),out=layers[n];for(let y=0;y<240;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(!out.data[i+3])continue;const selected=n!=='body'||inside(x+.5,y+.5,cfg.face)||(cfg.ear&&inside(x+.5,y+.5,cfg.ear));if(selected){h.data.set(out.data.subarray(i,i+4),i);out.data.fill(0,i,i+4);}}
  for(let y=0;y<240;y++)for(let x=left;x<left+55;x++){const sx=hb[0]+Math.min(hw-1,Math.floor((x-left+.5)/factor)),si=(y*256+sx)*4;if(h.data[si+3])out.data.set(h.data.subarray(si,si+4),(y*256+x)*4);}
 }
 cfg.head[0]=left+Math.round((cfg.head[0]-hb[0])*factor);
}
if(cfg.erase){for(const poly of cfg.erase)for(let y=0;y<240;y++)for(let x=0;x<256;x++)if(inside(x+.5-(cfg.shiftX??0),y+.5,poly))layers.body.data.fill(0,(y*256+x)*4,(y*256+x)*4+4);}
if(cfg.walkFrontShift){const src=layers.body,out=blank();for(let y=0;y<240;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(!src.data[i+3])continue;const dx=x>=128&&y>=198?Math.round(cfg.walkFrontShift*Math.min(1,(y-198)/18)):0;out.data.set(src.data.subarray(i,i+4),(y*256+x+dx)*4);}layers.body=out;}
if(cfg.lungeX){
 for(const n of order){const src=layers[n],out=blank();for(let y=0;y<240;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(!src.data[i+3])continue;const dx=n==='body'&&x<140&&y>200?Math.round(cfg.lungeX*Math.max(0,(217-y)/17)):cfg.lungeX;out.data.set(src.data.subarray(i,i+4),(y*256+x+dx)*4);}layers[n]=out;}
 for(const k of ['head','grip','tip'])cfg[k][0]+=cfg.lungeX;if(cfg.nearFoot)cfg.nearFoot=cfg.nearFoot.map(x=>x+cfg.lungeX);
}
// Stable, identical back boot for all attack keys. The rear calf stays articulated above it.
if(id.startsWith('attack_')){
 const body=layers.body;for(let y=216;y<=223;y++)for(let x=80;x<140;x++)body.data.fill(0,(y*256+x)*4,(y*256+x)*4+4);
 for(let y=216;y<=223;y++)for(let x=100;x<125;x++){const i=(y*256+x)*4;if(ref.data[i+3])body.data.set(ref.data.subarray(i,i+4),i);}
 if(id==='attack_1_wind_up'){const boot=blank();for(let y=209;y<=223;y++)for(let x=150;x<200;x++){const i=(y*256+x)*4;if(body.data[i+3]){boot.data.set(body.data.subarray(i,i+4),((y+1)*256+x)*4);body.data.fill(0,i,i+4);}}paste(body,boot);}
}
// Final single-pixel dark outlines adjacent to the silver smear/hand.
const boundaryMoves=id==='attack_5_swing'?{katar:[[96,183]]}:id==='attack_3_contact'?{grip:[[198,189]],katar:[[214,198],[215,198],[216,198],[200,200],[201,200],[202,200],[203,200],[204,200],[205,200]]}:{};
for(const [n,points]of Object.entries(boundaryMoves))for(const [x,y]of points){const i=(y*256+x)*4;if(layers.body.data[i+3]){layers[n].data.set(layers.body.data.subarray(i,i+4),i);layers.body.data.fill(0,i,i+4);}}
const meta=finish(id,layers,cfg);console.log(JSON.stringify(meta));
