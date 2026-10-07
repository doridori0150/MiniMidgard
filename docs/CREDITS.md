# Audio Credits

All audio in `public/audio/` comes from free asset libraries. Every file is **CC0 (public domain)** except one BGM track, `town` (CC-BY 3.0), which **requires attribution** (see below).
Where a source offered several licenses, the CC0 option was chosen. No CC-BY-SA, NC, ND or GPL terms apply.

License URLs:
- CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/
- CC-BY 3.0: https://creativecommons.org/licenses/by/3.0/

## Required attribution (paste into the in-game credits screen)

> "Waltz" by Peter Eastman (peastman), https://opengameart.org/content/waltz, licensed under CC-BY 3.0 (https://creativecommons.org/licenses/by/3.0/). Converted to MP3, trailing silence trimmed and loudness-normalized.

## Optional thanks (CC0, credit is not required but authors appreciate it)

Kenney (kenney.nl), artisticdude, rubberduck, StarNinjas, Vehicle (Jan Schupke), JaggedStone, LEGIT Audio, IgnasD, HaelDB, Someoneman, Spring Spring (Julie Damsgaard), Joth, Bobjt, fvcalderan, VishwaJai, Till Behrend (uploaded by TinyWorlds), Fupi, cynicmusic, Juhani Junkala (SubspaceAudio), Cleyton Kauffman.

## Processing applied to all files

- **SFX:** downmixed to mono, resampled to 44.1 kHz, leading silence trimmed (-45 dBFS gate), trimmed to a maximum length with a short fade-out, peak-normalized to about -1 dBFS, and encoded as MP3 at 96 kbps. Any extra steps are listed per file below.
- **BGM:** stereo, 44.1 kHz, loudness-normalized to about -16 LUFS integrated (gain only, no limiting was needed), and encoded as MP3 at 128 kbps with metadata stripped. Leading and trailing silence was trimmed where noted.

## SFX

| Key | Source page | Original file / pack | Author | License | Extra transformations |
|---|---|---|---|---|---|
| hit | https://kenney.nl/assets/impact-sounds | `impactPunch_medium_000.ogg` (Impact Sounds) | Kenney | CC0 | max 0.45 s |
| hit_heavy | https://kenney.nl/assets/impact-sounds | `impactPunch_heavy_000.ogg` (Impact Sounds) | Kenney | CC0 | max 0.6 s |
| slash | https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes | `sword.4.ogg` (20 Sword Sound Effects) | StarNinjas | CC0 | max 0.5 s |
| crit | https://kenney.nl/assets/impact-sounds + https://opengameart.org/content/fantasy-sound-effects-tinysized-sfx | `impactPunch_heavy_002.ogg` (Kenney Impact Sounds) layered with `sfx-cc0/sword-clash-01.wav` at -4 dB (Tinysized SFX) | Kenney; Vehicle | CC0 | 2-layer mix, max 0.8 s |
| miss | https://opengameart.org/content/swishes-sound-pack | `swishes/swish-2.wav` (Swishes Sound Pack) | artisticdude | CC0 | none |
| arrow | https://opengameart.org/content/battle-sound-effects | `battle_sound_effects/Bow.wav` (Battle Sound Effects) | artisticdude (uploaded by Ogrebane) | CC0 (page is multi-licensed; CC0 chosen) | max 0.5 s |
| arrow_hit | https://kenney.nl/assets/impact-sounds | `impactPlank_medium_000.ogg` (Impact Sounds) | Kenney | CC0 | max 0.35 s |
| cast | https://opengameart.org/content/magic-spell-sfx | `magical_5.ogg` (Magic Spell SFX) | JaggedStone | CC0 | max 1.0 s, +15 dB normalize |
| fire | https://opengameart.org/content/fire-staff-sound-effects | `LEGIT_FIR_Fire_Staff 1-Audio.wav` (Fire Staff Sound Effects) | LEGIT Audio | CC0 | max 1.1 s |
| ice | https://opengameart.org/content/ice-breakingshattering | `IceShatters/LedasLuzta33.ogg` (Ice breaking/shattering) | IgnasD | CC0 | max 1.1 s |
| thunder | https://opengameart.org/content/spell-sounds | `electricspell2.ogg` (Spell sounds) | HaelDB | CC0 (page is dual OGA-BY 3.0 / CC0; CC0 chosen) | excerpt from 3.18 s, max 1.1 s |
| heal | https://opengameart.org/content/cure-magic | `Cure2.wav` (Cure Magic) | Someoneman | CC0 | max 1.2 s |
| buff | https://opengameart.org/content/power-up-sound-effects | `power_up_sound_v2.ogg` (Power-Up Sound Effects) | Spring Spring | CC0 | max 1.2 s |
| poison | https://opengameart.org/content/rpg-sound-pack + https://opengameart.org/content/40-cc0-water-splash-slime-sfx | `inventory/bubble3.wav` (RPG Sound Pack) layered with `bubble_01.ogg` at -3 dB, delayed 120 ms (40 CC0 water/splash/slime SFX) | artisticdude; rubberduck | CC0 | bubble3 pitched down x0.85 (about -2.8 semitones), 2-layer mix |
| coin_skill | https://opengameart.org/content/rpg-sound-pack + https://opengameart.org/content/80-cc0-rpg-sfx | `inventory/coin.wav` (RPG Sound Pack) layered with `item_coins_02.ogg` at -3 dB (80 CC0 RPG SFX) | artisticdude; rubberduck | CC0 | 2-layer mix, max 1.0 s |
| mob_die | https://opengameart.org/content/40-cc0-water-splash-slime-sfx + https://opengameart.org/content/100-cc0-sfx | `slime_15.ogg` (40 CC0 water/splash/slime SFX) layered with `plop_02.ogg` at -2 dB (100 CC0 SFX) | rubberduck | CC0 | 2-layer mix, max 0.6 s |
| mob_hurt_big | https://opengameart.org/content/rpg-sound-pack + https://kenney.nl/assets/impact-sounds | `NPC/giant/giant2.wav` (RPG Sound Pack) layered with `impactPunch_heavy_001.ogg` at -3 dB (Kenney Impact Sounds) | artisticdude; Kenney | CC0 | 2-layer mix, max 0.7 s |
| player_hurt | https://kenney.nl/assets/impact-sounds | `impactSoft_heavy_001.ogg` layered with `impactPunch_medium_002.ogg` at -2 dB (Impact Sounds) | Kenney | CC0 | 2-layer mix, max 0.45 s (no voice) |
| player_die | https://kenney.nl/assets/music-jingles | `Pizzicato jingles/jingles_PIZZI07.ogg` (Music Jingles) | Kenney | CC0 | none (descending pizzicato) |
| drop | https://kenney.nl/assets/impact-sounds | `impactGlass_light_000.ogg` (Impact Sounds) | Kenney | CC0 | max 0.3 s |
| pickup | https://opengameart.org/content/7-assorted-sound-effects-menu-level-up | `Item Pickup.mp3` (UISoundEffects.zip) | Joth | CC0 | max 0.5 s, +18 dB normalize |
| zeny | https://opengameart.org/content/rpg-sound-pack | `inventory/coin3.wav` (RPG Sound Pack) | artisticdude | CC0 | none |
| card | https://opengameart.org/content/gem-collect-sfx | `gem-gather-reverb.wav` (gem-gather-mono-files.zip) | Bobjt | CC0 | layered with an octave-up copy of itself (x2.0 rate, -7 dB, +70 ms) for sparkle; +8 dB drive into a limiter; max 1.5 s |
| potion | https://opengameart.org/content/rpg-sound-pack | `inventory/bottle.wav` (RPG Sound Pack) | artisticdude | CC0 | max 0.5 s |
| levelup | https://opengameart.org/content/classic-fanfare-lick | `fanfare_3.ogg` (Classic fanfare lick) | fvcalderan | CC0 | max 3.0 s |
| joblevel | https://kenney.nl/assets/music-jingles | `Pizzicato jingles/jingles_PIZZI02.ogg` (Music Jingles) | Kenney | CC0 | none (ascending pizzicato) |
| refine_hit | https://opengameart.org/content/blacksmiths-hammer | `blacksmithhammer.wav` (Blacksmith's Hammer) | VishwaJai | CC0 | max 0.5 s |
| refine_ok | https://opengameart.org/content/100-cc0-sfx | `bell_02.ogg` (100 CC0 SFX) | rubberduck | CC0 | layered with an octave-up copy of itself (-8 dB); +6 dB drive into a limiter |
| refine_fail | https://opengameart.org/content/glass-break | `glass_breaking.wav` (Glass Break) | Till Behrend (uploaded by TinyWorlds) | CC0 | max 1.2 s |
| equip | https://opengameart.org/content/rpg-sound-pack | `inventory/armor-light.wav` (RPG Sound Pack) | artisticdude | CC0 | max 0.45 s |
| boss | https://opengameart.org/content/100-cc0-sfx | `gong_01.ogg` (100 CC0 SFX) | rubberduck | CC0 | pitched down x0.8 (about -3.9 semitones, longer and deeper), long fade |
| mvp | https://opengameart.org/content/win-jingle | `WinBrass.ogg` (winjingle.zip) | Fupi | CC0 | max 3.0 s |
| click | https://kenney.nl/assets/interface-sounds | `select_002.ogg` (Interface Sounds) | Kenney | CC0 | none |
| open | https://kenney.nl/assets/interface-sounds | `maximize_008.ogg` (Interface Sounds) | Kenney | CC0 | pitched up x1.5 (about +7 semitones, shorter) |
| close | https://kenney.nl/assets/interface-sounds | `minimize_008.ogg` (Interface Sounds) | Kenney | CC0 | pitched up x1.5 (about +7 semitones, shorter) |
| error | https://kenney.nl/assets/interface-sounds | `error_002.ogg` (Interface Sounds) | Kenney | CC0 | none |
| confirm | https://kenney.nl/assets/interface-sounds | `confirmation_001.ogg` (Interface Sounds) | Kenney | CC0 | none |

## BGM

| Key | Source page | Original file / pack | Author | License | Extra transformations |
|---|---|---|---|---|---|
| title | https://opengameart.org/content/town-theme-rpg | `TownTheme.mp3` (Town Theme RPG) | cynicmusic | CC0 | trailing silence trimmed, -3.1 dB, 97 s |
| town | https://opengameart.org/content/waltz | `Waltz.ogg` (Waltz) | Peter Eastman (peastman) | **CC-BY 3.0, attribution required** | trailing silence trimmed (about 2 s) so the loop restarts promptly, -1.1 dB, 103 s |
| field | https://opengameart.org/content/jrpg-pack-1-exploration | `Grasslands.ogg` (JRPG Pack 1 Exploration) | Juhani Junkala (SubspaceAudio) | CC0 | -3.5 dB, 71 s (authored as a loop) |
| forest | https://opengameart.org/content/forest-whisper-theme | `Forest Whisper.ogg` (forest_whisper_theme.zip) | Cleyton Kauffman | CC0 | +13.8 dB (the source is mastered very quietly), 82 s (author states it loops seamlessly) |
| dungeon | https://opengameart.org/content/jrpg-pack-3-evil | `Evil2 - Catacombs.ogg` (JRPG Pack 3 Evil) | Juhani Junkala (SubspaceAudio) | CC0 | -4.2 dB, 81 s (authored as a loop) |
| boss | https://opengameart.org/content/battle-theme-a | `battleThemeA.mp3` (Battle Theme A) | cynicmusic | CC0 | trailing silence trimmed, -5.7 dB, 96 s |
