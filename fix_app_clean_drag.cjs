const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove states
code = code.replace(/const \[draggedType, setDraggedType\] = useState<string \| null>\(null\);\n  const \[dragPos, setDragPos\] = useState\(\{ x: 0, y: 0 \}\);\n  const \[hoveredArmoryType, setHoveredArmoryType\] = useState<string \| null>\(null\);/m, '');

// Remove handleBuildTower's trailing handlePointerDown up to the end of handlePointerUp
const regexPointerHandlers = /const handlePointerDown[\s\S]*?const handleAnswer/m;
code = code.replace(regexPointerHandlers, 'const handleAnswer');

// Remove onPointerMove and onPointerUp from the main div
code = code.replace(/onPointerMove=\{handlePointerMove\}\n      onPointerUp=\{handlePointerUp\}/m, '');

fs.writeFileSync('src/App.tsx', code, 'utf8');
