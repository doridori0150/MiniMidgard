// 생성된 후보의 규격 정리/레이어 분리. 참고 이미지는 읽기만 하며 요청된 비교판에만 합성한다.
import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
import{read,save,blank,bbox,paste,scale,crop,inside,hex,nearest}from'./pixels.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),keys=process.argv.slice(2).length?process.argv.slice(2):['idle_a','idle_b'];
const masks=JSON.parse(fs.readFileSync(path.join(root,'layer_masks.json'),'utf8'));
const ref=read(path.resolve(root,'../../art/ssot/look_assassin_idle0_1x.png'));
const colors=new Map();for(let i=0;i<ref.data.length;i+=4)if(ref.data[i+3])colors.set(ref.data.slice(i,i+3).join(','),Array.from(ref.data.slice(i,i+3)));
const palette=[...colors.values()],hair=['faf0d7','e1cdb8','b49b91','49342f'].map(hex),order=['hair_back','body','hair_front','katar','grip'];
for(const key of keys){
 if(!masks[key])throw Error('Unknown candidate');const cfg=masks[key],dir=path.join(root,key),a=read(path.join(dir,'sources/normalized.png'));
 const layers=Object.fromEntries(order.map(n=>[n,blank()]));let changed=0;
 for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
  const i=(y*a.width+x)*4;if(!a.data[i+3])continue;let name='body',c=Array.from(a.data.slice(i,i+3));
  if(y<=cfg.hairMaxY&&!inside(x+.5,y+.5,cfg.face)&&!inside(x+.5,y+.5,cfg.ear)){name=inside(x+.5,y+.5,cfg.backHair)?'hair_back':'hair_front';}
  if(inside(x+.5,y+.5,cfg.katar)||(cfg.katarExtra??[]).some(([px,py])=>px===x&&py===y))name='katar';
  if(inside(x+.5,y+.5,cfg.grip))name='grip';
  const q=nearest(c,name.startsWith('hair')?hair:palette);if(q.some((v,j)=>v!==c[j]))changed++;layers[name].data.set([...q,255],i);
 }
 const composite=blank();for(const n of order){save(path.join(dir,n+'.png'),layers[n]);paste(composite,layers[n]);}
 save(path.join(dir,'composite.png'),composite);save(path.join(dir,'composite_4x.png'),scale(composite,4));
 // 위: 구작 48px×2 + 신작 96px×1. 아래: 동일 쌍을 다시 ×2. 캔버스 여백/발높이 보존.
 const pair=blank(512,240);paste(pair,scale(ref,2));paste(pair,composite,256);
 const side=blank(1024,720);paste(side,pair,256,0);paste(side,scale(pair,2),0,240);save(path.join(dir,'side_by_side.png'),side);
 // 실제 세부 관찰용. 원본 참고 단독 파일은 만들지 않는다.
 save(path.join(dir,'sources/final_detail_8x.png'),scale(crop(composite,88,120,80,112),8));
 const layerSheet=blank(400,112);order.forEach((n,j)=>paste(layerSheet,crop(layers[n],88,120,80,112),j*80));save(path.join(dir,'sources/layers_review_4x.png'),scale(layerSheet,4));
 const bounds=bbox(composite),head=bbox(composite,128,cfg.headBottom),foot=bbox(composite,220,223),norm=JSON.parse(fs.readFileSync(path.join(dir,'sources/normalization.json'),'utf8'));
 const meta={schema:'assassin-idle-96-candidate@1',candidate:key,approved:false,role:'idle_inhale',canvas:[256,240],origin:[128,224],facing:'right_3_4',head:{point:cfg.headPoint,layerOffset:[0,0],bounds:head,width:head[2]-head[0]+1},weapon:{hand:'near',gripPoint:cfg.gripPoint,tipPoint:cfg.tipPoint,angleDegrees:Math.round(Math.atan2(cfg.tipPoint[1]-cfg.gripPoint[1],cfg.tipPoint[0]-cfg.gripPoint[0])*180/Math.PI*100)/100,angleConvention:'screen-right 0 degrees; clockwise positive',z:'front'},backFoot:{rows:[220,223],rearmostX:foot[0]},bounds,height:bounds[3]-bounds[1]+1,layerOrder:order,source:'sources/generated.png',normalization:{...norm,palette:'approved Assassin palette; hair uses exactly four specified key colors',colorMappedPixels:changed},notes:'보이는 픽셀을 5개 레이어로 분리했다. 가려진 신체/머리/무기 면을 새로 복원한 교체용 리그는 아니다. 전체 레이어 오프셋 (0,0).'};
 fs.writeFileSync(path.join(dir,'pose.json'),JSON.stringify(meta,null,2)+'\n');console.log(key,JSON.stringify({height:meta.height,headWidth:meta.head.width,backFoot:meta.backFoot,layerBounds:Object.fromEntries(order.map(n=>[n,bbox(layers[n])]))}));
}
