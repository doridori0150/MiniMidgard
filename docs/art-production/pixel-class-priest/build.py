"""Package sequentially authored/registered poses. No new pose synthesis."""
from register import *
GROUPS={
 'skill_mend':['heal','cure','slow_poison','status_recovery'],
 'skill_bless':['blessing','increase_agi','impositio','suffragium','aspersio','kyrie'],
 'skill_hymn':['angelus','sacrament','magnificat','gloria'],
 'skill_judgment':['decrease_agi','signum_crucis','lex_divina','lex_aeterna'],
 'skill_light':['holy_light','turn_undead'],
 'skill_holy_strike':['holy_strike'],
 'skill_aura':['ruwach','sanct_aura'],
 'skill_ground':['pneuma','pr_safety_wall','sanctuary'],
 'skill_magnus':['magnus'],'skill_resurrection':['resurrection'],
 'skill_redemptio':['redemptio'],'skill_portal':['teleport','warp_portal'],
 'skill_water':['aqua_benedicta']}
MAPPING={s:a for a,ids in GROUPS.items() for s in ids}
ANIMS={
'idle':([('idle',240),('idle_breath',240),('idle',240)],None),
'walk':([(f'walk_{i}',100) for i in range(8)],None),
'attack':([('attack_ready',70),('attack_back_fix',90),('attack_apex',90),('attack_down',50),('attack_hit',60),('attack_hold',160),('recover',70),('idle',60)],4),
'cast_start':([('cast_gather',90),('cast_hold',100)],None),
'cast':([('cast_hold',180),('cast_breath',180),('cast_hold',180)],None),
'hurt':([('hurt',100),('recover',130),('idle',100)],None),
'dead':([('hurt',100),('kneel',150),('fallen',1000)],None),
'sit':([('sit',1000)],None),
'skill_mend':([('cast_hold',60),('cast_gather',70),('mend',180),('cast_gather',100),('idle',100)],2),
'skill_bless':([('cast_gather',100),('bless_raise',140),('mend',160),('cast_gather',100),('idle',100)],None),
'skill_hymn':([('cast_gather',100),('aura',90),('hymn',240),('aura',100),('cast_gather',80),('idle',90)],None),
'skill_judgment':([('bless_raise',60),('judgment_cross',70),('light_release_fix',150),('judgment_cross',110),('cast_gather',110),('idle',100)],2),
'skill_light':([('cast_hold',60),('mend',70),('light_release_fix',200),('mend',100),('cast_gather',100),('idle',100)],2),
'skill_holy_strike':([('attack_ready',50),('attack_back_fix',80),('attack_hit',50),('attack_apex',70),('attack_down',40),('attack_hit',60),('attack_hold',150),('recover',90),('idle',90)],2),
'skill_aura':([('cast_gather',100),('cast_hold',80),('aura',240),('cast_hold',100),('cast_gather',80),('idle',100)],None),
'skill_ground':([('cast_hold',60),('water_scoop',70),('ground',180),('water_scoop',100),('recover',100),('idle',100)],2),
'skill_magnus':([('attack_ready',60),('ground',70),('magnus',230),('ground',130),('recover',130),('idle',100)],2),
'skill_resurrection':([('water_scoop',60),('water_cup',70),('resurrection_fix',240),('hymn',100),('cast_gather',130),('idle',100)],2),
'skill_redemptio':([('cast_gather',60),('kneel',70),('redemptio',220),('kneel',180),('recover',130),('idle',100)],2),
'skill_portal':([('cast_hold',60),('mend',70),('portal',190),('aura',120),('cast_gather',100),('idle',100)],2),
'skill_water':([('cast_hold',50),('water_scoop',80),('water_cup',220),('cast_hold',150),('cast_gather',100),('idle',100)],2)
}
LABELS=dict(zip(ANIMS,['대기','걷기','일반 공격','시전 시작','기도 유지','피격','쓰러짐','앉기','회복·치료','축복·수호','찬가·파티 강복','성호·율법','빛·정화','성스러운 일격','성광·오라','장막·성역 설치','대퇴마','부활','속죄','순간이동·차원문','성수 만들기']))
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
def other(root):
 m=json.loads((root/'manifest.json').read_text());cid=next(iter(m['characters']));c=m['characters'][cid];a=c.get('animations',m['animations']);n=a['idle']['frames'][0];f=c['frames'][n]
 h=m['hair'][c['defaultHair']]['poses'][f['head']['pose']];pivot=h.get('pivot',[0,0]);offset=[f['head']['point'][i]-pivot[i] for i in (0,1)]
 w=m['weapons'][c['defaultWeapon']]['frames'][cid][n];out=blank(128,120)
 for p,xy in [(h['back'],offset),(f['image'],[0,0]),(w,[0,0]),(f['grip'],[0,0]),(h['front'],offset)]:paste(out,read(root/p),*xy)
 return out

def main():
 stats=json.loads((R/'verification/registration.json').read_text());frames={};poses={};wframes={};animations={};reviews=[];composites={}
 sources={n:layers(n) for seq,_ in ANIMS.values() for n,_ in seq}
 for an,(seq,hit) in ANIMS.items():
  ids=[];times=[];previous=None
  for i,(source,ms) in enumerate(seq):
   n=f'{an}_{i}';ids.append(n);times.append(ms);ps=paths(n);ls=sources[source]
   for k,p in ps.items():save(ls[k],R/p)
   im=compose(ls);composites[n]=im;save(im,R/f'composite/{n}.png')
   st=stats[source];g,t=st['grip'],st['tip']
   frames[n]={'image':ps['body'],'head':{'point':[0,0],'pose':n,'basePose':'down' if source=='fallen' else 'up'},'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},'grip':ps['grip']}
   poses[n]={'front':ps['front'],'back':ps['back'],'pivot':[0,0]};wframes[n]=ps['mace']
   reviews.append({'animation':an,'frame':i,'source':source,'previous':previous,'duration':ms,'bounds':bounds(im),'hand':'near','headOffset':st['headOffset'],'sourceReused':sum(x==source for sq,_ in ANIMS.values() for x,_ in sq)>1});previous=source
  a={'frames':ids,'durations':times,'duration':sum(times),'loop':an in ('idle','walk','cast')}
  if hit is not None:a['hitFrame']=hit
  if an in ('dead','sit'):a['holdLast']=True
  animations[an]=a
  for scale in (1,4):gif([resize(bg(composites[n]),128*scale,120*scale) for n in ids],times,R/f'{an}_{scale}x.gif')
  sheet=blank(256*len(ids),240,BG)
  for i,n in enumerate(ids):paste(sheet,resize(bg(composites[n]),256,240),i*256,0);number(sheet,i*256+6,6,i,2);number(sheet,i*256+40,6,times[i],2)
  save(sheet,R/f'{an}_contact_sheet.png')
 c={'gender':'female','class':'priest','bodyHeight':48,'headHeight':24,'proportion':2,'defaultWeapon':'mace','defaultHair':HAIR,'hairStyles':[HAIR],'animations':animations,'skillMotions':MAPPING,'frames':frames}
 m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':animations,'hairKeys':['#'+s for s in HK],'characters':{CID:c},'hair':{HAIR:{'gender':'female','style':'priest_crown_braid','proportion':'p2','pivot':[0,0],'poses':poses}},'weapons':{'mace':{'frames':{CID:wframes}}},'animationTransitions':{'cast_start':{'next':'cast'},'cast':{'repeat':'cast','finish':'idle'}}}
 (R/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(R/'FRAME_REVIEWS.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
 # Index contact of all runtime frames; per-action sheets retain local indices/time.
 names=list(frames);sheet=blank(256*8,240*((len(names)+7)//8),BG)
 for i,n in enumerate(names):paste(sheet,resize(bg(composites[n]),256,240),i%8*256,i//8*240);number(sheet,i%8*256+6,i//8*240+6,i,2)
 save(sheet,R/'contact_sheet.png')
 sheet=blank(256*max(len(animations[an]['frames']) for an in GROUPS),240*len(GROUPS),BG)
 for row,an in enumerate(GROUPS):
  a=animations[an]
  for i,n in enumerate(a['frames']):paste(sheet,resize(bg(composites[n]),256,240),i*256,row*240);number(sheet,i*256+5,row*240+5,row,2);number(sheet,i*256+40,row*240+5,i,2)
  b=animations['attack'];events=sorted(set(ends(a)+ends(b)));times=[q-p for p,q in zip(events,events[1:])];pairs=[]
  for t in events[:-1]:
   im=blank(256,120,BG);paste(im,composites[at(b,t)]);paste(im,composites[at(a,t)],128,0);pairs.append(im)
  for scale in (1,4):gif([resize(im,256*scale,120*scale) for im in pairs],times,R/f'attack_vs_{an}_{scale}x.gif')
  pair=blank(256,120,BG);paste(pair,composites[b['frames'][b['hitFrame']]]);paste(pair,composites[a['frames'][a.get('hitFrame',2)]],128,0);save(resize(pair,1024,480),R/f'attack_vs_{an}.png')
 save(sheet,R/'skills_contact_sheet.png')
 comparison=blank(384,120,BG)
 for i,im in enumerate([other(R.parent/'pixel-hero-r12'),other(R.parent/'pixel-knight-r15'),composites['idle_0']]):paste(comparison,im,128*i,0)
 save(comparison,R/'comparison_1x.png');save(resize(comparison,1536,480),R/'comparison_4x.png')
 (R/'verification/build_summary.json').write_text(json.dumps({'runtimeFrames':len(frames),'approvedSources':len(sources),'animations':len(animations),'skillMotions':len(GROUPS),'skills':len(MAPPING),'rowOrder':list(GROUPS)},indent=2))
 print('Packaged',len(frames),'frames;',len(MAPPING),'skills;',len(GROUPS),'skill motions')
if __name__=='__main__':main()
