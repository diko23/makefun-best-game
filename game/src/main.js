// Boot and game loop for THE MAZEJANITOR
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_WIN, EVENT_MISSION } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_MUTE, ACTION_BUCKET, ACTION_UP, ACTION_DOWN, createInput } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_SHOP, SCREEN_OVER, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { toggleMute } from './audio.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {}
}

function runShot(name) {
  const scene = stageShot(name, world);
  renderer.draw(world.state, scene.screen, scene.best);
  window.__shotReady = true;
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(msg) {
    status.textContent = msg;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Shift started. Clean the dungeon!');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift ended. Score: ${world.state.score}. Best: ${best}.`);
  }

  let cachedActionBucket = false;

  function handleActions() {
    const actions = input.takeActions();

    if (actions & ACTION_MUTE) {
      toggleMute();
    }
    if (actions & ACTION_BUCKET) {
      cachedActionBucket = true;
    }

    if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (actions & ACTION_CONFIRM) {
        startGame();
      }
    } else if (screen === SCREEN_SHOP) {
      if (actions & ACTION_UP) {
        world.state.shopCursor = (world.state.shopCursor - 1 + 5) % 5;
      } else if (actions & ACTION_DOWN) {
        world.state.shopCursor = (world.state.shopCursor + 1) % 5;
      } else if (actions & ACTION_CONFIRM) {
        if (world.state.shopCursor === 4) {
          world.advanceWing();
          screen = SCREEN_PLAY;
          announce(`Wing ${world.state.wing} started!`);
        } else {
          world.buyUpgrade(world.state.shopCursor);
        }
      }
    } else if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      }
    } else if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, 0, false, true);
      return;
    }
    if (screen === SCREEN_SHOP) {
      return;
    }

    const actionBucket = cachedActionBucket;
    cachedActionBucket = false;

    const events = world.step(STEP, input.vx(), input.vy(), actionBucket, false);
    if (events & EVENT_MISSION) {
      screen = SCREEN_SHOP;
      announce('Entered upgrade shop between wings.');
    } else if (events & EVENT_OVER) {
      endGame(false);
    } else if (events & EVENT_WIN) {
      endGame(true);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('THE MAZEJANITOR. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
