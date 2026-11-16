// Main game loop, canvas viewport, and screen orchestration for THE MAZEJANITOR
import { FIELD, STEP, BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { toggleMute } from './audio.js';
import { createWorld, EVENT_WING_CLEAR, EVENT_WIN, EVENT_OVER } from './world.js';
import {
  createInput,
  ACTION_CONFIRM,
  ACTION_BUCKET,
  ACTION_PAUSE,
  ACTION_MUTE,
  ACTION_UP,
  ACTION_DOWN,
} from './input.js';
import {
  drawTitle,
  drawShop,
  drawPlay,
  drawPause,
  drawGameOver,
  drawWin,
} from './render.js';
import { createShotsController } from './shots.js';

const SCREEN_TITLE = 0;
const SCREEN_PLAY = 1;
const SCREEN_SHOP = 2;
const SCREEN_PAUSED = 3;
const SCREEN_OVER = 4;
const SCREEN_WIN = 5;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusElem = document.getElementById('status');

let bestScore = 0;
try {
  const saved = localStorage.getItem(BEST_KEY);
  if (saved) bestScore = parseInt(saved, 10) || 0;
} catch {
  // localStorage may be disabled or sandboxed
}

function saveBestScore(score) {
  if (score > bestScore) {
    bestScore = score;
    try {
      localStorage.setItem(BEST_KEY, String(bestScore));
    } catch {
      // ignore
    }
  }
}

function updateStatus(text) {
  if (statusElem) {
    statusElem.textContent = text;
  }
}

// Letterboxing viewport
let view = { scale: 1, offsetX: 0, offsetY: 0 };
function updateView() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);

  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  const offsetX = (canvas.width - FIELD.width * scale) / 2;
  const offsetY = (canvas.height - FIELD.height * scale) / 2;
  view = { scale, offsetX, offsetY };
}

window.addEventListener('resize', updateView);
updateView();

const input = createInput(canvas, () => view);

// Seeded random for ?shot= or timestamp for normal play
const urlParams = new URLSearchParams(window.location.search);
const shotParam = urlParams.get('shot');
const seed = shotParam ? 0xcafe : (Date.now() ^ (Math.random() * 0x100000000));
const random = createRandom(seed);
const world = createWorld(random);

let screen = SCREEN_TITLE;
function setScreen(s) {
  screen = s;
}

if (typeof window !== 'undefined') {
  window.__game = { world, getScreen: () => screen };
}

const shotsController = createShotsController(
  world,
  () => screen,
  setScreen,
  SCREEN_PLAY,
  SCREEN_SHOP,
  SCREEN_WIN
);

// Tab visibility auto-pause
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === SCREEN_PLAY && !shotsController) {
    screen = SCREEN_PAUSED;
  }
});

let lastTime = performance.now();
let accumulator = 0;
let animTime = 0;
const MAX_FRAME = 0.25;

function frame(now) {
  const elapsed = Math.min((now - lastTime) / 1000, MAX_FRAME);
  lastTime = now;
  accumulator += elapsed;
  animTime += elapsed;

  while (accumulator >= STEP) {
    accumulator -= STEP;

    // Handle mute across all screens
    if (input.consumeAction(ACTION_MUTE)) {
      toggleMute();
    }

    if (shotsController) {
      shotsController.update(STEP);
    } else {
      // Normal gameplay orchestration
      if (screen === SCREEN_TITLE) {
        input.discardActions(ACTION_UP, ACTION_DOWN, ACTION_BUCKET, ACTION_PAUSE);
        // R12: Do NOT step the world on the title screen
        if (input.consumeAction(ACTION_CONFIRM) || input.getPendingClick()) {
          input.clearActions();
          world.reset();
          screen = SCREEN_PLAY;
          updateStatus('Game started. Clean items to meet the wing quota!');
        }
      } else if (screen === SCREEN_PLAY) {
        // Discard irrelevant queued actions during play per R6
        input.discardActions(ACTION_CONFIRM, ACTION_UP, ACTION_DOWN);

        if (input.consumeAction(ACTION_PAUSE)) {
          input.clearActions();
          screen = SCREEN_PAUSED;
          updateStatus('Game paused.');
        } else {
          // Click-to-move during play per R6
          const click = input.getPendingClick();
          if (click) {
            input.setMoveTarget(click);
          }

          const { vx, vy } = input.getMovement(world.state.player);
          const actionBucket = input.consumeAction(ACTION_BUCKET);
          const events = world.step(STEP, vx, vy, actionBucket, false);

          if ((events & EVENT_WING_CLEAR) || world.state.inShop) {
            input.clearMoveTarget();
            input.clearActions();
            screen = SCREEN_SHOP;
            updateStatus(`Wing cleared! Upgrade shop open. Available gold: ${world.state.gold}g`);
          } else if ((events & EVENT_WIN) || world.state.won) {
            input.clearMoveTarget();
            input.clearActions();
            screen = SCREEN_WIN;
            saveBestScore(world.state.score);
            updateStatus(`Victory! All wings completed! Final score: ${world.state.score}`);
          } else if ((events & EVENT_OVER) || world.state.gameOver) {
            input.clearMoveTarget();
            input.clearActions();
            screen = SCREEN_OVER;
            saveBestScore(world.state.score);
            updateStatus(`Game over! Time expired. Final score: ${world.state.score}`);
          }
        }
      } else if (screen === SCREEN_SHOP) {
        input.discardActions(ACTION_BUCKET);
        // Mouse row selection and buying per R6
        const click = input.getPendingClick();
        if (click) {
          input.discardActions(ACTION_CONFIRM);
          const row = input.getShopRowAt(click.x, click.y);
          if (row !== -1) {
            if (row !== world.state.shopCursor) {
              world.state.shopCursor = row;
            } else {
              if (row === 4) {
                input.clearActions();
                world.advanceWing();
                screen = SCREEN_PLAY;
                updateStatus(`Entering Wing ${world.state.wing}`);
              } else {
                world.buyUpgrade(row);
              }
            }
          }
        }

        // Keyboard shop navigation
        if (input.consumeAction(ACTION_UP)) {
          world.state.shopCursor = (world.state.shopCursor + 4) % 5;
        }
        if (input.consumeAction(ACTION_DOWN)) {
          world.state.shopCursor = (world.state.shopCursor + 1) % 5;
        }
        if (input.consumeAction(ACTION_CONFIRM)) {
          if (world.state.shopCursor === 4) {
            input.clearActions();
            world.advanceWing();
            screen = SCREEN_PLAY;
            updateStatus(`Entering Wing ${world.state.wing}`);
          } else {
            world.buyUpgrade(world.state.shopCursor);
          }
        }
        if (input.consumeAction(ACTION_PAUSE)) {
          input.clearActions();
          world.advanceWing();
          screen = SCREEN_PLAY;
          updateStatus(`Entering Wing ${world.state.wing}`);
        }
      } else if (screen === SCREEN_PAUSED) {
        input.discardActions(ACTION_UP, ACTION_DOWN, ACTION_BUCKET);
        if (input.consumeAction(ACTION_PAUSE) || input.consumeAction(ACTION_CONFIRM) || input.getPendingClick()) {
          input.clearActions();
          screen = SCREEN_PLAY;
          updateStatus('Game resumed.');
        }
      } else if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
        input.discardActions(ACTION_UP, ACTION_DOWN, ACTION_BUCKET, ACTION_PAUSE);
        if (input.consumeAction(ACTION_CONFIRM) || input.getPendingClick()) {
          input.clearActions();
          world.reset();
          screen = SCREEN_PLAY;
          updateStatus('Game restarted.');
        }
      }
    }
  }

  // Render pipeline
  ctx.fillStyle = '#0f0804';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);

  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, bestScore, animTime);
  } else if (screen === SCREEN_PLAY) {
    drawPlay(ctx, world.state, animTime);
  } else if (screen === SCREEN_SHOP) {
    drawPlay(ctx, world.state, animTime);
    drawShop(ctx, world.state);
  } else if (screen === SCREEN_PAUSED) {
    drawPlay(ctx, world.state, animTime);
    drawPause(ctx);
  } else if (screen === SCREEN_OVER) {
    drawPlay(ctx, world.state, animTime);
    drawGameOver(ctx, world.state, bestScore);
  } else if (screen === SCREEN_WIN) {
    drawPlay(ctx, world.state, animTime);
    drawWin(ctx, world.state, bestScore);
  }

  ctx.restore();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
