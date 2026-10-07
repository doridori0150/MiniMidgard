// Standalone reference implementation. Coordinates/angles are defined by manifest.json.
export const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const matrix=(x=0,y=0,angle=0,sx=1,sy=1)=>{const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return[c*sx,s*sx,-s*sy,c*sy,x,y]};
export function sample(m,state,time){
 const a=m.animations[state];let t=a.loop?((time%a.duration)+a.duration)%a.duration:Math.min(a.duration,Math.max(0,time)),lo=a.keys[0],hi=a.keys.at(-1);
 for(let i=0;i<a.keys.length-1;i++){if(a.keys[i].time<=t&&t<=a.keys[i+1].time){lo=a.keys[i];hi=a.keys[i+1];break}}
 const u=(t-lo.time)/Math.max(1,hi.time-lo.time),result={};
 for(const [name,rest] of Object.entries(m.nodes)){
  const x={...rest,...lo.nodes[name]},y={...rest,...hi.nodes[name]},out={...x};
  for(const [k,fallback] of [['offset',[0,0]],['scale',[1,1]],['angle',0],['worldAngle',null]]){
   const av=x[k]??fallback,bv=y[k]??fallback;
   if(av!==null&&bv!==null)out[k]=Array.isArray(av)?av.map((v,i)=>v+(bv[i]-v)*u):av+(bv-av)*u;
  }
  result[name]=u>=1?y:out;
 }
 return result;
}
export function compose(m,state,time,look={}){
 look={...m.defaults,...look};const outfit=m.outfits[look.outfit];if(!outfit)throw Error('Unknown outfit');
 const nodes=sample(m,state,time),matrices={},selected={},draws=[];
 const visit=name=>{
  if(matrices[name])return matrices[name];
  const n=nodes[name],pm=n.parent?visit(n.parent):matrix(),pid=selected[n.parent];
  let id=n.part??null;if(n.slot)id=n.slot in outfit?outfit[n.slot]:look[n.slot];
  if(name==='hair_front')id=m.hairStyles[look.hairStyle??'novice_bob'].front;
  if(name==='hair_back')id=m.hairStyles[look.hairStyle??'novice_bob'].back;
  if(name==='face')id=look.face??m.faces[0];
  if(id&&!m.parts[id])throw Error(`Unknown part: ${id}`);selected[name]=id;
  let [x,y]=n.offset??[0,0];if(n.anchor){const p=m.parts[pid],a=p.anchors[n.anchor];x+=a[0]-p.pivot[0];y+=a[1]-p.pivot[1]}
  const [sx,sy]=n.scale??[1,1];let mat=multiply(pm,matrix(x,y,n.angle??0,sx,sy));
  if(n.worldAngle!==undefined)mat=matrix(mat[4],mat[5],n.worldAngle,Math.hypot(mat[0],mat[1]),Math.hypot(mat[2],mat[3]));
  matrices[name]=mat;
  if(id&&n.visible!==false){const p=m.parts[id];draws.push({node:name,part:id,file:p.file,matrix:multiply(mat,matrix(-p.pivot[0],-p.pivot[1])),z:n.z??p.z,tint:name.startsWith('hair_')?m.hairColors[look.hairColor]:null})}
  return mat;
 };
 Object.keys(nodes).forEach(visit);return draws.sort((a,b)=>a.z-b.z||a.node.localeCompare(b.node));
}
export async function loadAssets(m,base=new URL('.',import.meta.url)){
 const result={};await Promise.all(Object.entries(m.parts).map(async([id,p])=>{const i=new Image();i.src=new URL(p.file,base);await i.decode();result[id]=i}));return result;
}
const tintCache=new WeakMap();
function tinted(image,color){
 if(!color)return image;let cache=tintCache.get(image);if(!cache){cache=new Map();tintCache.set(image,cache)}if(cache.has(color))return cache.get(color);
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);x.globalCompositeOperation='multiply';x.fillStyle=color;x.fillRect(0,0,c.width,c.height);x.globalCompositeOperation='destination-in';x.drawImage(image,0,0);cache.set(color,c);return c;
}
// Caller supplies world position at the ground origin; height means nominal standing height.
export function drawCharacter(ctx,m,images,{x,y,height=80,facing=1,state='idle',time=0,look={}}){
 const scale=height/m.canvas.referenceHeight;ctx.save();ctx.translate(x,y);ctx.scale(scale*facing,scale);ctx.translate(-m.canvas.origin[0],-m.canvas.origin[1]);
 for(const d of compose(m,state,time,look)){ctx.save();ctx.transform(...d.matrix);ctx.drawImage(tinted(images[d.part],d.tint),0,0);ctx.restore()}ctx.restore();
}
