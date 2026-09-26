const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createGame(storage = new Map()) {
  const elements = new Map();
  const listeners = new Map();
  const drawing = new Proxy({}, {
    get(_target, key) {
      if (key === "createLinearGradient" || key === "createRadialGradient") {
        return () => ({ addColorStop() {} });
      }
      return () => {};
    },
    set() { return true; },
  });
  function element(selector) {
    if (!elements.has(selector)) {
      elements.set(selector, {
        value: selector.includes("color") ? "#ffffff" : "0.6",
        checked: false,
        hidden: selector === "#game-content",
        innerHTML: "",
        dataset: {},
        getContext: () => drawing,
        addEventListener() {},
        querySelectorAll: () => [],
        focus() {},
      });
    }
    return elements.get(selector);
  }
  const sandbox = {
    document: { querySelector: element, querySelectorAll: () => [], addEventListener: (name, handler) => listeners.set(name, handler) },
    window: { devicePixelRatio: 1, addEventListener() {} },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    performance: { now: () => 1000 },
    setInterval() {},
    Math,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync("game.js", "utf8"), sandbox);
  return {
    run: (source) => vm.runInContext(source, sandbox),
    press: (key) => listeners.get("keydown")({ key, repeat: false, preventDefault() {} }),
    storage,
  };
}

function enterThirdArena(game) {
  game.run("audioSettings.enabled = false; startNewGame(); jumpToThirdPlaythroughGate(); interact(); player.x = 480; interact()");
  assert.equal(game.run("state.arenaWave"), 1);
  assert.equal(game.run("state.arenaRestRoom"), false);
}

function defeatCurrent(game) {
  game.run("getCombatants().find((enemy) => enemy.active).hp = 0; update(0.016)");
}

{
  const game = createGame();
  enterThirdArena(game);
  assert.match(game.run("getChallengerDialogue()"), /別拖累/);
  assert.equal(game.run("arenaEnemyPool.length"), 33);
  assert.equal(game.run("arenaBossPool.length"), 9);
  const firstHp = game.run("getCombatants().find((enemy) => enemy.active).maxHp");
  const seenEnemies = new Set();
  const seenBosses = new Set();
  let firstBossHp;
  for (let wave = 1; wave <= 50; wave += 1) {
    assert.equal(game.run("state.arenaWave"), wave);
    for (let enemy = 1; enemy <= 5; enemy += 1) {
      assert.equal(game.run("state.arenaBossActive"), false);
      seenEnemies.add(game.run("getCombatants().find((enemy) => enemy.active).type"));
      defeatCurrent(game);
      assert.equal(game.run("state.arenaKillsThisWave"), enemy === 5 && wave % 5 !== 0 ? 0 : enemy);
    }
    if (wave % 5 === 0) {
      assert.equal(game.run("state.arenaBossActive"), true);
      if (wave < 50) seenBosses.add(game.run("getCombatants().find((enemy) => enemy.active).type"));
      if (wave === 5) firstBossHp = game.run("getCombatants().find((enemy) => enemy.active).maxHp");
      if (wave === 45) assert.ok(game.run("getCombatants().find((enemy) => enemy.active).maxHp") > firstBossHp);
      if (wave === 25) {
        game.run("getCombatants().find((enemy) => enemy.active).hp -= 2; saveGame(false)");
        const bossHp = game.run("getCombatants().find((enemy) => enemy.active).hp");
        game.run("loadGame()");
        assert.equal(game.run("state.arenaBossActive"), true);
        assert.equal(game.run("getCombatants().find((enemy) => enemy.active).hp"), bossHp);
      }
      if (wave === 50) {
        assert.equal(game.run("getCombatants().find((enemy) => enemy.active) === arenaFinalBoss"), true);
      }
      defeatCurrent(game);
      assert.equal(game.run("state.arenaBestWave"), wave);
      if (wave === 50) {
        assert.equal(game.run("state.cutscenePhase"), "author");
        game.run("draw(); saveGame(false); loadGame()");
        assert.equal(game.run("state.cutscenePhase"), "author");
      } else {
        assert.equal(game.run("state.arenaRestRoom"), true);
      }
      if (wave === 10) assert.match(game.run("getChallengerDialogue()"), /朋友/);
      if (wave < 50) game.run("player.x = 480; interact()");
    } else {
      assert.equal(game.run("state.arenaWave"), wave + 1);
    }
    if (wave === 49) {
      assert.ok(game.run("getCombatants().find((enemy) => enemy.active).maxHp") > firstHp);
    }
  }
  assert.equal(game.run("state.arenaFinalBossDefeated"), true);
  assert.equal(seenEnemies.size, 33);
  assert.equal(seenBosses.size, 9);
  assert.match(game.run("getChallengerDialogue()"), /朋友/);
  game.run("update(4); draw()");
  assert.equal(game.run("state.cutscenePhase"), "push");
  game.run("update(4); draw()");
  assert.equal(game.run("state.cutscenePhase"), "stand");
  game.run("update(4)");
  assert.equal(game.run("state.elevatorMode"), true);
  for (let wave = 1; wave <= 5; wave += 1) {
    assert.equal(game.run("state.elevatorWave"), wave);
    for (let enemy = 1; enemy <= 5; enemy += 1) {
      defeatCurrent(game);
      assert.equal(game.run("state.elevatorKills"), enemy === 5 && wave < 5 ? 0 : enemy);
    }
  }
  assert.equal(game.run("state.cutscenePhase"), "light");
  game.run("draw(); update(4)");
  assert.equal(game.run("state.playthrough"), 4);
  assert.equal(game.run("mainMenu.hidden"), false);
  assert.equal(game.run("gameContent.hidden"), true);
  assert.equal(game.run("mainMenu.dataset.playthrough"), "4");
  assert.equal(game.run("startFourthButton.hidden"), false);
  assert.equal(game.storage.get("pixel-odyssey-2d-fourth-unlocked"), "1");
  game.run("enterFourthPlaythrough()");
  assert.equal(game.run("gameContent.hidden"), false);
  assert.equal(game.run("state.playthrough"), 4);
  const reloaded = createGame(game.storage);
  assert.equal(reloaded.run("startFourthButton.hidden"), false);
  assert.equal(reloaded.run("mainMenu.dataset.playthrough"), "4");
  reloaded.run("enterFourthPlaythrough()");
  assert.equal(reloaded.run("state.playthrough"), 4);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); jumpToThirdPlaythroughGate(); player.x = challenger.x; interact(); draw()");
  assert.equal(game.run("state.challengerDialogOpen"), true);
  game.run("saveGame(false); loadGame()");
  assert.equal(game.run("state.challengerDialogOpen"), true);
  game.press("f");
  assert.equal(game.run("state.challengerDialogOpen"), false);
  game.run("player.x = merchant.x; interact()");
  assert.equal(game.run("shop.hidden"), false);
  game.run("player.x = thirdPlaythroughGate.x; interact()");
  assert.equal(game.run("shop.hidden"), true);
}

{
  const game = createGame();
  enterThirdArena(game);
  defeatCurrent(game);
  assert.equal(game.run("state.arenaKillsThisWave"), 1);
  game.run("getCombatants().find((enemy) => enemy.active).hp -= 1; saveGame(false)");
  const savedHp = game.run("getCombatants().find((enemy) => enemy.active).hp");
  game.run("loadGame()");
  assert.equal(game.run("state.arenaKillsThisWave"), 1);
  assert.equal(game.run("getCombatants().find((enemy) => enemy.active).hp"), savedHp);
  for (let i = 0; i < 4; i += 1) defeatCurrent(game);
  assert.equal(game.run("state.arenaBestWave"), 1);
  game.run("player.hp = 0.5; projectiles.push({ x: player.x, y: player.y, vx: 0, vy: 0, damage: 1, source: arenaEnemyPool[0] }); update(0.016)");
  assert.equal(game.run("state.arenaRestRoom"), true);
  assert.equal(game.run("state.arenaWave"), 0);
  assert.equal(game.run("state.arenaBestWave"), 1);
  assert.equal(game.run("player.hp"), game.run("player.maxHp"));
  game.run("player.x = 480; interact()");
  assert.equal(game.run("state.arenaWave"), 1);
}

{
  const game = createGame();
  for (const key of "awdsawdsawds") game.press(key);
  assert.equal(game.run("state.playthrough"), 3);
  assert.equal(game.run("state.arenaWave"), 50);
  assert.equal(game.run("state.arenaKillsThisWave"), 0);
  assert.equal(game.run("state.arenaBossActive"), false);
  for (let i = 0; i < 6; i += 1) defeatCurrent(game);
  game.run("update(4); update(4); update(4); draw()");
  assert.equal(game.run("state.elevatorMode"), true);
  defeatCurrent(game);
  game.run("getCombatants().find((enemy) => enemy.active).hp -= 1; saveGame(false)");
  const hp = game.run("getCombatants().find((enemy) => enemy.active).hp");
  const height = game.run("state.elevatorHeight");
  game.run("loadGame(); draw()");
  assert.equal(game.run("state.elevatorWave"), 1);
  assert.equal(game.run("state.elevatorKills"), 1);
  assert.equal(game.run("getCombatants().find((enemy) => enemy.active).hp"), hp);
  assert.equal(game.run("state.elevatorHeight"), height);
  game.run("player.hp = 0.5; projectiles.push({ x: player.x, y: player.y, vx: 0, vy: 0, damage: 1, source: arenaEnemyPool[0] }); update(0.016)");
  assert.equal(game.run("state.elevatorMode"), true);
  assert.equal(game.run("state.elevatorWave"), 1);
  assert.equal(game.run("state.elevatorKills"), 0);
  assert.equal(game.run("player.hp"), game.run("player.maxHp"));
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); jumpToArenaWave50(); state.arenaRestRoom = true; state.arenaFinalBossDefeated = true; state.arenaBestWave = 50; saveGame(false); loadGame()");
  assert.equal(game.run("state.cutscenePhase"), "author");
}

console.log("Arena roster, challenger dialog, merchant, finale, elevator, fourth playthrough, cheat, and save/load passed.");
