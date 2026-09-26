const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createGame(storage = new Map()) {
  const elements = new Map();
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
        getContext: () => drawing,
        addEventListener() {},
        querySelectorAll: () => [],
        focus() {},
      });
    }
    return elements.get(selector);
  }
  const sandbox = {
    document: { querySelector: element, querySelectorAll: () => [], addEventListener() {} },
    window: { devicePixelRatio: 1, addEventListener() {} },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    performance: { now: () => 1000 },
    setInterval() {},
    Math,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync("game.js", "utf8"), sandbox);
  return { run: (source) => vm.runInContext(source, sandbox), storage };
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
  const firstHp = game.run("getCombatants().find((enemy) => enemy.active).maxHp");
  let firstBossHp;
  for (let wave = 1; wave <= 50; wave += 1) {
    assert.equal(game.run("state.arenaWave"), wave);
    for (let enemy = 1; enemy <= 5; enemy += 1) {
      assert.equal(game.run("state.arenaBossActive"), false);
      defeatCurrent(game);
      assert.equal(game.run("state.arenaKillsThisWave"), enemy === 5 && wave % 5 !== 0 ? 0 : enemy);
    }
    if (wave % 5 === 0) {
      assert.equal(game.run("state.arenaBossActive"), true);
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
      assert.equal(game.run("state.arenaRestRoom"), true);
      assert.equal(game.run("state.arenaBestWave"), wave);
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
  assert.match(game.run("getChallengerDialogue()"), /朋友/);
  game.run("player.x = 480; interact()");
  assert.equal(game.run("state.arenaMode"), false);
  assert.equal(game.run("state.worldReturned"), true);
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

console.log("Arena progression, final boss, save/load, and death restart passed.");
