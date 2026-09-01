const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importRegex = /import React, \{ useEffect, useRef, useState \} from 'react';/;
code = code.replace(importRegex, `import React, { useEffect, useRef, useState } from 'react';
import { generateDynamicMathPuzzle, DifficultyLevel, MathPuzzle } from './game/MathAPI';`);

const stateRegex = /const \[showHelp, setShowHelp\] = useState\(true\);/;
code = code.replace(stateRegex, `const [showHelp, setShowHelp] = useState(true);
  const [hackManaModal, setHackManaModal] = useState<{
    show: boolean;
    puzzle: MathPuzzle | null;
    timeLeft: number;
    isSubmitting: boolean;
    feedback: { isCorrect: boolean; message: string } | null;
  }>({
    show: false,
    puzzle: null,
    timeLeft: 0,
    isSubmitting: false,
    feedback: null,
  });`);

fs.writeFileSync('src/App.tsx', code, 'utf8');
