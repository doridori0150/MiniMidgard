// 생성된 새 그림만 단일 최근접 샘플링. 기존 48px 원화는 후보 입력으로 사용하지 않는다.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath}from'node:url';
import{read,save,blank,bbox,paste,scale,crop}from'./pixels.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const key=process.argv[2];if(!['idle_a','idle_b'].includes(key))throw Error('idle_a 또는 idle_b');
const dir=path.join(root,key),source=read(path.join(dir,'sources/generated.png'));
// 알파 경계만 이진화한다. 배경색 제거/형태 변경은 하지 않는다.
for(let i=3;i<source.data.length;i+=4)source.data[i]=source.data[i]>=128?255:0;
const b=bbox(source),factor=96/(b[3]-b[1]+1),width=Math.round((b[2]-b[0]+1)*factor),small=blank(width,96);
for(let y=0;y<96;y++)for(let x=0;x<width;x++){
 const sx=Math.min(b[2],b[0]+Math.floor((x+.5)/factor)),sy=Math.min(b[3],b[1]+Math.floor((y+.5)/factor)),si=(sy*source.width+sx)*4;
 if(source.data[si+3])small.data.set(source.data.subarray(si,si+4),(y*width+x)*4);
}
const foot=bbox(small,92,95),offsetX=128-Math.round((foot[0]+foot[2])/2),out=paste(blank(),small,offsetX,128);
save(path.join(dir,'sources/normalized.png'),out);save(path.join(dir,'sources/normalized_detail_8x.png'),scale(crop(out,88,120,80,112),8));
const meta={sourceCanvas:[source.width,source.height],sourceBounds:b,uniformScale:factor,sampling:'nearest, one pass',alphaThreshold:128,offset:[offsetX,128],footAnchor:[128,224],bounds:bbox(out)};
fs.writeFileSync(path.join(dir,'sources/normalization.json'),JSON.stringify(meta,null,2)+'\n');console.log(key,meta);
