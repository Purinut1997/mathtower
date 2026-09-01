const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Set showHelp to true initially
code = code.replace(/const \[showHelp, setShowHelp\] = useState\(false\);/, 'const [showHelp, setShowHelp] = useState(true);');

// Update tutorial text
code = code.replace(/ลากป้อมจากแถบ <strong>คลังอาวุธ<\/strong> ไปวางบนช่องว่างในแผนที่/g, 'คลิกที่ <strong>ช่องว่างบนแผนที่</strong> เพื่อเปิดเมนูสร้าง แล้วเลือกป้อมปราการ');

fs.writeFileSync('src/App.tsx', code, 'utf8');
