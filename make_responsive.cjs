const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Change the root return block to wrap the app in a mobile-constrained container
// From: return ( <div id="math-fortress-app" className="relative w-full h-screen...
// To: return ( <div className="fixed inset-0 bg-[#020205] flex items-center justify-center"> <div id="math-fortress-app" className="relative w-full h-full max-w-[500px] sm:max-h-[900px] sm:border-x sm:border-cyan-900/30 overflow-hidden font-sans...

code = code.replace(
  /return \(\s*<div\s+id="math-fortress-app"\s+className="relative w-full h-screen overflow-hidden/g,
  `return (\n    <div className="fixed inset-0 bg-black flex items-center justify-center">\n      <div\n      id="math-fortress-app"\n      className="relative w-full h-full max-w-[480px] sm:max-h-[850px] sm:rounded-[2rem] sm:border-4 sm:border-slate-800 sm:shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden`
);

// We need to add the closing div at the very end of the component
// Since it ends with );
code = code.replace(
  /    <\/div>\n  \);\n}/g,
  `    </div>\n    </div>\n  );\n}`
);

// Since we forced the layout to be vertical, we should remove the md: modifier styles that assume a landscape layout on desktop.
// Remove md:pl-32 md:pt-16 md:pb-4
code = code.replace(/ md:pl-32 md:pt-16 md:pb-4/g, '');

// Also, the side dock "md:top-24 md:bottom-auto md:left-3 md:w-[100px]" and "md:flex-col" etc.
// Let's replace the left/bottom tower dock div classes.
code = code.replace(/absolute bottom-20 left-3 right-3 md:right-auto md:top-24 md:bottom-auto md:left-3 md:w-\[100px\] z-20 flex md:flex-col gap-2 pointer-events-none/g, 
  'absolute bottom-[85px] left-3 right-3 z-20 flex gap-2 pointer-events-none');

code = code.replace(/flex-1 bg-slate-950\/80 backdrop-blur-md border border-cyan-500\/20 rounded-2xl flex flex-row md:flex-col items-center justify-around md:justify-start py-2 md:py-4 px-2 gap-2 md:gap-3 pointer-events-auto shadow-\[0_4px_20px_rgba\(0,0,0,0\.5\)\]/g,
  'flex-1 bg-slate-950/90 backdrop-blur-md border border-cyan-500/20 rounded-2xl flex flex-row items-center justify-around py-2 px-2 gap-2 pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]');

code = code.replace(/hidden md:flex flex-col items-center w-full pb-2 border-b border-cyan-500\/20/g, 'hidden');

code = code.replace(/w-14 h-14 md:w-full md:aspect-square flex flex-col items-center justify-center/g, 
  'w-14 h-14 flex flex-col items-center justify-center');

code = code.replace(/absolute bottom-full left-1\/2 -translate-x-1\/2 mb-3 md:mb-0 md:bottom-auto md:left-full md:top-1\/2 md:-translate-y-1\/2 md:-translate-x-0 md:ml-4/g,
  'absolute bottom-full left-1/2 -translate-x-1/2 mb-3');

code = code.replace(/md:hidden/g, '');
code = code.replace(/<div className="hidden md:block absolute top-1\/2 -left-2 -translate-y-1\/2 w-0 h-0 border-y-\[6px\] border-y-transparent border-r-\[8px\] border-r-cyan-500\/30"><\/div>/g, '');

// Also Commander Skills position
// From absolute bottom-4 left-4 md:bottom-6 md:left-6
code = code.replace(/absolute bottom-4 left-4 md:bottom-6 md:left-6 z-20 pointer-events-auto flex gap-3/g,
  'absolute bottom-3 left-1/2 -translate-x-1/2 w-max z-20 pointer-events-auto flex gap-3 bg-slate-950/80 p-2 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md');

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('Done!');
