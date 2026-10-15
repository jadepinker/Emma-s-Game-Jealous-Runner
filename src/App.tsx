/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Sparkles, Volume2, VolumeX, BookOpen, ShoppingBag, HelpCircle, Trophy, Settings, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { GameScreen, PlayerStats, UpgradeLevels } from './types/game';
import { StoryCutscene } from './components/StoryCutscene';
import { HorrorGlitchVideo } from './components/HorrorGlitchVideo';
import { PostVideoDialogue } from './components/PostVideoDialogue';
import { RunnerCanvas, GameDifficulty } from './components/RunnerCanvas';
import { ChestFoundCutscene } from './components/ChestFoundCutscene';
import { GameOverModal } from './components/GameOverModal';
import { UpgradeShop } from './components/UpgradeShop';
import { InstructionsModal } from './components/InstructionsModal';
import { SettingsModal } from './components/SettingsModal';
import { StoryCharacter } from './components/StoryCharacters';
import { soundManager } from './audio/soundManager';

const DEFAULT_UPGRADES: UpgradeLevels = {
  magnetDuration: 1,
  shieldStrength: 1,
  boostDuration: 1,
  rageGain: 1,
  selectedSkin: 'unknown',
  unlockedSkins: ['unknown', 'shy', 'evil']
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('MENU');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [highScore, setHighScore] = useState<number>(0);
  const [totalCrystals, setTotalCrystals] = useState<number>(0);
  const [upgrades, setUpgrades] = useState<UpgradeLevels>(DEFAULT_UPGRADES);

  // Difficulty Levels Progression requested by user:
  // "Story to medium to hard to pro button (levels button) in start game after if you FISNSHED story it will unlock medium if you FISNSHED medium it will unlock hard if you FISNSHED hard it will unlock pro"
  const [unlockedLevels, setUnlockedLevels] = useState<GameDifficulty[]>(['story']);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('story');

  // Modals state
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [runnerKey, setRunnerKey] = useState<number>(1);

  // Active Runner State
  const [currentStats, setCurrentStats] = useState<PlayerStats>({
    score: 0,
    distance: 0,
    crystals: 0,
    combo: 1,
    maxCombo: 1,
    rageCharge: 0,
    isRageActive: false,
    rageTimeLeft: 0,
    activePowerups: {
      magnet: 0,
      shield: 0,
      boost: 0,
      multiplier: 0
    }
  });

  const [finalStats, setFinalStats] = useState<PlayerStats | null>(null);

  // Load persistence
  useEffect(() => {
    const savedHighScore = localStorage.getItem('emma_runner_highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10) || 0);

    const savedCrystals = localStorage.getItem('emma_runner_crystals');
    if (savedCrystals) setTotalCrystals(parseInt(savedCrystals, 10) || 0);

    const savedUpgrades = localStorage.getItem('emma_runner_upgrades');
    if (savedUpgrades) {
      try {
        setUpgrades(JSON.parse(savedUpgrades));
      } catch {
        // Fallback
      }
    }

    const savedLevels = localStorage.getItem('emma_runner_unlocked_levels');
    if (savedLevels) {
      try {
        const parsed = JSON.parse(savedLevels);
        if (Array.isArray(parsed) && parsed.includes('story')) {
          setUnlockedLevels(parsed);
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const startStory = () => {
    setCurrentScreen('STORY');
  };

  const startDirectRunner = (level?: GameDifficulty) => {
    if (level && unlockedLevels.includes(level)) {
      setSelectedDifficulty(level);
    }
    setRunnerKey(prev => prev + 1);
    setCurrentScreen('RUNNER');
    soundManager.playPowerup();
  };

  const handleStoryCompleteToVideo = () => {
    setCurrentScreen('VIDEO');
  };

  const handleVideoEnd = () => {
    setCurrentScreen('POST_VIDEO_DIALOGUE');
  };

  const handleStartRunnerFromDialogue = () => {
    setSelectedDifficulty('story');
    setRunnerKey(prev => prev + 1);
    setCurrentScreen('RUNNER');
  };

  const handleChestFound = () => {
    setCurrentScreen('CHEST_FOUND');
  };

  // Unlock next difficulty when chest is found
  const handleUnlockNextDifficulty = (nextDiff: GameDifficulty) => {
    setUnlockedLevels(prev => {
      if (!prev.includes(nextDiff)) {
        const updated = [...prev, nextDiff];
        localStorage.setItem('emma_runner_unlocked_levels', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  const handleGameOver = useCallback((stats: PlayerStats) => {
    setFinalStats(stats);
    setCurrentScreen('GAME_OVER');

    setTotalCrystals(prev => {
      const updated = prev + stats.crystals;
      localStorage.setItem('emma_runner_crystals', String(updated));
      return updated;
    });

    setHighScore(prev => {
      if (stats.score > prev) {
        localStorage.setItem('emma_runner_highscore', String(stats.score));
        return stats.score;
      }
      return prev;
    });
  }, []);

  const handleStatsUpdate = useCallback((stats: PlayerStats) => {
    setCurrentStats(stats);
  }, []);

  const handleUpdateUpgrades = (newUpgrades: UpgradeLevels, remainingCrystals: number) => {
    setUpgrades(newUpgrades);
    setTotalCrystals(remainingCrystals);
    localStorage.setItem('emma_runner_upgrades', JSON.stringify(newUpgrades));
    localStorage.setItem('emma_runner_crystals', String(remainingCrystals));
  };

  const handleResetProgress = () => {
    setUnlockedLevels(['story']);
    setSelectedDifficulty('story');
    localStorage.setItem('emma_runner_unlocked_levels', JSON.stringify(['story']));
    setIsSettingsOpen(false);
    soundManager.playPowerup();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Bar Navigation */}
      {currentScreen !== 'VIDEO' && (
        <header className="relative z-20 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
          {/* Zone 1: Play button & Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={startStory}
              className="px-4 py-1.5 bg-gradient-to-r from-rose-600 via-purple-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-900/50 flex items-center gap-2 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="Play Game from Story"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY</span>
            </button>

            <span className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap">
              Emma's Story: The Jealous Wand
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-400">
            <button
              onClick={startStory}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${currentScreen === 'STORY' ? 'text-purple-400' : ''}`}
            >
              Story Mode
            </button>
            <button
              onClick={() => startDirectRunner(selectedDifficulty)}
              className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${currentScreen === 'RUNNER' ? 'text-purple-400' : ''}`}
            >
              Runner ({selectedDifficulty.toUpperCase()})
            </button>
            <button
              onClick={() => setIsShopOpen(true)}
              className="hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 text-amber-400"
            >
              <span>Vault</span>
              <span className="font-mono font-bold">({totalCrystals})</span>
            </button>
            <button
              onClick={() => setIsInstructionsOpen(true)}
              className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Controls
            </button>
          </nav>

          {/* Zone 3: Settings, Score, Audio */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums font-bold text-white">{highScore.toLocaleString()}</span>
            </div>

            {/* Settings button requested by user */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Game Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-purple-400" />
            </button>

            <button
              onClick={handleToggleMute}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </header>
      )}

      {/* Main View Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Title Screen / Menu View with Black Flashing & Blood Background */}
        {currentScreen === 'MENU' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-black overflow-hidden select-none">
            {/* Flashing blood red aura */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,28,28,0.45)_0%,rgba(0,0,0,0.95)_75%)] animate-[pulse_2s_infinite] pointer-events-none" />

            {/* Dripping blood streams & splatters from the top */}
            <div className="absolute top-0 inset-x-0 h-40 pointer-events-none z-10 opacity-85">
              <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="w-full h-full fill-rose-950/90 drop-shadow-[0_10px_20px_rgba(159,18,57,0.7)]">
                <path d="M 0 0 L 1200 0 L 1200 25 
                  C 1140 25 1130 90 1115 90 C 1100 90 1090 25 1050 25
                  C 1010 25 1000 130 980 130 C 960 130 950 25 900 25
                  C 860 25 850 80 835 80 C 820 80 810 25 760 25
                  C 720 25 705 145 685 145 C 665 145 655 25 600 25
                  C 550 25 540 100 520 100 C 500 100 490 25 440 25
                  C 400 25 385 150 365 150 C 345 150 335 25 280 25
                  C 240 25 230 75 215 75 C 200 75 190 25 140 25
                  C 100 25 90 110 75 110 C 60 110 50 25 0 25 Z" fill="#881337" />
                <path d="M 0 0 L 1200 0 L 1200 15 
                  C 1020 15 1010 65 995 65 C 980 65 970 15 700 15
                  C 540 15 530 85 515 85 C 500 85 490 15 380 15
                  C 230 15 220 55 205 55 C 190 15 180 15 0 15 Z" fill="#e11d48" opacity="0.4" />
                <circle cx="365" cy="158" r="4" fill="#e11d48" className="animate-ping" />
                <circle cx="685" cy="153" r="3.5" fill="#e11d48" className="animate-pulse" />
                <circle cx="980" cy="138" r="4" fill="#e11d48" className="animate-ping delay-300" />
              </svg>
            </div>

            {/* Blood mist vignette around edges */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(76,5,25,0.7)_100%)] pointer-events-none" />

            {/* BIG EMMA HEAD */}
            <div className="relative z-10 mb-1 group cursor-pointer" onClick={startStory}>
              <div className="w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_15px_40px_rgba(225,29,72,0.4)]">
                <StoryCharacter type="EMMA_HEAD_SHADOW" className="w-full h-full" />
              </div>
            </div>

            {/* Title & Narrative Brief */}
            <h1 className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-black text-center tracking-tight text-white mb-1 max-w-xl">
              Emma's Jealousy & <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-purple-400">The Stranger</span>
            </h1>
            <p className="relative z-10 text-slate-300 text-center text-xs sm:text-sm max-w-md mb-4 leading-relaxed">
              Timid Emma saw White Lily Cookie's great wand and fled in bitter jealousy. Now, she's kidnapped the stranger to search for the ancient chest!
            </p>

            {/* DIFFICULTY PROGRESSION SELECTOR requested by user:
                "Story to medium to hard to pro button (levels button) in start game after if you FISNSHED story it will unlock medium if you FISNSHED medium it will unlock hard if you FISNSHED hard it will unlock pro" */}
            <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3 mb-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
                  Select Difficulty Level
                </span>
                <span className="text-[10px] text-slate-400">
                  {unlockedLevels.length} / 4 Unlocked
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(['story', 'medium', 'hard', 'pro'] as GameDifficulty[]).map((level) => {
                  const isUnlocked = unlockedLevels.includes(level);
                  const isSelected = selectedDifficulty === level;

                  return (
                    <button
                      key={level}
                      disabled={!isUnlocked}
                      onClick={() => {
                        soundManager.playLaneSwitch();
                        setSelectedDifficulty(level);
                      }}
                      className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        !isUnlocked
                          ? 'opacity-40 bg-slate-950/50 border-white/5 cursor-not-allowed text-slate-500'
                          : isSelected
                          ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/30 text-amber-300 ring-1 ring-amber-400 cursor-pointer font-black'
                          : 'border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        {!isUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
                        <span className="text-xs uppercase font-extrabold tracking-wide">
                          {level}
                        </span>
                      </div>
                      <span className="text-[9px] opacity-75">
                        {level === 'story' ? '100cm' :
                         level === 'medium' ? '150cm' :
                         level === 'hard' ? '200cm' : '250cm'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-md">
              <button
                onClick={startStory}
                className="w-full py-3 bg-gradient-to-r from-rose-600 via-purple-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-rose-950/70 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>START STORY (EPISODE 1)</span>
              </button>

              <button
                onClick={() => startDirectRunner(selectedDifficulty)}
                className="w-full py-3 bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg"
              >
                <Play className="w-4 h-4 fill-current text-pink-400" />
                <span>PLAY {selectedDifficulty.toUpperCase()} RUNNER</span>
              </button>
            </div>

            {/* Quick Links with Settings button */}
            <div className="relative z-10 flex items-center gap-5 mt-4 text-xs text-slate-400">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                <span>Settings</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setIsInstructionsOpen(true)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
                <span>Controls (Space / ESC)</span>
              </button>
              <span>·</span>
              <button
                onClick={() => setIsShopOpen(true)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Vault ({totalCrystals} 💎)</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. Story Cutscene View (With Episode 1 title card, colorful backgrounds, typewriter spelling text, Skip >> / >>>) */}
        {currentScreen === 'STORY' && (
          <StoryCutscene
            onCompleteToVideo={handleStoryCompleteToVideo}
            onSkipToRunner={() => startDirectRunner(selectedDifficulty)}
          />
        )}

        {/* 2. Full-Screen Video Cutscene with Intro Screen Animation */}
        {currentScreen === 'VIDEO' && (
          <HorrorGlitchVideo onVideoEnd={handleVideoEnd} />
        )}

        {/* 3. Post-Video Dialogue View with User Art Stranger Kidnapped & Spelling Text */}
        {currentScreen === 'POST_VIDEO_DIALOGUE' && (
          <PostVideoDialogue onStartRunner={handleStartRunnerFromDialogue} />
        )}

        {/* 4. Brand New 2D Morning Runner (Sun, Sky & Clouds, 60% Faster, User Art Run & Jump sprites, ESC Pause) */}
        {currentScreen === 'RUNNER' && (
          <div className="relative w-full h-full">
            <RunnerCanvas
              key={runnerKey}
              difficulty={selectedDifficulty}
              upgrades={upgrades}
              onGameOver={handleGameOver}
              onStatsUpdate={handleStatsUpdate}
              onChestFound={handleChestFound}
              onOpenStory={startStory}
              onReturnMenu={() => setCurrentScreen('MENU')}
            />
          </div>
        )}

        {/* 5. Chest Found & TO BE CONTINUED Screen with Level Unlocking Progression */}
        {currentScreen === 'CHEST_FOUND' && (
          <ChestFoundCutscene
            difficulty={selectedDifficulty}
            onRestartStory={startStory}
            onContinueEndless={(nextLevel) => {
              if (nextLevel) setSelectedDifficulty(nextLevel);
              startDirectRunner(nextLevel || selectedDifficulty);
            }}
            onUnlockNextDifficulty={handleUnlockNextDifficulty}
            onReturnMenu={() => setCurrentScreen('MENU')}
          />
        )}

        {/* 6. Game Over Screen */}
        {currentScreen === 'GAME_OVER' && finalStats && (
          <div className="relative w-full h-full">
            <GameOverModal
              stats={finalStats}
              highScore={highScore}
              totalCrystals={totalCrystals}
              onRestart={() => startDirectRunner(selectedDifficulty)}
              onOpenShop={() => setIsShopOpen(true)}
              onOpenStory={startStory}
            />
          </div>
        )}

        {/* Upgrades Modal */}
        {isShopOpen && (
          <UpgradeShop
            totalCrystals={totalCrystals}
            upgrades={upgrades}
            onUpdateUpgrades={handleUpdateUpgrades}
            onClose={() => setIsShopOpen(false)}
          />
        )}

        {/* Instructions Modal */}
        {isInstructionsOpen && (
          <InstructionsModal
            onClose={() => setIsInstructionsOpen(false)}
            onPlay={() => startDirectRunner(selectedDifficulty)}
          />
        )}

        {/* Settings Modal requested by user */}
        {isSettingsOpen && (
          <SettingsModal
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            unlockedLevels={unlockedLevels}
            currentDifficulty={selectedDifficulty}
            onSelectDifficulty={setSelectedDifficulty}
            onResetProgress={handleResetProgress}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
