// Screenshot automation handler for THE MAZEJANITOR
// Handles ?shot=start|play|upgrade|end with window.__shotReady gate
import { EVENT_WING_CLEAR, EVENT_WIN } from './world.js';

export function createShotsController(world, getScreen, setScreen, SCREEN_PLAY, SCREEN_SHOP, SCREEN_WIN) {
  const urlParams = new URLSearchParams(window.location.search);
  const shotMode = urlParams.get('shot');
  if (!shotMode) return null;

  window.__shotReady = false;
  let elapsed = 0;
  let settled = false;

  if (shotMode === 'play' || shotMode === 'upgrade' || shotMode === 'end') {
    setScreen(SCREEN_PLAY);
  }

  function autopilotStep(dt) {
    const player = world.state.player;
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;

    // Find nearest active item
    let nearest = null;
    let minDist = Infinity;
    for (const item of world.state.items) {
      if (!item.active) continue;
      const icx = item.x + item.width / 2;
      const icy = item.y + item.height / 2;
      const dist = Math.hypot(icx - pcx, icy - pcy);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: icx, y: icy };
      }
    }

    let vx = 0;
    let vy = 0;
    if (nearest) {
      const dx = nearest.x - pcx;
      const dy = nearest.y - pcy;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        vx = dx / dist;
        vy = dy / dist;
      }
    }

    const actionBucket = world.state.fires.length > 0;
    return world.step(dt, vx, vy, actionBucket, false);
  }

  function update(dt) {
    if (settled) return;
    elapsed += dt;

    if (shotMode === 'start') {
      if (elapsed > 0.05) {
        window.__shotReady = true;
        settled = true;
      }
      return;
    }

    if (shotMode === 'play') {
      // R10: Stop at about half the wing quota with items still on screen
      const targetCleans = Math.floor(world.state.quota / 2);
      if (world.state.cleaned < targetCleans) {
        autopilotStep(dt);
      } else {
        // Allow a split second for popups and particles to settle visibly
        if (elapsed > 0.2) {
          window.__shotReady = true;
          settled = true;
        }
      }
      return;
    }

    if (shotMode === 'upgrade') {
      if (getScreen() === SCREEN_PLAY) {
        const events = autopilotStep(dt);
        if (events & EVENT_WING_CLEAR || world.state.inShop) {
          setScreen(SCREEN_SHOP);
          world.state.shopCursor = 0;
        }
      } else if (getScreen() === SCREEN_SHOP) {
        if (elapsed > 0.3) {
          window.__shotReady = true;
          settled = true;
        }
      }
      return;
    }

    if (shotMode === 'end') {
      if (getScreen() === SCREEN_PLAY) {
        const events = autopilotStep(dt);
        if (events & EVENT_WING_CLEAR || world.state.inShop) {
          // In shop, auto-buy speed upgrade if affordable, then advance
          world.buyUpgrade(0);
          world.advanceWing();
          setScreen(SCREEN_PLAY);
        } else if (events & EVENT_WIN || world.state.won) {
          setScreen(SCREEN_WIN);
        }
      } else if (getScreen() === SCREEN_WIN) {
        if (elapsed > 0.3) {
          window.__shotReady = true;
          settled = true;
        }
      }
    }
  }

  return {
    isActive: true,
    mode: shotMode,
    update,
  };
}
