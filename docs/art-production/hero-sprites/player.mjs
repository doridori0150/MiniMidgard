import fs from 'node:fs';
import path from 'node:path';
import {read,blank,over,transform} from './raster.mjs';
export const R=path.dirname(new URL(import.meta.url).pathname);
export const M=JSON.parse(fs.readFileSync(path.join(R,'game-manifest.json')));
const cache=new Map();export function asset(p){if(!cache.has(p))cache.set(p,read(path.join(R,p)));return cache.get(p);}
export function selectFrame(state,time){const a=M.animations[state];let t=Math.max(0,Math.floor(time));t=a.loop?t%a.duration:Math.min(t,a.duration-1);for(let i=0;i<a.frames.length;i++){if(t<a.durations[i])return a.frames[i];t-=a.durations[i];}throw Error('timing');}
export function matrix(point,angle,pivot){const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return [c,s,-s,c,point[0]-c*pivot[0]+s*pivot[1],point[1]-s*pivot[0]-c*pivot[1]];}
export const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export function draws(id,name,{weapon=M.characters[id].defaultWeapon,gear=[],hair='cream',facing=1}={}){
 const f=M.characters[id].frames[name],ds=[];const addWeapon=()=>{const w=M.weapons[weapon];ds.push({role:'weapon',image:w.image,matrix:matrix(f.hand.point,f.hand.angle,w.pivot)});};
 if(weapon&&f.hand.visible&&f.hand.z==='behind')addWeapon();
 ds.push({role:'figure',image:f.image,mask:f.hairMask,tint:M.hairTints[hair]??hair,matrix:[1,0,0,1,0,0]});
 if(weapon&&f.hand.visible&&f.hand.z==='front'){addWeapon();ds.push({role:'grip',image:f.gripOverlay,matrix:[1,0,0,1,0,0]});}
 for(const g of gear){const v=M.headgear[g],a=f[v.anchor];ds.push({role:'headgear',image:v.image,matrix:matrix(a.point,a.angle,v.pivot)});}
 if(facing===-1)for(const d of ds){let [a,b,c,e,x,y]=d.matrix;d.matrix=[-a,b,-c,e,440-x,y];}
 return ds;
}
export function render(id,name,opt={}){let out=blank(512,400);for(const d of draws(id,name,opt)){let im=asset(d.image);if(d.mask&&d.tint){im={...im,data:im.data.slice()};const m=asset(d.mask);for(let p=0;p<im.width*im.height;p++){let q=p*4,f=m.data[q]/255;for(let k=0;k<3;k++)im.data[q+k]=Math.floor(im.data[q+k]*(1-f+f*d.tint[k])+0.5);}}
 let [a,b,c,e,x,y]=d.matrix,det=a*e-b*c;over(out,transform(im,512,400,[e/det,-c/det,(c*y-e*x)/det,-b/det,a/det,(b*x-a*y)/det]));}return out;}
