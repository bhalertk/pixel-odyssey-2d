const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createGame(storage = new Map()) {
  const elements = new Map();
  const listeners = new Map();
  const touchButtons = new Map();
  for (const control of ["a", "w", "s", "d", "e", "attack", "c", "f", "r", "t", "q", "z", "b", "shop", "g", "save", "load", "p", "x", "fullscreen"]) {
    const handlers = new Map();
    touchButtons.set(control, {
      dataset: { control },
      addEventListener: (name, handler) => handlers.set(name, handler),
      trigger: (name) => handlers.get(name)?.({ preventDefault() {} }),
    });
  }
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
    document: { querySelector: element, querySelectorAll: (selector) => selector === "[data-control]" ? [...touchButtons.values()] : [], addEventListener: (name, handler) => listeners.set(name, handler) },
    window: { devicePixelRatio: 1, addEventListener() {} },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    performance: { now: () => 1000 },
    setInterval() {},
    setTimeout: () => 0,
    clearTimeout() {},
    Math,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync("game.js", "utf8"), sandbox);
  return {
    run: (source) => vm.runInContext(source, sandbox),
    press: (key) => listeners.get("keydown")({ key, repeat: false, preventDefault() {} }),
    touch: (control, event = "click") => touchButtons.get(control).trigger(event),
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
  assert.equal(game.run("inFirstMap()"), true);
  assert.equal(game.run("state.dimension"), "1D");
  assert.equal(game.run("player.x"), 150);
  assert.equal(game.run("player.y"), 370);
  assert.equal(game.run("state.worldReturned"), false);
  assert.equal(game.run("state.arenaMode"), false);
  assert.equal(game.run("mainMenu.hidden"), true);
  assert.equal(game.run("gameContent.hidden"), false);
  assert.equal(game.run("mainMenu.dataset.playthrough"), "4");
  assert.equal(game.run("startFourthButton.hidden"), false);
  assert.equal(game.storage.get("pixel-odyssey-2d-fourth-unlocked"), "1");
  assert.equal(game.storage.get("pixel-odyssey-2d-fourth-entered"), "1");
  const reloaded = createGame(game.storage);
  assert.equal(reloaded.run("startFourthButton.hidden"), false);
  assert.equal(reloaded.run("mainMenu.dataset.playthrough"), "4");
  reloaded.run("enterFourthPlaythrough()");
  assert.equal(reloaded.run("state.playthrough"), 4);
  assert.equal(reloaded.run("inFirstMap()"), true);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); startPlaythrough(4)");
  assert.equal(game.run("state.elderTalked"), true);
  assert.equal(game.run("enemies[0].active"), true);
  assert.equal(game.run("allCombatants.every((enemy) => enemy.infected)"), true);
  assert.ok(game.run("enemies[0].maxHp") > 5);
  assert.equal(game.run("infectedMerchant.active"), true);
  game.run("draw(); player.x = infectedMerchant.x - 120; infectedMerchant.attackCooldown = 0; update(0.016)");
  assert.ok(game.run("infectedMerchant.attackWindup") > 0);
  game.run("player.x = merchant.x; toggleShop()");
  assert.equal(game.run("shop.hidden"), true);
  game.run("state.defeatedBosses = bosses.length; dimensionGate.unlocked = true; state.dimension = '2D'; player.x = dimensionGate.x; player.y = dimensionGate.y; enterDimensionGate()");
  assert.equal(game.run("state.nextMap"), false);
  game.run("infectedMerchant.hp = 0; update(0.016)");
  assert.equal(game.run("state.merchantDefeated"), true);
  game.run("player.x = caveEntrance.x; player.y = caveEntrance.y; interact()");
  assert.equal(game.run("state.caveMode"), true);
  game.run("draw(); saveGame(false); loadGame()");
  assert.equal(game.run("state.caveMode"), true);
  game.run("player.x = survivor.x; interact()");
  assert.equal(game.run("state.remoteTradeUnlocked"), true);
  game.run("draw()");
  game.run("player.x = caveExit.x; interact()");
  assert.equal(game.run("state.caveMode"), false);
  game.run("player.x = 120; toggleShop()");
  assert.equal(game.run("shop.hidden"), false);
  game.run("toggleBetting()");
  assert.equal(game.run("shop.hidden"), true);
  assert.equal(game.run("betting.hidden"), false);
  game.run("saveGame(false); loadGame()");
  assert.equal(game.run("state.merchantDefeated"), true);
  assert.equal(game.run("state.remoteTradeUnlocked"), true);
  assert.equal(game.run("infectedMerchant.active"), false);
  game.run("state.nextMap = true; state.ruinObjectiveComplete = true; state.ruinRuneCount = 0; player.x = ruinRunes[0].x; player.y = ruinRunes[0].y; collectRuinRunes()");
  assert.equal(game.run("state.ruinRuneCount"), 1);
  game.run("player.x = ruinRunes[2].x; player.y = ruinRunes[2].y; collectRuinRunes(); player.x = ruinRunes[1].x; player.y = ruinRunes[1].y; collectRuinRunes()");
  assert.equal(game.run("ruinExit.unlocked"), true);
  game.run("state.nextMap = false; enterExtraMap(1); currentExtraMap().boss.hp = 0; state.dimension = '2D'; player.x = currentExtraMap().puzzleNodes[2].x; player.y = currentExtraMap().puzzleNodes[2].y; collectExtraPuzzle()");
  assert.equal(game.run("state.extraPuzzleCount"), 1);
  game.run("player.x = currentExtraMap().puzzleNodes[1].x; player.y = currentExtraMap().puzzleNodes[1].y; collectExtraPuzzle(); player.x = currentExtraMap().puzzleNodes[0].x; player.y = currentExtraMap().puzzleNodes[0].y; collectExtraPuzzle()");
  assert.equal(game.run("state.extraExitUnlocked"), true);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); state.voidMap = true; state.voidBossDefeated = true; voidBoss.hp = 0; state.dimension = '2D'; player.x = voidAnchor.x; player.y = voidAnchor.y; chargeVoidAnchor(1.5)");
  assert.equal(game.run("voidExit.unlocked"), false);
  game.run("saveGame(false); loadGame(); chargeVoidAnchor(1.5)");
  assert.equal(game.run("voidExit.unlocked"), true);
  game.run("state.voidMap = false; state.frostMap = true; state.frostDefeated = 2; state.dimension = '2D'; player.x = frostSeals[0].x; player.y = frostSeals[0].y; collectFrostSeals()");
  assert.equal(game.run("state.frostSealCount"), 0);
  for (const index of [1, 0, 2]) game.run(`player.x = frostSeals[${index}].x; player.y = frostSeals[${index}].y; collectFrostSeals()`);
  assert.equal(game.run("frostExit.unlocked"), true);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); startPlaythrough(4); state.frostMap = true; state.frostDefeated = 2; state.dimension = '2D'");
  for (const index of [2, 1, 0]) game.run(`player.x = frostSeals[${index}].x; player.y = frostSeals[${index}].y; collectFrostSeals()`);
  assert.equal(game.run("frostExit.unlocked"), true);
  game.run("enterExtraMap(2); currentExtraMap().boss.hp = 0; state.dimension = '2D'");
  for (const index of [0, 2, 0, 2]) game.run(`player.x = currentExtraMap().puzzleNodes[${index}].x; player.y = currentExtraMap().puzzleNodes[${index}].y; collectExtraPuzzle(); player.x = 120; player.y = 370; collectExtraPuzzle()`);
  assert.equal(game.run("state.extraExitUnlocked"), true);
  game.run("enterExtraMap(4); currentExtraMap().boss.hp = 0; state.dimension = '2D'");
  for (const index of [0, 0, 1, 2, 2]) {
    game.run(`player.x = currentExtraMap().puzzleNodes[${index}].x; player.y = currentExtraMap().puzzleNodes[${index}].y; collectExtraPuzzle(); player.x = 120; player.y = 370; collectExtraPuzzle()`);
  }
  assert.equal(game.run("state.extraExitUnlocked"), true);
  game.run("enterExtraMap(6); currentExtraMap().boss.hp = 0; state.dimension = '2D'");
  for (const index of [0, 3, 1, 4, 2, 5]) game.run(`player.x = currentExtraMap().puzzleNodes[${index}].x; player.y = currentExtraMap().puzzleNodes[${index}].y; collectExtraPuzzle()`);
  assert.equal(game.run("state.extraExitUnlocked"), true);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); enterExtraMap(3); currentExtraMap().boss.hp = 0; state.dimension = '2D'; player.x = currentExtraMap().puzzleNodes[2].x; player.y = currentExtraMap().puzzleNodes[2].y; collectExtraPuzzle(); collectExtraPuzzle(3); saveGame(false)");
  game.run("loadGame()");
  assert.equal(game.run("state.extraPuzzleCount"), 1);
  assert.equal(game.run("state.extraPuzzleTimer"), 15);
  game.run("enterExtraMap(5); currentExtraMap().boss.hp = 0; state.dimension = '2D'; player.x = currentExtraMap().puzzleNodes[0].x; player.y = currentExtraMap().puzzleNodes[0].y; collectExtraPuzzle(); saveGame(false)");
  const saved = JSON.parse(game.storage.get("pixel-odyssey-2d-save"));
  delete saved.extraMaps[4].levels;
  game.storage.set("pixel-odyssey-2d-save", JSON.stringify(saved));
  game.run("loadGame()");
  assert.equal(game.run("state.extraPuzzleCount"), 0);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); enterExtraMap(1); currentExtraMap().boss.hp = 0; state.dimension = '2D'; player.x = currentExtraMap().puzzleNodes[1].x; player.y = currentExtraMap().puzzleNodes[1].y; collectExtraPuzzle(); saveGame(false); loadGame()");
  assert.equal(game.run("state.extraPuzzleSelected"), 1);
  game.run("state.dimension = '2D'; player.x = currentExtraMap().puzzleNodes[2].x; player.y = currentExtraMap().puzzleNodes[2].y; collectExtraPuzzle(); player.x = currentExtraMap().puzzleNodes[0].x; player.y = currentExtraMap().puzzleNodes[0].y; collectExtraPuzzle()");
  assert.equal(game.run("state.extraExitUnlocked"), true);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame()");
  const paths = [[0, 2, 1], [0, 2], null, null, [0, 2, 4, 1, 3], [0, 5, 1, 4, 2, 3]];
  for (let mapNumber = 1; mapNumber <= 6; mapNumber += 1) {
    game.run(`enterExtraMap(${mapNumber}); currentExtraMap().boss.hp = 0; state.dimension = '2D'`);
    if (mapNumber === 3) {
      game.run("player.x = currentExtraMap().puzzleNodes[0].x; player.y = currentExtraMap().puzzleNodes[0].y; collectExtraPuzzle(); collectExtraPuzzle(19)");
      assert.equal(game.run("state.extraPuzzleCount"), 0);
      game.run("player.x = 120; player.y = 370; collectExtraPuzzle()");
    }
    const order = paths[mapNumber - 1] || Array.from({ length: mapNumber === 6 ? 6 : mapNumber === 3 ? 4 : 3 }, (_, i) => i);
    for (const index of order) {
      if (mapNumber === 4 && index === 1) game.run("player.x = currentExtraMap().puzzleNodes[1].x; player.y = currentExtraMap().puzzleNodes[1].y; collectExtraPuzzle(); player.x = 120; player.y = 370; collectExtraPuzzle()");
      game.run(`player.x = currentExtraMap().puzzleNodes[${index}].x; player.y = currentExtraMap().puzzleNodes[${index}].y; collectExtraPuzzle()`);
    }
    assert.equal(game.run("state.extraExitUnlocked"), true, `map ${mapNumber}`);
    game.run("saveGame(false); loadGame()");
    assert.equal(game.run("currentExtraMap().exit.unlocked"), true, `saved map ${mapNumber}`);
  }
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame(); startPlaythrough(4); state.worldReturned = true; interact()");
  assert.equal(game.run("state.playthrough"), 5);
  assert.equal(game.run("state.arenaMode && state.arenaRestRoom"), true);
  game.run("player.x = challenger.x; interact()");
  assert.equal(game.run("state.challengerDialogOpen"), false);
  game.run("saveGame(false); loadGame(); draw()");
  assert.equal(game.run("state.playthrough"), 5);
  assert.equal(game.run("state.challengerDialogOpen"), false);
  game.run("state.arenaWave = 50; state.arenaBossActive = true; advanceArenaAfterDefeat()");
  assert.equal(game.run("state.cutscenePhase"), "");
  assert.equal(game.run("state.arenaRestRoom && state.arenaFinalBossDefeated"), true);
}

{
  const game = createGame();
  game.run("audioSettings.enabled = false; startNewGame()");
  game.touch("d", "pointerdown");
  assert.equal(game.run("keys.has('d')"), true);
  game.touch("d", "pointerup");
  assert.equal(game.run("keys.has('d')"), false);
  game.run("state.dimension = '2D'; player.hp = 2; player.potions = 1");
  game.touch("r");
  assert.equal(game.run("player.hp"), 3);
  assert.equal(game.run("player.potions"), 0);
  game.touch("p");
  assert.equal(game.run("state.paused"), true);
  game.touch("p");
  assert.equal(game.run("state.paused"), false);
  game.touch("save");
  assert.ok(game.storage.has("pixel-odyssey-2d-save"));
  game.run("player.money = 123");
  game.touch("load");
  assert.equal(game.run("player.money"), 0);
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

console.log("Arena, finale, fourth and fifth playthroughs, infection cave, mobile controls, world puzzles, and save/load passed.");
