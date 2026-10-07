"""Build atlas crops + explicit manifest. Standard-library Python; raster.swift handles PNGs."""
from pathlib import Path
import json, math, subprocess
ROOT=Path(__file__).resolve().parent
parts={}
jobs=[]
def part(id,rect,size,pivot,anchors={},z=0,angle=0):
    rect=[round(v*1254/1280) for v in rect]
    file=f'parts/{id}.png'
    jobs.append(dict(op='extract',source='source/atlas.png',rect=rect,size=size,file=file))
    parts[id]=dict(file=file,size=size,pivot=pivot,anchors=anchors,z=z,restAngle=angle)
part('face', [20,100,280,270],[96,88],[47,83],{'top':[47,0],'mid':[78,37],'low':[59,77]},70)
part('hair_front',[300,30,315,350],[125,126],[62,117],{'top':[63,20],'mid':[98,58],'low':[87,109]},80)
part('hair_back',[625,100,330,285],[117,100],[58,91],{},10)
part('novice_torso',[980,110,260,275],[80,78],[40,10],{'neck':[42,0]},40)
part('novice_arm_near',[70,410,160,290],[32,64],[15,10],{'grip':[17,53]},90)
part('novice_arm_far',[405,410,160,290],[31,62],[15,10],{'grip':[17,52]},20)
part('leg_near',[680,526,190,167],[39,58],[16,5],{'foot':[23,56]},35)
part('leg_far',[1010,526,190,167],[38,58],[16,5],{'foot':[23,56]},30)
part('swordsman_torso',[25,710,280,275],[84,82],[42,10],{'neck':[42,0]},40)
part('swordsman_arm_near',[405,710,165,275],[34,64],[15,10],{'grip':[20,54]},90)
part('dagger',[620,780,270,135],[76,29],[15,15],{'tip':[74,15],'offhand':[8,15]},85)
part('sword',[900,780,345,135],[107,32],[20,16],{'tip':[105,16],'offhand':[8,16]},85)
part('leaf',[30,1030,250,180],[40,27],[15,26],{},100)
part('hairpin',[340,1030,250,180],[33,20],[17,10],{},110)
part('novice_arm_contact',[620,1030,290,160],[68,28],[12,15],{'grip':[56,13]},90)
part('swordsman_arm_contact',[950,1020,290,170],[68,31],[12,17],{'grip':[57,17]},90)
ROOT.joinpath('extract_jobs.json').write_text(json.dumps(jobs,indent=2))
subprocess.run([str(ROOT/'.raster'),str(ROOT),'extract_jobs.json'],check=True)
# A node's local origin equals its parent's named anchor (or stage origin), plus offset.
# Angles are clockwise degrees in a y-down coordinate system.
nodes={
 'body':dict(parent=None,offset=[148,174]),
 'head':dict(parent='body',offset=[2,-7],scale=[1.18,1.18]),
 'hair_back':dict(parent='head',part='hair_back'),
 'arm_far':dict(parent='body',offset=[-27,6],slot='arm_far',angle=24,z=45),
 'leg_far':dict(parent='body',offset=[-17,59],part='leg_far',angle=5),
 'leg_near':dict(parent='body',offset=[17,59],part='leg_near',angle=-5),
 'torso':dict(parent='body',slot='torso'),
 'face':dict(parent='head',part='face'),
 'hair_front':dict(parent='head',part='hair_front'),
 'arm_near':dict(parent='body',offset=[29,8],slot='arm_near',angle=-32),
 'weapon':dict(parent='arm_near',anchor='grip',slot='weapon',worldAngle=-48),
 'head_top':dict(parent='hair_front',anchor='top',slot='head_top'),
 'head_mid':dict(parent='hair_front',anchor='mid',slot='head_mid'),
 'head_low':dict(parent='face',anchor='low',slot='head_low'),
}
def frame(ms,**changes):return dict(time=ms,nodes=changes)
def n(**kw):return kw
animations={
'idle':dict(duration=1200,loop=True,keys=[frame(0),frame(600,body=n(offset=[148,172],scale=[1,1.008])),frame(1200)]),
'walk':dict(duration=640,loop=True,keys=[frame(0,leg_near=n(angle=-16,offset=[21,59]),leg_far=n(angle=16,offset=[-21,59]),arm_near=n(angle=-18),arm_far=n(angle=30),body=n(offset=[148,172])),frame(160),frame(320,leg_near=n(angle=10,offset=[19,57]),leg_far=n(angle=-10,offset=[-19,59]),arm_near=n(angle=-43),arm_far=n(angle=5),body=n(offset=[148,172])),frame(480),frame(640,leg_near=n(angle=-16,offset=[21,59]),leg_far=n(angle=16,offset=[-21,59]),arm_near=n(angle=-18),arm_far=n(angle=30),body=n(offset=[148,172]))]),
'melee':dict(duration=500,loop=False,events=[dict(time=220,name='contact')],keys=[frame(0),frame(130,arm_near=n(angle=-120),weapon=n(worldAngle=-140),body=n(angle=-8)),frame(220,arm_near=n(slot='arm_contact',angle=0),weapon=n(worldAngle=0),body=n(offset=[153,174],angle=8),head=n(angle=-8),leg_near=n(angle=-18),leg_far=n(angle=18)),frame(300,arm_near=n(slot='arm_contact',angle=16),weapon=n(worldAngle=24),body=n(angle=10)),frame(500)]),
'bow':dict(duration=850,loop=False,events=[dict(time=550,name='release')],keys=[frame(0),frame(220,arm_near=n(slot='arm_contact',angle=-8),arm_far=n(angle=-90,z=95),weapon=n(worldAngle=-90)),frame(500,arm_near=n(slot='arm_contact',angle=-8),arm_far=n(angle=-120,z=95),weapon=n(worldAngle=-90)),frame(550,arm_near=n(slot='arm_contact',angle=-8),arm_far=n(angle=-75,z=95),weapon=n(worldAngle=-90)),frame(850)],status='pose scaffold; bow/arrow/string art not included'),
'cast':dict(duration=900,loop=False,events=[dict(time=420,name='cast')],keys=[frame(0),frame(280,arm_near=n(slot='arm_contact',angle=-50),arm_far=n(angle=60),weapon=n(visible=False),head=n(angle=-6)),frame(420,arm_near=n(slot='arm_contact',angle=-35),arm_far=n(angle=50),weapon=n(visible=False),body=n(offset=[148,171])),frame(900)]),
'sit':dict(duration=500,loop=False,keys=[frame(0),frame(500,body=n(offset=[148,189]),leg_near=n(angle=-76),leg_far=n(angle=-62),arm_near=n(angle=-18),weapon=n(visible=False))]),
'hurt':dict(duration=400,loop=False,keys=[frame(0),frame(100,body=n(offset=[139,177],angle=-15),head=n(angle=-9),arm_near=n(angle=-72),arm_far=n(angle=48),weapon=n(visible=False)),frame(400)]),
'dead':dict(duration=550,loop=False,keys=[frame(0),frame(550,body=n(offset=[164,216],angle=-90),head=n(angle=8),arm_near=n(angle=-8),arm_far=n(angle=12),leg_near=n(angle=5),leg_far=n(angle=-5),weapon=n(visible=False))]),
}
manifest=dict(schema='minimidgard.cutout/1',canvas=dict(size=[384,320],origin=[148,286],referenceHeight=257,displayHeight=80,axis='x right, y down',angles='clockwise degrees'),parts=parts,nodes=nodes,outfits={'novice':{'torso':'novice_torso','arm_near':'novice_arm_near','arm_far':'novice_arm_far','arm_contact':'novice_arm_contact'},'swordsman':{'torso':'swordsman_torso','arm_near':'swordsman_arm_near','arm_far':'swordsman_arm_near','arm_contact':'swordsman_arm_contact'}},hairStyles={'novice_bob':{'front':'hair_front','back':'hair_back'}},hairColors={'cream':None,'blue':'#5986d0','brown':'#9f6339','red':'#d95250','purple':'#aa6bc5','pink':'#e886a4','green':'#85af6c','black':'#59535d','gray':'#aba6b6','gold':'#edbb60'},faces=['face'],equipment={'head_top':['leaf'],'head_mid':['hairpin'],'head_low':[],'weapon':['dagger','sword']},defaults={'outfit':'novice','weapon':'dagger','hairColor':'cream','head_top':None,'head_mid':None,'head_low':None},animations=animations,renderRules={'attachment':'parent matrix * translate(parent anchor - parent pivot + offset) * rotate(angle) * scale; draw at -pivot','worldAngle':'absolute canvas-space rotation, preserving transformed grip position and inherited scale; apply facing mirror afterward','sorting':'ascending part.z then node id; optional node.z overrides','interpolation':'linear numeric fields; missing fields resolve to rest node; slot and visible step at key time','tint':'multiply RGB on hair_front/hair_back only, restore original alpha','facing':'mirror entire character around canvas.origin.x, including attachments','nonLoop':'clamp at duration','missingAsset':'error for unknown non-null slot value; null equipment skips node'})
ROOT.joinpath('manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
print(f'Extracted {len(parts)} PNG parts and wrote manifest.')
