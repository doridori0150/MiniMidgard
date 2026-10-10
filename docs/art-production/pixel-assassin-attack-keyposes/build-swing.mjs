// 5_swing 전용. 승인 4포즈·assembly·src는 쓰지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {root,read,save,blank,paste,scale,bbox} from './prepare.mjs';
const source=read(path.join(root,'sources/05_swing.png'));
const reference=read(path.resolve(root,'../../art/ssot/look_assassin_idle0_1x.png'));
const colors=new Map();
for(let i=0;i<reference.data.length;i+=4)if(reference.data[i+3])colors.set(reference.data.slice(i,i+3).join(','),Array.from(reference.data.slice(i,i+3)));
const palette=[...colors.values()];
const hair=['faf0d7','e1cdb8','b49b91','49342f'].map(h=>h.match(/../g).map(v=>parseInt(v,16)));
const nearest=(c,p)=>p.reduce((a,v)=>{const d=v.reduce((s,q,i)=>s+(q-c[i])**2,0);return d<a.d?{d,v}:a},{d:Infinity}).v;
const inside=(x,y,p)=>{let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [xi,yi]=p[i],[xj,yj]=p[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)b=!b;}return b;};
const face=[[75,81],[77,81],[78,85],[79,86],[79,89],[76,91],[69,91],[65,88],[69,88],[69,86],[73,85]];
const trail=[[40,96],[48,100],[60,102],[69,103],[76,104],[83,103],[87,101],[88,98],[87,95],[83,90],[86,90],[91,95],[98,98],[98,106],[93,109],[69,109],[59,107],[48,104]];
const blade=[[72,98],[75,98],[78,100],[81,101],[82,104],[78,104],[75,102],[73,101]];
const order=['hair_back','body','hair_front','katar','grip'];
const layers=Object.fromEntries(order.map(n=>[n,blank()]));
// 하나의 정수 평행이동: 뒷발 x47→52, 앞발 최하단 y112→111.
// 원본에서 직접 최근접 샘플링하여 중간 축소·회전 없이 픽셀 밀도를 보존한다.
for(let y=0;y<120;y++)for(let x=0;x<128;x++){
 const sx=x-5,sy=y+1;if(sx<0||sy>=120)continue;
 const i=(Math.floor((sy+.5)*source.height/120)*source.width+Math.floor((sx+.5)*source.width/128))*4;
 if(source.data[i+3]<128)continue;
 let c=Array.from(source.data.slice(i,i+3)),name='body';
 const skin=c[0]-c[1]>29&&c[1]-c[2]>17;
 if(sy<=92&&sx>=57&&sx<=84&&!inside(sx+.5,sy+.5,face)&&!skin){
  const bright=c[0]>130&&c[1]>110&&c[2]>95;
  if(sy<90||bright)name=sx<=63&&sy>=85?'hair_back':'hair_front';
 }
 const metal=c[0]>115&&Math.abs(c[0]-c[1])<25&&c[2]>=c[0]-7;
 if((inside(sx+.5,sy+.5,trail)&&metal)||inside(sx+.5,sy+.5,blade))name='katar';
 // 곡선 경계 및 어두운 칼날의 분류 누락: 색칠하지 않고 해당 원본 픽셀의 레이어만 이동.
 if([[90,94],[51,100],[62,102],[64,102],[65,102]].some(([px,py])=>sx===px&&sy===py))name='katar';
 if(sx>=71&&sx<=75&&sy>=97&&sy<=99)name='grip';
 c=nearest(c,name.startsWith('hair')?hair:palette);
 layers[name].data.set([...c,255],(y*128+x)*4);
}
const dir=path.join(root,'poses/5_swing');fs.mkdirSync(dir,{recursive:true});
const composite=blank();for(const n of order){save(path.join(dir,n+'.png'),layers[n]);paste(composite,layers[n]);}
save(path.join(dir,'composite.png'),composite);save(path.join(dir,'composite_4x.png'),scale(composite,4));
const grip=[79,97],tip=[85,102];
const meta={role:'swing',canvas:[128,120],origin:[64,112],facing:'right_3_4',head:{point:[77,83],layerOffset:[0,0]},weapon:{hand:'near',gripPoint:grip,tipPoint:tip,angleDegrees:Math.round(Math.atan2(tip[1]-grip[1],tip[0]-grip[0])*180/Math.PI*100)/100,z:'front',smear:true},layerOrder:order,source:'../../sources/05_swing.png',normalization:{maskCoordinateSystem:[128,120],resampling:'single-pass nearest from generated original; integer translation (+5,-1)',uniformScale:1,sourceFootCenter:59,sourceFootBaseline:113,alphaThreshold:128,palette:'approved Assassin idle palette; hair restricted to four SSOT key colors'},notes:'between:1>2 전용 사이 장. 추가 dx/dy 없이 뒷발 108–111행 최소 x=52. 앞발은 111행에 닿는다. 잔상은 katar 레이어만 포함한다. 레이어는 현재 보이는 픽셀을 분리했으며 가려진 면의 재구성은 포함하지 않는다. head.point는 얼굴 중심, layerOffset은 전체 캔버스 배치 기준이다.'};
fs.writeFileSync(path.join(dir,'pose.json'),JSON.stringify(meta,null,2)+'\n');
console.log('swing',bbox(composite),Object.fromEntries(order.map(n=>[n,bbox(layers[n])])));
