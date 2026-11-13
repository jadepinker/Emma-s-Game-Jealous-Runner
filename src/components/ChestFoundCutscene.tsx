import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RotateCcw, Play, FastForward, Unlock, Trophy } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { CastCharacterSprite } from './StoryCharacters';
import { GameDifficulty } from './RunnerCanvas';

interface ChestFoundCutsceneProps {
  difficulty?: GameDifficulty;
  episodeId?: number;
  enableChestHunt?: boolean;
  completedGoalCm?: number;
  onRestartStory: () => void;
  onContinueEndless: (level?: GameDifficulty) => void;
  onReturnMenu: () => void;
  onUnlockNextDifficulty?: (nextLevel: GameDifficulty) => void;
}

export const ChestFoundCutscene: React.FC<ChestFoundCutsceneProps> = ({
  difficulty = 'story',
  episodeId,
  enableChestHunt = true,
  completedGoalCm,
  onRestartStory,
  onContinueEndless,
  onReturnMenu,
  onUnlockNextDifficulty,
}) => {
  const [phase, setPhase] = useState<'found' | 'emma_whisper' | 'to_be_continued'>('found');

  useEffect(() => {
    if (phase === 'found') {
      if (enableChestHunt) {
        soundManager.speakVoice('I found the chests!', 'ROWAN');
      } else {
        soundManager.speakVoice('We cleared the meadow path! Everyone stay alert!', 'AYLA');
      }
    } else if (phase === 'emma_whisper') {
      soundManager.speakVoice(
        enableChestHunt
          ? 'Yes! The ancient power is mine! Ayla will never stand in my way!'
          : 'Just wait... soon I will have more power than Ayla or anyone!',
        'EMMA',
        { isEvil: true, emotion: 'laughing' }
      );
    } else {
      soundManager.stopVoice();
    }
    return () => {
      soundManager.stopVoice();
    };
  }, [phase, enableChestHunt]);

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

  const handleSkipCutscene = () => {
    soundManager.playPowerup();
    if (nextDiff && onUnlockNextDifficulty) {
      onUnlockNextDifficulty(nextDiff);
    }
    setPhase('to_be_continued');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-2.5 md:p-6 bg-slate-950 font-sans select-none overflow-hidden overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/70 via-slate-950 to-slate-950" />
      <div className="absolute w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {phase !== 'to_be_continued' && (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20">
          <button
            onClick={handleSkipCutscene}
            className="flex items-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 text-[11px] md:text-xs font-bold text-amber-300 hover:text-amber-200 bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 rounded-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-lg"
          >
            <FastForward className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Skip &gt;&gt;</span>
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
            className="relative z-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col items-center text-center bg-slate-900/95 border border-amber-500/50 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl"
          >
            <div className="relative w-24 h-28 md:w-36 md:h-44 mb-2 flex items-center justify-center">
              <CastCharacterSprite
                speaker={enableChestHunt ? 'ROWAN' : 'AYLA'}
                emotion="normal"
                className="w-full h-full"
              />
            </div>

            <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-widest text-pink-300 mb-1 md:mb-2">
              {enableChestHunt ? 'Rowan · Chest Hunt' : 'Ayla · Stage Clear'}
            </span>

            <h2 className="text-lg sm:text-2xl md:text-4xl font-black text-amber-300 mb-2 md:mb-3 tracking-tight drop-shadow-md">
              {enableChestHunt
                ? '“We found the 3 Chests!”'
                : `“Path Cleared (${completedGoalCm || 50} cm)!”`}
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-lg mb-4 md:mb-6 leading-relaxed">
              {enableChestHunt
                ? 'After leaping past the ruins and rocks, all 3 gilded chests burst open with ancient light!'
                : episodeId
                ? `Episode ${episodeId}'s sprint is complete! Next episode's distance goal increases by +50 cm.`
                : 'You raced across the moonlit trail without stumbling!'}
            </p>

            <button
              onClick={handleNextPhase}
              className="px-5 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/40 active:scale-95 transition-all cursor-pointer"
            >
              See Emma’s Reaction...
            </button>
          </motion.div>
        )}

        {phase === 'emma_whisper' && (
          <motion.div
            key="whisper"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col items-center text-center bg-slate-900/95 border border-purple-500/50 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl"
          >
            <div className="w-24 h-28 md:w-44 md:h-48 mb-2 md:mb-3 flex items-center justify-center">
              <CastCharacterSprite
                speaker="EMMA"
                emotion="laughing"
                bowShake={false}
                className="w-full h-full"
              />
            </div>

            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-rose-400 mb-1.5 md:mb-2">
              Emma · In Mind
            </span>

            <p className="text-sm sm:text-lg md:text-2xl font-bold text-slate-800 italic max-w-lg mb-4 md:mb-8 leading-snug border-2 border-dashed border-purple-400 rounded-2xl md:rounded-3xl p-3 md:p-4 bg-white shadow-xl">
              “{enableChestHunt
                ? 'Yes! The ancient power is mine! Ayla won’t know what hit her!'
                : 'Just wait... soon I will have more power than Ayla or anyone!'}”
            </p>

            <button
              onClick={handleNextPhase}
              className="px-5 py-2.5 md:px-8 md:py-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 active:scale-95 transition-all cursor-pointer"
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
            className="relative z-10 max-w-xl w-full max-h-[85vh] overflow-y-auto flex flex-col items-center text-center bg-slate-900/95 border border-white/15 rounded-2xl md:rounded-3xl p-4 md:p-10 shadow-2xl"
          >
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2.5 md:mb-4">
              <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
              <span>STAGE COMPLETE</span>
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-400 to-purple-400 mb-2 md:mb-3">
              TO BE CONTINUED...
            </h1>

            {nextDiff && (
              <div className="w-full bg-emerald-950/60 border border-emerald-500/40 rounded-xl md:rounded-2xl p-2.5 md:p-3.5 mb-3 md:mb-5 flex items-center justify-between gap-2 text-left">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                    <Unlock className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] md:text-xs uppercase tracking-wider font-extrabold text-emerald-400 block">
                      NEW LEVEL UNLOCKED!
                    </span>
                    <span className="text-xs md:text-sm font-black text-white truncate block">
                      {nextDiff.toUpperCase()} MODE available!
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onContinueEndless(nextDiff)}
                  className="px-2.5 py-1.5 md:px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] md:text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shrink-0"
                >
                  Play {nextDiff}
                </button>
              </div>
            )}

            <div className="w-full bg-slate-950/80 border border-purple-500/25 rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-col items-center gap-1.5 md:gap-2 text-slate-300 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 md:gap-2 text-amber-300 font-bold">
                <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
                <span>Progress Saved!</span>
              </div>
              <p className="leading-relaxed text-slate-400 text-center text-[11px] md:text-xs">
                Return to Story Mode for the next episode (+50 cm progression) or keep running!
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                onClick={onRestartStory}
                className="w-full py-2.5 md:py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>CONTINUE STORY MODE</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onContinueEndless(nextDiff || difficulty)}
                  className="py-2 md:py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-[11px] md:text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-3 h-3 md:w-3.5 md:h-3.5 text-pink-400" />
                  <span>Next Runner</span>
                </button>

                <button
                  onClick={onReturnMenu}
                  className="py-2 md:py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 hover:text-white font-bold text-[11px] md:text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
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
