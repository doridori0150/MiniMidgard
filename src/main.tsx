import { render } from 'preact';
import './styles.css';
import { App } from './ui/App.tsx';
import { audio } from './audio/audio.ts';

void audio.init();
if (import.meta.env.DEV) void import('./debug.ts').then((m) => m.installDebug());
render(<App />, document.getElementById('app')!);
