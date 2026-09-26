const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const W = 960;
const H = 540;
const renderScale = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * renderScale;
canvas.height = H * renderScale;
ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
ctx.imageSmoothingEnabled = false;
canvas.tabIndex = 0;
const message = document.querySelector("#message");
const bodyColorInput = document.querySelector("#body-color");
const eyeColorInput = document.querySelector("#eye-color");
const pantsColorInput = document.querySelector("#pants-color");
const shirtColorInput = document.querySelector("#shirt-color");
const hatInput = document.querySelector("#hat-enabled");
const beardInput = document.querySelector("#beard-enabled");
const glassesInput = document.querySelector("#glasses-enabled");
const shop = document.querySelector("#shop");
const betting = document.querySelector("#betting");
const betAmountInput = document.querySelector("#bet-amount");
const restartButton = document.querySelector("#restart");
const loadSaveButton = document.querySelector("#load-save");
const clearSaveButton = document.querySelector("#clear-save");
const mainMenu = document.querySelector("#main-menu");
const gameContent = document.querySelector("#game-content");
const startGameButton = document.querySelector("#start-game");
const startFourthButton = document.querySelector("#start-fourth");
const menuLoadSaveButton = document.querySelector("#menu-load-save");
const menuBodyColorInput = document.querySelector("#menu-body-color");
const menuEyeColorInput = document.querySelector("#menu-eye-color");
const menuPantsColorInput = document.querySelector("#menu-pants-color");
const menuShirtColorInput = document.querySelector("#menu-shirt-color");
const menuHatInput = document.querySelector("#menu-hat-enabled");
const menuBeardInput = document.querySelector("#menu-beard-enabled");
const menuGlassesInput = document.querySelector("#menu-glasses-enabled");
const menuSoundEnabledInput = document.querySelector("#menu-sound-enabled");
const menuVolumeInput = document.querySelector("#menu-volume");
const soundEnabledInput = document.querySelector("#sound-enabled");
const volumeInput = document.querySelector("#volume");
const SAVE_KEY = "pixel-odyssey-2d-save";
const AUDIO_SETTINGS_KEY = "pixel-odyssey-2d-audio";
const FOURTH_UNLOCK_KEY = "pixel-odyssey-2d-fourth-unlocked";
const SHOP_BASE_PRICES = { armor: 45, potion: 30, weapon: 75, bow: 110, staff: 140, power: 55, boots: 65, bomb: 40, compass: 35, core: 50 };
const SHOP_ITEM_NAMES = { armor: "防具", potion: "生命藥水", weapon: "強化武器", bow: "光能弓", staff: "虛空法杖", power: "狂戰藥水", boots: "迅捷靴", bomb: "星塵炸彈", compass: "解謎羅盤", core: "護盾晶核" };
const SECRET_SEQUENCE = "AAWWDDSS";
const THIRD_SEQUENCE = "DDDWWWAAASSSAWDS";
const ARENA_FIFTY_SEQUENCE = "AWDSAWDSAWDS";
const MONEY_SEQUENCE = "AWDSSDWASSDWASSADWSS";
const SECRET_BUFFER_LENGTH = Math.max(SECRET_SEQUENCE.length, THIRD_SEQUENCE.length, ARENA_FIFTY_SEQUENCE.length, MONEY_SEQUENCE.length);
const DIMENSION_COOLDOWN = 5;
const AUTHOR_INTRO_DURATION = 3.5;
const ARENA_TOTAL_WAVES = 50;
const ARENA_ENEMIES_PER_WAVE = 5;
const ELEVATOR_TOTAL_WAVES = 5;
const ELEVATOR_ENEMIES_PER_WAVE = 5;
const audioSettings = { enabled: true, volume: 0.6 };

const keys = new Set();
const projectiles = [];
const particles = [];
const floatingTexts = [];
let audioContext;
let screenShake = 0;
const ambientMotes = Array.from({ length: 44 }, (_, index) => ({
  x: (index * 173 + 41) % W,
  y: 82 + ((index * 97) % 278),
  size: 1 + (index % 3),
  phase: index * 0.73,
}));
const player = {
  x: 150, y: 370, size: 30, speed: 3.2, hp: 3, maxHp: 3, facing: 1, money: 0,
  armor: false, weaponLevel: 1, weaponType: "sword", pantsColor: "#29324d", shirtColor: "#efad62", hat: false, beard: false, glasses: false,
  potions: 0, powerPotions: 0, bombs: 0, compasses: 0, shieldCores: 0, itemPurchases: {},
  action: "idle", actionTimer: 0,
  hurtTimer: 0, potionTimer: 0, walkCycle: 0,
};
const elder = { x: 730, y: 370, size: 36 };
const merchant = { x: 820, y: 370, size: 32 };
const shards = [
  { x: 220, y: 170, collected: false },
  { x: 470, y: 130, collected: false },
  { x: 740, y: 220, collected: false },
];
const dimensionGate = { x: 480, y: 250, unlocked: false };
const ruinCore = { x: 760, y: 250, collected: false };
const ruinRunes = [
  { x: 220, y: 180, glyph: "日", collected: false, nearby: false },
  { x: 420, y: 120, glyph: "月", collected: false, nearby: false },
  { x: 680, y: 180, glyph: "星", collected: false, nearby: false },
];
const RUIN_RUNE_SEQUENCE = [1, 2, 0];
const ruinExit = { x: 900, y: 370, unlocked: false };
const sanctumExit = { x: 900, y: 370, unlocked: false };
const SANCTUM_SIGIL_START = [false, true, false];
const sanctumShards = [
  { x: 240, y: 160, active: SANCTUM_SIGIL_START[0], nearby: false },
  { x: 520, y: 280, active: SANCTUM_SIGIL_START[1], nearby: false },
  { x: 760, y: 150, active: SANCTUM_SIGIL_START[2], nearby: false },
];
// 第二張地圖 Boss：提高耐久與近戰壓力，讓遺跡核心戰更有守門感。
const ruinEnemy = { type: "遺跡守衛", color: "#a86b9b", x: 600, y: 370, size: 42, hp: 10, maxHp: 10, speed: 0.88, range: 108, cooldown: 1.2, damage: 1.5, startX: 600, startY: 370, active: false, attackCooldown: 1.2, attackWindup: 0, stunned: 0, hitFlash: 0 };
// 第三張地圖 Boss：更厚、更快、更痛，作為進入解謎區前的高峰戰鬥。
const sanctumEnemy = { type: "聖堂守護者", color: "#d5b35c", x: 580, y: 370, size: 50, hp: 14, maxHp: 14, speed: 0.82, range: 125, cooldown: 1.1, damage: 2, startX: 580, startY: 370, active: false, attackCooldown: 1.1, attackWindup: 0, stunned: 0, hitFlash: 0 };
const frostExit = { x: 900, y: 370, unlocked: false };
const frostSeals = [
  { x: 210, y: 165, collected: false },
  { x: 485, y: 275, collected: false },
  { x: 745, y: 145, collected: false },
];
const frostEnemies = [
  { type: "霜牙獸", attackType: "leap", color: "#78bfe8", x: 500, y: 370, size: 34, hp: 6, maxHp: 6, speed: 1.15, range: 90, cooldown: 1.45, damage: 1 },
  { type: "寒晶術士", attackType: "ranged", color: "#9ee7ff", x: 690, y: 370, size: 31, hp: 5, maxHp: 5, speed: 0.45, range: 250, cooldown: 1.8, damage: 1 },
].map((enemy) => ({ ...enemy, startX: enemy.x, startY: enemy.y, active: false, attackCooldown: enemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 }));
const voidExit = { x: 900, y: 370, unlocked: false };
const voidBoss = { type: "虛空君王", attackType: "void", color: "#7f55d9", x: 610, y: 370, size: 68, hp: 18, maxHp: 18, speed: 0.62, range: 230, cooldown: 1.6, damage: 1.5, startX: 610, startY: 370, active: false, attackCooldown: 1.6, attackWindup: 0, stunned: 0, hitFlash: 0 };
const extraMaps = [
  { title: "星塵荒原", color: "#8bd7e8", puzzle: "收集三枚星核", nodes: 3,
    enemy: { type: "星塵爬行者", attackType: "dash", color: "#4ca7c4", size: 30, hp: 6, speed: 1.2, range: 90, cooldown: 1.3, damage: 1 },
    boss: { type: "星蝕巨獸", attackType: "shockwave", color: "#6f7be7", size: 58, hp: 16, speed: 0.58, range: 210, cooldown: 2, damage: 1.5 } },
  { title: "齒輪深窟", color: "#d8aa67", puzzle: "依序啟動四座齒輪", nodes: 4,
    enemy: { type: "齒輪侍從", attackType: "melee", color: "#aa7d4f", size: 32, hp: 7, speed: 0.95, range: 92, cooldown: 1.2, damage: 1 },
    boss: { type: "機械心臟", attackType: "smash", color: "#c98247", size: 60, hp: 18, speed: 0.46, range: 130, cooldown: 1.8, damage: 2 } },
  { title: "潮汐墓園", color: "#77c9b8", puzzle: "讓四盞潮燈同時發光", nodes: 4,
    enemy: { type: "潮影", attackType: "ranged", color: "#3d9d9b", size: 29, hp: 7, speed: 0.65, range: 240, cooldown: 1.65, damage: 1 },
    boss: { type: "深潮女王", attackType: "void", color: "#3988b8", size: 58, hp: 20, speed: 0.65, range: 230, cooldown: 1.55, damage: 1.5 } },
  { title: "赤焰高原", color: "#ef8b5e", puzzle: "踩過三個冷卻符文", nodes: 3,
    enemy: { type: "熔火獵犬", attackType: "leap", color: "#d9684e", size: 34, hp: 8, speed: 1.1, range: 100, cooldown: 1.4, damage: 1.5 },
    boss: { type: "赤焰龍王", attackType: "ranged", color: "#de553e", size: 64, hp: 22, speed: 0.55, range: 260, cooldown: 1.35, damage: 2 } },
  { title: "時鐘盡頭", color: "#d7c27b", puzzle: "依序觸碰五枚時輪", nodes: 5,
    enemy: { type: "時隙刺客", attackType: "dash", color: "#9b7ad8", size: 28, hp: 9, speed: 1.35, range: 125, cooldown: 1.05, damage: 1.5 },
    boss: { type: "永恆鐘王", attackType: "dimension", color: "#d1a647", size: 66, hp: 26, speed: 0.7, range: 170, cooldown: 1.3, damage: 2 } },
  { title: "終焉核心", color: "#ff7188", puzzle: "重啟六枚終焉核心", nodes: 6,
    enemy: { type: "終焉獵犬", attackType: "leap", color: "#d94868", size: 38, hp: 12, speed: 1.35, range: 115, cooldown: 1.15, damage: 2 },
    boss: { type: "創世終焉者", attackType: "void", color: "#ff466d", size: 76, hp: 36, speed: 0.78, range: 260, cooldown: 1.15, damage: 2.5 } },
].map((map, mapIndex) => {
  const makeCombatant = (combatant, offset) => ({ ...combatant, x: combatant.attackType === "ranged" ? 700 : 560 + offset, y: 370, maxHp: combatant.hp, startX: combatant.attackType === "ranged" ? 700 : 560 + offset, startY: 370, active: false, attackCooldown: combatant.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 });
  return {
    ...map,
    index: mapIndex + 1,
    enemy: makeCombatant(map.enemy, 0),
    boss: makeCombatant(map.boss, 40),
    puzzleNodes: Array.from({ length: map.nodes }, (_, index) => ({
      x: 170 + (index % 3) * 300,
      y: 145 + Math.floor(index / 3) * 130,
      collected: false,
      nearby: false,
    })),
    exit: { x: 900, y: 370, unlocked: false },
  };
});
const arenaEnemyPool = [
  { type: "競技迅捷者", attackType: "dash", color: "#e57b55", size: 28, hp: 5, speed: 1.4, range: 115, cooldown: 1.1, damage: 1.5 },
  { type: "競技巨岩", attackType: "smash", color: "#9b8bb8", size: 48, hp: 9, speed: 0.62, range: 120, cooldown: 1.8, damage: 2 },
  { type: "競技寒晶術士", attackType: "ranged", color: "#8de3ef", size: 32, hp: 7, speed: 0.6, range: 260, cooldown: 1.5, damage: 1.5 },
  { type: "火紋突擊兵", attackType: "dash", color: "#ed765a", size: 30, hp: 6, speed: 1.42, range: 118, cooldown: 1.2, damage: 1.4 },
  { type: "鋼甲衛士", attackType: "melee", color: "#9aa9b4", size: 40, hp: 11, speed: 0.68, range: 92, cooldown: 1.5, damage: 1.7 },
  { type: "翠影刺客", attackType: "dash", color: "#63bd91", size: 27, hp: 5, speed: 1.55, range: 126, cooldown: 1.16, damage: 1.4 },
  { type: "雷霆術士", attackType: "ranged", color: "#e8ce68", size: 31, hp: 7, speed: 0.62, range: 255, cooldown: 1.56, damage: 1.5 },
  { type: "深海槍兵", attackType: "melee", color: "#5db6b2", size: 35, hp: 8, speed: 0.91, range: 108, cooldown: 1.33, damage: 1.5 },
  { type: "岩脈重錘", attackType: "smash", color: "#ae8663", size: 45, hp: 12, speed: 0.56, range: 132, cooldown: 1.82, damage: 2 },
  { type: "冰霧獵手", attackType: "ranged", color: "#8bcce8", size: 29, hp: 6, speed: 0.7, range: 250, cooldown: 1.68, damage: 1.4 },
  { type: "赤砂跳躍者", attackType: "leap", color: "#d88a5c", size: 33, hp: 7, speed: 1.12, range: 102, cooldown: 1.48, damage: 1.6 },
  { type: "毒藤守衛", attackType: "melee", color: "#79a968", size: 38, hp: 10, speed: 0.76, range: 100, cooldown: 1.42, damage: 1.6 },
  { type: "星屑射手", attackType: "ranged", color: "#c4a9ee", size: 29, hp: 7, speed: 0.65, range: 265, cooldown: 1.62, damage: 1.5 },
  { type: "夜幕追蹤者", attackType: "dash", color: "#806fbe", size: 28, hp: 6, speed: 1.48, range: 125, cooldown: 1.12, damage: 1.5 },
  { type: "玄鐵劍士", attackType: "melee", color: "#84939f", size: 36, hp: 9, speed: 0.9, range: 102, cooldown: 1.3, damage: 1.7 },
  { type: "熔岩裂爪", attackType: "leap", color: "#e26e52", size: 35, hp: 8, speed: 1.14, range: 112, cooldown: 1.44, damage: 1.7 },
  { type: "風暴祭司", attackType: "shockwave", color: "#8ba8df", size: 37, hp: 10, speed: 0.61, range: 225, cooldown: 1.82, damage: 1.3 },
  { type: "暮光舞者", attackType: "dash", color: "#cd85b8", size: 27, hp: 6, speed: 1.58, range: 119, cooldown: 1.18, damage: 1.5 },
  { type: "晶石衛兵", attackType: "smash", color: "#9ac4cd", size: 43, hp: 12, speed: 0.59, range: 127, cooldown: 1.78, damage: 1.9 },
  { type: "虛空預言者", attackType: "void", color: "#a078cf", size: 39, hp: 10, speed: 0.66, range: 245, cooldown: 1.72, damage: 1.3 },
  { type: "狂焰騎士", attackType: "dash", color: "#f17e62", size: 37, hp: 10, speed: 1.26, range: 130, cooldown: 1.24, damage: 1.7 },
  { type: "月銀槍衛", attackType: "melee", color: "#c4c8e6", size: 35, hp: 9, speed: 0.93, range: 112, cooldown: 1.32, damage: 1.6 },
  { type: "霜環使者", attackType: "shockwave", color: "#91dbe8", size: 36, hp: 9, speed: 0.64, range: 230, cooldown: 1.8, damage: 1.3 },
  { type: "破城巨人", attackType: "smash", color: "#a88d83", size: 50, hp: 13, speed: 0.53, range: 138, cooldown: 1.88, damage: 2.1 },
  { type: "流光弓手", attackType: "ranged", color: "#f1c887", size: 29, hp: 7, speed: 0.73, range: 260, cooldown: 1.55, damage: 1.5 },
  { type: "潮汐刺客", attackType: "dash", color: "#58b9c0", size: 28, hp: 7, speed: 1.51, range: 124, cooldown: 1.2, damage: 1.5 },
  { type: "紅蓮法師", attackType: "void", color: "#db6b8b", size: 37, hp: 9, speed: 0.68, range: 240, cooldown: 1.72, damage: 1.4 },
  { type: "黑曜盾兵", attackType: "melee", color: "#666f8c", size: 42, hp: 12, speed: 0.7, range: 96, cooldown: 1.51, damage: 1.8 },
  { type: "幻影獸", attackType: "leap", color: "#aa91d7", size: 33, hp: 8, speed: 1.2, range: 110, cooldown: 1.4, damage: 1.6 },
  { type: "雷光投手", attackType: "ranged", color: "#e7da78", size: 32, hp: 8, speed: 0.69, range: 255, cooldown: 1.58, damage: 1.5 },
  { type: "星界武僧", attackType: "melee", color: "#b994db", size: 34, hp: 10, speed: 1.04, range: 101, cooldown: 1.27, damage: 1.7 },
  { type: "灰燼獵犬", attackType: "leap", color: "#c47966", size: 32, hp: 8, speed: 1.26, range: 108, cooldown: 1.42, damage: 1.6 },
  { type: "深淵刃客", attackType: "dash", color: "#7475b9", size: 30, hp: 8, speed: 1.47, range: 128, cooldown: 1.2, damage: 1.7 },
].map((enemy) => ({ ...enemy, x: 650, y: 370, maxHp: enemy.hp, startX: 650, startY: 370, active: false, attackCooldown: enemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 }));
const arenaBossPool = [
  { type: "競技炎魔", attackType: "smash", color: "#f05c4f", size: 64, hp: 20, speed: 0.72, range: 145, cooldown: 1.5, damage: 2.5 },
  { type: "競技虛空龍", attackType: "void", color: "#d05cff", size: 72, hp: 25, speed: 0.82, range: 270, cooldown: 1.2, damage: 2.5 },
  { type: "競技雷帝", attackType: "shockwave", color: "#e0c96a", size: 66, hp: 28, speed: 0.62, range: 230, cooldown: 1.7, damage: 1.8 },
  { type: "競技霜后", attackType: "ranged", color: "#a5dcf0", size: 62, hp: 30, speed: 0.56, range: 270, cooldown: 1.52, damage: 1.8 },
  { type: "競技石王", attackType: "smash", color: "#a79582", size: 76, hp: 34, speed: 0.52, range: 150, cooldown: 1.67, damage: 2.2 },
  { type: "競技影皇", attackType: "dash", color: "#7564b8", size: 60, hp: 32, speed: 1.12, range: 148, cooldown: 1.22, damage: 1.9 },
  { type: "競技星巫", attackType: "void", color: "#d6a2e9", size: 68, hp: 36, speed: 0.7, range: 255, cooldown: 1.53, damage: 1.7 },
  { type: "競技狂獸", attackType: "leap", color: "#da8063", size: 74, hp: 38, speed: 1.02, range: 134, cooldown: 1.28, damage: 2 },
  { type: "競技時輪主宰", attackType: "dimension", color: "#d2ad62", size: 76, hp: 42, speed: 0.72, range: 178, cooldown: 1.34, damage: 2 },
].map((boss) => ({ ...boss, x: 650, y: 370, maxHp: boss.hp, startX: 650, startY: 370, active: false, attackCooldown: boss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 }));
const arenaFinalBoss = {
  type: "競技場最終 Boss：無盡霸主", attackType: "void", color: "#ffca6e",
  x: 680, y: 370, size: 78, hp: 58, maxHp: 58, speed: 0.78,
  range: 270, cooldown: 1.3, damage: 2.3, startX: 680, startY: 370,
  active: false, attackCooldown: 1.3, attackWindup: 0, stunned: 0, hitFlash: 0,
};
const enemies = [
  { type: "追獵者", attackType: "melee", color: "#b54868", x: 390, y: 370, size: 28, hp: 3, maxHp: 3, speed: 1.05, range: 78, cooldown: 1.5, damage: 1 },
  { type: "迅捷者", attackType: "dash", color: "#d77b45", x: 500, y: 370, size: 23, hp: 2, maxHp: 2, speed: 1.75, range: 65, cooldown: 1.1, damage: 1 },
  // 巨岩是重型壓力敵人：更耐打、更早進入攻擊距離，但重擊仍保留警示時間。
  { type: "巨岩", attackType: "smash", color: "#7e769f", x: 610, y: 370, size: 46, hp: 7, maxHp: 7, speed: 0.58, range: 105, cooldown: 1.9, damage: 2 },
  { type: "跳躍者", attackType: "leap", color: "#5eaf91", x: 280, y: 370, size: 26, hp: 3, maxHp: 3, speed: 0.8, range: 72, cooldown: 1.7, damage: 1 },
  { type: "遠射者", attackType: "ranged", color: "#b6a34d", x: 770, y: 370, size: 25, hp: 2, maxHp: 2, speed: 0.35, range: 220, cooldown: 2.4, damage: 1 },
].map((enemy) => ({ ...enemy, startX: enemy.x, startY: enemy.y, active: false, attackCooldown: enemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 }));
const bosses = [
  { type: "裂地守衛", attackType: "shockwave", color: "#8e5caa", x: 480, y: 370, size: 48, hp: 8, maxHp: 8, speed: 0.55, range: 220, cooldown: 2.4, damage: 1 },
  // 幽影獵手是高機動 Boss：突進更快、更頻繁，逼迫玩家掌握盾反時機。
  { type: "幽影獵手", attackType: "dash", color: "#4e82b8", x: 480, y: 370, size: 40, hp: 10, maxHp: 10, speed: 1.25, range: 145, cooldown: 1.05, damage: 1.5 },
  // 熔岩巨像是後期高壓 Boss：厚血、高傷害，並以更快節奏逼迫玩家走位。
  { type: "熔岩巨像", attackType: "smash", color: "#c05d3d", x: 480, y: 370, size: 62, hp: 14, maxHp: 14, speed: 0.5, range: 130, cooldown: 1.9, damage: 2 },
  { type: "維度之王", attackType: "dimension", color: "#d1a647", x: 480, y: 370, size: 62, hp: 12, maxHp: 12, speed: 0.7, range: 150, cooldown: 1.5, damage: 1 },
].map((boss) => ({ ...boss, startX: boss.x, startY: boss.y, active: false, attackCooldown: boss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 }));
const trueFinalBoss = {
  type: "真・最終 Boss：維度之源", attackType: "void", color: "#f763d8",
  x: 650, y: 370, size: 84, hp: 48, maxHp: 48, speed: 0.82, range: 270,
  cooldown: 1.1, damage: 2, startX: 650, startY: 370, active: false,
  attackCooldown: 1.1, attackWindup: 0, stunned: 0, hitFlash: 0,
};
const authorBoss = {
  type: "真・最終 Boss：作者", attackType: "author", color: "#f4d18d",
  x: elder.x, y: elder.y, size: 76, hp: 64, maxHp: 64, speed: 1,
  range: 330, cooldown: 0.95, damage: 2.1, startX: elder.x, startY: elder.y,
  active: false, attackCooldown: 0.95, attackWindup: 0, stunned: 0, hitFlash: 0,
};
const trueFinalExit = { x: 900, y: 370 };
const arenaContinueGate = { x: 480, y: 370 };
const thirdPlaythroughGate = { x: 480, y: 370 };
const challenger = { x: 230, y: 370 };
const allCombatants = [
  ...enemies, ...bosses, ruinEnemy, sanctumEnemy, ...frostEnemies, voidBoss,
  ...extraMaps.flatMap((map) => [map.enemy, map.boss]), ...arenaEnemyPool, ...arenaBossPool, arenaFinalBoss,
  trueFinalBoss, authorBoss,
];
const baseCombatStats = new Map(allCombatants.map((enemy) => [enemy, {
  maxHp: enemy.maxHp, damage: enemy.damage || 1, speed: enemy.speed, cooldown: enemy.cooldown,
}]));

function setEnemyDifficulty(playthrough) {
  allCombatants.forEach((enemy) => {
    const base = baseCombatStats.get(enemy);
    const healthMultiplier = playthrough === 4 ? 1.65 : playthrough === 3 ? 1.45 : playthrough === 2 ? 1.3 : 1;
    const damageMultiplier = playthrough === 4 ? 1.3 : playthrough === 3 ? 1.18 : playthrough === 2 ? 1.15 : 1;
    const speedMultiplier = playthrough === 4 ? 1.18 : playthrough === 3 ? 1.12 : playthrough === 2 ? 1.08 : 1;
    const cooldownMultiplier = playthrough === 4 ? 0.88 : playthrough === 3 ? 0.92 : playthrough === 2 ? 0.95 : 1;
    enemy.maxHp = Math.ceil(base.maxHp * healthMultiplier);
    enemy.damage = base.damage * damageMultiplier;
    enemy.speed = base.speed * speedMultiplier;
    enemy.cooldown = base.cooldown * cooldownMultiplier;
    enemy.hp = enemy.maxHp;
    enemy.attackCooldown = enemy.cooldown;
  });
}
const state = {
  bodyColor: bodyColorInput.value,
  eyeColor: eyeColorInput.value,
  dimension: "1D",
  hasSword: true,
  hasShield: true,
  elderTalked: false,
  dialog: false,
  tutorialStep: 0,
  attackTimer: 0,
  swordCooldown: 0,
  comboCount: 0,
  comboTimer: 0,
  paused: false,
  powerTimer: 0,
  shieldTimer: 0,
  shieldCooldown: 0,
  modeTimer: 0,
  cooldown: 0,
  gameOver: false,
  defeatedEnemies: 0,
  defeatedBosses: 0,
  bossPhase: false,
  worldReturned: false,
  nextMap: false,
  bossRestTimer: 0,
  shardCount: 0,
  ruinObjectiveComplete: false,
  ruinRuneCount: 0,
  sanctumMap: false,
  sanctumShardCount: 1,
  frostMap: false,
  frostDefeated: 0,
  frostSealCount: 0,
  voidMap: false,
  voidBossDefeated: false,
  extraMap: 0,
  extraEnemyDefeated: false,
  extraPuzzleCount: 0,
  extraExitUnlocked: false,
  trueFinalMap: false,
  trueFinalBossDefeated: false,
  authorRevealed: false,
  authorIntroTimer: 0,
  authorBossDefeated: false,
  screenFlipTimer: 0,
  trueFinalExitEntered: false,
  arenaMode: false,
  arenaRestRoom: false,
  arenaWave: 0,
  arenaBossActive: false,
  arenaKillsThisWave: 0,
  arenaFinalBossDefeated: false,
  arenaBestWave: 0,
  challengerDialogOpen: false,
  cutscenePhase: "", cutsceneTimer: 0,
  elevatorMode: false, elevatorWave: 0, elevatorKills: 0, elevatorHeight: 0,
  playthrough: 1,
  regenTimer: 5,
  lastTime: performance.now(),
  notice: "盾牌可直接按 E 使用；前往老人身邊按 F 開始教學。",
};

function setMessage(text) {
  state.notice = text;
  message.innerHTML = text;
}

function emitParticles(x, y, color, count = 8, speed = 2.4) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = speed * (0.5 + Math.random());
    particles.push({
      x, y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function updateParticles(dt) {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx * 60 * dt;
    particle.y += particle.vy * 60 * dt;
    particle.vy += 0.04 * 60 * dt;
    particle.life -= dt;
    if (particle.life <= 0) particles.splice(index, 1);
  }
}

function emitFloatingText(text, x, y, color = "#f4f0df") {
  floatingTexts.push({ text, x, y, color, life: 0.9, maxLife: 0.9 });
}

function updateFloatingTexts(dt) {
  for (let index = floatingTexts.length - 1; index >= 0; index -= 1) {
    const item = floatingTexts[index];
    item.y -= 24 * dt;
    item.life -= dt;
    if (item.life <= 0) floatingTexts.splice(index, 1);
  }
}

function applyAudioSettings() {
  menuSoundEnabledInput.checked = audioSettings.enabled;
  soundEnabledInput.checked = audioSettings.enabled;
  menuVolumeInput.value = audioSettings.volume;
  volumeInput.value = audioSettings.volume;
}

function saveAudioSettings() {
  audioSettings.enabled = menuSoundEnabledInput.checked;
  audioSettings.volume = Number(menuVolumeInput.value);
  applyAudioSettings();
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
}

function loadAudioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY));
    if (saved && typeof saved === "object") {
      audioSettings.enabled = saved.enabled !== false;
      audioSettings.volume = Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume)) : 0.6;
    }
  } catch (error) {
    // Use default audio settings when browser storage is unavailable.
  }
  applyAudioSettings();
}

setInterval(() => {
  if (!gameContent.hidden && !state.gameOver) saveGame(false);
}, 5000);

function saveGame(announce = true) {
  const arenaCombatant = state.arenaMode && !state.arenaRestRoom
    ? getCombatants().find((combatant) => combatant.active) : null;
  const save = {
    player: { ...player },
    state: {
      bodyColor: state.bodyColor, eyeColor: state.eyeColor, dimension: state.dimension,
      hasSword: state.hasSword, hasShield: state.hasShield, elderTalked: state.elderTalked,
      tutorialStep: state.tutorialStep, defeatedEnemies: state.defeatedEnemies,
      defeatedBosses: state.defeatedBosses, bossPhase: state.bossPhase,
      worldReturned: state.worldReturned, nextMap: state.nextMap,
      bossRestTimer: state.bossRestTimer, shardCount: state.shardCount,
      ruinObjectiveComplete: state.ruinObjectiveComplete,
      ruinRuneCount: state.ruinRuneCount,
      sanctumMap: state.sanctumMap, sanctumShardCount: state.sanctumShardCount,
      frostMap: state.frostMap, frostDefeated: state.frostDefeated,
      frostSealCount: state.frostSealCount, voidMap: state.voidMap,
      voidBossDefeated: state.voidBossDefeated,
      extraMap: state.extraMap, extraEnemyDefeated: state.extraEnemyDefeated,
      extraPuzzleCount: state.extraPuzzleCount, extraExitUnlocked: state.extraExitUnlocked,
      trueFinalMap: state.trueFinalMap, trueFinalBossDefeated: state.trueFinalBossDefeated,
      authorRevealed: state.authorRevealed, authorIntroTimer: state.authorIntroTimer,
      authorBossDefeated: state.authorBossDefeated,
      screenFlipTimer: state.screenFlipTimer,
      trueFinalExitEntered: state.trueFinalExitEntered,
      powerTimer: state.powerTimer, modeTimer: state.modeTimer, cooldown: state.cooldown,
      arenaMode: state.arenaMode, arenaRestRoom: state.arenaRestRoom,
      arenaWave: state.arenaWave, arenaBossActive: state.arenaBossActive,
      arenaKillsThisWave: state.arenaKillsThisWave,
      arenaFinalBossDefeated: state.arenaFinalBossDefeated,
      arenaBestWave: state.arenaBestWave,
      challengerDialogOpen: state.challengerDialogOpen,
      cutscenePhase: state.cutscenePhase, cutsceneTimer: state.cutsceneTimer,
      elevatorMode: state.elevatorMode, elevatorWave: state.elevatorWave,
      elevatorKills: state.elevatorKills, elevatorHeight: state.elevatorHeight,
      playthrough: state.playthrough,
    },
    shards: shards.map((shard) => shard.collected),
    ruinRunes: ruinRunes.map((rune) => rune.collected),
    sanctumSigils: sanctumShards.map((sigil) => sigil.active),
    frostSeals: frostSeals.map((seal) => seal.collected),
    dimensionGateUnlocked: dimensionGate.unlocked,
    ruinCoreCollected: ruinCore.collected,
    enemies: enemies.map((enemy) => ({
      x: enemy.x, y: enemy.y, hp: enemy.hp, active: enemy.active,
      attackCooldown: enemy.attackCooldown, attackWindup: enemy.attackWindup,
      stunned: enemy.stunned,
    })),
    bosses: bosses.map((boss) => ({
      x: boss.x, y: boss.y, hp: boss.hp, active: boss.active,
      attackCooldown: boss.attackCooldown, attackWindup: boss.attackWindup,
      stunned: boss.stunned,
    })),
    ruinEnemy: {
      x: ruinEnemy.x, y: ruinEnemy.y, hp: ruinEnemy.hp, active: ruinEnemy.active,
      attackCooldown: ruinEnemy.attackCooldown, attackWindup: ruinEnemy.attackWindup,
      stunned: ruinEnemy.stunned,
    },
    sanctumEnemy: {
      x: sanctumEnemy.x, y: sanctumEnemy.y, hp: sanctumEnemy.hp, active: sanctumEnemy.active,
      attackCooldown: sanctumEnemy.attackCooldown, attackWindup: sanctumEnemy.attackWindup,
      stunned: sanctumEnemy.stunned,
    },
    frostEnemies: frostEnemies.map((enemy) => ({
      x: enemy.x, y: enemy.y, hp: enemy.hp, active: enemy.active,
      attackCooldown: enemy.attackCooldown, attackWindup: enemy.attackWindup,
      stunned: enemy.stunned,
    })),
    voidBoss: {
      x: voidBoss.x, y: voidBoss.y, hp: voidBoss.hp, active: voidBoss.active,
      attackCooldown: voidBoss.attackCooldown, attackWindup: voidBoss.attackWindup,
      stunned: voidBoss.stunned,
    },
    trueFinalBoss: {
      x: trueFinalBoss.x, y: trueFinalBoss.y, hp: trueFinalBoss.hp, active: trueFinalBoss.active,
      attackCooldown: trueFinalBoss.attackCooldown, attackWindup: trueFinalBoss.attackWindup,
      stunned: trueFinalBoss.stunned,
    },
    authorBoss: {
      x: authorBoss.x, y: authorBoss.y, hp: authorBoss.hp, active: authorBoss.active,
      attackCooldown: authorBoss.attackCooldown, attackWindup: authorBoss.attackWindup,
      stunned: authorBoss.stunned, patternIndex: authorBoss.patternIndex,
      attackPattern: authorBoss.attackPattern, safeLane: authorBoss.safeLane,
      attackTargetX: authorBoss.attackTargetX, attackTargetY: authorBoss.attackTargetY,
    },
    arenaCombatant: arenaCombatant ? {
      x: arenaCombatant.x, y: arenaCombatant.y, hp: arenaCombatant.hp,
      attackCooldown: arenaCombatant.attackCooldown, attackWindup: arenaCombatant.attackWindup,
      stunned: arenaCombatant.stunned,
    } : null,
    extraMaps: extraMaps.map((map) => ({
      enemy: { x: map.enemy.x, y: map.enemy.y, hp: map.enemy.hp, active: map.enemy.active, attackCooldown: map.enemy.attackCooldown },
      boss: { x: map.boss.x, y: map.boss.y, hp: map.boss.hp, active: map.boss.active, attackCooldown: map.boss.attackCooldown },
      nodes: map.puzzleNodes.map((node) => node.collected), exit: map.exit.unlocked,
    })),
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    if (announce) setMessage("進度已儲存。");
  } catch (error) {
    if (announce) setMessage("無法儲存進度，請檢查瀏覽器儲存權限。");
  }
}

function restoreCombatant(target, saved) {
  if (!saved || typeof saved !== "object") return;
  ["x", "y", "hp", "attackCooldown", "attackWindup", "stunned"].forEach((key) => {
    if (Number.isFinite(saved[key])) target[key] = saved[key];
  });
  // 平衡更新後，舊存檔不可讓生命值超過新的上限。
  if (Number.isFinite(target.maxHp)) target.hp = Math.min(target.hp, target.maxHp);
  if (typeof saved.active === "boolean") target.active = saved.active;
}

function loadGame() {
  let rawSave;
  try {
    rawSave = localStorage.getItem(SAVE_KEY);
  } catch (error) {
    setMessage("無法讀取進度，請檢查瀏覽器儲存權限。");
    return;
  }
  if (!rawSave) {
    setMessage("目前沒有存檔。");
    return;
  }
  try {
    const save = JSON.parse(rawSave);
    if (!save || typeof save !== "object" || !save.player || !save.state) {
      throw new Error("Invalid save format");
    }
    const legacyEnding = save.state.worldReturned === true && !("frostMap" in save.state);
    Object.assign(player, save.player);
    player.weaponType = ["sword", "bow", "staff"].includes(player.weaponType) ? player.weaponType : "sword";
    player.itemPurchases = player.itemPurchases && typeof player.itemPurchases === "object" ? player.itemPurchases : {};
    player.pantsColor ||= "#29324d";
    player.shirtColor ||= player.bodyColor || "#efad62";
    player.hat = Boolean(player.hat);
    player.beard = Boolean(player.beard);
    player.glasses = Boolean(player.glasses);
    Object.assign(state, save.state, { gameOver: false, paused: false, secretBuffer: "", dialog: false, attackTimer: 0, swordCooldown: 0, shieldTimer: 0, shieldCooldown: 0, comboCount: 0, comboTimer: 0, lastTime: performance.now() });
    state.playthrough = [1, 2, 3, 4].includes(save.state.playthrough) ? save.state.playthrough : 1;
    setEnemyDifficulty(state.playthrough);
    state.powerTimer = Number.isFinite(save.state.powerTimer) ? Math.max(0, Math.min(8, save.state.powerTimer)) : 0;
    state.modeTimer = Number.isFinite(save.state.modeTimer) ? Math.max(0, Math.min(10, save.state.modeTimer)) : 0;
    state.cooldown = Number.isFinite(save.state.cooldown) ? Math.max(0, Math.min(DIMENSION_COOLDOWN, save.state.cooldown)) : 0;
    state.arenaMode = Boolean(save.state.arenaMode);
    state.arenaRestRoom = state.arenaMode && Boolean(save.state.arenaRestRoom);
    state.arenaWave = state.arenaMode && Number.isFinite(save.state.arenaWave)
      ? Math.max(state.arenaRestRoom ? 0 : 1, Math.min(50, Math.floor(save.state.arenaWave))) : 0;
    state.arenaKillsThisWave = Number.isFinite(save.state.arenaKillsThisWave)
      ? Math.max(0, Math.min(5, Math.floor(save.state.arenaKillsThisWave)))
      : save.state.arenaBossActive ? 5 : 0;
    state.arenaBossActive = state.arenaMode && !state.arenaRestRoom
      && state.arenaWave > 0 && state.arenaWave % 5 === 0
      && state.arenaKillsThisWave === 5 && Boolean(save.state.arenaBossActive);
    state.arenaFinalBossDefeated = Boolean(save.state.arenaFinalBossDefeated);
    state.arenaBestWave = Number.isFinite(save.state.arenaBestWave)
      ? Math.max(0, Math.floor(save.state.arenaBestWave)) : 0;
    state.challengerDialogOpen = state.arenaMode && state.arenaRestRoom
      && Boolean(save.state.challengerDialogOpen);
    state.cutscenePhase = ["author", "push", "stand", "light"].includes(save.state.cutscenePhase)
      ? save.state.cutscenePhase : "";
    state.cutsceneTimer = Number.isFinite(save.state.cutsceneTimer)
      ? Math.max(0, Math.min(4, save.state.cutsceneTimer)) : 0;
    state.elevatorMode = state.arenaMode && Boolean(save.state.elevatorMode);
    state.elevatorWave = state.elevatorMode && Number.isFinite(save.state.elevatorWave)
      ? Math.max(1, Math.min(ELEVATOR_TOTAL_WAVES, Math.floor(save.state.elevatorWave))) : 0;
    state.elevatorKills = state.elevatorMode && Number.isFinite(save.state.elevatorKills)
      ? Math.max(0, Math.min(ELEVATOR_ENEMIES_PER_WAVE - 1, Math.floor(save.state.elevatorKills))) : 0;
    state.elevatorHeight = Number.isFinite(save.state.elevatorHeight)
      ? Math.max(0, save.state.elevatorHeight) : 0;
    if (state.cutscenePhase) state.arenaRestRoom = false;
    Object.assign(player, { action: "idle", actionTimer: 0, hurtTimer: 0, potionTimer: 0, walkCycle: 0 });
    state.hasShield = true;
    state.bodyColor = player.bodyColor || state.bodyColor;
    state.eyeColor = player.eyeColor || state.eyeColor;
    bodyColorInput.value = state.bodyColor;
    eyeColorInput.value = state.eyeColor;
    pantsColorInput.value = player.pantsColor;
    shirtColorInput.value = player.shirtColor;
    hatInput.checked = player.hat;
    beardInput.checked = player.beard;
    glassesInput.checked = player.glasses;
    const savedShards = Array.isArray(save.shards) ? save.shards : [];
    shards.forEach((shard, index) => { shard.collected = Boolean(savedShards[index]); });
    dimensionGate.unlocked = Boolean(save.dimensionGateUnlocked);
    ruinCore.collected = Boolean(save.ruinCoreCollected);
    if (Array.isArray(save.enemies)) {
      enemies.forEach((enemy, index) => restoreCombatant(enemy, save.enemies[index]));
    }
    if (Array.isArray(save.bosses)) {
      bosses.forEach((boss, index) => restoreCombatant(boss, save.bosses[index]));
    }
    restoreCombatant(ruinEnemy, save.ruinEnemy);
    restoreCombatant(sanctumEnemy, save.sanctumEnemy);
    if (Array.isArray(save.frostEnemies)) {
      frostEnemies.forEach((enemy, index) => restoreCombatant(enemy, save.frostEnemies[index]));
    }
    restoreCombatant(voidBoss, save.voidBoss);
    restoreCombatant(trueFinalBoss, save.trueFinalBoss);
    restoreCombatant(authorBoss, save.authorBoss);
    authorBoss.patternIndex = Number.isFinite(save.authorBoss?.patternIndex) ? Math.max(0, save.authorBoss.patternIndex) : 0;
    authorBoss.attackPattern = ["fan", "lanes", "ring", "flip"].includes(save.authorBoss?.attackPattern) ? save.authorBoss.attackPattern : "fan";
    authorBoss.safeLane = Number.isInteger(save.authorBoss?.safeLane) ? Math.max(0, Math.min(5, save.authorBoss.safeLane)) : 0;
    authorBoss.attackTargetX = Number.isFinite(save.authorBoss?.attackTargetX) ? save.authorBoss.attackTargetX : player.x;
    authorBoss.attackTargetY = Number.isFinite(save.authorBoss?.attackTargetY) ? save.authorBoss.attackTargetY : player.y;
    state.ruinRuneCount = Number.isFinite(save.state.ruinRuneCount) ? save.state.ruinRuneCount : 0;
    const savedRunes = Array.isArray(save.ruinRunes) ? save.ruinRunes : [];
    ruinRunes.forEach((rune, index) => {
      rune.collected = savedRunes.length > 0
        ? Boolean(savedRunes[index])
        : RUIN_RUNE_SEQUENCE.slice(0, state.ruinRuneCount).includes(index);
      rune.nearby = false;
    });
    state.ruinRuneCount = ruinRunes.filter((rune) => rune.collected).length;
    ruinExit.unlocked = state.ruinRuneCount === ruinRunes.length;
    state.sanctumMap = Boolean(save.state.sanctumMap);
    const savedSigils = Array.isArray(save.sanctumSigils) ? save.sanctumSigils : null;
    sanctumShards.forEach((sigil, index) => {
      sigil.active = savedSigils
        ? Boolean(savedSigils[index])
        : save.state.sanctumShardCount === sanctumShards.length || SANCTUM_SIGIL_START[index];
      sigil.nearby = false;
    });
    state.sanctumShardCount = sanctumShards.filter((sigil) => sigil.active).length;
    sanctumExit.unlocked = state.sanctumShardCount === sanctumShards.length;
    state.frostMap = Boolean(save.state.frostMap || legacyEnding);
    if (legacyEnding) {
      state.worldReturned = false;
      player.x = 120;
      player.y = 370;
    }
    state.frostDefeated = Number.isFinite(save.state.frostDefeated) ? save.state.frostDefeated : 0;
    const savedFrostSeals = Array.isArray(save.frostSeals) ? save.frostSeals : [];
    frostSeals.forEach((seal, index) => { seal.collected = Boolean(savedFrostSeals[index]); });
    state.frostSealCount = frostSeals.filter((seal) => seal.collected).length;
    frostExit.unlocked = state.frostDefeated >= frostEnemies.length && state.frostSealCount === frostSeals.length;
    state.voidMap = Boolean(save.state.voidMap);
    state.voidBossDefeated = Boolean(save.state.voidBossDefeated || voidBoss.hp <= 0);
    voidExit.unlocked = state.voidBossDefeated;
    state.extraMap = Number.isFinite(save.state.extraMap) ? Math.max(0, Math.min(extraMaps.length, save.state.extraMap)) : 0;
    state.extraEnemyDefeated = Boolean(save.state.extraEnemyDefeated);
    state.extraPuzzleCount = Number.isFinite(save.state.extraPuzzleCount) ? save.state.extraPuzzleCount : 0;
    state.extraExitUnlocked = Boolean(save.state.extraExitUnlocked);
    state.trueFinalBossDefeated = state.playthrough >= 2 && Boolean(save.state.trueFinalBossDefeated);
    state.trueFinalMap = state.playthrough >= 2 && Boolean(save.state.trueFinalMap);
    state.authorRevealed = state.playthrough >= 2 && Boolean(save.state.authorRevealed);
    state.authorBossDefeated = state.playthrough >= 2 && Boolean(save.state.authorBossDefeated);
    state.authorIntroTimer = state.authorRevealed && !state.authorBossDefeated && Number.isFinite(save.state.authorIntroTimer)
      ? Math.max(0, Math.min(AUTHOR_INTRO_DURATION, save.state.authorIntroTimer)) : 0;
    state.screenFlipTimer = state.authorRevealed && !state.authorBossDefeated && Number.isFinite(save.state.screenFlipTimer)
      ? Math.max(0, Math.min(4, save.state.screenFlipTimer)) : 0;
    state.trueFinalExitEntered = state.playthrough >= 2 && Boolean(save.state.trueFinalExitEntered);
    if (state.playthrough >= 2 && state.worldReturned && (!state.trueFinalExitEntered || !state.authorBossDefeated)) {
      // Older saves could end the second playthrough before the author encounter existed.
      state.worldReturned = false;
      state.trueFinalMap = true;
      state.trueFinalExitEntered = false;
      state.extraMap = 0;
      state.arenaMode = false;
      state.arenaRestRoom = false;
      state.arenaWave = 0;
      state.arenaBossActive = false;
      state.dimension = "1D";
      state.modeTimer = 0;
      state.cooldown = 0;
      trueFinalBoss.hp = state.trueFinalBossDefeated ? 0 : trueFinalBoss.maxHp;
      state.authorRevealed = false;
      state.authorIntroTimer = 0;
      state.authorBossDefeated = false;
      state.screenFlipTimer = 0;
      authorBoss.hp = authorBoss.maxHp;
      player.x = state.trueFinalBossDefeated ? 800 : 120;
      player.y = 370;
    }
    if (state.trueFinalMap) {
      state.arenaMode = false;
      state.arenaRestRoom = false;
      state.worldReturned = false;
      if (trueFinalBoss.hp <= 0) state.trueFinalBossDefeated = true;
      if (state.authorRevealed) state.trueFinalBossDefeated = true;
      if (state.authorRevealed && authorBoss.hp <= 0) state.authorBossDefeated = true;
      if (state.authorBossDefeated) {
        state.authorIntroTimer = 0;
        state.screenFlipTimer = 0;
      }
    }
    extraMaps.forEach((map) => { map.puzzleNodes.forEach((node, index) => { node.collected = index < state.extraPuzzleCount; node.nearby = false; }); map.exit.unlocked = false; map.enemy.active = false; map.boss.active = false; });
    if (Array.isArray(save.extraMaps)) save.extraMaps.forEach((savedMap, index) => {
      const map = extraMaps[index];
      if (!map || !savedMap) return;
      restoreCombatant(map.enemy, savedMap.enemy);
      restoreCombatant(map.boss, savedMap.boss);
      if (Array.isArray(savedMap.nodes)) map.puzzleNodes.forEach((node, nodeIndex) => { node.collected = Boolean(savedMap.nodes[nodeIndex]); });
      map.exit.unlocked = Boolean(savedMap.exit);
    });
    if (state.extraMap > 0) {
      const current = extraMaps[state.extraMap - 1];
      current.enemy.active = !state.extraEnemyDefeated && current.enemy.hp > 0;
      current.boss.active = state.extraEnemyDefeated && current.boss.hp > 0;
      current.exit.unlocked = state.extraExitUnlocked;
    }
    arenaEnemyPool.forEach((enemy) => { enemy.active = false; });
    arenaBossPool.forEach((boss) => { boss.active = false; });
    arenaFinalBoss.active = false;
    if (state.arenaMode && !state.arenaRestRoom && !state.cutscenePhase) {
      const combatant = state.elevatorMode ? getElevatorCombatant() : getArenaWaveCombatant();
      configureArenaCombatant(combatant, state.elevatorMode ? 45 + state.elevatorWave : state.arenaWave);
      combatant.hp = combatant.maxHp;
      restoreCombatant(combatant, save.arenaCombatant);
      combatant.active = true;
    }
    projectiles.length = 0;
    enemies.forEach((enemy) => { enemy.active = false; });
    bosses.forEach((boss) => { boss.active = false; });
    ruinEnemy.active = Boolean(state.nextMap && !state.ruinObjectiveComplete && ruinEnemy.hp > 0);
    sanctumEnemy.active = Boolean(state.sanctumMap && sanctumEnemy.hp > 0);
    frostEnemies.forEach((enemy, index) => {
      enemy.active = Boolean(state.frostMap && index === state.frostDefeated && enemy.hp > 0);
    });
    voidBoss.active = Boolean(state.voidMap && !state.voidBossDefeated && voidBoss.hp > 0);
    trueFinalBoss.active = Boolean(state.trueFinalMap && !state.authorRevealed && trueFinalBoss.hp > 0);
    authorBoss.active = Boolean(state.trueFinalMap && state.authorRevealed && authorBoss.hp > 0);
    if (state.trueFinalMap) {
      state.extraMap = 0;
      sanctumEnemy.active = false;
      ruinEnemy.active = false;
      frostEnemies.forEach((enemy) => { enemy.active = false; });
      voidBoss.active = false;
      enemies.forEach((enemy) => { enemy.active = false; });
      bosses.forEach((boss) => { boss.active = false; });
    } else if (state.extraMap > 0) {
      state.dimension = state.extraEnemyDefeated ? "2D" : "1D";
      sanctumEnemy.active = false;
      ruinEnemy.active = false;
      frostEnemies.forEach((enemy) => { enemy.active = false; });
      voidBoss.active = false;
      enemies.forEach((enemy) => { enemy.active = false; });
      bosses.forEach((boss) => { boss.active = false; });
    } else if (state.frostMap || state.voidMap || state.worldReturned) {
      sanctumEnemy.active = false;
      ruinEnemy.active = false;
      enemies.forEach((enemy) => { enemy.active = false; });
      bosses.forEach((boss) => { boss.active = false; });
    } else if (state.sanctumMap) {
      ruinEnemy.active = false;
      enemies.forEach((enemy) => { enemy.active = false; });
      bosses.forEach((boss) => { boss.active = false; });
    } else if (state.nextMap) {
      enemies.forEach((enemy) => { enemy.active = false; });
      bosses.forEach((boss) => { boss.active = false; });
    } else if (state.bossPhase && state.bossRestTimer <= 0 && bosses[state.defeatedBosses]) {
      bosses[state.defeatedBosses].active = true;
    } else if (!state.nextMap && !state.bossPhase && state.hasShield && enemies[state.defeatedEnemies]) {
      enemies[state.defeatedEnemies].active = true;
    }
    shop.hidden = true;
    betting.hidden = true;
    restartButton.textContent = state.elevatorMode ? "重新挑戰電梯（X）"
      : state.arenaMode ? "返回正常世界（X）" : "重新開始（X）";
    restartButton.disabled = Boolean(state.cutscenePhase);
    const savedDate = save.savedAt ? new Date(save.savedAt) : null;
    const savedLabel = savedDate && !Number.isNaN(savedDate.getTime())
      ? savedDate.toLocaleString()
      : "未知時間";
    if (state.playthrough === 1 && state.worldReturned && state.voidBossDefeated && !legacyEnding) {
      startSecondPlaythrough();
      setMessage("已讀取第一周目通關存檔，二周目已開始。裝備、道具與金錢已保留。");
      return true;
    }
    if (state.playthrough === 3 && state.arenaMode && state.arenaRestRoom
      && state.arenaFinalBossDefeated && !state.cutscenePhase && !state.elevatorMode) {
      beginArenaFinale();
      return true;
    }
    setMessage(`已讀取進度（${savedLabel}）。`);
    return true;
  } catch (error) {
    setMessage("存檔損壞，無法讀取。");
    return false;
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(FOURTH_UNLOCK_KEY);
    refreshFourthMenu();
    setMessage("存檔已清除。");
  } catch (error) {
    setMessage("無法清除存檔，請檢查瀏覽器儲存權限。");
  }
}

function resetGame() {
  setEnemyDifficulty(1);
  Object.assign(player, { x: 150, y: 370, hp: 3, maxHp: 3, facing: 1, money: 0, armor: false, weaponLevel: 1, weaponType: "sword", pantsColor: "#29324d", shirtColor: "#efad62", hat: false, beard: false, glasses: false, potions: 0, powerPotions: 0, bombs: 0, compasses: 0, shieldCores: 0, itemPurchases: {}, speed: 3.2, action: "idle", actionTimer: 0, hurtTimer: 0, potionTimer: 0, walkCycle: 0 });
  Object.assign(state, {
    dimension: "1D", hasSword: true, hasShield: true, elderTalked: false, dialog: false,
    tutorialStep: 0, attackTimer: 0, swordCooldown: 0, shieldTimer: 0, shieldCooldown: 0, comboCount: 0, comboTimer: 0, powerTimer: 0, modeTimer: 0, cooldown: 0,
    gameOver: false, paused: false, defeatedEnemies: 0, defeatedBosses: 0, bossPhase: false,
    worldReturned: false, nextMap: false, shardCount: 0, bossRestTimer: 0,
    extraMap: 0, extraEnemyDefeated: false, extraPuzzleCount: 0, extraExitUnlocked: false,
    trueFinalMap: false, trueFinalBossDefeated: false, authorRevealed: false, authorIntroTimer: 0,
    authorBossDefeated: false, screenFlipTimer: 0, trueFinalExitEntered: false,
    arenaMode: false, arenaRestRoom: false, arenaWave: 0, arenaBossActive: false,
    arenaKillsThisWave: 0, arenaFinalBossDefeated: false,
    arenaBestWave: 0, challengerDialogOpen: false, playthrough: 1, secretBuffer: "",
    cutscenePhase: "", cutsceneTimer: 0,
    elevatorMode: false, elevatorWave: 0, elevatorKills: 0, elevatorHeight: 0,
    regenTimer: 5, lastTime: performance.now(),
    ruinObjectiveComplete: false,
    ruinRuneCount: 0,
    sanctumMap: false, sanctumShardCount: 1,
    frostMap: false, frostDefeated: 0, frostSealCount: 0,
    voidMap: false, voidBossDefeated: false,
  });
  screenShake = 0;
  shards.forEach((shard) => { shard.collected = false; });
  dimensionGate.unlocked = false;
  enemies.forEach((enemy, index) => {
    enemy.active = index === 0 ? false : false;
    enemy.x = enemy.startX;
    enemy.y = enemy.startY;
    enemy.hp = enemy.maxHp;
    enemy.attackCooldown = enemy.cooldown;
    enemy.attackWindup = 0;
    enemy.stunned = 0;
    enemy.hitFlash = 0;
  });
  bosses.forEach((boss) => {
    boss.active = false;
    boss.x = boss.startX;
    boss.y = boss.startY;
    boss.hp = boss.maxHp;
    boss.attackCooldown = boss.cooldown;
    boss.attackWindup = 0;
    boss.stunned = 0;
    boss.hitFlash = 0;
  });
  Object.assign(ruinEnemy, {
    x: ruinEnemy.startX, y: ruinEnemy.startY, hp: ruinEnemy.maxHp, active: false,
    attackCooldown: ruinEnemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
  });
  ruinCore.collected = false;
  ruinRunes.forEach((rune) => { rune.collected = false; rune.nearby = false; });
  ruinExit.unlocked = false;
  sanctumExit.unlocked = false;
  sanctumShards.forEach((sigil, index) => {
    sigil.active = SANCTUM_SIGIL_START[index];
    sigil.nearby = false;
  });
  Object.assign(sanctumEnemy, {
    x: sanctumEnemy.startX, y: sanctumEnemy.startY, hp: sanctumEnemy.maxHp, active: false,
    attackCooldown: sanctumEnemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
  });
  frostSeals.forEach((seal) => { seal.collected = false; });
  frostExit.unlocked = false;
  frostEnemies.forEach((enemy) => {
    Object.assign(enemy, {
      x: enemy.startX, y: enemy.startY, hp: enemy.maxHp, active: false,
      attackCooldown: enemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
    });
  });
  Object.assign(voidBoss, {
    x: voidBoss.startX, y: voidBoss.startY, hp: voidBoss.maxHp, active: false,
    attackCooldown: voidBoss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
  });
  Object.assign(trueFinalBoss, {
    x: trueFinalBoss.startX, y: trueFinalBoss.startY, hp: trueFinalBoss.maxHp, active: false,
    attackCooldown: trueFinalBoss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
  });
  Object.assign(authorBoss, {
    x: authorBoss.startX, y: authorBoss.startY, hp: authorBoss.maxHp, active: false,
    attackCooldown: authorBoss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
    patternIndex: 0, attackPattern: "fan", safeLane: 0,
  });
  extraMaps.forEach((map) => {
    Object.assign(map.enemy, { x: map.enemy.startX, y: map.enemy.startY, hp: map.enemy.maxHp, active: false, attackCooldown: map.enemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 });
    Object.assign(map.boss, { x: map.boss.startX, y: map.boss.startY, hp: map.boss.maxHp, active: false, attackCooldown: map.boss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 });
    map.puzzleNodes.forEach((node) => { node.collected = false; node.nearby = false; });
    map.exit.unlocked = false;
  });
  [...arenaEnemyPool, ...arenaBossPool].forEach((combatant) => {
    Object.assign(combatant, { x: combatant.startX, y: combatant.startY, hp: combatant.maxHp, active: false, attackCooldown: combatant.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 });
  });
  Object.assign(arenaFinalBoss, {
    x: arenaFinalBoss.startX, y: arenaFinalBoss.startY, hp: arenaFinalBoss.maxHp,
    active: false, attackCooldown: arenaFinalBoss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
  });
  keys.clear();
  pantsColorInput.value = player.pantsColor;
  shirtColorInput.value = player.shirtColor;
  hatInput.checked = player.hat;
  beardInput.checked = player.beard;
  glassesInput.checked = player.glasses;
  projectiles.length = 0;
  particles.length = 0;
  floatingTexts.length = 0;
  shop.hidden = true;
  betting.hidden = true;
  restartButton.textContent = "重新開始（X）";
  restartButton.disabled = false;
  setMessage("遊戲已重新開始。盾牌可直接按 E 使用；前往老人身邊按 F 開始教學。");
}

function showGame() {
  mainMenu.hidden = true;
  gameContent.hidden = false;
  canvas.focus();
}

function startNewGame() {
  playSound(520, 0.1, "triangle");
  bodyColorInput.value = menuBodyColorInput.value;
  eyeColorInput.value = menuEyeColorInput.value;
  state.bodyColor = bodyColorInput.value;
  state.eyeColor = eyeColorInput.value;
  resetGame();
  player.pantsColor = menuPantsColorInput.value;
  player.shirtColor = menuShirtColorInput.value;
  player.hat = menuHatInput.checked;
  player.beard = menuBeardInput.checked;
  player.glasses = menuGlassesInput.checked;
  bodyColorInput.value = state.bodyColor;
  eyeColorInput.value = state.eyeColor;
  pantsColorInput.value = player.pantsColor;
  shirtColorInput.value = player.shirtColor;
  hatInput.checked = player.hat;
  beardInput.checked = player.beard;
  glassesInput.checked = player.glasses;
  showGame();
}

function refreshFourthMenu(forceUnlocked = false) {
  let unlocked = forceUnlocked;
  try { unlocked ||= localStorage.getItem(FOURTH_UNLOCK_KEY) === "1"; } catch (error) { /* Keep the current session state. */ }
  startFourthButton.hidden = !unlocked;
  mainMenu.dataset.playthrough = unlocked ? "4" : "1";
}

function enterFourthPlaythrough() {
  let savedFourth = false;
  try { savedFourth = JSON.parse(localStorage.getItem(SAVE_KEY))?.state?.playthrough === 4; } catch (error) { /* A fresh fourth run is still possible. */ }
  if (savedFourth) {
    showGame();
    if (loadGame()) return;
  }
  startPlaythrough(4);
}

function playSound(frequency, duration = 0.08, type = "square") {
  if (!audioSettings.enabled || audioSettings.volume <= 0) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.06 * audioSettings.volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function distanceToElder() {
  return Math.hypot(player.x - elder.x, player.y - elder.y);
}

function distanceToMerchant() {
  return Math.hypot(player.x - merchant.x, player.y - merchant.y);
}

function toggleShop() {
  if (distanceToMerchant() > 90) {
    setMessage("商人離你太遠了。");
    return;
  }
  updateShopPrices();
  shop.hidden = !shop.hidden;
  setMessage(shop.hidden ? "你關閉了商店。" : "商店已開啟，選擇你想購買的物品。");
}

function toggleBetting() {
  if (distanceToMerchant() > 90) {
    setMessage("商人離你太遠了。");
    return;
  }
  betting.hidden = !betting.hidden;
  setMessage(betting.hidden ? "你離開了賭桌。" : `賭桌已開啟，你目前有 ${player.money} 金。`);
}

function itemPrice(item) {
  const purchased = Math.max(0, Number(player.itemPurchases?.[item]) || 0);
  return Math.ceil(SHOP_BASE_PRICES[item] * (1.25 ** purchased));
}

function updateShopPrices() {
  shop.querySelectorAll("[data-item]").forEach((button) => {
    const item = button.dataset.item;
    if (SHOP_BASE_PRICES[item] !== undefined) button.textContent = `${SHOP_ITEM_NAMES[item]}（${itemPrice(item)} 金）`;
  });
}

function placeBet(guess) {
  const amount = Math.floor(Number(betAmountInput.value));
  if (!Number.isFinite(amount) || amount < 1) {
    setMessage("下注金額必須至少是 1 金。");
    return;
  }
  if (player.money < amount) {
    setMessage(`下注失敗：你只有 ${player.money} 金。`);
    return;
  }
  player.money -= amount;
  const result = Math.random() < 0.5 ? "正面" : "反面";
  if (guess === result) {
    player.money += amount * 2;
    setMessage(`硬幣是${result}！你贏得 ${amount} 金。`);
  } else {
    setMessage(`硬幣是${result}，你輸掉 ${amount} 金。`);
  }
}

function buyItem(item) {
  if (SHOP_BASE_PRICES[item] === undefined) return;
  const price = itemPrice(item);
  if (player.money < price) {
    setMessage(`${SHOP_ITEM_NAMES[item]}需要 ${price} 金，你目前只有 ${player.money} 金。`);
    return;
  }
  player.money -= price;
  player.itemPurchases[item] = (Number(player.itemPurchases[item]) || 0) + 1;
  updateShopPrices();
  if (item === "armor") {
    player.armor = true;
    setMessage("你買下防具，受到的傷害會降低。");
  } else if (item === "potion") {
    player.potions += 1;
    setMessage("你買下生命藥水，按 R 使用。");
  } else if (item === "power") {
    player.powerPotions += 1;
    setMessage("你買下狂戰藥水，按 T 使用，8 秒內劍傷害加倍。");
  } else if (item === "boots") {
    player.speed = Math.min(5.2, player.speed + 0.45);
    setMessage("你穿上迅捷靴，移動速度提升！");
  } else if (item === "bomb") {
    player.bombs += 1;
    setMessage("你買下星塵炸彈，按 Q 對附近敵人造成傷害。");
  } else if (item === "compass") {
    player.compasses += 1;
    setMessage("你買下解謎羅盤，按 Z 查看下一個解謎目標。");
  } else if (item === "core") {
    player.shieldCores += 1;
    setMessage("你買下護盾晶核，按 B 展開 1 秒強化護盾。");
  } else if (item === "bow") {
    player.weaponType = "bow";
    player.weaponLevel = Math.max(player.weaponLevel, 2);
    setMessage("你裝備了光能弓，滑鼠左鍵可發射遠程箭矢！");
  } else if (item === "staff") {
    player.weaponType = "staff";
    player.weaponLevel = Math.max(player.weaponLevel, 3);
    setMessage("你裝備了虛空法杖，滑鼠左鍵可施放魔彈！");
  } else {
    player.weaponLevel += 1;
    setMessage("武器強化成功，劍的傷害提升！");
  }
}

function switchDimension() {
  if (state.gameOver || (state.worldReturned && !state.arenaMode) || state.dialog || state.paused) return;
  if (state.cutscenePhase || state.elevatorMode) {
    if (state.elevatorMode) setMessage("電梯內無法切換維度。");
    return;
  }
  if (state.trueFinalMap && state.authorRevealed && !state.authorBossDefeated) {
    setMessage("作者封鎖了維度切換！在 2D 場地中閃避彈幕。");
    return;
  }
  if (state.modeTimer > 0) {
    setMessage("你已經在 2D 維度中。");
    return;
  }
  if (state.cooldown > 0) {
    setMessage(`維度切換冷卻中，還需 ${Math.ceil(state.cooldown)} 秒。`);
    return;
  }
  state.dimension = "2D";
  state.modeTimer = 10;
  state.cooldown = 0;
  setMessage("已進入 2D 維度！探索時間剩餘 10 秒。");
}

function enterDimensionGate() {
  if (!state.hasShield) {
    setMessage("先向老人取得盾牌，才能進入第二張地圖。");
    return;
  }
  if (state.defeatedBosses < bosses.length) {
    setMessage(`先擊敗第一張地圖的 4 個小 Boss（目前 ${state.defeatedBosses} / ${bosses.length}）。`);
    return;
  }
  if (state.dimension !== "2D" || !dimensionGate.unlocked || Math.hypot(player.x - dimensionGate.x, player.y - dimensionGate.y) > 85) {
    setMessage(dimensionGate.unlocked ? "靠近中央維度門後按 F。" : "維度門仍然鎖定，先收集所有維度碎片。");
    return;
  }
  state.nextMap = true;
  state.dimension = "1D";
  state.modeTimer = 0;
  state.cooldown = 0;
  state.bossPhase = false;
  projectiles.length = 0;
  enemies.forEach((enemy) => { enemy.active = false; });
  bosses.forEach((boss) => { boss.active = false; });
  ruinEnemy.active = true;
  player.x = 120;
  player.y = 370;
  setMessage("你穿過維度門，抵達第二張地圖：寂靜遺跡。");
}

function collectShards() {
  if (state.dimension !== "2D" || state.nextMap || state.sanctumMap || state.frostMap || state.voidMap) return;
  shards.forEach((shard) => {
    if (!shard.collected && Math.hypot(player.x - shard.x, player.y - shard.y) < 32) {
      shard.collected = true;
      state.shardCount += 1;
      playSound(620, 0.1, "sine");
      setMessage(`取得維度碎片 ${state.shardCount} / ${shards.length}。`);
    }

  });
  if (state.shardCount === shards.length && !dimensionGate.unlocked) {
    dimensionGate.unlocked = true;
    setMessage("三枚維度碎片共鳴，中央維度門已解鎖！");
  }
}

function collectRuinRunes() {
  if (!state.nextMap || !state.ruinObjectiveComplete || ruinExit.unlocked) return;
  ruinRunes.forEach((rune, index) => {
    const isNearby = Math.hypot(player.x - rune.x, player.y - rune.y) < 32;
    if (isNearby && !rune.nearby && !rune.collected) {
      const expectedIndex = RUIN_RUNE_SEQUENCE[state.ruinRuneCount];
      if (index === expectedIndex) {
        rune.collected = true;
        state.ruinRuneCount += 1;
        playSound(700 + state.ruinRuneCount * 80, 0.12, "sine");
        setMessage(`符文「${rune.glyph}」亮起（${state.ruinRuneCount} / ${ruinRunes.length}）。`);
      } else {
        ruinRunes.forEach((item) => { item.collected = false; });
        state.ruinRuneCount = 0;
        playSound(120, 0.18, "sawtooth");
        setMessage("符文順序錯誤，光芒熄滅了。提示：月 → 星 → 日。");
      }
    }
    rune.nearby = isNearby;
  });
  voidExit.unlocked = false;
  if (state.ruinRuneCount === ruinRunes.length && !ruinExit.unlocked) {
    ruinExit.unlocked = true;
    setMessage("月、星、日依序共鳴，遺跡出口已解鎖！");
  }
}

function collectSanctumShards() {
  if (!state.sanctumMap || sanctumEnemy.hp > 0 || sanctumExit.unlocked) return;
  sanctumShards.forEach((sigil, index) => {
    const isNearby = Math.hypot(player.x - sigil.x, player.y - sigil.y) < 34;
    if (isNearby && !sigil.nearby) {
      [index - 1, index, index + 1].forEach((targetIndex) => {
        const target = sanctumShards[targetIndex];
        if (target) target.active = !target.active;
      });
      state.sanctumShardCount = sanctumShards.filter((item) => item.active).length;
      playSound(520 + state.sanctumShardCount * 90, 0.14, "triangle");
      setMessage(`連動印記發生變化，目前點亮 ${state.sanctumShardCount} / ${sanctumShards.length}。`);
    }
    sigil.nearby = isNearby;
  });
  if (state.sanctumShardCount === sanctumShards.length && !sanctumExit.unlocked) {
    sanctumExit.unlocked = true;
    setMessage("三枚連動印記全部點亮，核心聖堂出口已解鎖！");
  }
}

function collectFrostSeals() {
  if (!state.frostMap || state.frostDefeated < frostEnemies.length || state.dimension !== "2D") return;
  frostSeals.forEach((seal) => {
    if (!seal.collected && Math.hypot(player.x - seal.x, player.y - seal.y) < 34) {
      seal.collected = true;
      state.frostSealCount += 1;
      emitParticles(seal.x, seal.y, "#9ee7ff", 18, 2.8);
      playSound(680 + state.frostSealCount * 70, 0.13, "sine");
      setMessage(`取得寒霜印記 ${state.frostSealCount} / ${frostSeals.length}。`);
    }
  });
  if (state.frostSealCount === frostSeals.length && !frostExit.unlocked) {
    frostExit.unlocked = true;
    setMessage("三枚寒霜印記融入門扉，通往虛空王座的道路已開啟！");
  }
}

function currentExtraMap() {
  return state.extraMap > 0 ? extraMaps[state.extraMap - 1] : null;
}

function collectExtraPuzzle() {
  const map = currentExtraMap();
  if (!map || map.boss.hp > 0 || state.extraExitUnlocked || state.dimension !== "2D") return;
  map.puzzleNodes.forEach((node, index) => {
    const nearby = Math.hypot(player.x - node.x, player.y - node.y) < 38;
    if (nearby && !node.nearby && !node.collected) {
      const expected = state.extraPuzzleCount;
      if (index === expected) {
        node.collected = true;
        state.extraPuzzleCount += 1;
        emitParticles(node.x, node.y, map.color, 16, 2.8);
        playSound(500 + state.extraPuzzleCount * 70, 0.12, "sine");
        setMessage(`${map.puzzle}（${state.extraPuzzleCount} / ${map.nodes}）`);
      } else {
        map.puzzleNodes.forEach((item) => { item.collected = false; item.nearby = false; });
        state.extraPuzzleCount = 0;
        playSound(120, 0.18, "sawtooth");
        setMessage("順序錯誤，解謎重新開始。請依照場景中的光點順序前進。");
      }
    }
    node.nearby = nearby;
  });
  if (state.extraPuzzleCount === map.nodes) {
    state.extraExitUnlocked = true;
    map.exit.unlocked = true;
    setMessage(`${map.title}解謎完成，出口已解鎖！`);
  }
}

function enterExtraMap(index) {
  const map = extraMaps[index - 1];
  if (!map) return;
  state.extraMap = index;
  state.extraEnemyDefeated = false;
  state.extraPuzzleCount = 0;
  state.extraExitUnlocked = false;
  state.dimension = "1D";
  state.modeTimer = 0;
  state.cooldown = 0;
  projectiles.length = 0;
  extraMaps.forEach((item) => { item.enemy.active = false; item.boss.active = false; });
  map.enemy.x = map.enemy.startX; map.enemy.y = map.enemy.startY; map.enemy.hp = map.enemy.maxHp;
  map.enemy.attackCooldown = map.enemy.cooldown; map.enemy.active = true;
  map.boss.x = map.boss.startX; map.boss.y = map.boss.startY; map.boss.hp = map.boss.maxHp;
  map.boss.attackCooldown = map.boss.cooldown;
  map.puzzleNodes.forEach((node) => { node.collected = false; node.nearby = false; });
  map.exit.unlocked = false;
  player.x = 120;
  player.y = 370;
  setMessage(`抵達第${index + 5}張地圖：${map.title}。${map.enemy.type} 出現了！`);
}

function enterTrueFinalMap() {
  state.extraMap = 0;
  state.trueFinalMap = true;
  state.trueFinalBossDefeated = false;
  state.authorRevealed = false;
  state.authorIntroTimer = 0;
  state.authorBossDefeated = false;
  state.screenFlipTimer = 0;
  state.trueFinalExitEntered = false;
  state.worldReturned = false;
  state.dimension = "1D";
  state.modeTimer = 0;
  state.cooldown = 0;
  projectiles.length = 0;
  extraMaps.forEach((map) => { map.enemy.active = false; map.boss.active = false; });
  Object.assign(trueFinalBoss, {
    x: trueFinalBoss.startX, y: trueFinalBoss.startY, hp: trueFinalBoss.maxHp,
    attackCooldown: trueFinalBoss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
    active: true,
  });
  authorBoss.active = false;
  player.x = 120;
  player.y = 370;
  player.hp = player.maxHp;
  setMessage("抵達真・最終地圖「維度核心」！擊敗維度之源，解鎖回歸之門，才能回到正常世界。");
}

function revealAuthorBoss() {
  state.authorRevealed = true;
  state.authorIntroTimer = AUTHOR_INTRO_DURATION;
  state.screenFlipTimer = 0;
  state.dimension = "2D";
  state.modeTimer = 0;
  state.cooldown = 0;
  projectiles.length = 0;
  shop.hidden = true;
  betting.hidden = true;
  player.x = 120;
  player.y = 370;
  player.hp = player.maxHp;
  Object.assign(authorBoss, {
    x: authorBoss.startX, y: authorBoss.startY, hp: authorBoss.maxHp,
    attackCooldown: authorBoss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
    patternIndex: 0, attackPattern: "fan", safeLane: 0, active: true,
  });
  setMessage("老人：「我是作者，你只是個工具人。回歸之門由我鎖上！」真・最終 Boss「作者」現身！");
}

function returnDoorUnlocked() {
  return state.trueFinalBossDefeated && (!state.authorRevealed || state.authorBossDefeated);
}

function enterArenaMode() {
  state.arenaMode = true;
  state.arenaRestRoom = true;
  state.arenaWave = 0;
  state.arenaBossActive = false;
  state.arenaKillsThisWave = 0;
  state.arenaFinalBossDefeated = false;
  state.challengerDialogOpen = false;
  state.cutscenePhase = "";
  state.elevatorMode = false;
  state.paused = false;
  state.dimension = "1D";
  state.modeTimer = 0;
  state.cooldown = 0;
  restartButton.textContent = "返回正常世界（X）";
  restartButton.disabled = false;
  enterArenaRestRoom();
}

function exitArenaMode() {
  state.arenaMode = false;
  state.arenaRestRoom = false;
  state.arenaWave = 0;
  state.arenaBossActive = false;
  state.arenaKillsThisWave = 0;
  state.challengerDialogOpen = false;
  state.cutscenePhase = "";
  state.elevatorMode = false;
  state.gameOver = false;
  state.paused = false;
  state.dimension = "1D";
  state.modeTimer = 0;
  state.cooldown = 0;
  projectiles.length = 0;
  keys.clear();
  arenaEnemyPool.forEach((enemy) => { enemy.active = false; });
  arenaBossPool.forEach((boss) => { boss.active = false; });
  arenaFinalBoss.active = false;
  player.hp = player.maxHp;
  restartButton.textContent = "重新開始（X）";
  setMessage("已離開競技場，回到正常世界。");
  saveGame(false);
}

function enterArenaRestRoom() {
  state.arenaRestRoom = true;
  state.challengerDialogOpen = false;
  state.dimension = "1D";
  state.modeTimer = 0;
  state.cooldown = 0;
  projectiles.length = 0;
  shop.hidden = true;
  betting.hidden = true;
  arenaEnemyPool.forEach((enemy) => { enemy.active = false; });
  arenaBossPool.forEach((boss) => { boss.active = false; });
  arenaFinalBoss.active = false;
  player.x = 150;
  player.y = 370;
  player.hp = player.maxHp;
  setMessage(state.arenaFinalBossDefeated
    ? "第 50 波最終 Boss 已擊敗！與挑戰者交談，或從中央門返回正常世界。"
    : state.playthrough === 2 && state.authorBossDefeated
    ? "已抵達競技場休息室！左側可與挑戰者交談，右側商人可補給，中央門進入三周目。"
    : `已抵達競技場${state.arenaWave === 0 ? "起始" : ""}休息室！可與挑戰者交談、找商人補給，或從中央門繼續挑戰。`);
  saveGame(false);
}

function restartArenaAfterDeath() {
  if (state.elevatorMode) {
    restartElevatorAfterDeath();
    return;
  }
  state.gameOver = false;
  state.arenaWave = 0;
  state.arenaBossActive = false;
  state.arenaKillsThisWave = 0;
  state.arenaFinalBossDefeated = false;
  state.paused = false;
  state.attackTimer = 0;
  state.shieldTimer = 0;
  player.hurtTimer = 0;
  player.actionTimer = 0;
  player.action = "idle";
  keys.clear();
  enterArenaRestRoom();
  setMessage("挑戰失敗，已回到起始休息室。裝備、金錢與最高波次已保留；與挑戰者交談或從中央門重新挑戰。");
}

function getChallengerDialogue() {
  if (state.arenaBestWave >= 50) return "挑戰者：你做到了。從看不起你到能和你並肩，我很慶幸我們成了朋友。";
  if (state.arenaBestWave >= 30) return "挑戰者：還有最後一段路。這次我會站在你這邊，一直等你回來。";
  if (state.arenaBestWave >= 15) return "挑戰者：你已經是我最信任的夥伴了。下一場，我們一起面對。";
  if (state.arenaBestWave >= 10) return "挑戰者：我以前看錯你了。要是你願意，我想和你做朋友。";
  if (state.arenaBestWave >= 5) return "挑戰者：你真的擊敗了 Boss……下次我可以和你一起練習嗎？";
  if (state.arenaBestWave >= 2) return "挑戰者：你比我想的能打。別誤會，我只是想看看你能走多遠。";
  return "挑戰者：就憑你也想闖競技場？別拖累我。";
}

function arenaWaveMaxHp(combatant, wave) {
  const base = baseCombatStats.get(combatant).maxHp;
  const multiplier = state.playthrough === 4 ? 1.65 : state.playthrough === 3 ? 1.45 : state.playthrough === 2 ? 1.3 : 1;
  return Math.ceil(base * multiplier) + Math.floor((wave - 1) / 10);
}

function getArenaWaveCombatant() {
  if (state.arenaBossActive) {
    return state.arenaWave === ARENA_TOTAL_WAVES
      ? arenaFinalBoss : arenaBossPool[(state.arenaWave / 5 - 1) % arenaBossPool.length];
  }
  return arenaEnemyPool[(state.arenaWave + state.arenaKillsThisWave - 1) % arenaEnemyPool.length];
}

function configureArenaCombatant(combatant, wave) {
  const base = baseCombatStats.get(combatant);
  const stage = Math.floor((wave - 1) / 10);
  const strength = state.playthrough === 4 ? 1.3 : state.playthrough === 3 ? 1.18 : state.playthrough === 2 ? 1.15 : 1;
  const speed = state.playthrough === 4 ? 1.18 : state.playthrough === 3 ? 1.12 : state.playthrough === 2 ? 1.08 : 1;
  const cooldown = state.playthrough === 4 ? 0.88 : state.playthrough === 3 ? 0.92 : state.playthrough === 2 ? 0.95 : 1;
  combatant.maxHp = arenaWaveMaxHp(combatant, wave);
  combatant.damage = Math.min(2.9, base.damage * strength + stage * 0.12);
  combatant.speed = base.speed * speed * (1 + stage * 0.04);
  combatant.cooldown = base.cooldown * cooldown * Math.max(0.82, 1 - stage * 0.04);
}

function spawnArenaCombatant() {
  const combatant = getArenaWaveCombatant();
  [...arenaEnemyPool, ...arenaBossPool, arenaFinalBoss].forEach((item) => { item.active = false; });
  configureArenaCombatant(combatant, state.arenaWave);
  Object.assign(combatant, {
    x: combatant.startX, y: combatant.startY, hp: combatant.maxHp,
    attackCooldown: combatant.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0, active: true,
  });
  return combatant;
}

function spawnNextArenaWave() {
  if (state.arenaWave >= ARENA_TOTAL_WAVES) return;
  state.arenaRestRoom = false;
  state.arenaWave += 1;
  state.arenaBossActive = false;
  state.arenaKillsThisWave = 0;
  state.challengerDialogOpen = false;
  projectiles.length = 0;
  shop.hidden = true;
  betting.hidden = true;
  const combatant = spawnArenaCombatant();
  player.x = 120;
  player.y = 370;
  player.hp = Math.min(player.maxHp, player.hp + 0.5);
  setMessage(`競技場第 ${state.arenaWave} / ${ARENA_TOTAL_WAVES} 波：擊敗 5 名敵人。第 1 名 ${combatant.type} 出現！`);
}

function advanceArenaAfterDefeat() {
  if (state.elevatorMode) {
    advanceElevatorAfterDefeat();
    return;
  }
  projectiles.length = 0;
  player.money += state.arenaBossActive ? 35 : 12;
  if (state.arenaBossActive) {
    state.arenaBestWave = Math.max(state.arenaBestWave, state.arenaWave);
    if (state.arenaWave === ARENA_TOTAL_WAVES) {
      beginArenaFinale();
      return;
    }
    enterArenaRestRoom();
    return;
  }
  state.arenaKillsThisWave += 1;
  if (state.arenaKillsThisWave < ARENA_ENEMIES_PER_WAVE) {
    const next = spawnArenaCombatant();
    setMessage(`第 ${state.arenaWave} / ${ARENA_TOTAL_WAVES} 波：${state.arenaKillsThisWave} / ${ARENA_ENEMIES_PER_WAVE} 名敵人已擊敗，${next.type} 出現！`);
  } else if (state.arenaWave % 5 === 0) {
    state.arenaBossActive = true;
    const boss = spawnArenaCombatant();
    setMessage(`第 ${state.arenaWave} / ${ARENA_TOTAL_WAVES} 波的 5 名敵人已擊敗！${boss.type} 現身！`);
  } else {
    state.arenaBestWave = Math.max(state.arenaBestWave, state.arenaWave);
    spawnNextArenaWave();
  }
}

function beginArenaFinale() {
  state.arenaFinalBossDefeated = true;
  state.arenaRestRoom = false;
  state.arenaBossActive = false;
  state.cutscenePhase = "author";
  state.cutsceneTimer = 3.4;
  projectiles.length = 0;
  arenaFinalBoss.active = false;
  keys.clear();
  restartButton.disabled = true;
  setMessage("作者再次現身：「你以為你能殺死我？」");
  saveGame(false);
}

function updateArenaFinale(dt) {
  state.cutsceneTimer = Math.max(0, state.cutsceneTimer - dt);
  if (state.cutsceneTimer > 0) return;
  if (state.cutscenePhase === "author") {
    state.cutscenePhase = "push";
    state.cutsceneTimer = 3;
    setMessage("挑戰者衝了出來，把你推進電梯！");
  } else if (state.cutscenePhase === "push") {
    state.cutscenePhase = "stand";
    state.cutsceneTimer = 2.8;
    setMessage("挑戰者：「你先走。這次換我獨自面對作者。」");
  } else if (state.cutscenePhase === "stand") {
    startElevator();
  } else if (state.cutscenePhase === "light") {
    finishElevator();
  }
  saveGame(false);
}

function getElevatorCombatant() {
  return arenaEnemyPool[(state.elevatorWave + state.elevatorKills - 1) % arenaEnemyPool.length];
}

function spawnElevatorCombatant() {
  arenaEnemyPool.forEach((enemy) => { enemy.active = false; });
  const combatant = getElevatorCombatant();
  configureArenaCombatant(combatant, 45 + state.elevatorWave);
  Object.assign(combatant, {
    x: combatant.startX, y: combatant.startY, hp: combatant.maxHp,
    attackCooldown: combatant.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0, active: true,
  });
  return combatant;
}

function startElevator() {
  state.cutscenePhase = "";
  state.cutsceneTimer = 0;
  state.elevatorMode = true;
  state.elevatorWave = 1;
  state.elevatorKills = 0;
  state.elevatorHeight = 0;
  state.dimension = "1D";
  state.modeTimer = 0;
  state.cooldown = 0;
  player.x = 240;
  player.y = 370;
  player.hp = player.maxHp;
  projectiles.length = 0;
  shop.hidden = true;
  betting.hidden = true;
  restartButton.disabled = false;
  restartButton.textContent = "重新挑戰電梯（X）";
  spawnElevatorCombatant();
  setMessage("電梯正在上升！第 1 / 5 波：擊敗 5 名敵人。");
  saveGame(false);
}

function advanceElevatorAfterDefeat() {
  projectiles.length = 0;
  player.money += 12;
  state.elevatorKills += 1;
  if (state.elevatorKills < ELEVATOR_ENEMIES_PER_WAVE) {
    const enemy = spawnElevatorCombatant();
    setMessage(`電梯第 ${state.elevatorWave} / ${ELEVATOR_TOTAL_WAVES} 波：${state.elevatorKills} / ${ELEVATOR_ENEMIES_PER_WAVE} 名已擊敗，${enemy.type} 出現！`);
  } else if (state.elevatorWave < ELEVATOR_TOTAL_WAVES) {
    state.elevatorWave += 1;
    state.elevatorKills = 0;
    player.hp = Math.min(player.maxHp, player.hp + 0.5);
    spawnElevatorCombatant();
    setMessage(`電梯繼續上升！第 ${state.elevatorWave} / ${ELEVATOR_TOTAL_WAVES} 波開始。`);
    saveGame(false);
  } else {
    state.elevatorMode = false;
    state.cutscenePhase = "light";
    state.cutsceneTimer = 3.5;
    arenaEnemyPool.forEach((enemy) => { enemy.active = false; });
    player.x = W / 2;
    keys.clear();
    restartButton.disabled = true;
    setMessage("第五波完成！電梯頂端打開，一道光照向主角……");
    saveGame(false);
  }
}

function restartElevatorAfterDeath() {
  state.gameOver = false;
  state.paused = false;
  state.attackTimer = 0;
  state.shieldTimer = 0;
  player.hurtTimer = 0;
  keys.clear();
  startElevator();
  setMessage("電梯挑戰失敗，從第 1 波重新開始。");
}

function finishElevator() {
  state.cutscenePhase = "";
  state.elevatorMode = false;
  startPlaythrough(4);
  try { localStorage.setItem(FOURTH_UNLOCK_KEY, "1"); } catch (error) { /* The current session still unlocks. */ }
  refreshFourthMenu(true);
  gameContent.hidden = true;
  mainMenu.hidden = false;
  keys.clear();
  setMessage("電梯抵達頂端。四周目已解鎖，從主選單進入。");
}

function startPlaythrough(playthrough) {
  const carriedPlayer = { ...player, itemPurchases: { ...player.itemPurchases } };
  resetGame();
  setEnemyDifficulty(playthrough);
  Object.assign(player, carriedPlayer, { x: 150, y: 370, hp: carriedPlayer.maxHp, action: "idle", actionTimer: 0, hurtTimer: 0, potionTimer: 0, walkCycle: 0 });
  state.playthrough = playthrough;
  pantsColorInput.value = player.pantsColor;
  shirtColorInput.value = player.shirtColor;
  hatInput.checked = player.hat;
  beardInput.checked = player.beard;
  glassesInput.checked = player.glasses;
  showGame();
  setMessage(playthrough === 4
    ? "四周目開始！挑戰者留在競技場面對作者，你再次踏入重置後的世界。"
    : `${playthrough === 3 ? "三" : "二"}周目開始！敵人與 Boss 變強了。先去找老人，他會告訴你前往維度核心的真正目標。`);
  saveGame(false);
}

function startSecondPlaythrough() { startPlaythrough(2); }
function startThirdPlaythrough() {
  setEnemyDifficulty(3);
  state.playthrough = 3;
  enterArenaMode();
  setMessage("三周目競技場開始！敵人與 Boss 再次變強，每擊敗 5 波即可進入休息室。");
  saveGame(false);
}

function jumpToThirdPlaythroughGate() {
  if (state.playthrough !== 2 || !state.authorBossDefeated || !state.worldReturned) {
    startSecondPlaythrough();
    state.trueFinalBossDefeated = true;
    state.authorRevealed = true;
    state.authorBossDefeated = true;
    state.trueFinalExitEntered = true;
    state.worldReturned = true;
  }
  if (!state.arenaMode) enterArenaMode();
  state.arenaWave = 0;
  state.arenaBossActive = false;
  state.arenaKillsThisWave = 0;
  state.arenaFinalBossDefeated = false;
  enterArenaRestRoom();
  state.gameOver = false;
  player.hp = player.maxHp;
  player.x = thirdPlaythroughGate.x - 40;
  player.y = thirdPlaythroughGate.y;
  setMessage("密技成功！已抵達競技場休息室中央的三周目之門，按 F 進入三周目。");
  saveGame(false);
}

function jumpToArenaWave50() {
  if (state.playthrough !== 3 || !state.arenaMode) {
    jumpToThirdPlaythroughGate();
    startThirdPlaythrough();
  } else {
    enterArenaMode();
  }
  state.arenaWave = ARENA_TOTAL_WAVES - 1;
  spawnNextArenaWave();
  player.hp = player.maxHp;
  setMessage("密技成功！已到競技場第 50 波。先擊敗 5 名敵人，再挑戰最終 Boss。");
  saveGame(false);
}

function getElderLessons() {
  if (state.playthrough === 4) return [
    "",
    "挑戰者留在競技場，獨自擋住了作者。",
    "電梯把你送回重置後的世界；這是第四次旅程。",
    "敵人比以前更強。先集結力量，再穿越十一張地圖。",
    "前往維度核心，尋找作者與挑戰者的下落。",
  ];
  return state.playthrough >= 2 ? [
    "",
    "這次世界仍不穩定，真正的出口藏在維度核心。",
    "穿越十一張地圖，前往真・最終地圖「維度核心」。",
    "真・最終 Boss「維度之源」守在那裡，敵人也比上次更強。",
    "擊敗維度之源後穿過回歸之門，才能回到正常世界。出發吧！",
  ] : [
    "",
    "先學會這個世界的規則吧。",
    "A / D 可以左右移動，滑鼠左鍵可以使用劍。",
    "按 E 舉盾 0.3 秒，擋下攻擊會反震並暈眩敵人。",
    "按 C 進入 2D 維度，使用 W / A / S / D 探索。",
  ];
}

function interact() {
  if (gameContent.hidden || state.gameOver || state.paused) return;
  if (state.arenaMode) {
    if (state.cutscenePhase) return;
    if (state.challengerDialogOpen) {
      state.challengerDialogOpen = false;
      setMessage("對話結束。從中央門繼續挑戰。");
    } else if (state.elevatorMode) {
      setMessage(`電梯正在上升：第 ${state.elevatorWave} / ${ELEVATOR_TOTAL_WAVES} 波，擊敗 5 名敵人。`);
    } else if (state.arenaRestRoom && Math.hypot(player.x - challenger.x, player.y - challenger.y) < 85) {
      state.challengerDialogOpen = true;
      setMessage("挑戰者正在和你說話，按 F 關閉對話框。");
    } else if (state.arenaRestRoom && distanceToMerchant() < 90) {
      toggleShop();
    } else if (state.arenaRestRoom && state.arenaFinalBossDefeated
      && Math.hypot(player.x - arenaContinueGate.x, player.y - arenaContinueGate.y) < 85) {
      exitArenaMode();
    } else if (state.arenaRestRoom && state.playthrough === 2 && state.authorBossDefeated
      && Math.hypot(player.x - thirdPlaythroughGate.x, player.y - thirdPlaythroughGate.y) < 85) {
      startThirdPlaythrough();
    } else if (state.arenaRestRoom && !(state.playthrough === 2 && state.authorBossDefeated)
      && Math.hypot(player.x - arenaContinueGate.x, player.y - arenaContinueGate.y) < 85) {
      spawnNextArenaWave();
    } else if (state.arenaRestRoom) {
      setMessage(state.arenaFinalBossDefeated
        ? "挑戰已完成。與挑戰者交談，或前往中央門按 F 返回正常世界。"
        : state.playthrough === 2 && state.authorBossDefeated
        ? "與左側挑戰者對話，或前往中央三周目之門按 F。"
        : "與左側挑戰者對話，或前往中央門按 F 開始挑戰。");
    } else {
      setMessage("擊敗每第 5 波的 Boss 後即可進入休息室。");
    }
    return;
  }
  if (state.worldReturned && !state.arenaMode) {
    if (state.playthrough === 1) startSecondPlaythrough();
    else enterArenaMode();
    return;
  }
  if (state.trueFinalMap) {
    if (!state.trueFinalBossDefeated) {
      setMessage("先擊敗維度核心的真・最終 Boss「維度之源」，解鎖回歸之門。");
    } else if (Math.hypot(player.x - trueFinalExit.x, player.y - trueFinalExit.y) < 85) {
      if (!state.authorRevealed) {
        revealAuthorBoss();
      } else if (!state.authorBossDefeated) {
        setMessage("作者鎖住了回歸之門。先躲開彈幕並擊敗他！");
      } else {
        state.trueFinalMap = false;
        state.trueFinalExitEntered = true;
        state.worldReturned = true;
        state.authorIntroTimer = 0;
        projectiles.length = 0;
        keys.clear();
        setMessage("你擊敗了作者並穿過回歸之門，終於回到正常世界！");
      }
    } else {
      setMessage(returnDoorUnlocked()
        ? "回歸之門已開啟，靠近門後按 F。"
        : "作者鎖住了回歸之門，先擊敗他！");
    }
    return;
  }
  const extra = currentExtraMap();
  if (extra) {
    if (extra.exit.unlocked && Math.hypot(player.x - extra.exit.x, player.y - extra.exit.y) < 85) {
      if (state.extraMap < extraMaps.length) {
        enterExtraMap(state.extraMap + 1);
      } else if (state.playthrough >= 2) {
        enterTrueFinalMap();
      } else {
        startSecondPlaythrough();
      }
    } else if (!extra.exit.unlocked) {
      setMessage(extra.boss.hp > 0 ? `先擊敗${state.extraEnemyDefeated ? extra.boss.type : extra.enemy.type}。` : `${extra.title}出口鎖定中，${extra.puzzle}。`);
    } else {
      setMessage("靠近新地圖出口後按 F。");
    }
    return;
  }
  if (state.voidMap) {
    if (voidExit.unlocked && Math.hypot(player.x - voidExit.x, player.y - voidExit.y) < 85) {
      state.voidMap = false;
      projectiles.length = 0;
      voidBoss.active = false;
      enterExtraMap(1);
    } else if (!voidExit.unlocked) {
      setMessage("最終出口被虛空封印，先擊敗虛空君王。");
    } else {
      setMessage("靠近最終出口後按 F。");
    }
    return;
  }
  if (state.frostMap) {
    if (frostExit.unlocked && Math.hypot(player.x - frostExit.x, player.y - frostExit.y) < 85) {
      state.frostMap = false;
      state.voidMap = true;
      state.dimension = "1D";
      state.modeTimer = 0;
      state.cooldown = 0;
      projectiles.length = 0;
      frostEnemies.forEach((enemy) => { enemy.active = false; });
      state.voidBossDefeated = false;
      voidExit.unlocked = false;
      Object.assign(voidBoss, {
        x: voidBoss.startX, y: voidBoss.startY, hp: voidBoss.maxHp,
        attackCooldown: voidBoss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
      });
      voidBoss.active = true;
      player.x = 120;
      player.y = 370;
      setMessage("你越過冰封門扉，抵達第五張地圖：虛空王座。虛空君王甦醒了！");
    } else if (!frostExit.unlocked) {
      setMessage(state.frostDefeated < frostEnemies.length
        ? "冰封出口鎖定中，先擊敗裂谷中的敵人。"
        : "冰封出口鎖定中，進入 2D 維度收集三枚寒霜印記。");
    } else {
      setMessage("靠近冰封出口後按 F。");
    }
    return;
  }
  if (state.sanctumMap) {
    if (sanctumExit.unlocked && Math.hypot(player.x - sanctumExit.x, player.y - sanctumExit.y) < 85) {
      state.sanctumMap = false;
      state.frostMap = true;
      state.dimension = "1D";
      state.modeTimer = 0;
      state.cooldown = 0;
      projectiles.length = 0;
      sanctumEnemy.active = false;
      state.frostDefeated = 0;
      state.frostSealCount = 0;
      frostExit.unlocked = false;
      frostSeals.forEach((seal) => { seal.collected = false; });
      frostEnemies.forEach((enemy, index) => {
        enemy.x = enemy.startX;
        enemy.y = enemy.startY;
        enemy.hp = enemy.maxHp;
        enemy.attackCooldown = enemy.cooldown;
        enemy.attackWindup = 0;
        enemy.stunned = 0;
        enemy.active = index === 0;
      });
      player.x = 120;
      player.y = 370;
      setMessage("你離開核心聖堂，抵達第四張地圖：冰封裂谷。霜牙獸出現了！");
    } else if (!sanctumExit.unlocked) {
      setMessage(sanctumEnemy.hp > 0
        ? "核心聖堂出口鎖定中，先擊敗聖堂守護者。"
        : "核心聖堂出口鎖定中，踩踏連動印記並將三枚全部點亮。");
    } else {
      setMessage("靠近核心聖堂出口後按 F。");
    }
    return;
  }
  if (state.nextMap) {
    if (ruinExit.unlocked && Math.hypot(player.x - ruinExit.x, player.y - ruinExit.y) < 85) {
      state.nextMap = false;
      state.sanctumMap = true;
      state.dimension = "1D";
      projectiles.length = 0;
      ruinEnemy.active = false;
      sanctumEnemy.active = true;
      sanctumShards.forEach((sigil, index) => {
        sigil.active = SANCTUM_SIGIL_START[index];
        sigil.nearby = false;
      });
      state.sanctumShardCount = sanctumShards.filter((sigil) => sigil.active).length;
      sanctumExit.unlocked = false;
      player.x = 120;
      player.y = 370;
      setMessage("你穿過遺跡出口，抵達第三張地圖：核心聖堂。");
    } else if (!ruinExit.unlocked) {
      setMessage(state.ruinObjectiveComplete
        ? "遺跡出口鎖定中，依照月 → 星 → 日的順序點亮符文。"
        : "遺跡出口鎖定中，先擊敗守衛並取得核心。");
    } else {
      setMessage("靠近遺跡出口後按 F。");
    }
    return;
  }
  if (state.dimension === "2D" && Math.hypot(player.x - dimensionGate.x, player.y - dimensionGate.y) < 85) {
    enterDimensionGate();
    return;
  }
  if (distanceToElder() > 90) {
    setMessage("老人離你太遠了。");
    return;
  }
  if (!state.elderTalked) {
    state.dialog = true;
    state.elderTalked = true;
    state.tutorialStep = 1;
    setMessage(`老人：${getElderLessons()[1]}按 F 繼續。`);
    return;
  }
  if (state.dialog && state.tutorialStep < 4) {
    state.tutorialStep += 1;
    setMessage(`老人：${getElderLessons()[state.tutorialStep]}${state.tutorialStep < 4 ? "按 F 繼續。" : ""}`);
    if (state.tutorialStep === 4) {
      state.hasShield = true;
      enemies[0].active = true;
      state.dialog = false;
      setMessage(state.playthrough >= 2
        ? "老人：擊敗維度之源並穿過回歸之門。第一個強化敵人出現了！"
        : "你取得盾牌，劍也仍然保留。第一個敵人出現了！");
    }
    return;
  }
  if (!state.hasShield) {
    state.hasShield = true;
    enemies[0].active = true;
    state.dialog = false;
    setMessage("你取得盾牌，劍也仍然保留。第一個敵人出現了！");
  } else {
    setMessage(state.playthrough >= 2
      ? "老人：前往維度核心，擊敗維度之源後穿過回歸之門，才能回到正常世界。"
      : "老人：熟練切換維度，才能找回正常世界。");
  }
}

function attackOrParry() {
  if (state.gameOver || state.cutscenePhase || (state.worldReturned && !state.arenaMode) || state.paused) return;
  if (isShieldActive()) {
    state.comboCount = 0;
    state.comboTimer = 0;
    const target = getCombatants().find((enemy) =>
      enemy.active && enemy.attackWindup > 0 && distanceToEnemy(enemy) < 115 && shieldFacesEnemy(enemy)
    );
    if (target) {
      repelEnemy(target, "盾反");
    } else {
      setMessage("盾反姿態！請在敵人亮起警示時按左鍵。");
    }
    return;
  }
  if (!state.hasSword) {
    setMessage("你沒有武器，先向老人換取盾牌。");
    return;
  }
  if (state.swordCooldown > 0) {
    setMessage(`劍還需要 ${state.swordCooldown.toFixed(1)} 秒才能再次使用。`);
    return;
  }
  state.swordCooldown = 1;
  state.attackTimer = player.weaponType === "sword" ? 0.22 : 0.16;
  player.action = "attack";
  player.actionTimer = 0.3;
  playSound(420, 0.06);
  if (player.weaponType !== "sword") {
    const target = getCombatants().filter((enemy) => enemy.active && enemy.hp > 0)
      .sort((a, b) => distanceToEnemy(a) - distanceToEnemy(b))[0];
    const targetDx = target ? target.x - player.x : player.facing;
    const targetDy = target && state.dimension === "2D" ? target.y - player.y : 0;
    const aimLength = Math.hypot(targetDx, targetDy) || 1;
    const projectileSpeed = player.weaponType === "staff" ? 5.8 : 6.8;
    projectiles.push({
      owner: "player",
      x: player.x + (targetDx / aimLength) * 20,
      y: player.y,
      vx: (targetDx / aimLength) * projectileSpeed,
      vy: (targetDy / aimLength) * projectileSpeed,
      damage: player.weaponLevel * (player.weaponType === "staff" ? 1.5 : 1.2) * (state.powerTimer > 0 ? 2 : 1),
      color: player.weaponType === "staff" ? "#b58cff" : "#d8fff8",
      radius: player.weaponType === "staff" ? 10 : 6,
    });
    setMessage(player.weaponType === "staff" ? "虛空法杖發射魔彈！" : "光能弓射出能量箭！");
    return;
  }
  const target = getCombatants().find((enemy) =>
    enemy.active && enemy.hp > 0 && distanceToEnemy(enemy) < 88 && attackFacesEnemy(enemy)
  );
  if (target) {
    state.comboCount = state.comboTimer > 0 ? Math.min(4, state.comboCount + 1) : 1;
    state.comboTimer = 1.15;
    const comboMultiplier = 1 + (state.comboCount - 1) * 0.25;
    const damage = player.weaponLevel * comboMultiplier * (state.powerTimer > 0 ? 2 : 1);
    damageEnemy(target, damage);
    target.hitFlash = 0.16;
    screenShake = 0.08;
    emitFloatingText(`${state.comboCount} 連擊`, player.x, player.y - 34, "#f4d18d");
    setMessage(target.hp > 0 ? `${target.type} 被劍擊中！` : `${target.type} 被擊敗了！`);
    if (target.hp === 0) {
      setMessage(`${target.type} 被擊敗！獲得 10 金。`);
    }
  }
}

function damageEnemy(enemy, amount) {
  const wasAlive = enemy.hp > 0;
  enemy.hp = Math.max(0, enemy.hp - amount);
  emitParticles(enemy.x, enemy.y, enemy.hp > 0 ? "#f4f0df" : "#ffd166", enemy.hp > 0 ? 7 : 18, enemy.hp > 0 ? 2 : 3.4);
  emitFloatingText(`-${amount}`, enemy.x, enemy.y - enemy.size / 2, enemy.hp > 0 ? "#f4f0df" : "#ffd166");
  if (wasAlive && enemy.hp === 0) player.money += 10;
}

function distanceToEnemy(enemy) {
  return Math.hypot(player.x - enemy.x, player.y - enemy.y);
}

function getCombatants() {
  if (state.arenaMode) return state.cutscenePhase || state.arenaRestRoom ? [] : state.elevatorMode
    ? arenaEnemyPool : state.arenaBossActive
    ? state.arenaWave === ARENA_TOTAL_WAVES ? [arenaFinalBoss] : arenaBossPool
    : arenaEnemyPool;
  if (state.trueFinalMap) return [state.authorRevealed ? authorBoss : trueFinalBoss];
  const extra = currentExtraMap();
  if (extra) return [extra.enemy, extra.boss];
  if (state.voidMap) return [voidBoss];
  if (state.frostMap) return frostEnemies;
  if (state.sanctumMap) return [sanctumEnemy];
  if (state.nextMap) return [ruinEnemy];
  return state.bossPhase ? bosses : enemies;
}

function shieldFacesEnemy(enemy) {
  const horizontalDirection = Math.sign(enemy.x - player.x);
  return horizontalDirection === 0 || horizontalDirection === player.facing;
}

function isShieldActive() {
  return state.hasShield && state.shieldTimer > 0;
}

function activateShield() {
  if (state.gameOver || state.cutscenePhase || (state.worldReturned && !state.arenaMode) || state.paused) return;
  if (!state.hasShield) {
    setMessage("你還沒有盾牌，先完成老人的教學。");
    return;
  }
  if (state.shieldCooldown > 0) {
    setMessage(`盾牌還需要 ${state.shieldCooldown.toFixed(1)} 秒才能再次使用。`);
    return;
  }
  state.shieldTimer = 0.3;
  state.shieldCooldown = 1;
  player.action = "shield";
  player.actionTimer = 0.3;
  state.comboCount = 0;
  state.comboTimer = 0;
  playSound(230, 0.1, "triangle");
  setMessage("盾牌展開 0.3 秒！正面擋下攻擊會反震敵人。");
}

function useSpecialItem(item) {
  if (state.gameOver || (state.worldReturned && !state.arenaMode) || state.paused) return;
  if (item === "power") {
    if (player.powerPotions <= 0) { setMessage("你沒有狂戰藥水，先到商人處購買。"); return; }
    player.powerPotions -= 1;
    state.powerTimer = 8;
    emitParticles(player.x, player.y - 18, "#ffbd69", 14, 2.5);
    setMessage("狂戰藥水生效！8 秒內劍傷害加倍。");
  } else if (item === "bomb") {
    if (player.bombs <= 0) { setMessage("你沒有星塵炸彈，先到商人處購買。"); return; }
    const target = getCombatants().filter((enemy) => enemy.active && enemy.hp > 0).sort((a, b) => distanceToEnemy(a) - distanceToEnemy(b))[0];
    if (!target || distanceToEnemy(target) > 240) { setMessage("附近沒有可攻擊的敵人。"); return; }
    player.bombs -= 1;
    damageEnemy(target, 4);
    emitParticles(target.x, target.y, "#f4d18d", 24, 4);
    screenShake = 0.18;
    setMessage(`星塵炸彈命中 ${target.type}！`);
  } else if (item === "compass") {
    if (player.compasses <= 0) { setMessage("你沒有解謎羅盤，先到商人處購買。"); return; }
    const map = currentExtraMap();
    const target = map ? map.puzzleNodes.find((node) => !node.collected)
      : state.nextMap ? ruinRunes.find((rune) => !rune.collected)
      : state.frostMap ? frostSeals.find((seal) => !seal.collected)
      : null;
    if (!target) { setMessage("羅盤沒有偵測到未完成的解謎目標。"); return; }
    player.compasses -= 1;
    emitParticles(target.x, target.y, "#79d3c9", 20, 2.4);
    setMessage(`解謎羅盤指向目標：(${Math.round(target.x)}, ${Math.round(target.y)})。`);
  } else if (item === "core") {
    if (player.shieldCores <= 0) { setMessage("你沒有護盾晶核，先到商人處購買。"); return; }
    if (!state.hasShield) { setMessage("你還沒有盾牌，無法使用護盾晶核。"); return; }
    player.shieldCores -= 1;
    state.shieldTimer = 1;
    state.shieldCooldown = 1;
    player.action = "shield";
    player.actionTimer = 1;
    emitParticles(player.x + player.facing * 18, player.y, "#b8fff5", 18, 2.7);
    setMessage("護盾晶核啟動！強化護盾維持 1 秒。");
  }
}

function repelEnemy(enemy, label = "反震") {
  if (!enemy || !enemy.active || enemy.hp <= 0) return;
  const direction = Math.sign(enemy.x - player.x) || player.facing;
  enemy.x = Math.max(55, Math.min(W - 55, enemy.x + direction * 90));
  enemy.attackWindup = 0;
  enemy.attackCooldown = Math.max(enemy.attackCooldown, enemy.cooldown * 0.75);
  enemy.stunned = Math.max(enemy.stunned, 1.25);
  emitParticles(enemy.x, enemy.y, "#85d7d0", 16, 3.4);
  emitFloatingText(`${label}！`, enemy.x, enemy.y - enemy.size, "#b8fff5");
  screenShake = 0.2;
  playSound(160, 0.16, "triangle");
  setMessage(`${label}成功！${enemy.type} 被擊退並暈眩 1.25 秒。`);
}

function attackFacesEnemy(enemy) {
  const horizontalDirection = Math.sign(enemy.x - player.x);
  return horizontalDirection === 0 || horizontalDirection === player.facing;
}

function fireAuthorPattern(enemy) {
  const damage = enemy.damage * 0.4;
  const fire = (x, y, vx, vy, color, radius = 8) => {
    projectiles.push({ x, y, vx, vy, damage, color, radius, source: enemy });
  };
  if (enemy.attackPattern === "fan" || enemy.attackPattern === "flip") {
    const angle = Math.atan2(enemy.attackTargetY - enemy.y, enemy.attackTargetX - enemy.x);
    const spread = enemy.attackPattern === "flip" ? [-1, 0, 1] : [-2, -1, 0, 1, 2];
    spread.forEach((offset) => {
      const direction = angle + offset * 0.2;
      fire(enemy.x, enemy.y, Math.cos(direction) * 5.3, Math.sin(direction) * 5.3, "#ffd28a");
    });
    if (enemy.attackPattern === "flip") {
      state.screenFlipTimer = 4;
      setMessage("作者改寫了畫面方向！螢幕翻轉 4 秒，閃避迎面而來的彈幕。");
    } else {
      setMessage("作者放出扇形彈幕！從彈幕間隙閃避。");
    }
  } else if (enemy.attackPattern === "lanes") {
    const fromRight = Math.floor(enemy.patternIndex / 4) % 2 === 0;
    [125, 185, 245, 305, 365, 425].forEach((y, index) => {
      if (index !== enemy.safeLane) fire(fromRight ? W - 18 : 18, y, fromRight ? -5.8 : 5.8, 0, "#f495d8", 9);
    });
    setMessage("作者發射橫向彈幕！沿著沒有預警線的通道閃避。");
  } else {
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2 + enemy.patternIndex * 0.16;
      fire(enemy.x, enemy.y, Math.cos(angle) * 4.2, Math.sin(angle) * 4.2, "#aee9ff", 7);
    }
    setMessage("作者放出環形彈幕！尋找外圈空隙移動。");
  }
}

function updateEnemy(enemy, dt) {
  if (!enemy.active || enemy.hp <= 0) return;
  const attackType = enemy.attackType || "melee";
  const attackDamage = enemy.damage || 1;
  const enraged = ((state.bossPhase && bosses.includes(enemy)) || enemy === voidBoss || enemy === trueFinalBoss || enemy === authorBoss || enemy === arenaFinalBoss) && enemy.hp <= enemy.maxHp / 2;
  const cooldown = enraged ? enemy.cooldown * 0.65 : enemy.cooldown;
  enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
  enemy.stunned = Math.max(0, enemy.stunned - dt);
  if (enemy.stunned > 0) return;
  const dx = player.x - enemy.x;
  const dy = state.dimension === "2D" ? player.y - enemy.y : 0;
  const distance = Math.hypot(dx, dy);
  const movement = Math.sign(dx);
  if (enemy.attackWindup <= 0 && distance > (["ranged", "shockwave", "void", "author"].includes(attackType) ? 185 : 64)) {
    enemy.x += movement * enemy.speed * 60 * dt;
    if (state.dimension === "2D") {
      const verticalSpeed = enemy.type === "跳躍者" ? enemy.speed * 2.2 : enemy.speed;
      enemy.y += Math.sign(dy) * verticalSpeed * 60 * dt;
    }
  }
  enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
  if (enemy.attackWindup > 0) {
    enemy.attackWindup -= dt;
    if (enemy.attackWindup <= 0) {
      if (attackType === "author") {
        fireAuthorPattern(enemy);
      } else if (attackType === "ranged") {
        projectiles.push({ x: enemy.x, y: enemy.y, vx: Math.sign(player.x - enemy.x) * 4.5, vy: state.dimension === "2D" ? Math.sign(player.y - enemy.y) * 2 : 0, damage: attackDamage, color: enemy.color, source: enemy });
        setMessage(`${enemy.type} 發射了遠程攻擊！`);
      } else if (attackType === "shockwave") {
        (state.dimension === "2D" ? [-1, 0, 1] : [0]).forEach((verticalDirection) => {
          projectiles.push({
            x: enemy.x,
            y: enemy.y + (state.dimension === "2D" ? verticalDirection * 42 : 0),
            vx: Math.sign(player.x - enemy.x) * 5,
            vy: state.dimension === "2D" ? verticalDirection * 0.8 : 0,
            damage: attackDamage,
            color: "#d7a7ff",
            source: enemy,
          });
        });
        screenShake = 0.28;
        playSound(55, 0.2, "square");
        setMessage(`${enemy.type} 釋放了裂地震波！`);
      } else if (attackType === "void") {
        const aimX = Math.sign(player.x - enemy.x) || 1;
        [-1, 0, 1].forEach((spread) => {
          projectiles.push({
            x: enemy.x, y: enemy.y,
            vx: aimX * 4.8,
            vy: state.dimension === "2D" ? Math.sign(player.y - enemy.y) * 1.4 + spread * 1.35 : spread * 0.9,
            damage: attackDamage,
            color: "#a77cff",
            source: enemy,
          });
        });
        enemy.x = player.x < W / 2 ? W - 150 : 150;
        if (state.dimension === "2D") enemy.y = Math.max(120, Math.min(H - 120, player.y + (Math.random() < 0.5 ? -110 : 110)));
        emitParticles(enemy.x, enemy.y, "#a77cff", 22, 3.1);
        screenShake = 0.24;
        playSound(95, 0.25, "sawtooth");
        setMessage(`${enemy.type} 撕裂空間，釋放三重虛空彈！`);
      } else {
        if (attackType === "dash") {
          enemy.x = enemy.attackTargetX ?? player.x;
          if (state.dimension === "2D") enemy.y = enemy.attackTargetY ?? player.y;
        } else if (attackType === "dimension") {
          const targetX = enemy.attackTargetX ?? player.x;
          enemy.x = targetX + (targetX < W / 2 ? 64 : -64);
          if (state.dimension === "2D") enemy.y = enemy.attackTargetY ?? player.y;
          enemy.x = Math.max(55, Math.min(W - 55, enemy.x));
          playSound(260, 0.18, "triangle");
        } else if (attackType === "leap") {
          enemy.x = enemy.attackTargetX ?? player.x;
          if (state.dimension === "2D") enemy.y = enemy.attackTargetY ?? player.y;
        }
        const impactRadius = {
          melee: 72,
          dash: 70,
          leap: 76,
          smash: 120,
          dimension: 82,
        }[attackType] || 72;
        const adjustedImpactRadius = enemy.type === "幽影獵手" ? 92 : impactRadius;
        const attackMissed = distanceToEnemy(enemy) > adjustedImpactRadius;
        if (attackMissed) {
          setMessage(`${enemy.type} 的${attackType === "smash" ? "重擊" : "攻擊"}落空了！`);
        } else if (!(isShieldActive() && shieldFacesEnemy(enemy))) {
          player.hp = Math.max(0, player.hp - (player.armor ? attackDamage * 0.5 : attackDamage));
          player.hurtTimer = 0.35;
          player.action = "hurt";
          player.actionTimer = 0.35;
          emitParticles(player.x, player.y, "#ff6b6b", 12, 2.8);
          emitFloatingText(`-${attackDamage}`, player.x, player.y - 28, "#ff6b6b");
          screenShake = attackType === "smash" ? 0.3 : attackType === "dimension" ? 0.22 : 0.18;
          playSound(attackType === "smash" ? 70 : 90, 0.16, "sawtooth");
          if (player.hp <= 0) {
            state.gameOver = true;
            keys.clear();
            state.attackTimer = 0;
            state.shieldTimer = 0;
            setMessage(state.arenaMode
              ? "競技場挑戰結束，按 X 或下方按鈕返回正常世界。"
              : "HP 歸零，遊戲結束。按 X 或下方按鈕重新開始。");
          } else {
            setMessage(`${enemy.type} 擊中你！`);
          }
        } else {
          repelEnemy(enemy);
        }
      }
      if (attackType !== "ranged" && attackType !== "shockwave") {
        enemy.attackCooldown = cooldown;
      } else {
        enemy.attackCooldown = cooldown;
      }
    }
  } else if (distance < enemy.range && enemy.attackCooldown <= 0) {
    enemy.attackWindup = attackType === "dash" ? 0.28
      : attackType === "author" ? 0.9
      : attackType === "smash" ? 0.9
      : attackType === "leap" ? 0.65
      : attackType === "ranged" ? 0.75
      : attackType === "shockwave" ? 1.05
      : attackType === "void" ? 0.72
      : attackType === "dimension" ? 0.5
      : 0.55;
    enemy.attackTargetX = player.x;
    enemy.attackTargetY = player.y;
    if (attackType === "author") {
      const patterns = ["fan", "lanes", "ring", "flip"];
      enemy.attackPattern = patterns[(enemy.patternIndex || 0) % patterns.length];
      enemy.patternIndex = (enemy.patternIndex || 0) + 1;
      enemy.safeLane = Math.floor(Math.random() * 6);
    }
    if (enraged) enemy.attackWindup *= 0.8;
  }
  enemy.x = Math.max(55, Math.min(W - 55, enemy.x));
  enemy.y = state.dimension === "1D" ? 370 : Math.max(95, Math.min(H - 90, enemy.y));
}

function updateProjectiles(dt) {
  for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = projectiles[index];
    projectile.x += projectile.vx * 60 * dt;
    projectile.y += projectile.vy * 60 * dt;
    if (projectile.owner === "player") {
      const target = getCombatants().find((enemy) => enemy.active && enemy.hp > 0 && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) < (projectile.radius || 7) + enemy.size / 2);
      if (target) {
        damageEnemy(target, projectile.damage);
        target.hitFlash = 0.16;
        emitParticles(projectile.x, projectile.y, projectile.color, 10, 2.4);
        projectiles.splice(index, 1);
      } else if (projectile.x < 0 || projectile.x > W || projectile.y < 74 || projectile.y > H) {
        projectiles.splice(index, 1);
      }
      continue;
    }
    if (Math.hypot(player.x - projectile.x, player.y - projectile.y) < 24) {
      if (player.hurtTimer > 0) {
        projectiles.splice(index, 1);
        continue;
      }
      const incomingDirection = projectile.vx < 0 ? 1 : -1;
      if (!(isShieldActive() && player.facing === incomingDirection)) {
        player.hp = Math.max(0, player.hp - (player.armor ? projectile.damage * 0.5 : projectile.damage));
        player.hurtTimer = 0.35;
        player.action = "hurt";
        player.actionTimer = 0.35;
        emitParticles(player.x, player.y, "#ff6b6b", 12, 2.8);
        emitFloatingText(`-${projectile.damage}`, player.x, player.y - 28, "#ff6b6b");
        setMessage(player.hp > 0 ? "遠程攻擊命中你！" : state.arenaMode
          ? "競技場挑戰結束，按 X 或下方按鈕返回正常世界。"
          : "HP 歸零，遊戲結束。按 X 或下方按鈕重新開始。");
        if (player.hp <= 0) {
          state.gameOver = true;
          keys.clear();
        }
      } else {
        repelEnemy(projectile.source, "遠程反震");
      }
      projectiles.splice(index, 1);
    } else if (projectile.x < 0 || projectile.x > W || projectile.y < 74 || projectile.y > H) {
      projectiles.splice(index, 1);
    }
  }
}

function activateNextEnemy() {
  const current = enemies[state.defeatedEnemies];
  if (!current || current.hp > 0 || !current.active) return;
  state.defeatedEnemies += 1;
  const next = enemies[state.defeatedEnemies];
  if (next) {
    next.active = true;
    setMessage(`${current.type} 被擊敗！${next.type} 出現了！`);
  } else {
    state.bossPhase = true;
    bosses[0].active = true;
    setMessage("五種敵人全部被擊敗！第一個小 Boss「裂地守衛」出現了！");
  }
}

function activateNextBoss() {
  const current = bosses[state.defeatedBosses];
  if (!current || current.hp > 0 || !current.active) return;
  const reward = 50;
  player.money += reward;
  player.hp = Math.min(player.maxHp, player.hp + 0.5);
  state.defeatedBosses += 1;
  const next = bosses[state.defeatedBosses];
  if (next) {
    state.bossRestTimer = 10;
    setMessage(`${current.type} 被擊敗！獲得 ${reward} 金並恢復 0.5 HP。休息 10 秒，下一個 Boss 即將出現。`);
    playSound(110, 0.3, "triangle");
  } else {
    setMessage(`四個小 Boss 全部被擊敗！獲得 ${reward} 金並恢復 0.5 HP。收集維度碎片並前往維度門。`);
  }
}

function activateNextFrostEnemy() {
  const current = frostEnemies[state.frostDefeated];
  if (!current || current.hp > 0 || !current.active) return;
  current.active = false;
  state.frostDefeated += 1;
  const next = frostEnemies[state.frostDefeated];
  if (next) {
    next.active = true;
    setMessage(`${current.type} 被擊敗！${next.type} 從冰霧中現身。`);
  } else {
    setMessage("裂谷敵人已全部擊敗！進入 2D 維度收集三枚寒霜印記。 ");
  }
}

function update(dt) {
  if (gameContent.hidden || state.gameOver || (state.worldReturned && !state.arenaMode) || state.paused) return;
  if (state.cutscenePhase) {
    updateArenaFinale(dt);
    return;
  }
  if (state.elevatorMode) state.elevatorHeight += dt * 95;
  const horizontal = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
  const vertical = state.dimension === "2D"
    ? (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0)
    : 0;
  const moving = horizontal !== 0 || vertical !== 0;
  player.walkCycle += dt * (moving ? 11 : 3.5);
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  player.potionTimer = Math.max(0, player.potionTimer - dt);
  if (player.actionTimer === 0 && player.hurtTimer === 0 && player.potionTimer === 0) player.action = moving ? "walk" : "idle";
  if (horizontal !== 0) player.facing = horizontal;
  player.x += horizontal * player.speed * 60 * dt;
  player.y += vertical * player.speed * 60 * dt;
  player.x = Math.max(55, Math.min(W - 55, player.x));
  player.y = state.dimension === "1D" ? 370 : Math.max(95, Math.min(H - 90, player.y));
  collectShards();
  collectRuinRunes();
  collectSanctumShards();
  collectFrostSeals();
  collectExtraPuzzle();

  state.attackTimer = Math.max(0, state.attackTimer - dt);
  state.swordCooldown = Math.max(0, state.swordCooldown - dt);
  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer === 0) state.comboCount = 0;
  state.shieldTimer = Math.max(0, state.shieldTimer - dt);
  state.shieldCooldown = Math.max(0, state.shieldCooldown - dt);
  state.powerTimer = Math.max(0, state.powerTimer - dt);
  state.authorIntroTimer = Math.max(0, state.authorIntroTimer - dt);
  state.screenFlipTimer = Math.max(0, state.screenFlipTimer - dt);
  screenShake = Math.max(0, screenShake - dt);
  if (state.bossRestTimer > 0) {
    state.bossRestTimer = Math.max(0, state.bossRestTimer - dt);
    if (state.bossRestTimer === 0) {
      const nextBoss = bosses[state.defeatedBosses];
      nextBoss.active = true;
      playSound(220, 0.35, "sawtooth");
      setMessage(`${nextBoss.type} 出現了！`);
    }
  }
  const extra = currentExtraMap();
  const activeEnemy = state.arenaMode ? getCombatants().find((combatant) => combatant.active)
    : state.trueFinalMap ? (state.authorRevealed ? authorBoss : trueFinalBoss)
    : extra ? (state.extraEnemyDefeated ? extra.boss : extra.enemy)
    : state.voidMap ? voidBoss
    : state.frostMap ? frostEnemies[state.frostDefeated]
    : state.sanctumMap ? sanctumEnemy
    : state.nextMap ? ruinEnemy
    : state.bossPhase && state.bossRestTimer <= 0
    ? bosses[state.defeatedBosses]
    : !state.bossPhase ? enemies[state.defeatedEnemies] : null;
  if (activeEnemy) {
    if (activeEnemy !== authorBoss || state.authorIntroTimer === 0) updateEnemy(activeEnemy, dt);
    if (state.arenaMode && activeEnemy.hp <= 0 && activeEnemy.active) {
      activeEnemy.active = false;
      advanceArenaAfterDefeat();
    } else if (state.trueFinalMap && trueFinalBoss.hp <= 0 && trueFinalBoss.active) {
      trueFinalBoss.active = false;
      state.trueFinalBossDefeated = true;
      projectiles.length = 0;
      setMessage("維度之源已被擊敗！回歸之門已開啟，前往右側門扉按 F。");
    } else if (state.trueFinalMap && state.authorRevealed && authorBoss.hp <= 0 && authorBoss.active) {
      authorBoss.active = false;
      state.authorBossDefeated = true;
      state.authorIntroTimer = 0;
      state.screenFlipTimer = 0;
      projectiles.length = 0;
      setMessage("作者已被擊敗！回歸之門重新開啟，前往右側按 F 回到正常世界。");
    } else if (extra && !state.extraEnemyDefeated && extra.enemy.hp <= 0 && extra.enemy.active) {
      extra.enemy.active = false;
      state.extraEnemyDefeated = true;
      state.dimension = "2D";
      extra.boss.active = true;
      setMessage(`${extra.enemy.type} 被擊敗！${extra.boss.type} 出現了！擊敗後解開${extra.puzzle}。`);
    } else if (extra && state.extraEnemyDefeated && extra.boss.hp <= 0 && extra.boss.active) {
      extra.boss.active = false;
      setMessage(`${extra.boss.type} 被擊敗！進入 2D 維度解開${extra.puzzle}。`);
    } else if (state.voidMap && voidBoss.hp <= 0 && voidBoss.active) {
      voidBoss.active = false;
      state.voidBossDefeated = true;
      voidExit.unlocked = true;
      player.money += 200;
      setMessage("虛空君王被擊敗！獲得 200 金，最終出口已開啟。");
    } else if (state.frostMap) {
      activateNextFrostEnemy();
    } else if (state.sanctumMap && sanctumEnemy.hp <= 0 && sanctumEnemy.active) {
      sanctumEnemy.active = false;
      setMessage("聖堂守護者已被擊敗！進入 2D 維度，將三枚連動印記全部點亮。");
    } else if (state.nextMap && ruinEnemy.hp <= 0) {
      ruinEnemy.active = false;
        if (!ruinCore.collected && Math.hypot(player.x - ruinCore.x, player.y - ruinCore.y) < 42) {
          ruinCore.collected = true;
          state.ruinObjectiveComplete = true;
          setMessage("遺跡守衛被擊敗！你取得遺跡核心，區域探索完成！");
        } else if (!ruinCore.collected) {
          setMessage("遺跡守衛已被擊敗，前往核心位置取得遺跡核心。");
        }
    } else if (state.bossPhase) activateNextBoss();
    else activateNextEnemy();
  }
  if (state.gameOver) {
    if (state.arenaMode) restartArenaAfterDeath();
    return;
  }
  updateProjectiles(dt);
  if (state.gameOver) {
    if (state.arenaMode) restartArenaAfterDeath();
    return;
  }
  updateParticles(dt);
  updateFloatingTexts(dt);
  state.regenTimer -= dt;
  if (state.regenTimer <= 0) {
    state.regenTimer += 5;
    if (player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + 0.5);
      setMessage("自然回復：你恢復了 0.5 HP。");
    }
  }
  if (state.modeTimer > 0) {
    state.modeTimer = Math.max(0, state.modeTimer - dt);
    if (state.modeTimer === 0) {
      state.dimension = "1D";
      state.cooldown = DIMENSION_COOLDOWN;
      setMessage(`2D 維度結束，回到 1D。C 冷卻中，還需 ${DIMENSION_COOLDOWN} 秒。`);
    }
  } else if (state.cooldown > 0) {
    state.cooldown = Math.max(0, state.cooldown - dt);
  }
}

function drawText(text, x, y, size = 16, color = "#f4f0df", align = "left") {
  ctx.font = `${size}px "Microsoft JhengHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function drawGlow(x, y, radius, color, alpha = 0.7) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`);
  glow.addColorStop(1, `${color}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawAmbientBackdrop() {
  const palette = state.voidMap
    ? { top: "#080510", middle: "#1d1035", bottom: "#3c1d61", mote: "#b58cff", ridge: "#2a1647", ground: "#10091b" }
    : state.frostMap
      ? { top: "#071622", middle: "#12364c", bottom: "#2d6477", mote: "#b9f3ff", ridge: "#174458", ground: "#0b202c" }
      : state.sanctumMap
        ? { top: "#18140d", middle: "#332918", bottom: "#5a4422", mote: "#f1d78a", ridge: "#44351d", ground: "#211c12" }
    : state.nextMap
      ? { top: "#15111f", middle: "#30253c", bottom: "#493752", mote: "#c9a5df", ridge: "#3a2d47", ground: "#211a28" }
      : state.dimension === "2D"
        ? { top: "#07191f", middle: "#10313a", bottom: "#20505a", mote: "#79d3c9", ridge: "#173d45", ground: "#0b2026" }
        : { top: "#090b18", middle: "#171b31", bottom: "#2b3150", mote: "#9da5d4", ridge: "#222844", ground: "#111522" };
  const sky = ctx.createLinearGradient(0, 74, 0, H);
  sky.addColorStop(0, palette.top);
  sky.addColorStop(0.62, palette.middle);
  sky.addColorStop(1, palette.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const time = performance.now() / 1000;
  ambientMotes.forEach((mote) => {
    ctx.globalAlpha = 0.2 + (Math.sin(time * 1.4 + mote.phase) + 1) * 0.18;
    ctx.fillStyle = palette.mote;
    ctx.fillRect(mote.x, mote.y, mote.size, mote.size);
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = palette.ridge;
  ctx.beginPath();
  ctx.moveTo(0, 330);
  for (let x = 0; x <= W; x += 80) {
    const peak = 285 + ((x / 80) % 3) * 18;
    ctx.lineTo(x + 40, peak);
    ctx.lineTo(x + 80, 335);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  const ground = ctx.createLinearGradient(0, 350, 0, H);
  ground.addColorStop(0, palette.ground);
  ground.addColorStop(1, "#070912");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 350, W, H - 350);
  ctx.fillStyle = `${palette.mote}22`;
  for (let x = 20; x < W; x += 58) {
    ctx.fillRect(x, 397 + ((x / 58) % 3) * 25, 24, 2);
  }

  if (state.voidMap) {
    ctx.fillStyle = "#24103fcc";
    [145, 480, 815].forEach((x, index) => {
      ctx.beginPath();
      ctx.moveTo(x, 350);
      ctx.lineTo(x + 35, 195 - index * 18);
      ctx.lineTo(x + 70, 350);
      ctx.fill();
    });
  } else if (state.frostMap) {
    ctx.fillStyle = "#1a5368cc";
    [80, 290, 540, 790].forEach((x, index) => {
      ctx.beginPath();
      ctx.moveTo(x, 350);
      ctx.lineTo(x + 28, 235 - (index % 2) * 45);
      ctx.lineTo(x + 56, 350);
      ctx.fill();
    });
  } else if (state.nextMap) {
    ctx.fillStyle = "#211a2bcc";
    [95, 335, 575, 815].forEach((x, index) => {
      const height = 92 + (index % 2) * 34;
      ctx.fillRect(x, 350 - height, 44, height);
      ctx.fillRect(x - 9, 350 - height, 62, 10);
    });
  } else if (state.sanctumMap) {
    ctx.fillStyle = "#3b2f1a";
    [110, 430, 750].forEach((x) => {
      ctx.fillRect(x, 190, 34, 160);
      ctx.fillRect(x - 12, 182, 58, 12);
      ctx.fillRect(x - 8, 338, 50, 12);
    });
  } else {
    ctx.fillStyle = "#12172a99";
    for (let x = 30; x < W; x += 120) {
      ctx.fillRect(x, 305, 54, 45);
      ctx.fillRect(x + 14, 278, 26, 27);
    }
  }
}

function drawPortal(x, y, unlocked, color) {
  if (unlocked) drawGlow(x, y, 72, color, 0.42);
  ctx.save();
  ctx.shadowColor = unlocked ? color : "transparent";
  ctx.shadowBlur = unlocked ? 18 : 0;
  ctx.fillStyle = unlocked ? color : "#5d5268";
  ctx.fillRect(x - 28, y - 46, 56, 92);
  ctx.fillStyle = unlocked ? "#142d2c" : "#282532";
  ctx.fillRect(x - 19, y - 36, 38, 72);
  ctx.strokeStyle = unlocked ? "#d8fff0" : "#81778c";
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 28, y - 46, 56, 92);
  ctx.restore();
}

function drawBackground() {
  const twoD = state.dimension === "2D";
  drawAmbientBackdrop();
  if (state.elevatorMode) {
    ctx.fillStyle = "#12172a";
    ctx.fillRect(0, 74, W, H - 74);
    ctx.fillStyle = "#343e59";
    ctx.fillRect(75, 74, 30, 430);
    ctx.fillRect(855, 74, 30, 430);
    ctx.strokeStyle = "#8494b6";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(115, 74); ctx.lineTo(115, 390); ctx.moveTo(845, 74); ctx.lineTo(845, 390); ctx.stroke();
    for (let y = -100 + (state.elevatorHeight % 110); y < H; y += 110) {
      ctx.fillStyle = "#53617d";
      ctx.fillRect(106, y, 18, 12);
      ctx.fillRect(836, y, 18, 12);
    }
    ctx.fillStyle = "#36475c";
    ctx.fillRect(120, 385, 720, 36);
    ctx.fillStyle = "#8fb2ba";
    ctx.fillRect(120, 382, 720, 7);
    drawText("上升中的電梯", 24, 105, 16, "#b9e5ff");
    drawText(`第 ${state.elevatorWave} / ${ELEVATOR_TOTAL_WAVES} 波・敵人 ${state.elevatorKills} / ${ELEVATOR_ENEMIES_PER_WAVE}`, 24, 130, 13, "#d8eaff");
    return;
  }
  if (state.arenaMode) {
    if (state.arenaRestRoom) {
      drawText("競技場休息室", 24, 105, 16, "#b8ffe1");
      drawText(state.arenaFinalBossDefeated ? "50 波完成・最終 Boss 已擊敗"
        : state.arenaWave === 0 ? "挑戰起點・生命已恢復" : `第 ${state.arenaWave} 波完成・生命已恢復`, 24, 130, 13, "#d7f5e5");
      ctx.fillStyle = "#183b36";
      ctx.fillRect(0, 382, W, 8);
      ctx.fillStyle = "#254d45";
      ctx.fillRect(305, 175, 350, 42);
      ctx.fillRect(325, 217, 32, 165);
      ctx.fillRect(603, 217, 32, 165);
      if (state.arenaFinalBossDefeated) {
        drawPortal(arenaContinueGate.x, arenaContinueGate.y, true, "#ffd28a");
        drawText("完成挑戰・按 F", arenaContinueGate.x, arenaContinueGate.y + 58, 12, "#ffedbd", "center");
      } else if (state.playthrough === 2 && state.authorBossDefeated) {
        drawPortal(thirdPlaythroughGate.x, thirdPlaythroughGate.y, true, "#8ce0b0");
        drawText("三周目之門・按 F", thirdPlaythroughGate.x, thirdPlaythroughGate.y + 58, 12, "#b8ffe1", "center");
      } else {
        drawPortal(arenaContinueGate.x, arenaContinueGate.y, true, "#79d3c9");
        drawText("繼續挑戰・按 F", arenaContinueGate.x, arenaContinueGate.y + 58, 12, "#b8fff5", "center");
      }
      return;
    }
    drawText("競技場模式", 24, 105, 16, "#ff7188");
    drawText(`第 ${state.arenaWave} / ${ARENA_TOTAL_WAVES} 波：${state.arenaBossActive ? "Boss 戰" : `敵人 ${state.arenaKillsThisWave} / ${ARENA_ENEMIES_PER_WAVE}`}`, 24, 130, 13, "#ffd6dc");
    ctx.fillStyle = "#8e304d99";
    ctx.fillRect(0, 382, W, 6);
    return;
  }
  if (state.trueFinalMap) {
    drawText("真・最終地圖：維度核心", 24, 105, 16, "#f9a6eb");
    const chapter = !state.trueFinalBossDefeated ? "擊敗維度之源，解鎖回歸之門"
      : !state.authorRevealed ? "回歸之門已開啟，前往右側按 F"
      : !state.authorBossDefeated ? "作者鎖上了門！在 2D 場地中閃避彈幕"
      : "作者已被擊敗，前往回歸之門按 F";
    drawText(chapter, 24, 130, 13, "#f7d7f3");
    drawGlow(W / 2, 255, 110, "#e461d8", 0.42);
    ctx.strokeStyle = "#f9a6eb";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(W / 2, 255, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, 255, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#9b3f9b";
    ctx.fillRect(0, 382, W, 6);
    if (state.authorRevealed && !state.authorBossDefeated) {
      ctx.strokeStyle = "#ffd28a";
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 95, W - 110, H - 185);
    }
    drawPortal(trueFinalExit.x, trueFinalExit.y, returnDoorUnlocked(), "#f9a6eb");
    drawText(returnDoorUnlocked() ? "回歸之門" : "封印之門", trueFinalExit.x, trueFinalExit.y + 58, 12, returnDoorUnlocked() ? "#ffd5f6" : "#a8acc2", "center");
    return;
  }
  const extra = currentExtraMap();
  if (extra) {
    drawText(`第${extra.index + 5}張地圖：${extra.title}`, 24, 105, 14, extra.color);
    drawText(!state.extraEnemyDefeated ? `擊敗 ${extra.enemy.type}` : extra.boss.hp > 0 ? `擊敗 ${extra.boss.type}` : `${extra.puzzle}（${state.extraPuzzleCount} / ${extra.nodes}）`, 24, 130, 13, "#d7e6e8");
    if (twoD) {
      ctx.strokeStyle = `${extra.color}55`;
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 74; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      extra.puzzleNodes.forEach((node, index) => {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(Math.PI / 4);
        ctx.shadowColor = node.collected ? extra.color : "transparent";
        ctx.shadowBlur = node.collected ? 18 : 0;
        ctx.fillStyle = node.collected ? extra.color : "#34394b";
        ctx.fillRect(-14, -14, 28, 28);
        ctx.fillStyle = node.collected ? "#ffffff" : "#a8acc2";
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
        drawText(`${index + 1}`, node.x, node.y + 5, 12, node.collected ? "#08111b" : "#d7e6e8", "center");
      });
    } else {
      ctx.fillStyle = `${extra.color}aa`;
      ctx.fillRect(0, 382, W, 6);
    }
    drawPortal(extra.exit.x, extra.exit.y, extra.exit.unlocked, extra.color);
    drawText(extra.exit.unlocked ? "出口" : "鎖定", extra.exit.x, extra.exit.y + 58, 12, extra.exit.unlocked ? extra.color : "#a8acc2", "center");
    return;
  }
  if (state.voidMap) {
    drawText("第五張地圖：虛空王座", 24, 105, 14, "#c6a7ff");
    drawText(state.voidBossDefeated ? "虛空君王已被擊敗" : "終局 Boss：虛空君王", 24, 130, 13, "#a987e8");
    ctx.fillStyle = "#6c45a8";
    ctx.fillRect(0, 382, W, 6);
    drawPortal(voidExit.x, voidExit.y, voidExit.unlocked, "#b58cff");
    drawText(voidExit.unlocked ? "下一區域" : "虛空封印", voidExit.x, voidExit.y + 58, 12, voidExit.unlocked ? "#d9c8ff" : "#8b78a8", "center");
    return;
  }
  if (state.frostMap) {
    drawText("第四張地圖：冰封裂谷", 24, 105, 14, "#b9f3ff");
    drawText(state.frostDefeated < frostEnemies.length ? "擊敗裂谷敵人" : "進入 2D 收集寒霜印記", 24, 130, 13, "#91cadb");
    drawText(`寒霜印記：${state.frostSealCount} / ${frostSeals.length}`, 760, 130, 13, "#b9f3ff");
    if (twoD) {
      ctx.strokeStyle = "#2f7189";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 74; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    } else {
      ctx.fillStyle = "#72b9d0";
      ctx.fillRect(0, 382, W, 6);
    }
    drawPortal(frostExit.x, frostExit.y, frostExit.unlocked, "#9ee7ff");
    drawText(frostExit.unlocked ? "虛空之門" : "冰封", frostExit.x, frostExit.y + 58, 12, frostExit.unlocked ? "#c8f7ff" : "#8aa5b2", "center");
    return;
  }
  if (state.sanctumMap) {
    drawText("第三張地圖：核心聖堂", 24, 105, 14, "#f1d78a");
    drawText(sanctumEnemy.hp > 0 ? "擊敗聖堂守護者" : "踩上印記會切換自己與相鄰印記", 24, 130, 13, "#d9c58d");
    drawText(`點亮印記：${state.sanctumShardCount} / ${sanctumShards.length}`, 760, 130, 13, "#f1d78a");
    ctx.fillStyle = "#9c7a3a";
    ctx.fillRect(0, 382, W, 6);
    drawPortal(sanctumExit.x, sanctumExit.y, sanctumExit.unlocked, "#8ce0b0");
    drawText(sanctumExit.unlocked ? "出口" : "鎖定", sanctumExit.x, sanctumExit.y + 58, 12, sanctumExit.unlocked ? "#8ce0b0" : "#a8acc2", "center");
    return;
  }
  if (state.nextMap) {
    drawText("第二張地圖：寂靜遺跡", 24, 105, 14, "#d8a9d1");
    drawText(state.ruinObjectiveComplete ? "遺跡核心已取得，區域探索完成" : "擊敗遺跡守衛並取得遺跡核心", 24, 130, 13, "#bba8c3");
    drawText(`遺跡符文：${state.ruinRuneCount} / ${ruinRunes.length}`, 760, 130, 13, "#d8a9d1");
    if (state.ruinObjectiveComplete && !ruinExit.unlocked) {
      drawText("牆上刻痕：月 → 星 → 日", 610, 155, 13, "#f1d5ff");
    }
    if (!state.ruinObjectiveComplete) {
      ctx.fillStyle = "#75603d";
      ctx.fillRect(ruinCore.x - 18, ruinCore.y - 18, 36, 36);
      drawText("核心", ruinCore.x, ruinCore.y + 34, 12, "#f4d18d", "center");
    }
    if (twoD) {
      ctx.strokeStyle = "#58436b";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 74; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      drawText("2D 維度：遺跡可以上下左右探索", 24, 155, 14, "#d8a9d1");
    } else {
      ctx.fillStyle = "#6c527a";
      ctx.fillRect(0, 382, W, 6);
    }
    drawPortal(ruinExit.x, ruinExit.y, ruinExit.unlocked, "#8ce0b0");
    drawText(ruinExit.unlocked ? "出口" : "鎖定", ruinExit.x, ruinExit.y + 58, 12, ruinExit.unlocked ? "#8ce0b0" : "#a8acc2", "center");
    return;
  }
  ctx.strokeStyle = twoD ? "#235a63" : "#292e49";
  ctx.lineWidth = 1;
  if (twoD) {
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 74; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    drawText("2D 維度：可以自由探索上下左右", 24, 105, 14, "#79d3c9");
    drawText(`維度碎片：${state.shardCount} / ${shards.length}`, 760, 105, 14, "#79d3c9");
    drawPortal(dimensionGate.x, dimensionGate.y, dimensionGate.unlocked, "#79d3c9");
    drawText(dimensionGate.unlocked ? "已解鎖" : "鎖定", dimensionGate.x, dimensionGate.y + 58, 12, dimensionGate.unlocked ? "#8ce0b0" : "#a8acc2", "center");
  } else {
    ctx.fillStyle = "#535d91";
    ctx.fillRect(0, 382, W, 6);
    drawText("1D 維度：你只能沿著這條路前進", 24, 105, 14, "#9da5d4");
  }
}

function drawCharacter() {
  const blocking = isShieldActive();
  const moving = player.action === "walk";
  const cycle = Math.sin(player.walkCycle);
  const bob = moving ? Math.abs(cycle) * 1.8 : Math.sin(player.walkCycle * 0.5) * 0.6;
  const recoil = player.action === "hurt" ? -3 : 0;
  const potionGlow = player.action === "potion" ? "#82e6a7" : "transparent";
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#05060d";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 18, 24 + (moving ? Math.abs(cycle) * 2 : 0), 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(player.x + recoil, player.y - bob);
  ctx.scale(player.facing, 1);
  if (potionGlow !== "transparent") {
    ctx.shadowColor = potionGlow;
    ctx.shadowBlur = 18;
  }
  if (player.action === "hurt") ctx.rotate(-0.12);
  if (player.action === "attack") ctx.rotate(-0.06);
  ctx.fillStyle = "#15182a";
  const legSwing = moving ? cycle * 4 : 0;
  ctx.fillStyle = player.pantsColor;
  ctx.fillRect(-14 - legSwing * 0.35, 13, 10, 8);
  ctx.fillRect(5 + legSwing * 0.35, 13, 10, 8);
  ctx.fillRect(-18, -18, 36, 34);
  ctx.fillStyle = player.shirtColor || state.bodyColor;
  ctx.fillRect(-14, -15, 28, 27);
  ctx.fillStyle = "#ffffff2e";
  ctx.fillRect(-11, -12, 22, 4);
  ctx.fillStyle = "#5e3d32";
  ctx.fillRect(-14, 7, 28, 5);
  ctx.fillStyle = "#272b42";
  ctx.fillRect(-10, -7, 7, 7);
  ctx.fillRect(3, -7, 7, 7);
  ctx.fillStyle = state.eyeColor;
  ctx.fillRect(-8, -6, 3, 3);
  ctx.fillRect(5, -6, 3, 3);
  if (player.glasses) {
    ctx.strokeStyle = "#d9f3ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-11, -9, 10, 8);
    ctx.strokeRect(1, -9, 10, 8);
    ctx.beginPath(); ctx.moveTo(-1, -6); ctx.lineTo(1, -6); ctx.stroke();
  }
  if (player.beard) {
    ctx.fillStyle = "#5b3f3a";
    ctx.fillRect(-7, 1, 14, 8);
    ctx.fillStyle = "#76534a";
    ctx.fillRect(-4, 8, 8, 4);
  }
  if (player.hat) {
    ctx.fillStyle = "#314b78";
    ctx.fillRect(-17, -23, 34, 6);
    ctx.fillRect(-10, -31, 20, 9);
    ctx.fillStyle = "#6e9bd1";
    ctx.fillRect(-8, -29, 16, 3);
  }
  // Arms swing while walking and pull back when the player is hit.
  const armSwing = moving ? cycle * 5 : 0;
  ctx.strokeStyle = state.bodyColor;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.lineTo(-22, 8 + armSwing);
  ctx.moveTo(14, -2);
  ctx.lineTo(22, 8 - armSwing);
  ctx.stroke();
  ctx.lineCap = "butt";
  if (state.hasSword && state.attackTimer > 0) {
    ctx.shadowColor = "#dce7ef"; ctx.shadowBlur = 10;
    ctx.strokeStyle = "#eef7ff"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(48, -28); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#8b603f"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(13, -7); ctx.lineTo(22, -16); ctx.stroke();
  }
  const shieldActive = isShieldActive();
  if (shieldActive) {
    ctx.shadowColor = blocking ? "#85d7d0" : "#7092b7";
    ctx.shadowBlur = blocking ? 14 : 5;
    ctx.fillStyle = blocking ? "#85d7d0" : "#7092b7";
    ctx.beginPath(); ctx.arc(22, 2, 17, -1.2, 1.2); ctx.lineTo(22, 2); ctx.fill();
    ctx.strokeStyle = "#d8fff8";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (player.action === "potion") {
    ctx.fillStyle = "#82e6a7";
    ctx.fillRect(18, -16, 8, 12);
    ctx.fillStyle = "#d8fff0";
    ctx.fillRect(20, -19, 4, 4);
  }
  ctx.restore();
}

function drawElder() {
  if (state.authorRevealed) return;
  ctx.fillStyle = "#07091266";
  ctx.beginPath(); ctx.ellipse(elder.x, elder.y + 20, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#6f4d43";
  ctx.fillRect(elder.x - 21, elder.y - 29, 42, 54);
  ctx.fillStyle = "#bd8e70";
  ctx.fillRect(elder.x - 18, elder.y - 26, 36, 48);
  ctx.fillStyle = "#d5a481";
  ctx.fillRect(elder.x - 14, elder.y - 22, 28, 5);
  ctx.fillStyle = "#eee4d2";
  ctx.beginPath(); ctx.arc(elder.x, elder.y - 32, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d9d0c2";
  ctx.beginPath(); ctx.moveTo(elder.x - 13, elder.y - 27); ctx.lineTo(elder.x, elder.y - 12); ctx.lineTo(elder.x + 13, elder.y - 27); ctx.fill();
  ctx.fillStyle = "#41455c";
  ctx.fillRect(elder.x - 16, elder.y - 37, 6, 6);
  ctx.fillRect(elder.x + 10, elder.y - 37, 6, 6);
  drawText("老人", elder.x, elder.y - 58, 14, "#f4d18d", "center");
}

function drawEnemy() {
  getCombatants().forEach((enemy) => {
    if (!enemy.active || enemy.hp <= 0) return;
  const enraged = ((state.bossPhase && bosses.includes(enemy)) || enemy === voidBoss || enemy === trueFinalBoss || enemy === authorBoss || enemy === arenaFinalBoss) && enemy.hp <= enemy.maxHp / 2;
  if (enemy.attackWindup > 0) {
    ctx.save();
    const warningColor = {
      shockwave: "#d7a7ff",
      smash: "#ff8c5a",
      dash: "#78c7ff",
      dimension: "#f1d76f",
      void: "#b58cff",
      author: "#ffd28a",
      ranged: "#e7d35f",
      leap: "#8ce0b0",
    }[enemy.attackType] || "#ff9b9f";
    ctx.strokeStyle = warningColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    if (enemy === authorBoss) {
      if (enemy.attackPattern === "lanes") {
        [125, 185, 245, 305, 365, 425].forEach((y, index) => {
          if (index === enemy.safeLane) return;
          ctx.beginPath(); ctx.moveTo(55, y); ctx.lineTo(W - 55, y); ctx.stroke();
        });
      } else if (enemy.attackPattern === "ring") {
        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, 110, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.attackTargetX ?? player.x, enemy.attackTargetY ?? player.y);
        ctx.stroke();
      }
    } else if (enemy.attackType === "shockwave") {
      ctx.beginPath();
      ctx.moveTo(18, enemy.y);
      ctx.lineTo(W - 18, enemy.y);
      ctx.stroke();
      if (state.dimension === "2D") {
        ctx.beginPath();
        ctx.moveTo(18, enemy.y - 42);
        ctx.lineTo(W - 18, enemy.y - 42);
        ctx.moveTo(18, enemy.y + 42);
        ctx.lineTo(W - 18, enemy.y + 42);
        ctx.stroke();
      }
    } else if (enemy.attackType === "smash") {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 120, 0, Math.PI * 2);
      ctx.stroke();
    } else if (enemy.attackType === "dash" || enemy.attackType === "dimension" || enemy.attackType === "void") {
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(enemy.attackTargetX ?? player.x, state.dimension === "2D" ? enemy.attackTargetY ?? player.y : enemy.y);
      ctx.stroke();
    } else if (enemy.attackType === "ranged") {
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(player.x, state.dimension === "2D" ? player.y : enemy.y);
      ctx.stroke();
    } else if (enemy.attackType === "leap") {
      ctx.beginPath();
      ctx.arc(enemy.attackTargetX ?? player.x, state.dimension === "2D" ? enemy.attackTargetY ?? player.y : enemy.y, 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = "#05060d";
  ctx.beginPath(); ctx.ellipse(0, enemy.size / 2 + 7, enemy.size * 0.65, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  const enemyColor = enemy.hitFlash > 0 ? "#f4f0df" : enemy.attackWindup > 0 ? "#ef6c72" : enraged ? "#ff4f5f" : enemy.color;
  ctx.shadowColor = enemy.attackWindup > 0 || enraged ? enemyColor : "transparent";
  ctx.shadowBlur = enemy.attackWindup > 0 || enraged ? 16 : 0;
  ctx.fillStyle = "#171424";
  ctx.fillRect(-enemy.size / 2 - 3, -enemy.size / 2 - 3, enemy.size + 6, enemy.size + 6);
  ctx.fillStyle = enemyColor;
  ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
  ctx.fillStyle = "#ffffff24";
  ctx.fillRect(-enemy.size / 2 + 4, -enemy.size / 2 + 4, enemy.size - 8, 5);
  ctx.fillStyle = "#f4f0df";
  ctx.fillRect(-9, -6, 5, 5);
  ctx.fillRect(5, -6, 5, 5);
  ctx.fillStyle = "#2b1720";
  ctx.fillRect(-7, 6, 14, 4);
  if (enemy === authorBoss) {
    ctx.fillStyle = "#eee4d2";
    ctx.fillRect(-25, -enemy.size / 2 - 10, 50, 14);
    ctx.fillRect(-17, 3, 34, 20);
    ctx.fillStyle = "#6f4d43";
    ctx.fillRect(-enemy.size / 2 + 5, enemy.size / 2 - 13, enemy.size - 10, 10);
  }
  if (frostEnemies.includes(enemy)) {
    ctx.fillStyle = "#d9f8ff";
    ctx.beginPath();
    ctx.moveTo(-enemy.size / 2 + 3, -enemy.size / 2);
    ctx.lineTo(-enemy.size / 2 + 10, -enemy.size / 2 - 12);
    ctx.lineTo(-enemy.size / 2 + 15, -enemy.size / 2);
    ctx.moveTo(enemy.size / 2 - 15, -enemy.size / 2);
    ctx.lineTo(enemy.size / 2 - 9, -enemy.size / 2 - 12);
    ctx.lineTo(enemy.size / 2 - 3, -enemy.size / 2);
    ctx.fill();
  }
  if (enemy === voidBoss || enemy === trueFinalBoss) {
    ctx.fillStyle = enemy === trueFinalBoss ? "#ffd5f6" : "#d9c8ff";
    ctx.beginPath();
    ctx.moveTo(-24, -enemy.size / 2);
    ctx.lineTo(-16, -enemy.size / 2 - 22);
    ctx.lineTo(-5, -enemy.size / 2 - 7);
    ctx.lineTo(0, -enemy.size / 2 - 28);
    ctx.lineTo(8, -enemy.size / 2 - 7);
    ctx.lineTo(20, -enemy.size / 2 - 22);
    ctx.lineTo(25, -enemy.size / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const attackLabel = {
    dash: "突進！",
    smash: "重擊！",
    leap: "跳躍衝撞！",
    ranged: "遠程射擊！",
    shockwave: "裂地震波！",
    dimension: "維度突襲！",
    void: "虛空裂變！",
    author: ({ fan: "扇形彈幕！", lanes: "橫向彈幕！", ring: "環形彈幕！", flip: "畫面翻轉！" })[enemy.attackPattern] || "作者攻擊！",
  }[enemy.attackType];
  const warningText = `${attackLabel || "攻擊！"} ${enemy.attackWindup.toFixed(1)}秒`;
  drawText(enemy.attackWindup > 0 ? warningText : `${enemy.type} HP ${enemy.hp}`, enemy.x, enemy.y - enemy.size / 2 - 8, 12, enemy.attackWindup > 0 ? "#ffdd9b" : "#d99aac", "center");
  if (enemy.attackWindup > 0) {
    const maxWindup = enemy.attackType === "shockwave" ? 1.05
      : enemy.attackType === "author" ? 0.9
      : enemy.attackType === "smash" ? 0.9
      : enemy.attackType === "leap" ? 0.65
      : enemy.attackType === "ranged" ? 0.75
      : enemy.attackType === "dimension" ? 0.5
      : enemy.attackType === "void" ? 0.72
      : enemy.attackType === "dash" ? 0.28
      : 0.55;
    const progress = Math.max(0, Math.min(1, enemy.attackWindup / maxWindup));
    ctx.fillStyle = "#3b2940";
    ctx.fillRect(enemy.x - 30, enemy.y + enemy.size / 2 + 8, 60, 5);
    ctx.fillStyle = "#ffdd9b";
    ctx.fillRect(enemy.x - 30, enemy.y + enemy.size / 2 + 8, 60 * progress, 5);
  }
  });
}

function drawProjectiles() {
  projectiles.forEach((projectile) => {
    drawGlow(projectile.x, projectile.y, 24, projectile.color, 0.55);
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius || 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(projectile.x - 2, projectile.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawParticles() {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 5;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  });
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  floatingTexts.forEach((item) => {
    ctx.globalAlpha = Math.max(0, item.life / item.maxLife);
    drawText(item.text, item.x, item.y, 15, item.color, "center");
  });
  ctx.globalAlpha = 1;
}

function drawRuinCore() {
  if (!state.nextMap || !state.ruinObjectiveComplete) return;
  drawGlow(ruinCore.x, ruinCore.y, 46, "#e7b86b", 0.5);
  ctx.shadowColor = "#e7b86b";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#e7b86b";
  ctx.beginPath();
  ctx.arc(ruinCore.x, ruinCore.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawRuinRunes() {
  if (!state.nextMap || !state.ruinObjectiveComplete) return;
  ruinRunes.forEach((rune) => {
    if (rune.collected) drawGlow(rune.x, rune.y, 44, "#c9a5df", 0.5);
    ctx.shadowColor = rune.collected ? "#c9a5df" : "transparent";
    ctx.shadowBlur = rune.collected ? 14 : 0;
    ctx.fillStyle = rune.collected ? "#f1d5ff" : "#634b75";
    ctx.fillRect(rune.x - 18, rune.y - 18, 36, 36);
    ctx.strokeStyle = "#c9a5df";
    ctx.strokeRect(rune.x - 18, rune.y - 18, 36, 36);
    drawText(rune.glyph, rune.x, rune.y + 6, 17, rune.collected ? "#382444" : "#fff1ff", "center");
    ctx.shadowBlur = 0;
  });
}

function drawSanctumShards() {
  if (!state.sanctumMap || sanctumEnemy.hp > 0) return;
  sanctumShards.forEach((sigil, index) => {
    if (sigil.active) drawGlow(sigil.x, sigil.y, 52, "#f1d78a", 0.48);
    ctx.fillStyle = sigil.active ? "#f1d78a" : "#4d452f";
    ctx.beginPath();
    ctx.arc(sigil.x, sigil.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = sigil.active ? "#fff9d6" : "#8f8051";
    ctx.lineWidth = 3;
    ctx.stroke();
    drawText(String(index + 1), sigil.x, sigil.y + 6, 16, sigil.active ? "#3b3218" : "#d9c58d", "center");
  });
}

function drawFrostSeals() {
  if (!state.frostMap || state.frostDefeated < frostEnemies.length || state.dimension !== "2D") return;
  frostSeals.forEach((seal) => {
    if (seal.collected) return;
    drawGlow(seal.x, seal.y, 46, "#9ee7ff", 0.52);
    ctx.save();
    ctx.translate(seal.x, seal.y);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = "#9ee7ff";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#b9f3ff";
    ctx.fillRect(-13, -13, 26, 26);
    ctx.fillStyle = "#4b9ab6";
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
    drawText("❄", seal.x, seal.y + 6, 16, "#effdff", "center");
  });
}

function drawShards() {
  if (state.dimension !== "2D" || state.nextMap || state.sanctumMap || state.frostMap || state.voidMap) return;
  shards.forEach((shard) => {
    if (shard.collected) return;
    drawGlow(shard.x, shard.y, 38, "#79d3c9", 0.5);
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = "#79d3c9";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#79d3c9";
    ctx.fillRect(-9, -9, 18, 18);
    ctx.fillStyle = "#d1fff5";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    drawText("◆", shard.x, shard.y + 5, 13, "#d1fff5", "center");
  });
}

function getCurrentObjective() {
  if (state.cutscenePhase) return "劇情進行中";
  if (state.elevatorMode) return `電梯第 ${state.elevatorWave} / ${ELEVATOR_TOTAL_WAVES} 波：敵人 ${state.elevatorKills} / ${ELEVATOR_ENEMIES_PER_WAVE}`;
  if (state.arenaRestRoom && state.arenaFinalBossDefeated) return "競技場完成：與挑戰者對話或從中央門返回";
  if (state.arenaRestRoom) return state.playthrough === 2 && state.authorBossDefeated
    ? "休息室：挑戰者對話、商人補給、中央門進三周目"
    : "休息室：挑戰者對話、商人補給、中央門挑戰";
  if (state.arenaMode) return state.arenaBossActive
    ? `競技場第 ${state.arenaWave} / ${ARENA_TOTAL_WAVES} 波：擊敗 Boss`
    : `競技場第 ${state.arenaWave} / ${ARENA_TOTAL_WAVES} 波：敵人 ${state.arenaKillsThisWave} / ${ARENA_ENEMIES_PER_WAVE}`;
  if (state.trueFinalMap) {
    if (!state.trueFinalBossDefeated) return "擊敗維度之源";
    if (!state.authorRevealed) return "前往回歸之門並按 F";
    return state.authorBossDefeated ? "再次前往回歸之門並按 F" : "擊敗真・最終 Boss：作者";
  }
  if (state.worldReturned) return "冒險完成：你已回到正常世界";
  const extra = currentExtraMap();
  if (extra) {
    if (!state.extraEnemyDefeated) return `擊敗 ${extra.enemy.type}`;
    if (extra.boss.hp > 0) return `擊敗 ${extra.boss.type}`;
    if (!extra.exit.unlocked) return `${extra.puzzle}（${state.extraPuzzleCount} / ${extra.nodes}）`;
    return "前往出口並按 F";
  }
  if (state.voidMap) {
    return state.voidBossDefeated ? "前往最終出口並按 F" : "擊敗 Boss：虛空君王";
  }
  if (state.frostMap) {
    if (state.frostDefeated < frostEnemies.length) return `擊敗裂谷敵人（${state.frostDefeated} / ${frostEnemies.length}）`;
    if (state.frostSealCount < frostSeals.length) return `收集寒霜印記（${state.frostSealCount} / ${frostSeals.length}）`;
    return "前往冰封出口並按 F";
  }
  if (state.sanctumMap) {
    if (sanctumEnemy.hp > 0) return "擊敗聖堂守護者";
    if (state.sanctumShardCount < sanctumShards.length) return `點亮所有連動印記（${state.sanctumShardCount} / ${sanctumShards.length}）`;
    return "前往核心聖堂出口並按 F";
  }
  if (state.nextMap) {
    if (!state.ruinObjectiveComplete) return "擊敗遺跡守衛並取得遺跡核心";
    if (state.ruinRuneCount < ruinRunes.length) return `依月 → 星 → 日點亮符文（${state.ruinRuneCount} / ${ruinRunes.length}）`;
    return "前往遺跡出口並按 F";
  }
  if (!state.elderTalked) return "靠近老人並按 F 對話";
  if (state.dialog || state.tutorialStep < 4) return "完成老人的戰鬥教學";
  if (!state.bossPhase) return `擊敗所有敵人（${state.defeatedEnemies} / ${enemies.length}）`;
  if (state.defeatedBosses < bosses.length) return `擊敗小 Boss（${state.defeatedBosses} / ${bosses.length}）`;
  if (state.shardCount < shards.length) return `在 2D 收集維度碎片（${state.shardCount} / ${shards.length}）`;
  return "前往中央維度門並按 F";
}

function drawObjective() {
  const objective = getCurrentObjective();
  const panel = ctx.createLinearGradient(18, 148, 318, 196);
  panel.addColorStop(0, "#0c0e18f2");
  panel.addColorStop(1, "#252139e8");
  ctx.fillStyle = panel;
  ctx.fillRect(18, 148, 300, 48);
  ctx.strokeStyle = "#75603d";
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 148, 300, 48);
  drawText("目前目標", 30, 167, 12, "#f4d18d");
  drawText(objective, 30, 186, 13, "#f4f0df");
}

function drawHud() {
  const hud = ctx.createLinearGradient(0, 0, 0, 74);
  hud.addColorStop(0, "#090b14fa");
  hud.addColorStop(1, "#171a2ae8");
  ctx.fillStyle = hud;
  ctx.fillRect(0, 0, W, 74);
  ctx.fillStyle = state.dimension === "2D" ? "#79d3c9" : "#59618d";
  ctx.fillRect(0, 72, W, 2);
  drawText(`維度：${state.dimension}`, 24, 30, 18, state.dimension === "2D" ? "#79d3c9" : "#c3c8ed");
  const extra = currentExtraMap();
  const mapLabel = state.elevatorMode ? "上升電梯" : state.arenaRestRoom ? "休息室" : state.arenaMode ? "競技場" : state.trueFinalMap ? "維度核心" : extra ? `地圖 ${extra.index + 5}` : state.voidMap ? "地圖 5" : state.frostMap ? "地圖 4" : state.sanctumMap ? "地圖 3" : state.nextMap ? "地圖 2" : "地圖 1";
  drawText(`${mapLabel}${state.playthrough === 4 ? "・四周目" : state.playthrough === 3 ? "・三周目" : state.playthrough === 2 ? "・二周目" : ""}`, 150, 30, 13, state.trueFinalMap ? "#f9a6eb" : state.voidMap ? "#c6a7ff" : state.frostMap ? "#b9f3ff" : state.sanctumMap ? "#f1d78a" : state.nextMap ? "#d8a9d1" : "#9da5d4");
  const ability = state.modeTimer > 0 ? `2D ${Math.ceil(state.modeTimer)}s` : state.cooldown > 0 ? `冷卻 ${Math.ceil(state.cooldown)}s` : "C 可用";
  drawText(ability, 24, 54, 13, "#a8acc2");
  const swordStatus = state.swordCooldown > 0 ? `${state.swordCooldown.toFixed(1)}s` : "可用";
  const shieldStatus = !state.hasShield ? "未取得" : state.shieldCooldown > 0 ? `${state.shieldCooldown.toFixed(1)}s` : "可用";
  drawText(`劍 ${swordStatus}・盾 ${shieldStatus}`, 150, 54, 12, "#a8acc2");
  drawText("HP", 790, 29, 13, "#a8acc2");
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = "#171a27";
    ctx.fillRect(821 + i * 28, 15, 23, 23);
    ctx.fillStyle = i + 1 <= player.hp ? "#ec6c72" : i + 0.5 <= player.hp ? "#f4a06a" : "#393d52";
    ctx.fillRect(823 + i * 28, 17, 19, 19);
    if (i + 1 <= player.hp) {
      ctx.fillStyle = "#ffafb2";
      ctx.fillRect(826 + i * 28, 19, 8, 3);
    }
  }

  const weaponLabel = player.weaponType === "bow" ? "光能弓" : player.weaponType === "staff" ? "虛空法杖" : "劍";
  const equipment = state.hasSword && state.hasShield
    ? `裝備：${weaponLabel}＋盾`
    : state.hasSword ? `武器：${weaponLabel}` : state.hasShield ? "裝備：盾" : "空手";
  drawText(equipment, 790, 56, 13, "#f4d18d");
  drawText(`金錢：${player.money}`, 650, 30, 13, "#f4d18d");
  drawText(`藥水 ${player.potions}・狂戰 ${player.powerPotions}・炸彈 ${player.bombs}`, 360, 54, 12, state.powerTimer > 0 ? "#ffbd69" : "#a8acc2");
  drawText(`羅盤 ${player.compasses}・晶核 ${player.shieldCores}`, 620, 54, 12, "#a8acc2");
  if (state.powerTimer > 0) drawText(`狂戰 ${state.powerTimer.toFixed(1)}s`, 500, 92, 12, "#ffbd69");
  if (state.comboCount > 0) {
    drawText(`連擊：${state.comboCount}（傷害 x${(1 + (state.comboCount - 1) * 0.25).toFixed(2)}）`, 390, 92, 13, "#f4d18d");
  }
  const progress = state.elevatorMode ? `電梯 ${state.elevatorWave} / ${ELEVATOR_TOTAL_WAVES}・${state.elevatorKills} / ${ELEVATOR_ENEMIES_PER_WAVE}`
    : state.arenaRestRoom ? (state.arenaFinalBossDefeated ? "50 波完成" : state.arenaWave === 0 ? "準備挑戰" : `第 ${state.arenaWave} 波完成`)
    : state.arenaMode ? (state.arenaBossActive ? `第 ${state.arenaWave} 波 Boss` : `第 ${state.arenaWave} 波 ${state.arenaKillsThisWave} / ${ARENA_ENEMIES_PER_WAVE}`)
    : state.trueFinalMap ? (!state.trueFinalBossDefeated ? "維度之源" : state.authorRevealed && !state.authorBossDefeated ? "作者" : "回歸之門")
    : extra ? (!state.extraEnemyDefeated ? extra.enemy.type : extra.boss.hp > 0 ? extra.boss.type : extra.puzzle)
    : state.voidMap
    ? "最終 Boss"
    : state.frostMap
      ? `裂谷敵人 ${Math.min(state.frostDefeated + 1, frostEnemies.length)} / ${frostEnemies.length}`
      : state.sanctumMap ? "聖堂守護者"
      : state.nextMap ? "遺跡守衛"
      : state.bossPhase
        ? `小 Boss ${Math.min(state.defeatedBosses + 1, bosses.length)} / ${bosses.length}`
        : `敵人 ${Math.min(state.defeatedEnemies + 1, enemies.length)} / ${enemies.length}`;
  drawText(progress, 390, 30, 13, "#a8acc2");
  if (state.bossRestTimer > 0) {
    drawText(`休息 ${Math.ceil(state.bossRestTimer)} 秒`, 390, 92, 13, "#f4d18d");
  }
  const target = getCombatants().find((combatant) => combatant.active && combatant.hp > 0);
  if (target) {
    drawText(target.type, W / 2, 105, 16, "#f4f0df", "center");
    const targetEnraged = (state.bossPhase && bosses.includes(target) || target === voidBoss || target === trueFinalBoss || target === authorBoss || target === arenaFinalBoss) && target.hp <= target.maxHp / 2;
    if (targetEnraged) {
      drawText("狂暴狀態：攻擊速度提升！", W / 2, 180, 13, "#ff7b83", "center");
    }
    const attackStyle = {
      shockwave: "裂地震波",
      dash: "影襲突進",
      smash: "熔岩重擊",
      dimension: "維度突襲",
      void: "虛空裂變",
      author: "彈幕・畫面翻轉",
    }[target.attackType];
    if (attackStyle) {
      drawText(`攻擊模式：${attackStyle}`, W / 2, 162, 12, "#f4d18d", "center");
    }
    ctx.fillStyle = "#3b2940";
    ctx.fillRect(330, 116, 300, 12);
    ctx.fillStyle = target.type === "遺跡守衛" ? "#a86b9b" : "#ec6c72";
    ctx.fillRect(330, 116, 300 * (target.hp / target.maxHp), 12);
    drawText(`${target.hp} / ${target.maxHp} HP`, W / 2, 145, 12, "#d7d9e8", "center");
  }
  if (isShieldActive()) {
    drawText(`${player.facing < 0 ? "盾牌朝左" : "盾牌朝右"}・${state.shieldTimer.toFixed(1)} 秒`, 24, 92, 13, "#85d7d0");
  }
  if (player.hp < player.maxHp) {
    drawText(`自然回復 ${Math.ceil(state.regenTimer)} 秒`, 640, 92, 12, "#a8acc2");
  }
  drawObjective();
}

function drawTutorial() {
  if (!state.dialog) return;
  const lessons = getElderLessons();
  ctx.fillStyle = "#0c0e18ee";
  ctx.fillRect(150, 390, 660, 92);
  ctx.strokeStyle = "#75603d";
  ctx.strokeRect(150, 390, 660, 92);
  drawText("老人", 174, 418, 14, "#f4d18d");
  drawText(lessons[state.tutorialStep], 174, 448, 16, "#f4f0df");
  drawText("按 F 繼續", 785, 462, 12, "#a8acc2", "right");
}

function drawMerchant() {
  if (state.arenaMode && !state.arenaRestRoom) return;
  ctx.fillStyle = "#07091266";
  ctx.beginPath(); ctx.ellipse(merchant.x, merchant.y + 20, 23, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#4f3550";
  ctx.fillRect(merchant.x - 19, merchant.y - 28, 38, 52);
  ctx.fillStyle = "#8b5e83";
  ctx.fillRect(merchant.x - 16, merchant.y - 25, 32, 46);
  ctx.fillStyle = "#b07da6";
  ctx.fillRect(merchant.x - 12, merchant.y - 21, 24, 5);
  ctx.fillStyle = "#f0c18b";
  ctx.beginPath(); ctx.arc(merchant.x, merchant.y - 31, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#5d3d56";
  ctx.beginPath(); ctx.arc(merchant.x, merchant.y - 37, 18, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#33263a";
  ctx.fillRect(merchant.x - 7, merchant.y - 32, 4, 4);
  ctx.fillRect(merchant.x + 4, merchant.y - 32, 4, 4);
  drawText("商人", merchant.x, merchant.y - 56, 14, "#f4d18d", "center");
}

function drawChallenger() {
  if (!state.arenaRestRoom) return;
  ctx.fillStyle = "#07091266";
  ctx.beginPath(); ctx.ellipse(challenger.x, challenger.y + 20, 23, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#345b84";
  ctx.fillRect(challenger.x - 18, challenger.y - 28, 36, 50);
  ctx.fillStyle = "#5e92bd";
  ctx.fillRect(challenger.x - 14, challenger.y - 23, 28, 39);
  ctx.fillStyle = "#e3ad82";
  ctx.beginPath(); ctx.arc(challenger.x, challenger.y - 34, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#263957";
  ctx.fillRect(challenger.x - 18, challenger.y - 49, 36, 12);
  drawText("挑戰者・按 F", challenger.x, challenger.y - 59, 14, "#b9e5ff", "center");
}

function drawChallengerDialog() {
  if (!state.arenaRestRoom || !state.challengerDialogOpen) return;
  const words = Array.from(getChallengerDialogue().replace(/^挑戰者：/, ""));
  const lines = [words.slice(0, 32).join(""), words.slice(32).join("")].filter(Boolean);
  ctx.save();
  ctx.fillStyle = "#0b1422f2";
  ctx.fillRect(110, 393, 740, 118);
  ctx.strokeStyle = "#8ec8e6";
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 393, 740, 118);
  drawText("挑戰者", 135, 421, 17, "#b9e5ff");
  lines.forEach((line, index) => drawText(line, 135, 450 + index * 25, 16, "#f4f0df"));
  drawText("按 F 關閉", 823, 495, 12, "#a8acc2", "right");
  ctx.restore();
}

function drawCutsceneActor(x, y, color, label) {
  ctx.fillStyle = "#080b14aa";
  ctx.beginPath(); ctx.ellipse(x, y + 22, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(x - 19, y - 33, 38, 56);
  ctx.fillStyle = "#e3ad82";
  ctx.beginPath(); ctx.arc(x, y - 42, 17, 0, Math.PI * 2); ctx.fill();
  drawText(label, x, y - 72, 15, "#f4f0df", "center");
}

function drawArenaFinale() {
  const phase = state.cutscenePhase;
  ctx.save();
  ctx.fillStyle = phase === "light" ? "#151f37" : "#171524";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#343b55";
  ctx.fillRect(0, 390, W, 150);
  ctx.fillStyle = "#8f9ab1";
  ctx.fillRect(0, 387, W, 5);
  ctx.fillStyle = "#313c58";
  ctx.fillRect(125, 175, 215, 220);
  ctx.strokeStyle = "#91a8c6";
  ctx.lineWidth = 7;
  ctx.strokeRect(125, 175, 215, 220);
  ctx.fillStyle = "#101929";
  ctx.fillRect(145, 195, 175, 190);
  if (phase === "light") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(145, 175, 175, 15);
    ctx.fillStyle = "#fff3b966";
    ctx.beginPath(); ctx.moveTo(145, 185); ctx.lineTo(320, 185);
    ctx.lineTo(400, 390); ctx.lineTo(65, 390); ctx.closePath(); ctx.fill();
    drawCutsceneActor(230, 370, player.shirtColor, "主角");
    drawText("電梯抵達頂端", W / 2, 100, 32, "#fff2b5", "center");
  } else {
    const pushing = phase === "push" ? 1 - state.cutsceneTimer / 3 : 0;
    const protagonistX = phase === "author" ? 480 : phase === "push" ? 480 - 255 * pushing : 225;
    drawCutsceneActor(protagonistX, 370, player.shirtColor, "主角");
    if (phase !== "author") drawCutsceneActor(phase === "push" ? 365 - 105 * pushing : 485, 370, "#5e92bd", "挑戰者");
    drawCutsceneActor(725, 370, "#77508d", "作者");
    ctx.strokeStyle = "#d270e9";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(725, 300, 58, 0, Math.PI * 2); ctx.stroke();
    drawText(phase === "author" ? "作者再次現身" : phase === "push" ? "挑戰者把主角推進電梯" : "挑戰者獨自面對作者", W / 2, 103, 29, "#ffd4ef", "center");
  }
  ctx.fillStyle = "#090c19ec";
  ctx.fillRect(110, 440, 740, 74);
  ctx.strokeStyle = "#d7aedc";
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 440, 740, 74);
  drawText(phase === "author" ? "作者：「你以為你能殺死我？」"
    : phase === "push" ? "挑戰者：「快進電梯！這裡交給我。」"
    : phase === "stand" ? "挑戰者：「你先走。這次換我獨自面對作者。」"
    : "上方的光照向主角，新的輪迴即將開始。", W / 2, 484, 19, "#f4f0df", "center");
  ctx.restore();
}

function draw() {
  if (state.cutscenePhase) {
    drawArenaFinale();
    return;
  }
  ctx.save();
  if (state.trueFinalMap && state.authorRevealed && !state.authorBossDefeated && state.screenFlipTimer > 0) {
    ctx.translate(W, H);
    ctx.rotate(Math.PI);
  }
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }
  drawBackground();
  drawShards();
  drawElder();
  drawChallenger();
  drawEnemy();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
  drawRuinCore();
  drawRuinRunes();
  drawSanctumShards();
  drawFrostSeals();
  drawMerchant();
  drawCharacter();
  drawHud();
  drawTutorial();
  drawChallengerDialog();
  if (state.paused && !state.gameOver) {
    ctx.fillStyle = "#080912b8";
    ctx.fillRect(0, 0, W, H);
    drawText("遊戲暫停", W / 2, H / 2 - 12, 38, "#f4d18d", "center");
    drawText("按 P 繼續冒險", W / 2, H / 2 + 28, 17, "#f4f0df", "center");
  }
  ctx.restore();
  if (state.trueFinalMap && state.authorIntroTimer > 0) {
    ctx.fillStyle = "#100d20ee";
    ctx.fillRect(135, 380, 690, 105);
    ctx.strokeStyle = "#ffd28a";
    ctx.strokeRect(135, 380, 690, 105);
    drawText("老人現出作者身分，鎖上回歸之門！", W / 2, 418, 20, "#ffd28a", "center");
    drawText("我是作者，你只是個工具人。", W / 2, 455, 18, "#f4f0df", "center");
  }
  if (state.trueFinalMap && state.authorRevealed && state.screenFlipTimer > 0) {
    drawText(`作者翻轉畫面・${state.screenFlipTimer.toFixed(1)} 秒`, W / 2, H - 16, 15, "#ffd28a", "center");
  }
  if (state.worldReturned && !state.arenaMode) {
    ctx.fillStyle = "#102b24dd";
    ctx.fillRect(0, 0, W, H);
    drawText("返回正常世界", W / 2, H / 2 - 16, 38, "#8ce0b0", "center");
    drawText(state.authorBossDefeated ? "作者已被擊敗・真正回到正常世界" : state.voidBossDefeated ? "十一張地圖全部完成・終焉核心已重啟" : "冒險完成", W / 2, H / 2 + 24, 16, "#f4f0df", "center");
    if (state.playthrough === 2 && state.authorBossDefeated) drawText("按 F 或 Enter 進入競技場，擊敗第 5 波 Boss 前往休息室", W / 2, H / 2 + 57, 15, "#b8ffe1", "center");
  }
  if (state.gameOver) {
    ctx.fillStyle = "#080912e8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#171a2a";
    ctx.fillRect(230, 175, 500, 190);
    ctx.strokeStyle = "#a85c6e";
    ctx.lineWidth = 2;
    ctx.strokeRect(230, 175, 500, 190);
    drawText("遊戲結束", W / 2, 235, 38, "#ff9b9f", "center");
    drawText("HP 已歸零", W / 2, 275, 18, "#f4f0df", "center");
    drawText(state.arenaMode ? "按 X 返回正常世界" : "按 X 或下方按鈕重新開始", W / 2, 318, 16, "#f4d18d", "center");
  }

}

function loop(now) {
  const dt = Math.min(0.05, (now - state.lastTime) / 1000);
  state.lastTime = now;
  update(dt);
  draw();
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (state.cutscenePhase) {
    if (["a", "w", "d", "s", "f", "x", "c", "e"].includes(key)) event.preventDefault();
    return;
  }
  if (!event.repeat && ["a", "w", "d", "s"].includes(key)) {
    state.secretBuffer = `${state.secretBuffer || ""}${key.toUpperCase()}`.slice(-SECRET_BUFFER_LENGTH);
    if (state.secretBuffer.endsWith(SECRET_SEQUENCE)) {
      state.secretBuffer = "";
      startSecondPlaythrough();
      event.preventDefault();
      return;
    }
    if (state.secretBuffer.endsWith(THIRD_SEQUENCE)) {
      state.secretBuffer = "";
      jumpToThirdPlaythroughGate();
      event.preventDefault();
      return;
    }
    if (state.secretBuffer.endsWith(ARENA_FIFTY_SEQUENCE)) {
      state.secretBuffer = "";
      jumpToArenaWave50();
      event.preventDefault();
      return;
    }
    if (!gameContent.hidden && state.secretBuffer.endsWith(MONEY_SEQUENCE)) {
      state.secretBuffer = "";
      player.money += 200000;
      setMessage("密技成功！獲得 200,000 金。");
      saveGame(false);
      event.preventDefault();
      return;
    }
  }
  if (gameContent.hidden) return;
  if (key === "x") {
    event.preventDefault();
    if (!event.repeat) {
      if (state.elevatorMode) restartElevatorAfterDeath();
      else if (state.arenaMode) exitArenaMode();
      else resetGame();
    }
    return;
  }
  if (key === "p") {
    event.preventDefault();
    if (!event.repeat) {
      state.paused = !state.paused;
      keys.clear();
      setMessage(state.paused ? "遊戲已暫停，按 P 繼續。" : "遊戲繼續。注意敵人的攻擊警示！");
    }
    return;
  }
  if ((key === "enter" || key === "return") && state.worldReturned && !state.arenaMode) {
    event.preventDefault();
    enterArenaMode();
    return;
  }
  if (state.gameOver) return;
  if (state.paused) return;
  if (key === "e") {
    event.preventDefault();
    if (!event.repeat) activateShield();
    return;
  }
  keys.add(key);
  if (["a", "d", "w", "s", "e", "c", "f", "g", "r", "t", "q", "z", "b", "p"].includes(key)) event.preventDefault();
  if (event.repeat) return;
  if (key === "c") switchDimension();
  const extra = currentExtraMap();
  const nearElder = !state.nextMap && !state.sanctumMap && !state.frostMap && !state.voidMap && !state.trueFinalMap && !extra && !state.arenaMode && distanceToElder() < 90;
  const nearGate = state.dimension === "2D" && Math.hypot(player.x - dimensionGate.x, player.y - dimensionGate.y) < 85;
  const nearRuinExit = state.nextMap && Math.hypot(player.x - ruinExit.x, player.y - ruinExit.y) < 85;
  const nearSanctumExit = state.sanctumMap && Math.hypot(player.x - sanctumExit.x, player.y - sanctumExit.y) < 85;
  const nearFrostExit = state.frostMap && Math.hypot(player.x - frostExit.x, player.y - frostExit.y) < 85;
  const nearVoidExit = state.voidMap && Math.hypot(player.x - voidExit.x, player.y - voidExit.y) < 85;
  const nearExtraExit = extra && Math.hypot(player.x - extra.exit.x, player.y - extra.exit.y) < 85;
  const nearTrueFinalExit = state.trueFinalMap && Math.hypot(player.x - trueFinalExit.x, player.y - trueFinalExit.y) < 85;
  const nearArena = state.worldReturned && !state.arenaMode;
  const nearThirdGate = state.arenaRestRoom && state.playthrough === 2 && state.authorBossDefeated
    && Math.hypot(player.x - thirdPlaythroughGate.x, player.y - thirdPlaythroughGate.y) < 85;
  const nearArenaContinue = state.arenaRestRoom && !(state.playthrough === 2 && state.authorBossDefeated)
    && Math.hypot(player.x - arenaContinueGate.x, player.y - arenaContinueGate.y) < 85;
  const nearChallenger = state.arenaRestRoom
    && Math.hypot(player.x - challenger.x, player.y - challenger.y) < 85;
  if (key === "f") {
    if (state.challengerDialogOpen || nearElder || nearGate || nearRuinExit || nearSanctumExit || nearFrostExit || nearVoidExit || nearExtraExit || nearTrueFinalExit || nearArena || nearThirdGate || nearArenaContinue || nearChallenger) interact();
    else if ((!state.arenaMode || state.arenaRestRoom) && distanceToMerchant() < 90) toggleShop();
  }
  if (key === "g" && (!state.arenaMode || state.arenaRestRoom) && distanceToMerchant() < 90) toggleBetting();
  if (key === "r" && player.potions > 0 && player.hp < player.maxHp) {
    player.potions -= 1;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    player.potionTimer = 0.55;
    player.action = "potion";
    player.actionTimer = 0.55;
    emitParticles(player.x, player.y - 18, "#82e6a7", 12, 2.2);
    setMessage("你使用生命藥水，恢復 1 HP。");
  }
  if (key === "t") useSpecialItem("power");
  if (key === "q") useSpecialItem("bomb");
  if (key === "z") useSpecialItem("compass");
  if (key === "b") useSpecialItem("core");
});
document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
canvas.addEventListener("mousedown", (event) => {
  canvas.focus();
  if (state.paused) return;
  if (event.button === 0) attackOrParry();
});
canvas.addEventListener("click", () => {
  canvas.focus();
  if (state.worldReturned && !state.arenaMode) enterArenaMode();
});
document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const press = (event) => {
    event.preventDefault();
    if (control === "e") {
      activateShield();
      return;
    }
    if (["attack", "c", "f"].includes(control)) return;
    keys.add(control);
  };
  const release = (event) => {
    event.preventDefault();
    keys.delete(control);
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    if (control === "attack") attackOrParry();
    if (control === "c") switchDimension();
    if (control === "f") interact();
  });
});
bodyColorInput.addEventListener("input", () => {
  state.bodyColor = bodyColorInput.value;
  setMessage("身體顏色已更新。");
});
eyeColorInput.addEventListener("input", () => {
  state.eyeColor = eyeColorInput.value;
  setMessage("眼睛顏色已更新。");
});
pantsColorInput.addEventListener("input", () => {
  player.pantsColor = pantsColorInput.value;
  setMessage("褲子顏色已更新。");
});
shirtColorInput.addEventListener("input", () => {
  player.shirtColor = shirtColorInput.value;
  setMessage("衣服顏色已更新。");
});
hatInput.addEventListener("change", () => {
  player.hat = hatInput.checked;
  setMessage(player.hat ? "已戴上帽子。" : "已取下帽子。");
});
beardInput.addEventListener("change", () => {
  player.beard = beardInput.checked;
  setMessage(player.beard ? "已留上鬍子。" : "已刮掉鬍子。");
});
glassesInput.addEventListener("change", () => {
  player.glasses = glassesInput.checked;
  setMessage(player.glasses ? "已戴上眼鏡。" : "已取下眼鏡。");
});
shop.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) buyItem(button.dataset.item);
});
betting.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) placeBet(button.dataset.guess);
});
restartButton.addEventListener("click", () => {
  if (state.cutscenePhase) return;
  if (state.elevatorMode) restartElevatorAfterDeath();
  else if (state.arenaMode) exitArenaMode();
  else resetGame();
});
loadSaveButton.addEventListener("click", loadGame);
clearSaveButton.addEventListener("click", clearSave);
startGameButton.addEventListener("click", startNewGame);
startFourthButton.addEventListener("click", enterFourthPlaythrough);
menuLoadSaveButton.addEventListener("click", () => {
  let hasSave = false;
  try {
    hasSave = Boolean(localStorage.getItem(SAVE_KEY));
  } catch (error) {
    setMessage("無法讀取進度，請檢查瀏覽器儲存權限。");
    return;
  }
  if (hasSave) {
    playSound(420, 0.1, "triangle");
    showGame();
    loadGame();
  } else {
    setMessage("目前沒有存檔，請先開始新遊戲。");
  }
});
menuSoundEnabledInput.addEventListener("change", saveAudioSettings);
menuVolumeInput.addEventListener("input", saveAudioSettings);
soundEnabledInput.addEventListener("change", () => {
  audioSettings.enabled = soundEnabledInput.checked;
  menuSoundEnabledInput.checked = audioSettings.enabled;
  saveAudioSettings();
});
volumeInput.addEventListener("input", () => {
  audioSettings.volume = Number(volumeInput.value);
  menuVolumeInput.value = volumeInput.value;
  saveAudioSettings();
});
loadAudioSettings();
refreshFourthMenu();

setInterval(() => loop(performance.now()), 16);
