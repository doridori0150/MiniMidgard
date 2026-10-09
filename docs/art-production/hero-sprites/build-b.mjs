import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {read,save,blank,crop,bounds,components,clean,transform} from './raster.mjs';
const R=path.dirname(new URL(import.meta.url).pathname);const put=(p,v)=>{fs.mkdirSync(path.dirname(R+'/'+p),{recursive:true});fs.writeFileSync(R+'/'+p,JSON.stringify(v,null,2)+'\n');};const png=(p,im)=>{fs.mkdirSync(path.dirname(R+'/'+p),{recursive:true});save(R+'/'+p,im);};
const original=JSON.parse(fs.readFileSync(R+'/source/b/game-manifest-before.json'));const M=structuredClone(original);M.characters={};M.weapons=Object.fromEntries(Object.entries(M.weapons).map(([k,w])=>[k,{...w,image:'../../'+w.image}]));M.headgear=Object.fromEntries(Object.entries(M.headgear).map(([k,w])=>[k,{...w,image:'../../'+w.image}]));
const names=Object.values(M.animations).flatMap(a=>a.frames);
const pts={thief:{
 1:[[254,238,193,47,269,121,177],[0],[0],[0],[0],[0],[0],[1352,520,1266,403,1340,454,526],[0],[0],[0],[1278,875,1240,703,1308,761,835],[246,1074,228,941,280,1000,1041,-15],[542,1074,673,1003,610,1080,1090,90]],
 2:[[390,280,316,72,402,156,220],[830,301,776,72,862,158,228],[1337,287,1265,71,1354,158,228],[1766,301,1705,72,1799,158,228],[0],[865,655,773,453,869,541,599],[1345,622,1239,448,1330,532,603],[1818,612,1703,448,1799,532,604]],
 3:[[0],[0],[1914,299,1733,126,1866,261,358]]},merchant:{
 1:[[190,302,135,100,202,187,265],[0],[0],[0],[0],[0],[0],[533,594,439,453,496,541,621],[0],[0],[0],[215,977,156,811,210,893,961],[423,971,455,811,505,869,958,-15],[747,1000,849,921,805,1002,1019,90]],
 2:[[409,256,319,29,405,133,237],[814,275,752,26,831,133,237],[1327,256,1245,26,1325,133,237],[1747,276,1684,26,1764,133,237],[0],[861,630,744,401,820,506,610],[1343,586,1220,401,1306,505,610],[1809,580,1695,399,1782,505,610]],
 3:[[0],[0],[1950,260,1770,70,1900,234,398]]}};
const selections=[[1,0],[1,0],[2,0],[2,1],[2,2],[2,3],[3,2],[1,7],[2,5],[2,6],[2,7],[1,11],[1,12],[1,13]];
const audit={};
for(const [line,gender,weapon]of [['thief','male','dagger'],['merchant','female','axe']]){
 const sheets={};for(let attempt=1;attempt<=3;attempt++){const image=read(R+`/source/b/${line}-attempt${attempt}.png`);const rowStep=attempt===1?(line==='thief'?300:350):attempt===2?380:1000;const cs=components(image).filter(c=>c.pts.length>2000).sort((a,b)=>Math.floor((a.box[1]+20)/rowStep)-Math.floor((b.box[1]+20)/rowStep)||a.box[0]-b.box[0]);sheets[attempt]={image,cs};}
 const scales={1:310/(sheets[1].cs[0].box[3]-sheets[1].cs[0].box[1]),2:0.85,3:0.55};const ch={class:line,gender,defaultWeapon:weapon,defaultHairTint:'cream',frames:{}};M.characters[`${line}_${gender}`]=ch;audit[line]=[];
 for(let i=0;i<14;i++){
 const n=names[i],[attempt,idx]=selections[i],s=sheets[attempt],b=s.cs[idx].box,a=[...pts[line][attempt][idx]],scale=scales[attempt];if(line==='thief'&&n!=='dead_0'){a[2]+=17/scale;a[3]+=16/scale;}else if(line==='merchant'&&n!=='dead_0')a[3]+=6/scale;else a[2]-=6/scale;const rect=[b[0]-3,b[1]-3,b[2]+3,b[3]+3];const im=clean(crop(s.image,rect));const h=blank(im.width,im.height,[0,0,0,255]);
 const minHairX=n==='dead_0'?(line==='thief'?523:689):0;
 const hairCs=components(im,(r,g,bb,alpha,x,y)=>alpha>127&&y+rect[1]<a[6]&&x+rect[0]>=minHairX&&r>180&&g>170&&bb>135&&r-g<29&&g-bb<45);const keep=new Uint8Array(im.width*im.height);for(const c of hairCs)if(c.pts.length>45)for(const p of c.pts)keep[p]=1;
 for(let p=0;p<keep.length;p++){const q=p*4;if(keep[p]){h.data.set([255,255,255,255],q);im.data.set(im.data[q+1]>220?[254,240,220]:[238,211,177],q);}}
 const bb=bounds(im,32),band=Math.round((bb[3]-bb[1])*.12);let lo=im.width,hi=0;for(let y=bb[3]-band;y<bb[3];y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>32){lo=Math.min(lo,x);hi=Math.max(hi,x+1);}
 const tx=220-(lo+hi)/2*scale,ty=360-bb[3]*scale,inv=[1/scale,0,-tx/scale,0,1/scale,-ty/scale],pic=transform(im,512,400,inv),mask=transform(h,512,400,inv,true);for(let p=0;p<512*400;p++){const q=p*4;if(pic.data[q+3]<128)mask.data.set([0,0,0,255],q);else mask.data[q+3]=255;}
 const pt=(x,y)=>[+(tx+(x-rect[0])*scale).toFixed(3),+(ty+(y-rect[1])*scale).toFixed(3)];const hand=pt(a[0],a[1]);let angle=n==='attack_1'?0:n==='attack_0'?-110:n==='attack_2'?25:-48;if(n.startsWith('cast'))angle=-25;
 const f={image:`frames/${line}/${n}.png`,hairMask:`masks/${line}/${n}.png`,hand:{point:hand,angle,z:'front',visible:!n.startsWith('sit')&&!n.startsWith('dead')},crown:{point:pt(a[2],a[3]),angle:a[7]??0},side:{point:pt(a[4],a[5]),angle:a[7]??0},gripOverlay:`grips/${line}/${n}.png`,source:`../../source/b/${line}-attempt${attempt}.png`,uniform_scale:scale};
 const grip=blank(512,400),rad=9;for(let y=Math.max(0,Math.floor(hand[1]-rad));y<Math.min(400,hand[1]+rad);y++)for(let x=Math.max(0,Math.floor(hand[0]-rad));x<Math.min(512,hand[0]+rad);x++)if((x-hand[0])**2+(y-hand[1])**2<=rad**2){const q=(y*512+x)*4;grip.data.set(pic.data.subarray(q,q+4),q);}
 for(const [key,data]of [['image',pic],['hairMask',mask],['gripOverlay',grip]])png('rejected/b/'+f[key],data);ch.frames[n]=f;audit[line].push({frame:n,attempt,sourceBounds:b,scale,translation:[tx,ty],annotations:a});
 }
 const base=ch.frames.idle_0,f=structuredClone(base),k=308/310;for(const key of ['image','hairMask','gripOverlay']){f[key]=base[key].replace('idle_0','idle_1');png('rejected/b/'+f[key],transform(read(R+'/rejected/b/'+base[key]),512,400,[1,0,0,0,1/k,360-360/k],key==='hairMask'));}for(const key of ['hand','crown','side'])f[key].point[1]=+(360+(f[key].point[1]-360)*k).toFixed(3);f.derivation={frame:'idle_0',operation:'whole-figure foot-locked breathing',topDisplacementPx:2};ch.frames.idle_1=f;
}
// Scale and orient the generated single axe at the same equipment scale as the approved lineup.
const axe=clean(read(R+'/source/b/axe-attempt1.png')),p=[380,935],head=[743,294],scale=.115,theta=Math.atan2(head[1]-p[1],head[0]-p[0]),c=Math.cos(theta),s=Math.sin(theta),dest=[56,128];
const palette=[[60,38,22],[158,108,64],[126,81,47],[155,158,162],[222,225,229]];
for(let q=0;q<axe.data.length;q+=4){if(axe.data[q+3]<1)continue;const col=palette.reduce((best,col)=>{const d=col.reduce((v,x,k)=>v+(x-axe.data[q+k])**2,0);return d<best[0]?[d,col]:best},[Infinity,null])[1];axe.data.set(col,q);}
const out=transform(axe,256,256,[c/scale,-s/scale,p[0]-(c*dest[0]-s*dest[1])/scale,s/scale,c/scale,p[1]-(s*dest[0]+c*dest[1])/scale]);png('equipment/axe.png',out);
const weapon={image:'equipment/axe.png',pivot:dest,tip:[+(dest[0]+Math.hypot(head[0]-p[0],head[1]-p[1])*scale).toFixed(3),128]};M.weapons.axe={...weapon,image:'../../equipment/axe.png'};put('rejected/b/game-manifest.json',M);put('source/b/annotations.json',audit);
// Only accepted equipment enters the shared delivery; visual review decides whether the candidates qualify.
const delivery=structuredClone(original);delivery.weapons.axe=weapon;put('game-manifest.json',delivery);
const gen=JSON.parse(fs.readFileSync(R+'/generation.json'));gen.sources=gen.sources.filter(x=>x.id!=='axe');gen.sources.push({id:'axe',tool:'built-in image_gen',source:'source/b/axe-attempt1.png',source_sha256:crypto.createHash('sha256').update(fs.readFileSync(R+'/source/b/axe-attempt1.png')).digest('hex'),uniform_scale:scale,sourcePivot:p,sourceHead:head,rotationDegrees:-theta*180/Math.PI,prompt:'prompts/axe-b-attempt-01.txt',attempt:1});gen.batchB={request:'docs/art-requests/hero-sprites-b.md',tool:'built-in image_gen',candidateManifest:'rejected/b/game-manifest.json',attempts:3,reviewStatus:'pending',processing:'Whole figure extraction, detached alpha speck cleanup, single uniform scale per source atlas, foot grounding, aligned hair masks, source-pixel finger overlays. No body-part assembly. All generation calls referenced original lineup and approved style frames, never generated candidates.'};put('generation.json',gen);console.log('Built 28 review candidates and axe. Original five preserved.');
