"""Decode every GIF with macOS ImageIO through ctypes; no compiler/module cache."""
import ctypes as C,json
from pathlib import Path
R=Path(__file__).resolve().parent
cf=C.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
io=C.CDLL('/System/Library/Frameworks/ImageIO.framework/ImageIO')
cg=C.CDLL('/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics')
P=C.c_void_p;L=C.c_long;S=C.c_size_t

def bind(lib,name,ret,args):
 f=getattr(lib,name);f.restype=ret;f.argtypes=args;return f
url=bind(cf,'CFURLCreateFromFileSystemRepresentation',P,[P,C.c_char_p,L,C.c_bool])
release=bind(cf,'CFRelease',None,[P]);value=bind(cf,'CFDictionaryGetValue',P,[P,P])
number=bind(cf,'CFNumberGetValue',C.c_bool,[P,C.c_int,P])
source=bind(io,'CGImageSourceCreateWithURL',P,[P,P]);count=bind(io,'CGImageSourceGetCount',S,[P])
frame=bind(io,'CGImageSourceCreateImageAtIndex',P,[P,S,P]);props=bind(io,'CGImageSourceCopyPropertiesAtIndex',P,[P,S,P])
width=bind(cg,'CGImageGetWidth',S,[P]);height=bind(cg,'CGImageGetHeight',S,[P])
keys={k:P.in_dll(io,k).value for k in ['kCGImagePropertyGIFDictionary','kCGImagePropertyGIFUnclampedDelayTime','kCGImagePropertyGIFDelayTime']}
result=[]
for file in sorted(R.glob('*.gif')):
 b=str(file).encode();u=url(None,b,len(b),False);s=source(u,None);assert s,file
 sizes=[];durations=[]
 for i in range(count(s)):
  im=frame(s,i,None);assert im,(file,i);sizes.append([width(im),height(im)])
  pr=props(s,i,None);gp=value(pr,keys['kCGImagePropertyGIFDictionary'])
  v=value(gp,keys['kCGImagePropertyGIFUnclampedDelayTime']) or value(gp,keys['kCGImagePropertyGIFDelayTime'])
  delay=C.c_double();assert number(v,13,C.byref(delay));durations.append(delay.value*1000)
  release(pr);release(im)
 result.append({'file':file.name,'frames':count(s),'durations':durations,'sizes':sizes});release(s);release(u)
(R/'verification/gif_decode.json').write_text(json.dumps(result,indent=2))
print('Apple ImageIO decoded',len(result),'GIFs;',sum(r['frames'] for r in result),'frames; no build cache')
