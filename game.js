const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
canvas.tabIndex = 0;
const message = document.querySelector("#message");
const bodyColorInput = document.querySelector("#body-color");
const eyeColorInput = document.querySelector("#eye-color");
const shop = document.querySelector("#shop");
const betting = document.querySelector("#betting");
const betAmountInput = document.querySelector("#bet-amount");
const restartButton = document.querySelector("#restart");
const loadSaveButton = document.querySelector("#load-save");
const clearSaveButton = document.querySelector("#clear-save");
const mainMenu = document.querySelector("#main-menu");
const gameContent = document.querySelector("#game-content");
const startGameButton = document.querySelector("#start-game");
const menuLoadSaveButton = document.querySelector("#menu-load-save");
const menuBodyColorInput = document.querySelector("#menu-body-color");
const menuEyeColorInput = document.querySelector("#menu-eye-color");
const menuSoundEnabledInput = document.querySelector("#menu-sound-enabled");
const menuVolumeInput = document.querySelector("#menu-volume");
const soundEnabledInput = document.querySelector("#sound-enabled");
const volumeInput = document.querySelector("#volume");
const SAVE_KEY = "pixel-odyssey-2d-save";
const AUDIO_SETTINGS_KEY = "pixel-odyssey-2d-audio";
const audioSettings = { enabled: true, volume: 0.6 };

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const projectiles = [];
const particles = [];
const floatingTexts = [];
let audioContext;
let screenShake = 0;
const player = { x: 150, y: 370, size: 30, speed: 3.2, hp: 3, maxHp: 3, facing: 1, money: 0, armor: false, weaponLevel: 1, potions: 0 };
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
  { x: 220, y: 180, collected: false },
  { x: 420, y: 120, collected: false },
  { x: 680, y: 180, collected: false },
];
const ruinExit = { x: 900, y: 370, unlocked: false };
const sanctumExit = { x: 900, y: 370, unlocked: false };
const sanctumShards = [
  { x: 240, y: 160, collected: false },
  { x: 520, y: 280, collected: false },
  { x: 760, y: 150, collected: false },
];
const sanctumEnemy = { type: "聖堂守護者", color: "#d5b35c", x: 580, y: 370, size: 44, hp: 9, maxHp: 9, speed: 0.65, range: 105, cooldown: 1.4, startX: 580, startY: 370, active: false, attackCooldown: 1.4, attackWindup: 0, stunned: 0, hitFlash: 0 };
const ruinEnemy = { type: "遺跡守衛", color: "#a86b9b", x: 600, y: 370, size: 36, hp: 6, maxHp: 6, speed: 0.7, range: 92, cooldown: 1.5, startX: 600, startY: 370, active: false, attackCooldown: 1.5, attackWindup: 0, stunned: 0, hitFlash: 0 };
const enemies = [
  { type: "追獵者", attackType: "melee", color: "#b54868", x: 390, y: 370, size: 28, hp: 3, maxHp: 3, speed: 1.05, range: 78, cooldown: 1.5, damage: 1 },
  { type: "迅捷者", attackType: "dash", color: "#d77b45", x: 500, y: 370, size: 23, hp: 2, maxHp: 2, speed: 1.75, range: 65, cooldown: 1.1, damage: 1 },
  { type: "巨岩", attackType: "smash", color: "#7e769f", x: 610, y: 370, size: 42, hp: 5, maxHp: 5, speed: 0.48, range: 88, cooldown: 2.2, damage: 1.5 },
  { type: "跳躍者", attackType: "leap", color: "#5eaf91", x: 280, y: 370, size: 26, hp: 3, maxHp: 3, speed: 0.8, range: 72, cooldown: 1.7, damage: 1 },
  { type: "遠射者", attackType: "ranged", color: "#b6a34d", x: 770, y: 370, size: 25, hp: 2, maxHp: 2, speed: 0.35, range: 220, cooldown: 2.4, damage: 1 },
].map((enemy) => ({ ...enemy, startX: enemy.x, startY: enemy.y, active: false, attackCooldown: enemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 }));
const bosses = [
  { type: "裂地守衛", attackType: "shockwave", color: "#8e5caa", x: 480, y: 370, size: 48, hp: 8, maxHp: 8, speed: 0.55, range: 220, cooldown: 2.4, damage: 1 },
  { type: "幽影獵手", attackType: "dash", color: "#4e82b8", x: 480, y: 370, size: 38, hp: 7, maxHp: 7, speed: 1.05, range: 125, cooldown: 1.35, damage: 1 },
  { type: "熔岩巨像", attackType: "smash", color: "#c05d3d", x: 480, y: 370, size: 55, hp: 10, maxHp: 10, speed: 0.4, range: 115, cooldown: 2.2, damage: 1.5 },
  { type: "維度之王", attackType: "dimension", color: "#d1a647", x: 480, y: 370, size: 62, hp: 12, maxHp: 12, speed: 0.7, range: 150, cooldown: 1.5, damage: 1 },
].map((boss) => ({ ...boss, startX: boss.x, startY: boss.y, active: false, attackCooldown: boss.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0 }));
const state = {
  bodyColor: bodyColorInput.value,
  eyeColor: eyeColorInput.value,
  dimension: "1D",
  hasSword: true,
  hasShield: false,
  elderTalked: false,
  dialog: false,
  tutorialStep: 0,
  attackTimer: 0,
  comboCount: 0,
  comboTimer: 0,
  shieldTimer: 0,
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
  sanctumShardCount: 0,
  regenTimer: 5,
  lastTime: performance.now(),
  notice: "前往老人身邊，按 F 開始對話。",
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
    },
    shards: shards.map((shard) => shard.collected),
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
    Object.assign(player, save.player);
    Object.assign(state, save.state, { gameOver: false, dialog: false, attackTimer: 0, shieldTimer: 0, comboCount: 0, comboTimer: 0, lastTime: performance.now() });
    state.bodyColor = player.bodyColor || state.bodyColor;
    state.eyeColor = player.eyeColor || state.eyeColor;
    bodyColorInput.value = state.bodyColor;
    eyeColorInput.value = state.eyeColor;
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
    state.ruinRuneCount = Number.isFinite(save.state.ruinRuneCount) ? save.state.ruinRuneCount : 0;
    ruinRunes.forEach((rune, index) => { rune.collected = index < state.ruinRuneCount; });
    ruinExit.unlocked = state.ruinRuneCount === ruinRunes.length;
    state.sanctumMap = Boolean(save.state.sanctumMap);
    state.sanctumShardCount = Number.isFinite(save.state.sanctumShardCount) ? save.state.sanctumShardCount : 0;
    sanctumShards.forEach((shard, index) => { shard.collected = index < state.sanctumShardCount; });
    sanctumExit.unlocked = state.sanctumShardCount === sanctumShards.length;
    projectiles.length = 0;
    enemies.forEach((enemy) => { enemy.active = false; });
    bosses.forEach((boss) => { boss.active = false; });
    ruinEnemy.active = Boolean(state.nextMap && !state.ruinObjectiveComplete && ruinEnemy.hp > 0);
    sanctumEnemy.active = Boolean(state.sanctumMap && sanctumEnemy.hp > 0);
    if (state.sanctumMap || state.worldReturned) {
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
    const savedDate = save.savedAt ? new Date(save.savedAt) : null;
    const savedLabel = savedDate && !Number.isNaN(savedDate.getTime())
      ? savedDate.toLocaleString()
      : "未知時間";
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
    setMessage("存檔已清除。");
  } catch (error) {
    setMessage("無法清除存檔，請檢查瀏覽器儲存權限。");
  }
}

function resetGame() {
  Object.assign(player, { x: 150, y: 370, hp: 3, maxHp: 3, facing: 1, money: 0, armor: false, weaponLevel: 1, potions: 0 });
  Object.assign(state, {
    dimension: "1D", hasSword: true, hasShield: false, elderTalked: false, dialog: false,
    tutorialStep: 0, attackTimer: 0, shieldTimer: 0, comboCount: 0, comboTimer: 0, modeTimer: 0, cooldown: 0,
    gameOver: false, defeatedEnemies: 0, defeatedBosses: 0, bossPhase: false,
    worldReturned: false, nextMap: false, shardCount: 0, bossRestTimer: 0,
    regenTimer: 5, lastTime: performance.now(),
    ruinObjectiveComplete: false,
    ruinRuneCount: 0,
    sanctumMap: false, sanctumShardCount: 0,
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
  ruinRunes.forEach((rune) => { rune.collected = false; });
  ruinExit.unlocked = false;
  sanctumExit.unlocked = false;
  sanctumShards.forEach((shard) => { shard.collected = false; });
  Object.assign(sanctumEnemy, {
    x: sanctumEnemy.startX, y: sanctumEnemy.startY, hp: sanctumEnemy.maxHp, active: false,
    attackCooldown: sanctumEnemy.cooldown, attackWindup: 0, stunned: 0, hitFlash: 0,
  });
  keys.clear();
  projectiles.length = 0;
  particles.length = 0;
  floatingTexts.length = 0;
  shop.hidden = true;
  betting.hidden = true;
  setMessage("遊戲已重新開始。前往老人身邊，按 F 開始對話。");
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
  showGame();
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
  const prices = { armor: 30, potion: 20, weapon: 50 };
  const names = { armor: "防具", potion: "生命藥水", weapon: "強化武器" };
  if (player.money < prices[item]) {
    setMessage(`${names[item]}需要 ${prices[item]} 金，你目前只有 ${player.money} 金。`);
    return;
  }
  player.money -= prices[item];
  if (item === "armor") {
    player.armor = true;
    setMessage("你買下防具，受到的傷害會降低。");
  } else if (item === "potion") {
    player.potions += 1;
    setMessage("你買下生命藥水，按 P 使用。");
  } else {
    player.weaponLevel += 1;
    setMessage("武器強化成功，劍的傷害提升！");
  }
}

function switchDimension() {
  if (state.gameOver || state.worldReturned || state.dialog) return;
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
  if (state.dimension !== "2D") return;
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
  if (!state.nextMap) return;
  ruinRunes.forEach((rune) => {
    if (!rune.collected && Math.hypot(player.x - rune.x, player.y - rune.y) < 32) {
      rune.collected = true;
      state.ruinRuneCount += 1;
      playSound(700, 0.1, "sine");
      setMessage(`取得遺跡符文 ${state.ruinRuneCount} / ${ruinRunes.length}。`);
    }
  });
  if (state.ruinRuneCount === ruinRunes.length && !ruinExit.unlocked) {
    ruinExit.unlocked = true;
    setMessage("三枚遺跡符文共鳴，遺跡出口已解鎖！");
  }
}

function collectSanctumShards() {
  if (!state.sanctumMap) return;
  sanctumShards.forEach((shard) => {
    if (!shard.collected && Math.hypot(player.x - shard.x, player.y - shard.y) < 32) {
      shard.collected = true;
      state.sanctumShardCount += 1;
      playSound(760, 0.1, "sine");
      setMessage(`取得核心碎片 ${state.sanctumShardCount} / ${sanctumShards.length}。`);
    }
  });
  if (state.sanctumShardCount === sanctumShards.length && !sanctumExit.unlocked) {
    sanctumExit.unlocked = true;
    setMessage("核心碎片共鳴，核心聖堂出口已解鎖！");
  }
}

function interact() {
  if (state.sanctumMap) {
    if (sanctumExit.unlocked && Math.hypot(player.x - sanctumExit.x, player.y - sanctumExit.y) < 85) {
      state.sanctumMap = false;
      state.worldReturned = true;
      projectiles.length = 0;
      sanctumEnemy.active = false;
      setMessage("你離開核心聖堂，回到了正常世界！");
    } else if (!sanctumExit.unlocked) {
      setMessage("核心聖堂出口鎖定中，先收集三枚核心碎片。");
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
      player.x = 120;
      player.y = 370;
      setMessage("你穿過遺跡出口，抵達第三張地圖：核心聖堂。");
    } else if (!ruinExit.unlocked) {
      setMessage("遺跡出口鎖定中，先收集三枚遺跡符文。");
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
    setMessage("老人：先學會這個世界的規則吧。按 F 繼續。");
    return;
  }
  if (state.dialog && state.tutorialStep < 4) {
    state.tutorialStep += 1;
    const lessons = [
      "",
      "老人：先學會這個世界的規則吧。按 F 繼續。",
      "老人：A / D 可以左右移動，滑鼠左鍵可以使用劍。按 F 繼續。",
      "老人：按住 E 可以舉盾，防禦時按滑鼠左鍵可以盾反。按 F 繼續。",
      "老人：按 C 進入 2D 維度，使用 W / A / S / D 探索。現在收下盾牌吧！",
    ];
    setMessage(lessons[state.tutorialStep]);
    if (state.tutorialStep === 4) {
      state.hasShield = true;
      enemies[0].active = true;
      state.dialog = false;
      setMessage("你取得盾牌，劍也仍然保留。第一個敵人出現了！");
    }
    return;
  }
  if (!state.hasShield) {
    state.hasShield = true;
    enemies[0].active = true;
    state.dialog = false;
    setMessage("你取得盾牌，劍也仍然保留。第一個敵人出現了！");
  } else {
    setMessage("老人：熟練切換維度，才能找回正常世界。");
  }
}

function attackOrParry() {
  if (state.gameOver || state.worldReturned) return;
  if (state.hasShield && keys.has("e")) {
    state.comboCount = 0;
    state.comboTimer = 0;
    state.shieldTimer = 0.35;
    const target = getCombatants().find((enemy) =>
      enemy.active && enemy.attackWindup > 0 && distanceToEnemy(enemy) < 115 && shieldFacesEnemy(enemy)
    );
    if (target) {
      target.attackWindup = 0;
      target.stunned = 1.2;
      target.x += player.x < target.x ? 75 : -75;
      emitParticles(target.x, target.y, "#85d7d0", 14, 3.2);
      emitFloatingText("盾反！", target.x, target.y - target.size, "#85d7d0");
      screenShake = 0.18;
      playSound(180, 0.14, "triangle");
      setMessage(`盾反成功！${target.type} 的攻擊被擋下並擊退。`);
    } else {
      setMessage("盾反姿態！請在敵人亮起警示時按左鍵。");
    }
    return;
  }
  if (!state.hasSword) {
    setMessage("你沒有武器，先向老人換取盾牌。");
    return;
  }
  state.attackTimer = 0.22;
  playSound(420, 0.06);
  const target = getCombatants().find((enemy) =>
    enemy.active && enemy.hp > 0 && distanceToEnemy(enemy) < 88 && attackFacesEnemy(enemy)
  );
  if (target) {
    state.comboCount = state.comboTimer > 0 ? Math.min(4, state.comboCount + 1) : 1;
    state.comboTimer = 1.15;
    const comboMultiplier = 1 + (state.comboCount - 1) * 0.25;
    const damage = player.weaponLevel * comboMultiplier;
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
  if (state.sanctumMap) return [sanctumEnemy];
  if (state.nextMap) return [ruinEnemy];
  return state.bossPhase ? bosses : enemies;
}

function shieldFacesEnemy(enemy) {
  const horizontalDirection = Math.sign(enemy.x - player.x);
  return horizontalDirection === 0 || horizontalDirection === player.facing;
}

function attackFacesEnemy(enemy) {
  const horizontalDirection = Math.sign(enemy.x - player.x);
  return horizontalDirection === 0 || horizontalDirection === player.facing;
}

function updateEnemy(enemy, dt) {
  if (!enemy.active || enemy.hp <= 0) return;
  const attackType = enemy.attackType || "melee";
  const attackDamage = enemy.damage || 1;
  const enraged = state.bossPhase && bosses.includes(enemy) && enemy.hp <= enemy.maxHp / 2;
  const cooldown = enraged ? enemy.cooldown * 0.65 : enemy.cooldown;
  enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
  enemy.stunned = Math.max(0, enemy.stunned - dt);
  if (enemy.stunned > 0) return;
  const dx = player.x - enemy.x;
  const dy = state.dimension === "2D" ? player.y - enemy.y : 0;
  const distance = Math.hypot(dx, dy);
  const movement = Math.sign(dx);
  if (distance > (attackType === "ranged" || attackType === "shockwave" ? 185 : 64)) {
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
      if (attackType === "ranged") {
        projectiles.push({ x: enemy.x, y: enemy.y, vx: Math.sign(player.x - enemy.x) * 4.5, vy: state.dimension === "2D" ? Math.sign(player.y - enemy.y) * 2 : 0, damage: attackDamage, color: enemy.color });
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
          });
        });
        screenShake = 0.28;
        playSound(55, 0.2, "square");
        setMessage(`${enemy.type} 釋放了裂地震波！`);
      } else {
        if (attackType === "dash") {
          enemy.x += Math.sign(player.x - enemy.x) * 90;
        } else if (attackType === "dimension") {
          enemy.x = player.x + (player.x < W / 2 ? 170 : -170);
          if (state.dimension === "2D") enemy.y = player.y;
          enemy.x = Math.max(55, Math.min(W - 55, enemy.x));
          playSound(260, 0.18, "triangle");
        } else if (attackType === "leap") {
          enemy.x += Math.sign(player.x - enemy.x) * 120;
          if (state.dimension === "2D") enemy.y = player.y;
        }
        if (!(state.hasShield && keys.has("e") && shieldFacesEnemy(enemy))) {
          player.hp = Math.max(0, player.hp - (player.armor ? attackDamage * 0.5 : attackDamage));
          emitParticles(player.x, player.y, "#ff6b6b", 12, 2.8);
          emitFloatingText(`-${attackDamage}`, player.x, player.y - 28, "#ff6b6b");
          screenShake = attackType === "smash" ? 0.3 : attackType === "dimension" ? 0.22 : 0.18;
          playSound(attackType === "smash" ? 70 : 90, 0.16, "sawtooth");
          if (player.hp <= 0) {
            state.gameOver = true;
            keys.clear();
            state.attackTimer = 0;
            state.shieldTimer = 0;
            setMessage("HP 歸零，遊戲結束。請重新整理頁面再試一次。");
          } else {
            setMessage(`${enemy.type} 擊中你！`);
          }
        } else {
          setMessage(`${enemy.type} 的攻擊被盾牌擋住了！`);
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
      : attackType === "smash" ? 0.9
      : attackType === "leap" ? 0.65
      : attackType === "ranged" ? 0.75
      : attackType === "shockwave" ? 1.05
      : attackType === "dimension" ? 0.5
      : 0.55;
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
    if (Math.hypot(player.x - projectile.x, player.y - projectile.y) < 24) {
      if (!(state.hasShield && keys.has("e") && player.facing === (projectile.vx < 0 ? -1 : 1))) {
        player.hp = Math.max(0, player.hp - (player.armor ? projectile.damage * 0.5 : projectile.damage));
        emitParticles(player.x, player.y, "#ff6b6b", 12, 2.8);
        emitFloatingText(`-${projectile.damage}`, player.x, player.y - 28, "#ff6b6b");
        setMessage(player.hp > 0 ? "遠程攻擊命中你！" : "HP 歸零，遊戲結束。請重新整理頁面再試一次。");
        if (player.hp <= 0) {
          state.gameOver = true;
          keys.clear();
        }
      } else {
        setMessage("盾牌擋住了遠程攻擊！");
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

function update(dt) {
  if (state.gameOver || state.worldReturned) return;
  const horizontal = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
  const vertical = state.dimension === "2D"
    ? (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0)
    : 0;
  if (horizontal !== 0) player.facing = horizontal;
  player.x += horizontal * player.speed * 60 * dt;
  player.y += vertical * player.speed * 60 * dt;
  player.x = Math.max(55, Math.min(W - 55, player.x));
  player.y = state.dimension === "1D" ? 370 : Math.max(95, Math.min(H - 90, player.y));
  collectShards();
  collectRuinRunes();
  collectSanctumShards();

  state.attackTimer = Math.max(0, state.attackTimer - dt);
  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer === 0) state.comboCount = 0;
  state.shieldTimer = Math.max(0, state.shieldTimer - dt);
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
  const activeEnemy = state.sanctumMap ? sanctumEnemy
    : state.nextMap ? ruinEnemy
    : state.bossPhase && state.bossRestTimer <= 0
    ? bosses[state.defeatedBosses]
    : !state.bossPhase ? enemies[state.defeatedEnemies] : null;
  if (activeEnemy) {
    updateEnemy(activeEnemy, dt);
    if (state.sanctumMap && sanctumEnemy.hp <= 0) {
      sanctumEnemy.active = false;
      setMessage("聖堂守護者已被擊敗！現在可以收集核心碎片。");
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
  updateProjectiles(dt);
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
      state.cooldown = 20;
      setMessage("2D 維度結束，回到 1D。C 冷卻中，還需 20 秒。");
    }
  } else if (state.cooldown > 0) {
    state.cooldown = Math.max(0, state.cooldown - dt);
  }
}

function drawText(text, x, y, size = 16, color = "#f4f0df", align = "left") {
  ctx.font = `${size}px "Microsoft JhengHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawBackground() {
  const twoD = state.dimension === "2D";
  ctx.fillStyle = state.sanctumMap ? "#30291b" : state.nextMap ? "#2b2634" : twoD ? "#122c35" : "#171a2a";
  ctx.fillRect(0, 0, W, H);
  if (state.sanctumMap) {
    drawText("第三張地圖：核心聖堂", 24, 105, 14, "#f1d78a");
    drawText("擊敗聖堂守護者並收集核心碎片", 24, 130, 13, "#d9c58d");
    drawText(`核心碎片：${state.sanctumShardCount} / ${sanctumShards.length}`, 760, 130, 13, "#f1d78a");
    ctx.fillStyle = "#63502a";
    ctx.fillRect(0, 384, W, 5);
    ctx.fillStyle = sanctumExit.unlocked ? "#8ce0b0" : "#5d5268";
    ctx.fillRect(sanctumExit.x - 24, sanctumExit.y - 42, 48, 84);
    drawText(sanctumExit.unlocked ? "出口" : "鎖定", sanctumExit.x, sanctumExit.y + 58, 12, sanctumExit.unlocked ? "#8ce0b0" : "#a8acc2", "center");
    return;
  }
  if (state.nextMap) {
    drawText("第二張地圖：寂靜遺跡", 24, 105, 14, "#d8a9d1");
    drawText(state.ruinObjectiveComplete ? "遺跡核心已取得，區域探索完成" : "擊敗遺跡守衛並取得遺跡核心", 24, 130, 13, "#bba8c3");
    drawText(`遺跡符文：${state.ruinRuneCount} / ${ruinRunes.length}`, 760, 130, 13, "#d8a9d1");
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
      ctx.fillStyle = "#4d4058";
      ctx.fillRect(0, 384, W, 5);
    }
    ctx.fillStyle = ruinExit.unlocked ? "#8ce0b0" : "#5d5268";
    ctx.fillRect(ruinExit.x - 24, ruinExit.y - 42, 48, 84);
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
    ctx.fillStyle = dimensionGate.unlocked ? "#8ce0b0" : "#53627a";
    ctx.fillRect(dimensionGate.x - 30, dimensionGate.y - 42, 60, 84);
    ctx.fillStyle = "#122c35";
    ctx.fillRect(dimensionGate.x - 20, dimensionGate.y - 32, 40, 64);
    drawText(dimensionGate.unlocked ? "已解鎖" : "鎖定", dimensionGate.x, dimensionGate.y + 58, 12, dimensionGate.unlocked ? "#8ce0b0" : "#a8acc2", "center");
  } else {
    ctx.fillStyle = "#292e49";
    ctx.fillRect(0, 384, W, 5);
    drawText("1D 維度：你只能沿著這條路前進", 24, 105, 14, "#9da5d4");
  }
}

function drawCharacter() {
  const blocking = keys.has("e") && state.hasShield;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(player.facing, 1);
  ctx.fillStyle = state.bodyColor;
  ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
  ctx.fillStyle = "#272b42";
  ctx.fillRect(-10, -7, 7, 7);
  ctx.fillRect(3, -7, 7, 7);
  ctx.fillStyle = state.eyeColor;
  ctx.fillRect(-8, -6, 3, 3);
  ctx.fillRect(5, -6, 3, 3);
  if (state.hasSword && state.attackTimer > 0) {
    ctx.strokeStyle = "#dce7ef"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(48, -28); ctx.stroke();
  }
  const shieldActive = state.hasShield && (keys.has("e") || state.shieldTimer > 0);
  if (shieldActive) {
    ctx.fillStyle = blocking ? "#85d7d0" : "#7092b7";
    ctx.beginPath(); ctx.arc(22, 2, 17, -1.2, 1.2); ctx.lineTo(22, 2); ctx.fill();
  }
  ctx.restore();
}

function drawElder() {
  ctx.fillStyle = "#bd8e70";
  ctx.fillRect(elder.x - 18, elder.y - 26, 36, 48);
  ctx.fillStyle = "#eee4d2";
  ctx.beginPath(); ctx.arc(elder.x, elder.y - 32, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#41455c";
  ctx.fillRect(elder.x - 16, elder.y - 37, 6, 6);
  ctx.fillRect(elder.x + 10, elder.y - 37, 6, 6);
  drawText("老人", elder.x, elder.y - 58, 14, "#f4d18d", "center");
}

function drawEnemy() {
  getCombatants().forEach((enemy) => {
    if (!enemy.active || enemy.hp <= 0) return;
  const enraged = state.bossPhase && bosses.includes(enemy) && enemy.hp <= enemy.maxHp / 2;
  if (enemy.attackWindup > 0) {
    ctx.save();
    const warningColor = {
      shockwave: "#d7a7ff",
      smash: "#ff8c5a",
      dash: "#78c7ff",
      dimension: "#f1d76f",
      ranged: "#e7d35f",
      leap: "#8ce0b0",
    }[enemy.attackType] || "#ff9b9f";
    ctx.strokeStyle = warningColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    if (enemy.attackType === "shockwave") {
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
      ctx.arc(enemy.x, enemy.y, 105, 0, Math.PI * 2);
      ctx.stroke();
    } else if (enemy.attackType === "dash" || enemy.attackType === "dimension") {
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(player.x, state.dimension === "2D" ? player.y : enemy.y);
      ctx.stroke();
    } else if (enemy.attackType === "ranged") {
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y);
      ctx.lineTo(player.x, state.dimension === "2D" ? player.y : enemy.y);
      ctx.stroke();
    } else if (enemy.attackType === "leap") {
      ctx.beginPath();
      ctx.arc(player.x, state.dimension === "2D" ? player.y : enemy.y, 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.fillStyle = enemy.hitFlash > 0 ? "#f4f0df" : enemy.attackWindup > 0 ? "#ef6c72" : enraged ? "#ff4f5f" : enemy.color;
  ctx.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
  ctx.fillStyle = "#f4f0df";
  ctx.fillRect(-9, -6, 5, 5);
  ctx.fillRect(5, -6, 5, 5);
  ctx.restore();
  const attackLabel = {
    dash: "突進！",
    smash: "重擊！",
    leap: "跳躍衝撞！",
    ranged: "遠程射擊！",
    shockwave: "裂地震波！",
    dimension: "維度突襲！",
  }[enemy.attackType];
  const warningText = `${attackLabel || "攻擊！"} ${enemy.attackWindup.toFixed(1)}秒`;
  drawText(enemy.attackWindup > 0 ? warningText : `${enemy.type} HP ${enemy.hp}`, enemy.x, enemy.y - enemy.size / 2 - 8, 12, enemy.attackWindup > 0 ? "#ffdd9b" : "#d99aac", "center");
  if (enemy.attackWindup > 0) {
    const maxWindup = enemy.attackType === "shockwave" ? 1.05
      : enemy.attackType === "smash" ? 0.9
      : enemy.attackType === "leap" ? 0.65
      : enemy.attackType === "ranged" ? 0.75
      : enemy.attackType === "dimension" ? 0.5
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
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawParticles() {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
  });
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
  ctx.fillStyle = "#e7b86b";
  ctx.beginPath();
  ctx.arc(ruinCore.x, ruinCore.y, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawRuinRunes() {
  if (!state.nextMap) return;
  ruinRunes.forEach((rune) => {
    if (rune.collected) return;
    ctx.fillStyle = "#c9a5df";
    ctx.fillRect(rune.x - 8, rune.y - 8, 16, 16);
    drawText("✦", rune.x, rune.y + 5, 13, "#fff1ff", "center");
  });
}

function drawSanctumShards() {
  if (!state.sanctumMap) return;
  sanctumShards.forEach((shard) => {
    if (shard.collected) return;
    ctx.fillStyle = "#f1d78a";
    ctx.fillRect(shard.x - 8, shard.y - 8, 16, 16);
    drawText("✦", shard.x, shard.y + 5, 13, "#fff9d6", "center");
  });
}

function drawShards() {
  if (state.dimension !== "2D" || state.nextMap) return;
  shards.forEach((shard) => {
    if (shard.collected) return;
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#79d3c9";
    ctx.fillRect(-9, -9, 18, 18);
    ctx.restore();
    drawText("◆", shard.x, shard.y + 5, 13, "#d1fff5", "center");
  });
}

function getCurrentObjective() {
  if (state.worldReturned) return "冒險完成：你已回到正常世界";
  if (state.sanctumMap) {
    if (sanctumEnemy.hp > 0) return "擊敗聖堂守護者";
    if (state.sanctumShardCount < sanctumShards.length) return `收集核心碎片（${state.sanctumShardCount} / ${sanctumShards.length}）`;
    return "前往核心聖堂出口並按 F";
  }
  if (state.nextMap) {
    if (!state.ruinObjectiveComplete) return "擊敗遺跡守衛並取得遺跡核心";
    if (state.ruinRuneCount < ruinRunes.length) return `收集遺跡符文（${state.ruinRuneCount} / ${ruinRunes.length}）`;
    return "前往遺跡出口並按 F";
  }
  if (!state.elderTalked) return "靠近老人並按 F 對話";
  if (!state.hasShield) return "完成老人教學並取得盾牌";
  if (!state.bossPhase) return `擊敗所有敵人（${state.defeatedEnemies} / ${enemies.length}）`;
  if (state.defeatedBosses < bosses.length) return `擊敗小 Boss（${state.defeatedBosses} / ${bosses.length}）`;
  if (state.shardCount < shards.length) return `在 2D 收集維度碎片（${state.shardCount} / ${shards.length}）`;
  return "前往中央維度門並按 F";
}

function drawObjective() {
  const objective = getCurrentObjective();
  ctx.fillStyle = "#0c0e18d9";
  ctx.fillRect(18, 148, 300, 48);
  ctx.strokeStyle = "#75603d";
  ctx.strokeRect(18, 148, 300, 48);
  drawText("目前目標", 30, 167, 12, "#f4d18d");
  drawText(objective, 30, 186, 13, "#f4f0df");
}

function drawHud() {
  ctx.fillStyle = "#0c0e18cc";
  ctx.fillRect(0, 0, W, 74);
  drawText(`維度：${state.dimension}`, 24, 30, 18, state.dimension === "2D" ? "#79d3c9" : "#c3c8ed");
  if (state.nextMap) drawText("地圖 2", 150, 30, 13, "#d8a9d1");
  const ability = state.modeTimer > 0 ? `2D ${Math.ceil(state.modeTimer)}s` : state.cooldown > 0 ? `冷卻 ${Math.ceil(state.cooldown)}s` : "C 可用";
  drawText(ability, 24, 54, 13, "#a8acc2");
  drawText("HP", 790, 29, 13, "#a8acc2");
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i + 1 <= player.hp ? "#ec6c72" : i + 0.5 <= player.hp ? "#f4a06a" : "#393d52";
    ctx.fillRect(823 + i * 28, 17, 19, 19);
  }

  const equipment = state.hasSword && state.hasShield
    ? "裝備：劍＋盾"
    : state.hasSword ? "武器：劍" : state.hasShield ? "裝備：盾" : "空手";
  drawText(equipment, 790, 56, 13, "#f4d18d");
  drawText(`金錢：${player.money}`, 640, 56, 13, "#f4d18d");
  if (state.comboCount > 0) {
    drawText(`連擊：${state.comboCount}（傷害 x${(1 + (state.comboCount - 1) * 0.25).toFixed(2)}）`, 390, 52, 13, "#f4d18d");
  }
  const progress = state.bossPhase
    ? `小 Boss ${Math.min(state.defeatedBosses + 1, bosses.length)} / ${bosses.length}`
    : `敵人 ${Math.min(state.defeatedEnemies + 1, enemies.length)} / ${enemies.length}`;
  drawText(progress, 390, 30, 13, "#a8acc2");
  if (state.bossRestTimer > 0) {
    drawText(`休息 ${Math.ceil(state.bossRestTimer)} 秒`, 390, 52, 13, "#f4d18d");
  }
  const target = getCombatants().find((combatant) => combatant.active && combatant.hp > 0);
  if (target) {
    drawText(target.type, W / 2, 105, 16, "#f4f0df", "center");
    const targetEnraged = state.bossPhase && bosses.includes(target) && target.hp <= target.maxHp / 2;
    if (targetEnraged) {
      drawText("狂暴狀態：攻擊速度提升！", W / 2, 180, 13, "#ff7b83", "center");
    }
    const attackStyle = {
      shockwave: "裂地震波",
      dash: "影襲突進",
      smash: "熔岩重擊",
      dimension: "維度突襲",
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
  if (state.hasShield && keys.has("e")) {
    drawText(player.facing < 0 ? "盾牌朝左" : "盾牌朝右", 24, 92, 13, "#85d7d0");
  }
  if (player.hp < player.maxHp) {
    drawText(`自然回復 ${Math.ceil(state.regenTimer)} 秒`, 640, 92, 12, "#a8acc2");
  }
  drawObjective();
}

function drawTutorial() {
  if (!state.dialog) return;
  const lessons = [
    "",
    "先學會這個世界的規則吧。按 F 繼續。",
    "A / D 可以左右移動，滑鼠左鍵可以使用劍。",
    "按住 E 可以舉盾，防禦時按滑鼠左鍵可以盾反。",
    "按 C 進入 2D 維度，使用 W / A / S / D 探索。",
  ];
  ctx.fillStyle = "#0c0e18ee";
  ctx.fillRect(150, 390, 660, 92);
  ctx.strokeStyle = "#75603d";
  ctx.strokeRect(150, 390, 660, 92);
  drawText("老人", 174, 418, 14, "#f4d18d");
  drawText(lessons[state.tutorialStep], 174, 448, 16, "#f4f0df");
  drawText("按 F 繼續", 785, 462, 12, "#a8acc2", "right");
}

function drawMerchant() {
  ctx.fillStyle = "#8b5e83";
  ctx.fillRect(merchant.x - 16, merchant.y - 25, 32, 46);
  ctx.fillStyle = "#f0c18b";
  ctx.beginPath(); ctx.arc(merchant.x, merchant.y - 31, 18, 0, Math.PI * 2); ctx.fill();
  drawText("商人", merchant.x, merchant.y - 56, 14, "#f4d18d", "center");
}

function draw() {
  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }
  drawBackground();
  drawShards();
  drawElder();
  drawEnemy();
  drawProjectiles();
  drawParticles();
  drawFloatingTexts();
  drawRuinCore();
  drawRuinRunes();
  drawSanctumShards();
  drawMerchant();
  drawCharacter();
  drawHud();
  drawTutorial();
  ctx.restore();
  if (state.worldReturned) {
    ctx.fillStyle = "#102b24dd";
    ctx.fillRect(0, 0, W, H);
    drawText("返回正常世界", W / 2, H / 2 - 16, 38, "#8ce0b0", "center");
    drawText(state.ruinObjectiveComplete ? "遺跡核心與符文全部取得" : "四個小 Boss 已全部擊敗", W / 2, H / 2 + 24, 16, "#f4f0df", "center");
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
    drawText("按 R 或點擊下方按鈕重新開始", W / 2, 318, 16, "#f4d18d", "center");
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
  if (key === "r") {
    event.preventDefault();
    resetGame();
    return;
  }
  if (state.gameOver) return;
  keys.add(key);
  if (["a", "d", "w", "s", "e", "c", "f", "g"].includes(key)) event.preventDefault();
  if (key === "c") switchDimension();
  const nearElder = distanceToElder() < 90;
  const nearGate = state.dimension === "2D" && Math.hypot(player.x - dimensionGate.x, player.y - dimensionGate.y) < 85;
  const nearRuinExit = state.nextMap && Math.hypot(player.x - ruinExit.x, player.y - ruinExit.y) < 85;
  const nearSanctumExit = state.sanctumMap && Math.hypot(player.x - sanctumExit.x, player.y - sanctumExit.y) < 85;
  if (key === "f" && (nearElder || nearGate || nearRuinExit || nearSanctumExit)) interact();
  if (key === "f" && distanceToMerchant() < 90) toggleShop();
  if (key === "g" && distanceToMerchant() < 90) toggleBetting();
  if (key === "p" && player.potions > 0 && player.hp < player.maxHp) {
    player.potions -= 1;
    player.hp = Math.min(player.maxHp, player.hp + 1);
    setMessage("你使用生命藥水，恢復 1 HP。");
  }
});
document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
canvas.addEventListener("mousedown", (event) => {
  canvas.focus();
  if (event.button === 0) attackOrParry();
});
canvas.addEventListener("click", () => canvas.focus());
document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const press = (event) => {
    event.preventDefault();
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
shop.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) buyItem(button.dataset.item);
});
betting.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) placeBet(button.dataset.guess);
});
restartButton.addEventListener("click", resetGame);
loadSaveButton.addEventListener("click", loadGame);
clearSaveButton.addEventListener("click", clearSave);
startGameButton.addEventListener("click", startNewGame);
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

setInterval(() => loop(performance.now()), 16);
