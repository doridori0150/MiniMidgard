#!/usr/bin/env python3
# 에셋 공방(asset-kit) 영웅 납품 → 게임 src/assets/kit-heroes/ (schema minimidgard.kit-hero/1, src/render/kit-hero.ts가 그림)
#   python3 -I tools/art/import-kit-heroes.py [asset-kit의 works/minimidgard 폴더]
# 읽는 것: characters/<id>-pixel-<단계>/manifest.json 중 category가 motion인 시트(전투 대기 · 공격 …). asset-kit은 읽기만 한다.
# 하는 일: 동작마다 그 동작 칸들을 같은 상자(불투명 영역의 합 + 1칸)로 잘라 복사하고, 발 기준점을 그 상자 기준으로 옮긴다.
#   크기는 공방 크기 그대로(회귀 용사 영웅 규격, 키 약 130칸) 두고, 필드 크기 맞춤은 kit-hero.ts가 한다(asset-kit 규칙 B8).
import json, os, sys, glob, shutil
from PIL import Image

SRC = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/Projects/game/asset-kit/works/minimidgard')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'assets', 'kit-heroes')
OUT = os.path.normpath(OUT)
GENDER = {'m': 'male', 'f': 'female'}
ANIM = {'battle_idle': 'idle'}  # 공방 동작 이름 → 게임 상태 이름(같으면 그대로)

CANVAS, PIVOT = [320, 300], (160, 280)  # 공방 영웅 동작 납품 규격(전투 대기 납품, 2026-11-14)

def delivered(sh):
    # 작업 폴더(영상 칸 · 핵심 자세 시트 …)도 같은 glob에 걸린다: 납품 표시가 있으면 그것만, 없으면 납품 규격(캔버스 · 발 기준점)인 동작 시트만
    if 'delivered' in sh:
        return sh['delivered'] is True
    return sh.get('category') == 'motion' and sh.get('canvas') == CANVAS and all(tuple(f.get('pivot', ())) == PIVOT for f in sh.get('frames', []))

chars, skipped = {}, []
for mf in sorted(glob.glob(os.path.join(SRC, 'characters', '*-pixel-*', 'manifest.json'))):
    m = json.load(open(mf))
    for sh in m.get('sheets', []):
        if sh.get('category') == 'motion' and not delivered(sh):
            skipped.append(f"{os.path.relpath(mf, SRC)} {sh.get('id')} {sh.get('kind')}")
        if not delivered(sh):
            continue
        aid = sh['id']                      # assassin_m
        cls, g = aid.rsplit('_', 1)
        key = f'{cls}_{GENDER.get(g, g)}'   # assassin_male
        c = chars.setdefault(key, {'class': cls, 'gender': GENDER.get(g, g), 'source': aid, 'bodyHeight': sh.get('bodyHeight'), 'anims': {}})
        an = ANIM.get(sh['kind'], sh['kind'])
        if an in c['anims']:
            sys.exit(f"{key} {an}: 납품 시트가 둘 — {c['anims'][an]['manifest']} · {os.path.relpath(mf, SRC)} (하나만 남기거나 delivered 표시)")
        c['anims'][an] = {'sheet': sh, 'manifest': os.path.relpath(mf, SRC)}

for k in skipped:
    print('건너뜀(납품 규격 아님):', k)
if not chars:
    sys.exit(f'납품을 못 찾음: {SRC}/characters/*-pixel-*/manifest.json')

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
out = {'schema': 'minimidgard.kit-hero/1',
       'note': 'asset-kit works/minimidgard 납품을 tools/art/import-kit-heroes.py로 가져옴. 오른쪽을 봄(왼쪽은 엔진이 뒤집음), 무기는 손에 그려져 있음.',
       'characters': {}}
for key, c in chars.items():
    frames = []  # (anim, index, path, pivot)
    for an, a in c['anims'].items():
        for i, f in enumerate(a['sheet']['frames']):
            frames.append((an, i, os.path.join(SRC, f['file']), f['pivot'], f.get('duration', 125)))
    pivots = {tuple(p) for *_, p, _ in frames}
    if len(pivots) != 1:
        sys.exit(f'{key}: 칸마다 발 기준점이 다름 {pivots} — 같은 상자로 자를 수 없음')
    px, py = pivots.pop()
    # 동작마다 상자를 따로 자른다(누운 쓰러짐 · 앞으로 뻗은 공격이 대기 상자까지 넓히지 않게); 발 기준점은 동작마다 그 상자 기준
    os.makedirs(os.path.join(OUT, key))
    anims = {}
    for an in c['anims']:
        fs = [f for f in frames if f[0] == an]
        box = None
        for _, _, p, _, _ in fs:
            b = Image.open(p).convert('RGBA').getbbox()
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        x0, y0, x1, y1 = box[0] - 1, box[1] - 1, box[2] + 1, max(box[3] + 1, py + 1)
        sheet = c['anims'][an]['sheet']
        a = anims[an] = {'frames': [], 'durations': [], 'loop': bool(sheet.get('loop')), 'size': [x1 - x0, y1 - y0], 'pivot': [px - x0, py - y0]}
        for _, i, p, _, d in fs:
            name = f'{an}_{i + 1:02d}.png'
            Image.open(p).convert('RGBA').crop((x0, y0, x1, y1)).save(os.path.join(OUT, key, name), optimize=True)
            a['frames'].append(f'{key}/{name}'); a['durations'].append(d)
        a['duration'] = sum(a['durations'])
        if sheet.get('hitFrame') is not None:
            a['hitFrame'] = sheet['hitFrame']
        a['from'] = c['anims'][an]['manifest']
    idle = anims.get('idle') or next(iter(anims.values()))
    out['characters'][key] = {'class': c['class'], 'gender': c['gender'], 'source': c['source'], 'bodyHeight': c['bodyHeight'],
                              'size': idle['size'], 'pivot': idle['pivot'], 'animations': anims}
    print(f"{key}: 키 {c['bodyHeight']}, " + ', '.join(f"{an} {len(a['frames'])}칸 {a['size'][0]}×{a['size'][1]} 발 {a['pivot'][0]},{a['pivot'][1]}" for an, a in anims.items()))
json.dump(out, open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
print('→', os.path.relpath(OUT))
