"""Read source sheet, inspect center-sampled native cells. No geometry drawing."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
R=Path(__file__).resolve().parent
P=[tuple(bytes.fromhex(s[1:])) for s in json.loads((R/'source/design_palettes.json').read_text())['c']]
def nearest(rgb): return min(P,key=lambda p:sum((a-b)**2 for a,b in zip(p,rgb)))
def sample(im,box,step):
    x0,y0,x1,y1=box
    out=Image.new('RGBA',(round((x1-x0)/step),round((y1-y0)/step)))
    for y in range(out.height):
        for x in range(out.width):
            p=im.getpixel((min(x1-1,int(x0+(x+.5)*step)),min(y1-1,int(y0+(y+.5)*step))))
            if p[3]>=210:out.putpixel((x,y),(*nearest(p[:3]),255))
    return out
def main():
    im=Image.open(R/'source/motion_sheet_corrected.png').convert('RGBA')
    frames={}
    for i in range(8):
        name=['idle_0','idle_1','idle_2','idle_3','hurt_0','hurt_1','sit_0','pony'][i]
        frames[name]={'box':[i*192,72,(i+1)*192,320],'step':4.7}
    for i in range(8):frames[f'walk_{i}']={'box':[i*192,350,(i+1)*192,583],'step':4.45}
    for i,(l,r) in enumerate([(8,185),(196,403),(404,617),(617,839),(839,1086),(1090,1274)]):
        frames[f'attack_{i}']={'box':[l,585,r,827],'step':4.4}
    for i,box in enumerate([(22,831,210,1002),(228,831,391,1002),(394,867,642,1002),(655,877,920,1002)]):
        frames[f'dead_{i}']={'box':list(box),'step':4.5}
    for i in range(8):
        x=(i%4)*384;y=(i//4)*480
        frames[f'walk_{i}']={'box':[x,y+90,x+384,y+500],'step':8.0,'source':'walk_corrected.png'}
    out=Image.new('RGB',(8*320,4*380),'#26323e');d=ImageDraw.Draw(out)
    (R/'source/sampled').mkdir(exist_ok=True)
    for i,(name,m) in enumerate(frames.items()):
        source=Image.open(R/'source'/m['source']).convert('RGBA') if 'source' in m else im
        cell=sample(source,m['box'],m['step']);cell.save(R/f'source/sampled/{name}.png')
        x=i%8*320;y=i//8*380
        d.text((x+8,y+5),name,fill='white',font=ImageFont.load_default(size=16))
        out.paste(cell.resize((cell.width*5,cell.height*5),Image.Resampling.NEAREST),(x+4,y+30),cell.resize((cell.width*5,cell.height*5),Image.Resampling.NEAREST))
    out.save(R/'verification/sampled_review.png')
    (R/'source/extraction.json').write_text(json.dumps(frames,indent=2)+'\n')
if __name__=='__main__':main()
