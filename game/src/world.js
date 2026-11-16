// Core gameplay simulation and state management for THE MAZEJANITOR
import { FIELD, PLAYER, WING_CONFIGS, TOTAL_WINGS } from './config.js';
import { sound } from './audio.js';

export const KIND_SLIME = 0;
export const KIND_CHEST = 1;
export const KIND_TRAP = 2;
export const KIND_CREATURE = 3;

export const EVENT_CLEAN = 1;
export const EVENT_OVER = 2;
export const EVENT_WIN = 4;
export const EVENT_WING_CLEAR = 8;
export const EVENT_SURPRISE = 16;

function checkOverlap(boxA, boxB) {
  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  );
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
    quota: 9,
    wing: 1,
    time: 35,
    gameOver: false,
    won: false,
    inShop: false,
    shopCursor: 0,
    hurtFlash: 0,
    upgrades: {
      speed: 0,
      radius: 0,
      time: 0,
      bucket: 0,
    },
    mission: { desc: '', type: 'slime', target: 3, current: 0, done: false },
    activeEvent: null,
    eventTimer: 0,
    bannerText: '',
    bannerTimer: 0,
  };

  // Missions without "first" qualifier per R13
  const missionPool = [
    { desc: 'Clean 3 Slime Pools', type: 'slime', target: 3 },
    { desc: 'Soothe 2 Rowdy Creatures', type: 'creature', target: 2 },
    { desc: 'Reset 2 Traps', type: 'trap', target: 2 },
    { desc: 'Restock 2 Chests', type: 'chest', target: 2 },
  ];

  function addPopup(text, x, y, color = '#fdf0d5') {
    state.popups.push({ text, x, y, vy: -50, alpha: 1, color });
  }

  function addParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const speed = 50 + random() * 120;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4,
        maxLife: 0.4,
        color,
      });
    }
  }

  function spawnItems() {
    state.cleaned = 0;
    state.items.length = 0;
    state.fires.length = 0;
    const cfg = WING_CONFIGS[state.wing - 1] || WING_CONFIGS[0];
    state.quota = cfg.quota;
    state.time = cfg.time + state.upgrades.time * 5;

    // Pick a wing mission
    const chosenMission = missionPool[Math.floor(random() * missionPool.length)];
    state.mission = {
      desc: chosenMission.desc,
      type: chosenMission.type,
      target: chosenMission.target,
      current: 0,
      done: false,
    };

    const kinds = [KIND_SLIME, KIND_CHEST, KIND_TRAP, KIND_CREATURE];
    // R2: Spread items further apart - reject positions closer than 90px (up to 60 tries)
    for (let i = 0; i < cfg.itemsCount; i++) {
      const kind = kinds[Math.floor(random() * kinds.length)];
      let candX = 100;
      let candY = FIELD.groundY - 45;

      for (let attempt = 0; attempt < 60; attempt++) {
        candX = 100 + random() * (FIELD.width - 250);
        candY = 380 + random() * (650 - 380);
        const candCenterX = candX + 24;
        const candCenterY = candY + 19;

        const tooClose = state.items.some((placed) => {
          const placedCenterX = placed.x + placed.width / 2;
          const placedCenterY = placed.y + placed.height / 2;
          return Math.hypot(candCenterX - placedCenterX, candCenterY - placedCenterY) < 90;
        });

        if (!tooClose) break;
      }

      state.items.push({
        active: true,
        kind,
        x: candX,
        y: candY,
        width: 48,
        height: 38,
      });
    }

    // Surprise events from wing 2 onward
    state.activeEvent = null;
    state.eventTimer = 10;
    if (state.wing >= 2) {
      const possibleEvents = ['dragon', 'goblin', 'slime'];
      state.activeEvent = possibleEvents[Math.floor(random() * possibleEvents.length)];
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
    state.shopCursor = 0;
    state.hurtFlash = 0;
    state.upgrades = { speed: 0, radius: 0, time: 0, bucket: 0 };
    state.popups.length = 0;
    state.particles.length = 0;
    spawnItems();
  }

  function triggerSurpriseEvent() {
    sound.eventSting();
    if (state.activeEvent === 'dragon') {
      state.bannerText = 'EVENT: Dragon Sneeze! Fire patches on floor!';
      for (let i = 0; i < 4; i++) {
        state.fires.push({
          x: 200 + i * 250 + random() * 50,
          y: FIELD.groundY - 20,
          width: 60,
          height: 30,
        });
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

  function advanceWing() {
    state.inShop = false;
    state.wing += 1;
    spawnItems();
  }

  function completeWingQuota() {
    // R1: Time bonus +10 gold and +25 score per second remaining
    const remainingSeconds = Math.max(0, Math.ceil(state.time));
    const bonusGold = remainingSeconds * 10;
    const bonusScore = remainingSeconds * 25;
    state.gold += bonusGold;
    state.score += bonusScore;
    addPopup(`TIME BONUS +${bonusGold}g +${bonusScore}`, FIELD.width / 2 - 120, 150, '#ffb703');

    if (state.wing < TOTAL_WINGS) {
      sound.win();
      state.inShop = true;
      state.gold += WING_CONFIGS[state.wing - 1].bonusGold;
      return EVENT_WING_CLEAR;
    } else {
      sound.win();
      state.won = true;
      return EVENT_WIN;
    }
  }

  function step(dt, vx, vy, actionBucket, harmless) {
    let events = 0;
    if (state.gameOver || state.won || state.inShop) return events;

    // Countdown wing timer
    state.time -= dt;
    if (state.hurtFlash > 0) {
      state.hurtFlash = Math.max(0, state.hurtFlash - dt);
    }

    if (state.time <= 0) {
      state.time = 0;
      if (state.cleaned >= state.quota) {
        events |= completeWingQuota();
      } else {
        sound.lose();
        state.gameOver = true;
        events |= EVENT_OVER;
        return events;
      }
    }

    // Surprise event timing
    if (state.activeEvent && state.bannerTimer <= 0) {
      state.eventTimer -= dt;
      if (state.eventTimer <= 0) {
        triggerSurpriseEvent();
        state.eventTimer = 99999;
        events |= EVENT_SURPRISE;
      }
    }
    if (state.bannerTimer > 0) {
      state.bannerTimer -= dt;
    }

    // R4: Living slime movement & re-staining cleaned spots
    for (const livingItem of state.items) {
      if (livingItem.active && livingItem.living) {
        livingItem.x += livingItem.vx * dt;
        if (livingItem.x < 50 || livingItem.x > FIELD.width - 150) {
          livingItem.vx *= -1;
        }

        // Re-stain cleaned (inactive, non-living) items
        for (const item of state.items) {
          if (!item.active && !item.living && checkOverlap(livingItem, item)) {
            item.active = true;
            state.cleaned = Math.max(0, state.cleaned - 1);
            addPopup('RE-STAINED!', item.x, item.y - 15, '#38b000');
            addParticles(item.x + item.width / 2, item.y + item.height / 2, '#38b000');
          }
        }
      }
    }

    // R3: Dragon fire spread capped at 10 active fires
    if (state.activeEvent === 'dragon' && state.fires.length > 0 && state.fires.length < 10 && random() < 0.02) {
      state.fires.push({
        x: 100 + random() * (FIELD.width - 250),
        y: FIELD.groundY - 20,
        width: 60,
        height: 30,
      });
    }

    // R3: Bucket (B/Shift) douses ALL fires within radius 120 + 60 * bucket level
    if (actionBucket && state.fires.length > 0) {
      sound.bucket();
      const douseRadius = 120 + state.upgrades.bucket * 60;
      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;
      let dousedCount = 0;

      state.fires = state.fires.filter((fire) => {
        const fireCenterX = fire.x + fire.width / 2;
        const fireCenterY = fire.y + fire.height / 2;
        const dist = Math.hypot(playerCenterX - fireCenterX, playerCenterY - fireCenterY);
        if (dist <= douseRadius) {
          dousedCount++;
          addParticles(fireCenterX, fireCenterY, '#4ea8de');
          return false;
        }
        return true;
      });

      if (dousedCount > 0) {
        addPopup('DOUSED!', player.x, player.y - 20, '#4ea8de');
      }
    }

    // Player movement
    const currentSpeed = PLAYER.speed + state.upgrades.speed * 60;
    player.x = Math.min(FIELD.width - player.width, Math.max(0, player.x + vx * currentSpeed * dt));
    player.y = Math.min(FIELD.height - player.height, Math.max(280, player.y + vy * currentSpeed * dt));
    if (vx !== 0) {
      player.facing = vx > 0 ? 1 : -1;
      player.mopAnim += dt * 15;
    } else {
      player.mopAnim = 0;
    }

    // R3: Touching a fire costs 3 seconds, triggers red flash, and burns out the fire
    for (let f = state.fires.length - 1; f >= 0; f--) {
      const fire = state.fires[f];
      if (checkOverlap(player, fire)) {
        state.time = Math.max(0, state.time - 3);
        state.hurtFlash = 0.25;
        addPopup('-3s FIRE!', player.x, player.y - 20, '#d62828');
        addParticles(fire.x + fire.width / 2, fire.y + fire.height / 2, '#ff5400');
        state.fires.splice(f, 1);
      }
    }

    // Update floating popups and particles
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

        if (dist < reachRadius || checkOverlap(player, item)) {
          item.active = false;
          state.cleaned += 1;

          // R5: Clean gold 12 + 5 * wing; score 100 + 25 * wing
          const pts = 100 + state.wing * 25;
          const gld = 12 + state.wing * 5;
          state.score += pts;
          state.gold += gld;
          sound.clean();
          addPopup(`+${pts} (${gld}g)`, item.x, item.y - 15, '#ffb703');
          const pProps = {
            [KIND_SLIME]: { color: '#38b000', count: 10 },
            [KIND_CHEST]: { color: '#ffb703', count: 12 },
            [KIND_TRAP]: { color: '#d62828', count: 8 },
            [KIND_CREATURE]: { color: '#4ea8de', count: 10 },
          }[item.kind] || { color: '#f77f00', count: 8 };
          addParticles(itemCenter.x, itemCenter.y, pProps.color, pProps.count);

          // Mission progress check (R5: mission bonus +75g)
          if (!state.mission.done) {
            const matchesMission =
              (state.mission.type === 'slime' && item.kind === KIND_SLIME) ||
              (state.mission.type === 'creature' && item.kind === KIND_CREATURE) ||
              (state.mission.type === 'trap' && item.kind === KIND_TRAP) ||
              (state.mission.type === 'chest' && item.kind === KIND_CHEST);

            if (matchesMission) {
              state.mission.current += 1;
              if (state.mission.current >= state.mission.target) {
                state.mission.done = true;
                state.gold += 75;
                sound.missionDone();
                addPopup('MISSION COMPLETE! +75g', FIELD.width / 2 - 100, 120, '#ffb703');
              }
            }
          }

          events |= EVENT_CLEAN;

          // R1: Reaching quota immediately advances the wing / opens shop
          if (state.cleaned >= state.quota) {
            events |= completeWingQuota();
            break;
          }
        }
      }
    }

    return events;
  }

  // R5 & R7: Upgrade costs +50%, no dead index===4 branch
  function buyUpgrade(index) {
    const costs = [
      150 + state.upgrades.speed * 112,
      180 + state.upgrades.radius * 135,
      225 + state.upgrades.time * 150,
      300 + state.upgrades.bucket * 225,
    ];
    const keys = ['speed', 'radius', 'time', 'bucket'];
    const key = keys[index];
    if (!key) return false;

    const cost = costs[index];
    if (state.gold >= cost && state.upgrades[key] < 3) {
      state.gold -= cost;
      state.upgrades[key] += 1;
      sound.buy();
      return true;
    }
    return false;
  }

  reset();
  return { state, reset, step, buyUpgrade, advanceWing };
}
