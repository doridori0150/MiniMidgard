"""Register imagegen-authored art; extract indexed runtime layers (no pose synthesis)."""
from raster import *
import json, math, sys
R=Path(__file__).resolve().parent
CID='wizard_female_p2'; HAIR='wizard_crescent_braid_p2'; BG=(36,49,61,255)
HK=['faf0d7','e1cdb8','b49b91','49342f']
HP=[tuple(bytes.fromhex(s))+(255,) for s in HK]
BP=HP+[tuple(bytes.fromhex(s))+(255,) for s in ['291e28','463039','67434b','91645b','bd8871','e8ad88','ffcfaa','ffe2bc','282938','3b3b56','515777','70768b','46223d','6c304e','954264','bc637e','735036','a77c49','d1aa62','f0d490','133f4a','236473','3d919c','7ac8c5']]
def paths(n):return {'body':f'body/{CID}/{n}.png','back':f'hair/{HAIR}/{n}_back.png','front':f'hair/{HAIR}/{n}_front.png','staff':f'weapons/staff/{CID}/{n}.png','grip':f'grips/{CID}/{n}.png'}
def layers(n):return {k:read(R/p) for k,p in paths(n).items()}
def compose(ls):
 out=blank(128,120)
 for k in ('back','body','staff','grip','front'):paste(out,ls[k])
 return out
def opaque(p):return p[3]>=200
def register(n,s):
 src=read(R/f'authored/{n}.png');ls={k:blank(128,120) for k in paths(n)}
 # Landmarks are reviewed in the original image coordinate system.
 scale=s.get('scale',48/(s['ground']-s['top']));cx=s['cx'];tx=s.get('tx',64)
 dy=s.get('dy',0)
 def pt(p):return [round((p[0]-cx)*scale+tx),round((p[1]-s['ground'])*scale+112)]
 g=pt(s['grip']);tip=pt(s['tip']);hpoly=s['hair']; face=s.get('face',[]); ornament=s.get('ornament',[])
 wp=s['weapon'];gp=s['glove'];headmask=s.get('headmask',[])
 for y in range(120):
  sy=round((y+.5-112)/scale+s['ground'])
  for x in range(128):
   sx=round((x+.5-tx)/scale+cx);p=get(src,sx,sy)
   if not opaque(p):continue
   if inside(sx,sy,gp):put(ls['grip'],x,y,nearest(p,BP))
   elif inside(sx,sy,wp) or inside(sx,sy,s.get('weaponHead',[])):put(ls['staff'],x,y,nearest(p,BP))
   elif any(inside(sx,sy,q) for q in s.get('keep',[])):put(ls['body'],x,y,nearest(p,BP))
   elif s.get('lockHead') and inside(sx,sy,headmask) and not any(inside(sx,sy,q) for q in s.get('keep',[])):continue
   elif inside(sx,sy,hpoly) and not inside(sx,sy,face) and not inside(sx,sy,ornament):
    put(ls['front' if sy<s.get('braidY',780) else 'back'],x,y,nearest(p,HP))
   else:put(ls['body'],x,y,nearest(p,BP))
 if s.get('lockHead'):
  base=layers('idle_0');dx=tx-64
  for k in ('body','front','back'):
   for y in range(64,90):
    for x in range(45,78):
     p=get(base[k],x,y)
     xx,yy=x+dx,y+dy
     sx=(xx+.5-tx)/scale+cx;sy=(yy+.5-112)/scale+s['ground']
     preserve=any(inside(sx,sy,q) for q in s.get('keep',[])) and opaque(get(src,round(sx),round(sy)))
     if p[3] and not preserve:put(ls[k],xx,yy,p)
 # Staff continuity under the glove is a concealed extraction fill, never a new pose.
 ux=tip[0]-g[0];uy=tip[1]-g[1];length=math.hypot(ux,uy)
 if length:
  for t in range(-2,3):put(ls['staff'],round(g[0]+t*ux/length),round(g[1]+t*uy/length),(103,67,75,255))
 for k,p in paths(n).items():save(ls[k],R/p)
 composite=compose(ls);save(composite,R/f'composite/{n}.png')
 preview=blank(512,480,BG);paste(preview,resize(composite,512,480));save(preview,R/f'verification/{n}_4x.png')
 return {'grip':g,'tip':tip,'scale':scale,'headOffset':[tx-64,dy],'bounds':bounds(composite)}
if __name__=='__main__':
 specs=json.loads((R/'registration.json').read_text()); names=sys.argv[1:] or list(specs)
 stats=json.loads((R/'verification/registration.json').read_text()) if (R/'verification/registration.json').exists() else {}
 for n in names:stats[n]=register(n,specs[n]);print(n,stats[n])
 (R/'verification/registration.json').write_text(json.dumps(stats,indent=2))
