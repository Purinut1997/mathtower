const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace all 'fixed inset-0' EXCEPT the first one which is the wrapper.
let i = 0;
code = code.replace(/className="fixed inset-0/g, (match) => {
  if (i === 0) {
    i++;
    return match; // First one is the root wrapper
  }
  return 'className="absolute inset-0';
});

fs.writeFileSync('src/App.tsx', code, 'utf8');
