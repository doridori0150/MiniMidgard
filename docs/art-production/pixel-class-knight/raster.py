"""Small dependency-free RGBA PNG / nearest-neighbour / GIF asset utilities."""
import struct, zlib
from pathlib import Path

T=(0,0,0,0)
def blank(w,h,color=T): return [w,h,[color]*(w*h)]
def read(path):
    data=Path(path).read_bytes(); pos=8; compressed=[]; palette=[]; alpha=[]
    while pos<len(data):
        n=struct.unpack('>I',data[pos:pos+4])[0]; tag=data[pos+4:pos+8]; val=data[pos+8:pos+8+n]; pos+=n+12
        if tag==b'IHDR': w,h,depth,ct,_,_,inter=struct.unpack('>IIBBBBB',val)
        elif tag==b'IDAT': compressed.append(val)
        elif tag==b'PLTE': palette=[tuple(val[i:i+3]) for i in range(0,len(val),3)]
        elif tag==b'tRNS': alpha=list(val)
    assert depth==8 and ct in (2,3,6) and inter==0,(path,depth,ct,inter)
    bpp={2:3,3:1,6:4}[ct]; stride=w*bpp; raw=zlib.decompress(b''.join(compressed)); prev=bytearray(stride); pixels=[]
    for y in range(h):
        off=y*(stride+1); filt=raw[off]; row=bytearray(raw[off+1:off+1+stride])
        for i in range(stride):
            a=row[i-bpp] if i>=bpp else 0; b=prev[i]; c=prev[i-bpp] if i>=bpp else 0
            if filt==1: v=a
            elif filt==2: v=b
            elif filt==3: v=(a+b)//2
            elif filt==4:
                p=a+b-c; pa,pb,pc=abs(p-a),abs(p-b),abs(p-c); v=a if pa<=pb and pa<=pc else b if pb<=pc else c
            else: v=0
            row[i]=(row[i]+v)&255
        if ct==3: pixels.extend(palette[v]+(alpha[v] if v<len(alpha) else 255,) for v in row)
        else: pixels.extend(tuple(row[i:i+bpp])+((255,) if ct==2 else ()) for i in range(0,stride,bpp))
        prev=row
    return [w,h,pixels]
def save(im,path):
    w,h,p=im
    def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
    raw=b''.join(b'\0'+bytes(v for px in p[y*w:(y+1)*w] for v in px) for y in range(h))
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
def get(im,x,y):return im[2][y*im[0]+x] if 0<=x<im[0] and 0<=y<im[1] else T
def put(im,x,y,p):
    if 0<=x<im[0] and 0<=y<im[1]: im[2][y*im[0]+x]=p
def paste(dst,src,dx=0,dy=0):
    for y in range(src[1]):
        for x in range(src[0]):
            p=get(src,x,y)
            if p[3]:put(dst,x+dx,y+dy,p)
def resize(im,w,h):return [w,h,[get(im,min(im[0]-1,int((x+.5)*im[0]/w)),min(im[1]-1,int((y+.5)*im[1]/h))) for y in range(h) for x in range(w)]]
def crop(im,box):
    x0,y0,x1,y1=box
    return [x1-x0,y1-y0,[get(im,x,y) for y in range(y0,y1) for x in range(x0,x1)]]
def bounds(im):
    pts=[(i%im[0],i//im[0]) for i,p in enumerate(im[2]) if p[3]]
    return (min(x for x,y in pts),min(y for x,y in pts),max(x for x,y in pts)+1,max(y for x,y in pts)+1) if pts else None
def inside(x,y,poly):
    yes=False;j=len(poly)-1
    for i,(xi,yi) in enumerate(poly):
        xj,yj=poly[j]
        if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:yes=not yes
        j=i
    return yes
def nearest(p,palette):return min(palette,key=lambda q:sum((a-b)**2 for a,b in zip(p[:3],q[:3])))
FONT={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111']}
def number(im,x,y,n,scale=1):
    for c in str(n):
        for yy,row in enumerate(FONT[c]):
            for xx,v in enumerate(row):
                if v=='1':
                    for dy in range(scale):
                        for dx in range(scale):put(im,x+xx*scale+dx,y+yy*scale+dy,(255,200,100,255))
        x+=4*scale
def grid(im,path):
    s=10;out=blank(im[0]*s+24,im[1]*s+24,(38,50,62,255));paste(out,resize(im,im[0]*s,im[1]*s),24,24)
    for x in range(0,im[0],5):
        number(out,24+x*s,8,x)
        for y in range(24,out[1]):
            if y%3==0:put(out,24+x*s,y,(120,95,90,255))
    for y in range(0,im[1],5):
        number(out,4,24+y*s,y)
        for x in range(24,out[0]):
            if x%3==0:put(out,x,24+y*s,(120,95,90,255))
    save(out,path)
def gif(frames,durations,path):
    """Lossless indexed GIF. Reset LZW before its code width changes."""
    w,h=frames[0][:2]; colors=list(dict.fromkeys(p[:3] for f in frames for p in f[2]));assert len(colors)<=256
    table={p:i for i,p in enumerate(colors)};colors+= [(0,0,0)]*(256-len(colors))
    out=bytearray(b'GIF89a'+struct.pack('<HHBBB',w,h,247,0,0)+bytes(v for p in colors for v in p))
    out+=b'!\xff\x0bNETSCAPE2.0\x03\x01\x00\x00\x00'
    for f,ms in zip(frames,durations):
        out+=b'!\xf9\x04\x08'+struct.pack('<H',round(ms/10))+b'\x00\x00'
        out+=b','+struct.pack('<HHHHB',0,0,w,h,0)+b'\x08'
        vals=[table[p[:3]] for p in f[2]];codes=[]
        for i in range(0,len(vals),240): codes.extend([256]+vals[i:i+240])
        codes.append(257);data=bytearray();acc=bits=0
        for c in codes:
            acc|=c<<bits;bits+=9
            while bits>=8:data.append(acc&255);acc>>=8;bits-=8
        if bits:data.append(acc&255)
        for i in range(0,len(data),255):s=data[i:i+255];out.append(len(s));out+=s
        out+=b'\0'
    out+=b';';Path(path).write_bytes(out)
