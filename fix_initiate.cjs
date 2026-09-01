const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/INITIATE DEFENSE/g, 'เริ่มเกม (START)');
code = code.replace(/Math Fortress v1\.2\.5 • SYSTEM ONLINE/g, 'Math Fortress v1.2.5 • SYSTEM ONLINE • Created by MIKPURINUT');

fs.writeFileSync('src/App.tsx', code, 'utf8');
