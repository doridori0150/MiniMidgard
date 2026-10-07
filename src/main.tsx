import { render } from 'preact';
import './styles.css';
import { App } from './ui/App.tsx';
import { audio } from './audio/audio.ts';
import { loadKits } from './render/bg.ts';

void audio.init();
if (import.meta.env.DEV) void import('./debug.ts').then((m) => m.installDebug());
// painted background kits load in the background; the field swaps its ground in when they arrive
void loadKits();
render(<App />, document.getElementById('app')!);
