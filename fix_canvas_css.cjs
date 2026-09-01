const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /className="w-full h-full max-w-\[600px\] max-h-\[840px\] object-contain rounded-xl block mx-auto touch-none bg-\[#07070a\]"/g,
  'className="w-full max-w-[600px] max-h-full rounded-xl block mx-auto touch-none bg-[#07070a]" style={{ aspectRatio: "10/14", objectFit: "contain" }}'
);
// Wait, if I just use 'max-w-full max-h-full h-auto w-auto aspect-[10/14]', it works perfectly.
code = code.replace(/style={{ aspectRatio: '10\/14' }}/g, '');
code = code.replace(/className="w-full max-w-\[600px\] max-h-full rounded-xl block mx-auto touch-none bg-\[#07070a\]" style={{ aspectRatio: "10\/14", objectFit: "contain" }}/g,
  'className="max-w-full max-h-full w-auto h-auto rounded-xl block mx-auto touch-none bg-[#07070a] shadow-lg" style={{ aspectRatio: "10/14" }}'
);

// We need to be careful with the parent. 
// <div className="absolute inset-0 z-0 flex items-center justify-center p-2 pt-24 pb-24">
// <div className="relative p-1.5 md:p-2 rounded-2xl bg-slate-900/50 backdrop-blur-sm shadow-[0_0_40px_-10px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20">

// To ensure max-h-full works on the canvas, its parent must have a bounded height.
// The parent is a relatively positioned div. It should fit the canvas.
code = code.replace(
  /<div className="relative p-1\.5 md:p-2 rounded-2xl bg-slate-900\/50 backdrop-blur-sm shadow-\[0_0_40px_-10px_rgba\(34,211,238,0\.15\)\] ring-1 ring-cyan-500\/20">/g,
  '<div className="relative p-1.5 rounded-2xl bg-slate-900/50 backdrop-blur-sm shadow-[0_0_40px_-10px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20 flex items-center justify-center h-full max-h-[840px] w-full max-w-[600px]">'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
