"""Validate exported pixels, runtime schema, layer recomposition and decoded GIFs."""
from pathlib import Path
import json, hashlib
from raster import *
R=Path(__file__).resolve().parent
checks=[];errors=[]
def check(ok,name):
 checks.append(name)
 if not ok:errors.append(name)
def main():
 m=json.loads((R/'manifest.json').read_text());cid='acolyte_female_p2';c=m['characters'][cid]
 check(m['schema']=='minimidgard.pixel/1','schema')
 check(m['canvas']=={'size':[128,120],'origin':[64,112],'bodyHeight':48},'canvas and foot origin')
 check(c['class']=='acolyte' and c['gender']=='female' and c['proportion']==2,'character')
 check(c['defaultWeapon']=='mace' and set(m['weapons'])=={'mace'},'mace only')
 check(set(c['animations'])=={'idle','walk','attack','cast','hurt','dead','sit'},'all seven actions')
 check(c['animations']==m['animations'],'per-character animations')
 check(c['animations']['cast']['loop'] is True,'prayer loops')
 check(c['animations']['dead']['holdLast'] and not c['animations']['dead']['loop'],'dead holds final frame')
 check(c['animations']['sit']['holdLast'] and not c['animations']['sit']['loop'],'sit holds final frame')
 a=c['animations']['attack'];hit=a['hitFrame'];start=sum(a['durations'][:hit]);end=start+a['durations'][hit]
 check(hit==3 and start<=a['duration']/2<end,'hit spans halfway point')
 check(a['durations'][4]>sum(a['durations'][2:4]),'follow-through hold exceeds short swing')
 hk={tuple(bytes.fromhex(s[1:]))+(255,) for s in m['hairKeys']}
 check(m['hairKeys']==['#faf0d7','#e1cdb8','#b49b91','#49342f'],'four required hair keys')
 names=[];metrics={};visuals=[]
 for action,a in c['animations'].items():
  check(len(a['frames'])==len(a['durations']) and sum(a['durations'])==a['duration'],action+' timing')
  check(all(d>0 and d%10==0 for d in a['durations']),action+' GIF precision')
  names+=a['frames']
 check(len(names)==26 and set(names)==set(c['frames']),'26 frames complete')
 for n in names:
  f=c['frames'][n];hair=m['hair'][c['defaultHair']]['poses'][f['head']['pose']]
  paths={'back':hair['back'],'body':f['image'],'weapon':m['weapons']['mace']['frames'][cid][n],'grip':f['grip'],'front':hair['front']}
  ls={}
  for k,p in paths.items():
   fp=R/p;check(fp.is_file() and fp.resolve().is_relative_to(R),n+' '+k+' path')
   im=read(fp);ls[k]=im
   check(im[:2]==[128,120],n+' '+k+' dimensions')
   check(all(v[3] in (0,255) for v in im[2]),n+' '+k+' binary alpha')
   if k in ('front','back'):check({p for p in im[2] if p[3]}<=hk,n+' '+k+' tint palette')
   if k in ('body','weapon','grip'):check(not ({p for p in im[2] if p[3]}&hk),n+' '+k+' safe from hair tint')
  out=blank(128,120)
  for k in ('back','body','weapon','grip','front'):paste(out,ls[k])
  check(out==read(R/f'composite/{n}.png'),n+' exact runtime recomposition')
  b=bounds(out);check(b and 0<b[0]<b[2]<128 and 0<b[1]<b[3]<120,n+' no canvas clipping')
  check(f['weapon']['hand']=='near' and f['weapon']['visible'] and f['weapon']['z']=='front',n+' consistent hand metadata')
  g=f['weapon']['gripPoint']
  near=[get(ls['grip'],x,y) for y in range(g[1]-2,g[1]+3) for x in range(g[0]-2,g[0]+3)]
  check(any(p[3] for p in near),n+' grip anchor on visible hand')
  overlap=sum(a[3]>0 and b[3]>0 for a,b in zip(ls['grip'][2],ls['weapon'][2]))
  check(overlap>0,n+' hand covers hilt')
  check(sum(p[3]>0 for p in ls['weapon'][2])>10,n+' weapon visible')
  if n.startswith('idle'):check(b[1]==64 and b[3]==112,n+' 48px idle height and baseline')
  if n.startswith('walk'):check(b[3]==112,n+' walk grounded')
  metrics[n]={'bounds':b,'gripOverlapPixels':overlap,'gripPoint':g}
  tinted=blank(128,120,(37,49,62,255));noWeapon=blank(128,120,(37,49,62,255))
  for k in ('back','body','weapon','grip','front'):
   im=ls[k]
   if k in ('back','front'):im=[128,120,[(180,105,220,255) if p[3] else T for p in im[2]]]
   paste(tinted,im)
   if k not in ('weapon','grip'):paste(noWeapon,ls[k])
  visuals.append((tinted,noWeapon))
 check(read(R/'composite/attack_6.png')==read(R/'composite/idle_0.png'),'exact idle return')
 decoded=json.loads((R/'verification/gif_decode.json').read_text())
 check(len(decoded)==14,'all 14 GIF files independently decoded')
 for item in decoded:
  action,scale=item['file'].removesuffix('.gif').rsplit('_',1);a=c['animations'][action];k=int(scale[0])
  check(item['frames']==len(a['frames']),item['file']+' frame count')
  check(all(sz==[128*k,120*k] for sz in item['sizes']),item['file']+' decoded sizes')
  check(all(abs(x-y)<.01 for x,y in zip(item['durations'],a['durations'])) and len(item['durations'])==len(a['durations']),item['file']+' decoded timing')
 for scale in (1,4):
  comp=read(R/f'comparison_{scale}x.png');check(comp[:2]==[384*scale,120*scale],f'comparison {scale}x')
 check((R/'NOTES.md').is_file(),'notes present')
 sheet=blank(5*384,math.ceil(len(visuals)/5)*196,(37,49,62,255))
 for i,(a,b) in enumerate(visuals):
  x=i%5*384;y=i//5*196
  paste(sheet,resize(crop(a,(16,32,112,120)),192,176),x,y+20)
  paste(sheet,resize(crop(b,(16,32,112,120)),192,176),x+192,y+20);number(sheet,x+8,y+3,i,2)
 save(sheet,R/'verification/layer_review.png')
 result={'passed':not errors,'checks':len(checks),'errors':errors,'frames':26,'actions':7,'gifFiles':14,'hitWindowMs':[start,end],'attackDurationMs':c['animations']['attack']['duration'],'metrics':metrics,'visualReview':'FRAME_REVIEWS.json; final review notes in NOTES.md; metadata alone does not prove anatomy'}
 (R/'verification/validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in result.items() if k!='metrics'},ensure_ascii=False,indent=2))
 if errors:raise SystemExit(1)
if __name__=='__main__':
 import math
 main()
