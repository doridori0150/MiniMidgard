"""Rebuild only the editable facial-ink curves. Existing v2 archive is required.

No head/body/hair/player/manifest writes. Uses the existing native curve rasterizer.
Coordinates preserve the v1 head-space registration (+20,+20 into the v2 head).
Run: python3 docs/art/rig-frames2/features_v3.py
"""
import json
from player import R, M, raster
from build import path, ellipse, vec, INK

BLUE = [25, 132, 213]
DARK_BLUE = [29, 100, 166]
WHITE = [255, 250, 235]


def shift(shapes, x, y):
    out = []
    for shape in shapes:
        s = dict(shape)
        if 'path' in s:
            s['path'] = [[cmd[0], *[v + (x if i % 2 == 0 else y) for i, v in enumerate(cmd[1:])]] for cmd in s['path']]
        if 'ellipse' in s:
            a,b,w,h=s['ellipse'];s['ellipse']=[a+x,b+y,w,h]
        out.append(s)
    return out


def eyes(typ, expr, male):
    shapes = []
    # V1 blue masses: x~166..192 / 254..278, y~243..289.
    # New head frame = old +20,+20. Existing feature origin=(170,252).
    for side, cx in enumerate([29, 116]):
        cy=32+(2 if side else 0)
        toward=1 if side==0 else -1
        if expr=='normal':
            if typ==1:
                w=28 if side==0 else 24
                top=-25 if not male else -22
                bottom=(26 if side==0 else 24) if not male else (23 if side==0 else 21)
                s=[path([['M',-w/2,top+3],['Q',0,top-1,w/2,top+3],['L',w/2-1,9],['C',w/2-2,bottom,-w/2+1,bottom+4,-w/2,10],['Z']],BLUE,stroke=None),
                   path([['M',-w/2,top+3],['Q',0,top-1,w/2,top+3],['L',w/2,top+12],['L',-w/2,top+12],['Z']],DARK_BLUE,stroke=None),
                   path([['M',-w/2-1,top+1],['L',w/2+1,top+4]],width=3.4 if not male else 4),
                   ellipse(-w/2+3,top+7,4.5,6,WHITE)]
                if not male and side==0:
                    s.append(path([['M',-w/2-1,top+1],['L',-w/2-4,top-2]],width=3))
            elif typ==2:
                # Round silhouette, broad iris, curved lid: different mass at 80px.
                w=39 if not male else 37;h=43 if not male else 39
                s=[ellipse(-w/2,-h/2,w,h,BLUE),
                   path([['M',-w/2,-2],['C',-w/2,-h/2-2,w/2,-h/2-2,w/2,-2],['Q',0,-10,-w/2,-2],['Z']],DARK_BLUE,stroke=None),
                   path([['M',-w/2-1,-5],['C',-w/2-1,-h/2-7,w/2+1,-h/2-7,w/2+1,-5]],width=3.2 if not male else 4),
                   ellipse(-w/2+5,-h/2+5,7,8,WHITE)]
            else:
                # Outer corner rises; broad angular top and tapered lower blue.
                # Mirror by side so both eyes point outward, not in one direction.
                def X(x):return x*toward
                h=23 if not male else 21
                s=[path([['M',X(-20),-14],['L',X(17),-4],['Q',X(12),h-1,X(-4),h-5],['Q',X(-18),h-9,X(-20),-14],['Z']],BLUE,stroke=None),
                   path([['M',X(-20),-14],['L',X(17),-4],['L',X(14),4],['L',X(-17),-4],['Z']],DARK_BLUE,stroke=None),
                   path([['M',X(-23 if not male else -20),-17],['Q',X(-8),-9,X(18),-4]],width=4 if not male else 4.6),
                   ellipse(X(-8)-2,-4,4,5,WHITE)]
            shapes += shift(s,cx,cy)
        elif expr=='hurt':
            span=[14,18,17][typ-1];depth=[13,16,8][typ-1]
            s=[path([['M',-span*toward,-depth],['L',9*toward,0],['L',-span*toward,depth]],width=[4,4,5][typ-1]+(.5 if male else 0))]
            shapes+=shift(s,cx,cy)
        else:
            depth=[10,20,2][typ-1];span=[14,19,19][typ-1]
            shapes += shift([path([['M',-span,-3],['Q',0,depth,span,-3]],width=[3.8,4,4.8][typ-1]+(.4 if male else 0))],cx,cy)
    return shapes


def brows(typ,expr,male):
    out=[]
    for side,cx in enumerate([29,116]):
        flip=1 if side==0 else -1
        if expr=='normal':
            if typ==1:
                cmd=[['M',-20*flip,-8 if not male else -4],['L',18*flip,7 if not male else 3]]
                width=4.5 if not male else 7
            elif typ==2:
                cmd=[['M',-19,1],['Q',0,-20,19,1]];width=4 if not male else 5.5
            else:
                cmd=[['M',-23,3],['L',23,3]];width=9 if not male else 10
        else:
            if typ==1:cmd=[['M',-19*flip,3],['L',17*flip,-5]];width=4.5 if not male else 7
            elif typ==2:cmd=[['M',-19,4],['Q',0,-19,19,4]];width=4 if not male else 5.5
            else:cmd=[['M',-23*flip,-2],['L',21*flip,5]];width=9 if not male else 10
        out+=shift([path(cmd,width=width)],cx,27 if typ==1 else 22)
    return out


def mouth(typ,expr):
    # Golden mouth centered at head x~240,y~328, 12px left of old v2 mouth.
    if expr=='normal':
        if typ==1:s=[path([['M',-13,-3],['Q',-1,9,12,-3]],width=3.7)]
        elif typ==2:s=[path([['M',-16,-7],['Q',0,-3,16,-7],['C',14,18,-13,18,-16,-7],['Z']],INK,width=3),path([['M',-9,7],['Q',0,3,9,7],['Q',0,16,-9,7],['Z']],[222,125,106],stroke=None)]
        else:s=[path([['M',-17,-1],['L',17,-1]],width=5)]
    elif expr=='hurt':
        if typ==1:s=[path([['M',-13,4],['Q',0,-10,13,4]],width=3.7)]
        elif typ==2:s=[ellipse(-10,-8,20,23,INK)]
        else:s=[path([['M',-15,2],['L',-7,-2],['L',0,3],['L',8,-2],['L',15,2]],width=4)]
    else:
        if typ==1:s=[path([['M',-11,2],['Q',0,-2,11,2]],width=3.6)]
        elif typ==2:s=[ellipse(-7,-6,14,18,INK)]
        else:s=[path([['M',-13,1],['L',13,1]],width=4)]
    return shift(s,21,18)


def main():
    assert (R/'archive/features_v2/manifest.json').exists(), 'Archive v2 before replacement'
    jobs=[]
    for gender,features in M['features'].items():
        for kind,types in features.items():
            for typ,entry in types.items():
                for expr,file in entry['variants'].items():
                    t=int(typ);male=gender=='male'
                    if kind=='eyes':sz=[160,72];s=eyes(t,expr,male)
                    elif kind=='brows':sz=[160,40];s=brows(t,expr,male)
                    elif kind=='mouth':sz=[66,46];s=mouth(t,expr)
                    else:
                        sz=[34,34]
                        s=[ellipse(15,16,3.8,3.8,INK)] if t==1 else [path([['M',18,10],['Q',17,17,12,21],['Q',18,24,24,20]],width=3)]
                    jobs.append(vec(file,sz,s))
    raster(jobs,'source/features_v3_jobs.json')
    print('Rebuilt 52 facial PNGs. Manifest and protected assets unchanged.')


if __name__=='__main__':main()
