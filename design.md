# Design: THE MAZEJANITOR

## Concept
You are the dungeon office boy and head janitor working the graveyard shift in the underworld. Hero parties (warriors, mages, clerics) have just left Wing A in absolute shambles. Before the next elite party arrives, you must complete timed cleanup rounds across 5 dungeon wings: mop up toxic slime pools, reset pressure plate traps, restock chest gold, soothe/calm rowdy creatures, and complete wing missions.

## Gameplay Loop
- **5 Wings with Rising Difficulty**: Each wing features increased item counts, higher quota targets, and tighter time limits.
- **Upgrade Shop**: Between wings, spend earned gold on Broom Speed, Mop Radius, Extra Time (+5s), and Water Bucket upgrades. Navigate with arrow keys, buy with Space/Enter or click selection.
- **Missions**: Each wing displays 1 mission in the HUD (e.g. clean 3 slime pools first, soothe 2 rowdy creatures first, reset 2 traps first). Completing missions awards bonus gold (+150g).
- **Surprise Events**: Randomly triggered from wing 2 onward (Dragon Sneeze with fire patches doused by bucket, Goblin Party with extra trash, Living Slime that re-stains floors). An event banner announces each.
- **WebAudio Sound Effects**: Plain oscillator synthesizer bleeps for clean blips, mission done chimes, win jingles, lose buzzes, event stings, douse sounds, and buy sounds. Mute toggle with `M`.
- **Juice & Visual Feedback**: Janitor broom swing animation, clean burst particles, floating score/gold popups, flashing timer under 10 seconds.
- **Controls**: Keyboard (Arrow keys or WASD to move, Space/Enter to clean/select, B or Shift for Water Bucket, M for Mute, P/Escape to pause) and Mouse/Pointer click support.

## Palette & Aesthetics
Warm torch-lit palette (deep mahogany, warm stone grey, torch amber, brass gold, mucker green), never dark+glow.
