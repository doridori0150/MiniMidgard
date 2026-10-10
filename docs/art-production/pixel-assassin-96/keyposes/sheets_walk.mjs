import fs from 'node:fs';import path from 'node:path';
import {root,read,save,blank,paste,scale,crop,json} from './work.mjs';
export const ids=['walk_1_contact_near','walk_5_down_near','walk_2_pass_near','walk_6_up_near','walk_3_contact_far','walk_7_down_far','walk_4_pass_far','walk_8_up_far'];
const sheet=blank(256*8,240),review=blank(96*4,108*2);
for(const [i,id]of ids.entries()){
 const im=read(path.join(root,id,'composite.png'));
 paste(sheet,im,256*i);paste(review,crop(im,80,120,96,108),96*(i%4),108*Math.floor(i/4));
}
save(path.join(root,'keyposes_walk.png'),sheet);save(path.join(root,'keyposes_walk_4x.png'),scale(sheet,4));
save(path.join(root,'review_walk_3x.png'),scale(review,3));
const generated=ids.filter(id=>!['walk_1_contact_near','walk_3_contact_far'].includes(id)),layerNames=['hair_back','body','hair_front','katar','grip'],layerReview=blank(480,648);
for(let row=0;row<generated.length;row++)for(let col=0;col<layerNames.length;col++)paste(layerReview,crop(read(path.join(root,generated[row],layerNames[col]+'.png')),80,120,96,108),col*96,row*108);
save(path.join(root,'review_walk_layers_2x.png'),scale(layerReview,2));
json('walk_playback.json',{schema:'assassin96-walk-review@1',sheet:'keyposes_walk.png',canvas:[256,240],origin:[128,224],loop:true,totalMs:720,frames:ids.map((id,index)=>({index,id,ms:90,dx:0,dy:0}))});
const rows=ids.map(id=>({id,...JSON.parse(fs.readFileSync(path.join(root,id,'pose.json')))}));
fs.writeFileSync(path.join(root,'walk_preview.html'),`<!doctype html><html lang="ko"><meta charset="utf-8"><title>어새신 96px 걷기 검수</title><style>
body{background:#20242c;color:#f4ebd5;font:16px system-ui;margin:24px}canvas{image-rendering:pixelated;background:#343b47;border:1px solid #64748b}button,input{margin:12px 8px 12px 0}section{display:flex;gap:24px;align-items:flex-start}p{max-width:700px}#label{white-space:pre-line}</style>
<h1>걷기 8장 · 90ms · 720ms</h1><p>접지 → 내려앉음 → 통과 → 올라섬 × 2. 발 기준점 (128,224), 그림 이동 없음.</p><section><div><canvas id="stage" width="384" height="432"></canvas><br><button id="play">일시 정지</button><button id="prev">이전 장</button><button id="next">다음 장</button><br><label><input id="guide" type="checkbox" checked>기준선 표시</label><br><input id="frame" type="range" min="0" max="7" value="0"></div><p id="label"></p></section>
<script>const rows=${JSON.stringify(rows)};const im=new Image();im.src='keyposes_walk.png';const c=document.querySelector('canvas'),ctx=c.getContext('2d');let idx=0,playing=true,last=0;ctx.imageSmoothingEnabled=false;
function draw(){ctx.clearRect(0,0,384,432);ctx.drawImage(im,idx*256+80,120,96,108,0,0,384,432);if(document.querySelector('#guide').checked){ctx.strokeStyle='#98adc455';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,416.5);ctx.lineTo(384,416.5);ctx.moveTo(192.5,0);ctx.lineTo(192.5,432);ctx.stroke();}document.querySelector('#frame').value=idx;const p=rows[idx];document.querySelector('#label').textContent=(idx+1)+' / 8 — '+p.id+'\n정수리 y = '+p.head.crownY+'\n223행 발 범위 = '+JSON.stringify(p.feet.opaqueRanges)+'\n가까운 발 = '+JSON.stringify(p.feet.near)+'\n먼 발 = '+JSON.stringify(p.feet.far)+'\n머리 폭 = '+p.head.width+'px';}
document.querySelector('#play').onclick=()=>{playing=!playing;document.querySelector('#play').textContent=playing?'일시 정지':'재생';};function step(n){playing=false;document.querySelector('#play').textContent='재생';idx=(idx+n+8)%8;draw();}document.querySelector('#prev').onclick=()=>step(-1);document.querySelector('#next').onclick=()=>step(1);document.querySelector('#frame').oninput=e=>{idx=+e.target.value;step(0);};document.querySelector('#guide').onchange=draw;
im.onload=()=>{draw();requestAnimationFrame(function tick(t){if(playing&&t-last>=90){const steps=Math.floor((t-last)/90);idx=(idx+steps)%8;last+=steps*90;draw();}else if(!playing)last=t;requestAnimationFrame(tick);});};</script></html>`);
