const fs = require('fs');
let code = fs.readFileSync('src/game/GameManager.ts', 'utf8');

code = code.replace(/tryPlaceTower\(clientX: number, clientY: number, type: string\) {[\s\S]*?sounds\.playBuild\(\);[\s\S]*?this\.notifyState\(\);\n    }\n  }/m, (match) => {
  return `buildTowerAt(col: number, row: number, type: string) {
    if (this.state !== 'PLAYING') return;
    if (col < 0 || col >= Config.COLS || row < 0 || row >= Config.ROWS) return;
    if (this.gridPath.some((p) => p.c === col && p.r === row)) return;
    if (this.towers.some((t) => t.col === col && t.row === row)) return;

    const cost = Config.TOWER_COSTS[type as keyof typeof Config.TOWER_COSTS];
    if (this.mana >= cost) {
      this.mana -= cost;
      const x = col * Config.TILE_SIZE + Config.TILE_SIZE / 2;
      const y = row * Config.TILE_SIZE + Config.TILE_SIZE / 2;
      const newTower = new Tower(col, row, type);
      this.towers.push(newTower);
      sounds.playBuild();

      this.floatingTexts.push(
        new FloatingText(newTower.x, newTower.y, \`-\${cost} มานา\`, '#38bdf8', 14)
      );

      this.selectedTower = newTower;
      this.notifyState();
      return true;
    }
    return false;
  }
  
  ` + match; // Keep tryPlaceTower just in case
});

fs.writeFileSync('src/game/GameManager.ts', code, 'utf8');
