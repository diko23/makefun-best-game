import { FIELD, PLAYER, WING_CONFIGS, TOTAL_WINGS } from './config.js';
import { sound } from './audio.js';

export const KIND_SLIME = 0;
export const KIND_CHEST = 1;
export const KIND_TRAP = 2;
export const KIND_CREATURE = 3;

export const EVENT_CLEAN = 1;
export const EVENT_OVER = 2;
export const EVENT_WIN = 4;
export const EVENT_MISSION = 8;
export const EVENT_SURPRISE = 16;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const player = {
    x: 100,
    y: FIELD.groundY - PLAYER.height,
    width: PLAYER.width,
    height: PLAYER.height,
    vx: 0,
    facing: 1,
    mopAnim: 0,
  };

  const state = {
    player,
    items: [],
    fires: [],
    popups: [],
    particles: [],
    score: 0,
    gold: 0,
    cleaned: 0,
    quota: 10,
    wing: 1,
    time: 45,
    gameOver: false,
    won: false,
    inShop: false,
    shopCursor: 0,
    upgrades: {
      speed: 0,
      radius: 0,
      time: 0,
      bucket: 0,
    },
    mission: { desc: '', type: 'slime', target: 3, current: 0, done: false },
    activeEvent: null, // 'dragon', 'goblin', 'slime'
    eventTimer: 0,
    bannerText: '',
    bannerTimer: 0,
  };

  const missionsList = [
    { desc: 'Clean 3 Slime Pools first', type: 'slime', target: 3 },
    { desc: 'Soothe 2 Rowdy Creatures first', type: 'creature', target: 2 },
    { desc: 'Reset 2 Traps first', type: 'trap', target: 2 },
    { desc: 'Restock 2 Chests first', type: 'chest', target: 2 },
  ];

  function spawnItems() {
    state.cleaned = 0;
    state.items.length = 0;
    state.fires.length = 0;
    const cfg = WING_CONFIGS[state.wing - 1] || WING_CONFIGS[0];
    state.quota = cfg.quota;
    state.time = cfg.time + state.upgrades.time * 5;

    // Pick mission
    const m = missionsList[Math.floor(random() * missionsList.length)];
    state.mission = { desc: m.desc, type: m.type, target: m.target, current: 0, done: false };

    const kinds = [KIND_SLIME, KIND_CHEST, KIND_TRAP, KIND_CREATURE];
    for (let i = 0; i < cfg.itemsCount; i++) {
      const kind = kinds[Math.floor(random() * kinds.length)];
      state.items.push({
        active: true,
        kind,
        x: 100 + random() * (FIELD.width - 250),
        y: FIELD.groundY - 45 + (kind === KIND_SLIME ? 25 : -random() * 90),
        width: 48,
        height: 38,
      });
    }

    // Surprise events from wing 2 onward
    state.activeEvent = null;
    state.eventTimer = 10; // fires 10s into the wing
    if (state.wing >= 2) {
      const evs = ['dragon', 'goblin', 'slime'];
      state.activeEvent = evs[Math.floor(random() * evs.length)];
    }
  }

  function reset() {
    player.x = 100;
    player.y = FIELD.groundY - PLAYER.height;
    state.score = 0;
    state.gold = 0;
    state.cleaned = 0;
    state.wing = 1;
    state.gameOver = false;
    state.won = false;
    state.inShop = false;
    state.upgrades = { speed: 0, radius: 0, time: 0, bucket: 0 };
    state.popups.length = 0;
    state.particles.length = 0;
    spawnItems();
  }

  function addPopup(text, x, y, color = '#fdf0d5') {
    state.popups.push({ text, x, y, vy: -50, alpha: 1, color });
  }

  function addParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = random() * Math.PI * 2;
      const speed = 50 + random() * 120;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4,
        maxLife: 0.4,
        color,
      });
    }
  }

  function triggerSurpriseEvent() {
    sound.eventSting();
    if (state.activeEvent === 'dragon') {
      state.bannerText = 'EVENT: Dragon Sneeze! Fire patches on floor!';
      for (let i = 0; i < 4; i++) {
        state.fires.push({ x: 200 + i * 250 + random() * 50, y: FIELD.groundY - 20, width: 60, height: 30 });
      }
    } else if (state.activeEvent === 'goblin') {
      state.bannerText = 'EVENT: Goblin Party! Extra trash spawned!';
      for (let i = 0; i < 4; i++) {
        state.items.push({
          active: true,
          kind: KIND_SLIME,
          x: 150 + random() * 900,
          y: FIELD.groundY - 30,
          width: 50,
          height: 35,
        });
      }
    } else if (state.activeEvent === 'slime') {
      state.bannerText = 'EVENT: Living Slime! Blobs re-stain floors!';
      state.items.push({
        active: true,
        kind: KIND_SLIME,
        x: 600,
        y: FIELD.groundY - 30,
        width: 60,
        height: 40,
        living: true,
        vx: 120,
      });
    }
    state.bannerTimer = 4;
  }

  function step(dt, vx, vy, actionBucket, harmless) {
    let events = 0;
    if (state.gameOver || state.won) return events;
    if (state.inShop) {
      return events;
    }

    // Update time
    state.time -= dt;
    if (state.time <= 0) {
      if (state.cleaned >= state.quota) {
        sound.win();
        if (state.wing < TOTAL_WINGS) {
          state.inShop = true;
          state.gold += WING_CONFIGS[state.wing - 1].bonusGold;
          events |= EVENT_MISSION;
        } else {
          state.won = true;
          events |= EVENT_WIN;
        }
      } else {
        sound.lose();
        state.gameOver = true;
        events |= EVENT_OVER;
      }
    }

    // Event timer
    if (state.activeEvent && state.bannerTimer <= 0) {
      state.eventTimer -= dt;
      if (state.eventTimer <= 0) {
        triggerSurpriseEvent();
        state.eventTimer = 9999; // trigger once per wing
      }
    }
    if (state.bannerTimer > 0) {
      state.bannerTimer -= dt;
    }

    // Living slime movement & fire spread
    for (const item of state.items) {
      if (item.active && item.living) {
        item.x += item.vx * dt;
        if (item.x < 50 || item.x > FIELD.width - 150) item.vx *= -1;
      }
    }

    if (state.activeEvent === 'dragon' && state.fires.length > 0 && random() < 0.02) {
      state.fires.push({ x: 100 + random() * (FIELD.width - 250), y: FIELD.groundY - 20, width: 60, height: 30 });
    }

    // Douse fire with bucket (actionBucket or shift)
    if (actionBucket && state.fires.length > 0) {
      sound.bucket();
      const fire = state.fires.find(f => Math.abs((f.x + f.width/2) - (player.x + player.width/2)) < 120);
      if (fire) {
        fire.active = false;
        state.fires = state.fires.filter(f => f.active);
        addPopup('DOUSED!', player.x, player.y - 20, '#4ea8de');
        addParticles(fire.x, fire.y, '#4ea8de');
      }
    }

    // Player movement
    const currentSpeed = PLAYER.speed + state.upgrades.speed * 60;
    player.x = Math.min(FIELD.width - player.width, Math.max(0, player.x + vx * currentSpeed * dt));
    player.y = Math.min(FIELD.groundY - player.height, Math.max(200, player.y + vy * currentSpeed * dt));
    if (vx !== 0) {
      player.facing = vx > 0 ? 1 : -1;
      player.mopAnim += dt * 15;
    } else {
      player.mopAnim = 0;
    }

    // Popups & particles update
    for (let i = state.popups.length - 1; i >= 0; i--) {
      const p = state.popups[i];
      p.y += p.vy * dt;
      p.alpha -= dt * 1.5;
      if (p.alpha <= 0) state.popups.splice(i, 1);
    }
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }

    if (!harmless) {
      const reachRadius = 60 + state.upgrades.radius * 25;
      const playerCenter = { x: player.x + player.width / 2, y: player.y + player.height / 2 };

      for (let i = 0; i < state.items.length; i++) {
        const item = state.items[i];
        if (!item.active) continue;
        const itemCenter = { x: item.x + item.width / 2, y: item.y + item.height / 2 };
        const dist = Math.hypot(playerCenter.x - itemCenter.x, playerCenter.y - itemCenter.y);

        if (dist < reachRadius || overlaps(player, item)) {
          item.active = false;
          state.cleaned += 1;
          const pts = 100 + state.wing * 25;
          const gld = 25 + state.wing * 10;
          state.score += pts;
          state.gold += gld;
          sound.clean();
          addPopup(`+${pts} (${gld}g)`, item.x, item.y - 15, '#ffb703');
          addParticles(itemCenter.x, itemCenter.y, item.kind === KIND_SLIME ? '#38b000' : '#f77f00');

          // Mission progress check
          if (!state.mission.done) {
            if (
              (state.mission.type === 'slime' && item.kind === KIND_SLIME) ||
              (state.mission.type === 'creature' && item.kind === KIND_CREATURE) ||
              (state.mission.type === 'trap' && item.kind === KIND_TRAP) ||
              (state.mission.type === 'chest' && item.kind === KIND_CHEST)
            ) {
              state.mission.current += 1;
              if (state.mission.current >= state.mission.target) {
                state.mission.done = true;
                state.gold += 150;
                sound.missionDone();
                addPopup('MISSION COMPLETE! +150g', FIELD.width / 2 - 100, 120, '#ffb703');
              }
            }
          }

          events |= EVENT_CLEAN;
          if (state.cleaned >= state.quota && state.wing === TOTAL_WINGS) {
            state.won = true;
            sound.win();
            events |= EVENT_WIN;
          }
        }
      }
    }
    return events;
  }

  function buyUpgrade(index) {
    if (index === 4) {
      advanceWing();
      return true;
    }
    const costs = [
      100 + state.upgrades.speed * 75,
      120 + state.upgrades.radius * 90,
      150 + state.upgrades.time * 100,
      200 + state.upgrades.bucket * 150,
    ];
    const key = ['speed', 'radius', 'time', 'bucket'][index];
    const cost = costs[index];
    if (state.gold >= cost && state.upgrades[key] < 3) {
      state.gold -= cost;
      state.upgrades[key] += 1;
      sound.buy();
      return true;
    }
    return false;
  }

  function advanceWing() {
    state.inShop = false;
    state.wing += 1;
    spawnItems();
  }

  reset();
  return { state, reset, step, buyUpgrade, advanceWing };
}
