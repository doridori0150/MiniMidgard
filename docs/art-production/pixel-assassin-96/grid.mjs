import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';import{read,save,blank,paste,scale,crop}from'./pixels.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),key=process.argv[2],a=read(path.join(root,key,'sources/normalized.png'));
const n=10,ox=45,oy=25,out=blank(845,1145);paste(out,scale(crop(a,88,120,80,112),n),ox,oy);
const digits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
function px(x,y,c){if(x>=0&&y>=0&&x<out.width&&y<out.height)out.data.set(c,(y*out.width+x)*4)}
function txt(s,x,y){for(const c of s){for(let j=0;j<5;j++)for(let i=0;i<3;i++)if(digits[+c][j*3+i]==='1')for(let v=0;v<2;v++)for(let u=0;u<2;u++)px(x+i*2+u,y+j*2+v,[235,235,235,255]);x+=8}}
for(let x=90;x<=165;x+=5){let X=ox+(x-88)*n;txt(String(x),X-10,5);for(let Y=oy;Y<out.height;Y++){let i=(Y*out.width+X)*4;const c=Array.from(out.data.slice(i,i+3)).map(v=>Math.round(v*.65+60));px(X,Y,[...c,255])}}
for(let y=120;y<=230;y+=5){let Y=oy+(y-120)*n;txt(String(y),5,Y);for(let X=ox;X<out.width;X++){let i=(Y*out.width+X)*4;const c=Array.from(out.data.slice(i,i+3)).map(v=>Math.round(v*.65+60));px(X,Y,[...c,255])}}
save(path.join(root,key,'sources/coordinate_review.png'),out);
