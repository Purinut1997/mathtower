import { Config } from './config';
import { sounds } from './SoundManager';

export type EnemyType = 'standard' | 'fast' | 'tank' | 'boss';

export class Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  baseSpeed: number;
  speed: number;
  waypointIndex: number;
  path: { x: number; y: number }[];
  active: boolean;
  type: EnemyType;
  radius: number;
  color: string;
  nameTh: string;
  manaReward: number;
  slowDuration: number = 0;
  slowFactor: number = 1.0;
  angle: number = 0;
  trail: { x: number; y: number; alpha: number }[] = [];
  
  // Math Shield Mechanics
  isShielded: boolean = false;
  shieldEquation: string = '';
  shieldAnswer: number = 0;

  constructor(
    path: { x: number; y: number }[],
    type: EnemyType,
    waveMultiplier: number = 1,
    shield?: { equation: string; answer: number }
  ) {
    this.path = path;
    this.x = path[0].x;
    this.y = path[0].y;
    this.waypointIndex = 1;
    this.active = true;
    this.type = type;
    
    if (shield && type === 'boss') {
      this.isShielded = true;
      this.shieldEquation = shield.equation;
      this.shieldAnswer = shield.answer;
    }

    switch (type) {
      case 'fast':
        this.maxHp = Math.round((35 + waveMultiplier * 14) * 0.75);
        this.baseSpeed = 2.4 + waveMultiplier * 0.08;
        this.radius = 11;
        this.color = '#38bdf8'; // Sky cyan
        this.nameTh = 'Fractal Runner (ตัววิ่งเร็ว)';
        this.manaReward = 16 + Math.floor(waveMultiplier * 1.5);
        break;
      case 'tank':
        this.maxHp = Math.round((140 + waveMultiplier * 45) * 1.6);
        this.baseSpeed = 0.85 + waveMultiplier * 0.03;
        this.radius = 18;
        this.color = '#a855f7'; // Purple
        this.nameTh = 'Prime Golem (รถถังเกราะหนา)';
        this.manaReward = 38 + Math.floor(waveMultiplier * 3);
        break;
      case 'boss':
        this.maxHp = Math.round((600 + waveMultiplier * 220) * 2.2);
        this.baseSpeed = 0.65 + waveMultiplier * 0.02;
        this.radius = 26;
        this.color = '#f43f5e'; // Crimson Rose
        this.nameTh = 'Singularity Overlord (บอสคำนวณทมิฬ)';
        this.manaReward = 180 + Math.floor(waveMultiplier * 15);
        break;
      case 'standard':
      default:
        this.maxHp = Math.round(55 + waveMultiplier * 20);
        this.baseSpeed = 1.35 + waveMultiplier * 0.06;
        this.radius = 14;
        this.color = '#e11d48'; // Red-orange
        this.nameTh = 'Void Crawler (ตัวธรรมดา)';
        this.manaReward = 20 + Math.floor(waveMultiplier * 2);
        break;
    }

    this.hp = this.maxHp;
    this.speed = this.baseSpeed;
  }

  applySlow(factor: number, duration: number) {
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowDuration = Math.max(this.slowDuration, duration);
  }

  update() {
    if (!this.active || this.waypointIndex >= this.path.length) return;

    if (this.slowDuration > 0) {
      this.slowDuration--;
      this.speed = this.baseSpeed * this.slowFactor;
      if (this.slowDuration <= 0) {
        this.slowFactor = 1.0;
        this.speed = this.baseSpeed;
      }
    } else {
      this.speed = this.baseSpeed;
    }

    const target = this.path[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    this.angle = Math.atan2(dy, dx);

    // Record trail for fast enemies and bosses
    if (this.type === 'fast' || this.type === 'boss') {
      this.trail.unshift({ x: this.x, y: this.y, alpha: 0.6 });
      if (this.trail.length > 6) this.trail.pop();
      for (const t of this.trail) {
        t.alpha -= 0.08;
      }
    }

    if (dist < this.speed) {
      this.x = target.x;
      this.y = target.y;
      this.waypointIndex++;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
}

export class Tower {
  col: number;
  row: number;
  x: number;
  y: number;
  type: string;
  level: number;
  range: number;
  damage: number;
  fireRate: number;
  cooldown: number;
  investedMana: number;
  totalKills: number = 0;
  totalDamageDealt: number = 0;
  targetAngle: number = 0;
  currentTarget: Enemy | null = null;

  constructor(col: number, row: number, type: string) {
    this.col = col;
    this.row = row;
    this.x = col * Config.TILE_SIZE + Config.TILE_SIZE / 2;
    this.y = row * Config.TILE_SIZE + Config.TILE_SIZE / 2;
    this.type = type;
    this.level = 1;
    this.cooldown = 0;

    const baseCost = Config.TOWER_COSTS[type as keyof typeof Config.TOWER_COSTS] || 100;
    this.investedMana = baseCost;

    const data = Config.TOWER_DATA[type as keyof typeof Config.TOWER_DATA];
    if (data) {
      this.range = data.range;
      this.damage = data.damage;
      this.fireRate = data.fireRate;
    } else {
      this.range = 130;
      this.damage = 15;
      this.fireRate = 30;
    }
  }

  getUpgradeCost(): number {
    return Math.round(this.investedMana * 0.85);
  }

  getSellValue(): number {
    return Math.floor(this.investedMana * Config.SELL_REFUND_RATE);
  }

  upgrade() {
    const cost = this.getUpgradeCost();
    this.investedMana += cost;
    this.level++;
    this.damage = Math.round(this.damage * 1.5);
    this.range += 12;
    this.fireRate = Math.max(10, Math.round(this.fireRate * 0.92));
  }

  update(enemies: Enemy[], spawnProjectile: (p: Projectile) => void) {
    if (this.cooldown > 0) this.cooldown--;

    // Find nearest or foremost enemy in range
    let bestTarget: Enemy | null = null;
    let maxProgress = -1;

    for (const e of enemies) {
      if (!e.active) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= this.range) {
        // Prioritize enemy furthest along the track
        const progress = e.waypointIndex * 1000 - d;
        if (progress > maxProgress) {
          maxProgress = progress;
          bestTarget = e;
        }
      }
    }

    this.currentTarget = bestTarget;

    if (bestTarget) {
      this.targetAngle = Math.atan2(bestTarget.y - this.y, bestTarget.x - this.x);

      if (this.cooldown <= 0) {
        let isCrit = false;
        let actualDamage = this.damage;

        if (this.type === '*') {
          const critChance = (Config.TOWER_DATA['*'] as any).critChance || 0.35;
          if (Math.random() < critChance) {
            isCrit = true;
            actualDamage = Math.round(this.damage * 2.5);
            sounds.playCrit();
          }
        }

        const proj = new Projectile(
          this.x,
          this.y,
          bestTarget,
          actualDamage,
          this.type,
          this,
          isCrit
        );

        spawnProjectile(proj);
        sounds.playShoot(this.type);
        this.cooldown = this.fireRate;
      }
    }
  }
}

export class Projectile {
  x: number;
  y: number;
  target: Enemy;
  damage: number;
  speed: number = 9;
  active: boolean = true;
  type: string;
  sourceTower: Tower;
  isCrit: boolean;
  trail: { x: number; y: number }[] = [];

  constructor(
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    type: string,
    sourceTower: Tower,
    isCrit: boolean = false
  ) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.type = type;
    this.sourceTower = sourceTower;
    this.isCrit = isCrit;

    if (type === '+') this.speed = 12;
    else if (type === '-') this.speed = 8;
    else if (type === '*') this.speed = 11;
    else if (type === '/') this.speed = 9;
  }

  update(
    enemies: Enemy[],
    addFloatingText: (ft: FloatingText) => void,
    addParticles: (pList: Particle[]) => void,
    onEnemyKilled: (enemy: Enemy) => void
  ) {
    if (!this.active) return;

    if (!this.target.active) {
      // Find another active enemy near target if original is dead
      let newTarget: Enemy | null = null;
      let minDist = 120;
      for (const e of enemies) {
        if (!e.active) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < minDist) {
          minDist = d;
          newTarget = e;
        }
      }
      if (newTarget) {
        this.target = newTarget;
      } else {
        this.active = false;
        return;
      }
    }

    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.pop();

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.speed) {
      this.hit(enemies, addFloatingText, addParticles, onEnemyKilled);
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  hit(
    enemies: Enemy[],
    addFloatingText: (ft: FloatingText) => void,
    addParticles: (pList: Particle[]) => void,
    onEnemyKilled: (enemy: Enemy) => void
  ) {
    this.active = false;

    if (this.type === '-') {
      // Subtraction: AoE Explosion
      sounds.playExplosion();
      const radius = Config.TOWER_DATA['-'].splashRadius || 65;

      // Spawn blast ring particles
      const particles: Particle[] = [];
      for (let i = 0; i < 18; i++) {
        const ang = (Math.PI * 2 * i) / 18;
        const spd = 2 + Math.random() * 3.5;
        particles.push(
          new Particle(
            this.x,
            this.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            '#f43f5e',
            24,
            4 + Math.random() * 3
          )
        );
      }
      // Add shockwave particle
      particles.push(new Particle(this.x, this.y, 0, 0, '#fb7185', 20, radius, true));
      addParticles(particles);

      for (const e of enemies) {
        if (!e.active) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= radius) {
          const falloff = 1 - (d / radius) * 0.4;
          let isChainReaction = false;
          let finalDmg = Math.round(this.damage * falloff);
          if (e.slowDuration > 0 && !e.isShielded) {
            isChainReaction = true;
            finalDmg *= 2; 
            e.slowDuration = 0; 
          }
          const dmg = e.isShielded ? 0 : finalDmg;
          e.hp -= dmg;
          this.sourceTower.totalDamageDealt += dmg;

          if (e.isShielded) {
            addFloatingText(new FloatingText(e.x, e.y - 10, 'SHIELDED', '#a855f7', 12));
          } else {
            if (isChainReaction) {
              addFloatingText(new FloatingText(e.x, e.y - 15, `CHAIN REACTION! -${dmg}`, '#fbbf24', 16, true));
              const crParticles: Particle[] = [];
              for(let j=0; j<10; j++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 4;
                crParticles.push(new Particle(e.x, e.y, Math.cos(ang)*spd, Math.sin(ang)*spd, '#fbbf24', 25, 4, false, '⚡'));
              }
              addParticles(crParticles);
            } else {
              addFloatingText(new FloatingText(e.x, e.y - 10, `-${dmg}`, '#f43f5e', 14));
            }
          }

          if (e.hp <= 0 && e.active) {
            e.active = false;
            this.sourceTower.totalKills++;
            onEnemyKilled(e);
          }
        }
      }
    } else {
      // Single Target (+, *, /)
      sounds.playHit();
      const e = this.target;
      const actualDmg = e.isShielded ? 0 : this.damage;
      e.hp -= actualDmg;
      this.sourceTower.totalDamageDealt += actualDmg;

      // Division: Slow Effect
      if (this.type === '/' && !e.isShielded) {
        sounds.playSlow();
        e.applySlow(0.5, 180); // Slow 50% for 3s
        // Frost particles
        const pList: Particle[] = [];
        for (let i = 0; i < 8; i++) {
          pList.push(
            new Particle(
              e.x + (Math.random() - 0.5) * 20,
              e.y + (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 1.5,
              (Math.random() - 0.5) * 1.5,
              '#38bdf8',
              30,
              3
            )
          );
        }
        addParticles(pList);
      }

      // Hit particles
      const hitColor = this.isCrit ? '#10b981' : this.type === '+' ? '#38bdf8' : '#fbbf24';
      const count = this.isCrit ? 14 : 6;
      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * (this.isCrit ? 4 : 2);
        particles.push(
          new Particle(
            this.x,
            this.y,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            hitColor,
            18,
            this.isCrit ? 4 : 2.5
          )
        );
      }
      addParticles(particles);

      // Text notification
      if (e.isShielded) {
        addFloatingText(new FloatingText(e.x, e.y - 12, 'SHIELDED', '#a855f7', 14, true));
      } else if (this.isCrit) {
        addFloatingText(new FloatingText(e.x, e.y - 12, `CRIT! -${this.damage}`, '#10b981', 16, true));
      } else {
        addFloatingText(
          new FloatingText(
            e.x,
            e.y - 10,
            `-${this.damage}`,
            this.type === '/' ? '#fbbf24' : '#e2e8f0',
            13
          )
        );
      }

      if (e.hp <= 0 && e.active) {
        e.active = false;
        this.sourceTower.totalKills++;
        onEnemyKilled(e);
      }
    }
  }
}

export class FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
  isCrit: boolean;

  constructor(
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff',
    size: number = 14,
    isCrit: boolean = false
  ) {
    this.x = x + (Math.random() - 0.5) * 12;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.isCrit = isCrit;
    this.maxLife = isCrit ? 45 : 32;
    this.life = this.maxLife;
    this.vy = isCrit ? -1.2 : -0.85;
  }

  update() {
    this.life--;
    this.y += this.vy;
  }
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  isShockwave: boolean;
  glyph: string | null;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    life: number = 20,
    size: number = 3,
    isShockwave: boolean = false,
    glyph: string | null = null
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.maxLife = life;
    this.life = life;
    this.size = size;
    this.isShockwave = isShockwave;
    this.glyph = glyph;
  }

  update() {
    this.life--;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
  }
}
