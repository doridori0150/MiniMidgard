import fs from 'node:fs';
import {read,save,blank,bbox,paste,scale,crop,hex,nearest,inside} from './pixels.mjs';
export const root=new URL('.',import.meta.url).pathname;
export function binary(a){for(let i=0;i<a.data.length;i+=4){if(a.data[i+3]<128)a.data.fill(0,i,i+4);else a.data[i+3]=255;}return a;}
export function resize(a,w,h){const b=blank(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=(Math.floor((y+.5)*a.height/h)*a.width+Math.floor((x+.5)*a.width/w))*4;b.data.set(a.data.subarray(j,j+4),(y*w+x)*4);}return b;}
export function normalize(file,w,h,x,y){const a=binary(read(root+file)),b=bbox(a),c=resize(crop(a,b[0],b[1],b[2]-b[0]+1,b[3]-b[1]+1),w,h),out=blank();paste(out,c,x,y);return out;}
export function preview(a,p){save(root+p,scale(crop(a,96,120,80,112),6));}
export function json(p,v){fs.writeFileSync(root+p,JSON.stringify(v,null,2)+'\n');}
if(process.argv[2]==='body'){
 const p='bodies/male/idle/1_base/',a=normalize(p+'sources/body-v2.png',34,60,111,164);
 const pal=['191920','34343f','535460','92959d','764d3e','b77f62','edb993','ffe3b5'].map(hex);
 for(let i=0;i<a.data.length;i+=4)if(a.data[i+3])a.data.set([...nearest(Array.from(a.data.subarray(i,i+3)),pal),255],i);
 save(root+p+'sources/normalized.png',a);preview(a,p+'sources/body-review-6x.png');
 console.log({bounds:bbox(a)});
}
if(process.argv[2]==='split-body'){
 const p='bodies/male/idle/1_base/',a=read(root+p+'sources/normalized.png'),body=blank(),arm=blank();
 const poly=[[118,169],[123,169],[126,172],[123,178],[120,181],[120,183],[126,185],[129,184],[132,185],[133,188],[130,191],[126,191],[120,190],[114,188],[111,184],[111,180],[114,173]];
 for(let y=0;y<240;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(a.data[i+3]){const out=inside(x+.5,y+.5,poly)?arm:body;out.data.set(a.data.subarray(i,i+4),i);}}
 // 가려진 몸통은 같은 행의 내의 단색으로 연결한다. 가까운 팔 픽셀은 별도 PNG에만 둔다.
 for(let y=171;y<=191;y++)for(let x=123;x<=132;x++){const i=(y*256+x)*4;if(!body.data[i+3]&&arm.data[i+3]){const j=(y*256+133)*4;if(a.data[j+3])body.data.set(a.data.subarray(j,j+4),i);}}
 save(root+p+'body.png',body);save(root+p+'near_arm.png',arm);
 const c=paste(paste(blank(),body),arm);save(root+p+'composite.png',c);save(root+p+'composite_4x.png',scale(c,4));
 json(p+'pose.json',{role:'base',crownY:128,head:{point:[126,164],frame:'front'},nearArmZ:'front',hand:{near:{grip:[129,187],angle:0},far:{grip:[141,195]}},weapon:{grip:[129,187],tip:[155,187],angle:0,z:'front'},feet:{row:223,near:[111,121],far:[130,143]}});
 preview(c,p+'sources/body-split-review-6x.png');
}
if(process.argv[2]==='head'){
 const p='heads/assassin_male/',a=normalize(p+'sources/head-v1.png',40,38,102,128);
 save(root+p+'sources/head-normalized.png',a);
 preview(a,p+'sources/head-review-6x.png');
 const c=read(root+'bodies/male/idle/1_base/composite.png');paste(c,a);preview(c,p+'sources/head-body-review-6x.png');
}
if(process.argv[2]==='finish-head'){
 const p='heads/assassin_male/',a=read(root+p+'sources/head-normalized.png'),hair=blank();
 const hp=['faf0d7','e1cdb8','b49b91','49342f'].map(hex),skin=['754c40','c48b69','efb88e','ffe2b5'].map(hex),mask=['191b27','272b3b','383d50','51576b'].map(hex),eye=['49342f','885023','d08b32','f5c45f','fff0d5'].map(hex);
 const face=[[121,145],[121,149],[119,152],[120,154],[123,156],[126,155],[132,157],[136,155],[137,153],[136,149],[134,148],[133,151],[132,155],[130,153],[127,151],[124,150]];
 const ear=[[109,152],[112,152],[114,155],[114,157],[111,156],[109,155]];
 for(let y=128;y<=165;y++)for(let x=102;x<142;x++){
  const i=(y*256+x)*4;if(!a.data[i+3])continue;const c=Array.from(a.data.subarray(i,i+3));
  const isMask=(c[2]>c[0]&&y>=154)||(y>=162&&x>=119);
  const isFace=inside(x+.5,y+.5,face)||inside(x+.5,y+.5,ear);
  let pal=isMask?mask:isFace?skin:hp;
  if(isFace&&((y>=151&&y<=154&&x>=120&&x<=125)||(y>=152&&y<=155&&x>=133&&x<=135)))pal=eye;
  const q=nearest(c,pal);a.data.set([...q,255],i);
  if(!isMask&&!isFace)hair.data.set([255,255,255,255],i);
 }
 // 지정된 눈 반사광 한 점씩을 논리 픽셀 격자에 보존한다.
 for(const [x,y]of[[122,152],[134,153]])a.data.set([255,255,255,255],(y*256+x)*4);
 // 목 두 번째 줄의 오른쪽 끝까지 마스크 턱 외곽선 1px로 덮는다.
 a.data.set([...hex('191b27'),255],(165*256+130)*4);
 save(root+p+'front.png',a);save(root+p+'sources/hair-mask.png',hair);
 json(p+'pivot.json',{point:[126,164],frame:'front',canvas:[256,240],overlapNeckPx:2,note:'동일 캔버스의 pivot이 pose.head.point와 일치한다. 추가 이동 없음.'});
 const c=read(root+'bodies/male/idle/1_base/composite.png');paste(c,a);save(root+p+'sources/body-head.png',c);save(root+p+'sources/body-head-4x.png',scale(c,4));preview(c,p+'sources/head-body-final-review-6x.png');
}
if(process.argv[2]==='outfit-review'){
 const p='outfits/assassin_male/idle/1_base/',a=binary(resize(read(root+p+'sources/outfit-v1.png'),256,240));
 save(root+p+'sources/outfit-normalized.png',a);preview(a,p+'sources/outfit-review-6x.png');console.log({bbox:bbox(a)});
}
if(process.argv[2]==='outfit'){
 const p='outfits/assassin_male/idle/1_base/',a=normalize(p+'sources/outfit-v1.png',39,60,106,164),body=read(root+'bodies/male/idle/1_base/body.png'),arm=read(root+'bodies/male/idle/1_base/near_arm.png'),o=blank(),oa=blank(),cover=blank(),tail=blank();
 const palette=['181820','30232b','4a343e','71505a','986d66','171e31','26344d','3e5570','70879a','5f4230','967044','c9a465','f1d28a'].map(hex);
 const tailPoly=[[118,191],[124,192],[122,196],[116,205],[110,211],[105,209],[105,204],[112,198],[105,198],[105,194]];
 function colorAt(x,y){let i=(y*256+x)*4;if(a.data[i+3])return Array.from(a.data.subarray(i,i+3));for(let r=1;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const j=((y+dy)*256+x+dx)*4;if(a.data[j+3])return Array.from(a.data.subarray(j,j+3));}return hex('30232b');}
 for(let y=164;y<224;y++)for(let x=102;x<150;x++){
  const i=(y*256+x)*4,b=body.data[i+3],ar=arm.data[i+3],t=a.data[i+3]&&inside(x+.5,y+.5,tailPoly)&&!b&&!ar;
  if(t){o.data.set([...nearest(colorAt(x,y),palette),255],i);tail.data.set([255,255,255,255],i);}
  if(b&&y>=166){o.data.set([...nearest(colorAt(x,y),palette),255],i);cover.data.set([255,255,255,255],i);}
  if(ar)oa.data.set([...nearest(colorAt(x,y),palette),255],i);
 }
 // 1px 바깥 경계는 각 재질의 어두운 단으로 정리한다. 팔 접합 안쪽에는 외곽선을 넣지 않는다.
 for(const layer of[o,oa])for(let y=166;y<224;y++)for(let x=103;x<149;x++){
  const i=(y*256+x)*4;if(!layer.data[i+3])continue;
  const outside=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([xx,yy])=>{const j=(yy*256+xx)*4;return !body.data[j+3]&&!arm.data[j+3]&&!tail.data[j+3]});
  if(outside)layer.data.set([...hex('181820'),255],i);
 }
 save(root+p+'outfit.png',o);save(root+p+'outfit_arm.png',oa);save(root+p+'sources/coverage-mask.png',cover);save(root+p+'sources/tails-mask.png',tail);
 const c=blank();for(const l of[body,o,read(root+'heads/assassin_male/front.png'),arm,oa])paste(c,l);
 save(root+p+'composite.png',c);save(root+p+'composite_4x.png',scale(c,4));preview(c,p+'sources/outfit-body-head-review-6x.png');
}
if(process.argv[2]==='weapon'){
 const p='weapons/katar/idle/1_base/',a=normalize(p+'sources/weapon-v1.png',32,11,122,182),g=blank(),arm=read(root+'outfits/assassin_male/idle/1_base/outfit_arm.png');
 const palette=['181820','434a54','878e98','bec5ca','f3f1e5','5f4230','967044','c9a465','f1d28a'].map(hex);
 for(let i=0;i<a.data.length;i+=4)if(a.data[i+3])a.data.set([...nearest(Array.from(a.data.subarray(i,i+3)),palette),255],i);
 for(let y=185;y<=189;y++)for(let x=127;x<=130;x++){
  const i=(y*256+x)*4;if(arm.data[i+3])g.data.set(arm.data.subarray(i,i+4),i);
 }
 save(root+p+'weapon.png',a);save(root+p+'grip.png',g);
 const pose=JSON.parse(fs.readFileSync(root+'bodies/male/idle/1_base/pose.json'));pose.weapon={grip:[129,187],tip:[152,187],angle:0,z:'front'};json('bodies/male/idle/1_base/pose.json',pose);
 const c=read(root+'outfits/assassin_male/idle/1_base/composite.png');paste(c,a);paste(c,g);preview(c,p+'sources/weapon-review-6x.png');
}
if(process.argv[2]==='composite'){
 const p='concept/assassin_male_idle/',paths=['bodies/male/idle/1_base/body.png','outfits/assassin_male/idle/1_base/outfit.png','heads/assassin_male/front.png','bodies/male/idle/1_base/near_arm.png','outfits/assassin_male/idle/1_base/outfit_arm.png','weapons/katar/idle/1_base/weapon.png','weapons/katar/idle/1_base/grip.png'];
 const c=blank(),ls=paths.map(q=>read(root+q));for(const a of ls)paste(c,a);
 save(root+p+'composite.png',c);save(root+p+'composite_4x.png',scale(c,4));
 const sheet=blank(256*8,240),detail=blank(80*8,112);[...ls,c].forEach((a,n)=>{paste(sheet,a,n*256,0);paste(detail,crop(a,96,120,80,112),n*80,0)});
 save(root+p+'layers_4x.png',scale(sheet,4));save(root+p+'layers_detail_4x.png',scale(detail,4));save(root+p+'detail_6x.png',scale(crop(c,96,120,80,112),6));
 const b=bbox(c),tight=crop(c,b[0],128,b[2]-b[0]+1,96);save(root+p+'game_59px.png',resize(tight,Math.round(tight.width*59/96),59));save(root+p+'phone_70px.png',resize(tight,Math.round(tight.width*70/96),70));
 json(p+'pose.json',JSON.parse(fs.readFileSync(root+'bodies/male/idle/1_base/pose.json')));
 json(p+'layers.json',{canvas:[256,240],origin:[128,224],layerOrder:paths,headTranslation:[0,0],nearArmZ:'front',weaponZ:'front',effects:false,approved:false});
 function regions(a){const rows=[];for(let y=0;y<240;y++){let start=null;for(let x=0;x<=256;x++){const yes=x<256&&a.data[(y*256+x)*4+3];if(yes&&start===null)start=x;if(!yes&&start!==null){rows.push([y,start,x-1]);start=null}}}return rows;}
 json(p+'validation-masks.json',{format:'[y, inclusive x0, inclusive x1]',hair:regions(read(root+'heads/assassin_male/sources/hair-mask.png')),waistTails:regions(read(root+'outfits/assassin_male/idle/1_base/sources/tails-mask.png'))});
 for(const dir of['outfits/assassin_male/idle/1_base/','weapons/katar/idle/1_base/'])json(dir+'pose.json',JSON.parse(fs.readFileSync(root+'bodies/male/idle/1_base/pose.json')));
 save(root+'weapons/katar/idle/1_base/composite.png',c);save(root+'weapons/katar/idle/1_base/composite_4x.png',scale(c,4));
}
