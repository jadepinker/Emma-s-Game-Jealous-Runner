import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, FastForward, Play, Film, Sparkles, Clapperboard, ChevronRight } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { StoryCharacter } from './StoryCharacters';

interface StoryCutsceneProps {
  onCompleteToVideo: () => void;
  onSkipToRunner: () => void;
}

interface SceneData {
  id: number;
  chapter: string;
  speaker: string;
  speakerColor: string;
  title: string;
  dialogue: string;
  characterType: 
    | 'EMMA_SHY_WALK' 
    | 'WHITE_LILY_HAPPY' 
    | 'EMMA_SHOCKED' 
    | 'EMMA_RUN_SHADOW' 
    | 'WHITE_LILY_CONFUSED' 
    | 'STRANGER_WALK_TREE';
  isWalking?: boolean;
  isFleeing?: boolean;
  bgGradient: string;
  glowColor: string;
}

const STORY_SCENES: SceneData[] = [
  {
    id: 1,
    chapter: "ACT I · THE ENTRANCE",
    speaker: "Emma",
    speakerColor: "text-sky-300",
    title: "Emma walks in timidly...",
    dialogue: "“...Um, hello? Is anybody here...? I just wanted to see what the legendary Cookie Kingdom looks like...”",
    characterType: 'EMMA_SHY_WALK',
    isWalking: true,
    bgGradient: "from-violet-950 via-slate-900 to-indigo-950",
    glowColor: "rgba(168, 85, 247, 0.4)"
  },
  {
    id: 2,
    chapter: "ACT II · RADIANT VISITATION",
    speaker: "White Lily Cookie",
    speakerColor: "text-emerald-300",
    title: "White Lily Cookie walks in - with a powerful wand!",
    dialogue: "“Welcome, traveler! With this pure lily wand, light and protection blossom across all who step into our sanctuary.”",
    characterType: 'WHITE_LILY_HAPPY',
    isWalking: true,
    bgGradient: "from-emerald-950 via-teal-900 to-slate-950",
    glowColor: "rgba(52, 211, 153, 0.4)"
  },
  {
    id: 3,
    chapter: "ACT III · SHOCK & JEALOUSY",
    speaker: "Emma (Shocked)",
    speakerColor: "text-rose-400",
    title: "Emma is shocked... so jealous of White Lily's power!",
    dialogue: "“...She has a real magic wand?! She is so radiant and powerful... and everyone adores her! Why does SHE get all that power while I have none?! It fills me with rage!”",
    characterType: 'EMMA_SHOCKED',
    bgGradient: "from-rose-950 via-red-950 to-purple-950",
    glowColor: "rgba(244, 63, 94, 0.45)"
  },
  {
    id: 4,
    chapter: "ACT IV · RUNNING AWAY",
    speaker: "Emma",
    speakerColor: "text-purple-300",
    title: "Emma runs away, consumed by jealousy!",
    dialogue: "“I won't stay here in her shadow! I'm running away into the wild! I swear I will find a way to become more powerful than White Lily Cookie... just wait and see!”",
    characterType: 'EMMA_RUN_SHADOW',
    isFleeing: true,
    bgGradient: "from-purple-950 via-indigo-950 to-slate-950",
    glowColor: "rgba(147, 51, 234, 0.4)"
  },
  {
    id: 5,
    chapter: "ACT V · CONFUSED SANCTUARY",
    speaker: "White Lily Cookie",
    speakerColor: "text-emerald-300",
    title: "White Lily Cookie was confused...",
    dialogue: "“...Why is she running away at me? Did I frighten her...?”",
    characterType: 'WHITE_LILY_CONFUSED',
    bgGradient: "from-cyan-950 via-slate-950 to-teal-950",
    glowColor: "rgba(20, 184, 166, 0.35)"
  },
  {
    id: 6,
    chapter: "ACT VI · THE TREE & THE STRANGER",
    speaker: "Narrator",
    speakerColor: "text-purple-400",
    title: "Emma hides behind the ancient tree and kidnaps the Stranger!",
    dialogue: "“Later in the outside... Emma was hiding behind a twisted ancient tree when she saw the stranger walking past. Emma ambushed and kidnapped them to force them to help her get powerful!”",
    characterType: 'STRANGER_WALK_TREE',
    bgGradient: "from-slate-950 via-purple-950 to-zinc-950",
    glowColor: "rgba(192, 132, 252, 0.45)"
  }
];

export const StoryCutscene: React.FC<StoryCutsceneProps> = ({
  onCompleteToVideo,
  onSkipToRunner
}) => {
  // Episode title card state requested by user:
  // "season 1, 1 ep Jealousy Powerful Wand?"
  const [showEpisodeIntro, setShowEpisodeIntro] = useState(true);

  const [currentIdx, setCurrentIdx] = useState(0);
  const currentScene = STORY_SCENES[currentIdx];

  // Spelling / Typewriter animation state
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const typingTimerRef = useRef<number | null>(null);

  // Trigger typewriter text effect on scene change
  useEffect(() => {
    if (showEpisodeIntro) return;

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    const fullText = currentScene.dialogue;
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
    }, 22);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [currentIdx, showEpisodeIntro, currentScene.dialogue]);

  // Audio effects on scene change
  useEffect(() => {
    if (showEpisodeIntro) return;
    if (currentScene.characterType === 'EMMA_SHY_WALK') {
      soundManager.playLaneSwitch();
    } else if (currentScene.characterType === 'WHITE_LILY_HAPPY') {
      soundManager.playPowerup();
    } else if (currentScene.characterType === 'EMMA_SHOCKED') {
      soundManager.playSlide();
    } else if (currentScene.characterType === 'EMMA_RUN_SHADOW') {
      soundManager.playJump();
    } else if (currentScene.characterType === 'WHITE_LILY_CONFUSED') {
      soundManager.playLaneSwitch();
    } else if (currentScene.characterType === 'STRANGER_WALK_TREE') {
      soundManager.playEvilAwakening();
    }
  }, [currentIdx, showEpisodeIntro, currentScene.characterType]);

  const handleNext = () => {
    // If text is still spelling out, instantly complete it on first click
    if (isTyping) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(currentScene.dialogue);
      setIsTyping(false);
      return;
    }

    soundManager.playLaneSwitch();
    if (currentIdx < STORY_SCENES.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onCompleteToVideo();
    }
  };

  const handleBack = () => {
    soundManager.playLaneSwitch();
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  // Skip >> (skips 5 times / moves forward 5 scenes or to final scene)
  const handleSkip5 = () => {
    soundManager.playPowerup();
    const target = Math.min(STORY_SCENES.length - 1, currentIdx + 5);
    if (target === currentIdx && currentIdx === STORY_SCENES.length - 1) {
      onCompleteToVideo();
    } else {
      setCurrentIdx(target);
    }
  };

  // Skip >>> (skips entire story game directly into runner)
  const handleSkipEntireStory = () => {
    soundManager.playPowerup();
    onSkipToRunner();
  };

  return (
    <div className={`relative w-full h-full flex flex-col justify-between p-4 md:p-8 overflow-hidden font-sans select-none bg-gradient-to-b ${currentScene.bgGradient} transition-colors duration-700`}>
      {/* Background ambient lighting */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${currentScene.glowColor} 0%, transparent 70%)`
        }}
      />

      {/* EPISODE INTRO TITLE CARD OVERLAY */}
      {showEpisodeIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center select-none"
        >
          {/* Subtle animated scanlines & vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
          <div className="absolute top-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Season & Episode Badge */}
          <motion.div
            initial={{ scale: 0.8, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-black tracking-widest uppercase mb-6 shadow-xl"
          >
            <Clapperboard className="w-4 h-4 text-pink-400" />
            <span>SEASON 1 · EPISODE 1</span>
          </motion.div>

          {/* Episode Title requested by user: "season 1, 1 ep Jealousy Powerful Wand?" */}
          <motion.h1
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-amber-300 mb-4 max-w-2xl tracking-tight drop-shadow-2xl"
          >
            Jealousy Powerful Wand?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-slate-400 text-sm sm:text-base max-w-md mb-8 leading-relaxed italic"
          >
            A tale of envy, radiant power, and an unexpected kidnapping in the wilderness...
          </motion.p>

          {/* Action buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm"
          >
            <button
              onClick={() => {
                soundManager.playPowerup();
                setShowEpisodeIntro(false);
              }}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-purple-950/80 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>WATCH EPISODE</span>
            </button>

            <button
              onClick={handleSkipEntireStory}
              className="w-full py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span>Skip to Runner &gt;&gt;&gt;</span>
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Top Header Bar with Back and Skip Buttons */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold ml-2">
            {currentScene.chapter}
          </span>
          <span className="text-white/30 text-xs">|</span>
          <span className="text-xs text-white/60">
            {currentIdx + 1} of {STORY_SCENES.length}
          </span>
        </div>

        {/* Skip Buttons requested by user:
            Skip >> (skips 5 times)
            Skip >>> (skips story game directly to runner) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSkip5}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-all active:scale-95 cursor-pointer"
            title="Skip forward 5 times"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip &gt;&gt;</span>
          </button>

          <button
            onClick={handleSkipEntireStory}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition-all active:scale-95 cursor-pointer"
            title="Skip story game directly into runner"
          >
            <span>Skip &gt;&gt;&gt;</span>
          </button>
        </div>
      </header>

      {/* Main Narrative Stage */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 my-auto max-w-5xl mx-auto w-full">
        {/* Character Illustration Stage */}
        <div className="relative shrink-0 w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900/85 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentScene.id}-${currentScene.characterType}`}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Scene 6: Emma hiding behind tree, ambushing stranger with tree moved down closer */}
              {currentScene.id === 6 ? (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  {/* Ancient Tree positioned down closer as requested: "move the tree down closer" */}
                  <div className="absolute inset-x-0 bottom-[-30px] flex items-center justify-center z-10 scale-125">
                    <StoryCharacter type="TREE_ANCIENT" className="w-full h-full" />
                  </div>

                  {/* Emma lurking right behind the lower tree trunk */}
                  <div className="absolute left-2 bottom-2 w-32 h-44 z-20">
                    <StoryCharacter type="EMMA_RUN_SHADOW" className="w-full h-full" isFleeing />
                    <span className="absolute -top-2 left-2 bg-purple-900 text-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-500 shadow">
                      Emma Hiding
                    </span>
                  </div>

                  {/* User art: Stranger walking outside when Emma is hiding behind the tree (https://ibb.co/B5mqfGNv) */}
                  <div className="absolute right-3 bottom-0 w-44 h-52 z-30">
                    <StoryCharacter type="STRANGER_WALK_TREE" className="w-full h-full" isWalking />
                    <span className="absolute -top-2 right-2 bg-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-pink-300 shadow">
                      Stranger Walking
                    </span>
                  </div>
                </div>
              ) : (
                <StoryCharacter
                  type={currentScene.characterType}
                  className="w-full h-full z-10"
                  isWalking={currentScene.isWalking}
                  isFleeing={currentScene.isFleeing}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dialogue Box with Spelling / Typewriter Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`box-${currentScene.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.3 }}
            onClick={handleNext}
            className="flex-1 flex flex-col justify-center bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl cursor-pointer hover:border-white/25 transition-all"
          >
            {/* Speaker Tag */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-black tracking-wide uppercase ${currentScene.speakerColor}`}>
                {currentScene.speaker}
              </span>
              {isTyping && (
                <span className="text-[10px] uppercase font-bold text-slate-400 animate-pulse">
                  Spelling... (Click to instant fill)
                </span>
              )}
            </div>

            {/* Title / Action */}
            <h2 className="text-xl sm:text-2xl font-black text-white mb-4 leading-snug">
              {currentScene.title}
            </h2>

            {/* Typewriter animated text */}
            <p className="text-slate-100 text-base sm:text-lg leading-relaxed mb-6 font-medium italic border-l-4 border-purple-500 pl-4 py-1 min-h-[60px]">
              {displayedText}
              {isTyping && <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />}
            </p>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleBack}
                disabled={currentIdx === 0}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                Previous
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/40 active:scale-95 transition-all cursor-pointer"
              >
                <span>
                  {isTyping
                    ? "Skip Typing"
                    : currentIdx === STORY_SCENES.length - 1
                    ? "WAKE UP CUTSCENE"
                    : "Continue"}
                </span>
                {currentIdx === STORY_SCENES.length - 1 ? <Play className="w-4 h-4 fill-current" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Progress Dots */}
      <footer className="relative z-10 flex items-center justify-center gap-2 pt-4">
        {STORY_SCENES.map((scene, idx) => (
          <button
            key={scene.id}
            onClick={() => setCurrentIdx(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === currentIdx
                ? 'w-8 bg-purple-400'
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Jump to ${scene.chapter}`}
          />
        ))}
      </footer>
    </div>
  );
};
