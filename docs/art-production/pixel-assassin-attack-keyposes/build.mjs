// 생성한 네 원본만 샘플링·팔레트 정규화·레이어 분리·합성한다.
// RO 참조는 이 스크립트에서 읽거나 저장하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {root,blank,read,save,scale,paste,bbox,names,sample} from './prepare.mjs';
const project=path.resolve(root,'../../..');
const rgb=h=>h.match(/../g).map(v=>parseInt(v,16));
const hairPalette=['faf0d7','e1cdb8','b49b91','49342f'].map(rgb);
const paletteFile=path.join(project,'docs/art/ssot/look_assassin_idle0_1x.png');
const ref=read(paletteFile),colors=new Map();
for(let i=0;i<ref.data.length;i+=4)if(ref.data[i+3])colors.set(ref.data.slice(i,i+3).join(','),Array.from(ref.data.slice(i,i+3)));
const palette=[...colors.values()];
const near=(c,p)=>p.reduce((best,v)=>{let d=v.reduce((s,q,i)=>s+(q-c[i])**2,0);return d<best.d?{d,v}:best},{d:Infinity}).v;
const inPoly=(x,y,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;};
// 마스크는 생성 원본을 128×120로 샘플링한 좌표계. 가려진 면은 새로 발명하지 않는다.
const specs=[
 {role:'wind_up',scale:1,footCenter:68,base:114,head:[74,81],headBox:[59,68,88,90],face:[[75,78],[80,78],[81,83],[82,84],[82,86],[80,89],[73,90],[70,88],[70,86],[73,84]],back:[59,83,65,89],weapon:[[40,89],[48,87],[54,87],[54,95],[40,95]],grip:[50,91],tip:[42,92],gripBox:[50,89,52,92]},
 {role:'apex',scale:1.08,footCenter:64,base:111,head:[73,84],headBox:[59,72,85,95],face:[[76,79],[79,81],[80,84],[81,87],[79,90],[74,91],[67,90],[67,87],[72,85]],back:[59,87,64,92],weapon:[[45,93],[53,93],[58,94],[58,98],[45,98]],grip:[56,95],tip:[47,95],gripBox:[55,94,57,96]},
 {role:'contact',scale:1.12,footCenter:60,base:110,head:[69,82],headBox:[56,71,81,92],face:[[70,77],[74,77],[76,81],[76,84],[78,85],[77,88],[73,89],[66,89],[63,87],[64,85],[68,83]],back:[56,84,62,89],weapon:[[78,93],[92,93],[92,99],[84,99],[83,100],[67,100],[67,97],[78,97]],grip:[80,95],tip:[90,96],gripBox:[78,94,80,96]},
 {role:'recovery',scale:1,footCenter:65,base:111,head:[66,78],headBox:[52,65,80,89],face:[[68,73],[72,73],[73,77],[75,80],[76,83],[73,85],[66,86],[62,84],[62,81],[66,79]],back:[52,79,59,85],weapon:[[63,93],[67,94],[70,96],[80,99],[81,104],[74,104],[68,99],[64,98]],grip:[65,94],tip:[78,101],gripBox:[63,92,65,94]}
];
const layersOrder=['hair_back','body','hair_front','katar','grip'];
let sheet=blank(512,120),composites=[],metadata=[];
for(const [index,s] of specs.entries()){
 const a=read(path.join(root,'sources',names[index]+'.png'));
 const layers=Object.fromEntries(layersOrder.map(n=>[n,blank()]));
 const rect=(x,y,b)=>x>=b[0]&&y>=b[1]&&x<=b[2]&&y<=b[3];
 for(let oy=0;oy<120;oy++)for(let ox=0;ox<128;ox++){
   const x=(ox-64)/s.scale+s.footCenter,y=(oy-112)/s.scale+s.base;
   const sx=Math.floor((x+.5)*a.width/128),sy=Math.floor((y+.5)*a.height/120);
   if(sx<0||sx>=a.width||sy<0||sy>=a.height)continue;
   let i=(sy*a.width+sx)*4;if(a.data[i+3]<128)continue;
   let c=Array.from(a.data.slice(i,i+3)),name='body';
   const isSkin=c[0]-c[1]>29&&c[1]-c[2]>17;
   const hairRegion=rect(x,y,s.headBox)&&!inPoly(x+.5,y+.5,s.face);
   if(hairRegion&&!isSkin){
     // 하관 마스크와 목을 제외하고 밝은 머리와 외곽선만 분리한다.
     const bright=c[0]>130&&c[1]>110&&c[2]>95;
     const upper=y<s.head[1]-1;
     const edge=(x<s.headBox[0]+4||x>s.headBox[2]-4);
     if(bright||upper||edge){name=rect(x,y,s.back)?'hair_back':'hair_front';c=near(c,hairPalette);}
   }
   if(inPoly(x+.5,y+.5,s.weapon)){name='katar';}
   if(rect(x,y,s.gripBox)){name='grip';}
   if(!name.startsWith('hair'))c=near(c,palette);
   layers[name].data.set([...c,255],(oy*128+ox)*4);
 }
 // 카메라/발 기준은 모든 레이어에 동일한 최근접 변환으로 적용한다.
 const transform=([x,y])=>[Math.round((x-s.footCenter)*s.scale+64),Math.round((y-s.base)*s.scale+112)];
 const dir=path.join(root,'poses',`${index+1}_${s.role}`);fs.mkdirSync(dir,{recursive:true});
 let composite=blank();for(const n of layersOrder){save(path.join(dir,n+'.png'),layers[n]);paste(composite,layers[n]);}
 const closestOpaque=(layer,point)=>{let best=null,d=Infinity;for(let y=0;y<120;y++)for(let x=0;x<128;x++)if(layer.data[(y*128+x)*4+3]){let q=(x-point[0])**2+(y-point[1])**2;if(q<d){d=q;best=[x,y]}}if(!best||d>9)throw Error('앵커가 해당 레이어에서 벗어남');return best;};
 const edgeX=bbox(layers.katar)[index<2?0:2],expectedTip=transform(s.tip);
 const grip=closestOpaque(layers.grip,transform(s.grip)),tip=closestOpaque(layers.katar,[edgeX,expectedTip[1]]),head=transform(s.head);
 const meta={role:s.role,canvas:[128,120],origin:[64,112],facing:'right_3_4',head:{point:head,layerOffset:[0,0]},weapon:{hand:'near',gripPoint:grip,tipPoint:tip,angleDegrees:Math.round(Math.atan2(tip[1]-grip[1],tip[0]-grip[0])*180/Math.PI*100)/100,z:'front',smear:index===2},layerOrder:layersOrder,source:`../../sources/${names[index]}.png`,normalization:{maskCoordinateSystem:[128,120],resampling:"single-pass nearest from generated original",uniformScale:s.scale,sourceFootCenter:s.footCenter,sourceFootBaseline:s.base,alphaThreshold:128,palette:'approved Assassin idle palette; hair restricted to four SSOT key colors'},notes:'레이어는 현재 자세에서 보이는 픽셀을 분리했다. 가려진 해부학 면의 재구성은 포함하지 않는다. head.point는 얼굴 중심 앵커이며, 전체 캔버스 레이어를 붙일 때는 layerOffset [0,0]을 사용한다.'};
 fs.writeFileSync(path.join(dir,'pose.json'),JSON.stringify(meta,null,2)+'\n');
 save(path.join(dir,'composite.png'),composite);save(path.join(dir,'composite_4x.png'),scale(composite,4));
 paste(sheet,composite,index*128);composites.push(composite);metadata.push(meta);
 console.log(s.role,'bounds',bbox(composite),'hair',bbox(paste(paste(blank(),layers.hair_back),layers.hair_front)),'grip',grip,'tip',tip);
}
save(path.join(root,'keyposes.png'),sheet);save(path.join(root,'keyposes_4x.png'),scale(sheet,4));
const comparison=blank(768,120);
paste(comparison,read(path.join(project,'docs/art/ssot/style_knight_r15_idle0_1x.png')));paste(comparison,ref,128);
composites.forEach((c,i)=>paste(comparison,c,(i+2)*128));
const both=blank(3072,600);paste(both,comparison);paste(both,scale(comparison,4),0,120);save(path.join(root,'side_by_side.png'),both);
fs.writeFileSync(path.join(root,'layer_masks.json'),JSON.stringify(specs,null,2)+'\n');
