import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {read,blank,bbox,paste} from './pixels.mjs';
const root=new URL('.',import.meta.url).pathname;
const get=p=>read(root+p),j=p=>JSON.parse(fs.readFileSync(root+p)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(root+p)).digest('hex');
const folder='concept/assassin_male_idle/',manifest=j(folder+'layers.json'),m=j(folder+'validation-masks.json'),pose=j(folder+'pose.json'),pivot=j('heads/assassin_male/pivot.json');
const source=manifest.layerOrder.map(get),images=source.map((a,i)=>paste(blank(),a,...manifest.translations[i]));
const [body,outfit,head,arm,outfitArm,weapon,grip]=images;
for(const a of source){assert.equal(a.width,256);assert.equal(a.height,240);for(let i=3;i<a.data.length;i+=4)assert(a.data[i]===0||a.data[i]===255);}
for(const [file,expected]of Object.entries(m.preservedSha256))assert.equal(hash(file),expected,`보존 대상 변경: ${file}`);
assert.deepEqual(pose.head.point.map((v,i)=>v-pivot.point[i]),manifest.headTranslation);
assert.deepEqual(pose.weapon.grip.map((v,i)=>v-manifest.weaponSourceGrip[i]),manifest.weaponTranslation);
for(const dir of ['bodies/male/idle/1_base/','outfits/assassin_male/idle/1_base/','weapons/katar/idle/1_base/'])assert.deepEqual(j(dir+'pose.json'),pose);
const c=blank();images.forEach(a=>paste(c,a));const final=get(folder+'composite.png');assert(Buffer.from(c.data).equals(Buffer.from(final.data)));
function runs(a,y,x0=0,x1=255){let rs=[],start=null;for(let x=x0;x<=x1+1;x++){let yes=x<=x1&&a.data[(y*256+x)*4+3];if(yes&&start===null)start=x;if(!yes&&start!==null){rs.push([start,x-1]);start=null;}}return rs;}
const naked=paste(paste(blank(),body),arm),feet=runs(body,223),hb=bbox(head),all=bbox(final);
assert.deepEqual(feet,[pose.feet.near,pose.feet.far]);assert.deepEqual(runs(outfit,223),feet);assert.deepEqual(runs(final,223),feet);assert.equal(all[3],223);assert.equal(hb[1],129);assert.equal(hb[3],166);
const shoulder=runs(naked,169);assert.equal(shoulder.length,1);const shoulderWidth=shoulder[0][1]-shoulder[0][0]+1;assert(shoulderWidth>=32&&shoulderWidth<=34);
function measured(a,[y,x0,x1]){const rs=runs(a,y,x0,x1);assert.deepEqual(rs,[[x0,x1]]);return x1-x0+1;}
const chest=measured(body,m.torsoMeasurement),nearWidth=measured(arm,m.nearArmMeasurement),farWidth=measured(body,m.farArmMeasurement);assert(chest>=24&&chest<=26);assert(nearWidth>=6&&nearWidth<=7);assert(farWidth>=6&&farWidth<=7);
const legRuns=runs(body,214),legWidths=legRuns.map(([a,b])=>b-a+1);assert.equal(legRuns.length,2);legWidths.forEach(w=>assert(w>=8&&w<=9));
const tails=blank();for(const[y,a,b]of m.waistTails)for(let x=a;x<=b;x++)tails.data[(y*256+x)*4+3]=255;
let uncovered=0,armUncovered=0,silhouette=0,visibleBodySkin=0,neckVisible=0,collarOverlap=0;
const skin=new Set(m.skinPalette.map(h=>h.match(/../g).map(x=>parseInt(x,16)).join(','))),basePalette=new Set([...m.skinPalette,...m.underwearPalette].map(h=>h.match(/../g).map(x=>parseInt(x,16)).join(',')));
for(const a of [body,arm])for(let i=0;i<a.data.length;i+=4)if(a.data[i+3])assert(basePalette.has(Array.from(a.data.subarray(i,i+3)).join(',')));
for(let y=0;y<240;y++)for(let x=0;x<256;x++){
 const i=(y*256+x)*4,ba=!!body.data[i+3],aa=!!arm.data[i+3],oa=!!outfit.data[i+3],ga=!!outfitArm.data[i+3];
 if(ba&&!oa)uncovered++;
 if(aa&&!ga)armUncovered++;
 if(!tails.data[i+3]&&(ba||aa)!==(oa||ga))silhouette++;
 if(((ba&&!oa)||(aa&&!ga))&&!head.data[i+3])visibleBodySkin++;
 if(m.collarRows.includes(y)&&ba&&!oa&&!head.data[i+3])neckVisible++;
 if(m.collarRows.includes(y)&&oa&&head.data[i+3])collarOverlap++;
}
assert.equal(uncovered,0);assert.equal(armUncovered,0);assert.equal(silhouette,0);assert.equal(visibleBodySkin,0);assert.equal(neckVisible,0);assert(collarOverlap>0);
for(const y of m.collarRows){let overlap=0;for(let x=0;x<256;x++){let i=(y*256+x)*4;if(head.data[i+3]&&outfit.data[i+3])overlap++;}assert(overlap>0,`턱-옷깃 겹침 없음: ${y}`);}
const gi=(pose.hand.near.grip[1]*256+pose.hand.near.grip[0])*4;assert(arm.data[gi+3]);assert(outfitArm.data[gi+3]);assert(weapon.data[(pose.weapon.tip[1]*256+pose.weapon.tip[0])*4+3]);
const torsoCentre=(m.torsoMeasurement[1]+m.torsoMeasurement[2])/2,headCentre=(hb[0]+hb[2])/2;assert.equal(headCentre-torsoCentre,3);
const result={pass:true,canvas:[256,240],origin:[128,224],nominalHeight:96,opaqueHeight:all[3]-all[1]+1,crownY:hb[1],chinY:hb[3],headHeight:hb[3]-hb[1]+1,headCentreX:headCentre,torsoCentreX:torsoCentre,headTranslation:manifest.headTranslation,shoulderWidth,shoulderMeasurementRow:169,chestWidth:chest,chestMeasurementRow:178,hipsY:m.hipsY,chinToHips:m.hipsY-hb[3],legLength:224-m.legStartY,legWidthsAt214:legWidths,legRangesAt214:legRuns,armWidthsAt180:{near:nearWidth,far:farWidth},collarOverlapRows:m.collarRows,collarOverlapPixels:collarOverlap,visibleNeckPixels:neckVisible,visibleBodySkinPixels:visibleBodySkin,uncoveredBodyPixels:uncovered,uncoveredNearArmPixels:armUncovered,silhouetteDifferenceExcludingTails:silhouette,feetRow:223,feet,binaryAlpha:true,compositeEqualsStack:true,preservedFilesPass:true,weapon:pose.weapon,sha256:Object.fromEntries(manifest.layerOrder.map(p=>[p,hash(p)]))};
fs.writeFileSync(root+folder+'validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
