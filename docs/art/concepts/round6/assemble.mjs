// Generated art is made with image_gen. This script only crops, scales,
// registers frames, labels contact sheets and encodes the requested previews.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
function run(args,input){const r=spawnSync('/opt/homebrew/bin/ffmpeg',['-v','error','-y',...args],{input,maxBuffer:64*1024*1024});if(r.status!==0)throw Error(r.stderr.toString());return r.stdout;}
function read(path){const p=readFileSync(root+path),w=p.readUInt32BE(16),h=p.readUInt32BE(20);return {w,h,data:run(['-i',root+path,'-f','rawvideo','-pix_fmt','rgb24','-'])};}
function save(im,path){run(['-f','rawvideo','-pixel_format','rgb24','-video_size',`${im.w}x${im.h}`,'-i','-','-frames:v','1',root+path],im.data);}
function blank(w,h){return {w,h,data:Buffer.alloc(w*h*3,255)};}
function crop(im,x,y,w,h){let out=blank(w,h);for(let j=0;j<h;j++)im.data.copy(out.data,j*w*3,((y+j)*im.w+x)*3,((y+j)*im.w+x+w)*3);return out;}
function scale(im,w,h,flags='lanczos'){return {w,h,data:run(['-f','rawvideo','-pixel_format','rgb24','-video_size',`${im.w}x${im.h}`,'-i','-','-vf',`scale=${w}:${h}:flags=${flags}`,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],im.data)};}
function palette(im,colors){return {w:im.w,h:im.h,data:run(['-f','rawvideo','-pixel_format','rgb24','-video_size',`${im.w}x${im.h}`,'-i','-','-filter_complex',`split[a][b];[a]palettegen=max_colors=${colors}:reserve_transparent=0[p];[b][p]paletteuse=dither=none`,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],im.data)};}
function paste(dst,src,x,y){for(let j=0;j<src.h;j++)for(let i=0;i<src.w;i++){let xx=x+i,yy=y+j;if(xx<0||yy<0||xx>=dst.w||yy>=dst.h)continue;let a=(j*src.w+i)*3,b=(yy*dst.w+xx)*3;src.data.copy(dst.data,b,a,a+3);}}
const font={
'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],
'N':['10001','11001','11001','10101','10011','10011','10001'],'O':['01110','10001','10001','10001','10001','10001','01110'],'E':['11111','10000','10000','11110','10000','10000','11111'],'L':['10000','10000','10000','10000','10000','10000','11111'],'I':['11111','00100','00100','00100','00100','00100','11111'],'G':['01110','10001','10000','10111','10001','10001','01110'],'H':['10001','10001','10001','11111','10001','10001','10001'],'T':['11111','00100','00100','00100','00100','00100','00100'],'M':['10001','11011','10101','10101','10001','10001','10001'],'D':['11110','10001','10001','10001','10001','10001','11110'],'U':['10001','10001','10001','10001','10001','10001','01110'],'X':['10001','10001','01010','00100','01010','10001','10001']};
function text(im,str,cx,y,s=2){let x=Math.round(cx-(str.length*6-1)*s/2);for(let ch of str){for(let j=0;j<7;j++)for(let i=0;i<5;i++)if(font[ch]?.[j][i]==='1')for(let yy=0;yy<s;yy++)for(let xx=0;xx<s;xx++){let p=((y+j*s+yy)*im.w+x+i*s+xx)*3;im.data[p]=83;im.data[p+1]=70;im.data[p+2]=57;}x+=6*s;}}
function cleanWhite(im){for(let i=0;i<im.data.length;i+=3)if(Math.min(im.data[i],im.data[i+1],im.data[i+2])>244)im.data.fill(255,i,i+3);return im;}
const attack=read('sources/attack_generated.png');
// Same generated ready-pose art, same 80 px crown-to-sole height in all columns.
const cookie=crop(attack,90,73,244,365);
const comparison=blank(720,460);
const variants=[scale(cookie,53,80),palette(scale(cookie,53,80,'area'),96),scale(palette(scale(cookie,27,40,'area'),48),54,80,'neighbor')];
for(let i=0;i<3;i++){let im=cleanWhite(variants[i]);save(im,`frames/dot_${['none','light','medium'][i]}_1x.png`);text(comparison,['NONE','LIGHT','MEDIUM'][i],120+240*i,16,2);text(comparison,'1X',120+240*i,47,1);paste(comparison,im,120+240*i-Math.floor(im.w/2),70);text(comparison,'3X',120+240*i,170,1);paste(comparison,scale(im,im.w*3,im.h*3,'neighbor'),120+240*i-Math.floor(im.w*3/2),198);}
save(comparison,'r6_dot_strength.png');

function motion(name,source,anchors,grounds,ratio,durations,bounds){
 const sheet=read(source),small=[],large=[],record=[];
 for(let i=0;i<8;i++){
  const col=i%4,row=Math.floor(i/4),[x0,y0,x1,y1]=bounds?.[i]??[Math.round(col*sheet.w/4),Math.round(row*sheet.h/2),Math.round((col+1)*sheet.w/4),Math.round((row+1)*sheet.h/2)];
  const cell=crop(sheet,x0,y0,x1-x0,y1-y0),w=Math.round(cell.w*ratio),h=Math.round(cell.h*ratio);
  const sprite=cleanWhite(palette(scale(cell,w,h,'area'),96)),canvas=blank(144,116);
  const dx=64-Math.round((anchors[i]-x0)*w/cell.w),dy=102-Math.round((grounds[i]-y0)*h/cell.h);
  paste(canvas,sprite,dx,dy);
  let visibleGround=-1;for(let y=0;y<canvas.h;y++)for(let x=0;x<canvas.w;x++){const p=(y*canvas.w+x)*3;if(Math.min(canvas.data[p],canvas.data[p+1],canvas.data[p+2])<210)visibleGround=y;}
  const groundCorrection=102-visibleGround;
  if(groundCorrection){const shifted=blank(canvas.w,canvas.h);paste(shifted,canvas,0,groundCorrection);canvas.data=shifted.data;}
  small.push(canvas);const big=scale(canvas,432,348,'neighbor');large.push(big);
  const id=String(i+1).padStart(2,'0');save(canvas,`frames/${name}_${id}_1x.png`);save(big,`frames/${name}_${id}_3x.png`);
  record.push({frame:i+1,sourceCell:[x0,y0,cell.w,cell.h],sourceAnchor:anchors[i],sourceGround:grounds[i],scale:ratio,canvas:[144,116],groundY:102,roundingCorrectionY:groundCorrection,durationMs:durations[i]});
 }
 const board=blank(432*8,382);for(let i=0;i<8;i++){paste(board,large[i],432*i,0);text(board,String(i+1),432*i+216,357,2);}save(board,`r6_${name}.png`);
 // Concat demuxer uses an explicit 100 Hz time base, preserving centisecond GIF timing.
 const concat=record.map((f,i)=>`file '${root}frames/${name}_${String(i+1).padStart(2,'0')}_3x.png'\noption framerate 100\nduration ${f.durationMs/1000}\n`).join('');
 writeFileSync(root+`sources/${name}_timing.txt`,concat);
 run(['-f','concat','-safe','0','-i',root+`sources/${name}_timing.txt`,'-filter_complex','[0:v]split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=none','-fps_mode','vfr','-loop','0','-final_delay',String(durations.at(-1)/10),root+`r6_${name}.gif`]);
 return record;
}
const attackRecord=motion('attack','sources/attack_generated.png',[217,661,1074,1500,211,654,1082,1510],[437,438,438,440,848,848,850,850],0.219,[50,50,40,60,70,80,90,140],[[90,65,330,440],[520,90,785,440],[940,10,1205,440],[1340,70,1770,442],[50,475,450,851],[520,475,845,852],[940,470,1265,854],[1390,470,1640,855]]);
let walkRecord=[];
try{const cfg=JSON.parse(readFileSync(root+'sources/walk_registration.json','utf8'));walkRecord=motion('walk',cfg.source,cfg.anchors,cfg.grounds,cfg.scale,Array(8).fill(90),cfg.bounds);}catch(e){if(e.code!=='ENOENT')throw e;}
writeFileSync(root+'FRAME_MANIFEST.json',JSON.stringify({pixelMethod:{none:'Lanczos to 80px, full RGB',light:'Area to about 80px, 96 adaptive colors, no dithering',medium:'Area to 40px, 48 adaptive colors, nearest to 80px',zoom:'3x nearest, no interpolation'},attack:attackRecord,walk:walkRecord},null,2)+'\n');
console.log(JSON.stringify({attackFrames:attackRecord.length,walkFrames:walkRecord.length,outputs:root}));
