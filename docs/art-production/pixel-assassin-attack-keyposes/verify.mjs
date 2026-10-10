import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {root,read,blank,paste,scale,bbox} from './prepare.mjs';
const project=path.resolve(root,'../../..');
const eq=(a,b)=>a.width===b.width&&a.height===b.height&&Buffer.from(a.data).equals(Buffer.from(b.data));
const opaque=(a,p)=>a.data[(p[1]*a.width+p[0])*4+3]===255;
const dirs=['1_wind_up','2_apex','3_contact','4_recovery'];
const layerNames=['hair_back','body','hair_front','katar','grip'];
const allowedHair=new Set(['faf0d7','e1cdb8','b49b91','49342f']);
const report={status:'passed',scope:'납품 파일 규격·좌표·팔레트·합성 검증. 외형 승인이나 애니메이션 연결성 합격을 의미하지 않는다.',poses:[],checks:[],sha256:{}};
let full=blank(512,120),metas=[],composites=[];
const palette=new Set();const ref=read(path.join(project,'docs/art/ssot/look_assassin_idle0_1x.png'));
for(let i=0;i<ref.data.length;i+=4)if(ref.data[i+3])palette.add(Buffer.from(ref.data.slice(i,i+3)).toString('hex'));
for(const [index,dir]of dirs.entries()){
 const p=path.join(root,'poses',dir),m=JSON.parse(fs.readFileSync(path.join(p,'pose.json')));metas.push(m);
 assert.deepEqual(m.canvas,[128,120]);assert.deepEqual(m.origin,[64,112]);assert.equal(m.weapon.hand,'near');
 assert.deepEqual(m.layerOrder,layerNames);
 let layers={},composite=blank(),counts={};
 for(const name of layerNames){const a=read(path.join(p,name+'.png'));layers[name]=a;assert.equal(a.width,128);assert.equal(a.height,120);assert.equal(a.info.crcErrors,0);counts[name]=0;
   for(let i=0;i<a.data.length;i+=4){assert(a.data[i+3]===0||a.data[i+3]===255,'반투명 픽셀');if(a.data[i+3]){counts[name]++;const color=Buffer.from(a.data.slice(i,i+3)).toString('hex');assert(palette.has(color),'승인 팔레트 밖 색');if(name.startsWith('hair'))assert(allowedHair.has(color),'머리 키색 밖 색');}}
   assert(counts[name]>0,'빈 레이어 '+dir+'/'+name);paste(composite,a);
 }
 const b=bbox(composite),h=bbox(paste(paste(blank(),layers.hair_back),layers.hair_front));
 assert(b[0]>0&&b[1]>0&&b[2]<127&&b[3]<119,'캔버스 경계 잘림');assert.equal(b[3],111);
 assert(h[2]-h[0]+1<=30,'머리 폭');assert(h[2]-h[0]+1>=25,'머리 축소');
 assert(opaque(layers.katar,m.weapon.tipPoint),'칼끝이 무기 레이어 밖');assert(opaque(layers.grip,m.weapon.gripPoint),'손 좌표가 그립 밖');
 assert(eq(composite,read(path.join(p,'composite.png'))),'레이어 재합성 불일치');assert(eq(scale(composite,4),read(path.join(p,'composite_4x.png'))),'4배 확대 불일치');
 const angle=Math.atan2(m.weapon.tipPoint[1]-m.weapon.gripPoint[1],m.weapon.tipPoint[0]-m.weapon.gripPoint[0])*180/Math.PI;
 assert(Math.abs(angle-m.weapon.angleDegrees)<.01);
 paste(full,composite,index*128);composites.push(composite);
 report.poses.push({role:m.role,boundsInclusive:b,height:b[3]-b[1]+1,hairWidth:h[2]-h[0]+1,hairHeight:h[3]-h[1]+1,opaquePixels:counts,grip:m.weapon.gripPoint,tip:m.weapon.tipPoint,angleDegrees:m.weapon.angleDegrees,smearOnWeaponLayer:m.weapon.smear});
}
assert(report.poses.every((p,i)=>i===1||p.height>report.poses[1].height),'정점이 최저가 아님');
assert(metas.every((m,i)=>i===2||m.weapon.tipPoint[0]<metas[2].weapon.tipPoint[0]),'접촉 칼끝이 최전방 아님');
assert(metas[0].weapon.tipPoint[0]<metas[0].weapon.gripPoint[0]);assert(metas[1].weapon.tipPoint[0]<metas[1].weapon.gripPoint[0]);
assert(report.poses[3].height>report.poses[2].height,'회수 상승 없음');
assert(eq(full,read(path.join(root,'keyposes.png'))));assert(eq(scale(full,4),read(path.join(root,'keyposes_4x.png'))));
const comp=blank(768,120);paste(comp,read(path.join(project,'docs/art/ssot/style_knight_r15_idle0_1x.png')));paste(comp,ref,128);composites.forEach((a,i)=>paste(comp,a,(i+2)*128));
const both=blank(3072,600);paste(both,comp);paste(both,scale(comp,4),0,120);assert(eq(both,read(path.join(root,'side_by_side.png'))));
assert.equal(fs.readFileSync(path.join(root,'REQUEST.md'),'utf8'),fs.readFileSync(path.join(project,'docs/art/requests/2026-10-10-assassin-attack-keyposes.md'),'utf8'),'의뢰 원문 변경');
const prompts=JSON.parse(fs.readFileSync(path.join(root,'PROMPTS.json')));assert.equal(prompts.previous_generated_image_used_as_reference,false);
report.checks=['요청 원문·사용자 말·그림 규칙 원문 보존','4개 포즈, 각 5개 비어 있지 않은 RGBA 레이어','128×120 및 발 기준 y=112','알파 0/255, 캔버스 여백','승인 팔레트 및 머리 4색','머리 폭 30px 이하, 축소 여부 수치 기록','그립·칼끝 실제 픽셀 및 각도','정점 최저 높이·접촉 최전방 칼끝·회수 상승','게임 레이어 순서 재합성 일치','512×120 시트 및 최근접 4배 일치','승인 원본을 직접 읽은 비교 시트 일치'];
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
for(const p of walk(root).filter(p=>p.endsWith('.png')))report.sha256[path.relative(root,p)]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const forbidden=['docs/art/ssot/style_knight_r15_idle0_1x.png','docs/art/ssot/style_knight_r15_idle0_4x.png','docs/art/ssot/look_assassin_idle0_1x.png','docs/art/ssot/look_assassin_idle0_4x.png'];
for(const p of forbidden){const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(project,p))).digest('hex');assert(!Object.values(report.sha256).includes(hash),'첨부 원본 복사 발견');}
const external='/var/folders/xn/2x8krcw92gb9y7rcx0697pfh0000gn/T/minimidgard-ro/job12-male-w1.png';
if(fs.existsSync(external)){const hash=crypto.createHash('sha256').update(fs.readFileSync(external)).digest('hex');assert(!Object.values(report.sha256).includes(hash),'타 게임 원본 복사 발견');report.checks.push('첨부 네 승인 PNG 및 외부 RO 시트 원본이 납품 폴더에 복사되지 않음');}
fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,poses:report.poses,checkCount:report.checks.length},null,2));
