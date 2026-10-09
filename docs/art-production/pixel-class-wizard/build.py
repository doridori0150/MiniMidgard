"""Package reviewed authored poses, manifest, native-time GIFs and comparisons."""
from register import *
import shutil
GROUPS={
 'skill_bolt':['fire_bolt','cold_bolt','lightning_bolt','soul_strike','frost_diver','stone_curse'],
 'skill_orb':['napalm_beat','fire_ball','jupitel'],
 'skill_ground':['fire_wall','safety_wall','earth_spike','fire_pillar','ice_wall','quagmire','heavens_drive'],
 'skill_sky':['thunderstorm','lord_vermilion'],
 'skill_water':['water_ball'],'skill_meteor':['meteor'],'skill_blizzard':['storm_gust'],
 'skill_nova':['frost_nova','sightrasher'],
 'skill_aura':['sight','energy_coat','sight_blaster','mystic_amp'],'skill_barrier':['mana_barrier']}
MAPPING={s:a for a,ids in GROUPS.items() for s in ids}
# Source pose, exposure in ms. Reused poses are intentional, never synthesized in-betweens.
ANIMS={
 'idle':([('idle_0',220),('idle_breath',220),('idle_0',220)],None),
 'walk':([('walk_contact_a',100)]+[(f'walk_r1_{i}',100) for i in range(1,8)],None),
 'attack':([('idle_0',60),('attack_ready',150),('attack_hit',60),('attack_hold',150),('recover',100),('idle_0',80)],2),
 'cast_start':([('cast_gather',90),('cast_hold',100)],None),
 'cast':([('cast_hold',170),('cast_breath_fix',170),('cast_hold',170)],None),
 'hurt':([('hurt',100),('recover',140),('idle_0',100)],None),
 'dead':([('hurt',100),('dead_kneel',140),('dead_fall',1000)],None),
 'sit':([('sit',1000)],None),
 'skill_bolt':([('cast_hold',130),('bolt_release',130),('recover',140),('cast_hold',100),('idle_0',100)],1),
 'skill_orb':([('cast_hold',50),('bolt_release',80),('orb_release_fix',120),('bolt_release',80),('recover',130),('idle_0',140)],2),
 'skill_ground':([('cast_hold',70),('water_scoop',60),('ground_press',180),('water_scoop',120),('recover',130),('idle_0',120)],2),
 'skill_sky':([('cast_hold',50),('sky_raise',80),('sky_command',200),('sky_raise',120),('cast_hold',140),('idle_0',110)],2),
 'skill_water':([('cast_hold',50),('water_scoop',80),('water_release',100),('bolt_release',100),('water_release',100),('recover',130),('idle_0',140)],2),
 'skill_meteor':([('cast_hold',40),('sky_raise',90),('meteor_command',170),('attack_hold',120),('recover',160),('idle_0',120)],2),
 'skill_blizzard':([('cast_hold',60),('bolt_release',70),('blizzard_sweep',220),('bolt_release',110),('recover',130),('idle_0',110)],2),
 'skill_nova':([('cast_gather',130),('nova_open',220),('cast_hold',140),('idle_0',110)],1),
 'skill_aura':([('cast_gather',120),('aura_focus',280),('cast_gather',100),('idle_0',120)],None),
 'skill_barrier':([('cast_gather',100),('barrier_hold',220),('cast_hold',140),('idle_0',120)],None),
}
LABELS={'idle':'대기','walk':'걷기','attack':'일반 공격','cast_start':'시전 시작','cast':'시전 유지','hurt':'피격','dead':'쓰러짐','sit':'앉기','skill_bolt':'화살 · 영혼탄 · 저주','skill_orb':'화염구 · 염 폭발 · 뇌격구','skill_ground':'지면 설치 · 대지','skill_sky':'뇌우 · 천둥왕의 심판','skill_water':'물의 구','skill_meteor':'유성우','skill_blizzard':'폭풍한설','skill_nova':'서리 폭발 · 화염 폭산','skill_aura':'탐지 · 마력 강화','skill_barrier':'마력 장벽'}
def bg(im):
 out=blank(*im[:2],BG);paste(out,im);return out
def ends(a):
 out=[0]
 for d in a['durations']:out.append(out[-1]+d)
 return out
def at(a,t):
 elapsed=0
 for n,d in zip(a['frames'],a['durations']):
  elapsed+=d
  if t<elapsed:return n
 return a['frames'][-1]
def compose_other(root):
 m=json.loads((root/'manifest.json').read_text());c=next(iter(m['characters'].values()));a=c.get('animations',m['animations']);f=c['frames'][a['idle']['frames'][0]]
 h=m['hair'][c['defaultHair']]['poses'][f['head']['pose']];piv=h.get('pivot',[0,0]);offset=[f['head']['point'][i]-piv[i] for i in (0,1)]
 cid=next(iter(m['characters']));w=m['weapons'][c['defaultWeapon']]['frames'][cid][a['idle']['frames'][0]];out=blank(128,120)
 for p,xy in [(h['back'],offset),(f['image'],[0,0]),(w,[0,0]),(f['grip'],[0,0]),(h['front'],offset)]:paste(out,read(root/p),*xy)
 return out
def main():
 stats=json.loads((R/'verification/registration.json').read_text());frames={};poses={};wframes={};animations={};reviews=[];composites={}
 # Cache registered sources before runtime aliases such as idle_0 are written.
 sourceLayers={n:layers(n) for seq,_ in ANIMS.values() for n,_ in seq}
 for an,(seq,hit) in ANIMS.items():
  ids=[];times=[];previous=None
  for i,(source,ms) in enumerate(seq):
   n=f'{an}_{i}';ids.append(n);times.append(ms);ps=paths(n);ls=sourceLayers[source]
   for k,p in ps.items():save(ls[k],R/p)
   im=compose(ls);composites[n]=im;save(im,R/f'composite/{n}.png')
   st=stats[source];g,t=st['grip'],st['tip']
   frames[n]={'image':ps['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if source=='dead_fall' else 'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':ps['grip']}
   poses[n]={'front':ps['front'],'back':ps['back'],'pivot':[0,0]};wframes[n]=ps['staff']
   reviews.append({'animation':an,'frame':i,'source':source,'previous':previous,'duration':ms,'bounds':bounds(im),'hand':'near','headOffset':st['headOffset'],'sourceReused':sum(x==source for sq,_ in ANIMS.values() for x,_ in sq)>1})
   previous=source
  a={'frames':ids,'durations':times,'duration':sum(times),'loop':an in ('idle','walk','cast')}
  if hit is not None:a['hitFrame']=hit
  if an in ('dead','sit'):a['holdLast']=True
  animations[an]=a
  for scale in (1,4):gif([resize(bg(composites[n]),128*scale,120*scale) for n in ids],times,R/f'{an}_{scale}x.gif')
  sheet=blank(384*len(ids),360,BG)
  for i,n in enumerate(ids):paste(sheet,resize(bg(composites[n]),384,360),i*384,0);number(sheet,i*384+6,6,i,2);number(sheet,i*384+40,6,times[i],2)
  save(sheet,R/f'{an}_contact_sheet.png')
 c={'gender':'female','class':'wizard','bodyHeight':48,'headHeight':24,'proportion':2,'defaultWeapon':'staff','defaultHair':HAIR,'hairStyles':[HAIR],'animations':animations,'skillMotions':MAPPING,'frames':frames}
 m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':animations,'hairKeys':['#'+s for s in HK],'characters':{CID:c},'hair':{HAIR:{'gender':'female','style':'wizard_crescent_braid','proportion':'p2','pivot':[0,0],'poses':poses}},'weapons':{'staff':{'frames':{CID:wframes}}},'animationTransitions':{'cast_start':{'next':'cast'},'cast':{'repeat':'cast','finish':'idle'}}}
 (R/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
 (R/'FRAME_REVIEWS.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2))
 def contact(names,path):
  out=blank(384*5,360*((len(names)+4)//5),BG)
  for i,n in enumerate(names):paste(out,resize(bg(composites[n]),384,360),i%5*384,i//5*360);number(out,i%5*384+6,i//5*360+6,i,2)
  save(out,R/path)
 contact(list(frames),'contact_sheet.png')
 # One labeled/indexed row for every skill, all frames visible, consistent scale.
 skillSheet=blank(7*320,10*300,BG)
 for row,an in enumerate(GROUPS):
  a=animations[an]
  for i,n in enumerate(a['frames']):paste(skillSheet,resize(bg(composites[n]),320,300),i*320,row*300);number(skillSheet,i*320+5,row*300+5,row,2);number(skillSheet,i*320+30,row*300+5,i,2)
  b=animations['attack'];events=sorted(set(ends(a)+ends(b)));times=[q-p for p,q in zip(events,events[1:])];pairs=[]
  for t in events[:-1]:
   im=blank(256,120,BG);paste(im,composites[at(b,t)]);paste(im,composites[at(a,t)],128,0);pairs.append(im)
  for scale in (1,4):gif([resize(im,256*scale,120*scale) for im in pairs],times,R/f'attack_vs_{an}_{scale}x.gif')
  pair=blank(256,120,BG);paste(pair,composites[b['frames'][b['hitFrame']]]);paste(pair,composites[a['frames'][a.get('hitFrame',1)]],128,0);save(resize(pair,1024,480),R/f'attack_vs_{an}.png')
 save(skillSheet,R/'skills_contact_sheet.png')
 comparison=blank(384,120,BG)
 for i,im in enumerate([compose_other(R.parent/'pixel-hero-r12'),compose_other(R.parent/'pixel-knight-r15'),composites['idle_0']]):paste(comparison,im,128*i,0)
 save(comparison,R/'comparison_1x.png');save(resize(comparison,1536,480),R/'comparison_4x.png')
 (R/'verification/build_summary.json').write_text(json.dumps({'runtimeFrames':len(frames),'authoredApproved':len(sourceLayers),'animations':len(animations),'skillMotions':len(GROUPS),'skills':len(MAPPING),'rowOrder':list(GROUPS)},indent=2))
 print('Packaged',len(frames),'frames;',len(MAPPING),'skills;',len(GROUPS),'skill motions')
if __name__=='__main__':main()
