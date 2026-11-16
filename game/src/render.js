import { FIELD, FONT, PALETTE } from './config.js';
import { KIND_SLIME, KIND_CHEST, KIND_TRAP, KIND_CREATURE } from './world.js';
import { isMuted } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_SHOP = 'shop';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { width: 680, top: 110, line: 36, bottom: 60 };

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawField(state) {
    context.fillStyle = PALETTE.sky;
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    // Dungeon pillars & stone texture
    context.strokeStyle = '#23160d';
    context.lineWidth = 4;
    for (let x = 0; x < FIELD.width; x += 160) {
      context.strokeRect(x, 140, 160, 480);
      context.fillStyle = '#321f12';
      context.fillRect(x + 20, 160, 120, 440);
    }

    context.fillStyle = PALETTE.ground;
    context.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);

    // Torches with warm glow
    for (const tx of [220, 640, 1060]) {
      context.fillStyle = '#f77f00';
      context.fillRect(tx - 8, 240, 16, 50);
      context.beginPath();
      context.arc(tx, 226, 26, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ffb703';
      context.beginPath();
      context.arc(tx, 226, 12, 0, Math.PI * 2);
      context.fill();
    }

    // Fires (Dragon Sneeze)
    for (const fire of state.fires) {
      context.fillStyle = PALETTE.fire;
      context.beginPath();
      context.arc(fire.x + fire.width / 2, fire.y + fire.height / 2, fire.width / 2, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ffb703';
      context.beginPath();
      context.arc(fire.x + fire.width / 2, fire.y + fire.height / 2, fire.width / 3, 0, Math.PI * 2);
      context.fill();
    }

    // Items
    for (const item of state.items) {
      if (!item.active) continue;
      if (item.kind === KIND_SLIME) {
        context.fillStyle = PALETTE.slime;
        context.beginPath();
        context.ellipse(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, item.height / 3, 0, 0, Math.PI * 2);
        context.fill();
        // Slime eyes / shine
        context.fillStyle = '#fdf0d5';
        context.fillRect(item.x + item.width / 3, item.y + item.height / 3, 6, 6);
      } else if (item.kind === KIND_CHEST) {
        context.fillStyle = PALETTE.chest;
        context.fillRect(item.x, item.y, item.width, item.height);
        context.fillStyle = PALETTE.gold;
        context.fillRect(item.x + 12, item.y + 10, item.width - 24, 8);
      } else if (item.kind === KIND_TRAP) {
        context.fillStyle = PALETTE.trap;
        context.fillRect(item.x, item.y + 12, item.width, item.height - 12);
        context.fillStyle = '#fdf0d5';
        for (let i = 0; i < 4; i++) {
          context.beginPath();
          context.moveTo(item.x + i * 12 + 6, item.y + 12);
          context.lineTo(item.x + i * 12 + 2, item.y);
          context.lineTo(item.x + i * 12 + 10, item.y);
          context.fill();
        }
      } else if (item.kind === KIND_CREATURE) {
        context.fillStyle = PALETTE.creature;
        context.beginPath();
        context.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#2c1d11';
        context.fillRect(item.x + 10, item.y + 12, 6, 8);
        context.fillRect(item.x + 30, item.y + 12, 6, 8);
      }
    }

    // Player (Janitor) with mop swing animation
    const p = state.player;
    context.fillStyle = PALETTE.player;
    context.fillRect(p.x, p.y, p.width, p.height);
    // Janitor cap
    context.fillStyle = '#bc6c25';
    context.fillRect(p.x + 8, p.y - 8, p.width - 16, 12);

    // Broom handle & swing
    context.save();
    context.translate(p.x + p.width / 2, p.y + p.height / 2);
    context.scale(p.facing, 1);
    const swingAngle = Math.sin(p.mopAnim) * 0.4;
    context.rotate(swingAngle);
    context.fillStyle = '#bc6c25';
    context.fillRect(15, -35, 8, 90);
    // Sponge head
    context.fillStyle = PALETTE.slime;
    context.fillRect(10, 45, 30, 16);
    context.restore();

    // Clean burst particles
    for (const pt of state.particles) {
      context.fillStyle = pt.color;
      context.globalAlpha = pt.life / pt.maxLife;
      context.fillRect(pt.x, pt.y, 8, 8);
      context.globalAlpha = 1;
    }

    // Floating score popups
    for (const pop of state.popups) {
      context.globalAlpha = Math.max(0, pop.alpha);
      text(pop.text, pop.x, pop.y, 20, pop.color, 'left');
      context.globalAlpha = 1;
    }
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    text(`Score: ${state.score}`, 30, 20, 24, PALETTE.text, 'left');
    text(`Gold: ${state.gold}g`, 220, 20, 24, PALETTE.gold, 'left');
    text(`Wing: ${state.wing}/5`, FIELD.width / 2, 20, 24, PALETTE.text, 'center');
    text(`Cleaned: ${state.cleaned}/${state.quota}`, FIELD.width - 30, 20, 24, PALETTE.text, 'right');

    const timeLeft = Math.ceil(state.time);
    const timeColor = timeLeft <= 10 ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#d62828' : '#fdf0d5') : PALETTE.muted;
    text(`Time: ${timeLeft}s`, FIELD.width / 2, 54, 22, timeColor, 'center');

    // Mission banner in HUD
    const m = state.mission;
    if (m) {
      const missionText = `Mission: ${m.desc} (${m.current}/${m.target}) ${m.done ? '✓ DONE' : ''}`;
      text(missionText, FIELD.width / 2, 88, 18, m.done ? '#38b000' : '#ffb703', 'center');
    }

    // Event Banner overlay
    if (state.bannerTimer > 0) {
      context.fillStyle = 'rgba(214, 40, 40, 0.85)';
      context.fillRect(FIELD.width / 2 - 350, 130, 700, 50);
      text(state.bannerText, FIELD.width / 2, 142, 22, '#fdf0d5', 'center');
    }

    // Mute status & Bucket hint
    text(`Mute: [M] (${isMuted() ? 'OFF' : 'ON'}) | Bucket: [B/Shift]`, FIELD.width - 30, FIELD.height - 35, 16, PALETTE.muted, 'right');
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = '#f77f00';
    context.lineWidth = 3;
    context.strokeRect(x, y, PANEL.width, height);

    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 65, 38, PALETTE.text, 'center');
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 28, 20, '#ffb703', 'center');
  }

  function drawShop(state, best) {
    const height = 560;
    const width = 760;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;

    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, width, height);
    context.strokeStyle = '#ffb703';
    context.lineWidth = 4;
    context.strokeRect(x, y, width, height);

    context.textBaseline = 'alphabetic';
    text(`Wing ${state.wing} Cleared! Upgrade Shop`, FIELD.width / 2, y + 55, 34, PALETTE.text, 'center');
    text(`Available Gold: ${state.gold}g`, FIELD.width / 2, y + 95, 24, PALETTE.gold, 'center');

    const options = [
      { name: '1. Broom Speed', desc: 'Move faster across the dungeon', cost: 100 + state.upgrades.speed * 75, lvl: state.upgrades.speed },
      { name: '2. Mop Radius', desc: 'Clean items from further away', cost: 120 + state.upgrades.radius * 90, lvl: state.upgrades.radius },
      { name: '3. Extra Time', desc: 'Add +5s to next wing timer', cost: 150 + state.upgrades.time * 100, lvl: state.upgrades.time },
      { name: '4. Water Bucket', desc: 'Upgrade bucket capacity & dousing', cost: 200 + state.upgrades.bucket * 150, lvl: state.upgrades.bucket },
      { name: '5. Continue to next wing', desc: 'Proceed immediately to the next dungeon wing', cost: -1, lvl: 0 },
    ];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const oy = y + 140 + i * 72;
      const selected = state.shopCursor === i;

      context.fillStyle = selected ? '#5a3d1f' : '#3d2616';
      context.fillRect(x + 40, oy, width - 80, 62);
      if (selected) {
        context.strokeStyle = '#ffb703';
        context.lineWidth = 2;
        context.strokeRect(x + 40, oy, width - 80, 62);
      }

      if (i === 4) {
        text(`${opt.name}`, x + 60, oy + 26, 20, PALETTE.text, 'left');
        text(opt.desc, x + 60, oy + 46, 16, PALETTE.muted, 'left');
      } else {
        text(`${opt.name} (Lvl ${opt.lvl}/3)`, x + 60, oy + 26, 20, PALETTE.text, 'left');
        text(opt.desc, x + 60, oy + 46, 16, PALETTE.muted, 'left');
        const costText = opt.lvl >= 3 ? 'MAX' : `${opt.cost}g`;
        text(costText, x + width - 70, oy + 38, 22, opt.lvl >= 3 ? '#c6ac8f' : PALETTE.gold, 'right');
      }
    }

    text('Use Up/Down arrows to select, Space/Enter to buy, Click option, Enter/Space to Continue', FIELD.width / 2, y + height - 20, 16, '#fdf0d5', 'center');
  }

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);

    if (screen === SCREEN_TITLE) {
      drawPanel('MAZEJANITOR', ['Clean slime, traps, chests & creatures across 5 wings!', 'Controls: Arrow/WASD, Space: start, B/Shift: bucket, M: Mute.', `Best Score: ${best}`], 'Press Space or Click to start shift');
      return;
    }

    if (screen === SCREEN_SHOP) {
      drawShop(state, best);
      return;
    }

    drawHud(state);

    if (screen === SCREEN_PAUSED) {
      drawPanel('Shift Paused', ['Take a breather, janitor.'], 'Press P or Escape to resume');
    } else if (screen === SCREEN_OVER) {
      drawPanel('Shift Failed', [`Score: ${state.score}`, `Gold Earned: ${state.gold}g`, `Best: ${best}`], 'Press Space or Click to try again');
    } else if (screen === SCREEN_WIN) {
      drawPanel('Dungeon Completely Sanitized!', [`Final Score: ${state.score}`, `Total Gold: ${state.gold}g`, `Best: ${best}`], 'Press Space or Click to play again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
