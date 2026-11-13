import React from 'react';
import { motion } from 'motion/react';
import { X, Play, ArrowUp, Sparkles, Heart } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
  onPlay: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose, onPlay }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-lg w-full bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl font-black text-white tracking-tight">How to Play: 2D Jumping Runner</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Context */}
        <p className="text-sm text-slate-300 leading-relaxed mb-5 bg-purple-950/30 border border-purple-500/20 rounded-xl p-3">
          Emma was consumed by jealousy after seeing White Lily Cookie's wand. Hiding behind an ancient twisted tree, Emma kidnapped the <strong className="text-pink-300">Cute White Stranger Girl</strong>! To satisfy Emma's dark demands, you must leap through the wilderness to find the ancient chest at <strong className="text-amber-300">100 cm</strong>!
        </p>

        {/* Controls Grid */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Controls & Mechanics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="font-mono font-black bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 rounded-lg text-sm">
                SPACE
              </div>
              <span className="text-slate-200 font-bold">Press Space or Tap Screen to Jump!</span>
            </div>

            <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 flex items-center gap-3">
              <div className="font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-sm">
                🪨 ROCKS
              </div>
              <span className="text-slate-200 font-bold">Jump over the Big Rocks in your path!</span>
            </div>
          </div>
        </div>

        {/* 100cm & Chest Goal */}
        <div className="mb-6 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            The 100 cm Chest Quest
          </h3>
          <div className="bg-slate-950/60 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 text-xs">
            <span className="text-2xl">🏆</span>
            <div>
              <span className="font-bold text-amber-300 block">Reach 100 cm Distance</span>
              <span className="text-slate-400">At 100 cm, the ancient treasure chest appears right on the trail!</span>
            </div>
          </div>
          <div className="bg-slate-950/60 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 text-xs">
            <span className="text-2xl">✨</span>
            <div>
              <span className="font-bold text-amber-300 block">Click the Chest 5 Times</span>
              <span className="text-slate-400">Tap the chest 5 times to crack the lock and collect the lost power!</span>
            </div>
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          onClick={() => {
            onClose();
            onPlay();
          }}
          className="w-full py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>START 2D JUMPING RUNNER</span>
        </button>
      </motion.div>
    </div>
  );
};
