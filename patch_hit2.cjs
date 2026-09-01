const fs = require('fs');
let code = fs.readFileSync('src/game/Entities.ts', 'utf8');

let newCode = code.replace(
  "const dmg = e.isShielded ? 0 : Math.round(this.damage * falloff);\n          e.hp -= dmg;",
  `let isChainReaction = false;
          let finalDmg = Math.round(this.damage * falloff);
          if (e.slowDuration > 0 && !e.isShielded) {
            isChainReaction = true;
            finalDmg *= 2; 
            e.slowDuration = 0; 
          }
          const dmg = e.isShielded ? 0 : finalDmg;
          e.hp -= dmg;`
);

newCode = newCode.replace(
  "addFloatingText(new FloatingText(e.x, e.y - 10, `-${dmg}`, '#f43f5e', 14));",
  `if (isChainReaction) {
              addFloatingText(new FloatingText(e.x, e.y - 15, \`CHAIN REACTION! -\${dmg}\`, '#fbbf24', 16, true));
              const crParticles: Particle[] = [];
              for(let j=0; j<10; j++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 4;
                crParticles.push(new Particle(e.x, e.y, Math.cos(ang)*spd, Math.sin(ang)*spd, '#fbbf24', 25, 4, false, '⚡'));
              }
              addParticles(crParticles);
            } else {
              addFloatingText(new FloatingText(e.x, e.y - 10, \`-\${dmg}\`, '#f43f5e', 14));
            }`
);

fs.writeFileSync('src/game/Entities.ts', newCode, 'utf8');
