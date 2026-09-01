export type DifficultyLevel = 'elementary' | 'intermediate' | 'advanced';

export interface MathPuzzle {
  question: string;
  options: number[];
  answer: number;
  explanationTh: string;
  source: 'ai' | 'local';
}

/**
 * Procedural math generator for zero-latency, high reliability puzzles across all difficulties.
 */
function generateProceduralPuzzle(
  difficulty: DifficultyLevel,
  towerType: string,
  towerLevel: number
): MathPuzzle {
  let question = '';
  let answer = 0;
  let explanationTh = '';

  if (difficulty === 'elementary') {
    // Basic addition & subtraction (values up to 50)
    const a = Math.floor(Math.random() * 20) + 5;
    const b = Math.floor(Math.random() * 20) + 2;

    if (towerType === '-' || (towerType !== '+' && Math.random() > 0.5)) {
      const sum = a + b;
      const type = Math.random();
      if (type < 0.33) {
        question = `${sum} - ${a} = ?`;
        answer = b;
        explanationTh = `ลบเลข: ${sum} หักออก ${a} จะได้คำตอบคือ ${b}`;
      } else if (type < 0.66) {
        question = `? - ${b} = ${a}`;
        answer = sum;
        explanationTh = `หาตัวตั้ง: นำ ${a} + ${b} = ${sum}`;
      } else {
        question = `${sum} - ? = ${a}`;
        answer = b;
        explanationTh = `หาตัวลบ: นำ ${sum} - ${a} = ${b}`;
      }
    } else {
      const sum = a + b;
      if (Math.random() > 0.5) {
        question = `${a} + ${b} = ?`;
        answer = sum;
        explanationTh = `บวกเลข: นำ ${a} รวมกับ ${b} ได้ ${sum}`;
      } else {
        question = `${a} + ? = ${sum}`;
        answer = b;
        explanationTh = `หาค่าผลบวก: นำ ${sum} - ${a} = ${b}`;
      }
    }
  } else if (difficulty === 'intermediate') {
    // Multiplication, Division, Order of Operations (values up to 150)
    if (towerType === '/' || (towerType !== '*' && Math.random() > 0.5)) {
      const divisor = Math.floor(Math.random() * 9) + 2;
      const quotient = Math.floor(Math.random() * 12) + 2;
      const dividend = divisor * quotient;

      if (Math.random() > 0.5) {
        question = `${dividend} ÷ ${divisor} = ?`;
        answer = quotient;
        explanationTh = `หารลงตัว: ${dividend} แบ่งออก ${divisor} ส่วน เท่ากับ ${quotient}`;
      } else {
        question = `${dividend} ÷ ? = ${quotient}`;
        answer = divisor;
        explanationTh = `หาตัวหาร: นำ ${dividend} ÷ ${quotient} = ${divisor}`;
      }
    } else if (towerType === '*' || Math.random() > 0.5) {
      const a = Math.floor(Math.random() * 12) + 3;
      const b = Math.floor(Math.random() * 9) + 2;
      const prod = a * b;

      if (Math.random() > 0.5) {
        question = `${a} × ${b} = ?`;
        answer = prod;
        explanationTh = `สูตรคูณ: ${a} คูณ ${b} ได้ผลลัพธ์เป็น ${prod}`;
      } else {
        question = `${a} × ? = ${prod}`;
        answer = b;
        explanationTh = `หาตัวคูณ: นำ ${prod} ÷ ${a} = ${b}`;
      }
    } else {
      // Mixed operations e.g. (a * b) + c = ?
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 6) + 2;
      const c = Math.floor(Math.random() * 20) + 5;
      answer = a * b + c;
      question = `(${a} × ${b}) + ${c} = ?`;
      explanationTh = `คำนวณในวงเล็บก่อน: (${a}×${b}=${a * b}) แล้วนำไป + ${c} = ${answer}`;
    }
  } else {
    // Advanced: Algebra equations & variable solving
    const x = Math.floor(Math.random() * 10) + 1;
    const a = Math.floor(Math.random() * 5) + 2;
    const b = Math.floor(Math.random() * 15) + 1;
    const result = a * x + b;

    const pattern = Math.floor(Math.random() * 3);
    if (pattern === 0) {
      question = `หาค่า x: ${a}x + ${b} = ${result}`;
      answer = x;
      explanationTh = `แก้สมการ: ${a}x = ${result} - ${b} (${result - b}) => x = ${result - b} ÷ ${a} = ${x}`;
    } else if (pattern === 1) {
      const c = Math.floor(Math.random() * 4) + 2;
      const k = Math.floor(Math.random() * 8) + 2;
      const ansX = k * c;
      const rhs = ansX / c + b;
      question = `หาค่า x: (x ÷ ${c}) + ${b} = ${rhs}`;
      answer = ansX;
      explanationTh = `ย้ายข้าง: (x ÷ ${c}) = ${rhs - b} => x = ${rhs - b} × ${c} = ${ansX}`;
    } else {
      const ans = Math.floor(Math.random() * 8) + 2;
      const sq = ans * ans;
      const diff = Math.floor(Math.random() * 10) + 5;
      question = `หาค่า n: n² - ${diff} = ${sq - diff}`;
      answer = ans;
      explanationTh = `ย้ายข้าง: n² = ${sq} => ถอดรากที่สอง n = ${ans}`;
    }
  }

  // Generate 4 plausible distinct answer choices
  const optionsSet = new Set<number>([answer]);
  const deltas = [-3, -2, -1, 1, 2, 3, 5, -5, 10, -10];

  while (optionsSet.size < 4) {
    const delta = deltas[Math.floor(Math.random() * deltas.length)];
    const candidate = answer + delta;
    if (candidate >= 0 && candidate !== answer) {
      optionsSet.add(candidate);
    }
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

  return {
    question,
    options,
    answer,
    explanationTh,
    source: 'local'
  };
}

/**
 * Fetches an AI dynamic puzzle with fallback to procedural generation.
 */
export async function generateDynamicMathPuzzle(
  difficulty: DifficultyLevel,
  towerType: string,
  towerLevel: number
): Promise<MathPuzzle> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/math-puzzle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty, towerType, towerLevel }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.question && Array.isArray(data.options) && typeof data.answer === 'number') {
        return {
          question: data.question,
          options: data.options,
          answer: data.answer,
          explanationTh: data.explanationTh || 'ตอบถูกต้อง! ป้อมได้รับการอัปเกรดเรียบร้อย',
          source: 'ai'
        };
      }
    }
  } catch (err) {
    // Graceful fallback if backend is offline or slow
  }

  return generateProceduralPuzzle(difficulty, towerType, towerLevel);
}
