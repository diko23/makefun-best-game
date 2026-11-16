import { FIELD, STEP } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, SCREEN_WIN, SCREEN_SHOP } from './render.js';

export function stageShot(name, world) {
  world.reset();
  if (name === 'upgrade') {
    world.state.inShop = true;
    world.state.gold = 500;
    return { screen: SCREEN_SHOP, best: 0 };
  }
  if (name === 'start') {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name !== 'play' && name !== 'end') {
    return { screen: SCREEN_TITLE, best: 0 };
  }

  const limit = name === 'end' ? 600 : name === 'play' ? 5 : 30;
  for (let i = 0; i < limit / STEP; i++) {
    if (name === 'end' && world.state.inShop) {
      world.advanceWing();
      continue;
    }
    // Autopilot steer toward nearest active item
    const p = world.state.player;
    let targetX = p.x;
    let targetY = p.y;
    const activeItems = world.state.items.filter(item => item.active);
    if (activeItems.length > 0) {
      // Pick nearest
      let nearest = activeItems[0];
      let minDist = Math.hypot(nearest.x - p.x, nearest.y - p.y);
      for (let j = 1; j < activeItems.length; j++) {
        const d = Math.hypot(activeItems[j].x - p.x, activeItems[j].y - p.y);
        if (d < minDist) {
          minDist = d;
          nearest = activeItems[j];
        }
      }
      targetX = nearest.x;
      targetY = nearest.y;
    }

    const vx = targetX > p.x + 5 ? 1 : targetX < p.x - 5 ? -1 : 0;
    const vy = targetY > p.y + 5 ? 1 : targetY < p.y - 5 ? -1 : 0;

    world.step(STEP, vx, vy, false, false);
    if (world.state.gameOver || world.state.won) break;
  }

  const screen = world.state.won ? SCREEN_WIN : world.state.gameOver ? SCREEN_OVER : SCREEN_PLAY;
  return { screen, best: world.state.score };
}
