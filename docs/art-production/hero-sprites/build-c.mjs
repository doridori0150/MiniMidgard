import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {read,save,blank,crop,bounds,components,clean,transform} from './raster.mjs';
const R=path.dirname(new URL(import.meta.url).pathname),id='swordsman_female',sha=p=>crypto.createHash('sha256').update(fs.readFileSync(R+'/'+p)).digest('hex');
const put=(p,o)=>fs.writeFileSync(R+'/'+p,JSON.stringify(o,null,2)+'\n');
const M=JSON.parse(fs.readFileSync(R+'/source/c/game-manifest-before.json'));const names=Object.values(M.animations).flatMap(a=>a.frames);
const sheet='source/c/swordsman_female-attempt1.png',walk='source/c/swordsman_female-walk-attempt3.png',dead='source/c/swordsman_female-dead-attempt2.png';
const main=read(R+'/'+sheet),cs=components(main).filter(c=>c.pts.length>2000).sort((a,b)=>Math.floor(a.box[1]/310)-Math.floor(b.box[1]/310)||a.box[0]-b.box[0]);
// Source coordinates: near hand, skull/cowlick root, temple, hair rectangle, head roll.
const annotations=[
[240,232,190,58,247,119,[89,22,267,180],0],
[240,232,190,58,247,119,[89,22,267,180],0],
[885,226,837,56,887,116,[728,18,907,180],0],
[1208,230,1167,56,1215,115,[1058,20,1236,181],0],
[915,708,749,211,911,425,[440,95,954,588],0],
[550,540,504,368,559,429,[397,329,583,496],0],
[908,428,838,370,888,425,[732,331,904,495],0],
[1265,499,1168,374,1228,430,[1060,336,1246,503],0],
[273,835,189,680,245,740,[82,643,267,806],0],
[575,798,498,674,550,732,[390,636,575,803],0],
[910,800,831,676,888,733,[725,638,910,804],0],
[1185,870,1160,707,1225,766,[1062,670,1245,833],0],
[257,1060,133,955,207,993,[65,926,233,1099],-32],
[775,836,277,507,477,887,[140,393,678,915],-52]
];
const palette=[[62,39,20],[103,69,42],[145,101,62],[184,134,86],[255,211,171],[239,181,137],[212,213,214],[174,177,181],[243,241,234],[36,111,198],[24,81,157],[25,119,208],[194,65,43],[147,43,31]];
function inside(poly,x,y){let v=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[a,b]=poly[i],[c,d]=poly[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)v=!v;}return v;}
function inHair(a,x,y,r,g,b){if(a===annotations[4]&&inside([[646,414],[704,359],[723,337],[753,389],[833,429],[864,428],[860,498],[834,554],[782,568],[705,555],[650,530]],x,y))return false;const q=a[6];if(x<q[0]||x>q[2]||y<q[1]||y>q[3])return false;if(a===annotations[13]&&x>638&&y>592)return false;return r>160&&g>145&&b>110&&r-g<37&&g-b<52&&r-b>10;}
const ch={class:'swordsman',gender:'f',defaultWeapon:'sword',defaultHairTint:'cream',frames:{}};const audit=[];
for(const d of ['frames','masks','grips'])fs.mkdirSync(R+'/'+d+'/'+id,{recursive:true});
for(let i=0;i<14;i++){
if(i===1)continue;const name=names[i],a=annotations[i],source=i===4?walk:i===13?dead:sheet,src=source===sheet?main:read(R+'/'+source),box=source===sheet?cs[i].box:components(src)[0].box,rect=[box[0]-3,box[1]-3,box[2]+3,box[3]+3],im=clean(crop(src,rect)),hm=blank(im.width,im.height,[0,0,0,255]),scale=i===4?.37:i===13?.321:310/285;
const original=im.data.slice(),labels=new Int16Array(im.width*im.height).fill(-1);
for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){const z=y*im.width+x,p=z*4;if(!original[p+3])continue;const [r,g,b]=original.subarray(p,p+3),hair=inHair(a,x+rect[0],y+rect[1],r,g,b);labels[z]=hair?100:palette.reduce((best,c,j)=>{const d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;return d<best[0]?[d,j]:best},[Infinity,-1])[1];if(hair)hm.data.set([255,255,255,255],p);}
const keptHair=new Uint8Array(im.width*im.height);for(const c of components(hm,(r)=>r>127))if(c.pts.length>40/(scale*scale))for(const z of c.pts)keptHair[z]=1;for(let z=0;z<labels.length;z++)if(labels[z]===100&&!keptHair[z]){hm.data.set([0,0,0,255],z*4);const [r,g,b]=original.subarray(z*4,z*4+3);labels[z]=palette.reduce((best,c,j)=>{const d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;return d<best[0]?[d,j]:best},[Infinity,-1])[1];}
for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){const z=y*im.width+x,p=z*4,label=labels[z];if(label<0)continue;let stable=true,nearHair=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=im.width||yy>=im.height){stable=false;continue;}const n=labels[yy*im.width+xx];if(n!==label)stable=false;if(n===100)nearHair=true;}if(stable)im.data.set(label===100?(original[p+1]>215?[254,240,220]:[238,211,177]):palette[label],p);
const [r,g,b]=original.subarray(p,p+3);if(im.data[p+3]>240)im.data[p+3]=255;}

const bb=bounds(im,32),band=Math.round((bb[3]-bb[1])*.12);let lo=im.width,hi=0;for(let y=bb[3]-band;y<bb[3];y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>32){lo=Math.min(lo,x);hi=Math.max(hi,x+1);}
const tx=220-(lo+hi)/2*scale,ty=360-bb[3]*scale,inv=[1/scale,0,-tx/scale,0,1/scale,-ty/scale],pic=transform(im,512,400,inv),mask=transform(hm,512,400,inv,true);
for(let p=0;p<512*400;p++){const q=p*4;if(pic.data[q+3]<128)mask.data.set([0,0,0,255],q);else mask.data[q+3]=255;}
const pt=(x,y)=>[+(tx+(x-rect[0])*scale).toFixed(3),+(ty+(y-rect[1])*scale).toFixed(3)],hand=pt(a[0],a[1]);
const f={image:`frames/${id}/${name}.png`,hairMask:`masks/${id}/${name}.png`,gripOverlay:`grips/${id}/${name}.png`,hand:{point:hand,angle:name==='attack_0'?-110:name==='attack_1'?0:name==='attack_2'?30:name.startsWith('cast')?-65:-48,z:'front',visible:!['sit_0','dead_0'].includes(name)},crown:{point:pt(a[2],a[3]),angle:a[7]},side:{point:pt(a[4],a[5]),angle:a[7]},source,uniform_scale:scale};
const grip=blank(512,400),rad=8;for(let y=Math.floor(hand[1]-rad);y<=hand[1]+rad;y++)for(let x=Math.floor(hand[0]-rad);x<=hand[0]+rad;x++)if(x>=0&&y>=0&&x<512&&y<400&&(x-hand[0])**2+(y-hand[1])**2<=rad**2){const q=(y*512+x)*4;grip.data.set(pic.data.subarray(q,q+4),q);}
for(const[k,data]of [['image',pic],['hairMask',mask],['gripOverlay',grip]])save(R+'/'+f[k],data);ch.frames[name]=f;audit.push({frame:name,source,sourceBounds:box,sourceRect:rect,scale,translation:[tx,ty],annotations:a});
}
const base=ch.frames.idle_0,f=structuredClone(base),k=308/310;for(const key of ['image','hairMask','gripOverlay']){f[key]=base[key].replace('idle_0','idle_1');const im=transform(read(R+'/'+base[key]),512,400,[1,0,0,0,1/k,360-360/k],key==='hairMask');if(key==='hairMask')for(let p=3;p<im.data.length;p+=4)im.data[p]=255;save(R+'/'+f[key],im);}for(const key of ['hand','crown','side'])f[key].point[1]=+(360+(f[key].point[1]-360)*k).toFixed(3);f.derivation={frame:'idle_0',operation:'whole-figure foot-locked breathing',topDisplacementPx:2,verticalFactor:k};ch.frames.idle_1=f;const breathMask=read(R+'/'+f.hairMask),breathBody=read(R+'/'+f.image);for(let q=0;q<breathMask.data.length;q+=4)if(breathBody.data[q+3]<128)breathMask.data.set([0,0,0,255],q);save(R+'/'+f.hairMask,breathMask);
ch.frames=Object.fromEntries(names.map(n=>[n,ch.frames[n]]));M.characters[id]=ch;put('game-manifest.json',M);put('source/c/annotations.json',audit);
const gen=JSON.parse(fs.readFileSync(R+'/generation.json'));gen.sources=gen.sources.filter(x=>x.id!==id);for(const[source,scale,prompt,frames]of [[sheet,310/285,'prompts/swordsman_female-hero-attempt-01.txt',names.filter(n=>!['walk_2','dead_0'].includes(n))],[walk,.37,'prompts/swordsman_female-walk-attempt-03.txt',['walk_2']],[dead,.321,'prompts/swordsman_female-dead-attempt-02.txt',['dead_0']]])gen.sources.push({id,tool:'built-in image_gen',source,source_sha256:sha(source),uniform_scale:scale,prompt,frames});
gen.batchC={request:'docs/art-requests/hero-sprites-c.md including final addendum',references:['docs/art/concepts/round3/class_lineup.png','docs/art-production/hero-sprites/frames/swordsman/idle_0.png','docs/art-production/hero-sprites/frames/novice/idle_0.png'],processing:'Whole-figure extraction; flat material palette; common scale per source; foot registration; color-segmented aligned full hair masks; original-pixel finger overlays. No head/body/face assembly. idle_1 uses recorded 2px foot-locked whole-figure breathing.',rejected:[{source:sheet,frames:['walk_2','dead_0'],reason:'Repeated leading foot; undersized lying head.'},{source:'source/c/swordsman_female-walk-attempt2.png',reason:'Contact still same leading foot; body proportions drift.'}],annotations:'source/c/annotations.json',status:'pending-review'};put('generation.json',gen);console.log('Built 14 frames, 14 masks, 14 grip overlays; only swordsman_female appended.');
