import { useState } from 'preact/hooks';
import { game, useGame } from './game.ts';
import { Hud, Nav } from './Hud.tsx';
import { FieldView } from './FieldView.tsx';
import { Modals } from './Modals.tsx';
import { StatusPanel, SkillsPanel } from './panels/StatusSkills.tsx';
import { EquipPanel, BagPanel } from './panels/EquipBag.tsx';
import { TownPanel, SettingsPanel } from './panels/World.tsx';
import { PartyPanel } from './panels/Party.tsx';
import { MapPanel } from './WorldMap.tsx';
import { CardPanel } from './panels/Cards.tsx';
import { LookCanvas } from './widgets.tsx';
import { newGame, load, defaultLook, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, autoDistribute } from '../game/state.ts';
import type { Look } from '../game/types.ts';
import { audio } from '../audio/audio.ts';

function Toasts() {
  const g = useGame();
  return <div class="toasts">{g.toasts.map((t) => <div key={t.id} class={'toast ' + t.kind}>{t.text}</div>)}</div>;
}

function GameScreen() {
  const g = useGame();
  const p = g.panel;
  const tall = p === 'equip' || p === 'town' || p === 'map' || p === 'cards' || p === 'party';
  return (
    <div class="app">
      <Hud />
      <FieldView />
      <div class={'sheet' + (p ? ' open' : '') + (tall ? ' tall' : '')}>
        {p === 'status' && <StatusPanel />}
        {p === 'skills' && <SkillsPanel />}
        {p === 'equip' && <EquipPanel />}
        {p === 'cards' && <CardPanel />}
        {p === 'bag' && <BagPanel />}
        {p === 'map' && <MapPanel />}
        {p === 'town' && <TownPanel />}
        {p === 'party' && <PartyPanel />}
        {p === 'settings' && <SettingsPanel />}
      </div>
      <Nav />
      <Modals />
      <Toasts />
    </div>
  );
}

function Clouds() {
  return (
    <>
      {[[8, 60, 90, 0], [20, 120, 50, -14], [14, 80, 70, -30], [30, 140, 40, -8]].map(([top, w, dur, delay]) => (
        <div class="cloud" style={{ top: top + '%', width: w + 'px', height: w * 0.32 + 'px', animationDuration: dur + 's', animationDelay: delay + 's' }} />
      ))}
    </>
  );
}

function Title(props: { onNew: () => void; onLoad: () => void; canLoad: boolean }) {
  const demo = { cls: 'swordsman' as const, gender: 'f' as const, hair: 3, hairColor: 1, skin: 0, dye: 0, wtype: 'sword' as const, refine: 7, shield: true, headTop: 'ribbon' };
  return (
    <div class="app">
      <div class="title-screen">
        <Clouds />
        <div class="logo">미니 미드가르<small>IDLE ADVENTURE</small></div>
        <LookCanvas look={demo} class="title-hero" zoom={2.2} anchor={8} state="idle" />
        <div class="title-btns">
          {props.canLoad && <button class="btn gold" onClick={props.onLoad}>이어하기</button>}
          <button class={'btn ' + (props.canLoad ? '' : 'gold')} onClick={props.onNew}>새로운 모험</button>
        </div>
        <div class="title-foot">v0.1 · 오리지널 팬메이드 감성 방치형 RPG</div>
      </div>
    </div>
  );
}

function Create(props: { onDone: (name: string, look: Look) => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const [look, setLook] = useState<Look>(defaultLook('f'));
  const [state, setState] = useState('idle');
  const preview = { cls: 'novice' as const, gender: look.gender, hair: look.hair, hairColor: look.hairColor, skin: look.skin, dye: look.dye, wtype: 'dagger' as const, refine: 0, shield: false };
  const ok = name.trim().length > 0;
  return (
    <div class="app">
      <div class="create">
        <div class="preview" onClick={() => setState(state === 'idle' ? 'walk' : state === 'walk' ? 'attack' : 'idle')}>
          <LookCanvas look={preview} zoom={3.1} anchor={14} state={state} />
        </div>
        <div class="form">
          <div class="row"><b style={{ fontSize: '14px' }}>모험가 만들기</b><span class="sp1" /><button class="btn sm" onClick={props.onBack}>뒤로</button></div>
          <div class="field-row"><label>이름</label><input class="text-in" maxLength={10} placeholder="최대 10자" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} /></div>
          <div class="field-row"><label>얼굴형</label><div class="seg"><button class={look.gender === 'f' ? 'on' : ''} onClick={() => setLook({ ...look, gender: 'f' })}>A</button><button class={look.gender === 'm' ? 'on' : ''} onClick={() => setLook({ ...look, gender: 'm' })}>B</button></div></div>
          <div class="field-row"><label>헤어</label><div class="stepper"><button class="btn xs" onClick={() => setLook({ ...look, hair: (look.hair + HAIR_STYLES - 1) % HAIR_STYLES })}>◀</button><span style={{ minWidth: '40px', textAlign: 'center' }}>{look.hair + 1} / {HAIR_STYLES}</span><button class="btn xs" onClick={() => setLook({ ...look, hair: (look.hair + 1) % HAIR_STYLES })}>▶</button></div></div>
          <div class="field-row"><label>머리색</label><div class="swatches">{HAIR_COLORS.map((c, i) => <button class={'swatch' + (look.hairColor === i ? ' on' : '')} style={{ background: c }} onClick={() => setLook({ ...look, hairColor: i })} />)}</div></div>
          <div class="field-row"><label>피부</label><div class="swatches">{SKIN_TONES.map((c, i) => <button class={'swatch' + (look.skin === i ? ' on' : '')} style={{ background: c }} onClick={() => setLook({ ...look, skin: i })} />)}</div></div>
          <div class="field-row"><label>옷 색</label><div class="stepper"><button class="btn xs" onClick={() => setLook({ ...look, dye: (look.dye + 3) % 4 })}>◀</button><span style={{ minWidth: '40px', textAlign: 'center' }}>{look.dye + 1} / 4</span><button class="btn xs" onClick={() => setLook({ ...look, dye: (look.dye + 1) % 4 })}>▶</button></div></div>
          <div class="small muted">미리보기를 누르면 동작이 바뀝니다. 외형은 나중에 마을 미용실에서 바꿀 수 있어요.</div>
          <button class="btn gold block" style={{ padding: '10px', fontSize: '14px', marginTop: 'auto' }} disabled={!ok} onClick={() => props.onDone(name.trim(), look)}>이 모습으로 시작</button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [screen, setScreen] = useState<'title' | 'create' | 'game'>('title');
  const canLoad = game.hasSave();
  if (screen === 'game') return <GameScreen />;
  if (screen === 'create') return (
    <Create onBack={() => setScreen('title')} onDone={(name, look) => {
      const s = newGame(name, look);
      autoDistribute(s.heroes[0]);
      game.begin(s, true);
      audio.play('levelup');
      setScreen('game');
      setTimeout(() => {
        game.announce('햇살 평원', 'zone');
        game.toast('모험 시작! 캐릭터는 알아서 사냥합니다. 몬스터를 누르면 집중 공격!', 'level');
      }, 600);
      setTimeout(() => game.toast('직업 레벨 10이 되면 [스킬]에서 기본기 9를 찍고 전직하세요.', 'info'), 4500);
    }} />
  );
  return (
    <Title canLoad={canLoad}
      onNew={() => {
        audio.playBgm('title');
        if (canLoad) game.setModal(null);
        setScreen('create');
      }}
      onLoad={() => {
        const s = load();
        if (!s) { setScreen('create'); return; }
        game.begin(s, false);
        setScreen('game');
      }} />
  );
}
