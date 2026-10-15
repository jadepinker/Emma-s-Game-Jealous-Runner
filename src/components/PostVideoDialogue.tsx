import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Play, Skull, ShieldAlert, FastForward, ArrowLeft } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { StoryCharacter } from './StoryCharacters';

interface PostVideoDialogueProps {
  onStartRunner: () => void;
}

interface DialogueLine {
  id: number;
  speaker: 'Emma' | 'Stranger' | "Emma's Mind";
  text: string;
  expression: 'creepy' | 'panicked' | 'threatening' | 'curious' | 'evil' | 'reluctant' | 'mind';
  speakerColor: string;
}

const EXACT_CONVERSATION: DialogueLine[] = [
  {
    id: 1,
    speaker: "Stranger",
    text: "“WHAT?! Where am I?!”",
    expression: 'panicked',
    speakerColor: "text-sky-300"
  },
  {
    id: 2,
    speaker: "Stranger",
    text: "“WHO ARE YOU?!”",
    expression: 'panicked',
    speakerColor: "text-sky-300"
  },
  {
    id: 3,
    speaker: "Emma",
    text: "“...I am Emma...”",
    expression: 'creepy',
    speakerColor: "text-purple-400"
  },
  {
    id: 4,
    speaker: "Emma",
    text: "“...Can I tell you something...?”",
    expression: 'creepy',
    speakerColor: "text-purple-400"
  },
  {
    id: 5,
    speaker: "Stranger",
    text: "“...Uh... sure..?”",
    expression: 'curious',
    speakerColor: "text-sky-300"
  },
  {
    id: 6,
    speaker: "Emma",
    text: "“I don't know the place... but could you help? If not, I will murder you... don't tell anyone.”",
    expression: 'threatening',
    speakerColor: "text-rose-400"
  },
  {
    id: 7,
    speaker: "Stranger",
    text: "“WHY do you need help?!”",
    expression: 'panicked',
    speakerColor: "text-sky-300"
  },
  {
    id: 8,
    speaker: "Emma",
    text: "“To get better powerful for me than the you don't people.”",
    expression: 'evil',
    speakerColor: "text-purple-400"
  },
  {
    id: 9,
    speaker: "Emma's Mind",
    text: "“(heheheee HAHHAHAHAHAHAHAH I SHOULD GET POWERFULLLLLL!!!!)”",
    expression: 'mind',
    speakerColor: "text-fuchsia-400"
  },
  {
    id: 10,
    speaker: "Stranger",
    text: "“...Uh... sure?”",
    expression: 'reluctant',
    speakerColor: "text-sky-300"
  },
  {
    id: 11,
    speaker: "Emma",
    text: "“You need to find a chest, but I wanna see what's inside.”",
    expression: 'evil',
    speakerColor: "text-purple-400"
  },
  {
    id: 12,
    speaker: "Stranger",
    text: "“...Sure.”",
    expression: 'reluctant',
    speakerColor: "text-sky-300"
  }
];

export const PostVideoDialogue: React.FC<PostVideoDialogueProps> = ({ onStartRunner }) => {
  const [lineIdx, setLineIdx] = useState(0);
  const currentLine = EXACT_CONVERSATION[lineIdx];

  // Spelling / Typewriter animation state
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    const fullText = currentLine.text;
    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;

    typingTimerRef.current = window.setInterval(() => {
      charIndex++;
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex));
      } else {
        setIsTyping(false);
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      }
    }, 20);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [lineIdx, currentLine.text]);

  const handleNext = () => {
    // If still typing, complete instantly
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      return;
    }

    soundManager.playLaneSwitch();
    if (lineIdx < EXACT_CONVERSATION.length - 1) {
      setLineIdx(prev => prev + 1);
    } else {
      soundManager.playEvilAwakening();
      onStartRunner();
    }
  };

  const handleBack = () => {
    soundManager.playLaneSwitch();
    if (lineIdx > 0) {
      setLineIdx(prev => prev - 1);
    }
  };

  // Skip >> (skips 5 lines)
  const handleSkip5 = () => {
    soundManager.playPowerup();
    const target = Math.min(EXACT_CONVERSATION.length - 1, lineIdx + 5);
    setLineIdx(target);
  };

  // Skip >>> (skips directly to runner)
  const handleSkipToRunner = () => {
    soundManager.playPowerup();
    onStartRunner();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden font-sans select-none">
      {/* Background 7: Rich Dark Spooky Basement Dungeon */}
      <div className="absolute inset-0 z-0 bg-stone-950">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/80 via-stone-950 to-slate-950" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />

        {/* Ambient flickering lanterns */}
        <div className="absolute top-12 left-10 w-8 h-8 rounded-full bg-amber-500/30 blur-lg animate-pulse" />
        <div className="absolute top-12 right-10 w-8 h-8 rounded-full bg-amber-500/30 blur-lg animate-pulse delay-300" />
      </div>

      {/* Top Banner with Skip buttons */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-xs font-black text-rose-400 uppercase tracking-widest">
          <Skull className="w-4 h-4 text-purple-400" />
          <span>ACT VII · THE BASEMENT DEMAND</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSkip5}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-all active:scale-95 cursor-pointer"
            title="Skip forward 5 lines"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip &gt;&gt;</span>
          </button>

          <button
            onClick={handleSkipToRunner}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition-all active:scale-95 cursor-pointer"
            title="Skip directly to 2D runner"
          >
            <span>Skip &gt;&gt;&gt;</span>
          </button>
        </div>
      </header>

      {/* Dual Character Stage: Emma vs Kidnapped Stranger */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 my-auto w-full max-w-4xl">
        {/* Emma (Image 7) */}
        <div className={`relative flex flex-col items-center transition-all duration-300 ${
          currentLine.speaker.includes('Emma') ? 'scale-105 opacity-100' : 'scale-95 opacity-60'
        }`}>
          <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-3xl bg-slate-900/90 border-2 border-purple-500/70 shadow-2xl p-2 flex items-center justify-center overflow-hidden">
            <StoryCharacter type="EMMA_EVIL_AFTER" className="w-full h-full" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
              Emma
            </span>
            {currentLine.speaker === "Emma's Mind" && (
              <span className="text-[10px] bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500 px-1.5 py-0.2 rounded-full font-bold">
                THINKING
              </span>
            )}
          </div>
        </div>

        {/* User Art: Stranger image after Emma kidnapped stranger (https://ibb.co/211gWz4F) */}
        <div className={`relative flex flex-col items-center transition-all duration-300 ${
          currentLine.speaker === 'Stranger' ? 'scale-105 opacity-100' : 'scale-95 opacity-60'
        }`}>
          <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-3xl bg-slate-900/90 border-2 border-pink-400/70 shadow-2xl p-2 flex items-center justify-center overflow-hidden">
            <StoryCharacter type="STRANGER_KIDNAPPED" className="w-full h-full" />
          </div>
          <span className="text-xs font-black text-pink-300 uppercase tracking-wider mt-2">
            Stranger (You)
          </span>
        </div>
      </main>

      {/* Active Dialogue Bubble with Spelling Animation */}
      <footer 
        onClick={handleNext}
        className="relative z-10 w-full max-w-3xl bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-4 cursor-pointer hover:border-white/25 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentLine.speaker.includes('Emma') ? (
              <ShieldAlert className="w-4 h-4 text-purple-400" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
            )}
            <span className={`text-sm font-black uppercase tracking-wider ${currentLine.speakerColor}`}>
              {currentLine.speaker}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isTyping && (
              <span className="text-[10px] text-slate-400 font-bold animate-pulse">
                Spelling...
              </span>
            )}
            <span className="text-xs text-white/40 font-mono">
              {lineIdx + 1} / {EXACT_CONVERSATION.length}
            </span>
          </div>
        </div>

        <p className={`text-lg sm:text-xl font-bold leading-relaxed pl-3 border-l-4 min-h-[50px] ${
          currentLine.speaker === "Emma's Mind"
            ? 'text-fuchsia-300 italic border-fuchsia-500 bg-fuchsia-950/20 py-2 rounded-r-lg'
            : currentLine.speaker === 'Emma'
            ? 'text-white border-purple-500'
            : 'text-sky-100 border-pink-400'
        }`}>
          {displayedText}
          {isTyping && <span className="inline-block w-2 h-4 bg-pink-400 ml-1 animate-pulse" />}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleBack}
            disabled={lineIdx === 0}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/40 active:scale-95 transition-all cursor-pointer"
          >
            <span>
              {isTyping
                ? "Skip Typing"
                : lineIdx === EXACT_CONVERSATION.length - 1
                ? "ENTER 2D JUMPING RUNNER"
                : "Next"}
            </span>
            {lineIdx === EXACT_CONVERSATION.length - 1 ? <Play className="w-4 h-4 fill-current" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
};
