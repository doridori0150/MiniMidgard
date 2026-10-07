import { render } from 'preact';
import './styles.css';
import { App } from './ui/App.tsx';
import { audio } from './audio/audio.ts';
import { loadKits } from './render/bg.ts';
import { loadRig } from './render/rig.ts';

void audio.init();
// painted background kits load in the background; the field swaps its ground in when they arrive
void loadKits();
void loadRig();
if (import.meta.env.DEV) {
  const m = await import('./debug.ts');
  m.installDebug();
  await m.qaBoot();
}
render(<App />, document.getElementById('app')!);
