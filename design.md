# Design: THE MAZEJANITOR

## Concept
You are the dungeon office boy and head janitor working the graveyard shift in the underworld. Hero parties (warriors, mages, rogues, clerics) have rampaged through the labyrinth, leaving each wing wrecked and filthy. Before the next elite party arrives, you must complete timed cleanup rounds across 5 dungeon wings: mop up toxic slime pools, reset tripped pressure plate traps, restock looted chests, soothe agitation in dungeon creatures, and complete designated wing missions.

## Gameplay Loop
- **5 Progressive Wings**: Each wing introduces tighter time limits, higher cleanup quotas, and wider spatial spread between items, demanding deliberate routing and swift movement.
- **Immediate Quota Clear & Time Bonus**: Meeting the quota immediately completes the round, rewarding fast play with +10 gold and +25 score for every second remaining on the clock.
- **Economy & Upgrade Shop**: Between wings, players visit the Upgrade Shop to spend hard-earned gold on four impactful upgrades (max level 3 each):
  - Broom Speed (150g + 112g/level)
  - Mop Reach Radius (180g + 135g/level)
  - Extra Time (+5s per wing; 225g + 150g/level)
  - Water Bucket Douse Radius (120px + 60px/level; 300g + 225g/level)
  With rebalanced earnings, a full five-wing clear affords roughly 60–70% of total upgrades, requiring meaningful strategic trade-offs.
- **Dynamic Dungeon Hazards**:
  - **Dragon Sneeze**: Flaming embers scatter across the floor. Touching a fire penalizes the player by 3 seconds of clock time and consumes the flame. Fires spread up to a hard cap of 10 active flames. The player's Water Bucket douses all flames within its upgradeable area of effect.
  - **Goblin Party**: Spawns extra slime trash clusters to clean for supplementary score and gold.
  - **Living Slime**: An animated roving slime organism traverses the floor, reactivating and re-staining previously sanitized spots upon contact.
- **Wing Missions**: Targeted cleanup tasks (e.g. cleaning a set number of specific item kinds) grant a +75 gold bonus when fulfilled. Progress accumulates for matching cleans in any order.
- **Audio Architecture**: Custom synthesized sound effects using the WebAudio API (clean blips, mission fanfare, victory jingles, defeat tones, dragon/event stings, bucket splash, purchase chimes). Audio can be muted with `M`.
- **Controls**:
  - Movement: Arrow keys or WASD, as well as mouse click-to-move.
  - Cleaning: Automatic upon approaching or contacting items.
  - Start / Confirm / Advance: Space, Enter, or Mouse click.
  - Bucket Douse: B or Shift key.
  - Audio Mute: M key.
  - Pause: P or Escape key.

## Visual Direction & Aesthetics
- A cohesive warm torch-lit underworld palette: deep mahogany backdrops, warm stone floors, torch amber, brass gold, and vibrant slime green accents.
- Responsive HiDPI canvas rendering maintaining a native 1280x720 aspect ratio.
