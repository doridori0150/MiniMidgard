import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,order,ref,read,save,blank,bbox,paste,scale,crop,inside,nearest,ranges,json} from './work.mjs';

export const configs={
  attack_5_swing:{sourceOrigin:[521,1158],factor:.17,mask:[[143,196],[151,196],[157,198],[161,201],[153,207],[138,214],[125,220],[120,224],[105,224],[104,218],[112,210],[126,201],[139,196]],donor:[[143,196],[151,196],[154,198],[150,201],[140,207],[129,214],[120,220],[118,224],[105,224],[104,218],[112,210],[126,201],[139,196]],bootTop:215},
  attack_3_contact:{sourceOrigin:[534,1081],factor:.204,mask:[[144,195],[154,195],[158,201],[158,204],[151,209],[142,213],[130,217],[120,220],[118,224],[105,224],[104,216],[112,210],[122,203],[136,197]],donor:[[144,195],[154,195],[157,198],[157,200],[151,201],[150,203],[147,206],[140,210],[130,213],[124,217],[118,224],[105,224],[104,216],[112,210],[122,203],[136,197]],bootTop:215,clothEnd:[[125,202],[138,201],[132,205],[124,210],[115,212],[112,209]],clothTip:[[114,208],[125,205],[128,205],[128,207],[122,210],[115,211]],clothShift:[12,-7]},
};
export function build(id){
 const c=configs[id];assert.ok(c);const dir=path.join(root,id),old=path.join(root,'rejected',id+'_backleg_previous');
 const src=read(path.join(dir,'sources/generated.png')),normalized=blank();
 const palette=[...new Map(Array.from({length:ref.data.length/4},(_,i)=>i*4).filter(i=>ref.data[i+3]).map(i=>[ref.data.subarray(i,i+3).join(','),Array.from(ref.data.subarray(i,i+3))])).values()];
 for(let y=138;y<224;y++)for(let x=90;x<230;x++){
  const sx=Math.round(c.sourceOrigin[0]+(x-105)/c.factor),sy=Math.round(c.sourceOrigin[1]+(y-223)/c.factor);if(sx<0||sx>=src.width||sy<0||sy>=src.height)continue;
  const j=(sy*src.width+sx)*4;if(src.data[j+3]>=160){const rgb=[...src.data.subarray(j,j+3)];const allowed=rgb[2]>rgb[1]&&rgb[1]>=rgb[0]?palette.filter(([r,g,b])=>r>g):palette;normalized.data.set([...nearest(rgb,allowed),255],(y*256+x)*4);}
 }
 const layers=Object.fromEntries(order.map(n=>[n,read(path.join(old,n+'.png'))])),mask=blank(),cloth=blank(),clothEdit=blank(),originalBody=read(path.join(old,'body.png'));
 // Navy cloth pixels and their immediate existing outline/trim remain original in swing.
 const body=layers.body;
 for(let y=175;y<=211;y++)for(let x=95;x<=165;x++){
  const i=(y*256+x)*4,[r,g,b,a]=body.data.subarray(i,i+4);
  if(a&&b>g&&g>=r&&(!c.clothEnd||y<=200||x>=149))for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)cloth.data.set([255,255,255,255],((y+dy)*256+x+dx)*4);
 }
 for(let y=0;y<240;y++)for(let x=0;x<256;x++){
  const i=(y*256+x)*4;
  const end=c.clothEnd&&inside(x+.5,y+.5,c.clothEnd);
  if((inside(x+.5,y+.5,c.mask)&&(!cloth.data[i+3]||end))||end){mask.data.set([255,255,255,255],i);if(end)clothEdit.data.set([255,255,255,255],i);const pixel=!c.donor||inside(x+.5,y+.5,c.donor)?normalized.data.subarray(i,i+4):[0,0,0,0];if(!(c.clothEnd&&y<=200&&!pixel[3]&&body.data[i+3]))body.data.set(pixel,i);}
  }
 if(c.clothTip)for(let y=200;y<212;y++)for(let x=110;x<140;x++)if(inside(x+.5,y+.5,c.clothTip)){
  const i=(y*256+x)*4;if(!originalBody.data[i+3])continue;const j=((y+c.clothShift[1])*256+x+c.clothShift[0])*4;body.data.set(originalBody.data.subarray(i,i+4),j);mask.data.set([255,255,255,255],j);clothEdit.data.set([255,255,255,255],j);
 }
 const composite=blank();for(const n of order){if(n==='body')save(path.join(dir,n+'.png'),layers[n]);else fs.copyFileSync(path.join(old,n+'.png'),path.join(dir,n+'.png'));paste(composite,layers[n]);}
 save(path.join(dir,'composite.png'),composite);save(path.join(dir,'composite_4x.png'),scale(composite,4));
 save(path.join(dir,'sources/normalized.png'),normalized);save(path.join(dir,'sources/backleg_mask.png'),mask);save(path.join(dir,'sources/protected_cloth_mask.png'),cloth);
 save(path.join(dir,'sources/cloth_end_edit_mask.png'),clothEdit);
 save(path.join(dir,'sources/body_detail_8x.png'),scale(crop(body,100,184,88,44),8));save(path.join(dir,'sources/final_detail_6x.png'),scale(crop(composite,90,130,145,98),6));
 const meta=JSON.parse(fs.readFileSync(path.join(old,'pose.json')));const feet=ranges(composite,223);meta.feet.opaqueRanges=feet;meta.feet.far=feet[0];meta.backFoot.rearmostX=bbox(composite,220,223)[0];meta.bounds=bbox(composite);
 meta.normalization='내장 image_gen 뒷다리 소스; 최근접 축소; 승인 idle 팔레트; 뒷다리 마스크 합성; 보호 픽셀 원본 보존';meta.notes='REQUEST_SWING_BACKLEG.md: 뒷다리 전체를 body에 복원. 머리·얼굴·상체·팔·앞다리·무기·그립 원본 보존.';
 json(id+'/pose.json',meta);json(id+'/sources/normalization.json',{sourceCanvas:[src.width,src.height],sourceOrigin:c.sourceOrigin,targetOrigin:[105,223],factor:c.factor,alphaThreshold:160,sampling:'nearest',mask:c.mask,donor:c.donor,bootRows:[c.bootTop,223],clothEnd:c.clothEnd,clothTip:c.clothTip,clothShift:c.clothShift,cloth:'원본 천과 인접 픽셀 보존; 접촉의 뒤쪽 천 끝만 원본 픽셀 이동',palette:'승인 idle 팔레트. 생성 소스의 남색은 뒷다리 합성부에서 가죽 계열로 정규화; 원본 천은 덮어쓰지 않음'});
 console.log(JSON.stringify({id,feet,bounds:bbox(composite)}));
}
if(process.argv[1]===new URL(import.meta.url).pathname)build(process.argv[2]);
