const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = '<div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-max z-20 pointer-events-auto flex gap-3 bg-slate-950/80 p-2 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md">\n' +
'        {/* Hack Mana Button */}\n' +
'        <button\n' +
'          onClick={() => {\n' +
'            const diff = selectedDifficulty;\n' +
'            const puz = generateDynamicMathPuzzle(diff, "+", 1);\n' +
'            setHackManaModal({\n' +
'              show: true,\n' +
'              puzzle: puz,\n' +
'              timeLeft: 10,\n' +
'              isSubmitting: false,\n' +
'              feedback: null\n' +
'            });\n' +
'          }}\n' +
'          className="relative w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-950/80 backdrop-blur-md border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 cursor-pointer hover:bg-slate-900 group"\n' +
'          title="Hack Mana (Free Mana if solved quickly!)"\n' +
'        >\n' +
'          <div className="text-xl mb-0.5"><Zap className="w-5 h-5 text-amber-400 group-hover:animate-pulse" /></div>\n' +
'          <span className="text-[8px] font-bold tracking-widest text-amber-300">HACK</span>\n' +
'        </button>\n' +
'        <div className="w-px bg-slate-800 mx-1"></div>\n';

const regex = /<div className="absolute bottom-3 left-1\/2 -translate-x-1\/2 w-max z-20 pointer-events-auto flex gap-3 bg-slate-950\/80 p-2 rounded-2xl border border-cyan-500\/20 shadow-\[0_0_20px_rgba\(0,0,0,0\.5\)\] backdrop-blur-md">/;
code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code, 'utf8');
