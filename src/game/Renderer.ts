import { Config, StageConfig } from './config';
import { Enemy, Tower, Projectile, FloatingText, Particle } from './Entities';

export interface DragPreviewState {
  type: string;
  col: number;
  row: number;
  isValid: boolean;
  clientX: number;
  clientY: number;
}

export class Renderer {
  ctx: CanvasRenderingContext2D;
  pathCells: { c: number; r: number }[];
  stage: StageConfig;
  time: number = 0;

  constructor(ctx: CanvasRenderingContext2D, pathCells: { c: number; r: number }[], stage?: StageConfig) {
    this.ctx = ctx;
    this.pathCells = pathCells;
    this.stage = stage || Config.STAGES[0];
  }

  setStage(stage: StageConfig) {
    this.stage = stage;
    this.pathCells = stage.path;
  }

  draw(
    towers: Tower[],
    enemies: Enemy[],
    projectiles: Projectile[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    selectedTower: Tower | null,
    dragPreview: DragPreviewState | null,
    wave: number,
    mana: number,
    baseHp: number
  ) {
    this.time += 0.03;
    const ctx = this.ctx;

    // 1. Natural Biome Environment Background (Forest, Desert, Volcano)
    this.drawBiomeEnvironment();

    // 2. Natural Biome Path (Stone cobblestone trail, Sandstone riverbed, Basalt lava road)
    this.drawPath();

    // 3. Range preview for selected tower
    if (selectedTower) {
      this.drawTowerRange(selectedTower.x, selectedTower.y, selectedTower.range, '#22d3ee', true);
    }

    // 4. Range preview for dragging tower
    if (dragPreview) {
      const data = Config.TOWER_DATA[dragPreview.type as keyof typeof Config.TOWER_DATA];
      const range = data ? data.range : 130;
      const previewX = dragPreview.col * Config.TILE_SIZE + Config.TILE_SIZE / 2;
      const previewY = dragPreview.row * Config.TILE_SIZE + Config.TILE_SIZE / 2;

      this.drawTowerRange(
        previewX,
        previewY,
        range,
        dragPreview.isValid ? '#10b981' : '#f43f5e',
        dragPreview.isValid
      );

      // Ghost tile outline
      ctx.fillStyle = dragPreview.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.2)';
      ctx.strokeStyle = dragPreview.isValid ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 2;
      ctx.fillRect(
        dragPreview.col * Config.TILE_SIZE,
        dragPreview.row * Config.TILE_SIZE,
        Config.TILE_SIZE,
        Config.TILE_SIZE
      );
      ctx.strokeRect(
        dragPreview.col * Config.TILE_SIZE,
        dragPreview.row * Config.TILE_SIZE,
        Config.TILE_SIZE,
        Config.TILE_SIZE
      );

      // Ghost tower
      ctx.globalAlpha = 0.7;
      this.drawTowerSprite(previewX, previewY, dragPreview.type, 1, 0, false);
      ctx.globalAlpha = 1.0;
    }

    // 5. Towers
    for (const t of towers) {
      this.drawTower(t, selectedTower === t);
    }

    // 6. Natural Base Core
    this.drawBase(baseHp);

    // 7. Enemies
    for (const e of enemies) {
      if (e.active) this.drawEnemy(e);
    }

    // 8. Projectiles
    for (const p of projectiles) {
      if (p.active) this.drawProjectile(p);
    }

    // 9. Particles & Shockwaves
    for (const part of particles) {
      this.drawParticle(part);
    }

    // 10. Floating Damage & Mana Texts
    for (const ft of floatingTexts) {
      this.drawFloatingText(ft);
    }
  }

  /**
   * Render custom natural terrain, grass, dunes, rocks, trees, water, and atmospheric particles
   */
  drawBiomeEnvironment() {
    const ctx = this.ctx;
    const biome = this.stage.biome || 'forest';

    if (biome === 'forest') {
      // 🌿 FOREST BIOME: Lush deep green grass, moss patches, wildflowers, magic trees
      ctx.fillStyle = '#06170d'; // Deep forest soil / moss
      ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

      // Grass & Moss texture tiles
      for (let c = 0; c < Config.COLS; c++) {
        for (let r = 0; r < Config.ROWS; r++) {
          const isPath = this.pathCells.some(p => p.c === c && p.r === r);
          if (!isPath) {
            const x = c * Config.TILE_SIZE;
            const y = r * Config.TILE_SIZE;
            const hash = Math.sin(c * 19.3 + r * 37.7);

            // Subtle grass patch shade variations
            if (hash > 0.3) {
              ctx.fillStyle = '#092414';
              ctx.fillRect(x + 2, y + 2, Config.TILE_SIZE - 4, Config.TILE_SIZE - 4);
            } else if (hash < -0.3) {
              ctx.fillStyle = '#05130b';
              ctx.fillRect(x + 4, y + 4, Config.TILE_SIZE - 8, Config.TILE_SIZE - 8);
            }

            // Natural scenery details (flowers, moss sprouts, clover)
            if (hash > 0.65) {
              // Wildflower / Magical mushroom
              ctx.fillStyle = hash > 0.85 ? '#38bdf8' : '#f43f5e';
              ctx.beginPath();
              ctx.arc(x + 16, y + 18, 2.5, 0, Math.PI * 2);
              ctx.fill();
              // Flower center
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(x + 16, y + 18, 1, 0, Math.PI * 2);
              ctx.fill();
            } else if (hash < -0.65) {
              // Little clover grass blade
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(x + 40, y + 44);
              ctx.quadraticCurveTo(x + 36, y + 36, x + 34, y + 35);
              ctx.moveTo(x + 40, y + 44);
              ctx.quadraticCurveTo(x + 42, y + 34, x + 44, y + 33);
              ctx.stroke();
            }

            // Ambient gentle foliage outline
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.08)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, Config.TILE_SIZE - 2, Config.TILE_SIZE - 2);
          }
        }
      }

      // Floating Magic Spores / Fireflies in the forest
      ctx.save();
      for (let i = 0; i < 18; i++) {
        const sx = ((Math.sin(i * 99 + this.time * 0.4) * 0.5 + 0.5) * Config.CANVAS_WIDTH);
        const sy = ((Math.cos(i * 47 + this.time * 0.3) * 0.5 + 0.5) * Config.CANVAS_HEIGHT);
        const glow = (Math.sin(this.time * 2 + i) * 0.5 + 0.5) * 0.6 + 0.2;
        
        ctx.fillStyle = `rgba(74, 222, 128, ${glow})`;
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

    } else if (biome === 'desert') {
      // 🏜️ DESERT BIOME: Golden sand dunes, sandstone cliffs, cacti & oasis water ripples
      ctx.fillStyle = '#1c1306'; // Deep warm desert bedrock
      ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

      // Sand dunes & warm desert ground
      for (let c = 0; c < Config.COLS; c++) {
        for (let r = 0; r < Config.ROWS; r++) {
          const isPath = this.pathCells.some(p => p.c === c && p.r === r);
          if (!isPath) {
            const x = c * Config.TILE_SIZE;
            const y = r * Config.TILE_SIZE;
            const hash = Math.sin(c * 13.7 + r * 29.1);

            // Dunes tone variation
            ctx.fillStyle = hash > 0 ? '#261908' : '#1f1406';
            ctx.fillRect(x + 1, y + 1, Config.TILE_SIZE - 2, Config.TILE_SIZE - 2);

            // Sand wave ripple lines
            ctx.strokeStyle = 'rgba(234, 179, 8, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 6, y + 15);
            ctx.quadraticCurveTo(x + 30, y + 10, x + 54, y + 18);
            ctx.moveTo(x + 8, y + 38);
            ctx.quadraticCurveTo(x + 28, y + 45, x + 52, y + 36);
            ctx.stroke();

            // Desert rocks or cacti
            if (hash > 0.72) {
              // Desert Pebble / Small Cacti
              ctx.fillStyle = '#065f46'; // Desert cactus green
              ctx.beginPath();
              ctx.ellipse(x + 22, y + 25, 4, 8, 0, 0, Math.PI * 2);
              ctx.fill();
              // Arm
              ctx.fillRect(x + 16, y + 22, 6, 2);
              ctx.fillRect(x + 16, y + 18, 2, 6);
            } else if (hash < -0.7) {
              // Smooth Sandstone rock
              ctx.fillStyle = '#451a03';
              ctx.beginPath();
              ctx.arc(x + 42, y + 40, 5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Heat Shimmer / Golden dust particles drifting
      ctx.save();
      for (let i = 0; i < 15; i++) {
        const dx = ((this.time * 25 + i * 45) % Config.CANVAS_WIDTH);
        const dy = ((Math.sin(i * 13 + this.time * 0.8) * 40 + i * 60) % Config.CANVAS_HEIGHT);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.beginPath();
        ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

    } else {
      // 🌋 VOLCANO BIOME: Dark volcanic basalt, glowing magma veins, fiery embers
      ctx.fillStyle = '#140606'; // Volcanic black stone
      ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

      // Basalt rock tiles and glowing cracks
      for (let c = 0; c < Config.COLS; c++) {
        for (let r = 0; r < Config.ROWS; r++) {
          const isPath = this.pathCells.some(p => p.c === c && p.r === r);
          if (!isPath) {
            const x = c * Config.TILE_SIZE;
            const y = r * Config.TILE_SIZE;
            const hash = Math.sin(c * 23.3 + r * 41.9);

            ctx.fillStyle = hash > 0 ? '#1f0909' : '#120404';
            ctx.fillRect(x + 1, y + 1, Config.TILE_SIZE - 2, Config.TILE_SIZE - 2);

            // Magma crack lines pulsating with heat
            if (hash > 0.4 || hash < -0.5) {
              const magmaPulse = (Math.sin(this.time * 2.5 + c + r) * 0.5 + 0.5);
              ctx.strokeStyle = `rgba(239, 68, 68, ${0.25 + magmaPulse * 0.4})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(x + 10, y + 12);
              ctx.lineTo(x + 28, y + 30);
              ctx.lineTo(x + 48, y + 22);
              ctx.stroke();

              // Inner glowing yellow hot core
              ctx.strokeStyle = `rgba(251, 191, 36, ${0.3 + magmaPulse * 0.4})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }

            // Basalt Obsidian boulders
            if (hash > 0.75) {
              ctx.fillStyle = '#262626';
              ctx.beginPath();
              ctx.arc(x + 35, y + 35, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      // Rising hot volcanic embers / sparks
      ctx.save();
      for (let i = 0; i < 22; i++) {
        const emberX = (Math.sin(i * 71 + this.time * 0.5) * 0.5 + 0.5) * Config.CANVAS_WIDTH;
        const emberY = (Config.CANVAS_HEIGHT - ((this.time * 40 + i * 35) % Config.CANVAS_HEIGHT));
        const alpha = Math.sin(this.time * 4 + i) * 0.5 + 0.5;

        ctx.fillStyle = i % 2 === 0 ? `rgba(239, 68, 68, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(emberX, emberY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /**
   * Render themed natural road (Cobblestone trail, desert riverbed, or volcanic obsidian path)
   */
  drawPath() {
    const ctx = this.ctx;
    const biome = this.stage.biome || 'forest';

    for (let i = 0; i < this.pathCells.length; i++) {
      const cell = this.pathCells[i];
      if (cell.r >= 0 && cell.r < Config.ROWS) {
        const x = cell.c * Config.TILE_SIZE;
        const y = cell.r * Config.TILE_SIZE;
        const cx = x + Config.TILE_SIZE / 2;
        const cy = y + Config.TILE_SIZE / 2;

        if (biome === 'forest') {
          // 🌲 Cobblestone Forest Path
          ctx.fillStyle = '#1c241e'; // Dark stone base
          ctx.fillRect(x, y, Config.TILE_SIZE, Config.TILE_SIZE);

          // Cobblestones texture
          ctx.fillStyle = '#26332a';
          ctx.strokeStyle = '#141d16';
          ctx.lineWidth = 1;

          // 4 individual cobblestone pavers
          const offsets = [
            { ox: 4, oy: 4, w: 24, h: 24 },
            { ox: 32, oy: 4, w: 24, h: 24 },
            { ox: 4, oy: 32, w: 24, h: 24 },
            { ox: 32, oy: 32, w: 24, h: 24 }
          ];
          offsets.forEach(o => {
            ctx.beginPath();
            ctx.roundRect(x + o.ox, y + o.oy, o.w, o.h, 4);
            ctx.fill();
            ctx.stroke();
          });

          // Path grass verge
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, Config.TILE_SIZE - 2, Config.TILE_SIZE - 2);

        } else if (biome === 'desert') {
          // 🏜️ Smooth Sandstone / Oasis Stream Path
          ctx.fillStyle = '#382811';
          ctx.fillRect(x, y, Config.TILE_SIZE, Config.TILE_SIZE);

          // Sandstone tile slabs
          ctx.fillStyle = '#4d3717';
          ctx.strokeStyle = '#291d0c';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x + 3, y + 3, Config.TILE_SIZE - 6, Config.TILE_SIZE - 6, 6);
          ctx.fill();
          ctx.stroke();

          // Golden path trim
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, Config.TILE_SIZE - 2, Config.TILE_SIZE - 2);

        } else {
          // 🌋 Volcanic Magma Path
          ctx.fillStyle = '#2b0b0b';
          ctx.fillRect(x, y, Config.TILE_SIZE, Config.TILE_SIZE);

          // Obsidian slabs with magma glow
          ctx.fillStyle = '#1c0808';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x + 3, y + 3, Config.TILE_SIZE - 6, Config.TILE_SIZE - 6, 4);
          ctx.fill();
          ctx.stroke();

          // Magma rim
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 1, y + 1, Config.TILE_SIZE - 2, Config.TILE_SIZE - 2);
        }

        // Directional flow indicator (Natural energy guide)
        if (i < this.pathCells.length - 1) {
          const next = this.pathCells[i + 1];
          const ncx = next.c * Config.TILE_SIZE + Config.TILE_SIZE / 2;
          const ncy = next.r * Config.TILE_SIZE + Config.TILE_SIZE / 2;
          
          const angle = Math.atan2(ncy - cy, ncx - cx);
          
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          
          // Animated natural energy chevron
          const offset = (this.time * 24) % (Config.TILE_SIZE);
          const chevronColor = biome === 'forest' ? '#4ade80' : biome === 'desert' ? '#facc15' : '#f87171';
          
          ctx.strokeStyle = chevronColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-8 + offset - Config.TILE_SIZE/2, -6);
          ctx.lineTo(2 + offset - Config.TILE_SIZE/2, 0);
          ctx.lineTo(-8 + offset - Config.TILE_SIZE/2, 6);
          ctx.stroke();

          ctx.restore();

          // Trail center line
          ctx.strokeStyle = biome === 'forest' ? 'rgba(74, 222, 128, 0.2)' : biome === 'desert' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(248, 113, 113, 0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ncx, ncy);
          ctx.stroke();
        }
      }
    }
  }

  drawTowerRange(x: number, y: number, range: number, color: string, valid: boolean) {
    const ctx = this.ctx;
    ctx.save();

    // Outer soft glow fill
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, range);
    gradient.addColorStop(0, valid ? 'rgba(34, 211, 238, 0.1)' : 'rgba(244, 63, 94, 0.1)');
    gradient.addColorStop(1, valid ? 'rgba(34, 211, 238, 0.02)' : 'rgba(244, 63, 94, 0.02)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, range, 0, Math.PI * 2);
    ctx.fill();

    // Dashed animated perimeter
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -this.time * 20;
    ctx.beginPath();
    ctx.arc(x, y, range, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawBase(baseHp: number) {
    const ctx = this.ctx;
    const corePos = this.pathCells[this.pathCells.length - 1];
    const cx = corePos.c * Config.TILE_SIZE + Config.TILE_SIZE / 2;
    const cy = corePos.r * Config.TILE_SIZE + Config.TILE_SIZE / 2;

    const hpRatio = Math.max(0, baseHp / Config.BASE_HP);
    const coreColor = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#fbbf24' : '#ef4444';
    const darkCoreColor = hpRatio > 0.5 ? '#064e3b' : hpRatio > 0.25 ? '#713f12' : '#7f1d1d';

    ctx.save();

    // Base structure (Natural sanctuary altar)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0; i<6; i++) {
      const ang = (Math.PI/3)*i + (this.time*0.5);
      const px = cx + Math.cos(ang) * 32;
      const py = cy + Math.sin(ang) * 32;
      if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Outer rotating energy shield rings
    ctx.beginPath();
    ctx.arc(cx, cy, 26 + Math.sin(this.time * 3) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hpRatio>0.5?'16,185,129':hpRatio>0.25?'251,191,36':'239,68,68'}, 0.6)`;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 6, 4, 6]);
    ctx.lineDashOffset = this.time * 20;
    ctx.stroke();

    // Inner core housing
    ctx.fillStyle = darkCoreColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    // Glowing core crystal
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 20 + Math.sin(this.time * 5) * 10;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Core symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('แกนหลัก', cx, cy);

    ctx.restore();
  }

  drawTower(t: Tower, isSelected: boolean) {
    this.drawTowerSprite(t.x, t.y, t.type, t.level, t.targetAngle, isSelected);
  }

  drawTowerSprite(cx: number, cy: number, type: string, level: number, targetAngle: number, isSelected: boolean) {
    const ctx = this.ctx;
    const data = Config.TOWER_DATA[type as keyof typeof Config.TOWER_DATA];
    const themeColor = data ? data.color : '#38bdf8';
    
    // Tower specific styling
    let baseColor = '#1e293b';
    let detailColor = '#334155';
    let gunColor = '#475569';
    let glowColor = themeColor;

    ctx.save();

    // Selected state ring
    if (isSelected) {
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 26, cy - 26, 52, 52);
      ctx.shadowBlur = 0;
    }

    // 1. Tower Base Mount (Octagon)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI / 4) * i;
      const r = 22;
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isSelected ? themeColor : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Inner Tech Ring
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();

    // 3. Weapon System (Rotates towards target)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(targetAngle);

    if (type === '+') {
      // Addition: Dual-barrel Laser
      ctx.fillStyle = gunColor;
      // Gun base
      ctx.fillRect(-10, -10, 16, 20);
      // Barrels
      ctx.fillStyle = '#64748b';
      ctx.fillRect(6, -8, 14, 4);
      ctx.fillRect(6, 4, 14, 4);
      // Energy core inside gun
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(-4, -4, 8, 8);
    } 
    else if (type === '-') {
      // Subtraction: Heavy Rocket Pods
      ctx.fillStyle = gunColor;
      ctx.beginPath();
      ctx.roundRect(-8, -12, 18, 24, 4);
      ctx.fill();
      // Missile tubes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(4, -6, 3, 0, Math.PI * 2);
      ctx.arc(4, 6, 3, 0, Math.PI * 2);
      ctx.arc(8, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      // Warning stripes
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -12); ctx.lineTo(-6, 12);
      ctx.stroke();
    }
    else if (type === '*') {
      // Multiplication: Multi-barrel Gatling
      ctx.fillStyle = gunColor;
      // Main body
      ctx.beginPath();
      ctx.moveTo(-12, -8); ctx.lineTo(4, -6);
      ctx.lineTo(4, 6); ctx.lineTo(-12, 8);
      ctx.fill();
      // Rotating barrels (simulated)
      ctx.fillStyle = '#94a3b8';
      const barrelSpin = (this.time * 10) % 4;
      ctx.fillRect(4, -4 + barrelSpin, 16, 2);
      ctx.fillRect(4, 2 + barrelSpin, 16, 2);
      // Glowing heatsink
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.fillRect(-8, -3, 4, 6);
    }
    else if (type === '/') {
      // Division: Amber Stasis Emitter
      ctx.fillStyle = gunColor;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.fill();
      // Floating rings
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(5, 0, 14, 4, this.time*2, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(5, 0, 14, 4, -this.time*2, 0, Math.PI*2);
      ctx.stroke();
      // Glowing orb
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, 0, 4, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();

    // Level badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cx - 16, cy + 12, 32, 12, 3);
    ctx.fill();
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Lv.${level}`, cx, cy + 18);

    ctx.restore();
  }

  drawEnemy(e: Enemy) {
    const ctx = this.ctx;
    ctx.save();

    // Ghost trails for fast/boss enemies
    for (let i = 0; i < e.trail.length; i++) {
      const tr = e.trail[i];
      if (tr.alpha > 0.05) {
        ctx.fillStyle = e.color;
        ctx.globalAlpha = tr.alpha * 0.5;
        const scale = 1 - (i * 0.1);
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, e.radius * 0.75 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    // Slow frost effect aura
    if (e.slowDuration > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -this.time * 10;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText('❄', e.x + e.radius, e.y - e.radius);
    }

    // Draw enemy sprite logic
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);

    ctx.shadowColor = e.color;
    ctx.shadowBlur = e.type === 'boss' ? 20 : 10;
    
    if (e.type === 'standard') {
      // Void Crawler: Insectoid Drone
      // Legs
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-8, -14); ctx.lineTo(-4, -18);
      ctx.moveTo(0, 0); ctx.lineTo(-8, 14); ctx.lineTo(-4, 18);
      ctx.moveTo(4, 0); ctx.lineTo(10, -12); ctx.lineTo(14, -8);
      ctx.moveTo(4, 0); ctx.lineTo(10, 12); ctx.lineTo(14, 8);
      ctx.stroke();
      
      // Body (Segmented)
      ctx.fillStyle = '#1e1b4b'; // Dark body
      ctx.beginPath();
      ctx.ellipse(-4, 0, 10, 6, 0, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = '#312e81'; // Head
      ctx.beginPath();
      ctx.ellipse(6, 0, 7, 5, 0, 0, Math.PI*2);
      ctx.fill();

      // Glowing Eyes & Core
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(8, -2.5, 2, 0, Math.PI*2);
      ctx.arc(8, 2.5, 2, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-4, 0, 3, 0, Math.PI*2);
      ctx.fill();

    } else if (e.type === 'fast') {
      // Fractal Runner: Sleek Jet Drone
      // Engine exhaust
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-e.radius, -4); ctx.lineTo(-e.radius - 8 - Math.random()*6, 0); ctx.lineTo(-e.radius, 4);
      ctx.fill();

      // Swept Wings
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-12, -14); ctx.lineTo(-4, -14);
      ctx.lineTo(12, 0);
      ctx.lineTo(-4, 14); ctx.lineTo(-12, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center cockpit/core
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.ellipse(2, 0, 6, 3, 0, 0, Math.PI*2);
      ctx.fill();

    } else if (e.type === 'tank') {
      // Prime Golem: Heavy Hexagon Mech
      // Treads / Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-10, -16, 20, 8);
      ctx.fillRect(-10, 8, 20, 8);

      // Main Hexagon Armor
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i + Math.PI/6;
        const px = Math.cos(ang) * e.radius;
        const py = Math.sin(ang) * e.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reactor core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI*2);
      ctx.fill();

    } else if (e.type === 'boss') {
      // Singularity Overlord: Massive Dark Matter Entity
      // Dark matter aura
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI*2);
      ctx.fill();

      // Crimson spinning spikes
      ctx.fillStyle = '#4c0519';
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((Math.PI/4) * i + this.time);
        ctx.beginPath();
        ctx.moveTo(e.radius - 8, -4);
        ctx.lineTo(e.radius + 8, 0);
        ctx.lineTo(e.radius - 8, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Inner swirling singularity
      const grad = ctx.createRadialGradient(0,0,0, 0,0,e.radius*0.7);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, e.color);
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius*0.7, 0, Math.PI*2);
      ctx.fill();

      // Math Shield Hexagon Overlay
      if (e.isShielded) {
        ctx.strokeStyle = '#d946ef'; // Fuchsia
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(217, 70, 239, 0.15)';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 3) * i + this.time * 2;
          const px = Math.cos(ang) * (e.radius + 12);
          const py = Math.sin(ang) * (e.radius + 12);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 15;
      }
    }

    ctx.shadowBlur = 0;
    
    // Un-rotate and un-translate to draw UI elements (HP Bar) right-side up
    ctx.rotate(-e.angle);
    
    // HP Bar
    const barWidth = e.type === 'boss' ? 44 : e.type === 'tank' ? 34 : 26;
    const barHeight = e.type === 'boss' ? 6 : 4;
    const hpRatio = Math.max(0, e.hp / e.maxHp);
    const hpY = e.isShielded ? -e.radius - 24 : -e.radius - 14;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(-barWidth / 2, hpY, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 5;
    ctx.fillRect(-barWidth / 2, hpY, barWidth * hpRatio, barHeight);
    ctx.shadowBlur = 0;

    // HP Bar Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2, hpY, barWidth, barHeight);

    ctx.restore();
  }

  drawProjectile(p: Projectile) {
    const ctx = this.ctx;
    ctx.save();

    // Projectile trail
    if (p.trail.length > 1) {
      ctx.strokeStyle =
        p.type === '+' ? 'rgba(56, 189, 248, 0.5)'
          : p.type === '-' ? 'rgba(244, 63, 94, 0.5)'
          : p.type === '*' ? 'rgba(16, 185, 129, 0.5)'
          : 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) {
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
      }
      ctx.stroke();
    }

    // Orient projectile to target
    const angle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);

    if (p.type === '+') {
      // Cyan Plasma Bolt
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI*2);
      ctx.fill();
    } else if (p.type === '-') {
      // Subtraction Rocket Missile
      ctx.fillStyle = '#cbd5e1';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      // Missile body
      ctx.fillRect(-6, -3, 12, 6);
      // Warhead
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(10, 0); ctx.lineTo(6, 3); ctx.fill();
      // Engine fire
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(-6, 0, 3 + Math.random()*2, 0, Math.PI*2); ctx.fill();

    } else if (p.type === '*') {
      // Multiplication Emerald Star / Plasma Disc
      ctx.fillStyle = p.isCrit ? '#ffffff' : '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = p.isCrit ? 20 : 12;
      
      const r = p.isCrit ? 8 : 6;
      ctx.rotate(this.time * 15);
      ctx.beginPath();
      for(let i=0; i<4; i++) {
        ctx.moveTo(0, -r); ctx.lineTo(r/3, -r/3);
        ctx.lineTo(r, 0); ctx.lineTo(r/3, r/3);
        ctx.lineTo(0, r); ctx.lineTo(-r/3, r/3);
        ctx.lineTo(-r, 0); ctx.lineTo(-r/3, -r/3);
      }
      ctx.fill();

    } else {
      // Division Amber Crystal
      ctx.fillStyle = '#fef3c7';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-8, 0);
      ctx.lineTo(0, -5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawParticle(part: Particle) {
    const ctx = this.ctx;
    const alpha = Math.max(0, part.life / part.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (part.isShockwave) {
      // AoE Expanding Shockwave Ring
      const progress = 1 - alpha;
      const currentRadius = part.size * progress;
      ctx.strokeStyle = part.color;
      ctx.lineWidth = 4 * alpha;
      ctx.beginPath();
      ctx.arc(part.x, part.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner subtle fill
      ctx.fillStyle = part.color;
      ctx.globalAlpha = alpha * 0.15;
      ctx.fill();
    } else {
      ctx.fillStyle = part.color;
      ctx.shadowColor = part.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      
      // Bright core for particles
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size * alpha * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawFloatingText(ft: FloatingText) {
    const ctx = this.ctx;
    const alpha = Math.max(0, ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.isCrit ? ft.color : '#000000';
    ctx.shadowBlur = ft.isCrit ? 15 : 4;
    ctx.font = `${ft.isCrit ? '900 italic' : 'bold'} ${ft.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Stroke for better readability
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}
