"""Read GIF timing without external packages."""
from pathlib import Path
import json
p=Path(__file__).resolve().parents[1]/'preview_animation.gif'
b=p.read_bytes();i=13
if b[10]&128:i+=3*(2**((b[10]&7)+1))
delays=[];delay=0;loop=None
while i<len(b):
    kind=b[i];i+=1
    if kind==0x3b:break
    if kind==0x21:
        ext=b[i];i+=1;blocks=[]
        while b[i]:
            n=b[i];i+=1;blocks.append(b[i:i+n]);i+=n
        i+=1
        if ext==0xf9:delay=int.from_bytes(blocks[0][1:3],'little')*10
        if ext==0xff and blocks[0]==b'NETSCAPE2.0':loop=int.from_bytes(blocks[1][1:3],'little')
    elif kind==0x2c:
        flags=b[i+8];i+=9
        if flags&128:i+=3*(2**((flags&7)+1))
        i+=1
        while b[i]:i+=1+b[i]
        i+=1;delays.append(delay)
    else:raise AssertionError((i,kind))
assert len(delays)==80 and set(delays)=={40} and loop==0
out=dict(file=p.name,frames=len(delays),frameDurationMs=40,durationMs=sum(delays),loop=loop,status='pass')
(p.parent/'verification/gif_report.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out))
