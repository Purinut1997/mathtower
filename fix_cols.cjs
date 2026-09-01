const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/flex flex-col items-start flex-1 items-center md:items-start text-center md:text-left/g, 'flex flex-col flex-1 items-center text-center');
code = code.replace(/flex flex-col items-end flex-1 items-center md:items-start text-center md:text-left/g, 'flex flex-col flex-1 items-center text-center');
code = code.replace(/px-4 sm:px-6/g, 'px-2 sm:px-4'); // Reduce padding so it fits well on tiny phones

fs.writeFileSync('src/App.tsx', code, 'utf8');
