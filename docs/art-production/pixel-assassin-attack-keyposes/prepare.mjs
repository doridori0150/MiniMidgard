// 생성 원본의 최근접 픽셀 샘플링. 그림을 새로 그리거나 참조 이미지를 복사하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng } from '../../../../asset-kit/tools/lib/png.mjs';
export const root=path.dirname(fileURLToPath(import.meta.url));
export const blank=(w=128,h=120)=>({width:w,height:h,data:Buffer.alloc(w*h*4)});
export const read=p=>decodePng(fs.readFileSync(p));
export const save=(p,a)=>fs.writeFileSync(p,encodePng(a));
export function scale(a,n){let b=blank(a.width*n,a.height*n);for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){let i=(Math.floor(y/n)*a.width+Math.floor(x/n))*4;b.data.set(a.data.slice(i,i+4),(y*b.width+x)*4)}return b}
export function paste(out,a,ox=0,oy=0){for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){let i=(y*a.width+x)*4;if(a.data[i+3]&&x+ox>=0&&y+oy>=0&&x+ox<out.width&&y+oy<out.height)out.data.set(a.data.slice(i,i+4),((y+oy)*out.width+x+ox)*4)}return out}
export function bbox(a){let b=[a.width,a.height,-1,-1];for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++)if(a.data[(y*a.width+x)*4+3])b=[Math.min(x,b[0]),Math.min(y,b[1]),Math.max(x,b[2]),Math.max(y,b[3])];return b[2]<0?null:b}
export const names=['01_wind_up','02_apex','03_contact','04_recovery'];
export function sample(a){const o=blank();for(let y=0;y<120;y++)for(let x=0;x<128;x++){let sx=Math.floor((x+.5)*a.width/128),sy=Math.floor((y+.5)*a.height/120),i=(sy*a.width+sx)*4,d=(y*128+x)*4;if(a.data[i+3]>127){o.data.set(a.data.slice(i,i+3),d);o.data[d+3]=255}}return o}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 let sheet=blank(512,120);
 for(const [i,n] of names.entries()){let a=sample(read(path.join(root,'sources',n+'.png')));save(path.join(root,'sources',n+'_native.png'),a);paste(sheet,a,i*128);console.log(n,bbox(a));}
 save(path.join(root,'sources','review_4x.png'),scale(sheet,4));
}
