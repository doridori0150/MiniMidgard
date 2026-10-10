import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import{fileURLToPath}from'node:url';
import{read,blank,bbox,paste,scale,crop}from'./pixels.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../../..');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={checkedAt:new Date().toISOString(),status:'passed',candidates:{}};
const expectedHair=new Set(['250,240,215','225,205,184','180,155,145','73,52,47']);
const ref=scale(read(path.resolve(root,'../../art/ssot/look_assassin_idle0_1x.png')),2);
for(const key of ['idle_a','idle_b']){
 const dir=path.join(root,key),pose=JSON.parse(fs.readFileSync(path.join(dir,'pose.json'),'utf8')),comp=read(path.join(dir,'composite.png')),sum=blank(),names=pose.layerOrder;
 assert.deepEqual([comp.width,comp.height],[256,240]);assert.equal(pose.approved,false);
 const layerPixels={};let hairColors=new Set(),overlap=0;
 const occupied=new Uint8Array(256*240);
 for(const name of names){const a=read(path.join(dir,name+'.png'));assert.deepEqual([a.width,a.height],[256,240]);let n=0;for(let i=0;i<a.data.length;i+=4){assert.ok(a.data[i+3]===0||a.data[i+3]===255);if(!a.data[i+3])continue;n++;if(occupied[i/4])overlap++;occupied[i/4]++;if(name.startsWith('hair')){const c=a.data.slice(i,i+3).join(',');assert.ok(expectedHair.has(c));hairColors.add(c)}}assert.ok(n>0);layerPixels[name]=n;paste(sum,a)}
 assert.deepEqual(Buffer.from(sum.data),Buffer.from(comp.data));assert.equal(overlap,0);assert.equal(hairColors.size,4);
 const b=bbox(comp),head=bbox(comp,128,174),feet=bbox(comp,220,223);assert.equal(b[3]-b[1]+1,96);assert.equal(b[1],128);assert.equal(b[3],223);assert.ok(head[2]-head[0]+1<=60);assert.equal(pose.head.width,head[2]-head[0]+1);assert.equal(pose.backFoot.rearmostX,feet[0]);assert.deepEqual(pose.origin,[128,224]);assert.ok(Math.abs((feet[0]+feet[2])/2-128)<=.5);
 const katar=read(path.join(dir,'katar.png')),grip=read(path.join(dir,'grip.png'));
 for(const [a,p] of [[katar,pose.weapon.tipPoint],[grip,pose.weapon.gripPoint]])assert.ok(a.data[(p[1]*256+p[0])*4+3],`${key} anchor outside layer`);
 const big=read(path.join(dir,'composite_4x.png'));assert.deepEqual(Buffer.from(big.data),Buffer.from(scale(comp,4).data));assert.deepEqual([big.width,big.height],[1024,960]);
 const pair=blank(512,240);paste(pair,ref);paste(pair,comp,256);const side=blank(1024,720);paste(side,pair,256);paste(side,scale(pair,2),0,240);assert.deepEqual(Buffer.from(read(path.join(dir,'side_by_side.png')).data),Buffer.from(side.data));
 let union=0,intersection=0,changedBlocks=0,nonemptyBlocks=0;
 for(let i=3;i<comp.data.length;i+=4){const x=!!comp.data[i],y=!!ref.data[i];if(x||y)union++;if(x&&y)intersection++}
 for(let y=128;y<224;y+=2)for(let x=88;x<168;x+=2){const pixels=[[x,y],[x+1,y],[x,y+1],[x+1,y+1]].map(([X,Y])=>Array.from(comp.data.slice((Y*256+X)*4,(Y*256+X)*4+4)).join(','));if(pixels.some(c=>c!=='0,0,0,0')){nonemptyBlocks++;if(new Set(pixels).size>1)changedBlocks++}}
 assert.ok(changedBlocks>100);assert.notDeepEqual(Buffer.from(comp.data),Buffer.from(ref.data));
 // 실제 눈 영역에 밝은 점과 호박색 도트가 함께 있는지 확인한다. 미술적 판정은 NOTES의 육안 검토를 따른다.
 const eye=crop(comp,key==='idle_a'?123:124,157,20,7);let amber=0,highlight=0;
 for(let i=0;i<eye.data.length;i+=4)if(eye.data[i+3]){const[r,g,b]=eye.data.slice(i,i+3);if(r>140&&g>85&&g<210&&b<130&&r-g>20)amber++;if(r>190&&g>190&&b>185)highlight++}assert.ok(amber&&highlight);
 report.candidates[key]={canvas:[256,240],height:96,headWidth:pose.head.width,headRegionHeight:47,backFootRearmostX:feet[0],lastFootRow:223,layerPixels,hairColors:[...hairColors],alpha:'0 or 255',recomposition:'byte-identical',enlargement:'nearest exact 4x',comparison:'exact prescribed pairs at 1x and 2x',referenceSilhouetteIoU:Number((intersection/union).toFixed(4)),nonUniform2x2Blocks:changedBlocks,nonempty2x2Blocks:nonemptyBlocks,eyePixels:{amber,highlight},sourceSha256:hash(path.join(dir,'sources/generated.png')),compositeSha256:hash(path.join(dir,'composite.png'))};
}
assert.notEqual(report.candidates.idle_a.sourceSha256,report.candidates.idle_b.sourceSha256);
const baselineFile=path.join(root,'scope-before.json');
if(fs.existsSync(baselineFile)){const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));const changed=Object.entries(baseline.hashes).filter(([p,h])=>!fs.existsSync(path.join(repo,p))||hash(path.join(repo,p))!==h).map(([p])=>p);report.scope={protectedExistingFiles:Object.keys(baseline.hashes).length,changedOutsideTarget:changed};assert.equal(changed.length,0)}
fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
