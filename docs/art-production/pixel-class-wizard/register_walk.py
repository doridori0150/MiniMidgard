"""Register one reviewed walk source; never synthesize poses or rebuild other actions."""
from register import *
import copy

if __name__ == '__main__':
    n = sys.argv[1]
    ground, cx, neck, dy, gx, gy, tipx, tipy = map(int, sys.argv[2:])
    specs = json.loads((R/'registration.json').read_text())
    s = copy.deepcopy(specs['walk_contact_a'])
    scale = (23-dy)/(ground-neck)
    s.update(ground=ground, cx=cx, scale=scale, dy=dy, tx=65,
             grip=[gx,gy], tip=[tipx,tipy],
             headmask=[[170,150],[900,150],[900,neck],[170,neck]])
    # Extraction masks follow the reviewed original staff, with glove on top.
    dx,dy_staff = tipx-gx,tipy-gy
    length = math.hypot(dx,dy_staff)
    ux,uy = -dy_staff/length*26,dx/length*26
    tail = [gx-dx*.98,gy-dy_staff*.98]
    s['weapon'] = [[tail[0]+ux,tail[1]+uy],[tipx+ux,tipy+uy],
                   [tipx-ux,tipy-uy],[tail[0]-ux,tail[1]-uy]]
    s['weaponHead'] = [[tipx+92*math.cos(i*math.pi/8),tipy+92*math.sin(i*math.pi/8)] for i in range(16)]
    s['glove'] = [[gx-32,gy-30],[gx+32,gy-30],[gx+32,gy+30],[gx-32,gy+30]]
    specs[n] = s
    (R/'registration.json').write_text(json.dumps(specs,indent=2))
    stats=json.loads((R/'verification/registration.json').read_text())
    stats[n]=register(n,s)
    (R/'verification/registration.json').write_text(json.dumps(stats,indent=2))
    print(n,stats[n])
