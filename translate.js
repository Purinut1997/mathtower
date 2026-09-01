const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace strings
const replacements = [
  [/TACTICAL DEFENSE/g, 'ยุทธวิธีป้องกัน'],
  [/WAVE/g, 'เวฟ'],
  [/MANA/g, 'มานา'],
  [/CORE/g, 'ฐาน'],
  [/SCORE/g, 'คะแนน'],
  [/MATH SHIELD DETECTED/g, 'ตรวจพบเกราะคณิตศาสตร์'],
  [/Enter answer\.\.\./g, 'ใส่คำตอบ...'],
  [/FIRE/g, 'ยิง'],
  [/UPGRADE/g, 'อัปเกรด'],
  [/SELL/g, 'ขาย'],
  [/System Upgrade Protocol/g, 'โปรโตคอลอัปเกรด'],
  [/DAMAGE/g, 'โจมตี'],
  [/RANGE/g, 'ระยะ'],
  [/SPEED/g, 'ความเร็ว'],
  [/CRIT/g, 'คริติคอล'],
  [/SPLASH/g, 'วงกว้าง'],
  [/SLOW/g, 'หน่วง'],
  [/VICTORY/g, 'ชัยชนะ'],
  [/MISSION ACCOMPLISHED/g, 'ภารกิจสำเร็จ'],
  [/GAME OVER/g, 'พ่ายแพ้'],
  [/BASE DESTROYED/g, 'ฐานทัพถูกทำลาย'],
  [/TRY AGAIN/g, 'ลองอีกครั้ง'],
  [/START PROTOCOL/g, 'เริ่มเกม'],
  [/SELECT PROTOCOL DIFFICULTY:/g, 'เลือกระดับความยาก:'],
  [/SELECT STAGE/g, 'เลือกสมรภูมิ'],
  [/ACKNOWLEDGE/g, 'รับทราบ'],
  [/ARMORY/g, 'คลังอาวุธ'],
  [/RANK/g, 'ยศ'],
  [/>MENU</g, '>เมนูหลัก<'],
  [/Cost:/g, 'ราคา:']
];

for (const [regex, replacement] of replacements) {
  code = code.replace(regex, replacement);
}

// Inject credits in the menu screen.
// We'll find the main menu div and inject the credits.
// Main menu is around: <div className="absolute inset-0 bg-[#07070a] z-50 flex items-center justify-center p-4">
// It ends before the final `</div>` of that block or we can just find the `<div className="w-full max-w-xl flex flex-col gap-6">` and add it.
// Let's add it right before the last closing div of the menu.
const menuEndPattern = /<\/div>\s*<\/div>\s*<\/div>\s*{\/\* 2\. Top HUD/g;
if (code.match(menuEndPattern)) {
  code = code.replace(menuEndPattern, `  <div className="mt-8 text-center text-[10px] font-mono text-cyan-500/40 tracking-widest uppercase">Created by MIKPURINUT</div>\n          </div>\n        </div>\n      </div>\n\n      {/* 2. Top HUD`);
}

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('Translated App.tsx');
