// Tuning and color constants for THE MAZEJANITOR
export const FIELD = { width: 1280, height: 720, groundY: 620 };
export const STEP = 1 / 60;

export const PLAYER = {
  width: 56,
  height: 64,
  speed: 420,
};

export const TOTAL_WINGS = 5;
export const WING_CONFIGS = [
  { wing: 1, time: 50, quota: 8, itemsCount: 10, bonusGold: 100 },
  { wing: 2, time: 45, quota: 12, itemsCount: 15, bonusGold: 150 },
  { wing: 3, time: 40, quota: 15, itemsCount: 18, bonusGold: 200 },
  { wing: 4, time: 35, quota: 18, itemsCount: 22, bonusGold: 250 },
  { wing: 5, time: 30, quota: 22, itemsCount: 26, bonusGold: 300 },
];

export const PALETTE = {
  backdrop: '#2c1d11',
  sky: '#3d2616',
  ground: '#1d120a',
  player: '#e09f3e',
  slime: '#38b000',
  chest: '#f77f00',
  trap: '#d62828',
  creature: '#4ea8de',
  fire: '#ff5400',
  trash: '#9c6644',
  panel: '#4a3319',
  text: '#fdf0d5',
  muted: '#c6ac8f',
  gold: '#ffb703',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'mazejanitor.best';
