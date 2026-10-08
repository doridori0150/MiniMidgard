import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {read,save,blank,crop,bounds,components,clean,transform} from './raster.mjs';
const R=path.dirname(new URL(import.meta.url).pathname),ROOT=path.resolve(R,'../../..');
const put=(p,o)=>{fs.mkdirSync(path.dirname(path.join(R,p)),{recursive:true});fs.writeFileSync(path.join(R,p),JSON.stringify(o,null,2)+'\n');};
const png=(p,im)=>{fs.mkdirSync(path.dirname(path.join(R,p)),{recursive:true});save(path.join(R,p),im);};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const master=JSON.parse(fs.readFileSync(path.join(ROOT,'src/assets/sprites/manifest.json')));
const M={...master,characters:{},weapons:{},headgear:structuredClone(master.headgear),hairTints:{...master.hairTints,brown:[0.52,0.32,0.18],black:[0.16,0.15,0.18],pink:[1,0.55,0.76]}};
const names=Object.values(M.animations).flatMap(a=>a.frames);
// Source-pixel annotations, made against the original generated full figures.
// [hand x,y, crown x,y, temple x,y, head angle]. Every transform uses the same sheet scale.
const A={
 mage:[
 [230,231,185,50,236,107,0],[583,232,540,51,593,109,0],
 [953,219,895,51,949,108,0],[1295,219,1250,53,1303,110,0],
 [181,505,194,337,247,391,-3],[596,501,538,338,591,393,0],
 [826,469,885,337,941,391,-7],[1327,468,1244,343,1298,395,4],
 [242,768,181,619,235,674,0],[625,738,541,620,594,677,0],
 [970,747,880,620,937,676,0],[1290,815,1237,660,1290,715,0],
 [240,995,154,886,216,925,-20],[548,1072,661,990,651,1058,75]],
 acolyte:[
 [234,225,185,32,240,91,0],[579,231,532,36,587,94,0],
 [955,210,894,39,950,95,0],[1316,207,1253,39,1310,97,0],
 [241,488,183,311,241,372,0],[594,495,535,316,592,373,0],
 [800,412,894,315,951,370,-5],[1344,449,1242,315,1300,372,0],
 [243,759,180,587,237,645,0],[622,710,526,587,583,645,0],
 [914,743,886,587,941,645,0],[1295,803,1251,628,1305,686,0],
 [224,995,191,855,247,912,-12],[544,1052,668,982,652,1042,70]],
 archer:[
 [277,234,219,52,276,107,0],[573,239,518,58,575,113,0],
 [928,216,859,51,915,106,0],[1262,225,1201,55,1258,111,0],
 [273,515,216,342,272,396,0],[548,511,520,340,578,394,0],
 [959,474,856,343,914,399,-3],[1300,473,1196,344,1255,400,0],
 [287,763,206,618,265,674,0],[615,744,515,615,572,670,0],
 [969,741,859,618,917,674,0],[1245,814,1217,661,1273,713,0],
 [214,1017,202,881,260,935,-15],[571,1061,668,982,649,1042,73]]};
// Absolute hair regions exclude the robe and arrows; cream-vs-skin colour
// segmentation is applied only inside these explicitly audited head regions.
const headBottom={mage:[182,184,184,185,471,472,475,477,752,751,752,790,1020,1090],acolyte:[169,172,172,174,448,451,450,450,724,725,724,756,988,1071],archer:[180,184,181,183,466,465,467,468,743,741,743,777,1000,1070]};
const palette=[[59,38,24],[254,240,220],[238,211,177],[255,213,171],[232,179,132],[117,77,48],[157,108,67],[98,62,40],[110,64,139],[82,46,113],[248,191,83],[224,157,63],[40,111,191],[23,74,141],[251,244,227],[224,212,190],[53,111,64],[37,80,45],[188,163,100],[142,124,75],[66,62,46],[207,208,199],[172,174,166]];
const nearest=(r,g,b)=>palette.reduce((best,c)=>{let d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;return d<best[0]?[d,c]:best;},[Infinity,null])[1];
const records=[],transforms={};
for(const [line,gender,weapon] of [['mage','female','staff'],['acolyte','female','mace'],['archer','male','bow']]){
 const sheet=read(path.join(R,`source/${line}.png`));
 const cs=components(sheet).filter(c=>c.pts.length>10000).sort((a,b)=>Math.floor((a.box[1]+50)/290)-Math.floor((b.box[1]+50)/290)||a.box[0]-b.box[0]);
 if(cs.length!==14)throw Error(`${line}: ${cs.length} figures`);
 // Use idle_0 body height only once; every pose keeps this exact scale.
 const scale=310/(cs[0].box[3]-cs[0].box[1]);
 const char={class:line,gender,defaultWeapon:weapon,defaultHairTint:'cream',frames:{}};
 M.characters[`${line}_${gender}`]=char;transforms[line]=[];
 for(let i=0;i<14;i++){
  const name=names[i],b=cs[i].box,rect=[Math.max(0,b[0]-3),Math.max(0,b[1]-3),Math.min(sheet.width,b[2]+3),Math.min(sheet.height,b[3]+3)];
  let im=clean(crop(sheet,rect)),hair=blank(im.width,im.height,[0,0,0,255]);
  const original=im.data.slice();
  // Smooth subpixel generator grain without changing the silhouette.
  for(let y=1;y<im.height-1;y++)for(let x=1;x<im.width-1;x++)for(let k=0;k<3;k++){
   let v=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)v.push(original[((y+dy)*im.width+x+dx)*4+k]);v.sort((a,b)=>a-b);im.data[(y*im.width+x)*4+k]=v[4];
  }
  const a=A[line][i],headX=i===13?[line==='mage'?526:line==='acolyte'?528:530,b[2]]:[b[0],b[2]];
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
   const q=(y*im.width+x)*4,[r,g,bb,alpha]=im.data.subarray(q,q+4),gx=x+rect[0],gy=y+rect[1];
   if(alpha<32)continue;
   const isHair=gy<headBottom[line][i]&&gx>=headX[0]&&gx<headX[1]&&r>190&&g>190&&bb>160&&r-g<34&&g-bb<48;
   if(isHair)hair.data.set([255,255,255,255],q);
  }
  // Retain cream regions belonging to the connected hair silhouette, not
  // isolated light skin pixels or the raised fist beside the head.
  const hc=components(hair,(r,g,b)=>r>127),keep=new Uint8Array(im.width*im.height);
  for(const c of hc){const cx=(c.box[0]+c.box[2])/2+rect[0];if(c.pts.length>500||(c.pts.length>45&&cx<a[2]-12&&i!==13))for(const p of c.pts)keep[p]=1;}
  // Grow selected hair regions to their continuous material boundary. This
  // includes warm hair shadows without leaving cream flecks under black tint.
  const broad=components(im,(r,g,b,alpha,x,y)=>alpha>127&&y+rect[1]<headBottom[line][i]&&x+rect[0]>=headX[0]&&x+rect[0]<headX[1]&&r>145&&g>125&&b>85&&r-g<80&&g-b<75);
  for(const c of broad){const overlap=c.pts.reduce((n,p)=>n+keep[p],0);if(overlap>Math.max(15,c.pts.length*0.15))for(const p of c.pts)keep[p]=1;}
  for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){
   const p=y*im.width+x,q=p*4,[r,g,b,alpha]=im.data.subarray(q,q+4);hair.data.set(keep[p]?[255,255,255,255]:[0,0,0,255],q);
   if(alpha<32)continue;
   if(keep[p]){im.data.set(g>219?[254,240,220]:[238,211,177],q);continue;}
   let spread=0;
   if(x>0&&y>0&&x<im.width-1&&y<im.height-1)for(let k=0;k<3;k++){let lo=255,hi=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let v=original[((y+dy)*im.width+x+dx)*4+k];lo=Math.min(lo,v);hi=Math.max(hi,v);}spread=Math.max(spread,hi-lo);}
   // Boundary pixels retain antialiasing. Interior skin uses its material
   // class so a pale cheek cannot quantize into a cream hair colour.
   if(spread<35){if(r>225&&g>190&&b>145&&b<219&&r-g>23)im.data.set([255,213,171],q);else im.data.set(nearest(r,g,b),q);}
  }
  const bb=bounds(im,32),band=Math.round((bb[3]-bb[1])*0.12);let min=im.width,max=0;
  for(let y=bb[3]-band;y<bb[3];y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>=32){min=Math.min(min,x);max=Math.max(max,x+1);}
  const fx=(min+max)/2,tx=220-fx*scale,ty=360-bb[3]*scale;
  const inv=[1/scale,0,-tx/scale,0,1/scale,-ty/scale];
  let figure=transform(im,512,400,inv),mask=transform(hair,512,400,inv,true);
  for(let p=0;p<512*400;p++){const q=p*4;if(figure.data[q+3]<128||figure.data[q]<200||figure.data[q+1]<180||figure.data[q+2]<140)mask.data.set([0,0,0,255],q);else mask.data[q+3]=255;}
  const point=(x,y)=>[+(tx+(x-rect[0])*scale).toFixed(3),+(ty+(y-rect[1])*scale).toFixed(3)];
  const hand=point(a[0],a[1]),crown=point(a[2],a[3]),side=point(a[4],a[5]);
  const angle=line==='archer'?0:(name==='attack_1'?0:name==='attack_0'?-115:name==='attack_2'?-25:-48);
  const f={image:`frames/${line}/${name}.png`,hairMask:`masks/${line}/${name}.png`,hand:{point:hand,angle,z:'front',visible:!['cast','sit','dead'].some(s=>name.startsWith(s))},crown:{point:crown,angle:a[6]},side:{point:side,angle:a[6]},gripOverlay:`grips/${line}/${name}.png`,source:`source/${line}.png`,uniform_scale:scale};
  const grip=blank(512,400),rad=9*scale;
  for(let y=Math.max(0,Math.floor(hand[1]-rad));y<Math.min(400,hand[1]+rad);y++)for(let x=Math.max(0,Math.floor(hand[0]-rad));x<Math.min(512,hand[0]+rad);x++)if(((x-hand[0])/rad)**2+((y-hand[1])/rad)**2<=1){let q=(y*512+x)*4;grip.data.set(figure.data.subarray(q,q+4),q);}
  png(f.image,figure);png(f.hairMask,mask);png(f.gripOverlay,grip);char.frames[name]=f;
  transforms[line].push({frame:name,sourceRect:rect,sourceBounds:b,scale,translation:[tx,ty],sourceAnnotations:a,headRegion:[...headX,headBottom[line][i]],footBand:band});
 }
 // A 2px whole-figure breathing deformation keeps the identity exactly stable.
 // This is explicitly recorded separately from source-to-canvas uniform scale.
 const base=char.frames.idle_0,idle=structuredClone(base),k=308/310;
 for(const field of ['image','hairMask','gripOverlay']){
  idle[field]=base[field].replace('idle_0','idle_1');
  const src=read(path.join(R,base[field]));png(idle[field],transform(src,512,400,[1,0,0,0,1/k,360-360/k],field==='hairMask'));
 }
 for(const anchor of ['hand','crown','side'])idle[anchor].point[1]=+(360+(idle[anchor].point[1]-360)*k).toFixed(3);
  idle.derivation={frame:'idle_0',operation:'whole-figure foot-locked breathing',topDisplacementPx:2,verticalFactor:k};char.frames.idle_1=idle;
  transforms[line][1]={...transforms[line][0],frame:'idle_1',derivation:idle.derivation,unusedGeneratedIdle1:transforms[line][1]};
 records.push({id:`${line}_${gender}`,source:`source/${line}.png`,source_sha256:hash(path.join(R,`source/${line}.png`)),uniform_scale:scale,frames:14,prompt:`prompts/${line}_${gender}-hero-attempt-01.txt`,tool:'built-in image_gen',attempt:1,idle1Derivation:idle.derivation});
}
// Keep equipment at the same natural 310px character scale. The shaft's
// grip-to-head axis is +X, making hand.angle=0 a horizontal contact.
for(const [id,piv,head,scale] of [['staff',[505,872],[837,482],0.175],['mace',[480,827],[818,481],0.12],['bow',[729,668],[900,668],0.15]]){
 let im=clean(read(path.join(R,`source/${id}.png`)));
 // Remove subtle generated gradients while retaining alpha and edge sampling.
 const wp=id==='staff'?[[60,38,22],[160,109,66],[126,81,47],[63,189,245],[37,151,216],[207,244,255]]:id==='mace'?[[60,38,22],[158,112,70],[119,80,46],[229,231,233],[178,185,195],[57,127,209]]:[[60,38,22],[184,126,76],[148,96,52],[250,242,217]];
 for(let q=0;q<im.data.length;q+=4){if(!im.data[q+3])continue;let c=wp.reduce((best,c)=>{let d=c.reduce((d,v,k)=>d+(v-im.data[q+k])**2,0);return d<best[0]?[d,c]:best},[Infinity,null])[1];im.data.set(c,q);}
 const theta=Math.atan2(head[1]-piv[1],head[0]-piv[0]),c=Math.cos(theta),s=Math.sin(theta),dest=id==='bow'?[140,128]:[55,128];
 // inverse of rotation(-theta) * uniformScale, pivot -> dest
 const inv=[c/scale,-s/scale,piv[0]-(c*dest[0]-s*dest[1])/scale,s/scale,c/scale,piv[1]-(s*dest[0]+c*dest[1])/scale];
 const out=transform(im,256,256,inv);png(`equipment/${id}.png`,out);
 M.weapons[id]={image:`equipment/${id}.png`,pivot:dest,tip:[+(dest[0]+Math.hypot(head[0]-piv[0],head[1]-piv[1])*scale).toFixed(3),dest[1]]};
 records.push({id,source:`source/${id}.png`,source_sha256:hash(path.join(R,`source/${id}.png`)),uniform_scale:scale,sourcePivot:piv,sourceHead:head,rotationDegrees:-theta*180/Math.PI,prompt:`prompts/${id}-weapon-attempt-${id==='bow'?'01':'02'}.txt`,tool:'built-in image_gen',attempt:id==='bow'?1:2});
}
for(const v of Object.values(M.headgear)){fs.copyFileSync(path.join(ROOT,'src/assets/sprites',v.image),path.join(R,v.image));}
put('game-manifest.json',M);put('source/annotations.json',transforms);
put('generation.json',{date:'2026-10-09',tool:'built-in image_gen',references:['docs/art/concepts/round3/class_lineup.png','src/assets/sprites/frames/novice/idle_0.png','src/assets/sprites/frames/swordsman/idle_0.png'],sources:records,rejected:[{source:'source/staff-rejected.png',prompt:'prompts/staff-weapon-attempt-01.txt',reason:'Unapproved gold ring; regenerated against original lineup.'},{source:'source/mace-rejected.png',prompt:'prompts/mace-weapon-attempt-01.txt',reason:'Pointed priest-like petals; regenerated rounded acolyte petals against original lineup.'}],processing:'Whole-figure crop, detached-speck removal, limited flat palette with preserved colour-boundary antialiasing, one uniform scale per original character sheet, foot grounding, source-space anchor transform, aligned connected hair segmentation and source-pixel grip overlay. No head/body assembly. Idle_1 is an explicitly recorded 2px whole-figure breathing deformation of idle_0. Bow grip colours flattened to approved wood palette.',environment:'Node PNG codec; no Python dependencies required.'});
console.log('Built 42 whole figures, 42 masks, 42 grips and 3 weapons.');
