// User input handling (Keyboard and Mouse/Pointer) for THE MAZEJANITOR
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_BUCKET = 'bucket';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_UP = 'up';
export const ACTION_DOWN = 'down';

export function createInput(canvas, getView) {
  const keys = new Set();
  const queuedActions = new Map(); // action -> timestamp
  const ACTION_TTL = 300; // queued actions expire after 300ms
  let moveTarget = null;
  let pendingClick = null;

  function pruneExpired() {
    const now = performance.now();
    for (const [action, timestamp] of queuedActions.entries()) {
      if (now - timestamp > ACTION_TTL) {
        queuedActions.delete(action);
      }
    }
  }

  function screenToField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    const view = getView();
    const fieldX = (canvasX - view.offsetX) / view.scale;
    const fieldY = (canvasY - view.offsetY) / view.scale;
    return { x: fieldX, y: fieldY };
  }

  function queueAction(action) {
    queuedActions.set(action, performance.now());
  }

  function onKeyDown(e) {
    keys.add(e.code);

    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      queueAction(ACTION_UP);
      moveTarget = null;
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      queueAction(ACTION_DOWN);
      moveTarget = null;
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') {
      moveTarget = null;
    }

    if (e.code === 'Space' || e.code === 'Enter') {
      queueAction(ACTION_CONFIRM);
    }
    if (e.code === 'KeyB' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      queueAction(ACTION_BUCKET);
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      queueAction(ACTION_PAUSE);
    }
    if (e.code === 'KeyM') {
      queueAction(ACTION_MUTE);
    }
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function onPointerDown(e) {
    const fieldPos = screenToField(e.clientX, e.clientY);
    pendingClick = fieldPos;
    queueAction(ACTION_CONFIRM);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  function consumeAction(action) {
    pruneExpired();
    if (queuedActions.has(action)) {
      queuedActions.delete(action);
      return true;
    }
    return false;
  }

  function discardActions(...actions) {
    if (actions.length === 0) {
      queuedActions.clear();
    } else {
      for (const a of actions) {
        if (queuedActions.has(a)) {
          queuedActions.delete(a);
        }
      }
    }
  }

  function clearActions() {
    queuedActions.clear();
    pendingClick = null;
  }

  function getPendingClick() {
    const click = pendingClick;
    pendingClick = null;
    return click;
  }

  function setMoveTarget(target) {
    moveTarget = target;
  }

  function clearMoveTarget() {
    moveTarget = null;
  }

  function getMovement(player) {
    let vx = 0;
    let vy = 0;

    if (keys.has('ArrowLeft') || keys.has('KeyA')) vx -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) vx += 1;
    if (keys.has('ArrowUp') || keys.has('KeyW')) vy -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) vy += 1;

    // If keyboard is providing movement, it overrides and clears mouse target
    if (vx !== 0 || vy !== 0) {
      moveTarget = null;
      const mag = Math.hypot(vx, vy);
      return { vx: vx / mag, vy: vy / mag };
    }

    // Otherwise follow click-to-move target if set
    if (moveTarget && player) {
      const pcx = player.x + player.width / 2;
      const pcy = player.y + player.height / 2;
      const dx = moveTarget.x - pcx;
      const dy = moveTarget.y - pcy;
      const dist = Math.hypot(dx, dy);

      if (dist < 10) {
        moveTarget = null;
        return { vx: 0, vy: 0 };
      }
      return { vx: dx / dist, vy: dy / dist };
    }

    return { vx: 0, vy: 0 };
  }

  // Identify if a point falls on a shop row (0..4)
  function getShopRowAt(x, y) {
    const panelW = 720;
    const panelH = 500;
    const panelX = (FIELD.width - panelW) / 2;
    const panelY = (FIELD.height - panelH) / 2;
    const rowStartY = panelY + 125;
    const rowHeight = 58;

    if (x >= panelX + 24 && x <= panelX + panelW - 24) {
      for (let i = 0; i < 5; i++) {
        const ry = rowStartY + i * rowHeight;
        if (y >= ry && y <= ry + rowHeight - 8) {
          return i;
        }
      }
    }
    return -1;
  }

  return {
    consumeAction,
    discardActions,
    clearActions,
    getPendingClick,
    setMoveTarget,
    clearMoveTarget,
    getMovement,
    getShopRowAt,
  };
}
