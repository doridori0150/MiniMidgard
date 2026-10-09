"""Package only the reviewed walk revision, preserving every non-walk asset."""
from build import *

def main():
    m=json.loads((R/'manifest.json').read_text())
    c=m['characters'][CID]
    stats=json.loads((R/'verification/registration.json').read_text())
    old_reviews=json.loads((R/'FRAME_REVIEWS.json').read_text())
    reviews=[]
    ids=[]
    seq,_=ANIMS['walk']
    previous=None
    for i,(source,ms) in enumerate(seq):
        n=f'walk_{i}';ids.append(n);ps=paths(n);ls=layers(source)
        for k,p in ps.items():save(ls[k],R/p)
        im=compose(ls);save(im,R/f'composite/{n}.png')
        st=stats[source];g,t=st['grip'],st['tip']
        c['frames'][n]={'image':ps['body'],'head':{'point':[0,0],'pose':n,'basePose':'up'},
                       'weapon':{'z':'front','visible':True,'hand':'near','gripPoint':g,'tipPoint':t,
                                 'angleDegrees':round(math.degrees(math.atan2(t[1]-g[1],t[0]-g[0])),2)},
                       'grip':ps['grip']}
        m['hair'][HAIR]['poses'][n]={'front':ps['front'],'back':ps['back'],'pivot':[0,0]}
        m['weapons']['staff']['frames'][CID][n]=ps['staff']
        reviews.append({'animation':'walk','frame':i,'source':source,'previous':previous,
                        'duration':ms,'bounds':bounds(im),'hand':'near',
                        'headOffset':st['headOffset'],'sourceReused':False})
        previous=source
    a={'frames':ids,'durations':[ms for _,ms in seq],'duration':sum(ms for _,ms in seq),'loop':True}
    c['animations']['walk']=a;m['animations']['walk']=a
    # Keep action and frame ordering identical to the original, expanding walk in place.
    ordered=[n for an in c['animations'].values() for n in an['frames']]
    c['frames']={n:c['frames'][n] for n in ordered}
    m['hair'][HAIR]['poses']={n:m['hair'][HAIR]['poses'][n] for n in ordered}
    m['weapons']['staff']['frames'][CID]={n:m['weapons']['staff']['frames'][CID][n] for n in ordered}
    (R/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
    updated=[]
    for an in c['animations']:
        updated.extend(reviews if an=='walk' else [v for v in old_reviews if v['animation']==an])
    (R/'FRAME_REVIEWS.json').write_text(json.dumps(updated,ensure_ascii=False,indent=2))
    ims=[read(R/f'composite/{n}.png') for n in ids]
    for scale in (1,4):
        gif([resize(bg(im),128*scale,120*scale) for im in ims],a['durations'],R/f'walk_{scale}x.gif')
    sheet=blank(384*len(ids),360,BG)
    for i,im in enumerate(ims):
        paste(sheet,resize(bg(im),384,360),i*384,0)
        number(sheet,i*384+6,6,i,2);number(sheet,i*384+40,6,100,2)
    save(sheet,R/'walk_contact_sheet.png')
    full=blank(384*5,360*((len(ordered)+4)//5),BG)
    for i,n in enumerate(ordered):
        paste(full,resize(bg(read(R/f'composite/{n}.png')),384,360),i%5*384,i//5*360)
        number(full,i%5*384+6,i//5*360+6,i,2)
    save(full,R/'contact_sheet.png')
    # Compact review sheet: same scale and crop for every frame, feet baseline visible.
    detail=blank(4*224,2*240,BG)
    for i,im in enumerate(ims):
        tile=resize(crop(bg(im),(38,60,94,120)),224,240)
        paste(detail,tile,(i%4)*224,(i//4)*240)
        number(detail,i%4*224+8,i//4*240+6,i,2)
    save(detail,R/'verification/walk_cycle_4x.png')
    summary=json.loads((R/'verification/build_summary.json').read_text())
    summary.update(runtimeFrames=len(ordered),authoredApproved=len({n for sq,_ in ANIMS.values() for n,_ in sq}))
    (R/'verification/build_summary.json').write_text(json.dumps(summary,indent=2))
    print('Walk:',len(ids),'distinct authored poses;',a['duration'],'ms; runtime frames:',len(ordered))

if __name__=='__main__':main()
