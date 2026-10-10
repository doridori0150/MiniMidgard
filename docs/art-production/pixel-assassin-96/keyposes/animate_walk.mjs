import fs from 'node:fs';import path from 'node:path';
import {root,read,scale,crop} from './work.mjs';
import {encodePng} from '../../../../../asset-kit/tools/lib/png.mjs';
const ids=JSON.parse(fs.readFileSync(path.join(root,'walk_playback.json'))).frames.map(f=>f.id);
const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(type,data){const t=Buffer.from(type),b=Buffer.concat([t,data]);let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);t.copy(out,4);data.copy(out,8);out.writeUInt32BE((c^0xffffffff)>>>0,out.length-4);return out;}
const parts=[Buffer.from([137,80,78,71,13,10,26,10])];let seq=0;
for(const [index,id]of ids.entries()){
 const png=encodePng(scale(crop(read(path.join(root,id,'composite.png')),80,120,96,108),4));
 let ihdr,compressed=[];
 for(let p=8;p<png.length;){const n=png.readUInt32BE(p),type=png.toString('ascii',p+4,p+8),data=png.subarray(p+8,p+8+n);if(type==='IHDR')ihdr=data;if(type==='IDAT')compressed.push(data);p+=n+12;}
 if(index===0){parts.push(chunk('IHDR',ihdr));const actl=Buffer.alloc(8);actl.writeUInt32BE(8,0);actl.writeUInt32BE(0,4);parts.push(chunk('acTL',actl));}
 const ctl=Buffer.alloc(26);ctl.writeUInt32BE(seq++,0);ctl.writeUInt32BE(384,4);ctl.writeUInt32BE(432,8);ctl.writeUInt16BE(9,20);ctl.writeUInt16BE(100,22);ctl[24]=0;ctl[25]=0;parts.push(chunk('fcTL',ctl));
 const data=Buffer.concat(compressed);
 if(index===0)parts.push(chunk('IDAT',data));else{const num=Buffer.alloc(4);num.writeUInt32BE(seq++);parts.push(chunk('fdAT',Buffer.concat([num,data])));}
}
parts.push(chunk('IEND',Buffer.alloc(0)));fs.writeFileSync(path.join(root,'walk_preview.apng'),Buffer.concat(parts));
