export interface StageConfig {
  id: string;
  name: string;
  desc: string;
  biome: 'forest' | 'desert' | 'volcano';
  biomeName: string;
  path: { c: number; r: number }[];
  startMana: number;
}

export const Config = {
  COLS: 10,
  ROWS: 14,
  TILE_SIZE: 60,
  get CANVAS_WIDTH() { return this.COLS * this.TILE_SIZE; },
  get CANVAS_HEIGHT() { return this.ROWS * this.TILE_SIZE; },
  START_MANA: 450,
  BASE_HP: 100,
  SELL_REFUND_RATE: 0.7, // 70% refund on dismantle
  
  // COMMANDER SKILLS
  SKILLS: {
    EMP: { id: 'EMP', name: 'ระเบิด EMP', cost: 150, cooldown: 600, color: '#38bdf8', icon: '❄️' },
    LASER: { id: 'LASER', name: 'เลเซอร์อวกาศ', cost: 300, cooldown: 1200, color: '#ef4444', icon: '⚡' },
    OVERCLOCK: { id: 'OVERCLOCK', name: 'โอเวอร์คล็อก', cost: 200, cooldown: 900, color: '#10b981', icon: '🔥' }
  },

  STAGES: [
    {
      id: 'nexus',
      name: 'ป่าพฤกษาเวทมนตร์ (Verdant Forest)',
      desc: 'ป่าเวทมนตร์อันเขียวชอุ่ม ล้อมรอบด้วยแม่น้ำและต้นไม้เรืองแสง',
      biome: 'forest',
      biomeName: 'ป่าโบราณ (Emerald Forest)',
      startMana: 450,
      path: [
        { c: 4, r: -1 }, { c: 4, r: 0 }, { c: 4, r: 1 }, { c: 4, r: 2 },
        { c: 3, r: 2 }, { c: 2, r: 2 }, { c: 2, r: 3 }, { c: 2, r: 4 }, { c: 2, r: 5 },
        { c: 3, r: 5 }, { c: 4, r: 5 }, { c: 5, r: 5 }, { c: 6, r: 5 }, { c: 7, r: 5 },
        { c: 7, r: 6 }, { c: 7, r: 7 }, { c: 7, r: 8 }, { c: 6, r: 8 }, { c: 5, r: 8 },
        { c: 4, r: 8 }, { c: 3, r: 8 }, { c: 3, r: 9 }, { c: 3, r: 10 }, { c: 3, r: 11 },
        { c: 4, r: 11 }, { c: 5, r: 11 }, { c: 5, r: 12 }, { c: 5, r: 13 }, { c: 5, r: 14 }
      ]
    },
    {
      id: 'spiral',
      name: 'ทะเลทรายทองคำโอเอซิส (Golden Oasis)',
      desc: 'เนินทรายสีทองตัดกับโอเอซิสสายน้ำชอุ่ม ศัตรูต้องเดินวนอ้อม',
      biome: 'desert',
      biomeName: 'ทะเลทรายโอเอซิส (Golden Desert)',
      startMana: 500,
      path: [
        { c: -1, r: 1 }, { c: 0, r: 1 }, { c: 1, r: 1 }, { c: 2, r: 1 }, { c: 3, r: 1 }, { c: 4, r: 1 }, { c: 5, r: 1 }, { c: 6, r: 1 }, { c: 7, r: 1 }, { c: 8, r: 1 },
        { c: 8, r: 2 }, { c: 8, r: 3 }, { c: 8, r: 4 }, { c: 8, r: 5 }, { c: 8, r: 6 }, { c: 8, r: 7 }, { c: 8, r: 8 }, { c: 8, r: 9 }, { c: 8, r: 10 }, { c: 8, r: 11 },
        { c: 7, r: 11 }, { c: 6, r: 11 }, { c: 5, r: 11 }, { c: 4, r: 11 }, { c: 3, r: 11 }, { c: 2, r: 11 }, { c: 1, r: 11 },
        { c: 1, r: 10 }, { c: 1, r: 9 }, { c: 1, r: 8 }, { c: 1, r: 7 }, { c: 1, r: 6 }, { c: 1, r: 5 }, { c: 1, r: 4 },
        { c: 2, r: 4 }, { c: 3, r: 4 }, { c: 4, r: 4 }, { c: 5, r: 4 }, { c: 6, r: 4 },
        { c: 6, r: 5 }, { c: 6, r: 6 }, { c: 6, r: 7 }, { c: 6, r: 8 },
        { c: 5, r: 8 }, { c: 4, r: 8 }, { c: 3, r: 8 },
        { c: 3, r: 7 }, { c: 3, r: 6 },
        { c: 4, r: 6 } // Core at the center
      ]
    },
    {
      id: 'crossfire',
      name: 'หุบเขาลาวาภูเขาไฟ (Volcanic Caldera)',
      desc: 'สมรภูมิหินอัคนี ธารลาวาเดือดพล่าน และสะเก็ดไฟร้อนแรง',
      biome: 'volcano',
      biomeName: 'หุบเขาลาวา (Volcanic Crags)',
      startMana: 600,
      path: [
        { c: 1, r: -1 }, { c: 1, r: 0 }, { c: 1, r: 1 }, { c: 1, r: 2 }, { c: 2, r: 2 }, { c: 3, r: 2 }, { c: 4, r: 2 }, { c: 5, r: 2 }, { c: 6, r: 2 }, { c: 7, r: 2 }, { c: 8, r: 2 },
        { c: 8, r: 3 }, { c: 8, r: 4 }, { c: 7, r: 4 }, { c: 6, r: 4 }, { c: 5, r: 4 }, { c: 4, r: 4 }, { c: 3, r: 4 }, { c: 2, r: 4 }, { c: 1, r: 4 },
        { c: 1, r: 5 }, { c: 1, r: 6 }, { c: 1, r: 7 }, { c: 2, r: 7 }, { c: 3, r: 7 }, { c: 4, r: 7 }, { c: 5, r: 7 }, { c: 6, r: 7 }, { c: 7, r: 7 }, { c: 8, r: 7 },
        { c: 8, r: 8 }, { c: 8, r: 9 }, { c: 8, r: 10 }, { c: 7, r: 10 }, { c: 6, r: 10 }, { c: 5, r: 10 }, { c: 4, r: 10 }, { c: 3, r: 10 }, { c: 2, r: 10 }, { c: 1, r: 10 },
        { c: 1, r: 11 }, { c: 1, r: 12 }, { c: 2, r: 12 }, { c: 3, r: 12 }, { c: 4, r: 12 }, { c: 5, r: 12 }
      ]
    }
  ] as StageConfig[],

  TOWER_COSTS: {
    '+': 100,
    '-': 160,
    '*': 260,
    '/': 380
  },
  TOWER_DATA: {
    '+': {
      name: 'Addition Beam',
      titleTh: 'ป้อมบวก (เร่งยิงฉับไว)',
      color: '#38bdf8', // Cyan
      badge: 'Rapid Fire',
      descTh: 'ยิงลำแสงอนุภาคความถี่สูง ดาเมจต่อเนื่อง เหมาะสำหรับสกัดศัตรูกลุ่มแรก',
      range: 135,
      damage: 12,
      fireRate: 20
    },
    '-': {
      name: 'Subtraction Blast',
      titleTh: 'ป้อมลบ (ระเบิดวงกว้าง)',
      color: '#f43f5e', // Rose
      badge: 'AoE Splash',
      descTh: 'ยิงขีปนาวุธลบสสาร ระเบิดสร้างความเสียหายรอบจุดตก (รัศมี 65px)',
      range: 155,
      damage: 28,
      fireRate: 48,
      splashRadius: 65
    },
    '*': {
      name: 'Multiplication Pulse',
      titleTh: 'ป้อมคูณ (คริติคอลทะลุเกราะ)',
      color: '#10b981', // Emerald
      badge: 'Crit Burst',
      descTh: 'ยิงเลเซอร์พลังงานทวีคูณ มีโอกาส 35% ติด Critical แรงขึ้น 2.5 เท่า!',
      range: 120,
      damage: 48,
      fireRate: 54,
      critChance: 0.35,
      critMultiplier: 2.5
    },
    '/': {
      name: 'Division Stasis',
      titleTh: 'ป้อมหาร (สโลว์ศัตรู 50%)',
      color: '#fbbf24', // Amber
      badge: 'Stasis Slow',
      descTh: 'ลดความเร็วศัตรูลง 50% เป็นเวลา 3 วินาที พร้อมสร้างดาเมจเจาะเกราะหนัก',
      range: 190,
      damage: 75,
      fireRate: 75,
      slowFactor: 0.5,
      slowDuration: 180 // frames (3 seconds at 60fps)
    }
  }
};
