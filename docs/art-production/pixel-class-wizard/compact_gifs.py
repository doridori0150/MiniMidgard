"""Losslessly re-encode indexed GIF streams; palettes/timing/descriptors unchanged."""
from pathlib import Path
import json,struct
R=Path(__file__).resolve().parent

def unpack(data):
 # Production GIF encoder emits clear/end/base/literal codes at fixed 9 bits.
 acc=bits=0;codes=[]
 for v in data:
  acc|=v<<bits;bits+=8
  while bits>=9:codes.append(acc&511);acc>>=9;bits-=9
 out=[];table={i:[i] for i in range(256)};nxt=258;prev=None
 for c in codes:
  if c==256:table={i:[i] for i in range(256)};nxt=258;prev=None;continue
  if c==257:break
  seq=table.get(c)
  if seq is None:
   assert c==nxt and prev is not None
   seq=prev+[prev[0]]
  out.extend(seq)
  if prev is not None:table[nxt]=prev+[seq[0]];nxt+=1
  prev=seq
 return out

def pack(vals):
 d={};nxt=258;codes=[256];prefix=vals[0]
 for k in vals[1:]:
  key=(prefix,k)
  if key in d:prefix=d[key];continue
  codes.append(prefix)
  if nxt<510:d[key]=nxt;nxt+=1
  else:codes.append(256);d={};nxt=258
  prefix=k
 codes.extend([prefix,257]);out=bytearray();acc=bits=0
 for c in codes:
  acc|=c<<bits;bits+=9
  while bits>=8:out.append(acc&255);acc>>=8;bits-=8
 if bits:out.append(acc&255)
 return bytes(out)

def blocks(data,pos):
 out=bytearray()
 while data[pos]:
  n=data[pos];pos+=1;out+=data[pos:pos+n];pos+=n
 return bytes(out),pos+1
stats=[]
for path in sorted(R.glob('*.gif')):
 data=path.read_bytes();pos=13+(3*(2**((data[10]&7)+1)) if data[10]&128 else 0);out=bytearray(data[:pos]);frames=0
 while pos<len(data):
  start=pos;tag=data[pos];pos+=1
  if tag==59:out.append(tag);break
  if tag==33:
   pos+=1;_,pos=blocks(data,pos);out+=data[start:pos]
  elif tag==44:
   packed=data[pos+8];w,h=struct.unpack('<HH',data[pos+4:pos+8]);pos+=9
   if packed&128:pos+=3*(2**((packed&7)+1))
   size=data[pos];assert size==8;pos+=1;head=data[start:pos]
   raw,pos=blocks(data,pos);indices=unpack(raw);assert len(indices)==w*h
   coded=pack(indices);assert unpack(coded)==indices
   out+=head
   for i in range(0,len(coded),255):block=coded[i:i+255];out.append(len(block));out+=block
   out.append(0);frames+=1
  else:raise ValueError((path,pos,tag))
 if len(out)<len(data):path.write_bytes(out)
 stats.append({'file':path.name,'frames':frames,'before':len(data),'after':min(len(out),len(data)),'indicesIdentical':True})
report={'files':len(stats),'pixelIdentical':True,'method':'fixed 9-bit dictionary LZW with early reset; palette and metadata untouched; decoded index roundtrip checked','beforeBytes':sum(x['before'] for x in stats),'afterBytes':sum(x['after'] for x in stats),'details':stats}
(R/'verification/gif_compression.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items() if k!='details'})
