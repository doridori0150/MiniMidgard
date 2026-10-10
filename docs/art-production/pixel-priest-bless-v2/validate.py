"""Read-only verification of delivered PNGs and independent GIF LZW decoding."""
from register_frame import *
import hashlib,struct
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def decode_gif(path):
 b=Path(path).read_bytes();assert b[:6] in [b'GIF87a',b'GIF89a'];w,h,packed,bg,ar=struct.unpack('<HHBBB',b[6:13]);p=13
 def table(n):
  nonlocal p
  out=[tuple(b[j:j+3]) for j in range(p,p+3*n,3)];p+=n*3;return out
 globalpal=table(2**((packed&7)+1)) if packed&128 else None
 def blocks():
  nonlocal p
  out=b''
  while b[p]:
   n=b[p];p+=1;out+=b[p:p+n];p+=n
  p+=1;return out
 frames=[];ms=0
 while b[p]!=59:
  kind=b[p];p+=1
  if kind==33:
   label=b[p];p+=1;data=blocks()
   if label==249:ms=struct.unpack('<H',data[1:3])[0]*10
  elif kind==44:
   x,y,fw,fh,pk=struct.unpack('<HHHHB',b[p:p+9]);p+=9;pal=table(2**((pk&7)+1)) if pk&128 else globalpal
   minimum=b[p];p+=1;data=blocks();clear=1<<minimum;end=clear+1;bit=0;out=[];prev=None;width=minimum+1;d={i:[i] for i in range(clear)};nextcode=end+1
   while True:
    code=0
    for j in range(width):code|=((data[(bit+j)//8]>>((bit+j)%8))&1)<<j
    bit+=width
    if code==clear:d={i:[i] for i in range(clear)};width=minimum+1;nextcode=end+1;prev=None;continue
    if code==end:break
    entry=d[code] if code in d else prev+[prev[0]]
    out.extend(entry)
    if prev is not None:
     d[nextcode]=prev+[entry[0]];nextcode+=1
     if nextcode==(1<<width) and width<12:width+=1
    prev=entry
   assert len(out)==fw*fh and (x,y,fw,fh)==(0,0,w,h) and not pk&64
   frames.append({'size':[w,h],'duration':ms,'rgb':[pal[i] for i in out]})
  else:raise AssertionError(kind)
 return frames
def main():
 m=json.loads((R/'manifest.json').read_text());a=m['animations']['skill_bless'];names=a['frames'];c=m['characters'][CID];checks=[];stats=[]
 assert list(m['characters'])==[CID] and list(m['animations'])==['skill_bless'] and list(c['animations'])==['skill_bless']
 assert len(names)==5 and a['durations']==[100,140,160,100,100] and a['duration']==600 and 'hitFrame' not in a and a['loop']==False
 assert m['canvas']['size']==[128,120] and m['canvas']['origin']==[64,112]
 checks+=['one character / one animation / five skill_bless frames','600ms, no hitFrame, one-shot','128x120, pivot (64,112)']
 keys={tuple(bytes.fromhex(x[1:]))+(255,) for x in m['hairKeys']};base=read(S/paths('skill_bless_0')['body']);idle=read(S/'composite/idle_0.png')
 for i,n in enumerate(names):
  ls={k:read(R/p) for k,p in paths(n).items()};f=c['frames'][n]
  for k,p in paths(n).items():
   assert ls[k][:2]==[128,120] and {px[3] for px in ls[k][2]}<={0,255}
   assert sha(R/p)==f['layerHashes'][k]
  assert sha(R/f['image'])==f['sha256']
  for k in ['back','front']:
   assert {px for px in ls[k][2] if px[3]}<=keys
   source=paths(n if i in [0,4] else 'skill_bless_0')[k];assert ls[k]==read(S/source)
  if i in [0,4]:
   for p in paths(n).values():assert (R/p).read_bytes()==(S/p).read_bytes()
  else:
   for y in list(range(88))+list(range(101,120)):
    for x in range(128):assert get(ls['body'],x,y)==get(base,x,y),(n,x,y)
  composed=compose(ls);assert composed==read(R/f'composite/{n}.png')
  union=sum(bool(p[3] or q[3]) for p,q in zip(idle[2],composed[2]));diff=sum(p!=q for p,q in zip(idle[2],composed[2]));stats.append({'frame':n,'bounds':bounds(composed),'changedPixelFractionVersusIdle':round(diff/union,4)})
 checks+=['25 RGBA layers, binary alpha, hashes verified','four hair key colors only','approved endpoints byte-identical','approved head/hair/lower-body protected pixels identical','layer recomposition equals delivered composite']
 gifs=[];BG=(36,49,61)
 for p in sorted(R.glob('*.gif')):
  frames=decode_gif(p);assert len(frames)==5 and [x['duration'] for x in frames]==a['durations']
  scale=4 if '_4x' in p.name else 1;pair=p.name.startswith('old_vs');width=(256 if pair else 128)*scale
  for i,g in enumerate(frames):
   assert g['size']==[width,120*scale]
   e=blank(256 if pair else 128,120,BG+(255,))
   if pair:paste(e,read(S/f'composite/{names[i]}.png'))
   paste(e,read(R/f'composite/{names[i]}.png'),128 if pair else 0);e=resize(e,width,120*scale)
   assert g['rgb']==[q[:3] for q in e[2]],(p,i)
  gifs.append({'file':p.name,'frames':len(frames),'durations':[x['duration'] for x in frames],'size':frames[0]['size'],'decodedPixelsMatch':True})
 checks+=['four GIFs independently LZW-decoded; dimensions, frame count, timings and every pixel verified']
 for ref in json.loads((R/'references/hashes.json').read_text()):assert sha(ref['source'])==ref['sha256'] and sha(R/ref['copy'])==ref['sha256']
 checks+=['reference source and copied SHA256 unchanged']
 result={'passed':True,'checks':checks,'frames':stats,'gifs':gifs,'gameStageCapture':'not run; package not installed into src','approval':'pending user review','note':'pixel difference is an offline RGBA comparison, not workshop game-stage 20% metric'}
 (R/'verification/validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
