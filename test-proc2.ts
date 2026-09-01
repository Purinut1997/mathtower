import { generateDynamicMathPuzzle } from './src/game/MathAPI.js';
async function run() {
  const p = await generateDynamicMathPuzzle('intermediate', '+', 1);
  console.log(p);
}
run();
