const fs = require('fs');
let code = fs.readFileSync('src/game/GameManager.ts', 'utf8');

const regex = /handleGridClick\(col: number, row: number\) {([\s\S]*?)selectTower\(tower: Tower \| null\) {/m;

const replacement = `handleGridClick(col: number, row: number) {
    if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

    if (col < 0 || col >= Config.COLS || row < 0 || row >= Config.ROWS) return;

    const tower = this.towers.find((t) => t.col === col && t.row === row);
    if (tower) {
      this.selectedTower = tower;
      this.notifyState();
      sounds.playSelect();
    } else {
      this.selectedTower = null;
      this.notifyState();
      
      const onPath = this.gridPath.some((p) => p.c === col && p.r === row);
      if (!onPath && this.onEmptyGridClick) {
        this.onEmptyGridClick(col, row);
      }
    }
  }

  selectTower(tower: Tower | null) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/game/GameManager.ts', code, 'utf8');
