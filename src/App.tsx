/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { generateDynamicMathPuzzle, DifficultyLevel, MathPuzzle } from './game/MathAPI';
import { GameManager, GameState } from './game/GameManager';
import { Tower } from './game/Entities';
import { Config } from './game/config';
import { sounds } from './game/SoundManager';
import {
  Heart,
  Zap,
  Shield,
  Play,
  Pause,
  FastForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  HelpCircle,
  X,
  ArrowRight,
  TrendingUp,
  Crosshair,
  Flame,
  Snowflake,
  Activity
} from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameManager | null>(null);

  // Difficulty & Menu state
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('intermediate');
  const [gameStarted, setGameStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [hackManaModal, setHackManaModal] = useState<{
    show: boolean;
    puzzle: MathPuzzle | null;
    timeLeft: number;
    isSubmitting: boolean;
    feedback: { isCorrect: boolean; message: string } | null;
  }>({
    show: false,
    puzzle: null,
    timeLeft: 0,
    isSubmitting: false,
    feedback: null,
  });
  const [buildMenu, setBuildMenu] = useState<{col: number, row: number} | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);

  // Core Game State
  const [gameState, setGameState] = useState({
    mana: Config.START_MANA,
    baseHp: Config.BASE_HP,
    wave: 1,
    state: 'MENU' as GameState,
    speed: 1,
    selectedTower: null as Tower | null,
    bossAlert: null as string | null,
    nextWaveIn: 0,
    isWaveSpawning: false,
    score: 0,
    skillCooldowns: {} as { [key: string]: number },
    bossShield: null as { equation: string } | null,
    rank: null as string | null,
    currentStageIndex: 0,
    stage: Config.STAGES[0]
  });

  const [selectedStage, setSelectedStage] = useState(0);

  // Dragging state for tower construction
  

  // Math Upgrade Puzzle Modal
  const [upgradeModal, setUpgradeModal] = useState<{
    show: boolean;
    tower: Tower | null;
    puzzle: MathPuzzle | null;
    isSubmitting: boolean;
    feedback: { isCorrect: boolean; message: string } | null;
  }>({
    show: false,
    tower: null,
    puzzle: null,
    isSubmitting: false,
    feedback: null
  });

  // Initialize Game Instance
  const startNewGame = (diff: DifficultyLevel) => {
    if (gameRef.current) {
      gameRef.current.stop();
    }
    setSelectedDifficulty(diff);
    setGameStarted(true);

    setTimeout(() => {
      if (!canvasRef.current) return;
      const gm = new GameManager(
        canvasRef.current,
        diff,
        (state) => setGameState({ ...state }),
        async (tower) => {
          sounds.playModalOpen();
          setUpgradeModal({
            show: true,
            tower,
            puzzle: null,
            isSubmitting: false,
            feedback: null
          });
          const puzzle = await generateDynamicMathPuzzle(diff, tower.type, tower.level);
          setUpgradeModal((prev) => ({ ...prev, puzzle }));
        },
        (col, row) => {
          sounds.playModalOpen();
          setBuildMenu({ col, row });
        }
      );
      gm.loadStage(selectedStage);
      gameRef.current = gm;
      gm.start();
    }, 50);
  };

  useEffect(() => {
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
          if (prev.timeLeft <= 4 && prev.timeLeft > 1) {
            sounds.playTimerTick();
          }
          if (prev.timeLeft <= 1) {
            clearInterval(timer);
            sounds.playWrong();
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
  }, [hackManaModal.show, hackManaModal.timeLeft, hackManaModal.isSubmitting]);

  // Pointer drag listeners for tower placement
  const handleBuildTower = (type: string) => {
    if (buildMenu && gameRef.current) {
      sounds.playBuild();
      gameRef.current.buildTowerAt(buildMenu.col, buildMenu.row, type);
      setBuildMenu(null);
    }
  };

  const handleAnswer = (chosenAnswer: number) => {
    if (!upgradeModal.tower || !upgradeModal.puzzle || !gameRef.current || upgradeModal.isSubmitting)
      return;

    const isCorrect = chosenAnswer === upgradeModal.puzzle.answer;
    const tower = upgradeModal.tower;

    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }

    setUpgradeModal((prev) => ({
      ...prev,
      isSubmitting: true,
      feedback: {
        isCorrect,
        message: isCorrect
          ? `ถูกต้อง! ${upgradeModal.puzzle?.explanationTh || 'อัปเกรดสำเร็จ'}`
          : `ยังไม่ถูกต้อง (${upgradeModal.puzzle?.explanationTh || 'คำตอบที่ถูกคือ ' + upgradeModal.puzzle?.answer})`
      }
    }));

    setTimeout(() => {
      if (isCorrect) {
        gameRef.current?.confirmTowerUpgrade(tower);
      } else {
        // Mana penalty on wrong answer
        if (gameRef.current) {
          gameRef.current.mana = Math.max(0, gameRef.current.mana - 30);
          gameRef.current.notifyState();
        }
        gameRef.current?.resume();
      }
      setUpgradeModal({
        show: false,
        tower: null,
        puzzle: null,
        isSubmitting: false,
        feedback: null
      });
    }, 1200);
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playButtonClick();
  };

  const cycleSpeed = () => {
    if (!gameRef.current) return;
    const nextSpeed = gameState.speed === 1 ? 2 : gameState.speed === 2 ? 3 : 1;
    gameRef.current.setSpeed(nextSpeed);
  };

  const togglePause = () => {
    if (!gameRef.current) return;
    sounds.playButtonClick();
    if (gameState.state === 'PLAYING') {
      gameRef.current.pause();
    } else if (gameState.state === 'PAUSED') {
      gameRef.current.resume();
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div
      id="math-fortress-app"
      className="relative w-full h-full max-w-[480px] sm:max-h-[850px] sm:rounded-[2rem] sm:border-4 sm:border-slate-800 sm:shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden font-sans text-slate-100 select-none touch-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-[#07070a] to-[#07070a]"
      style={{ backgroundImage: 'radial-gradient(rgba(34, 211, 238, 0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      
    >
      {/* 1. Main Game Canvas Arena */}
      <div className="absolute inset-0 z-0 flex items-center justify-center p-2 pt-24 pb-24">
        <div className="relative p-1.5 rounded-2xl bg-slate-900/50 backdrop-blur-sm shadow-[0_0_40px_-10px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/20 flex items-center justify-center h-full max-h-[840px] w-full max-w-[600px]">
          <canvas
            ref={canvasRef}
            id="defense-canvas"
            className="max-w-full max-h-full w-auto h-auto rounded-xl block mx-auto touch-none bg-[#07070a] shadow-lg" style={{ aspectRatio: "10/14" }}
            
          />
          {/* Decorative Corners */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg pointer-events-none"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg pointer-events-none"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg pointer-events-none"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg pointer-events-none"></div>
        </div>
      </div>

      {/* 2. Top Bento Navigation Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between gap-3 pointer-events-none items-start">
        {/* Main Stats Bento */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/20 rounded-2xl flex items-center justify-between px-2 sm:px-4 py-2.5 pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)] w-full">
          {/* Wave Info */}
          <div className="flex flex-col flex-1 items-center text-center">
            <span className="text-[9px] uppercase tracking-widest text-cyan-500/80 font-bold flex items-center gap-1 mb-0.5">
              <Activity className="w-3 h-3" /> เวฟ
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-xl sm:text-2xl text-cyan-50 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                {gameState.wave}
              </span>
              <span className="text-[10px] text-cyan-500/50 font-mono font-bold">/ 20</span>
            </div>
            {!gameState.isWaveSpawning && gameState.nextWaveIn > 0 && (
              <button
                onClick={() => gameRef.current?.callWaveEarly()}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-mono font-bold uppercase transition-colors animate-pulse"
              >
                เรียกเวฟล่วงหน้า ⏩
              </button>
            )}
          </div>

          <div className="w-px h-10 bg-cyan-500/20 mx-2"></div>

          {/* Mana Pool */}
          <div className="flex flex-col items-center flex-1 items-center text-center">
            <span className="text-[9px] uppercase tracking-widest text-amber-500/80 font-bold flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3" /> มานา
            </span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
              {gameState.mana}
            </span>
          </div>

          <div className="w-px h-10 bg-cyan-500/20 mx-2"></div>

          {/* Score */}
          <div className="flex flex-col items-center flex-1 items-center text-center">
            <span className="text-[9px] uppercase tracking-widest text-cyan-500/80 font-bold flex items-center gap-1 mb-0.5">
               คะแนน
            </span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
              {gameState.score.toLocaleString()}
            </span>
          </div>

          <div className="w-px h-10 bg-cyan-500/20 mx-2"></div>

          {/* Core HP Stability */}
          <div className="flex flex-col flex-1 items-center text-center">
            <span className="text-[9px] uppercase tracking-widest text-emerald-500/80 font-bold flex items-center gap-1 mb-0.5">
              <Shield className="w-3 h-3" /> ฐาน
            </span>
            <span
              className={`font-mono font-bold text-xl sm:text-2xl drop-shadow-[0_0_8px_currentColor] ${
                gameState.baseHp > 50
                  ? 'text-emerald-400'
                  : gameState.baseHp > 25
                  ? 'text-amber-400'
                  : 'text-rose-500 animate-pulse'
              }`}
            >
              {gameState.baseHp}%
            </span>
          </div>
        </div>

        {/* Quick Action Bento (Speed, Pause, Sound, Info) */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/20 rounded-2xl flex items-center px-2 sm:px-3 py-2 gap-1.5 pointer-events-auto shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {/* Pause / Resume */}
          <button
            id="btn-pause-toggle"
            onClick={togglePause}
            title={gameState.state === 'PAUSED' ? 'Resume Game' : 'Pause Game'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-950 border border-transparent hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all"
          >
            {gameState.state === 'PAUSED' ? (
              <Play className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_5px_currentColor]" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Speed Multiplier (1x, 2x, 3x) */}
          <button
            id="btn-speed-toggle"
            onClick={cycleSpeed}
            title="Toggle Game Speed"
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              gameState.speed === 1
                ? 'bg-slate-900 border-transparent text-slate-400'
                : gameState.speed === 2
                ? 'bg-cyan-950 border-cyan-500/40 text-cyan-300'
                : 'bg-amber-950 border-amber-500/40 text-amber-300'
            }`}
          >
            {gameState.speed}x
          </button>

          {/* Sound Mute */}
          <button
            id="btn-sound-toggle"
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-950 border border-transparent hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {/* Guide / Help */}
          <button
            id="btn-guide-toggle"
            onClick={() => {
              sounds.playModalOpen();
              setShowHelp(true);
            }}
            title="How to Play"
            className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-950 border border-transparent hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Boss Alert Banner & Math Shield */}
      {gameState.bossAlert && (
        <div className="absolute top-20 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
          <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-100 px-8 py-3 rounded-full font-mono text-xs sm:text-sm font-bold shadow-[0_0_30px_rgba(244,63,94,0.5)] backdrop-blur-md animate-bounce flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            {gameState.bossAlert}
          </div>
        </div>
      )}

      {/* Boss Shield Input Overlay */}
      {gameState.bossShield && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-950/95 backdrop-blur-xl border border-fuchsia-500/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(217,70,239,0.3)] flex flex-col items-center w-full">
           <div className="text-[10px] text-fuchsia-400 font-mono font-bold tracking-widest uppercase mb-3 animate-pulse flex items-center gap-2">
             <Shield className="w-3 h-3" /> ตรวจพบเกราะคณิตศาสตร์
           </div>
           <div className="text-2xl font-mono text-white mb-4 drop-shadow-[0_0_5px_currentColor]">
              {gameState.bossShield.equation} = ?
           </div>
           <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const ans = parseInt(fd.get('answer') as string, 10);
                if (!isNaN(ans) && gameRef.current) {
                   gameRef.current.submitBossAnswer(ans);
                   e.currentTarget.reset();
                }
              }}
              className="w-full flex flex-col gap-3"
           >
             <input name="answer" type="number" placeholder="ใส่คำตอบ..." className="w-full bg-slate-900 border border-fuchsia-500/30 rounded-lg px-4 py-3 text-white font-mono text-center focus:outline-none focus:border-fuchsia-500" required autoFocus />
             <button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono px-4 py-3 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(217,70,239,0.4)]">
               ยิง
             </button>
           </form>
        </div>
      )}

      {/* 4. Commander Skills (Bottom Left) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-max z-20 pointer-events-auto flex gap-1.5 sm:gap-3 bg-slate-950/80 p-2 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {/* Hack Mana Button */}
        <button
          onClick={async () => {
            if (hackManaModal.show) return;
            const diff = selectedDifficulty;
            setHackManaModal(prev => ({ ...prev, show: true, puzzle: null, timeLeft: 10, isSubmitting: true, feedback: { isCorrect: true, message: 'กำลังแฮ็กระบบ...' } }));
            const puz = await generateDynamicMathPuzzle(diff, "+", 1);
            setHackManaModal({
              show: true,
              puzzle: puz,
              timeLeft: 10,
              isSubmitting: false,
              feedback: null
            });
          }}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-950/80 backdrop-blur-md border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 cursor-pointer hover:bg-slate-900 group"
          title="Hack Mana (Free Mana if solved quickly!)"
        >
          <div className="text-xl mb-0.5"><Zap className="w-5 h-5 text-amber-400 group-hover:animate-pulse" /></div>
          <span className="text-[8px] font-bold tracking-widest text-amber-300">HACK</span>
        </button>
        <div className="w-px bg-slate-800 mx-1"></div>

        {Object.values(Config.SKILLS).map((skill) => {
          const cd = gameState.skillCooldowns[skill.id] || 0;
          const onCooldown = cd > 0;
          const canAfford = gameState.mana >= skill.cost;
          
          return (
            <button
              key={skill.id}
              onClick={() => gameRef.current?.activateSkill(skill.id)}
              disabled={onCooldown || !canAfford}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-950/80 backdrop-blur-md ${
                !onCooldown && canAfford
                  ? `border-[${skill.color}] text-white shadow-[0_0_15px_${skill.color}40] hover:scale-105 cursor-pointer hover:bg-slate-900`
                  : 'border-slate-800 text-slate-600 cursor-not-allowed opacity-70 grayscale'
              }`}
              style={{ borderColor: !onCooldown && canAfford ? skill.color : undefined }}
              title={`${skill.name} - ${skill.cost} Mana`}
            >
              <div className="text-xl mb-0.5">{skill.icon}</div>
              <div className="text-[9px] font-mono font-bold">{skill.cost} M</div>
              
              {/* Cooldown Overlay */}
              {onCooldown && (
                <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center">
                  <span className="text-cyan-400 font-mono text-xs font-bold">{Math.ceil(cd / 60)}s</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      
      {/* 5. Build Tower Modal */}
      {buildMenu && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/80 backdrop-blur-sm p-4"
          onClick={() => setBuildMenu(null)}
        >
          <div 
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-5 max-w-[320px] w-full shadow-[0_0_40px_rgba(34,211,238,0.15)] text-center relative"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-mono text-cyan-300 mb-4 tracking-widest uppercase">สร้างป้อมปราการ</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(Config.TOWER_DATA).map(([type, data]) => {
                const cost = Config.TOWER_COSTS[type as keyof typeof Config.TOWER_COSTS];
                const canAfford = gameState.mana >= cost;
                const displayType = type === '*' ? '×' : type === '/' ? '÷' : type;

                return (
                  <div
                    key={type}
                    onClick={() => canAfford && handleBuildTower(type)}
                    className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-slate-950/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'bg-slate-950/30 border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className="text-3xl font-bold font-mono leading-none mb-2 drop-shadow-[0_0_5px_currentColor]"
                      style={{ color: data.color }}
                    >
                      {displayType}
                    </span>
                    <div className="text-[10px] text-slate-300 font-bold mb-1" style={{ color: data.color }}>{data.name}</div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-[11px] font-mono text-cyan-100 font-bold leading-none">
                        {cost}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                sounds.playModalClose();
                setBuildMenu(null);
              }}
              className="mt-5 w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 font-mono py-2 rounded-xl transition-colors text-xs tracking-widest uppercase"
            >
              ยกเลิก (CANCEL)
            </button>
          </div>
        </div>
      )}


      {/* 6. Selected Tower Inspector Bento Drawer */}
      {gameState.selectedTower && !upgradeModal.show && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-[320px] w-full bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

          {/* Header */}
          <div className="flex items-start justify-between pb-4 mb-4 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-2xl bg-slate-900 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,0,0,0.5)] relative"
                style={{
                  color:
                    Config.TOWER_DATA[
                      gameState.selectedTower.type as keyof typeof Config.TOWER_DATA
                    ]?.color,
                  boxShadow: `0 0 15px ${Config.TOWER_DATA[
                      gameState.selectedTower.type as keyof typeof Config.TOWER_DATA
                    ]?.color}33`
                }}
              >
                {gameState.selectedTower.type === '*'
                  ? '×'
                  : gameState.selectedTower.type === '/'
                  ? '÷'
                  : gameState.selectedTower.type}
              </div>
              <div>
                <div className="text-[9px] text-cyan-500/70 font-mono font-bold tracking-widest uppercase mb-0.5">Tactical Data</div>
                <div className="font-bold text-sm text-slate-100 leading-none mb-1">
                  {
                    Config.TOWER_DATA[
                      gameState.selectedTower.type as keyof typeof Config.TOWER_DATA
                    ]?.titleTh
                  }
                </div>
                <div className="text-[10px] text-cyan-300 font-mono font-bold bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-500/20 inline-block">
                  Level {gameState.selectedTower.level}
                </div>
              </div>
            </div>
            <button
              onClick={() => gameRef.current?.selectTower(null)}
              className="p-1.5 rounded-lg bg-slate-900/50 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Grid with Visual Bars */}
          <div className="space-y-3 mb-5 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase tracking-wider w-16">Damage</span>
              <div className="flex-1 mx-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (gameState.selectedTower.damage / 100) * 100)}%` }}></div>
              </div>
              <span className="font-bold text-slate-100 text-right w-8">{Math.floor(gameState.selectedTower.damage)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase tracking-wider w-16">Range</span>
              <div className="flex-1 mx-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (gameState.selectedTower.range / 250) * 100)}%` }}></div>
              </div>
              <span className="font-bold text-slate-100 text-right w-8">{gameState.selectedTower.range}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-500/10">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-cyan-500/10">
                <span className="text-cyan-500/70 block text-[9px] uppercase tracking-widest mb-0.5">Kills Confirmed</span>
                <span className="font-bold text-cyan-300 text-lg">{gameState.selectedTower.totalKills}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/10">
                <span className="text-emerald-500/70 block text-[9px] uppercase tracking-widest mb-0.5">Total Dmg</span>
                <span className="font-bold text-emerald-300 text-lg">{Math.floor(gameState.selectedTower.totalDamageDealt)}</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-300 bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/20 mb-4 leading-relaxed">
            {
              Config.TOWER_DATA[
                gameState.selectedTower.type as keyof typeof Config.TOWER_DATA
              ]?.descTh
            }
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              id="btn-upgrade-tower"
              onClick={() => gameRef.current?.upgradeSelectedTower()}
              disabled={gameState.mana < gameState.selectedTower.getUpgradeCost()}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
                gameState.mana >= gameState.selectedTower.getUpgradeCost()
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer'
                  : 'bg-slate-900 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              อัปเกรด ({gameState.selectedTower.getUpgradeCost()} M)
            </button>

            <button
              id="btn-sell-tower"
              onClick={() => {
                sounds.playSell();
                gameRef.current?.sellSelectedTower();
              }}
              className="py-2.5 px-4 rounded-xl font-mono text-xs font-bold bg-slate-900 hover:bg-rose-950/50 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
            >
              ขาย (+{gameState.selectedTower.getSellValue()})
            </button>
          </div>
        </div>
      )}

      {/* 7. Math Upgrade Puzzle Modal */}
      {upgradeModal.show && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/90 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-cyan-500/50 rounded-2xl p-6 sm:p-8 max-w-[480px] w-full flex flex-col items-center text-center shadow-[0_0_40px_rgba(34,211,238,0.15)] relative overflow-hidden">
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
            
            {/* Header Badge */}
            <div className="relative flex items-center gap-2 px-4 py-1.5 bg-cyan-950/50 border border-cyan-400/50 rounded-full text-cyan-300 text-[10px] font-mono tracking-widest uppercase mb-5 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <Sparkles className="w-3.5 h-3.5" />
              {upgradeModal.puzzle?.source === 'ai' ? 'NEURAL LINK: AI PUZZLE' : 'LOCAL SYSTEM CALCULATION'}
            </div>

            <h3 className="relative text-lg font-bold text-slate-100 mb-1 font-mono uppercase tracking-wide">
              System Override: Lv.{upgradeModal.tower?.level} → Lv.{(upgradeModal.tower?.level || 1) + 1}
            </h3>
            <p className="relative text-[11px] text-cyan-500/70 mb-6 font-mono">
              แก้สมการเพื่อปลดล็อกขีดจำกัดพลัง (ใช้มานา: {upgradeModal.tower?.getUpgradeCost()} มานา)
            </p>

            {upgradeModal.puzzle ? (
              <div className="relative w-full">
                {/* Problem Box */}
                <div className="text-2xl sm:text-3xl font-mono font-bold mb-6 py-6 px-6 bg-slate-900 border border-cyan-500/40 text-cyan-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] w-full tracking-wider rounded-xl">
                  <span className="text-cyan-500/50 mr-2">{'>'}</span>{upgradeModal.puzzle.question}
                  <span className="inline-block w-3 h-6 bg-cyan-400 ml-2 animate-pulse align-middle"></span>
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-2 gap-3 w-full mb-5">
                  {upgradeModal.puzzle.options.map((opt, i) => (
                    <button
                      key={i}
                      id={`puzzle-opt-${i}`}
                      disabled={upgradeModal.isSubmitting}
                      onClick={() => handleAnswer(opt)}
                      className="group bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-400 p-4 rounded-xl cursor-pointer transition-all text-xl font-mono font-bold text-slate-100 active:scale-[0.98] relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Feedback Banner */}
                {upgradeModal.feedback && (
                  <div
                    className={`text-xs font-mono font-bold p-3.5 rounded-xl w-full mb-4 uppercase tracking-wide ${
                      upgradeModal.feedback.isCorrect
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    }`}
                  >
                    {upgradeModal.feedback.message}
                  </div>
                )}

                {/* Abort button */}
                <button
                  id="btn-abort-upgrade"
                  onClick={() => {
                    sounds.playModalClose();
                    setUpgradeModal({ show: false, tower: null, puzzle: null, isSubmitting: false, feedback: null });
                    gameRef.current?.resume();
                  }}
                  className="mt-2 text-[10px] text-slate-500 hover:text-rose-400 uppercase tracking-[0.2em] font-mono transition-colors py-2 px-4 rounded-lg hover:bg-rose-950/30"
                >
                  [ ABORT SEQUENCE ]
                </button>
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center py-12 w-full gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 tracking-widest animate-pulse">
                  ESTABLISHING NEURAL LINK...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Main Menu / Start Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/95 backdrop-blur-xl p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05)_0,transparent_100%)] pointer-events-none"></div>
          <div className="relative bg-slate-900/80 border border-cyan-500/30 rounded-3xl p-6 sm:p-10 max-w-[520px] w-full flex flex-col items-center text-center shadow-[0_0_60px_-15px_rgba(34,211,238,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-cyan-400/50 blur-[2px]"></div>
            
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-cyan-500/50 flex items-center justify-center mb-5 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] relative">
              <Shield className="w-8 h-8 relative z-10" />
              <div className="absolute inset-0 bg-cyan-400/20 animate-pulse rounded-xl"></div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-300 tracking-tight mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              MATH FORTRESS
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100/60 mb-8 leading-relaxed max-w-sm">
              ฐานทัพตัวเลขประจัญบาน วางป้อมปราการ แก้สมการคณิตศาสตร์เพื่ออัปเกรดพลังทำลายล้างสกัดฝูง Void!
            </p>

            {/* Stage Selector */}
            <div className="w-full text-left mb-6">
              <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest block mb-3 flex items-center gap-2">
                <Crosshair className="w-3 h-3" /> เลือกสมรภูมิ & ธรรมชาติ (BIOMES)
              </span>
              <div className="grid grid-cols-3 gap-2 pb-2">
                {Config.STAGES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sounds.playSelect();
                      setSelectedStage(idx);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      selectedStage === idx
                        ? s.biome === 'forest'
                          ? 'bg-emerald-950/70 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400'
                          : s.biome === 'desert'
                          ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                          : 'bg-rose-950/70 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-400'
                        : 'bg-slate-950/50 border-white/5 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-base">{s.biome === 'forest' ? '🌲' : s.biome === 'desert' ? '🏜️' : '🌋'}</span>
                        <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                          selectedStage === idx ? 'text-white' : 'text-slate-400'
                        }`}>
                          {s.biome === 'forest' ? 'ป่าเวทมนตร์' : s.biome === 'desert' ? 'ทะเลทราย' : 'ภูเขาไฟลาวา'}
                        </span>
                      </div>
                      <div className={`font-bold text-[11px] leading-tight mb-1 ${
                        selectedStage === idx ? 'text-cyan-200' : 'text-slate-300'
                      }`}>
                        {s.name}
                      </div>
                      <div className="text-[9px] text-slate-500 leading-tight line-clamp-2">{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="w-full text-left mb-8">
              <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest block mb-3">
                เลือกระดับความยาก:
              </span>
              <div className="space-y-3">
                {[
                  {
                    id: 'elementary' as DifficultyLevel,
                    title: 'ประถมต้น (ป.1 - ป.3)',
                    desc: 'บวก ลบ เลขไม่เกิน 50',
                    color: 'text-emerald-400 border-emerald-500/30',
                    bg: 'hover:bg-emerald-950/30'
                  },
                  {
                    id: 'intermediate' as DifficultyLevel,
                    title: 'ประถมปลาย (ป.4 - ป.6)',
                    desc: 'คูณ หาร และลำดับการคำนวณวงเล็บ',
                    color: 'text-cyan-400 border-cyan-500/30',
                    bg: 'hover:bg-cyan-950/30'
                  },
                  {
                    id: 'advanced' as DifficultyLevel,
                    title: 'มัธยม / สมการ (Algebra)',
                    desc: 'แก้สมการหาค่าตัวแปร เช่น 2x + 6 = 18',
                    color: 'text-amber-400 border-amber-500/30',
                    bg: 'hover:bg-amber-950/30'
                  }
                ].map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      sounds.playSelect();
                      setSelectedDifficulty(d.id);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedDifficulty === d.id
                        ? `bg-slate-900 border-${d.color.split(' ')[0].split('-')[1]}-400 shadow-[0_0_15px_rgba(0,0,0,0.5)] ring-1 ring-${d.color.split(' ')[0].split('-')[1]}-400/50`
                        : `bg-slate-950/50 border-white/5 ${d.bg}`
                    }`}
                  >
                    <div>
                      <div className={`font-bold text-xs ${selectedDifficulty === d.id ? d.color.split(' ')[0] : 'text-slate-300'}`}>{d.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{d.desc}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedDifficulty === d.id ? `border-${d.color.split(' ')[0].split('-')[1]}-400` : 'border-slate-700'
                      }`}
                    >
                      {selectedDifficulty === d.id && (
                        <div className={`w-2 h-2 rounded-full bg-${d.color.split(' ')[0].split('-')[1]}-400`}></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              id="btn-start-game"
              onClick={() => startNewGame(selectedDifficulty)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] text-sm cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-slate-950 transition-transform group-hover:scale-110" /> เริ่มเกม (START)
            </button>
          </div>
        </div>
      )}

      {/* 9. Victory Screen */}
      {gameState.state === 'ชัยชนะ' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/95 backdrop-blur-xl p-4">
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 max-w-[420px] w-full flex flex-col items-center text-center shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)] relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
            
            <div className="w-20 h-20 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] relative">
              <Award className="w-10 h-10 relative z-10" />
              <div className="absolute inset-0 bg-emerald-400/20 animate-pulse rounded-xl"></div>
            </div>

            <div className="text-emerald-400 uppercase tracking-[0.3em] text-[10px] font-mono font-bold mb-2">
              ภารกิจสำเร็จ
            </div>
            <h2 className="text-3xl font-mono font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">ชัยชนะสมบูรณ์แบบ!</h2>
            <p className="text-[11px] text-emerald-100/60 mb-6 max-w-[280px]">
              คุณสามารถปกป้องฐานทัพสำเร็จ การคำนวณทางคณิตศาสตร์สมบูรณ์
            </p>

            {/* Rank display */}
            <div className="flex items-center justify-center w-full mb-6">
              <div className="flex flex-col items-center justify-center border border-emerald-500/30 rounded-full w-24 h-24 bg-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                 <span className="text-[10px] text-emerald-500/70 font-mono tracking-widest">ยศ</span>
                 <span className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_8px_currentColor]">{gameState.rank || 'S'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mb-8 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 flex flex-col items-center">
                <span className="text-emerald-500/70 text-[9px] uppercase tracking-widest mb-1">คะแนน</span>
                <span className="text-2xl font-bold text-emerald-300 drop-shadow-[0_0_5px_currentColor]">
                  {gameState.score.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/20 flex flex-col items-center">
                <span className="text-cyan-500/70 text-[9px] uppercase tracking-widest mb-1">โจทย์ที่ตอบถูก</span>
                <span className="text-2xl font-bold text-cyan-300 drop-shadow-[0_0_5px_currentColor]">
                  {gameRef.current?.totalEquationsSolved || 0}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                id="btn-endless-mode"
                onClick={() => gameRef.current?.enableEndlessMode()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold py-3.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] text-xs cursor-pointer"
              >
                เล่นต่อโหมดไร้ขีดจำกัด (ENDLESS)
              </button>
              <button
                id="btn-play-again"
                onClick={() => startNewGame(selectedDifficulty)}
                className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold py-3 px-6 rounded-xl transition-colors text-xs cursor-pointer"
              >
                เล่นใหม่อีกครั้ง (RESTART)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Game Over Screen */}
      {gameState.state === 'GAMEOVER' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/95 backdrop-blur-xl p-4">
          <div className="bg-slate-900/90 border border-rose-500/40 rounded-3xl p-8 max-w-[420px] w-full flex flex-col items-center text-center shadow-[0_0_60px_-15px_rgba(244,63,94,0.3)]">
            <div className="w-20 h-20 rounded-2xl bg-rose-950 border border-rose-500/40 flex items-center justify-center mb-6 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)] relative">
              <AlertTriangle className="w-10 h-10 relative z-10 animate-pulse" />
              <div className="absolute inset-0 bg-rose-500/20 animate-pulse rounded-xl"></div>
            </div>

            <div className="text-rose-500 uppercase tracking-[0.3em] text-[10px] font-mono font-bold mb-2">
              คริติคอลICAL FAILURE
            </div>
            <h2 className="text-3xl font-mono font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">ฐานทัพถูกทำลาย</h2>
            <p className="text-[11px] text-rose-100/60 mb-8">
              คุณต้านทานฝูง Void มาได้ถึงเวฟ <span className="text-rose-400 font-bold font-mono text-sm">{gameState.wave}</span>
            </p>

            <button
              id="btn-reboot-core"
              onClick={() => startNewGame(selectedDifficulty)}
              className="w-full bg-rose-600 hover:bg-rose-500 text-slate-50 font-mono font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 text-xs cursor-pointer group"
            >
              <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-180 duration-500" /> เริ่มระบบฐานทัพใหม่
            </button>
          </div>
        </div>
      )}

      {/* Hack Mana Modal */}
      {hackManaModal.show && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-[340px] w-full shadow-[0_0_40px_rgba(245,158,11,0.2)] text-center relative overflow-hidden">
            {hackManaModal.isSubmitting && (
              <div className="absolute inset-0 bg-slate-950/80 z-10 flex items-center justify-center backdrop-blur-sm">
                <div className={`flex flex-col items-center ${hackManaModal.feedback?.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hackManaModal.feedback?.isCorrect ? <Sparkles className="w-10 h-10 mb-2 animate-bounce" /> : <AlertTriangle className="w-10 h-10 mb-2 animate-pulse" />}
                  <div className="font-mono font-bold text-lg text-center px-4">{hackManaModal.feedback?.message}</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-500/20">
              <h3 className="text-sm font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4"/> Hack Mana</h3>
              <div className={`font-mono text-lg font-bold ${hackManaModal.timeLeft <= 3 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
                00:{(hackManaModal.timeLeft < 10 ? '0' : '') + hackManaModal.timeLeft}
              </div>
            </div>
            
            <div className="py-4">
              <div className="text-3xl font-mono font-bold text-slate-100 mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {hackManaModal.puzzle?.question} = ?
              </div>
              <div className="grid grid-cols-2 gap-3">
                {hackManaModal.puzzle?.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (hackManaModal.isSubmitting) return;
                      const isCorrect = opt === hackManaModal.puzzle?.answer;
                      setHackManaModal(prev => ({
                        ...prev,
                        isSubmitting: true,
                        feedback: {
                          isCorrect,
                          message: isCorrect ? '+75 มานา!' : 'รหัสผิดพลาด!'
                        }
                      }));
                      
                      if (isCorrect && gameRef.current) {
                        gameRef.current.mana += 75;
                        gameRef.current.notifyState();
                        sounds.playManaGain();
                      } else {
                        sounds.playWrong();
                      }
                      
                      setTimeout(() => {
                        setHackManaModal(prev => ({ ...prev, show: false }));
                      }, 1500);
                    }}
                    className="bg-slate-950 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-500/50 py-3 rounded-xl font-mono text-xl font-bold text-slate-300 hover:text-amber-300 transition-all active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. Guide Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#07070a]/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-[500px] w-full max-h-[85vh] overflow-y-auto shadow-[0_0_40px_rgba(34,211,238,0.15)] text-left">
            <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-5">
              <h3 className="font-bold font-mono text-sm text-cyan-300 flex items-center gap-2 uppercase tracking-wide">
                <HelpCircle className="w-5 h-5 text-cyan-400" /> คู่มือผู้บัญชาการ
              </h3>
              <button
                onClick={() => {
                  sounds.playModalClose();
                  setShowHelp(false);
                }}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-cyan-950 border border-transparent hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-[11px] text-slate-300 leading-relaxed font-sans">
              <div>
                <span className="font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-1.5 text-[10px]">🎯 เป้าหมาย:</span>
                <p className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                  คลิกที่ <strong>ช่องว่างบนแผนที่</strong> เพื่อเปิดเมนูสร้าง แล้วเลือกป้อมปราการ เพื่อป้องกันไม่ให้ศัตรูเดินทางไปถึง Nexus Core
                </p>
              </div>

              <div>
                <span className="font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-1.5 text-[10px]">🏰 ระบบป้อมปราการ:</span>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-sky-500/20">
                    <div className="w-8 h-8 rounded-lg bg-sky-950 flex items-center justify-center font-bold text-sky-400 font-mono text-lg">+</div>
                    <span className="flex-1">
                      <strong className="text-sky-300 font-mono uppercase text-[9px] tracking-wider block">Addition Beam</strong>
                      ยิงความถี่สูง รวดเร็วและแม่นยำ เหมาะสกัดกลุ่มศัตรู
                    </span>
                  </li>
                  <li className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-rose-500/20">
                    <div className="w-8 h-8 rounded-lg bg-rose-950 flex items-center justify-center font-bold text-rose-400 font-mono text-lg">-</div>
                    <span className="flex-1">
                      <strong className="text-rose-300 font-mono uppercase text-[9px] tracking-wider block">Subtraction Blast</strong>
                      ยิงจรวดระเบิดวงกว้าง (AoE Splash 65px)
                    </span>
                  </li>
                  <li className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-emerald-500/20">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center font-bold text-emerald-400 font-mono text-lg">×</div>
                    <span className="flex-1">
                      <strong className="text-emerald-300 font-mono uppercase text-[9px] tracking-wider block">Multiplication Pulse</strong>
                      โอกาส 35% ติด Critical แรงขึ้น 2.5 เท่า
                    </span>
                  </li>
                  <li className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-amber-500/20">
                    <div className="w-8 h-8 rounded-lg bg-amber-950 flex items-center justify-center font-bold text-amber-400 font-mono text-lg">÷</div>
                    <span className="flex-1">
                      <strong className="text-amber-300 font-mono uppercase text-[9px] tracking-wider block">Division Stasis</strong>
                      ศัตรูเดินช้าลง 50% เป็นเวลา 3 วินาที พร้อมเจาะเกราะ
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <span className="font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-1.5 text-[10px]">✨ ระบบคอมโบ (Synergy) & แฮ็กมานา:</span>
                <p className="bg-slate-950/50 p-3 rounded-xl border border-white/5 mb-3">
                  <strong className="text-amber-400">⚡ Chain Reaction:</strong> หากศัตรูถูก <strong>หน่วงเวลา (÷)</strong> แล้วโดนโจมตีด้วย <strong>จรวดระเบิด (-)</strong> จะเกิดคอมโบระเบิดทำความเสียหาย 2 เท่า!<br/><br/>
                  <strong className="text-emerald-400">💻 Hack Mana:</strong> ระหว่างรอเวฟ สามารถกดปุ่ม <Zap className="inline w-3 h-3 text-amber-400"/> HACK (ขวาล่าง) เพื่อแก้โจทย์รับมานาพิเศษได้!
                </p>
                <span className="font-bold font-mono text-cyan-400 uppercase tracking-widest block mb-1.5 text-[10px]">⚡ การอัปเกรด (Overrides):</span>
                <p className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                  คลิกที่ป้อมบนกริดเพื่อเปิดหน้าต่างสถานะ กด <strong className="text-cyan-400">อัปเกรด</strong> (แก้โจทย์สมการ) 
                  เพื่อทวีคูณพลัง หรือกด <strong className="text-rose-400">ขาย</strong> เพื่อรับ Mana คืน
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playModalClose();
                setShowHelp(false);
              }}
              className="mt-6 w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-mono font-bold py-3 rounded-xl transition-colors text-xs tracking-widest uppercase"
            >
              รับทราบ
            </button>
            <div className="text-right text-[9px] text-cyan-500/50 mt-4">Created by MIKPURINUT</div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="absolute bottom-2 right-4 text-[8px] text-cyan-500/40 font-mono font-bold uppercase tracking-[0.3em] z-10 pointer-events-none drop-shadow-[0_0_2px_rgba(34,211,238,0.2)]">
        Math Fortress v1.2.5 • SYSTEM ONLINE • Created by MIKPURINUT
      </div>
    </div>
    </div>
  );
}

