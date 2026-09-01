const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /gameRef\.current\.mana \+= 75;\n                        sounds\.playManaGain\(\);/;
const replacement = `gameRef.current.mana += 75;
                        gameRef.current.notifyState();
                        sounds.playManaGain();`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code, 'utf8');
