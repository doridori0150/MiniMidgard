from register import *
import shutil

def anim(frames,ds,loop=False,hit=None,hold=False):
 d={'frames':frames.split(),'durations':ds,'duration':sum(ds),'loop':loop}
 if hit is not None:d['hitFrame']=hit
 if hold:d['holdLast']=True
 assert len(d['frames'])==len(ds)
 return d
A={
'idle':anim('idle_0 idle_1 idle_2',[300,300,200],True),
'walk':anim(' '.join(f'walk_{i}' for i in range(8)),[100]*8,True),
'attack':anim('attack_0 attack_1 attack_2 attack_3 attack_4 attack_5 attack_6 idle_0',[60,70,80,110,50,90,100,80],hit=4),
'hurt':anim('hurt_0 hurt_1',[90,170]),
'dead':anim('hurt_0 dead_kneel dead_floor',[100,150,1000],hold=True),
'sit':anim('sit_0',[1000],hold=True),
'cast':anim('cast_0 cast_1',[250,250],True),
'skill_double':anim('attack_1 attack_3 attack_4 attack_2 attack_3 attack_4 attack_5 attack_6 idle_0',[50,80,60,70,60,60,90,90,80],hit=2),
'skill_sky':anim('attack_0 sky_draw sky_release sky_release attack_5 attack_6 idle_0',[50,80,90,120,100,100,80],hit=2),
'skill_power':anim('attack_2 power_draw_fix power_release power_release attack_5 attack_6 idle_0',[50,80,100,140,100,100,80],hit=2),
'skill_focus':anim('attack_6 cast_0 cast_1 cast_0 attack_6 idle_0',[90,130,150,130,80,80]),
'skill_falcon':anim('attack_6 falcon_raise falcon_point falcon_point attack_6 idle_0',[50,80,110,160,120,100],hit=2),
'skill_scout':anim('attack_6 falcon_raise scout scout attack_6 idle_0',[80,90,160,160,100,100]),
'skill_whistle':anim('attack_6 whistle whistle attack_6 idle_0',[100,180,180,100,100]),
'skill_trap':anim('trap_crouch trap_place trap_place trap_crouch attack_6 idle_0',[130,100,160,130,100,100],hit=1),
}
MAP={'double_strafe':'skill_double','arrow_shower':'skill_sky','arrow_repel':'skill_power','phantasmic':'skill_power','improve_conc':'skill_focus','blitz_beat':'skill_falcon','falcon_strike':'skill_falcon','detect':'skill_scout','drover_whistle':'skill_whistle'}
for s in ['skid_trap','land_mine','ankle_snare','shockwave_trap','sandman','flasher','freezing_trap','blast_mine','claymore_trap']:MAP[s]='skill_trap'

def writejson(p,v):(R/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def bg(n):
 o=blank(128,120,BG);paste(o,read(R/f'composite/{n}.png'));return o
def sheet(ns,ds,path,cols=4,scale=3):
 o=blank(cols*128,((len(ns)+cols-1)//cols)*120,BG)
 for i,n in enumerate(ns):
  x=i%cols*128;y=i//cols*120;paste(o,bg(n),x,y);number(o,x+3,y+3,i);number(o,x+20,y+3,ds[i])
 save(resize(o,o[0]*scale,o[1]*scale),R/path)
def pose_at(a,t):
 for n,dt in zip(a['frames'],a['durations']):
  if t<dt:return n
  t-=dt
 return 'idle_0'

def build():
 stats=json.loads((R/'verification/registration.json').read_text())
 c={'class':'hunter','gender':'male','bodyHeight':48,'headHeight':25,'proportion':2,'defaultWeapon':'bow','defaultHair':HAIR,'hairStyles':[HAIR],'animations':A,'skillMotions':MAP,'frames':{}}
 m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':A,'hairKeys':['#faf0d7','#e1cdb8','#b49b91','#49342f'],'characters':{CID:c},'hair':{HAIR:{'gender':'male','style':'swept_crop','proportion':'p2','pivot':[0,0],'poses':{}}},'weapons':{'bow':{'frames':{CID:{}}}}}
 for n,s in stats.items():
  p=paths(n);g=s['grip'];t=s['tip']
  c['frames'][n]={'image':p['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if n=='dead_floor' else 'up'},'weapon':{'z':'front','visible':True,'hand':'far','anatomicalHand':'left','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':p['grip']}
  m['hair'][HAIR]['poses'][n]={'front':p['front'],'back':p['back'],'pivot':[0,0]}
  m['weapons']['bow']['frames'][CID][n]=p['weapon']
 writejson('manifest.json',m)
 expected={}
 for k,a in A.items():
  fs=[bg(n) for n in a['frames']]
  for z in [1,4]:
   name=f'{k}_{z}x.gif';gif([resize(f,128*z,120*z) for f in fs],a['durations'],R/name);expected[name]={'durations':a['durations'],'size':[128*z,120*z]}
  sheet(a['frames'],a['durations'],f'{k}_contact_sheet.png')
  if k.startswith('skill_'):
   # Shared timeline uses exact boundaries, preserving both animation timings.
   ends={0,A['attack']['duration'],a['duration']}
   for v in (A['attack'],a):
    t=0
    for d in v['durations']:t+=d;ends.add(t)
   ts=sorted(ends);fs=[];ds=[]
   for t,u in zip(ts,ts[1:]):
    o=blank(256,120,BG);paste(o,bg(pose_at(A['attack'],t)));paste(o,bg(pose_at(a,t)),128,0);fs.append(o);ds.append(u-t)
   for z in (1,4):
    name=f'attack_vs_{k}_{z}x.gif';gif([resize(f,256*z,120*z) for f in fs],ds,R/name);expected[name]={'durations':ds,'size':[256*z,120*z]}
   o=blank(256,120*len(a['frames']),BG);t=0
   for i,(n,d) in enumerate(zip(a['frames'],a['durations'])):
    paste(o,bg(pose_at(A['attack'],t)),0,i*120);paste(o,bg(n),128,i*120);number(o,3,i*120+3,i);t+=d
   save(resize(o,512,o[1]*2),R/f'attack_vs_{k}.png')
 ns=list(stats);sheet(ns,[0]*len(ns),'contact_sheet.png',6,3)
 skills=[k for k in A if k.startswith('skill_')];o=blank(128*9,120*len(skills),BG)
 for row,k in enumerate(skills):
  a=A[k]
  for col,(n,d) in enumerate(zip(a['frames'],a['durations'])):
   paste(o,bg(n),128*col,120*row);number(o,128*col+2,120*row+2,row);number(o,128*col+17,120*row+2,col);number(o,128*col+35,120*row+2,d)
 save(resize(o,o[0]*2,o[1]*2),R/'skills_contact_sheet.png')
 writejson('verification/gif_expected.json',expected)
 prompts=json.loads((R/'PROMPTS.json').read_text())
 writejson('FRAME_REVIEWS.json',[{'name':p['name'],'previous':p.get('previous'),'review':p.get('previousReview'),'accepted':p['name'] not in ['power_draw'],'source':f"authored/{p['name']}.png"} for p in prompts if p.get('previousReview')])
 print('Built',len(stats),'authored poses',len(A),'motions',len(MAP),'skill mappings',len(expected),'GIFs')
if __name__=='__main__':build()
