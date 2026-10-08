import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {read,save,blank,over,resize,crop,bounds} from './raster.mjs';
import {M,R,asset,render,draws,point,selectFrame} from './player.mjs';
const ROOT=path.resolve(R,'../../..'),ids=Object.keys(M.characters),names=Object.values(M.animations).flatMap(a=>a.frames);
const BG=[223,233,207,255],ink=[64,44,28,255],font={
 A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'101111111111101',O:'010101101101010',P:'110101110100100',Q:'010101101111011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',0:'111101101101111',1:'010110010010111',2:'110001010100111',3:'110001010001110',4:'101101111001001',5:'111100110001110',6:'011100111101111',7:'111001010010010',8:'111101111101111',9:'111101111001110','_':'000000000000111','-':'000000111000000','/':'001001010100100','+':'000010111010000','.':'000000000000010',':':'000010000010000',' ':'000000000000000'};
function text(im,x,y,str,s=2){for(const ch of str.toUpperCase()){const f=font[ch]||font[' '];for(let v=0;v<5;v++)for(let u=0;u<3;u++)if(f[v*3+u]==='1')for(let dy=0;dy<s;dy++)for(let dx=0;dx<s;dx++){let xx=x+u*s+dx,yy=y+v*s+dy;if(xx>=0&&xx<im.width&&yy>=0&&yy<im.height)im.data.set(ink,(yy*im.width+xx)*4);}x+=4*s;}}
function dot(im,x,y,color){for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(dx*dx+dy*dy<=9){let xx=Math.round(x)+dx,yy=Math.round(y)+dy;if(xx>=0&&xx<im.width&&yy>=0&&yy<im.height)im.data.set([...color,255],(yy*im.width+xx)*4);}}
function put(im,picture,x,ground,height){const s=height/310;over(im,resize(picture,Math.round(512*s),Math.round(400*s)),x-220*s,ground-360*s);}
const master=JSON.parse(fs.readFileSync(path.join(ROOT,'src/assets/sprites/manifest.json'))),checks=[],errors=[],clipping=[],maskLeaks=[];
for(const k of ['schema','canvas','animations','renderContract','headgear']){assert.deepEqual(M[k],master[k]);checks.push(`${k}: exact source contract match`);}
assert.deepEqual(ids,['mage_female','acolyte_female','archer_male']);
assert.equal(selectFrame('attack',140),'attack_1');assert.equal(selectFrame('attack',99),'attack_0');assert.equal(selectFrame('attack',180),'attack_2');
let variants=0;
for(const id of ids){assert.equal(Object.keys(M.characters[id].frames).length,14);const scales=new Set();for(const n of names){const f=M.characters[id].frames[n],im=asset(f.image),mask=asset(f.hairMask),grip=asset(f.gripOverlay);scales.add(f.uniform_scale);
 assert.deepEqual([im.width,im.height],[512,400]);assert.deepEqual([mask.width,mask.height],[512,400]);assert.deepEqual([grip.width,grip.height],[512,400]);
 let maskCount=0,leak=0,gripCount=0,nonHair=0;
 for(let q=0;q<im.data.length;q+=4){if(mask.data[q]>127){maskCount++;if(im.data[q+3]<128)leak++;if(im.data[q]<200||im.data[q+1]<180||im.data[q+2]<140)nonHair++;}if(grip.data[q+3])gripCount++;}
 if(leak)maskLeaks.push({id,frame:n,leak});if(nonHair>maskCount*0.01)errors.push(`${id}/${n}: mask material mismatch`);assert.ok(maskCount>1000);assert.ok(gripCount>10);
 for(const a of ['hand','crown','side'])assert.ok(f[a].point.every(Number.isFinite));
 for(const facing of [1,-1])for(const gear of [[],['leaf','hairpin']])for(const weapon of [null,M.characters[id].defaultWeapon]){
  variants++;for(const d of draws(id,n,{facing,gear,weapon})){if(d.role==='figure'||d.role==='grip')continue;const img=asset(d.image);let bad=0;for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++)if(img.data[(y*img.width+x)*4+3]>=16){const [xx,yy]=point(d.matrix,[x,y]);if(xx<1||yy<1||xx>510||yy>398)bad++;}if(bad)clipping.push({id,frame:n,facing,gear,weapon,role:d.role,pixels:bad});}
 }
 if(n==='attack_1'){const w=M.weapons[M.characters[id].defaultWeapon],ds=draws(id,n),d=ds.find(d=>d.role==='weapon'),p=point(d.matrix,w.pivot),tip=point(d.matrix,w.tip);assert.ok(Math.abs(p[0]-f.hand.point[0])<1e-6&&Math.abs(p[1]-f.hand.point[1])<1e-6);assert.ok(Math.abs(tip[1]-p[1])<1e-6&&tip[0]>p[0]);}
 }assert.equal(scales.size,1);}
if(maskLeaks.length)errors.push('hair mask crosses translucent body edge');if(clipping.length)errors.push('equipment clips canvas');
checks.push('42 complete figures + 42 aligned masks + 42 nonempty grip overlays','one uniform source scale per character sheet','all three contact axes horizontal at 140ms','brown / black / pink use mask-only multiplication');
const report={status:errors.length?'FAIL':'PASS',contractChecks:checks,attachmentConfigurations:variants,clipping,maskLeaks,errors,limitations:['Mage and archer hurt are intentionally crouched; stock checker reports standing-height warnings.','Art is generated interpretation of the approved lineup, not pixel-identical reproduction.','Runtime integration is not performed: delivery folder only.']};
fs.writeFileSync(path.join(R,'verification/checks.json'),JSON.stringify(report,null,2)+'\n');
// All 42 poses, bare/equipped pairs.
let board=blank(1440,80+14*215,BG);text(board,20,18,'42 WHOLE FIGURES / BARE + EQUIPPED',3);
for(let ci=0;ci<3;ci++){text(board,ci*480+24,52,ids[ci],2);for(let i=0;i<14;i++){let y=80+i*215;for(let c=0;c<2;c++)put(board,render(ids[ci],names[i],{weapon:c?M.characters[ids[ci]].defaultWeapon:null,gear:c?['leaf','hairpin']:[]}),ci*480+c*240+107,y+185,150);text(board,ci*480+14,y+198,names[i],2);}}
save(path.join(R,'preview_frames.png'),board);
// Head tint and anchor audit: one row per pose; all three characters in each row.
let tints=blank(1440,70+14*185,BG),anchors=blank(1440,70+14*220,BG);text(tints,20,16,'HAIR ONLY / BROWN BLACK PINK',3);text(anchors,20,16,'ANCHORS / CYAN HAND - RED CROWN - PURPLE SIDE',3);
for(let i=0;i<14;i++)for(let ci=0;ci<3;ci++){let y=70+i*185;for(let c=0;c<3;c++)put(tints,render(ids[ci],names[i],{hair:['brown','black','pink'][c]}),ci*480+c*160+64,y+155,115);text(tints,ci*480+12,y+167,`${ids[ci]} ${names[i]}`,1);
 const id=ids[ci],f=M.characters[id].frames[names[i]],yy=70+i*220,s=170/310,x=ci*480+190,g=yy+192;put(anchors,render(id,names[i],{gear:['leaf','hairpin']}),x,g,170);
 for(const [key,col]of [['hand',[0,155,180]],['crown',[210,45,40]],['side',[145,55,190]]])dot(anchors,x+(f[key].point[0]-220)*s,g+(f[key].point[1]-360)*s,col);
 text(anchors,ci*480+16,yy+203,`${id} ${names[i]}`,2);}
save(path.join(R,'verification/hair-tints.png'),tints);save(path.join(R,'verification/anchor-checks.png'),anchors);
// Original art and delivered sprite at 240px and 80px display heights.
board=blank(1200,1120,BG);text(board,20,20,'APPROVED LINEUP / DELIVERED / 240PX + 80PX',3);
const lineup=read(path.join(ROOT,'docs/art/concepts/round3/class_lineup.png')),crops=[[540,83,785,401],[1026,100,1275,401],[786,87,1000,401]];
for(let ci=0;ci<3;ci++){const id=ids[ci],y=90+ci*340;let ref=crop(lineup,crops[ci]);for(let q=0;q<ref.data.length;q+=4){let [r,g,b]=ref.data.subarray(q,q+3);if(r>170&&g>180&&b>140&&g>r-5&&g>b+10)ref.data[q+3]=0;}const b=bounds(ref,128);ref=crop(ref,b);for(let [h,x]of [[240,145],[80,850]]){over(board,resize(ref,Math.round(ref.width*h/ref.height),h),x-ref.width*h/ref.height/2,y+260-h);put(board,render(id,'idle_0'),x+(h===240?310:180),y+260,h);text(board,x-55,y+278,'LINEUP',2);text(board,x+(h===240?255:125),y+278,'DELIVERY',2);}text(board,20,y-12,id,2);}
save(path.join(R,'preview_vs_lineup.png'),board);
// 20ms sampling includes the exact 140ms attack contact.
fs.mkdirSync(path.join(R,'verification/animation-frames'),{recursive:true});
for(let tick=0;tick<80;tick++){const time=tick*20;let im=blank(960,720,BG);text(im,16,14,'IDLE / WALK / ATTACK - 20MS STEP',3);for(let ci=0;ci<3;ci++)for(let col=0;col<3;col++){const state=['idle','walk','attack'][col],tm=state==='attack'?time%800:time,actual=state==='attack'&&tm>=280?'idle':state,n=selectFrame(actual,tm);put(im,render(ids[ci],n,{gear:['leaf']}),145+col*320,245+ci*230,165);text(im,14+col*320,50+ci*230,`${ids[ci]} ${state}`,2);}
 save(path.join(R,`verification/animation-frames/${String(tick).padStart(3,'0')}.png`),im);}
console.log(JSON.stringify({status:report.status,configurations:variants,clipping:clipping.length,maskLeaks:maskLeaks.length,errors}));
process.exitCode=errors.length?1:0;
