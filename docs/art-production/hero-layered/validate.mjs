import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {read,blank,bbox,paste,hex} from './pixels.mjs';
const root=new URL('.',import.meta.url).pathname;
const get=p=>read(root+p),j=p=>JSON.parse(fs.readFileSync(root+p));
const paths=j('concept/assassin_male_idle/layers.json').layerOrder;
const images=paths.map(get),[body,outfit,head,arm,outfitArm,weapon,grip]=images;
const pose=j('bodies/male/idle/1_base/pose.json'),pivot=j('heads/assassin_male/pivot.json');
let binary=true,sizes=true;
for(const a of images){sizes&&=a.width===256&&a.height===240;for(let i=3;i<a.data.length;i+=4)binary&&=a.data[i]===0||a.data[i]===255;}
assert(sizes&&binary);
const c=blank();images.forEach(a=>paste(c,a));const final=get('concept/assassin_male_idle/composite.png');
const equal=Buffer.from(c.data).equals(Buffer.from(final.data));assert(equal);
const b=bbox(c),hb=bbox(head);assert.equal(b[1],128);assert.equal(b[3],223);assert.equal(b[3]-b[1]+1,96);assert(hb[3]-hb[1]+1>=36&&hb[3]-hb[1]+1<=40);assert(hb[2]-hb[0]+1<=50);
assert.deepEqual(pivot.point,pose.head.point);
function runs(a,row){let rs=[],s=null;for(let x=0;x<=a.width;x++){const yes=x<a.width&&a.data[(row*a.width+x)*4+3];if(yes&&s===null)s=x;if(!yes&&s!==null){rs.push([s,x-1]);s=null}}return rs;}
const feet=runs(body,223);assert.deepEqual(runs(outfit,223),feet);assert.deepEqual(runs(final,223),feet);
assert.deepEqual(feet,[pose.feet.near,pose.feet.far]);
let uncovered=0,armUncovered=0,outlineDifference=0,topNeckVisible=0,tailPixels=0;
const regions=j('concept/assassin_male_idle/validation-masks.json');
function regionMask(rows){const a=blank();for(const[y,x0,x1]of rows)for(let x=x0;x<=x1;x++)a.data[(y*256+x)*4+3]=255;return a;}
const tails=regionMask(regions.waistTails);
for(let y=0;y<240;y++)for(let x=0;x<256;x++){
 const i=(y*256+x)*4,ba=!!body.data[i+3],aa=!!arm.data[i+3],oa=!!outfit.data[i+3],oaa=!!outfitArm.data[i+3];
 if(y>=166&&ba&&!oa)uncovered++;
 if(aa&&!oaa)armUncovered++;
 if(y>=166&&!tails.data[i+3]&&(ba||aa)!==(oa||oaa))outlineDifference++;
 if((y===164||y===165)&&ba&&!head.data[i+3])topNeckVisible++;
 if(tails.data[i+3])tailPixels++;
}
assert.equal(uncovered,0);assert.equal(armUncovered,0);assert.equal(outlineDifference,0);assert.equal(topNeckVisible,0);
const hm=regionMask(regions.hair),keys=new Set(['faf0d7','e1cdb8','b49b91','49342f'].map(h=>hex(h).join(','))),actualKeys=new Set();let hairWrong=0,white=0;
for(let i=0;i<head.data.length;i+=4){const color=Array.from(head.data.subarray(i,i+3)).join(',');if(hm.data[i+3]){actualKeys.add(color);if(!keys.has(color))hairWrong++;}if(head.data[i+3]&&color==='255,255,255')white++;}
assert.equal(hairWrong,0);assert.equal(actualKeys.size,4);assert.equal(white,2);
const tip=pose.weapon.tip;assert(weapon.data[(tip[1]*256+tip[0])*4+3]);assert.equal(pose.weapon.angle,Math.atan2(tip[1]-pose.weapon.grip[1],tip[0]-pose.weapon.grip[0])*180/Math.PI);
const result={canvas:[256,240],origin:[128,224],layerCount:7,layerSizesPass:sizes,binaryAlphaPass:binary,compositeEqualsStack:equal,crownY:hb[1],chinY:hb[3],headHeight:hb[3]-hb[1]+1,headWidthWithHair:hb[2]-hb[0]+1,bodyHeight:b[3]-b[1]+1,headRatio:(hb[3]-hb[1]+1)/96,feetRow:223,feet,uncoveredBodyClothingPixels:uncovered,uncoveredNearArmPixels:armUncovered,outfitSilhouetteDifferenceExcludingWaistTails:outlineDifference,waistTailPixels:tailPixels,visibleTopTwoNeckPixels:topNeckVisible,hairWrongColorPixels:hairWrong,hairColors:[...actualKeys],eyeHighlightPixels:white,weapon:pose.weapon,sha256:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(root+p)).digest('hex')]))};
fs.writeFileSync(root+'concept/assassin_male_idle/validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
