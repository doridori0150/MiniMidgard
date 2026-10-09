"""Build pixel/1 manifest and exact nearest-neighbor review artifacts."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
import clean
R=Path(__file__).resolve().parent;CID=clean.CID
TIMES={'idle':[220]*4,'walk':[90]*8,'attack':[110,40,40,40,130,70],'hurt':[80,160],'dead':[80,100,140,1],'sit':[1]}
SIZE=(128,120);VIEW=(24,48,120,116);N=Image.Resampling.NEAREST
def read(p):return Image.open(R/p).convert('RGBA')
def render(m,name,style='wavy_p2'):
    c=m['characters'][CID];f=c['frames'][name];h=m['hair'][style];hp=h['poses'][f['head']['pose']]
    loc=tuple(a-b for a,b in zip(f['head']['point'],h['pivot']))
    out=Image.new('RGBA',SIZE)
    for path,at in [(hp['back'],loc),(f['image'],(0,0)),(m['weapons']['sword']['frames'][CID][name],(0,0)),(f['grip'],(0,0)),(hp['front'],loc)]:out.alpha_composite(read(path),at)
    return out
def label(im,xy,text,size=15,color='#d9e3ed'):ImageDraw.Draw(im).text(xy,text,font=ImageFont.load_default(size=size),fill=color)
def panel(im,xy,frame,scale):
    tile=frame.crop(VIEW);tile=tile.resize((tile.width*scale,tile.height*scale),N);im.paste(tile,xy,tile)
def main():
    clean.main();data=json.loads((R/'source/layer_index.json').read_text())
    anim={}
    for a,ds in TIMES.items():
        anim[a]={'frames':[f'{a}_{i}' for i in range(len(ds))],'durations':ds,'duration':sum(ds),'loop':a in ('idle','walk')}
        if a in ('dead','sit'):anim[a]['holdLast']=True
    anim['attack']['hitFrame']=4
    char={'class':'swordsman','gender':'female','bodyHeight':48,'headHeight':28,'proportion':2,'defaultWeapon':'sword','defaultHair':'wavy_p2','hairStyles':['wavy_p2','ponytail_p2'],'animations':anim,'frames':data['frames']}
    hair={s:{'gender':'female','style':'wavy' if s=='wavy_p2' else 'ponytail','proportion':'p2','pivot':[48,48],'poses':p} for s,p in data['hair'].items()}
    m={'schema':'minimidgard.pixel/1','canvas':{'size':[128,120],'origin':[64,112],'bodyHeight':48},'animations':anim,'hairKeys':data['hairKeys'],'characters':{CID:char},'hair':hair,'weapons':{'sword':{'frames':{CID:data['weapons']}}}}
    clean.dump('manifest.json',m)
    imgs={n:render(m,n) for n in data['frames']}
    for name,im in imgs.items():clean.save(im,f'composite/{name}.png')
    # Row-based all-frame review: each art pixel becomes exactly 4 square pixels.
    review=Image.new('RGB',(8*384,6*320+70),'#26323e')
    label(review,(20,15),'ROUND 10 / DESIGN C / 25 FRAMES / 4x NEAREST',24)
    for row,(a,ds) in enumerate(TIMES.items()):
        for i,t in enumerate(ds):
            x=i*384;y=70+row*320
            label(review,(x+12,y),f'{a.upper()} {i} | '+('HOLD' if a in ('dead','sit') and i==len(ds)-1 else f'{t} ms')+(' | HIT' if a=='attack' and i==4 else ''),16)
            panel(review,(x,y+34),imgs[f'{a}_{i}'],4)
    review.save(R/'verification/review.png')
    (R/'verification/rows').mkdir(exist_ok=True)
    for row,a in enumerate(TIMES):
        for part in range(2 if a in ('walk','attack') else 1):
            review.crop((part*1536,70+row*320,part*1536+1536,70+(row+1)*320)).save(R/f'verification/rows/{a}_{part}.png')
    keys=Image.new('RGB',(3*768,2*600+60),'#26323e')
    label(keys,(20,15),'ATTACK / 8x NEAREST / HIT FRAME 4 / 430 ms',23)
    for i,t in enumerate(TIMES['attack']):
        x=i%3*768;y=60+i//3*600
        label(keys,(x+16,y),f'{i} / {t} ms'+(' / HIT - NO SMEAR' if i==4 else ''),22)
        panel(keys,(x,y+40),imgs[f'attack_{i}'],8)
    keys.save(R/'verification/attack_keys.png')
    pony=Image.new('RGB',(8*384,4*320+50),'#26323e')
    for i,name in enumerate(imgs):
        x=i%8*384;y=40+i//8*320
        label(pony,(x+12,y),name+' / PONYTAIL',15);panel(pony,(x,y+30),render(m,name,'ponytail_p2'),4)
    pony.save(R/'verification/ponytail_review.png')
    pony.crop((2304,680,3072,1000)).save(R/'verification/ponytail_down_detail.png')
    seq=[];ds=[]
    for a in ('idle','walk','attack'):
        for i,t in enumerate(TIMES[a]):
            tile=Image.new('RGB',(288,240),'#26323e')
            label(tile,(10,9),f'{a.upper()} {i} / {t} ms'+(' / HIT' if a=='attack' and i==4 else ''),14)
            panel(tile,(0,32),imgs[f'{a}_{i}'],3);seq.append(tile);ds.append(t)
    seq[0].save(R/'verification/play.gif',save_all=True,append_images=seq[1:],duration=ds,loop=0,disposal=2,optimize=False)
    # Independent loops make a step loop and return-to-idle easy to examine.
    for a in TIMES:
        seq=[];ds=[]
        for i,t in enumerate(TIMES[a]):
            tile=Image.new('RGB',(288,240),'#26323e');label(tile,(10,9),f'{a.upper()} {i}',14);panel(tile,(0,32),imgs[f'{a}_{i}'],3)
            seq.append(tile);ds.append(1000 if t==1 else t)
        if a=='attack':
            tile=Image.new('RGB',(288,240),'#26323e');panel(tile,(0,32),imgs['idle_0'],3);seq.append(tile);ds.append(440)
        seq[0].save(R/f'verification/{a}.gif',save_all=True,append_images=seq[1:],duration=ds,loop=0,disposal=2,optimize=False)
    print('Built manifest, 25 layered frames, both hairstyles, and review/GIF artifacts.')
if __name__=='__main__':main()
