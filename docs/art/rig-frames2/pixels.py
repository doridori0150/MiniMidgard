"""Small deterministic RGBA PNG utility (stdlib only). No image-generation dependency."""
import struct,zlib
from pathlib import Path

def write(path,w,h,data):
    def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
    rows=b''.join(b'\0'+data[y*w*4:(y+1)*w*4] for y in range(h))
    Path(path).parent.mkdir(parents=True,exist_ok=True)
    Path(path).write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>2I5B',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))

def read(path):
    b=Path(path).read_bytes();pos=8;parts=[]
    while pos<len(b):
        n=struct.unpack('>I',b[pos:pos+4])[0];t=b[pos+4:pos+8];d=b[pos+8:pos+8+n];pos+=n+12
        if t==b'IHDR':w,h,depth,typ,_,_,interlace=struct.unpack('>2I5B',d)
        if t==b'IDAT':parts.append(d)
    assert depth==8 and typ in (2,6) and not interlace,(path,depth,typ,interlace)
    raw=zlib.decompress(b''.join(parts));stride=w*(4 if typ==6 else 3);bpp=4 if typ==6 else 3;out=bytearray();prev=bytearray(stride);p=0
    for y in range(h):
        f=raw[p];p+=1;row=bytearray(raw[p:p+stride]);p+=stride
        for x in range(stride):
            a=row[x-bpp] if x>=bpp else 0;c=prev[x-bpp] if x>=bpp else 0;v=prev[x]
            if f==1:row[x]=(row[x]+a)&255
            elif f==2:row[x]=(row[x]+v)&255
            elif f==3:row[x]=(row[x]+((a+v)//2))&255
            elif f==4:
                q=a+v-c;pa,pb,pc=abs(q-a),abs(q-v),abs(q-c)
                row[x]=(row[x]+(a if pa<=pb and pa<=pc else v if pb<=pc else c))&255
            else:assert f==0
        if typ==6:out.extend(row)
        else:
            for x in range(0,stride,3):out.extend(row[x:x+3]+b'\xff')
        prev=row
    return w,h,out

def bounds(w,h,b):
    xs=[];ys=[]
    for y in range(h):
        for x in range(w):
            if b[(y*w+x)*4+3]>127:xs.append(x);ys.append(y)
    return [min(xs),min(ys),max(xs)+1,max(ys)+1] if xs else [0,0,0,0]
