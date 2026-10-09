import {writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('.',import.meta.url)),w=1776,h=888,d=Buffer.alloc(w*h*3,255);
function dot(x,y,r,c){for(let j=Math.floor(y-r);j<=y+r;j++)for(let i=Math.floor(x-r);i<=x+r;i++)if(i>=0&&i<w&&j>=0&&j<h&&(i-x)**2+(j-y)**2<=r*r){let p=(j*w+i)*3;d[p]=c[0];d[p+1]=c[1];d[p+2]=c[2];}}
function line(a,b,r,c,ox,oy){const n=Math.hypot(a[0]-b[0],a[1]-b[1]);for(let t=0;t<=n;t++)dot(ox+a[0]+(b[0]-a[0])*t/n,oy+a[1]+(b[1]-a[1])*t/n,r,c);}
const near=[[[170,340],[150,420]],[[180,340],[175,400]],[[235,320],[235,390]],[[275,320],[285,408]],[[265,340],[300,420]],[[250,350],[270,420]],[[230,350],[235,420]],[[210,350],[200,420]]];
const far=[[[280,330],[310,420]],[[260,350],[280,420]],[[248,350],[250,420]],[[220,350],[205,420]],[[190,350],[150,420]],[[190,330],[175,400]],[[255,325],[245,390]],[[280,320],[285,408]]];
for(let n=0;n<8;n++){let ox=n%4*444,oy=Math.floor(n/4)*444;
dot(ox+225,oy+75,43,[170,150,120]);line([215,115],[218,265],20,[140,140,140],ox,oy);line([190,140],[250,145],10,[140,140,140],ox,oy);
line([235,265],far[n][0],13,[55,115,210],ox,oy);line(far[n][0],far[n][1],12,[55,115,210],ox,oy);line(far[n][1],[far[n][1][0]+25,far[n][1][1]],10,[55,115,210],ox,oy);
line([200,265],near[n][0],14,[210,65,55],ox,oy);line(near[n][0],near[n][1],13,[210,65,55],ox,oy);line(near[n][1],[near[n][1][0]+25,near[n][1][1]],10,[210,65,55],ox,oy);
line([190,145],[150,245],9,[140,140,140],ox,oy);line([150,250],[320,400],4,[105,105,105],ox,oy);
}
const r=spawnSync('/opt/homebrew/bin/ffmpeg',['-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',`${w}x${h}`,'-i','-','-frames:v','1',base+'walk_pose_guide.png'],{input:d});if(r.status)throw Error(r.stderr.toString());
