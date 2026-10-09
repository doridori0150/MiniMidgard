import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('.',import.meta.url));
const required=['r6_lineup.png','r6_dot_strength.png','r6_walk.png','r6_attack.png','r6_walk.gif','r6_attack.gif','r6_field.png','NOTES.md','PROMPTS.json'];
for(const file of required)assert(existsSync(root+file),`Missing ${file}`);
function size(path){const p=readFileSync(root+path);return [p.readUInt32BE(16),p.readUInt32BE(20)];}
assert.deepEqual(size('r6_field.png'),[390,844]);
const records={};
for(const kind of ['walk','attack']){
 const r=spawnSync('/opt/homebrew/bin/ffprobe',['-v','error','-select_streams','v','-show_entries','frame=pts_time,duration_time:stream=width,height,nb_frames,duration','-of','json',root+`r6_${kind}.gif`]);assert.equal(r.status,0);
 const data=JSON.parse(r.stdout);assert.equal(data.frames.length,8);assert.equal(+data.streams[0].nb_frames,8);assert.deepEqual([data.streams[0].width,data.streams[0].height],[432,348]);
 const pts=data.frames.map(f=>Math.round(+f.pts_time*1000));
 assert.deepEqual(pts,kind==='walk'?[0,90,180,270,360,450,540,630]:[0,50,100,140,200,270,350,440]);
 const frames=[];
 for(let n=1;n<=8;n++){
  const id=String(n).padStart(2,'0'),path=`frames/${kind}_${id}_1x.png`;
  assert.deepEqual(size(path),[144,116]);assert.deepEqual(size(`frames/${kind}_${id}_3x.png`),[432,348]);
  const raw=spawnSync('/opt/homebrew/bin/ffmpeg',['-v','error','-i',root+path,'-f','rawvideo','-pix_fmt','rgb24','-']).stdout;
  let minX=144,maxX=-1,minY=116,maxY=-1;
  for(let y=0;y<116;y++)for(let x=0;x<144;x++){let i=(y*144+x)*3;if(Math.min(raw[i],raw[i+1],raw[i+2])<210){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
  assert(minX>0&&maxX<143&&minY>0&&maxY<115,'Clipping '+path);
  assert.equal(maxY,102,'Ground registration '+path);
  frames.push({frame:n,contentBounds:[minX,minY,maxX,maxY]});
 }
 records[kind]={frameCount:8,size:[432,348],ptsMs:pts,durationMs:Math.round(+data.streams[0].duration*1000),frames};
}
const result={requiredFiles:required.map(file=>({file,...(file.endsWith('.png')?{size:size(file)}:{})})),motion:records,automatedChecks:'pass',visualChecks:'See NOTES.md; hand/facing/leg order checked on every selected generated frame and final contact sheets.'};
writeFileSync(root+'VALIDATION.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
