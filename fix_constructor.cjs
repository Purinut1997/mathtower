const fs = require('fs');
let code = fs.readFileSync('src/game/GameManager.ts', 'utf8');

code = code.replace(/onUpgradeRequest: \(tower: Tower\) => void;\n    onEmptyGridClick: \(col: number, row: number\) => void\n  \) \{/m, 
  'onUpgradeRequest: (tower: Tower) => void,\n    onEmptyGridClick: (col: number, row: number) => void\n  ) {');

fs.writeFileSync('src/game/GameManager.ts', code, 'utf8');
