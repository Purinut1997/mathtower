const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add buildMenu state
code = code.replace(/const \[showHelp, setShowHelp\] = useState\(false\);/, 
  'const [showHelp, setShowHelp] = useState(false);\n  const [buildMenu, setBuildMenu] = useState<{col: number, row: number} | null>(null);');

// Add callback to GameManager constructor
code = code.replace(/const puzzle = await generateDynamicMathPuzzle\(diff, tower\.type, tower\.level\);\n          setUpgradeModal\(\(prev\) => \(\{\ \.\.\.prev,\ puzzle\ \}\)\);\n        }\n      \);/m, 
  `const puzzle = await generateDynamicMathPuzzle(diff, tower.type, tower.level);
          setUpgradeModal((prev) => ({ ...prev, puzzle }));
        },
        (col, row) => {
          setBuildMenu({ col, row });
        }
      );`);
      
// Add handleBuildTower
code = code.replace(/const handlePointerDown/m, 
  `const handleBuildTower = (type: string) => {
    if (buildMenu && gameRef.current) {
      gameRef.current.buildTowerAt(buildMenu.col, buildMenu.row, type);
      setBuildMenu(null);
    }
  };
  
  const handlePointerDown`);
  
// Replace Armory dock with nothing or hide it.
// We remove the old armory block completely and add the Build Menu Modal instead.
