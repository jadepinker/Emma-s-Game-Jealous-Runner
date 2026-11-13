import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Play,
  Check,
  Lock,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { SEASON_1_EPISODES, StoryEpisodeData } from '../utils/storyData';
import { soundManager } from '../audio/soundManager';
import { authService } from '../utils/authService';
import {
  UserSettings,
  GameDifficulty,
  RunnerStageConfig,
  CharacterSpeaker,
} from '../types/game';
import { CastCharacterSprite, CHARACTER_CAST_META } from './StoryCharacters';

interface StoryModeViewProps {
  settings?: UserSettings;
  unlockedLevels: GameDifficulty[];
  onUpdateSettings?: (updater: (prev: UserSettings) => UserSettings) => void;
  onUnlockDifficulty: (diff: GameDifficulty) => void;
  onStartRunner: (config: RunnerStageConfig) => void;
  onExitToMenu: () => void;
}

export const StoryModeView: React.FC<StoryModeViewProps> = ({
  settings,
  onUpdateSettings,
  onUnlockDifficulty,
  onStartRunner,
  onExitToMenu,
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<StoryEpisodeData | null>(null);
  const [lineIdx, setLineIdx] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [comingSoonModal, setComingSoonModal] = useState<number | null>(null);
  const [seasonCompleteModal, setSeasonCompleteModal] = useState<boolean>(false);

  // Keep local voice state synced with settings & soundManager
  const [voiceOn, setVoiceOn] = useState<boolean>(
    settings?.voiceEnabled ?? soundManager.getVoiceEnabled()
  );

  useEffect(() => {
    if (settings?.voiceEnabled !== undefined) {
      setVoiceOn(settings.voiceEnabled);
    }
  }, [settings?.voiceEnabled]);

  const typewriterTimerRef = useRef<number | null>(null);

  const completedEpisodes = authService.getCurrentUser()?.stats.completedEpisodes || [1];

  const handleToggleVoice = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !voiceOn;
    setVoiceOn(next);
    soundManager.setVoiceEnabled(next);
    if (onUpdateSettings) {
      onUpdateSettings((prev) => ({ ...prev, voiceEnabled: next }));
    }
    if (!next) {
      soundManager.stopVoice();
    } else if (activeEpisode) {
      const line = activeEpisode.lines[lineIdx];
      if (line) {
        soundManager.speakVoice(line.text, line.speaker, {
          isEvil: Boolean(line.bowShake),
          emotion: line.emotion,
        });
      }
    }
  };

  // Typewriter effect with character pitch blips and immediate stop-on-finish
  useEffect(() => {
    if (!activeEpisode) return;
    const currentLine = activeEpisode.lines[lineIdx];
    if (!currentLine) return;

    if (settings?.instantText) {
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let charIdx = 0;
    const fullText = currentLine.text;

    const speakerPitch =
      currentLine.speaker === 'EMMA'
        ? currentLine.bowShake
          ? 380
          : 680
        : currentLine.speaker === 'AYLA'
        ? 560
        : currentLine.speaker === 'CHLOE'
        ? 640
        : currentLine.speaker === 'ROWAN'
        ? 520
        : currentLine.speaker === 'LEO'
        ? 460
        : 440;

    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);

    typewriterTimerRef.current = window.setInterval(() => {
      charIdx++;
      if (charIdx >= fullText.length) {
        setDisplayedText(fullText);
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
        // CRITICAL: Immediately stop typing (and bubble shake) when complete!
        setIsTyping(false);
      } else {
        setDisplayedText(fullText.slice(0, charIdx));
        if (charIdx % 3 === 0 && !settings?.isMuted) {
          soundManager.playDialogueBlip(speakerPitch);
        }
      }
    }, 24);

    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, [activeEpisode, lineIdx, settings?.instantText, settings?.isMuted]);

  // Voice acting on line change
  useEffect(() => {
    if (!activeEpisode) {
      soundManager.stopVoice();
      return;
    }
    const currentLine = activeEpisode.lines[lineIdx];
    if (currentLine && voiceOn && !settings?.isMuted) {
      const isEvilShift =
        Boolean(currentLine.bowShake) ||
        ['angry', 'laughing', 'evil', 'jealous'].includes(currentLine.emotion);
      soundManager.speakVoice(currentLine.text, currentLine.speaker, {
        isEvil: isEvilShift,
        emotion: currentLine.emotion,
      });
    } else {
      soundManager.stopVoice();
    }

    return () => {
      soundManager.stopVoice();
    };
  }, [activeEpisode, lineIdx, voiceOn, settings?.isMuted]);

  const handleNextLine = () => {
    if (!activeEpisode) return;
    const currentLine = activeEpisode.lines[lineIdx];

    // Clicking while typing immediately completes text and stops bubble shaking
    if (isTyping) {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
      return;
    }

    if (lineIdx < activeEpisode.lines.length - 1) {
      setLineIdx((prev) => prev + 1);
      soundManager.playLaneSwitch();
    } else {
      finishEpisode();
    }
  };

  const handleSkip5 = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeEpisode) return;
    soundManager.playPowerup();
    setLineIdx((prev) => Math.min(activeEpisode.lines.length - 1, prev + 5));
  };

  const handleSkipAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeEpisode) return;
    soundManager.playPowerup();
    finishEpisode();
  };

  const finishEpisode = () => {
    if (!activeEpisode) return;
    soundManager.stopVoice();

    authService.addCoins(activeEpisode.rewardCoins);
    authService.unlockMemoryCard(activeEpisode.id);
    authService.progressQuest('quest_complete_episode', 1);

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const existingCompleted = currentUser.stats.completedEpisodes || [];
      if (!existingCompleted.includes(activeEpisode.id)) {
        authService.updateProfile({
          stats: {
            ...currentUser.stats,
            completedEpisodes: [...existingCompleted, activeEpisode.id],
          },
        });
      }
    }

    const runnerConfig: RunnerStageConfig = {
      difficulty: activeEpisode.id >= 6 ? 'medium' : 'story',
      episodeId: activeEpisode.id,
      targetDistanceCm: activeEpisode.runnerGoalCm, // Ep 1 = 50cm, Ep 2 = 100cm, Ep 3 = 150cm, etc.
      enableChestHunt: activeEpisode.enableChestHunt, // Ep 5+ activates 3-Chest Hunt!
      mapTheme: activeEpisode.mapTheme,
    };

    if (activeEpisode.id === 10) {
      onUnlockDifficulty('medium');
      if (currentUser) {
        authService.updateProfile({
          stats: {
            ...currentUser.stats,
            season1Completed: true,
            highestDifficultyUnlocked: 'medium',
          },
          earnedBadges: [...(currentUser.earnedBadges || []), 'Season 1 Victor'],
        });
      }
      setSeasonCompleteModal(true);
      soundManager.playVictoryFanfare();
    } else {
      setActiveEpisode(null);
      setLineIdx(0);
      onStartRunner(runnerConfig);
    }
  };

  // Current line derived helpers
  const currentLine = activeEpisode ? activeEpisode.lines[lineIdx] : null;

  const isThoughtLine = Boolean(
    currentLine &&
      (currentLine.isThought || currentLine.text.trim().toLowerCase().startsWith('in mind:'))
  );

  const isShockedTyping = Boolean(
    isTyping &&
      currentLine &&
      (currentLine.bubbleEffect === 'shocked' || currentLine.emotion === 'shocked')
  );

  const isScreamingBubble = Boolean(
    currentLine &&
      (currentLine.bubbleEffect === 'screaming' || currentLine.emotion === 'screaming')
  );
  const isScreamingTyping = Boolean(isTyping && isScreamingBubble);

  // Format thought text cleanly while preserving "in mind:" emphasis
  const formattedDisplayedText = (() => {
    if (!displayedText) return '';
    if (isThoughtLine) {
      return displayedText.replace(/^\s*in\s+mind\s*:\s*/i, '');
    }
    return displayedText;
  })();

  // Dynamic colorful background gradient per speaker & emotion (vibrant colorful style)
  const colorfulStageGradient = (() => {
    if (!currentLine) return 'from-violet-900 via-purple-900 to-indigo-950';
    const emo = currentLine.emotion;
    if (emo === 'screaming' || emo === 'angry' || emo === 'laughing' || currentLine.bowShake) {
      return 'from-rose-900 via-fuchsia-900 to-purple-950';
    }
    if (currentLine.speaker === 'AYLA' || currentLine.speaker === 'WHITE_LILY') {
      return 'from-emerald-900 via-teal-800 to-indigo-950';
    }
    if (currentLine.speaker === 'CHLOE') {
      return 'from-pink-900 via-purple-800 to-indigo-950';
    }
    if (currentLine.speaker === 'ROWAN' || currentLine.speaker === 'STRANGER') {
      return 'from-sky-900 via-indigo-800 to-violet-950';
    }
    if (currentLine.speaker === 'LEO') {
      return 'from-amber-800 via-orange-900 to-purple-950';
    }
    return 'from-violet-900 via-purple-900 to-indigo-950';
  })();

  // Build Left / Middle / Right 3-character stage slots dynamically based on recent speakers
  const threeSlotCast: [CharacterSpeaker, CharacterSpeaker, CharacterSpeaker] = (() => {
    if (!activeEpisode || !currentLine) return ['AYLA', 'EMMA', 'CHLOE'];

    const epSpeakers: CharacterSpeaker[] = [];
    activeEpisode.lines.forEach((l) => {
      if (l.speaker !== 'NARRATOR' && !epSpeakers.includes(l.speaker)) {
        epSpeakers.push(l.speaker);
      }
    });

    const middle: CharacterSpeaker = epSpeakers.includes('EMMA') ? 'EMMA' : (epSpeakers[0] || 'EMMA');
    const others = epSpeakers.filter((s) => s !== middle);

    let left: CharacterSpeaker = others[0] || 'AYLA';
    let right: CharacterSpeaker = others[1] || 'CHLOE';

    // Keep whoever is currently speaking visible in Left, Middle, or Right
    if (currentLine.speaker !== 'NARRATOR' && currentLine.speaker !== middle) {
      if (currentLine.speaker !== left && currentLine.speaker !== right) {
        // Alternate slot smoothly for newcomer (Rowan -> Left or Right, Leo -> Right)
        if (currentLine.speaker === 'ROWAN' || currentLine.speaker === 'STRANGER') {
          left = currentLine.speaker;
        } else {
          right = currentLine.speaker;
        }
      }
    }

    return [left, middle, right];
  })();

  // Track which position ('left' | 'middle' | 'right') is currently speaking so the white bubble tail moves cleanly
  const activeSpeakerSlot: 'left' | 'middle' | 'right' = (() => {
    if (!currentLine) return 'middle';
    if (currentLine.speaker === threeSlotCast[0]) return 'left';
    if (currentLine.speaker === threeSlotCast[2]) return 'right';
    return 'middle';
  })();

  // Track last emotion per speaker in the current episode
  const getSpeakerEmotion = (speaker: CharacterSpeaker) => {
    if (!activeEpisode) return 'normal' as const;
    if (currentLine && currentLine.speaker === speaker) {
      return currentLine.emotion;
    }
    for (let i = lineIdx - 1; i >= 0; i--) {
      if (activeEpisode.lines[i].speaker === speaker) {
        return activeEpisode.lines[i].emotion;
      }
    }
    return 'normal' as const;
  };

  const isEvilTone = Boolean(
    currentLine &&
      currentLine.speaker === 'EMMA' &&
      (currentLine.bowShake ||
        ['angry', 'laughing', 'evil', 'jealous'].includes(currentLine.emotion))
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 font-sans select-none overflow-hidden overflow-x-hidden">
      {/* Top Header Bar */}
      <div className="relative z-30 flex items-center justify-between gap-2 px-2.5 md:px-6 py-2 md:py-2.5 bg-slate-950/90 border-b border-white/10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              soundManager.stopVoice();
              if (activeEpisode) {
                setActiveEpisode(null);
                setLineIdx(0);
              } else {
                onExitToMenu();
              }
            }}
            className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
            <span>{activeEpisode ? 'Episodes' : 'Menu'}</span>
          </button>

          <div className="min-w-0">
            <span className="text-xs md:text-base font-black text-white truncate block">
              {activeEpisode
                ? `S1 · Ep ${activeEpisode.id}: ${activeEpisode.title}`
                : "Season 1 Episodes"}
            </span>
          </div>
        </div>

        {/* Right Controls: Voice Acting On/Off Toggle + Skip Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleToggleVoice}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              voiceOn
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70'
                : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Character Voice Acting"
          >
            {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Voice: {voiceOn ? 'On' : 'Off'}</span>
          </button>

          {activeEpisode && (
            <>
              <button
                onClick={handleSkip5}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Skip 5 Dialogue Lines"
              >
                Skip &gt;&gt;
              </button>
              <button
                onClick={handleSkipAll}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/70 border border-purple-400/30 text-purple-200 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Skip Cutscene to Runner Stage"
              >
                Skip &gt;&gt;&gt;
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Body */}
      {activeEpisode && currentLine ? (
        /* ACTIVE EPISODE CUTSCENE STAGE (COLORFUL GRADIENT + LEFT/MIDDLE/RIGHT + WHITE CHAT BUBBLE) */
        <div
          onClick={handleNextLine}
          className={`relative flex-1 w-full h-full flex flex-col justify-between p-2.5 md:p-6 bg-gradient-to-br ${colorfulStageGradient} transition-all duration-700 cursor-pointer overflow-hidden overflow-x-hidden`}
        >
          {/* Colorful radial glow accents */}
          <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

          {/* Top Episode Progress Metadata */}
          <div className="relative z-10 flex items-center justify-between text-[11px] md:text-xs text-white/85 px-1">
            <div className="flex items-center gap-1.5 font-semibold drop-shadow">
              <span>Goal: {activeEpisode.runnerGoalCm} cm</span>
              {activeEpisode.enableChestHunt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300">3-Chest Hunt Active</span>
                </>
              )}
            </div>
            <span className="font-mono text-[10px] md:text-[11px] text-white/80 tabular-nums drop-shadow">
              {lineIdx + 1} / {activeEpisode.lines.length}
            </span>
          </div>

          {/* LEFT / MIDDLE / RIGHT MOVING CHARACTERS STAGE (NO SHAKING) */}
          <div className="relative z-10 flex-1 grid grid-cols-3 items-end gap-1.5 md:gap-6 max-w-4xl w-full mx-auto pb-1.5 md:pb-2 pointer-events-none">
            {threeSlotCast.map((sp, slotIndex) => {
              const isSpeaking = currentLine.speaker === sp;
              const meta = CHARACTER_CAST_META[sp];
              const emotion = getSpeakerEmotion(sp);
              const slotLabel = slotIndex === 0 ? 'left' : slotIndex === 1 ? 'middle' : 'right';

              return (
                <motion.div
                  key={`${slotLabel}-${sp}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{
                    opacity: 1,
                    y: isSpeaking ? -8 : 0,
                    scale: isSpeaking ? 1.05 : 0.96,
                  }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                  className={`flex flex-col items-center justify-end ${
                    isSpeaking ? 'z-20' : 'z-10'
                  }`}
                >
                  <CastCharacterSprite
                    speaker={sp}
                    emotion={emotion}
                    isActive={isSpeaking}
                    className="w-20 h-28 sm:w-36 sm:h-48 md:w-52 md:h-68"
                  />

                  <div className="mt-0.5 md:mt-1 flex items-center gap-1 text-[9px] md:text-xs font-bold drop-shadow bg-slate-950/65 px-2 py-0.5 rounded-md border border-white/15 whitespace-nowrap">
                    <span className={meta.accentText}>{meta.name}</span>
                    {meta.isWip && (
                      <span className="text-[8px] md:text-[9px] text-slate-300 font-normal">WIP</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* WHITE DYNAMIC CHAT BUBBLE (Moves Left / Middle / Right pointer with speaker) */}
          <div className="relative z-20 max-w-3xl w-full mx-auto pt-3">
            {/* Soft White Thought-Cloud Trailing Dots for "in mind:" lines */}
            {isThoughtLine ? (
              <div
                className={`flex items-center gap-1.5 mb-1.5 pointer-events-none transition-all duration-300 ${
                  activeSpeakerSlot === 'left'
                    ? 'justify-start pl-[16%]'
                    : activeSpeakerSlot === 'right'
                    ? 'justify-end pr-[16%]'
                    : 'justify-center'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-purple-300 shadow" />
                <span className="w-3.5 h-3.5 rounded-full bg-white border border-purple-300 shadow" />
              </div>
            ) : (
              /* Moving White Speech Bubble Pointer Tail toward Left / Middle / Right character */
              <div
                aria-hidden="true"
                className={`w-5 h-5 bg-white rotate-45 -mb-3 relative z-10 border-l-2 border-t-2 transition-all duration-300 ${
                  isScreamingBubble
                    ? 'border-slate-300'
                    : isShockedTyping
                    ? 'border-amber-400'
                    : 'border-slate-200'
                } ${
                  activeSpeakerSlot === 'left'
                    ? 'ml-[16%]'
                    : activeSpeakerSlot === 'right'
                    ? 'ml-[82%]'
                    : 'mx-auto'
                }`}
              />
            )}

            {/* Outer bubble shake wrapper — shakes ONLY the chat bubble while isTyping is true! */}
            <div
              className={`transition-transform ${
                isScreamingTyping && !settings?.reduceGlitches
                  ? 'animate-bubble-screaming'
                  : isShockedTyping && !settings?.reduceGlitches
                  ? 'animate-bubble-shocked'
                  : ''
              }`}
            >
              {/* Jagged WHITE frame for Screaming (NO red/black) */}
              <div
                className={`relative ${
                  isScreamingBubble
                    ? 'p-1.5 bg-slate-200 scream-bubble-jagged shadow-[0_10px_35px_rgba(255,255,255,0.45)]'
                    : ''
                }`}
              >
                <div
                  className={`relative z-20 p-3 md:p-6 shadow-2xl transition-colors ${
                    isScreamingBubble
                      ? 'bg-white scream-bubble-jagged text-slate-950'
                      : isThoughtLine
                      ? 'bg-white/95 border-2 border-dashed border-purple-400 rounded-2xl md:rounded-[28px] text-slate-800 shadow-[0_12px_35px_rgba(168,85,247,0.28)]'
                      : isShockedTyping
                      ? 'bg-white border-2 border-amber-400 rounded-2xl md:rounded-3xl text-slate-900 shadow-[0_12px_35px_rgba(251,191,36,0.3)]'
                      : 'bg-white border-2 border-slate-200 rounded-2xl md:rounded-3xl text-slate-900'
                  }`}
                >
                  {/* Speaker Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-1.5 md:mb-2">
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                      <span
                        className={`text-xs md:text-base font-black tracking-wide ${
                          CHARACTER_CAST_META[currentLine.speaker]?.bubbleText || 'text-rose-600'
                        }`}
                      >
                        {currentLine.speakerName}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-[11px] md:text-xs text-slate-600 capitalize font-medium">
                        {currentLine.emotion.replace('_', ' ')}
                      </span>
                      {isThoughtLine && (
                        <>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-[11px] md:text-xs italic text-purple-600 font-semibold">in mind</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.speakVoice(currentLine.text, currentLine.speaker, {
                          isEvil: isEvilTone,
                          emotion: currentLine.emotion,
                        });
                      }}
                      className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] md:text-[11px] font-semibold flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200"
                    >
                      <Volume2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600" />
                      <span>Voice</span>
                    </button>
                  </div>

                  {/* Dialogue Text with Typewriter Animation */}
                  <p
                    className={`min-h-[38px] md:min-h-[48px] text-xs sm:text-sm md:text-lg leading-relaxed ${
                      isThoughtLine
                        ? 'italic text-slate-700 font-medium'
                        : isScreamingBubble
                        ? 'font-black tracking-wide text-slate-950 uppercase'
                        : 'font-semibold text-slate-900'
                    }`}
                  >
                    {isThoughtLine && (
                      <span className="text-purple-600 not-italic font-bold mr-1.5">
                        in mind:
                      </span>
                    )}
                    {formattedDisplayedText}
                    {isTyping && (
                      <span className="inline-block w-2 h-4 bg-purple-600 ml-1 align-middle animate-pulse" />
                    )}
                  </p>

                  {/* Footer Prompt */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {isTyping
                        ? 'Tap to finish line'
                        : lineIdx === activeEpisode.lines.length - 1
                        ? `Tap to start ${activeEpisode.runnerGoalCm} cm Runner Stage`
                        : 'Tap anywhere to continue'}
                    </span>
                    <span className="text-purple-600 font-bold">
                      {lineIdx === activeEpisode.lines.length - 1
                        ? `Start ${activeEpisode.runnerGoalCm} cm Run →`
                        : 'Next →'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EPISODE SELECTOR (COLORFUL STAGE CARDS) */
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 max-w-5xl mx-auto w-full space-y-3 md:space-y-6 custom-scrollbar bg-gradient-to-b from-indigo-950/60 via-purple-950/40 to-slate-950">
          {/* Season Selector Tabs */}
          <div className="flex items-center gap-1.5 md:gap-2 pb-2 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => setSelectedSeason(1)}
              className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[11px] md:text-xs font-black tracking-wide transition-all cursor-pointer shrink-0 ${
                selectedSeason === 1
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Season 1 · 10 Episodes
            </button>

            {[2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setComingSoonModal(s)}
                className="px-2.5 py-1.5 md:px-4 md:py-2 rounded-xl text-[11px] md:text-xs font-bold tracking-wide bg-slate-900/70 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Lock className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
                <span>
                  Season {s}:{' '}
                  {s === 2 ? 'Forgotten Castle' : 'Corrupted Void Citadel'}
                </span>
              </button>
            ))}
          </div>

          {/* Season 1 Episodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3.5">
            {SEASON_1_EPISODES.map((ep) => {
              const isUnlocked =
                completedEpisodes.includes(ep.id) ||
                ep.id === 1 ||
                completedEpisodes.includes(ep.id - 1);
              const isFinished = completedEpisodes.includes(ep.id);

              return (
                <div
                  key={ep.id}
                  className={`p-2.5 md:p-4 rounded-2xl md:rounded-3xl border transition-all flex flex-col justify-between ${
                    !isUnlocked
                      ? 'bg-slate-950/40 border-white/5 opacity-45'
                      : 'bg-gradient-to-br from-purple-950/80 via-slate-900/90 to-indigo-950/80 border-purple-400/30 hover:border-pink-400 shadow-xl'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1 md:mb-1.5 text-[11px] md:text-xs">
                      <span className="font-bold text-purple-300 font-mono">
                        Episode {ep.id} · {ep.runnerGoalCm} cm
                        {ep.enableChestHunt ? ' · 3-Chest Hunt' : ''}
                      </span>
                      {isFinished ? (
                        <span className="text-emerald-300 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          <span>Cleared</span>
                        </span>
                      ) : (
                        <span className="text-amber-300 font-semibold">
                          +{ep.rewardCoins} Coins
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm md:text-base font-black text-white mb-0.5 md:mb-1">{ep.title}</h3>
                    <p className="text-slate-300 text-[11px] md:text-xs leading-relaxed mb-2.5 md:mb-3">
                      {ep.summary}
                    </p>
                  </div>

                  <button
                    disabled={!isUnlocked}
                    onClick={() => {
                      soundManager.playPowerup();
                      setActiveEpisode(ep);
                      setLineIdx(0);
                    }}
                    className={`w-full py-2 md:py-2.5 rounded-xl font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !isUnlocked
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : isFinished
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40 active:scale-95'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isFinished ? 'Replay Episode' : 'Play Episode'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Season 2 & 3 Locked Preview Modal */}
      <AnimatePresence>
        {comingSoonModal !== null && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-amber-500/40 rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto text-center space-y-3 md:space-y-4 shadow-2xl"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-300">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-xl font-black text-white">
                Season {comingSoonModal}:{' '}
                {comingSoonModal === 2
                  ? 'Forgotten Castle Secret Room'
                  : 'Corrupted Void Citadel'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Complete Season 1 episodes first to unlock Season {comingSoonModal} story chapters!
              </p>
              <button
                onClick={() => setComingSoonModal(null)}
                className="w-full py-2 md:py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Season 1 Complete Victory Modal */}
      <AnimatePresence>
        {seasonCompleteModal && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-b from-purple-900 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-2xl md:rounded-3xl p-4 md:p-8 max-w-md w-full max-h-[85vh] overflow-y-auto text-center space-y-3 md:space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl md:text-3xl mx-auto animate-bounce">
                🏆
              </div>
              <h3 className="text-lg md:text-2xl font-black text-white tracking-tight">
                Season 1 Complete!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Medium Mode (Season 2: Forgotten Castle Secret Room) is officially UNLOCKED!
              </p>

              <button
                onClick={() => {
                  setSeasonCompleteModal(false);
                  setActiveEpisode(null);
                  onStartRunner({
                    difficulty: 'medium',
                    episodeId: 10,
                    targetDistanceCm: 500,
                    enableChestHunt: true,
                    mapTheme: 'forgotten_castle',
                  });
                }}
                className="w-full py-2.5 md:py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl md:rounded-2xl shadow-xl transition-all cursor-pointer active:scale-95"
              >
                Run Forgotten Castle (500 cm)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
