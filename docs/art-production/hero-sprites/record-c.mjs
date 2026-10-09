import fs from 'node:fs';import path from 'node:path';
import {convert} from '../../../tools/asset-kit-sprites.mjs';
const R=path.dirname(new URL(import.meta.url).pathname),p=R+'/manifest.json';
fs.writeFileSync(p,JSON.stringify(convert(JSON.parse(fs.readFileSync(R+'/game-manifest.json')),'docs/art-production/hero-sprites'),null,2)+'\n');
await import('./record.mjs');
const m=JSON.parse(fs.readFileSync(p));
m.scope={...m.scope,request:'docs/art-requests/hero-sprites-c.md (final addendum)',added:['swordsman_female'],preservedCharacters:['mage_female','acolyte_female','archer_male','novice_female','swordsman_male','thief_male','merchant_female'],note:'Batch C adds only swordsman_female. Existing seven character records and rasters, shared equipment preserved. This task writes only the delivery directory; independently observed source baseline drift is recorded in verification/c-checks.json. Previous unresolved art notes remain historical; this delivery does not certify or modify those characters.'};
fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
