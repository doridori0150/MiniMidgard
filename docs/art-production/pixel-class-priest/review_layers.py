from register import *
names=list(json.loads((R/'registration.json').read_text()))
for n in names:
 ls=layers(n);out=blank(384,120,BG);paste(out,compose(ls))
 ls['mace']=blank(128,120);paste(out,compose(ls),128,0)
 for k in ('front','back'):ls[k][2]=[(30+HP.index(p)*30,150-HP.index(p)*30,190-HP.index(p)*30,255) if p[3] else p for p in ls[k][2]]
 paste(out,compose(ls),256,0);save(resize(out,1536,480),R/f'verification/layers_{n}.png')
