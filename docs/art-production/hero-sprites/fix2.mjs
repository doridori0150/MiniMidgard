import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {read,save,blank,crop,bounds,components,clean,transform} from './raster.mjs';
const R=path.dirname(new URL(import.meta.url).pathname), ROOT=path.resolve(R,'../../..'), src=path.join(ROOT,'src/assets/sprites');
const json=p=>JSON.parse(fs.readFileSync(p));const put=(p,o)=>fs.writeFileSync(path.join(R,p),JSON.stringify(o,null,2)+'\n');const png=(p,im)=>{fs.mkdirSync(path.dirname(path.join(R,p)),{recursive:true});save(path.join(R,p),im)};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const M=json(path.join(R,'source/fix2/game-manifest-before.json')),updates=[];
const source=read(path.join(R,'source/fix2/archer-attempt1.png')),box=bounds(source,32);
const jobs=[{line:'archer',source:'archer-attempt1',scale:303/(box[3]-box[1]),single:true,frames:[['walk_3',0,[904,732,709,179,877,370],0]]}];
const palette=[[59,38,24],[254,240,220],[238,211,177],[255,213,171],[232,179,132],[117,77,48],[157,108,67],[98,62,40],[110,64,139],[82,46,113],[248,191,83],[224,157,63],[40,111,191],[23,74,141],[251,244,227],[224,212,190],[53,111,64],[37,80,45],[188,163,100],[142,124,75],[66,62,46],[207,208,199],[172,174,166],[239,163,79],[208,134,61],[171,54,43],[124,39,35]];
const nearest=(r,g,b)=>palette.reduce((best,c)=>{const d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;return d<best[0]?[d,c]:best},[Infinity,null])[1];
for(const job of jobs){const file=`source/fix2/${job.source}.png`,sheet=read(path.join(R,file)),gender=['archer','swordsman'].includes(job.line)?'male':'female',char=M.characters[`${job.line}_${gender}`];for(const [name,cell,a,angle] of job.frames){const cx=job.single?0:(cell%2)*Math.floor(sheet.width/2),cy=job.single?0:Math.floor(cell/2)*Math.floor(sheet.height/2);const rect=job.single?[0,0,sheet.width,sheet.height]:[cx,cy,cx+Math.floor(sheet.width/2),cy+Math.floor(sheet.height/2)];let im=clean(crop(sheet,rect));const b=bounds(im,32),mask=blank(im.width,im.height,[0,0,0,255]);
 const headEnd=b[1]+(b[3]-b[1])*.56,keep=new Uint8Array(im.width*im.height);
 for(const c of components(im,(r,g,bb,aa,x,y)=>aa>127&&y<headEnd&&r>185&&g>155&&bb>120)){let seed=0;for(const p of c.pts){let q=p*4;const [r,g,bb]=im.data.subarray(q,q+3);if(r-g<30&&g-bb<46&&g>190)seed++;}if(c.pts.length>100&&seed>c.pts.length*.38)for(const p of c.pts)keep[p]=1;}
 for(let p=0;p<keep.length;p++){let q=p*4;if(!im.data[q+3])continue;let[r,g,bb]=im.data.subarray(q,q+3);if(keep[p]){im.data.set([254,240,220],q);mask.data.set([255,255,255,255],q);}else if(r>230&&g>175&&bb>135&&r-g>29&&g-bb<60){im.data.set([255,213,171],q);}else im.data.set(nearest(r,g,bb),q);}
 let xmin=im.width,xmax=0;for(let y=b[3]-Math.round((b[3]-b[1])*.09);y<b[3];y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>=32){xmin=Math.min(xmin,x);xmax=Math.max(xmax,x+1);}
 const s=job.scale,tx=220-(xmin+xmax)/2*s,ty=360-b[3]*s,inv=[1/s,0,-tx/s,0,1/s,-ty/s];const figure=transform(im,512,400,inv),hair=transform(mask,512,400,inv,true);for(let q=0;q<hair.data.length;q+=4){if(figure.data[q+3]<128)hair.data.set([0,0,0,255],q);else hair.data[q+3]=255;}
 const point=(x,y)=>[+(tx+(x-cx)*s).toFixed(3),+(ty+(y-cy)*s).toFixed(3)],hand=point(a[0],a[1]);const f={image:`frames/${job.line}/${name}.png`,hairMask:`masks/${job.line}/${name}.png`,gripOverlay:`grips/${job.line}/${name}.png`,hand:{point:hand,angle,z:'front',visible:true},crown:{point:point(a[2],a[3]),angle:0},side:{point:point(a[4],a[5]),angle:0},source:file,uniform_scale:s};const grip=blank(512,400);for(let y=0;y<400;y++)for(let x=0;x<512;x++)if((x-hand[0])**2+(y-hand[1])**2<9**2){let q=(y*512+x)*4;grip.data.set(figure.data.subarray(q,q+4),q);}
 png(f.image,figure);png(f.hairMask,hair);png(f.gripOverlay,grip);char.frames[name]=f;updates.push({id:`${job.line}_${gender}`,frame:name,source:file,source_sha256:hash(path.join(R,file)),uniform_scale:s,sourceRect:rect,sourceBounds:b,translation:[tx,ty],sourceAnnotations:a,prompt:`prompts/${job.line}_${gender}-fix2-attempt${job.source.endsWith('2')?2:1}.txt`});
}}

const targets=json(path.join(R,'source/fix2/anchor-targets.json')),anchorChanges=[];
for(const [id,frames] of Object.entries(targets))for(const [name,[crown,side]]of Object.entries(frames)){const f=M.characters[id].frames[name];for(const [key,point]of Object.entries({crown,side})){anchorChanges.push({id,frame:name,anchor:key,before:f[key].point,after:point});f[key].point=point;}}
const old=json(path.join(R,'source/fix2/game-manifest-before.json')).characters.archer_male.frames.walk_3,f=M.characters.archer_male.frames.walk_3;
for(const key of ['hand','crown','side'])anchorChanges.push({id:'archer_male',frame:'walk_3',anchor:key,before:old[key].point,after:f[key].point});
M.fix2={request:'docs/art-requests/hero-sprites-a-fix2.md',status:'complete',unresolved:[],method:'Removed bow and string from fix1 attempt2 with built-in image_gen; whole-figure normalization; no fallback assembly.',updates,anchorChanges};
put('game-manifest.json',M);put('source/fix2/annotations.json',{updates,anchorChanges,anchorMethod:'Measured eye-relative positions against unchanged idle_0/walk_0/attack_1, then aligned crown to skull outline and side to outer temple hair. Acolyte and other frames reviewed without changes.'});
const gen=json(path.join(R,'generation.json'));gen.fix2={...M.fix2,tool:'built-in image_gen',prompt:'prompts/archer_male-fix2-attempt1.txt',reference:'docs/art/concepts/round3/class_lineup.png',editTarget:'source/fix1/archer-attempt2.png'};put('generation.json',gen);
console.log(JSON.stringify({updates,anchorChanges},null,2));
