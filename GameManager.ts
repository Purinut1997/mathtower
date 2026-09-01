import { Config, StageConfig } from './config';
import { Enemy, Tower, Projectile, FloatingText, Particle, EnemyType } from './Entities';
import { Renderer, DragPreviewState } from './Renderer';
import { InputManager } from './InputManager';
import { sounds } from './SoundManager';
import { DifficultyLevel } from './MathAPI';

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER';

export interface WaveDefinition {
  waveNumber: number;
  isBoss: boolean;
  bossName?: string;
  enemies: { type: EnemyType; delay: number }[];
}

export class GameManager {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  renderer: Renderer;
  inputManager: InputManager;

  state: GameState = 'MENU';
  difficulty: DifficultyLevel = 'intermediate';

  currentStageIndex: number = 0;
  stageConfig: StageConfig;
  gridPath: { c: number; r: number }[];

  mana: number;
  baseHp: number = Config.BASE_HP;
  wave: number = 1;
  maxWaves: number = 20;
  isEndless: boolean = false;

  speedMultiplier: number = 1; // 1x, 2x, 3x

  towers: Tower[] = [];
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];

  selectedTower: Tower | null = null;
  dragPreview: DragPreviewState | null = null;

  pathPixels: { x: number; y: number }[];
  frameCount: number = 0;

  // Wave spawn queue
  waveQueue: { type: EnemyType; delay: number; shield?: { equation: string; answer: number } }[] = [];
  waveSpawnTimer: number = 0;
  waveIntervalTimer: number = 300; // Countdown between waves
  isWaveSpawning: boolean = false;
  bossAlertBanner: string | null = null;

  totalKills: number = 0;
  totalEquationsSolved: number = 0;
  score: number = 0;
  skillCooldowns: { [key: string]: number } = {};

  onStateChange: (data: any) => void;
  onUpgradeRequest: (tower: Tower) => void;
    onEmptyGridClick: (col: number, row: number) => void;

  animationId: number = 0;
  lastTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    difficulty: DifficultyLevel,
    onStateChange: (data: any) => void,
    onUpgradeRequest: (tower: Tower) => void,
    onEmptyGridClick: (col: number, row: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.difficulty = difficulty;
    this.onStateChange = onStateChange;
    this.onUpgradeRequest = onUpgradeRequest;
    this.onEmptyGridClick = onEmptyGridClick;

    this.stageConfig = Config.STAGES[0];
    this.gridPath = this.stageConfig.path;
    this.mana = this.stageConfig.startMana;

    this.canvas.width = Config.CANVAS_WIDTH;
    this.canvas.height = Config.CANVAS_HEIGHT;

    this.renderer = new Renderer(this.ctx, this.gridPath, this.stageConfig);
    this.inputManager = new InputManager(this.canvas);

    this.pathPixels = this.gridPath.map((p) => ({
      x: p.c * Config.TILE_SIZE + Config.TILE_SIZE / 2,
      y: p.r * Config.TILE_SIZE + Config.TILE_SIZE / 2
    }));

    this.setupGridClickListener();
    this.prepareWave(1);
    this.notifyState();
  }

  private setupGridClickListener() {
    this.canvas.addEventListener('gridClick', ((e: CustomEvent) => {
      const { col, row } = e.detail;
      this.handleGridClick(col, row);
    }) as EventListener);
  }

  loadStage(stageIndex: number) {
    if (stageIndex < 0 || stageIndex >= Config.STAGES.length) stageIndex = 0;
    this.currentStageIndex = stageIndex;
    this.stageConfig = Config.STAGES[stageIndex];
    this.gridPath = this.stageConfig.path;
    this.renderer = new Renderer(this.ctx, this.gridPath, this.stageConfig);
    
    this.pathPixels = this.gridPath.map((p) => ({
      x: p.c * Config.TILE_SIZE + Config.TILE_SIZE / 2,
      y: p.r * Config.TILE_SIZE + Config.TILE_SIZE / 2
    }));

    this.reset();
  }

  reset() {
    this.mana = this.stageConfig.startMana;
    this.baseHp = Config.BASE_HP;
    this.wave = 1;
    this.isEndless = false;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.selectedTower = null;
    this.dragPreview = null;
    this.frameCount = 0;
    this.waveQueue = [];
    this.isWaveSpawning = false;
    this.waveIntervalTimer = 300;
    this.bossAlertBanner = null;
    
    this.totalKills = 0;
    this.totalEquationsSolved = 0;
    this.score = 0;
    this.skillCooldowns = {};

    this.notifyState();
    this.prepareWave(this.wave);
  }

  calculateRank(): string {
    if (this.baseHp >= Config.BASE_HP && this.score > 15000) return 'S';
    if (this.baseHp > Config.BASE_HP * 0.7) return 'A';
    if (this.baseHp > Config.BASE_HP * 0.3) return 'B';
    return 'C';
  }

  start() {
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    sounds.startBgm('battle');
    this.loop(this.lastTime);
  }

  stop() {
    cancelAnimationFrame(this.animationId);
    sounds.stopBgm();
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      sounds.stopBgm();
      this.notifyState();
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      sounds.startBgm(this.wave % 5 === 0 ? 'boss' : 'battle');
      this.loop(this.lastTime);
      this.notifyState();
    }
  }

  setSpeed(speed: number) {
    this.speedMultiplier = speed;
    sounds.setSpeed(speed);
    sounds.playSpeedToggle(speed);
    this.notifyState();
  }

  loop(time: number) {
    if (this.state !== 'PLAYING') return;

    // Execute ticks scaled by speed multiplier
    for (let step = 0; step < this.speedMultiplier; step++) {
      this.update();
    }

    this.renderer.draw(
      this.towers,
      this.enemies,
      this.projectiles,
      this.particles,
      this.floatingTexts,
      this.selectedTower,
      this.dragPreview,
      this.wave,
      this.mana,
      this.baseHp
    );

    this.animationId = requestAnimationFrame(this.loop.bind(this));
  }

  prepareWave(waveNumber: number) {
    this.wave = waveNumber;
    this.waveQueue = [];
    this.isWaveSpawning = true;
    this.waveSpawnTimer = 0;

    const isBoss = waveNumber % 5 === 0;
    if (isBoss) {
      this.bossAlertBanner = `🚨 BOSS WAVE ${waveNumber}: Singularity Overlord 🚨`;
      sounds.setBgmMode('boss');
      sounds.playBossAlert();
      setTimeout(() => {
        this.bossAlertBanner = null;
        this.notifyState();
      }, 4000);
      
      const genMath = () => {
        const a = Math.floor(Math.random() * 20) + 10;
        const b = Math.floor(Math.random() * 10) + 2;
        return { question: `${a} × ${b}`, answer: a * b };
      };

      const mathProblem = genMath();
      this.waveQueue.push({ type: 'boss', delay: 100, shield: { equation: mathProblem.question, answer: mathProblem.answer } });
      if (waveNumber >= 15) {
        const mathProblem2 = genMath();
        this.waveQueue.push({ type: 'boss', delay: 180, shield: { equation: mathProblem2.question, answer: mathProblem2.answer } });
      }
    } else {
      sounds.setBgmMode('battle');
      sounds.playWaveStart();
    }

    // Generate wave enemy lineup
    const standardCount = Math.min(18, 4 + waveNumber * 2);
    const fastCount = waveNumber >= 2 ? Math.min(12, Math.floor(waveNumber * 1.5)) : 0;
    const tankCount = waveNumber >= 4 ? Math.min(8, Math.floor(waveNumber * 0.8)) : 0;

    for (let i = 0; i < standardCount; i++) {
      this.waveQueue.push({ type: 'standard', delay: 45 + Math.random() * 20 });
    }
    for (let i = 0; i < fastCount; i++) {
      this.waveQueue.push({ type: 'fast', delay: 35 + Math.random() * 15 });
    }
    for (let i = 0; i < tankCount; i++) {
      this.waveQueue.push({ type: 'tank', delay: 70 + Math.random() * 30 });
    }

    // Shuffle queue slightly while keeping boss near middle/end
    this.waveQueue.sort(() => Math.random() - 0.5);

    this.notifyState();
  }

  callWaveEarly() {
    if (!this.isWaveSpawning && this.waveIntervalTimer > 0) {
      const earlyBonus = Math.floor(this.waveIntervalTimer * 0.4);
      this.mana += earlyBonus;
      this.score += earlyBonus * 5;
      this.floatingTexts.push(
        new FloatingText(Config.CANVAS_WIDTH / 2, 80, `เรียกเวฟล่วงหน้า: +${earlyBonus} มานา`, '#38bdf8', 15)
      );
      sounds.playManaGain();
      this.waveIntervalTimer = 0;
      this.prepareWave(this.wave + 1);
    }
  }

  activateSkill(skillId: string) {
    if (this.state !== 'PLAYING') return;
    const skillConfig = Config.SKILLS[skillId as keyof typeof Config.SKILLS];
    if (!skillConfig) return;
    
    const cd = this.skillCooldowns[skillId] || 0;
    if (cd > 0) return; 
    if (this.mana < skillConfig.cost) return;

    this.mana -= skillConfig.cost;
    this.skillCooldowns[skillId] = skillConfig.cooldown;
    sounds.playBuild(); // reuse for skill activation

    if (skillId === 'EMP') {
      sounds.playSkillEMP();
      this.enemies.forEach(e => e.applySlow(1.0, 180));
      this.floatingTexts.push(new FloatingText(Config.CANVAS_WIDTH / 2, Config.CANVAS_HEIGHT / 2, 'ระเบิด EMP!', '#38bdf8', 24, true));
      for(let i=0; i<30; i++) this.particles.push(new Particle(Config.CANVAS_WIDTH/2, Config.CANVAS_HEIGHT/2, (Math.random()-0.5)*15, (Math.random()-0.5)*15, '#38bdf8', 40, 5));
    } 
    else if (skillId === 'LASER') {
      sounds.playSkillLaser();
      this.enemies.forEach(e => {
        if (!e.isShielded) e.hp -= 200;
        this.particles.push(new Particle(e.x, e.y, 0, -2, '#ef4444', 30, 8));
      });
      this.floatingTexts.push(new FloatingText(Config.CANVAS_WIDTH / 2, Config.CANVAS_HEIGHT / 2, 'เลเซอร์อวกาศ!', '#ef4444', 24, true));
    }
    else if (skillId === 'OVERCLOCK') {
      sounds.playSkillOverclock();
      this.towers.forEach(t => t.cooldown = 0);
      this.floatingTexts.push(new FloatingText(Config.CANVAS_WIDTH / 2, Config.CANVAS_HEIGHT / 2, 'โอเวอร์คล็อก!', '#10b981', 24, true));
    }
    this.notifyState();
  }

  submitBossAnswer(answer: number) {
    const boss = this.enemies.find(e => e.type === 'boss' && e.isShielded);
    if (boss) {
      if (boss.shieldAnswer === answer) {
        boss.isShielded = false;
        sounds.playCorrect();
        this.floatingTexts.push(new FloatingText(boss.x, boss.y, 'ทำลายเกราะ!', '#10b981', 18, true));
        this.score += 500;
        this.totalEquationsSolved++;
      } else {
        sounds.playWrong();
        this.floatingTexts.push(new FloatingText(boss.x, boss.y, 'ผิดพลาด', '#ef4444', 18, true));
        this.score = Math.max(0, this.score - 50);
      }
      this.notifyState();
    }
  }

  update() {
    if (this.state !== 'PLAYING') return;
    this.frameCount++;

    // Update Skill Cooldowns
    for (const key in this.skillCooldowns) {
      if (this.skillCooldowns[key] > 0) this.skillCooldowns[key]--;
    }

    // Wave Spawner
    if (this.isWaveSpawning) {
      this.waveSpawnTimer++;
      if (this.waveQueue.length > 0) {
        const next = this.waveQueue[0];
        if (this.waveSpawnTimer >= next.delay) {
          this.waveSpawnTimer = 0;
          const spawned = this.waveQueue.shift()!;
          this.enemies.push(new Enemy(this.pathPixels, spawned.type, this.wave, spawned.shield));
        }
      } else {
        this.isWaveSpawning = false;
        this.waveIntervalTimer = 600; // 10 seconds before next wave
      }
    } else {
      // Countdown to next wave when all current enemies are dead
      if (this.enemies.length === 0) {
        this.waveIntervalTimer--;
        if (this.waveIntervalTimer <= 0) {
          if (this.wave >= this.maxWaves && !this.isEndless) {
            this.state = 'VICTORY';
            this.score += this.baseHp * 20; // HP Bonus
            sounds.stopBgm();
            sounds.playVictory();
            this.notifyState();
            return;
          }
          this.prepareWave(this.wave + 1);
        }
      }
    }

    // Passive Mana generation
    if (this.frameCount % 60 === 0) {
      this.mana += 2;
      this.score += 1;
      this.notifyState();
    }

    // Update Enemies
    for (const e of this.enemies) {
      e.update();
      if (e.active && e.waypointIndex >= this.pathPixels.length) {
        e.active = false;
        const damageToBase = e.type === 'boss' ? 40 : e.type === 'tank' ? 20 : 10;
        this.baseHp -= damageToBase;
        this.score = Math.max(0, this.score - damageToBase * 10);
        sounds.playExplosion();

        // Shake or damage visual
        this.floatingTexts.push(
          new FloatingText(Config.CANVAS_WIDTH / 2, Config.CANVAS_HEIGHT - 60, `ฐานถูกโจมตี -${damageToBase}`, '#ef4444', 16, true)
        );

        this.notifyState();
        if (this.baseHp <= 0) {
          this.state = 'GAMEOVER';
          sounds.stopBgm();
          sounds.playGameOver();
          this.notifyState();
        }
      }
    }

    // Update Towers
    this.towers.forEach((t) =>
      t.update(this.enemies, (p) => this.projectiles.push(p))
    );

    // Update Projectiles
    this.projectiles.forEach((p) =>
      p.update(
        this.enemies,
        (ft) => this.floatingTexts.push(ft),
        (pList) => this.particles.push(...pList),
        (enemy) => this.handleEnemyKilled(enemy)
      )
    );

    // Update Particles
    this.particles.forEach((part) => part.update());

    // Update Floating Texts
    this.floatingTexts.forEach((ft) => ft.update());

    // Clean up inactive objects
    this.enemies = this.enemies.filter((e) => e.active);
    this.projectiles = this.projectiles.filter((p) => p.active);
    this.particles = this.particles.filter((part) => part.life > 0);
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  handleEnemyKilled(enemy: Enemy) {
    this.totalKills++;
    this.mana += enemy.manaReward;
    this.score += enemy.manaReward * 5;
    sounds.playManaGain();

    // Spawn floating Mana text
    this.floatingTexts.push(
      new FloatingText(enemy.x, enemy.y, `+${enemy.manaReward} มานา`, '#38bdf8', 14)
    );

    // Spawn defeat glyph particles
    const glyphs = ['+', '-', '×', '÷', '='];
    const pList: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const g = glyphs[Math.floor(Math.random() * glyphs.length)];
      pList.push(
        new Particle(
          enemy.x + (Math.random() - 0.5) * 16,
          enemy.y + (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          '#22d3ee',
          25,
          10,
          false,
          g
        )
      );
    }
    this.particles.push(...pList);

    this.notifyState();
  }

  handleGridClick(col: number, row: number) {
    if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

    if (col < 0 || col >= Config.COLS || row < 0 || row >= Config.ROWS) return;

    const tower = this.towers.find((t) => t.col === col && t.row === row);
    if (tower) {
      this.selectedTower = tower;
      this.notifyState();
      sounds.playSelect();
    } else {
      this.selectedTower = null;
      this.notifyState();
      
      const onPath = this.gridPath.some((p) => p.c === col && p.r === row);
      if (!onPath && this.onEmptyGridClick) {
        this.onEmptyGridClick(col, row);
      }
    }
  }

  selectTower(tower: Tower | null) {
    this.selectedTower = tower;
    this.notifyState();
  }

  sellSelectedTower() {
    if (!this.selectedTower) return;
    const t = this.selectedTower;
    const refund = t.getSellValue();
    this.mana += refund;
    sounds.playSell();

    this.floatingTexts.push(
      new FloatingText(t.x, t.y, `แยกชิ้นส่วน: +${refund} มานา`, '#10b981', 15)
    );

    this.towers = this.towers.filter((item) => item !== t);
    this.selectedTower = null;
    this.notifyState();
  }

  upgradeSelectedTower() {
    if (!this.selectedTower) return;
    const cost = this.selectedTower.getUpgradeCost();
    if (this.mana < cost) return;

    this.pause();
    this.onUpgradeRequest(this.selectedTower);
  }

  confirmTowerUpgrade(tower: Tower) {
    const cost = tower.getUpgradeCost();
    if (this.mana >= cost) {
      this.mana -= cost;
      tower.upgrade();
      this.totalEquationsSolved++;
      this.score += 100 * tower.level;
      sounds.playCorrect();

      this.floatingTexts.push(
        new FloatingText(tower.x, tower.y, `อัปเกรดแล้ว! Lv.${tower.level}`, '#38bdf8', 16, true)
      );

      // Level up aura particles
      for (let i = 0; i < 24; i++) {
        const ang = (Math.PI * 2 * i) / 24;
        this.particles.push(
          new Particle(
            tower.x,
            tower.y,
            Math.cos(ang) * 3,
            Math.sin(ang) * 3,
            '#38bdf8',
            30,
            4
          )
        );
      }
    }
    this.resume();
  }

  setDragPreview(type: string | null, clientX: number, clientY: number) {
    if (!type) {
      this.dragPreview = null;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.floor(x / Config.TILE_SIZE);
    const row = Math.floor(y / Config.TILE_SIZE);

    const isInside = col >= 0 && col < Config.COLS && row >= 0 && row < Config.ROWS;
    const onPath = this.gridPath.some((p) => p.c === col && p.r === row);
    const occupied = this.towers.some((t) => t.col === col && t.row === row);
    const cost = Config.TOWER_COSTS[type as keyof typeof Config.TOWER_COSTS] || 100;
    const canAfford = this.mana >= cost;

    const isValid = isInside && !onPath && !occupied && canAfford;

    this.dragPreview = {
      type,
      col,
      row,
      isValid,
      clientX,
      clientY
    };
  }

  buildTowerAt(col: number, row: number, type: string) {
    if (this.state !== 'PLAYING') return;
    if (col < 0 || col >= Config.COLS || row < 0 || row >= Config.ROWS) return;
    if (this.gridPath.some((p) => p.c === col && p.r === row)) return;
    if (this.towers.some((t) => t.col === col && t.row === row)) return;

    const cost = Config.TOWER_COSTS[type as keyof typeof Config.TOWER_COSTS];
    if (this.mana >= cost) {
      this.mana -= cost;
      const x = col * Config.TILE_SIZE + Config.TILE_SIZE / 2;
      const y = row * Config.TILE_SIZE + Config.TILE_SIZE / 2;
      const newTower = new Tower(col, row, type);
      this.towers.push(newTower);
      sounds.playBuild();

      this.floatingTexts.push(
        new FloatingText(newTower.x, newTower.y, `-${cost} มานา`, '#38bdf8', 14)
      );

      this.selectedTower = null;
      this.notifyState();
      return true;
    }
    return false;
  }
  
  tryPlaceTower(clientX: number, clientY: number, type: string) {
    this.dragPreview = null;
    if (this.state !== 'PLAYING') return;

    const rect = this.canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    )
      return;

    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.floor(x / Config.TILE_SIZE);
    const row = Math.floor(y / Config.TILE_SIZE);

    if (col < 0 || col >= Config.COLS || row < 0 || row >= Config.ROWS) return;
    if (this.gridPath.some((p) => p.c === col && p.r === row)) return;
    if (this.towers.some((t) => t.col === col && t.row === row)) return;

    const cost = Config.TOWER_COSTS[type as keyof typeof Config.TOWER_COSTS];
    if (this.mana >= cost) {
      this.mana -= cost;
      const newTower = new Tower(col, row, type);
      this.towers.push(newTower);
      sounds.playBuild();

      this.floatingTexts.push(
        new FloatingText(newTower.x, newTower.y, `-${cost} มานา`, '#38bdf8', 14)
      );

      this.selectedTower = null;
      this.notifyState();
    }
  }

  enableEndlessMode() {
    this.isEndless = true;
    this.state = 'PLAYING';
    this.prepareWave(this.wave + 1);
    this.resume();
  }

  notifyState() {
    const boss = this.enemies.find(e => e.type === 'boss' && e.isShielded);
    this.onStateChange({
      mana: this.mana,
      baseHp: this.baseHp,
      wave: this.wave,
      state: this.state,
      speed: this.speedMultiplier,
      selectedTower: this.selectedTower,
      bossAlert: this.bossAlertBanner,
      nextWaveIn: Math.ceil(this.waveIntervalTimer / 60),
      isWaveSpawning: this.isWaveSpawning,
      score: this.score,
      skillCooldowns: this.skillCooldowns,
      bossShield: boss ? { equation: boss.shieldEquation } : null,
      rank: this.state === 'VICTORY' || this.state === 'GAMEOVER' ? this.calculateRank() : null,
      currentStageIndex: this.currentStageIndex,
      stage: this.stageConfig
    });
  }
}
