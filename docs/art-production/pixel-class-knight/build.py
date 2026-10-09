"""Pack approved original and individually authored poses. All writes stay here."""
from register import *
import shutil,copy,hashlib,os
MAPPING={
'bash':'skill_cleave','magnum_break':'skill_sweep','provoke':'skill_provoke','endure':'skill_guard',
'pierce':'skill_thrust','spear_stab':'skill_thrust','spear_boomerang':'skill_throw','brandish':'skill_sweep',
'twohand_quicken':'skill_enchant','auto_counter':'skill_guard','bowling_bash':'skill_double',
'charge_attack':'skill_charge','moon_slash':'skill_crescent','iron_stance':'skill_guard',
'element_shift':'skill_enchant','mana_edge':'skill_enchant'}
# Each tuple is an approved authored frame and a duration, in review order.
ANIMS={
'cast':([('guard_ready',160),('guard_hold',160)],None),
'skill_cleave':([('idle_0',50),('cleave_ready',80),('cleave_hit',60),('attack_4',160),('attack_6',130),('idle_0',120)],2),
'skill_sweep':([('attack_0',60),('attack_1',70),('attack_2',50),('attack_3',60),('attack_4',160),('attack_6',100),('idle_0',100)],2),
'skill_thrust':([('thrust_ready',130),('thrust_hit',80),('thrust_ready',60),('thrust_hit',140),('attack_6',100),('idle_0',100)],1),
'skill_throw':([('throw_ready',130),('throw_release',180),('throw_catch',140),('thrust_ready',100),('idle_0',100)],1),
'skill_guard':([('guard_ready',100),('guard_hold',220),('guard_ready',100),('idle_0',140)],None),
'skill_enchant':([('enchant_ready_fix',130),('enchant_hold_fix',240),('enchant_ready_fix',110),('idle_0',120)],None),
'skill_provoke':([('taunt_ready',130),('taunt_call',240),('taunt_ready',100),('idle_0',130)],1),
'skill_double':([('attack_0',60),('attack_1',70),('attack_2',60),('attack_4',50),('rise_hit',80),('throw_catch',100),('attack_6',100),('idle_0',100)],2),
'skill_crescent':([('attack_0',60),('attack_1',70),('attack_3',60),('attack_4',40),('rise_hit',60),('cleave_ready',50),('cleave_hit',60),('attack_4',100),('attack_6',110),('idle_0',100)],2),
'skill_charge':([('charge_ready',130),('thrust_hit',240),('thrust_ready',100),('attack_6',100),('idle_0',100)],1),
}
LABELS={'cast':'CAST','skill_cleave':'CLEAVE','skill_sweep':'SWEEP','skill_thrust':'THRUST','skill_throw':'THROW','skill_guard':'GUARD','skill_enchant':'ENCHANT','skill_provoke':'PROVOKE','skill_double':'DOUBLE','skill_crescent':'CRESCENT','skill_charge':'CHARGE'}
ALPH={
'A':'010101111101101','B':'110101110101110','C':'011100100100011','D':'110101101101110','E':'111100110100111','F':'111100110100100','G':'011100101101011','H':'101101111101101','I':'111010010010111','J':'001001001101010','K':'101101110101101','L':'100100100100111','M':'101111111101101','N':'101111111111101','O':'010101101101010','P':'110101110100100','Q':'010101101111011','R':'110101110101101','S':'011100010001110','T':'111010010010010','U':'101101101101111','V':'101101101101010','W':'101101111111101','X':'101101010101101','Y':'101101010010010','Z':'111001010100111',' ':'000000000000000','-':'000000111000000',':':'000010000010000'}
FONT.update({k:[v[i:i+3] for i in range(0,15,3)] for k,v in ALPH.items()})
def label(im,x,y,t,s=2):
 for c in str(t).upper():
  if c not in FONT: c=' '
  number(im,x,y,c,s);x+=4*s

def dump(path,v):
 (R/path).parent.mkdir(parents=True,exist_ok=True);(R/path).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def spear_asset():
 src=read(R/'authored/spear_master.png');src[2]=[nearest(p,BP) if p[3]>=220 else T for p in src[2]]
 b=bounds(src);small=resize(crop(src,b),56,4);save(small,R/'weapons/spear/master.png');return small

def spear_layer(master,g,angle,body,grip,visible):
 out=blank(*SZ)
 if not visible:return out,blank(*SZ),None
 a=math.radians(angle);u=(math.cos(a),math.sin(a));v=(-u[1],u[0])
 # Fixed 56px spear, same grasp station (22) in all actions. Never shrink per pose.
 for y in range(120):
  for x in range(128):
   dx=x-g[0];dy=y-g[1];sx=round(dx*u[0]+dy*u[1]+22);sy=round(dx*v[0]+dy*v[1]+1.5)
   if 0<=sx<56 and 0<=sy<4:put(out,x,y,get(master,sx,sy))
 overlay=blank(*SZ)
 # Copy actual drawn glove over shaft. Bake this overlay into weapon PNG because
 # pixel/1 runtime supports one shared f.grip rather than per-weapon f.grip.
 for y in range(g[1]-2,g[1]+3):
  for x in range(g[0]-2,g[0]+3):
   p=get(grip,x,y)
   if not p[3]:p=get(body,x,y)
   if p[3]:put(overlay,x,y,p)
 paste(out,overlay)
 return out,overlay,[round(g[0]+33*u[0]),round(g[1]+33*u[1])]

def bgframe(n,w):
 f=blank(*SZ,BG);paste(f,read(R/f'composite/{w}/{n}.png'));return f

def make_gifs(m):
 c=m['characters'][CID]
 for an,a in c['animations'].items():
  for w in (('spear',) if os.environ.get('SPEAR_ONLY') else ('sword','spear')):
   fs=[bgframe(n,w) for n in a['frames']]
   stem=an if w=='sword' else an+'_spear'
   gif(fs,a['durations'],R/f'{stem}_1x.gif');gif([resize(f,512,480) for f in fs],a['durations'],R/f'{stem}_4x.gif')
   sh=blank(256*len(fs),184,BG)
   for i,f in enumerate(fs):
    paste(sh,resize(crop(f,(0,44,128,120)),256,152),i*256,32);label(sh,i*256+5,5,f'{i}  {a["durations"][i]}',2)
   save(sh,R/f'{stem}_contact_sheet.png')
 # Full skill sheets, each row labeled, complete timing/frame count.
 for w in (('spear',) if os.environ.get('SPEAR_ONLY') else ('sword','spear')):
  names=list(ANIMS);cols=max(len(c['animations'][an]['frames']) for an in names)
  sh=blank(cols*256,len(names)*190,BG)
  for row,an in enumerate(names):
   a=c['animations'][an];label(sh,8,row*190+4,f'{LABELS[an]} {a["duration"]} MS',2)
   for i,n in enumerate(a['frames']):
    paste(sh,resize(crop(bgframe(n,w),(0,44,128,120)),256,152),i*256,row*190+36)
    label(sh,i*256+8,row*190+20,f'{i} {a["durations"][i]}'+(' HIT' if a.get('hitFrame')==i else ''),1)
  save(sh,R/('skills_contact_sheet.png' if w=='sword' else 'skills_spear_contact_sheet.png'))
 # Compare plain attack and each skill on a common timeline, no retiming.
 attack=c['animations']['attack']
 def ends(a):
  out=[0]
  for d in a['durations']:out.append(out[-1]+d)
  return out
 for an in ANIMS:
  if an=='cast':continue
  skill=c['animations'][an];ae=ends(attack);se=ends(skill);events=sorted(set(ae+se));ds=[b-a for a,b in zip(events,events[1:])]
  for w in (('spear',) if os.environ.get('SPEAR_ONLY') else ('sword','spear')):
   frames=[]
   for t in events[:-1]:
    def frame(a,e):return next((a['frames'][i] for i in range(len(a['frames'])) if t<e[i+1]),'idle_0')
    f=blank(256,120,BG);paste(f,bgframe(frame(attack,ae),w));paste(f,bgframe(frame(skill,se),w),128)
    label(f,4,6,'ATTACK',1);label(f,132,6,LABELS[an],1);frames.append(f)
   for scale in (1,4):gif([resize(f,256*scale,120*scale) for f in frames],ds,R/f'attack_vs_{an}_{w}_{scale}x.gif')
   hit_t=se[skill.get('hitFrame',min(1,len(se)-2))];idx=events[:-1].index(hit_t)
   save(resize(frames[idx],1024,480),R/f'attack_vs_{an}_{w}.png')

def main():
 m=json.loads((OLD/'manifest.json').read_text());c=m['characters'][CID]
 # Rename only hair identifier/path; original artwork bytes stay identical.
 oldstyle=c['defaultHair'];m['hair'][STYLE]=m['hair'].pop(oldstyle);m['hair'][STYLE]['style']=STYLE
 c['defaultHair']=STYLE;c['hairStyles']=[STYLE];c['skillMotions']=MAPPING
 for pose in m['hair'][STYLE]['poses'].values():
  for k in ('front','back'):
   old=pose[k];pose[k]=old.replace(oldstyle,STYLE);(R/pose[k]).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(OLD/old,R/pose[k])
 master=spear_asset();m['weapons']['spear']={'frames':{CID:{}},'grips':{CID:{}}}
 reg={};authored=set(n for seq,h in ANIMS.values() for n,d in seq if n in SPECS)
 for n in sorted(authored):reg[n]=norm(n)
 reviews=[];source_by_name={n:n for n in c['frames']}
 for an,(seq,hit) in ANIMS.items():
  names=[]
  for i,(src,d) in enumerate(seq):
   n=f'{an}_{i}';names.append(n);source_by_name[n]=src
   ps=paths(src);pn=paths(n)
   for k in ps:
    if src not in SPECS:
     source=OLD/ps[k].replace(STYLE,oldstyle)
    else:source=R/ps[k]
    (R/pn[k]).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,R/pn[k])
   if src in SPECS:
    r=reg[src];g=r['grip'];t=r['tip'];f={'image':pn['body'],'head':{'point':[0,0],'pose':n,'basePose':'up'},'weapon':{'z':'front','visible':r['visible'],'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':pn['grip']}
   else:
    f=copy.deepcopy(c['frames'][src]);f['image']=pn['body'];f['head']['pose']=n;f['grip']=pn['grip']
   c['frames'][n]=f;m['hair'][STYLE]['poses'][n]={'front':pn['front'],'back':pn['back'],'pivot':[0,0]};m['weapons']['sword']['frames'][CID][n]=pn['sword']
   reviews.append({'frame':n,'previous':names[i-1] if i else 'idle_0','sourcePose':src,'duration':d,'headLocked':True,'weaponHand':'near','review':'이전 장의 발 기준·머리 크기·동작 방향을 비교. 승인된 준비/타격/회수 자세 재사용은 sourcePose로 기록.'})
  a={'frames':names,'durations':[d for n,d in seq],'duration':sum(d for n,d in seq),'loop':an=='cast'}
  if hit is not None:a['hitFrame']=hit
  c['animations'][an]=a;m['animations'][an]=copy.deepcopy(a)
 metrics={}
 for n,f in c['frames'].items():
  ls=layers(n);g=f['weapon']['gripPoint'];src=source_by_name[n];ang=f['weapon']['angleDegrees'];visible=f['weapon']['visible']
  # Spear carries upright at rest; lower shaft cannot be pushed through ground.
  if src.startswith(('idle','walk','hurt','taunt','sit')):ang=-28 if not src.startswith('sit') else -30
  elif src.startswith('dead'):ang=-10 if src!='dead_3' else 0
  elif src=='attack_7':ang=-28
  elif src in ('attack_4','attack_5','attack_6'):ang=0 if src!='attack_6' else -35
  elif src=='cleave_hit':ang=10
  elif src in ('guard_ready','guard_hold'):ang=-63
  sp,gr,tip=spear_layer(master,g,ang,ls['body'],ls['grip'],visible)
  if src in ('attack_2','attack_3','cleave_hit','rise_hit'):
   # Keep the authored attached smear, then place spear over it.
   smear=blank(*SZ)
   for j,pixel in enumerate(ls['sword'][2]):
    if pixel in FX:smear[2][j]=pixel
   paste(smear,sp);sp=smear
  p=f'weapons/spear/{CID}/{n}.png';gp=f'grips/spear/{CID}/{n}.png';save(sp,R/p);save(gr,R/gp)
  m['weapons']['spear']['frames'][CID][n]=p;m['weapons']['spear']['grips'][CID][n]=gp
  # Extension is harmless to pixel/1 and records per-weapon attachment geometry.
  f['weapon']['byType']={'spear':{'gripPoint':g,'tipPoint':tip,'angleDegrees':ang,'hand':'near','visible':visible,'gripOverlay':gp,'gripBakedIntoWeapon':True}}
  ls['spear']=sp
  for w in (('spear',) if os.environ.get('SPEAR_ONLY') else ('sword','spear')):
   im=compose(ls,w);save(im,R/f'composite/{w}/{n}.png')
   if w=='sword':save(im,R/f'composite/{n}.png')
  metrics[n]={'sourcePose':src,'swordBounds':bounds(compose(ls)),'spearBounds':bounds(compose(ls,'spear')),'spearTip':tip,'spearGrip':g,'spearAngle':ang,'visible':visible}
 dump('manifest.json',m);dump('FRAME_REVIEWS.json',reviews);dump('verification/registration.json',reg);dump('verification/frame_metrics.json',metrics)
 make_gifs(m)
 # Whole set: base and new frames, per weapon.
 for w in (('spear',) if os.environ.get('SPEAR_ONLY') else ('sword','spear')):
  names=list(c['frames']);sh=blank(6*256,math.ceil(len(names)/6)*168,BG)
  for i,n in enumerate(names):
   x=i%6*256;y=i//6*168;label(sh,x+4,y+4,n.replace('skill_',''),1);paste(sh,resize(crop(bgframe(n,w),(0,44,128,120)),256,152),x,y+16)
  save(sh,R/('contact_sheet.png' if w=='sword' else 'spear_contact_sheet.png'))
 # Same scale: cookie, approved r15, completed knight with sword, with spear.
 cookie=R.with_name('pixel-hero-r12')/'composite/idle_0.png'
 comps=[read(cookie),read(OLD/'composite/idle_0.png'),read(R/'composite/sword/idle_0.png'),read(R/'composite/spear/idle_0.png')]
 sh=blank(512,120,BG)
 for i,im in enumerate(comps):paste(sh,im,128*i)
 for scale in (1,4):save(resize(sh,512*scale,120*scale),R/f'comparison_{scale}x.png')
 for pose in SPECS:
  for q in paths(pose).values():
   if (R/q).exists():(R/q).unlink()
  q=R/f'composite/{pose}.png'
  if q.exists():q.unlink()
 print(json.dumps({'frames':len(c['frames']),'skills':len(MAPPING),'skillMotions':10,'castFrames':2},ensure_ascii=False))
if __name__=='__main__':main()
