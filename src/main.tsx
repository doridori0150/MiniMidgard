import { render } from 'preact';
import './styles.css';
import { App } from './ui/App.tsx';
import { audio } from './audio/audio.ts';
import { loadKits } from './render/bg.ts';
import { loadRig } from './render/rig.ts';
import { installSave, readSaveText } from './game/state.ts';

void audio.init();
// painted background kits load in the background; the field swaps its ground in when they arrive
void loadKits();
void loadRig();
// ?save=<name>: start from a save kept in the repo (public/saves/<name>.json) — asks before replacing this browser's save
{
  const q = new URLSearchParams(location.search);
  const name = q.get('save');
  if (name && /^[a-z0-9_-]+$/i.test(name)) {
    const res = await fetch(`saves/${name}.json`).catch(() => null);
    const text = res && res.ok ? await res.text() : null;
    const ok = text ? readSaveText(text) : { error: '세이브 파일을 찾지 못했습니다.' };
    if ('json' in ok) { if (confirm(`이 브라우저의 세이브를 「${name}」 세이브로 바꿀까요?\n지금 세이브는 백업으로 한 번 보관됩니다.`)) installSave(ok.json, false); }
    else alert(ok.error);
    q.delete('save');
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }
}
if (import.meta.env.DEV) {
  const m = await import('./debug.ts');
  m.installDebug();
  await m.qaBoot();
}
render(<App />, document.getElementById('app')!);
