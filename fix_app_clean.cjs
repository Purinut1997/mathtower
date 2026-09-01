const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// We will use a regex to replace the old tower dock and drag preview with our modal.
// Old tower dock starts at: {/* 5. Left/Bottom Tower Dock (Construct Bento) */}
// And ends at the end of drag preview: </div>\n      )}

const towerDockRegex = /\{\/\* 5\. Left\/Bottom Tower Dock \(Construct Bento\) \*\/\}[\s\S]*?\{\/\* 5\. Floating Drag Cursor Preview \*\/\}[\s\S]*?<\/div>\n      \)\}/m;

const buildModalCode = `
      {/* 5. Build Tower Modal */}
      {buildMenu && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/80 backdrop-blur-sm p-4"
          onClick={() => setBuildMenu(null)}
        >
          <div 
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 max-w-[320px] w-full shadow-[0_0_40px_rgba(34,211,238,0.15)] text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-mono text-cyan-300 mb-4 tracking-widest uppercase">สร้างป้อมปราการ</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(Config.TOWER_DATA).map(([type, data]) => {
                const cost = Config.TOWER_COSTS[type as keyof typeof Config.TOWER_COSTS];
                const canAfford = gameState.mana >= cost;
                const displayType = type === '*' ? '×' : type === '/' ? '÷' : type;

                return (
                  <div
                    key={type}
                    onClick={() => canAfford && handleBuildTower(type)}
                    className={\`flex flex-col items-center justify-center rounded-xl p-3 border transition-all cursor-pointer \${
                      canAfford
                        ? 'bg-slate-950/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'bg-slate-950/30 border-slate-800 opacity-50 cursor-not-allowed'
                    }\`}
                  >
                    <span
                      className="text-3xl font-bold font-mono leading-none mb-2 drop-shadow-[0_0_5px_currentColor]"
                      style={{ color: data.color }}
                    >
                      {displayType}
                    </span>
                    <div className="text-[10px] text-slate-300 font-bold mb-1" style={{ color: data.color }}>{data.name}</div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-mono text-cyan-100 font-bold leading-none">
                        {cost}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setBuildMenu(null)}
              className="mt-5 w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 font-mono py-2 rounded-xl transition-colors text-xs tracking-widest uppercase"
            >
              ยกเลิก (CANCEL)
            </button>
          </div>
        </div>
      )}
`;

code = code.replace(towerDockRegex, buildModalCode);
fs.writeFileSync('src/App.tsx', code, 'utf8');
