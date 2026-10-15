import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Moon, RotateCcw, Play, CheckCircle2, Utensils, FastForward, Lock, Unlock, Trophy } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { StoryCharacter } from './StoryCharacters';
import { GameDifficulty } from './RunnerCanvas';

interface ChestFoundCutsceneProps {
  difficulty?: GameDifficulty;
  onRestartStory: () => void;
  onContinueEndless: (level?: GameDifficulty) => void;
  onReturnMenu: () => void;
  onUnlockNextDifficulty?: (nextLevel: GameDifficulty) => void;
}

export const ChestFoundCutscene: React.FC<ChestFoundCutsceneProps> = ({
  difficulty = 'story',
  onRestartStory,
  onContinueEndless,
  onReturnMenu,
  onUnlockNextDifficulty,
}) => {
  const [phase, setPhase] = useState<'found' | 'emma_whisper' | 'to_be_continued'>('found');

  // Next difficulty unlocked
  const nextDiff: GameDifficulty | null = 
    difficulty === 'story' ? 'medium' :
    difficulty === 'medium' ? 'hard' :
    difficulty === 'hard' ? 'pro' : null;

  const handleNextPhase = () => {
    soundManager.playPowerup();
    if (phase === 'found') {
      soundManager.playEvilAwakening();
      setPhase('emma_whisper');
    } else if (phase === 'emma_whisper') {
      if (nextDiff && onUnlockNextDifficulty) {
        onUnlockNextDifficulty(nextDiff);
      }
      setPhase('to_be_continued');
    }
  };

  // Skip straight to cliffhanger
  const handleSkipCutscene = () => {
    soundManager.playPowerup();
    if (nextDiff && onUnlockNextDifficulty) {
      onUnlockNextDifficulty(nextDiff);
    }
    setPhase('to_be_continued');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950 font-sans select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/70 via-slate-950 to-slate-950" />
      <div className="absolute w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Skip Button */}
      {phase !== 'to_be_continued' && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleSkipCutscene}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 rounded-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-lg"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip Cutscene &gt;&gt;</span>
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'found' && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center bg-slate-900/95 border border-amber-500/50 rounded-3xl p-8 shadow-2xl"
          >
            {/* User Art Stranger Celebrating */}
            <div className="relative w-36 h-36 mb-2 flex items-center justify-center">
              <StoryCharacter type="STRANGER_ART" className="w-full h-full" isWalking />
            </div>

            {/* Stranger Dialogue Tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-pink-300">
                Stranger
              </span>
            </div>

            {/* Exact Quote requested by user */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-300 mb-3 tracking-tight drop-shadow-md">
              “i found a chest!”
            </h2>

            <p className="text-slate-300 text-sm sm:text-base max-w-lg mb-6 leading-relaxed italic">
              After leaping past all the big rocks across the morning sky trail, the ancient treasure chest was tapped 5 times and unlocked!
            </p>

            <button
              onClick={handleNextPhase}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/40 active:scale-95 transition-all cursor-pointer"
            >
              Examine What Emma Does...
            </button>
          </motion.div>
        )}

        {phase === 'emma_whisper' && (
          <motion.div
            key="whisper"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center bg-slate-900/95 border border-purple-500/50 rounded-3xl p-8 shadow-2xl"
          >
            <div className="w-40 h-40 rounded-full border-2 border-purple-500 p-2 bg-purple-950/50 shadow-2xl mb-4 overflow-hidden flex items-center justify-center">
              <StoryCharacter type="EMMA_EVIL_AFTER" className="w-full h-full" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-purple-400 mb-2">
              Emma's Evil Smirk
            </span>

            <p className="text-xl sm:text-2xl font-black text-white italic max-w-lg mb-8 leading-snug">
              “YES! The ancient lost power is finally mine! White Lily Cookie won't know what hit her... I am more powerful now!”
            </p>

            <button
              onClick={handleNextPhase}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all cursor-pointer"
            >
              Continue...
            </button>
          </motion.div>
        )}

        {phase === 'to_be_continued' && (
          <motion.div
            key="continued"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-xl w-full flex flex-col items-center text-center bg-slate-900/95 border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl"
          >
            {/* Dramatic TO BE CONTINUED */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>STORY CLIFFHANGER</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-purple-400 mb-3">
              TO BE CONTINUED...
            </h1>

            {/* Unlock Notification Card if a new difficulty was unlocked */}
            {nextDiff && (
              <div className="w-full bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3.5 mb-5 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                    <Unlock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400 block">
                      NEW LEVEL UNLOCKED!
                    </span>
                    <span className="text-sm font-black text-white">
                      {nextDiff.toUpperCase()} MODE is now available!
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onContinueEndless(nextDiff)}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Play {nextDiff}
                </button>
              </div>
            )}

            {/* Cozy note for user */}
            <div className="w-full bg-slate-950/80 border border-purple-500/25 rounded-2xl p-4 mb-6 flex flex-col items-center gap-2 text-slate-300 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Level Complete! All Progress Saved!</span>
              </div>
              <p className="leading-relaxed text-slate-400 text-center">
                Your completed runs, highest unlocked difficulties, and secret chest discoveries are saved.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={onRestartStory}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>REPLAY FULL STORY</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onContinueEndless(nextDiff || difficulty)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-pink-400" />
                  <span>Next Level Runner</span>
                </button>

                <button
                  onClick={onReturnMenu}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Title Menu</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
