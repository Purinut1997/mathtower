const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("import { generateDynamicMathPuzzle, MathPuzzle, DifficultyLevel } from './game/MathAPI';\n", '');

fs.writeFileSync('src/App.tsx', code, 'utf8');
