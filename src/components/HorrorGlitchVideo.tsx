import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Sparkles, Radio } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HorrorGlitchVideoProps {
  onVideoEnd: () => void;
}

export const HorrorGlitchVideo: React.FC<HorrorGlitchVideoProps> = ({ onVideoEnd }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);

  // Intro countdown animation before video starts
  useEffect(() => {
    soundManager.playEvilAwakening();

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowIntro(false);
          // Start video
          setTimeout(() => {
            const video = videoRef.current;
            if (video) {
              video.play()
                .then(() => setIsPlaying(true))
                .catch(() => {
                  video.muted = true;
                  video.play()
                    .then(() => setIsPlaying(true))
                    .catch(() => {});
                });
            }
          }, 100);
          return 0;
        }
        soundManager.playLaneSwitch();
        return prev - 1;
      });
    }, 900);

    return () => clearInterval(timer);
  }, []);

  const handleContainerClick = () => {
    if (showIntro) {
      setShowIntro(false);
      const video = videoRef.current;
      if (video) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else if (video.muted) {
        video.muted = false;
      }
    }
  };

  return (
    <div 
      onClick={handleContainerClick}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none cursor-pointer"
    >
      {/* Intro Screen Animation requested by user: "in the video starts on the story game, add a intro screen animation" */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center"
          >
            {/* VHS glitch scanlines */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-black to-red-950/40 pointer-events-none animate-pulse" />

            {/* Glowing Glitch Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950 border border-red-500/60 text-rose-300 text-xs font-mono font-bold tracking-widest uppercase mb-6 animate-pulse">
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              <span>TRANSMISSION: THE BASEMENT</span>
            </div>

            {/* Big Countdown Number */}
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-7xl sm:text-9xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-400 to-purple-400 mb-6 drop-shadow-[0_0_35px_rgba(225,29,72,0.8)]"
            >
              {countdown}
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase mb-2 animate-[pulse_1s_infinite]">
              THE UNKNOWN PERSON AWAKENS...
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-mono">
              Click anywhere to start video immediately
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Video (No text on screen during video) */}
      <video
        ref={videoRef}
        autoPlay={!showIntro}
        playsInline
        onEnded={onVideoEnd}
        className="w-full h-full object-cover"
      >
        <source src="/story_video.mp4" type="video/mp4" />
        <source src="https://cdn.videotourl.net/videos/56115728-b872-41c7-80a8-e51d05036dfc.mp4" type="video/mp4" />
      </video>

      {/* Subtle Skip button in corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVideoEnd();
        }}
        className="absolute top-4 right-4 z-50 text-[11px] text-white/50 hover:text-white px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-white/10 cursor-pointer pointer-events-auto transition-colors"
      >
        Skip Video →
      </button>
    </div>
  );
};
