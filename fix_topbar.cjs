const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/min-w-\[70px\]/g, 'flex-1 items-center md:items-start text-center md:text-left');
code = code.replace(/min-w-\[80px\]/g, 'flex-1 items-center text-center');

// For the wave block which was items-start initially, we used items-center md:items-start
// But wait, the inner classes might need adjustment. Let's just do a string replacement for the specific blocks.
