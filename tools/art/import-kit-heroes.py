#!/usr/bin/env python3
# 에셋 공방(asset-kit) 영웅 납품 → 게임 src/assets/kit-heroes/ (schema minimidgard.kit-hero/1, src/render/kit-hero.ts가 그림)
#   python3 -I tools/art/import-kit-heroes.py [asset-kit의 works/minimidgard 폴더]
# 읽는 것: characters/<id>-pixel-<단계>/manifest.json 중 category가 motion인 시트(전투 대기 · 공격 …). asset-kit은 읽기만 한다.
# 하는 일: 한 인물의 모든 칸을 같은 상자(모든 칸 불투명 영역의 합 + 1칸)로 잘라 복사하고, 발 기준점을 그 상자 기준으로 옮긴다.
#   크기는 공방 크기 그대로(회귀 용사 영웅 규격, 키 약 130칸) 두고, 필드 크기 맞춤은 kit-hero.ts가 한다(asset-kit 규칙 B8).
import json, os, sys, glob, shutil
from PIL import Image

SRC = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/Projects/game/asset-kit/works/minimidgard')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'assets', 'kit-heroes')
OUT = os.path.normpath(OUT)
GENDER = {'m': 'male', 'f': 'female'}
ANIM = {'battle_idle': 'idle'}  # 공방 동작 이름 → 게임 상태 이름(같으면 그대로)

chars = {}
for mf in sorted(glob.glob(os.path.join(SRC, 'characters', '*-pixel-*', 'manifest.json'))):
    m = json.load(open(mf))
    for sh in m.get('sheets', []):
        if sh.get('category') != 'motion':
            continue
        aid = sh['id']                      # assassin_m
        cls, g = aid.rsplit('_', 1)
        key = f'{cls}_{GENDER.get(g, g)}'   # assassin_male
        c = chars.setdefault(key, {'class': cls, 'gender': GENDER.get(g, g), 'source': aid, 'bodyHeight': sh.get('bodyHeight'), 'anims': {}})
        c['anims'][ANIM.get(sh['kind'], sh['kind'])] = {'sheet': sh, 'manifest': os.path.relpath(mf, SRC)}

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
    box = None
    for _, _, p, _, _ in frames:
        b = Image.open(p).convert('RGBA').getbbox()
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    x0, y0, x1, y1 = box[0] - 1, box[1] - 1, box[2] + 1, max(box[3] + 1, py + 1)
    os.makedirs(os.path.join(OUT, key))
    anims = {}
    for an, i, p, _, d in frames:
        name = f'{an}_{i + 1:02d}.png'
        Image.open(p).convert('RGBA').crop((x0, y0, x1, y1)).save(os.path.join(OUT, key, name), optimize=True)
        a = anims.setdefault(an, {'frames': [], 'durations': [], 'loop': bool(c['anims'][an]['sheet'].get('loop'))})
        a['frames'].append(f'{key}/{name}'); a['durations'].append(d)
    for an, a in anims.items():
        a['duration'] = sum(a['durations'])
        hf = c['anims'][an]['sheet'].get('hitFrame')
        if hf is not None:
            a['hitFrame'] = hf
        a['from'] = c['anims'][an]['manifest']
    out['characters'][key] = {'class': c['class'], 'gender': c['gender'], 'source': c['source'], 'bodyHeight': c['bodyHeight'],
                              'size': [x1 - x0, y1 - y0], 'pivot': [px - x0, py - y0], 'animations': anims}
    print(f"{key}: {', '.join(f'{an} {len(a['frames'])}칸' for an, a in anims.items())}, 키 {c['bodyHeight']}, 상자 {x1 - x0}×{y1 - y0}, 발 {px - x0},{py - y0}")
json.dump(out, open(os.path.join(OUT, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)
print('→', os.path.relpath(OUT))
