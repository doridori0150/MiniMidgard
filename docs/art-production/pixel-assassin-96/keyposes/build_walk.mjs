// Preserve the legs-only pipeline when rebuilding current poses.
import path from 'node:path';
import {root} from './work.mjs';
if(!process.argv[3])process.argv[3]=path.join(root,process.argv[2],'sources/generated.png');
await import('./build_walk_legs.mjs');
