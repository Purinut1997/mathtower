const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<span className="font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-1\.5 text-\[10px\]">⚡ การอัปเกรด \(Overrides\):<\/span>/;
const replacement = `<span className="font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-1.5 text-[10px]">✨ ระบบคอมโบ (Synergy) & แฮ็กมานา:</span>
                <p className="bg-slate-950/50 p-3 rounded-xl border border-white/5 mb-3">
                  <strong className="text-amber-400">⚡ Chain Reaction:</strong> หากศัตรูถูก <strong>หน่วงเวลา (÷)</strong> แล้วโดนโจมตีด้วย <strong>จรวดระเบิด (-)</strong> จะเกิดคอมโบระเบิดทำความเสียหาย 2 เท่า!<br/><br/>
                  <strong className="text-emerald-400">💻 Hack Mana:</strong> ระหว่างรอเวฟ สามารถกดปุ่ม <Zap className="inline w-3 h-3 text-amber-400"/> HACK (ขวาล่าง) เพื่อแก้โจทย์รับมานาพิเศษได้!
                </p>
                <span className="font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-1.5 text-[10px]">⚡ การอัปเกรด (Overrides):</span>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code, 'utf8');
