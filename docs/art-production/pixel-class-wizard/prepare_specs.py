"""Reviewed source landmarks; deterministic extraction only."""
import json,math,copy
from pathlib import Path
R=Path(__file__).resolve().parent
specs=json.loads((R/'registration.json').read_text());base=specs['idle_0']
def box(x0,y0,x1,y1):return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]]
def capsule(a,b,r):
 dx,dy=b[0]-a[0],b[1]-a[1];d=math.hypot(dx,dy);u=(-dy/d*r,dx/d*r)
 return [[a[0]+u[0],a[1]+u[1]],[b[0]+u[0],b[1]+u[1]],[b[0]-u[0],b[1]-u[1]],[a[0]-u[0],a[1]-u[1]]]
def add(n,ground,cx,neck,g,tip,tail,dy=0,tx=64,lock=True,hair=None,face=None,orn=None,scale=None):
 s=copy.deepcopy(base);s.update(ground=ground,cx=cx,grip=g,tip=tip,dy=dy,tx=tx,lockHead=lock)
 s['scale']=scale or ((112-89-dy)/(ground-neck) if lock else .0555)
 s['headmask']=box(170,200,900,neck)
 # Shaft corridor and head polygon are separate to avoid assigning costume to staff.
 s['weapon']=capsule(tail,tip,26);s['weaponHead']=[[tip[0]+92*math.cos(i*math.pi/8),tip[1]+92*math.sin(i*math.pi/8)] for i in range(16)]
 s['glove']=box(g[0]-31,g[1]-30,g[0]+31,g[1]+30)
 if hair:s['hair']=hair
 if face:s['face']=face
 if orn:s['ornament']=orn
 specs[n]=s
add('idle_breath',1200,635,780,[882,908],[974,650],[821,1174])
add('walk_contact_a',1200,660,780,[892,903],[987,647],[817,1167],1,65)
add('walk_pass_a',1200,660,780,[891,894],[983,628],[831,1164],0,65)
add('walk_opposite',1170,655,706,[918,850],[1020,578],[843,1134],0,64,scale=.0495)
add('cast_gather',1200,635,780,[818,865],[907,667],[773,1004],1)
add('cast_hold',1200,635,780,[869,824],[950,618],[819,1153],0)
add('cast_breath',1200,635,780,[874,875],[957,648],[819,1167],1)
add('attack_ready',1214,637,786,[896,582],[449,158],[1066,732],2,63)
# Raised staff passes behind hair: source head is removed and canonical hair occludes it.
add('attack_hit',1155,624,780,[855,934],[1069,1053],[875,951],4,67)
add('attack_hold',1155,628,779,[855,946],[1073,1070],[874,963],5,67)
add('recover',1200,635,780,[917,790],[1091,539],[811,986],1,65)
add('hurt',1173,623,756,[892,879],[1017,650],[821,1138],0,62,False,
 hair=[[218,339],[805,340],[830,750],[706,785],[470,800],[409,892],[357,963],[272,960],[272,865],[350,824],[348,792],[232,784]],
 face=[[544,451],[608,450],[655,542],[693,622],[701,708],[628,738],[546,753],[493,714],[479,659],[526,620]],
 orn=box(315,552,411,744))
add('dead_kneel',1151,656,866,[818,1057],[1057,1081],[831,1068],0,64,False,
 hair=[[330,435],[904,435],[931,866],[842,899],[596,878],[452,941],[328,950],[328,846],[402,812],[396,747]],
 face=[[779,624],[820,625],[831,742],[815,809],[768,842],[706,850],[659,834],[622,797],[645,764],[689,727],[739,673]],orn=box(495,581,565,758))
add('dead_fall',1123,606,1032,[761,1070],[1122,1052],[593,1090],0,64,False,
 hair=[[157,676],[493,676],[645,834],[644,932],[577,1018],[438,1056],[296,1062],[235,1100],[44,1115],[45,1014],[156,1012]],
 face=[[436,806],[478,834],[539,878],[558,937],[523,991],[463,1022],[410,1024],[368,1004],[374,967],[414,922]],orn=box(210,830,294,990),scale=.0555)
add('sit',1173,635,875,[839,1093],[1108,1080],[850,1101],0,64,False,
 hair=[[325,430],[852,431],[883,829],[831,859],[616,879],[512,941],[421,1019],[322,1027],[319,936],[416,902],[437,831],[331,823]],
 face=[[705,566],[739,570],[778,625],[791,663],[794,781],[766,825],[704,842],[646,844],[604,814],[585,781],[594,752],[642,716],[677,664]],orn=box(421,591,493,778))
add('walk_cross',1200,661,720,[940,853],[1046,552],[862,1139],1,64)
add('cast_breath_fix',1200,635,780,[869,824],[950,618],[819,1153],0)
add('bolt_release',1200,621,776,[916,745],[1125,535],[790,934],1,66)
add('orb_release_fix',1174,574,775,[834,794],[1143,756],[856,792],4,67)
add('ground_press',1190,675,880,[907,923],[994,654],[869,1163],7,66)
add('sky_raise',1200,640,776,[910,581],[956,265],[898,870],0,64)
add('sky_command',1220,643,781,[950,456],[996,145],[940,756],0,64)
add('meteor_command',1182,627,794,[849,907],[1122,1039],[711,877],3,66)
add('water_scoop',1200,638,778,[860,958],[1078,1036],[880,969],2,64)
add('water_release',1213,639,782,[1014,557],[1145,247],[944,773],0,65)
add('blizzard_sweep',1174,599,763,[859,795],[1136,768],[876,799],1,64)
add('nova_open',1190,660,780,[923,782],[996,513],[901,1015],3,64)
add('aura_focus',1200,637,779,[831,810],[910,548],[780,1154],0,64,False)
add('barrier_hold',1180,620,780,[877,817],[935,581],[846,1136],2,63)
# Keep forearms that legitimately overlap head's source-space envelope.
specs['attack_ready']['keep']=[[[856,527],[943,528],[948,747],[817,817],[771,783],[812,695]]]
specs['sky_raise']['keep']=[[[855,548],[955,548],[938,739],[825,815],[780,773],[836,690]]]
specs['sky_command']['keep']=[[[908,406],[985,406],[977,645],[825,790],[782,766],[846,593]]]
specs['water_release']['keep']=[[[979,517],[1058,517],[1027,664],[927,779],[812,804],[782,776],[878,681]]]
specs['meteor_command']['keep']=[[[295,393],[425,393],[449,548],[486,584],[520,755],[481,787],[399,719],[330,657]]]
specs['barrier_hold']['keep']=[[[765,704],[818,704],[823,824],[727,844],[710,811]]]
# Source head centers differ from the anchored frame; delete full old head silhouette.
specs['walk_cross']['headmask']=box(265,130,920,720)
specs['ground_press']['headmask']=box(396,414,918,883)
specs['blizzard_sweep']['headmask']=box(270,320,825,765)
specs['orb_release_fix']['headmask']=box(248,330,803,778)
specs['meteor_command']['headmask']=box(394,333,915,798)
for rejected in ('cast_breath',):specs.pop(rejected,None)
(R/'registration.json').write_text(json.dumps(specs,indent=2))
