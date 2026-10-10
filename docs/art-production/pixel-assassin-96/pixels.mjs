import fs from 'node:fs';
import {decodePng,encodePng} from '../../../../asset-kit/tools/lib/png.mjs';
export const read=p=>decodePng(fs.readFileSync(p));
export const save=(p,a)=>fs.writeFileSync(p,encodePng(a));
export const blank=(width=256,height=240)=>({width,height,data:Buffer.alloc(width*height*4)});
export function bbox(a,minY=0,maxY=a.height-1){let b=[a.width,a.height,-1,-1];for(let y=minY;y<=maxY;y++)for(let x=0;x<a.width;x++)if(a.data[(y*a.width+x)*4+3])b=[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)];return b[2]<0?null:b}
export function paste(out,a,ox=0,oy=0){for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){const i=(y*a.width+x)*4;if(a.data[i+3]&&x+ox>=0&&y+oy>=0&&x+ox<out.width&&y+oy<out.height)out.data.set(a.data.subarray(i,i+4),((y+oy)*out.width+x+ox)*4)}return out}
export function scale(a,n){const out=blank(a.width*n,a.height*n);for(let y=0;y<out.height;y++)for(let x=0;x<out.width;x++){const i=(Math.floor(y/n)*a.width+Math.floor(x/n))*4;out.data.set(a.data.subarray(i,i+4),(y*out.width+x)*4)}return out}
export function crop(a,x,y,w,h){const out=blank(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const p=((y+j)*a.width+x+i)*4;out.data.set(a.data.subarray(p,p+4),(j*w+i)*4)}return out}
export function inside(x,y,p){let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [xi,yi]=p[i],[xj,yj]=p[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)b=!b}return b}
export const hex=h=>h.replace('#','').match(/../g).map(v=>parseInt(v,16));
export const nearest=(c,p)=>p.reduce((a,v)=>{const d=v.reduce((s,q,i)=>s+(q-c[i])**2,0);return d<a.d?{d,v}:a},{d:Infinity}).v;
