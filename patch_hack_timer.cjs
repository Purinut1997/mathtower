const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\n    return \(\) => \{\n      if \(gameRef\.current\) gameRef\.current\.stop\(\);\n    \};\n  \}, \[\]\);/;

code = code.replace(regex, `useEffect(() => {
    return () => {
      if (gameRef.current) gameRef.current.stop();
    };
  }, []);

  // Timer for Hack Mana
  useEffect(() => {
    let timer: any;
    if (hackManaModal.show && hackManaModal.timeLeft > 0 && !hackManaModal.isSubmitting) {
      timer = setInterval(() => {
        setHackManaModal(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timer);
            return {
              ...prev,
              timeLeft: 0,
              isSubmitting: true,
              feedback: { isCorrect: false, message: 'หมดเวลา! พลาดโอกาสรับ Mana' }
            };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hackManaModal.show, hackManaModal.timeLeft, hackManaModal.isSubmitting]);`);
  
fs.writeFileSync('src/App.tsx', code, 'utf8');
