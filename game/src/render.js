// Canvas rendering pipeline for THE MAZEJANITOR
import { FIELD, PALETTE, FONT, TOTAL_WINGS } from './config.js';
import { KIND_SLIME, KIND_CHEST, KIND_TRAP, KIND_CREATURE } from './world.js';

// Wall props and decorative layout
const WALL_BANNERS = [
  { x: 260, y: 70, width: 60, height: 160, color: '#7f1d1d' },
  { x: 640, y: 70, width: 60, height: 160, color: '#1e3a5f' },
  { x: 1020, y: 70, width: 60, height: 160, color: '#7f1d1d' },
];

const WALL_TORCHES = [
  { x: 140, y: 220 },
  { x: 450, y: 220 },
  { x: 830, y: 220 },
  { x: 1140, y: 220 },
];

const WALL_PROPS = [
  { type: 'barrel', x: 50, y: 440, w: 42, h: 54 },
  { type: 'barrel', x: 92, y: 455, w: 38, h: 48 },
  { type: 'crate', x: 1190, y: 442, w: 48, h: 52 },
  { type: 'crate', x: 1145, y: 460, w: 42, h: 44 },
];

const FLOOR_RUGS = [
  { x: 180, y: 550, w: 260, h: 110, color: '#581c1a', border: '#b45309' },
  { x: 800, y: 555, w: 280, h: 105, color: '#1c3144', border: '#d97706' },
];

const FLOOR_DEBRIS = [
  { x: 120, y: 535, r: 4, color: '#332014' },
  { x: 470, y: 540, r: 6, color: '#27170b' },
  { x: 510, y: 670, r: 5, color: '#332014' },
  { x: 740, y: 530, r: 4, color: '#27170b' },
  { x: 1120, y: 660, r: 7, color: '#332014' },
  { x: 620, y: 685, r: 5, color: '#27170b' },
];

function drawDungeonBackground(ctx, animTime) {
  // 1. Wall band (0 to FIELD.groundY: 520)
  ctx.fillStyle = '#22140a';
  ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);

  // Stone brick texture / panels
  ctx.strokeStyle = '#2e1c10';
  ctx.lineWidth = 3;
  for (let y = 40; y < FIELD.groundY; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();

    const rowOffset = (y / 60) % 2 === 0 ? 0 : 70;
    for (let x = rowOffset; x < FIELD.width; x += 140) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 60);
      ctx.stroke();
    }
  }

  // Corner cobwebs
  ctx.strokeStyle = 'rgba(214, 211, 209, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(80, 0); ctx.lineTo(0, 80); ctx.closePath();
  ctx.moveTo(0, 0); ctx.lineTo(55, 55);
  ctx.moveTo(FIELD.width, 0); ctx.lineTo(FIELD.width - 80, 0); ctx.lineTo(FIELD.width, 80); ctx.closePath();
  ctx.moveTo(FIELD.width, 0); ctx.lineTo(FIELD.width - 55, 55);
  ctx.stroke();

  // Wall banners
  for (const b of WALL_BANNERS) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.width, b.height - 20);
    // V-shaped banner bottom
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + b.height - 20);
    ctx.lineTo(b.x + b.width / 2, b.y + b.height);
    ctx.lineTo(b.x + b.width, b.y + b.height - 20);
    ctx.closePath();
    ctx.fill();

    // Gold trim & motif
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x + 4, b.y + 4, b.width - 8, b.height - 28);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(b.x + b.width / 2, b.y + 50, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crates and barrels at wall base
  for (const p of WALL_PROPS) {
    if (p.type === 'barrel') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#291307';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Iron bands
      ctx.fillStyle = '#475569';
      ctx.fillRect(p.x, p.y + 8, p.w, 5);
      ctx.fillRect(p.x, p.y + p.h - 13, p.w, 5);
    } else if (p.type === 'crate') {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      // Cross brace
      ctx.beginPath();
      ctx.moveTo(p.x + 2, p.y + 2);
      ctx.lineTo(p.x + p.w - 2, p.y + p.h - 2);
      ctx.moveTo(p.x + p.w - 2, p.y + 2);
      ctx.lineTo(p.x + 2, p.y + p.h - 2);
      ctx.stroke();
    }
  }

  // Torches with animated flicker (R9)
  for (let i = 0; i < WALL_TORCHES.length; i++) {
    const t = WALL_TORCHES[i];
    const flicker = Math.sin(animTime * 10 + i * 2.3) * 5 + Math.cos(animTime * 17 + i) * 3;
    const glowRadius = 85 + flicker;

    // Torch sconce & bracket
    ctx.fillStyle = '#334155';
    ctx.fillRect(t.x - 3, t.y, 6, 26);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(t.x - 8, t.y - 4, 16, 6);

    // Light glow
    const grad = ctx.createRadialGradient(t.x, t.y - 12, 4, t.x, t.y - 12, glowRadius);
    grad.addColorStop(0, 'rgba(255, 183, 3, 0.45)');
    grad.addColorStop(0.5, 'rgba(255, 84, 0, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, t.y - 12, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Flame tongue
    ctx.fillStyle = '#ff5400';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - 14 + flicker * 0.2, 8, 14 + flicker * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - 12 + flicker * 0.2, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y - 10, 2.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Floor band (FIELD.groundY: 520 to FIELD.height: 720)
  ctx.fillStyle = '#180e07';
  ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);

  // Border molding between wall and floor
  ctx.fillStyle = '#3a2213';
  ctx.fillRect(0, FIELD.groundY - 6, FIELD.width, 10);
  ctx.fillStyle = '#0f0804';
  ctx.fillRect(0, FIELD.groundY + 4, FIELD.width, 3);

  // Floor flagstone tiles
  ctx.strokeStyle = '#26160b';
  ctx.lineWidth = 2;
  const tileRowHeight = 50;
  for (let y = FIELD.groundY + 10; y < FIELD.height; y += tileRowHeight) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();

    const offset = ((y - FIELD.groundY) / tileRowHeight) % 2 === 0 ? 0 : 55;
    for (let x = offset; x < FIELD.width; x += 110) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + tileRowHeight);
      ctx.stroke();
    }
  }

  // Dungeon rugs
  for (const r of FLOOR_RUGS) {
    ctx.fillStyle = r.color;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = r.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);

    // Inner diamond motif
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 12, r.y + 10, r.w - 24, r.h - 20);
    // Fringe edges
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(r.x - 2, r.y + 4, 3, r.h - 8);
    ctx.fillRect(r.x + r.w - 1, r.y + 4, 3, r.h - 8);
  }

  // Scattered pebbles and stain debris
  for (const d of FLOOR_DEBRIS) {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.r * 1.6, d.r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlime(ctx, x, y, width, height, living, animTime) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  const wobble = living ? Math.sin(animTime * 8) * 0.08 : 0;
  ctx.scale(1 + wobble, 1 - wobble);

  // Outline
  ctx.fillStyle = '#052e16';
  ctx.beginPath();
  ctx.ellipse(0, 4, width / 2 + 2, height / 2 - 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shaded body
  const grad = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
  grad.addColorStop(0, living ? '#84cc16' : '#4ade80');
  grad.addColorStop(0.6, living ? '#4d7c0f' : '#22c55e');
  grad.addColorStop(1, living ? '#1a2e05' : '#15803d');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 3, width / 2, height / 2 - 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(-width * 0.2, -height * 0.15, width * 0.15, height * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Living slime eyes
  if (living) {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-8, -1, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-8, -1, 1.5, 0, Math.PI * 2);
    ctx.arc(8, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawChest(ctx, x, y, width, height) {
  ctx.save();
  // Outline
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

  // Chest body (wood shading)
  const grad = ctx.createLinearGradient(x, y, x, y + height);
  grad.addColorStop(0, '#b45309');
  grad.addColorStop(0.5, '#78350f');
  grad.addColorStop(1, '#451a03');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y + height * 0.35, width, height * 0.65);

  // Curved lid
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height * 0.38, width / 2, height * 0.38, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Iron reinforcements
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 4, y, 5, height);
  ctx.fillRect(x + width - 9, y, 5, height);

  // Gold lock plate and keyhole
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + width / 2 - 5, y + height * 0.32, 10, 11);
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height * 0.37, 2, 0, Math.PI * 2);
  ctx.rect(x + width / 2 - 1, y + height * 0.37, 2, 4);
  ctx.fill();

  ctx.restore();
}

function drawTrap(ctx, x, y, width, height) {
  ctx.save();
  // Iron base plate
  ctx.fillStyle = '#111827';
  ctx.fillRect(x - 1, y + height * 0.65 - 1, width + 2, height * 0.35 + 2);

  ctx.fillStyle = '#374151';
  ctx.fillRect(x, y + height * 0.65, width, height * 0.35);

  // Red trigger plate
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(x + width * 0.3, y + height * 0.68, width * 0.4, 5);

  // Jagged serrated teeth
  ctx.fillStyle = '#f3f4f6';
  ctx.beginPath();
  const teethCount = 5;
  const toothW = width / teethCount;
  for (let i = 0; i < teethCount; i++) {
    const tx = x + i * toothW;
    ctx.moveTo(tx, y + height * 0.65);
    ctx.lineTo(tx + toothW / 2, y + height * 0.15);
    ctx.lineTo(tx + toothW, y + height * 0.65);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawCreature(ctx, x, y, width, height, animTime) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  const breath = Math.sin(animTime * 5) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(0, height * 0.35, width * 0.45, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark outline
  ctx.fillStyle = '#082f49';
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.45 + 2, 0, Math.PI * 2);
  ctx.fill();

  // Shaded body
  const grad = ctx.createRadialGradient(-4, -6, 3, 0, 0, width * 0.45);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(0.7, '#0284c7');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Cute little ears/tufts
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(-width * 0.35, -height * 0.2);
  ctx.lineTo(-width * 0.4, -height * 0.5 + breath);
  ctx.lineTo(-width * 0.15, -height * 0.35);
  ctx.moveTo(width * 0.35, -height * 0.2);
  ctx.lineTo(width * 0.4, -height * 0.5 + breath);
  ctx.lineTo(width * 0.15, -height * 0.35);
  ctx.fill();

  // Big expressive eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-7, -2, 5.5, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(7, -2, 5.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-6, -1, 3, 0, Math.PI * 2);
  ctx.arc(8, -1, 3, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle highlight
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-7, -3, 1.2, 0, Math.PI * 2);
  ctx.arc(7, -3, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawJanitor(ctx, player) {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  if (player.facing < 0) {
    ctx.scale(-1, 1);
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, player.height * 0.45, player.width * 0.4, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const walkBob = player.mopAnim > 0 ? Math.sin(player.mopAnim) * 2.5 : 0;

  // Legs / Boots
  ctx.fillStyle = '#26140b';
  ctx.fillRect(-14, player.height * 0.25 + walkBob, 10, player.height * 0.22);
  ctx.fillRect(4, player.height * 0.25 - walkBob, 10, player.height * 0.22);

  // Body / Overalls
  ctx.fillStyle = '#d97706';
  ctx.fillRect(-17, -player.height * 0.15 + walkBob, 34, player.height * 0.42);
  // Belt
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-17, player.height * 0.15 + walkBob, 34, 5);
  // Brass buckle
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-4, player.height * 0.13 + walkBob, 8, 8);

  // Head
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.arc(0, -player.height * 0.25 + walkBob, 13, 0, Math.PI * 2);
  ctx.fill();

  // Janitor cap
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(0, -player.height * 0.34 + walkBob, 15, 7, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Cap brim
  ctx.fillStyle = '#451a03';
  ctx.fillRect(1, -player.height * 0.33 + walkBob, 16, 4);

  // Eye
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(4, -player.height * 0.27 + walkBob, 3, 3);

  // Mop with swinging head (R9)
  const mopSwing = player.mopAnim > 0 ? Math.sin(player.mopAnim) * 0.4 : 0;
  ctx.save();
  ctx.translate(12, player.height * 0.05 + walkBob);
  ctx.rotate(0.3 + mopSwing);

  // Handle
  ctx.fillStyle = '#a16207';
  ctx.fillRect(-3, -32, 5, 50);

  // Two-tone mop head
  ctx.fillStyle = '#10b981';
  ctx.fillRect(-12, 18, 24, 8);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(-10, 26, 20, 6);

  ctx.restore();
  ctx.restore();
}

function drawFire(ctx, fire, animTime) {
  const flicker = Math.sin(animTime * 14 + fire.x) * 4;
  ctx.save();
  ctx.translate(fire.x + fire.width / 2, fire.y + fire.height / 2);

  // Outer glow
  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, fire.width * 0.75);
  grad.addColorStop(0, 'rgba(255, 84, 0, 0.5)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, fire.width * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Red flame tongue
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(0, 4, fire.width * 0.45, fire.height * 0.45 + flicker * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orange flame tongue
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.ellipse(0, 2, fire.width * 0.32, fire.height * 0.38 + flicker * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Yellow inner core
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(0, 0, fire.width * 0.18, fire.height * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHUD(ctx, state) {
  // Top HUD bar
  ctx.fillStyle = 'rgba(24, 14, 7, 0.88)';
  ctx.fillRect(0, 0, FIELD.width, 54);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 54);
  ctx.lineTo(FIELD.width, 54);
  ctx.stroke();

  ctx.font = `bold 18px ${FONT}`;
  ctx.textBaseline = 'middle';

  // Wing info
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`WING ${state.wing}/${TOTAL_WINGS}`, 24, 27);

  // Quota
  const quotaMet = state.cleaned >= state.quota;
  ctx.fillStyle = quotaMet ? '#4ade80' : PALETTE.text;
  ctx.fillText(`Cleaned: ${state.cleaned}/${state.quota}`, 170, 27);

  // Time
  const timeLeft = Math.max(0, Math.ceil(state.time));
  const isUrgent = timeLeft < 10;
  ctx.fillStyle = isUrgent ? '#ef4444' : PALETTE.text;
  ctx.fillText(`Time: ${timeLeft}s`, 360, 27);

  // Mission
  ctx.fillStyle = state.mission.done ? '#4ade80' : PALETTE.muted;
  const missionText = state.mission.done
    ? `Mission: ${state.mission.desc} (DONE!)`
    : `Mission: ${state.mission.desc} (${state.mission.current}/${state.mission.target})`;
  ctx.fillText(missionText, 510, 27);

  // Gold & Score (Right aligned)
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`Gold: ${state.gold}g`, FIELD.width - 200, 27);
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`Score: ${state.score}`, FIELD.width - 30, 27);
  ctx.textAlign = 'left';

  // Surprise event banner
  if (state.bannerTimer > 0 && state.bannerText) {
    ctx.save();
    ctx.fillStyle = 'rgba(180, 83, 9, 0.95)';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    const bannerW = 620;
    const bannerX = (FIELD.width - bannerW) / 2;
    ctx.fillRect(bannerX, 64, bannerW, 38);
    ctx.strokeRect(bannerX, 64, bannerW, 38);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, FIELD.width / 2, 83);
    ctx.restore();
  }
}

function drawPopupsAndParticles(ctx, state) {
  // Floating popups
  ctx.save();
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'center';
  for (const p of state.popups) {
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color || '#fdf0d5';
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.restore();

  // Burst particles
  for (const pt of state.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Title screen per R11: tagline, win hint, motif, honest controls
export function drawTitle(ctx, bestScore, animTime) {
  drawDungeonBackground(ctx, animTime);

  // Center panel
  const panelW = 740;
  const panelH = 430;
  const panelX = (FIELD.width - panelW) / 2;
  const panelY = (FIELD.height - panelH) / 2 - 20;

  ctx.fillStyle = 'rgba(38, 22, 11, 0.94)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 4;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb703';
  ctx.font = `bold 46px ${FONT}`;
  ctx.fillText('THE MAZEJANITOR', FIELD.width / 2, panelY + 68);

  // Tagline per R11
  ctx.fillStyle = '#fdf0d5';
  ctx.font = `italic 20px ${FONT}`;
  ctx.fillText('Clean the maze before the heroes arrive', FIELD.width / 2, panelY + 110);

  // Janitor & Slime motif illustration per R11
  const motifY = panelY + 160;
  ctx.save();
  // Mini janitor
  const miniPlayer = {
    x: FIELD.width / 2 - 80,
    y: motifY - 20,
    width: 48,
    height: 56,
    facing: 1,
    mopAnim: animTime * 8,
  };
  drawJanitor(ctx, miniPlayer);
  // Mini slime
  drawSlime(ctx, FIELD.width / 2 + 30, motifY - 5, 46, 32, false, animTime);
  ctx.restore();

  // One-line how to win hint per R11
  ctx.fillStyle = '#fef08a';
  ctx.font = `17px ${FONT}`;
  ctx.fillText('Clean the wing quota before time runs out to advance through 5 wings.', FIELD.width / 2, panelY + 255);

  // Controls
  ctx.fillStyle = '#c6ac8f';
  ctx.font = `16px ${FONT}`;
  ctx.fillText('Controls: Arrow Keys / WASD / Click to move • B / Shift: Water Bucket', FIELD.width / 2, panelY + 300);

  // Honest start prompt
  ctx.fillStyle = '#4ade80';
  ctx.font = `bold 22px ${FONT}`;
  const pulse = Math.sin(animTime * 5) * 0.2 + 0.8;
  ctx.globalAlpha = pulse;
  ctx.fillText('Space or Click to Start', FIELD.width / 2, panelY + 355);
  ctx.globalAlpha = 1;

  // Best score
  if (bestScore > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(`Best Score: ${bestScore}`, FIELD.width / 2, panelY + 395);
  }
}

// Shop screen per R6, R7, R13: honest footer, click support, no unused parameters
export function drawShop(ctx, state) {
  // Translucent backdrop
  ctx.fillStyle = 'rgba(24, 14, 7, 0.88)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  const panelW = 720;
  const panelH = 500;
  const panelX = (FIELD.width - panelW) / 2;
  const panelY = (FIELD.height - panelH) / 2;

  ctx.fillStyle = '#2d1b0f';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 4;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Shop header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb703';
  ctx.font = `bold 32px ${FONT}`;
  ctx.fillText(`Wing ${state.wing} Cleared! Upgrade Shop`, FIELD.width / 2, panelY + 50);

  ctx.fillStyle = '#fdf0d5';
  ctx.font = `20px ${FONT}`;
  ctx.fillText(`Available Gold: ${state.gold}g`, FIELD.width / 2, panelY + 85);

  const upgradeOptions = [
    { name: 'Broom Speed', key: 'speed', cost: 150 + state.upgrades.speed * 112, desc: '+60 speed' },
    { name: 'Reach Radius', key: 'radius', cost: 180 + state.upgrades.radius * 135, desc: '+25px reach' },
    { name: 'Wing Time Bonus', key: 'time', cost: 225 + state.upgrades.time * 150, desc: '+5s per wing' },
    { name: 'Water Bucket Range', key: 'bucket', cost: 300 + state.upgrades.bucket * 225, desc: '+60px douse radius' },
    { name: `Continue to Wing ${state.wing + 1}`, key: 'continue', cost: 0, desc: 'Next Wing' },
  ];

  const rowStartY = panelY + 125;
  const rowHeight = 58;

  for (let i = 0; i < upgradeOptions.length; i++) {
    const opt = upgradeOptions[i];
    const rowY = rowStartY + i * rowHeight;
    const isSelected = state.shopCursor === i;

    // Highlight row
    if (isSelected) {
      ctx.fillStyle = 'rgba(180, 83, 9, 0.45)';
      ctx.fillRect(panelX + 24, rowY, panelW - 48, rowHeight - 8);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX + 24, rowY, panelW - 48, rowHeight - 8);
    } else {
      ctx.fillStyle = 'rgba(45, 27, 15, 0.6)';
      ctx.fillRect(panelX + 24, rowY, panelW - 48, rowHeight - 8);
    }

    ctx.textAlign = 'left';
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillStyle = isSelected ? '#fbbf24' : '#fdf0d5';
    const cursorMarker = isSelected ? '▶ ' : '   ';
    ctx.fillText(`${cursorMarker}${opt.name}`, panelX + 40, rowY + 31);

    if (opt.key === 'continue') {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#4ade80';
      ctx.fillText('Ready', panelX + panelW - 45, rowY + 31);
    } else {
      const level = state.upgrades[opt.key];
      const maxed = level >= 3;
      const canAfford = state.gold >= opt.cost && !maxed;

      ctx.fillStyle = '#c6ac8f';
      ctx.font = `15px ${FONT}`;
      ctx.fillText(`Lv ${level}/3 (${opt.desc})`, panelX + 280, rowY + 31);

      ctx.textAlign = 'right';
      ctx.font = `bold 17px ${FONT}`;
      if (maxed) {
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('MAX', panelX + panelW - 45, rowY + 31);
      } else {
        ctx.fillStyle = canAfford ? '#fbbf24' : '#ef4444';
        ctx.fillText(`${opt.cost}g`, panelX + panelW - 45, rowY + 31);
      }
    }
  }

  // Honest shop footer text per R6 & R13
  ctx.textAlign = 'center';
  ctx.font = `15px ${FONT}`;
  ctx.fillStyle = '#fef08a';
  ctx.fillText('Click row to select, click again to buy • Up/Down + Enter • Space/Esc: Continue', FIELD.width / 2, panelY + panelH - 24);
}

// Pause screen
export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(15, 8, 4, 0.75)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb703';
  ctx.font = `bold 42px ${FONT}`;
  ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 20);

  ctx.fillStyle = '#fdf0d5';
  ctx.font = `20px ${FONT}`;
  ctx.fillText('Press P, Esc, or Click to resume', FIELD.width / 2, FIELD.height / 2 + 30);
}

// Game over screen
export function drawGameOver(ctx, state, bestScore) {
  ctx.fillStyle = 'rgba(20, 10, 5, 0.88)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  const panelW = 600;
  const panelH = 340;
  const panelX = (FIELD.width - panelW) / 2;
  const panelY = (FIELD.height - panelH) / 2;

  ctx.fillStyle = '#2b140b';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillText('TIME EXPIRED!', FIELD.width / 2, panelY + 60);

  ctx.fillStyle = '#fdf0d5';
  ctx.font = `20px ${FONT}`;
  ctx.fillText(`Dungeon overrun at Wing ${state.wing}`, FIELD.width / 2, panelY + 110);
  ctx.fillText(`Final Score: ${state.score}  •  Gold: ${state.gold}g`, FIELD.width / 2, panelY + 155);

  const effectiveBest = Math.max(bestScore, state.score);
  if (effectiveBest > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`Best Score: ${effectiveBest}`, FIELD.width / 2, panelY + 200);
  }

  ctx.fillStyle = '#4ade80';
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('Press Space or Click to Retry', FIELD.width / 2, panelY + 270);
}

// Victory screen
export function drawWin(ctx, state, bestScore) {
  ctx.fillStyle = 'rgba(20, 10, 5, 0.88)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  const panelW = 660;
  const panelH = 360;
  const panelX = (FIELD.width - panelW) / 2;
  const panelY = (FIELD.height - panelH) / 2;

  ctx.fillStyle = '#1c2d1b';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillText('DUNGEON SANITIZED!', FIELD.width / 2, panelY + 60);

  ctx.fillStyle = '#fdf0d5';
  ctx.font = `20px ${FONT}`;
  ctx.fillText('All 5 Wings cleaned before the heroes arrived!', FIELD.width / 2, panelY + 110);
  ctx.fillText(`Final Score: ${state.score}  •  Gold: ${state.gold}g`, FIELD.width / 2, panelY + 160);

  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`Best Score: ${Math.max(bestScore, state.score)}`, FIELD.width / 2, panelY + 210);

  ctx.fillStyle = '#4ade80';
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('Press Space or Click to Play Again', FIELD.width / 2, panelY + 285);
}

// Active gameplay rendering
export function drawPlay(ctx, state, animTime) {
  drawDungeonBackground(ctx, animTime);

  // Fires
  for (const fire of state.fires) {
    drawFire(ctx, fire, animTime);
  }

  // Items
  for (const item of state.items) {
    if (!item.active) continue;
    if (item.kind === KIND_SLIME) {
      drawSlime(ctx, item.x, item.y, item.width, item.height, item.living, animTime);
    } else if (item.kind === KIND_CHEST) {
      drawChest(ctx, item.x, item.y, item.width, item.height);
    } else if (item.kind === KIND_TRAP) {
      drawTrap(ctx, item.x, item.y, item.width, item.height);
    } else if (item.kind === KIND_CREATURE) {
      drawCreature(ctx, item.x, item.y, item.width, item.height, animTime);
    }
  }

  // Janitor
  drawJanitor(ctx, state.player);

  // Popups and particles
  drawPopupsAndParticles(ctx, state);

  // Red hurtFlash overlay per instructions
  if (state.hurtFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(220, 38, 38, ${Math.min(0.65, state.hurtFlash * 2.2)})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.restore();
  }

  // HUD
  drawHUD(ctx, state);
}
