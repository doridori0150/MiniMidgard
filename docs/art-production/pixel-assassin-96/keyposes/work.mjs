import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {read,save,blank,bbox,paste,scale,crop,inside,hex,nearest} from '../pixels.mjs';
export {read,save,blank,bbox,paste,scale,crop,inside,hex,nearest};
export const root=path.dirname(fileURLToPath(import.meta.url));
export const project=path.resolve(root,'../../../..');
export const order=['hair_back','body','hair_front','katar','grip'];
export const ref=read(path.join(project,'docs/art/ssot/ssot96_assassin_idle_1x.png'));
export function json(file,data){fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');}
export function preserve(){
 const files={};
 function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','.DS_Store'].includes(e.name))continue;const p=path.join(dir,e.name);if(p===root)continue;if(e.isDirectory())scan(p);else if(e.isFile())files[path.relative(project,p)]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}}
 scan(project);return files;
}
export function normalize(id,sourcePath,crown){
 const dir=path.join(root,id);fs.mkdirSync(path.join(dir,'sources'),{recursive:true});
 fs.copyFileSync(sourcePath,path.join(dir,'sources/generated.png'));
 const src=read(sourcePath);for(let i=3;i<src.data.length;i+=4)src.data[i]=src.data[i]>=128?255:0;
 const b=bbox(src),h=224-crown,f=h/(b[3]-b[1]+1),w=Math.round((b[2]-b[0]+1)*f),small=blank(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=Math.min(b[2],b[0]+Math.floor((x+.5)/f)),sy=Math.min(b[3],b[1]+Math.floor((y+.5)/f));small.data.set(src.data.subarray((sy*src.width+sx)*4,(sy*src.width+sx)*4+4),(y*w+x)*4);}
 const feet=bbox(small,h-4,h-1),ox=128-Math.round((feet[0]+feet[2])/2),a=paste(blank(),small,ox,crown);
 save(path.join(dir,'sources/normalized.png'),a);save(path.join(dir,'sources/detail_6x.png'),scale(crop(a,70,120,130,112),6));
 json(id+'/sources/normalization.json',{sourceCanvas:[src.width,src.height],sourceBounds:b,uniformScale:f,offset:[ox,crown],alphaThreshold:128,sampling:'single pass nearest',bounds:bbox(a)});
 console.log(id,JSON.stringify({bounds:bbox(a),feet:bbox(a,220,223)}));return a;
}
export function ranges(a,y){let out=[],start=null;for(let x=0;x<=a.width;x++){const on=x<a.width&&a.data[(y*a.width+x)*4+3];if(on&&start===null)start=x;if(!on&&start!==null){out.push([start,x-1]);start=null;}}return out;}
export function finish(id,layers,cfg){
 const dir=path.join(root,id);fs.mkdirSync(dir,{recursive:true});const a=blank();for(const n of order){save(path.join(dir,n+'.png'),layers[n]);paste(a,layers[n]);}
 save(path.join(dir,'composite.png'),a);save(path.join(dir,'composite_4x.png'),scale(a,4));
 const hb=bbox(paste(paste(blank(),layers.hair_back),layers.hair_front));
 const foot=ranges(a,223),low=bbox(a,220,223);
 const snap=(layer,p)=>{let best=p,dist=Infinity;for(let y=0;y<240;y++)for(let x=0;x<256;x++){if(!layer.data[(y*256+x)*4+3])continue;const d=(x-p[0])**2+(y-p[1])**2;if(d<dist){dist=d;best=[x,y];}}if(dist>25)throw Error('Anchor not on layer: '+id+' '+p+' distance '+dist);return best;};
 const g=snap(layers.grip,cfg.grip),t=snap(layers.katar,cfg.tip);
 const span=list=>list.length?[Math.min(...list.map(r=>r[0])),Math.max(...list.map(r=>r[1]))]:null;
 let near,far;if(cfg.role==='pass_near'){near=span(foot);far=null;}else if(cfg.role==='pass_far'){near=null;far=span(foot);}else{const cut=cfg.role==='breath_out'?128:cfg.role.startsWith('contact_')?128:140;const left=span(foot.filter(r=>r[1]<cut)),right=span(foot.filter(r=>r[0]>=cut));if(cfg.role==='contact_far'){near=left;far=right;}else{near=right;far=left;}}
 const data={schema:'assassin96-keypose@1',role:cfg.role,canvas:[256,240],origin:[128,224],facing:'right_3_4',head:{point:cfg.head,crownY:hb[1],bounds:hb,width:hb[2]-hb[0]+1},weapon:{hand:'near',gripPoint:g,tipPoint:t,angleDegrees:Math.round(Math.atan2(t[1]-g[1],t[0]-g[0])*180/Math.PI*100)/100,angleConvention:'screen right 0, clockwise positive',smear:cfg.smear??false},backFoot:{rows:[220,223],rearmostX:low[0]},feet:{row:223,opaqueRanges:foot,near,far,nullMeaning:'해당 발은 223행에 불투명 픽셀이 없음'},bounds:bbox(a),layerOrder:order,normalization:cfg.normalization??'single nearest sample; binary alpha; approved palette; head width normalized55; attack rear boot pixels locked to SSOT; visible pixel layers only',notes:cfg.notes??'가려진 면을 복원한 리그가 아니라 보이는 픽셀의 레이어 분리다.'};
 json(id+'/pose.json',data);return data;
}
if(process.argv[2]==='normalize')normalize(process.argv[3],process.argv[4],Number(process.argv[5]));
if(process.argv[2]==='baseline')json('scope-before.json',preserve());
