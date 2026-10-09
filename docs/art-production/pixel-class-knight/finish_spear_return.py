"""Match base attack's final spear attachment to idle, then refresh affected previews."""
from build import *
n='attack_7';m=json.loads((R/'manifest.json').read_text());c=m['characters'][CID]
f=c['frames'][n];g=f['weapon']['gripPoint'];ls=layers(n)
sp,gr,tip=spear_layer(read(R/'weapons/spear/master.png'),g,-28,ls['body'],ls['grip'],True)
save(sp,R/m['weapons']['spear']['frames'][CID][n]);save(gr,R/m['weapons']['spear']['grips'][CID][n]);ls['spear']=sp
save(compose(ls,'spear'),R/f'composite/spear/{n}.png');by=f['weapon']['byType']['spear'];by['tipPoint']=tip;by['angleDegrees']=-28
dump('manifest.json',m);metrics=json.loads((R/'verification/frame_metrics.json').read_text());metrics[n]['spearTip']=tip;metrics[n]['spearAngle']=-28;metrics[n]['spearBounds']=bounds(compose(ls,'spear'));dump('verification/frame_metrics.json',metrics)
os.environ['SPEAR_ONLY']='1';make_gifs(m)
# Refresh complete spear sheet after correcting the idle-return angle.
names=list(c['frames']);sh=blank(6*256,math.ceil(len(names)/6)*168,BG)
for i,name in enumerate(names):
 x=i%6*256;y=i//6*168;label(sh,x+4,y+4,name.replace('skill_',''),1);paste(sh,resize(crop(bgframe(name,'spear'),(0,44,128,120)),256,152),x,y+16)
save(sh,R/'spear_contact_sheet.png')
assert read(R/'composite/spear/attack_7.png')==read(R/'composite/spear/idle_0.png')
print('Spear base attack returns exactly to idle')
