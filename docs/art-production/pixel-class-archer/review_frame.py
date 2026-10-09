"""Show one packed frame and its component layers at 4x for visual QA."""
from pack import *
import sys
name=sys.argv[1];specs=json.loads((R/'spec.json').read_text())
base,_=frame('idle_0',specs['idle_0'])
ls,info=frame(name,specs[name],None if name=='idle_0' else base)
images=[compose(ls),ls['body'],ls['front'],ls['weapon'],ls['grip']]
sheet=blank(384*5,360,BG)
for i,im in enumerate(images):
 paste(sheet,resize(crop(im,(16,32,112,120)),384,352),i*384,8);number(sheet,i*384+8,8,i,2)
save(sheet,R/f'verification/{name}_layers.png')
print(json.dumps(info))
