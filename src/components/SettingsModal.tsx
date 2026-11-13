import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, Volume2, VolumeX, RotateCcw, ShieldAlert, Sparkles, Check, 
  Trash2, Sliders, Gamepad2, Monitor, Mic, Music, BellRing, Eye, Maximize2, 
  Minimize2, Zap, FastForward, Keyboard, Heart, Gauge, Mail, Bug, MessageSquare, 
  HelpCircle, ExternalLink, User, Copy, CheckCircle2, ChevronRight, Star
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { GameDifficulty } from './RunnerCanvas';
import { UserSettings, JumpKeyOption, ParticleDetail, UserProfile, BugReportItem, FeedbackItem } from '../types/game';
import { authService } from '../utils/authService';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (updater: (prev: UserSettings) => UserSettings) => void;
  unlockedLevels: GameDifficulty[];
  currentDifficulty: GameDifficulty;
  onSelectDifficulty: (diff: GameDifficulty) => void;
  onResetProgress: () => void;
  onClose: () => void;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
}

type SettingsTab = 'audio' | 'gameplay' | 'visuals' | 'levels' | 'rules' | 'support';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  unlockedLevels,
  currentDifficulty,
  onSelectDifficulty,
  onResetProgress,
  onClose,
  onOpenAuth,
  currentUser: initialUser,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');
  const [isFullscreenActive, setIsFullscreenActive] = useState(
    typeof document !== 'undefined' && !!document.fullscreenElement
  );
  const [isListeningKey, setIsListeningKey] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser || authService.getCurrentUser());

  // Support & Bug Reporting / Feedback Sub-dialogs
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [bugType, setBugType] = useState<BugReportItem['type']>('visual_glitch');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugSuccessToast, setBugSuccessToast] = useState(false);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackItem['category']>('gameplay');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoToast, setPromoToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Sync user authentication changes
  useEffect(() => {
    return authService.subscribe((u) => {
      setCurrentUser(u);
    });
  }, []);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreenActive(isFs);
      onUpdateSettings(prev => ({ ...prev, isFullscreen: isFs }));
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [onUpdateSettings]);

  // Key listening for custom remapping
  useEffect(() => {
    if (!isListeningKey) return;

    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let targetKey: JumpKeyOption = 'Space';
      if (e.code === 'ArrowUp') targetKey = 'ArrowUp';
      else if (e.code === 'KeyW') targetKey = 'KeyW';
      else if (e.code === 'Space') targetKey = 'Space';
      else {
        targetKey = 'Space';
      }

      onUpdateSettings(prev => ({ ...prev, jumpKey: targetKey }));
      setIsListeningKey(false);
      soundManager.playPowerup();
    };

    window.addEventListener('keydown', handleKey, { capture: true, once: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [isListeningKey, onUpdateSettings]);

  // Fullscreen toggle handler
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreenActive(true);
        onUpdateSettings(prev => ({ ...prev, isFullscreen: true }));
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreenActive(false);
        onUpdateSettings(prev => ({ ...prev, isFullscreen: false }));
      }
      soundManager.playLaneSwitch();
    } catch {
      // Ignored if restricted in iframe
    }
  };

  // Helper to test voice
  const handleTestVoice = () => {
    soundManager.speakVoice(
      "Hello! I am Emma. Let's find the ancient chest together!", 
      'EMMA'
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText('https://jade-community.carrd.co/');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDesc.trim()) return;
    authService.submitBugReport(bugType, bugTitle, bugDesc);
    soundManager.playPowerup();
    setBugSuccessToast(true);
    setBugTitle('');
    setBugDesc('');
    setTimeout(() => {
      setBugSuccessToast(false);
      setIsBugReportOpen(false);
    }, 1500);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    authService.submitFeedback(feedbackRating, feedbackCategory, feedbackMsg);
    soundManager.playPowerup();
    setFeedbackSuccessToast(true);
    setFeedbackMsg('');
    setTimeout(() => {
      setFeedbackSuccessToast(false);
      setIsFeedbackOpen(false);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 md:p-5 bg-slate-950/85 backdrop-blur-md font-sans select-none overflow-hidden overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative max-w-xl w-full bg-slate-900 border border-purple-500/30 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 md:pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-purple-950/90 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div>
              <h2 className="text-sm md:text-lg font-black text-white tracking-tight flex items-center gap-2">
                Game Settings & Safety
              </h2>
              <span className="text-[10px] md:text-[11px] text-slate-400 block">
                Audio, controls, visuals, community rules & support
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 md:p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Tab Navigation (6 Compact Tabs: Audio, Controls, Visuals, Levels, Rules, Support) */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1 p-1 bg-slate-950/80 border border-white/10 rounded-xl md:rounded-2xl my-2 md:my-3 shrink-0 text-[10px] md:text-[11px] font-bold">
          <button
            onClick={() => {
              soundManager.playLaneSwitch();
              setActiveTab('audio');
            }}
            className={`py-1.5 md:py-2 px-1 rounded-lg md:rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Audio & Sound"
          >
            <Volume2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
            <span className="truncate">Audio</span>
          </button>

          <button
            onClick={() => {
              soundManager.playLaneSwitch();
              setActiveTab('gameplay');
            }}
            className={`py-1.5 md:py-2 px-1 rounded-lg md:rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'gameplay'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Gameplay & Accessibility"
          >
            <Gamepad2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
            <span className="truncate">Controls</span>
          </button>

          <button
            onClick={() => {
              soundManager.playLaneSwitch();
              setActiveTab('visuals');
            }}
            className={`py-1.5 md:py-2 px-1 rounded-lg md:rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'visuals'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Visuals & Performance"
          >
            <Monitor className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
            <span className="truncate">Visuals</span>
          </button>

          <button
            onClick={() => {
              soundManager.playLaneSwitch();
              setActiveTab('levels');
            }}
            className={`py-1.5 md:py-2 px-1 rounded-lg md:rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Difficulty Progression"
          >
            <Gauge className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
            <span className="truncate">Levels</span>
          </button>

          <button
            onClick={() => {
              soundManager.playLaneSwitch();
              setActiveTab('rules');
            }}
            className={`py-1.5 md:py-2 px-1 rounded-lg md:rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-900/40'
                : 'text-amber-300 hover:text-white hover:bg-white/5'
            }`}
            title="Community Rules & Safety"
          >
            <ShieldAlert className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
            <span className="truncate">Rules</span>
          </button>

          <button
            onClick={() => {
              soundManager.playLaneSwitch();
              setActiveTab('support');
            }}
            className={`py-1.5 md:py-2 px-1 rounded-lg md:rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'support'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Support & Creator Info"
          >
            <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
            <span className="truncate">Support</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 my-1 custom-scrollbar">

          {/* TAB 1: 🛠️ AUDIO & SOUND */}
          {activeTab === 'audio' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Mute All / Silent Mode Quick Toggle */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${settings.isMuted ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300' : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'}`}>
                    {settings.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Mute All / Silent Mode
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Quickly mute all sounds and music for quiet play
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const nextMute = !settings.isMuted;
                    soundManager.setMuted(nextMute);
                    onUpdateSettings(prev => ({ ...prev, isMuted: nextMute }));
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    settings.isMuted
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  }`}
                >
                  {settings.isMuted ? 'Muted' : 'Sound On'}
                </button>
              </div>

              {/* BGM / Music Volume Slider */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">
                        BGM / Music Volume
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Adjust background music during cutscenes and running levels
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {settings.bgmVolume}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.bgmVolume}
                    disabled={settings.isMuted}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      soundManager.setBgmVolume(val);
                      onUpdateSettings(prev => ({ ...prev, bgmVolume: val }));
                    }}
                    className="w-full accent-purple-500 cursor-pointer disabled:opacity-40"
                  />
                  <button
                    onClick={() => {
                      const next = settings.bgmVolume === 0 ? 70 : 0;
                      soundManager.setBgmVolume(next);
                      onUpdateSettings(prev => ({ ...prev, bgmVolume: next }));
                    }}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    {settings.bgmVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* SFX Volume Slider */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-pink-400" />
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">
                        SFX Volume
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sound effects for jumping, rock collisions, chest clicks & glitch sounds
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-pink-300">
                    {settings.sfxVolume}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sfxVolume}
                    disabled={settings.isMuted}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      soundManager.setSfxVolume(val);
                      onUpdateSettings(prev => ({ ...prev, sfxVolume: val }));
                    }}
                    onMouseUp={() => soundManager.playTestSFX()}
                    onTouchEnd={() => soundManager.playTestSFX()}
                    className="w-full accent-pink-500 cursor-pointer disabled:opacity-40"
                  />
                  <button
                    onClick={() => {
                      const next = settings.sfxVolume === 0 ? 80 : 0;
                      soundManager.setSfxVolume(next);
                      onUpdateSettings(prev => ({ ...prev, sfxVolume: next }));
                    }}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    {settings.sfxVolume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Voice Dialogue & Speech Synthesis */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">
                        Character Voice Lines
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Synthesized character voices for Emma, Stranger & Narrator
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestVoice}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-[10px] font-bold text-purple-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Test Voice 🔊</span>
                    </button>
                    <button
                      onClick={() => {
                        const next = !settings.voiceEnabled;
                        soundManager.setVoiceEnabled(next);
                        onUpdateSettings(prev => ({ ...prev, voiceEnabled: next }));
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        settings.voiceEnabled
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {settings.voiceEnabled ? 'Enabled' : 'Muted'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.voiceVolume}
                    disabled={settings.isMuted || !settings.voiceEnabled}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      soundManager.setVoiceVolume(val);
                      onUpdateSettings(prev => ({ ...prev, voiceVolume: val }));
                    }}
                    className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                  />
                  <span className="text-xs font-mono font-bold text-amber-300 w-10 text-right">
                    {settings.voiceVolume}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 🎮 GAMEPLAY & ACCESSIBILITY */}
          {activeTab === 'gameplay' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Cutscene Skip / Fast-Forward */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <FastForward className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">
                        Cutscene Fast-Forward / Instant Text
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Display dialogue text instantly without waiting for typewriter effect
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playLaneSwitch();
                      onUpdateSettings(prev => ({ ...prev, instantText: !prev.instantText }));
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                      settings.instantText
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {settings.instantText ? 'Instant' : 'Typewriter'}
                  </button>
                </div>
              </div>

              {/* Control Remapping: Jump Key */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-pink-950/80 border border-pink-500/40 flex items-center justify-center text-pink-300">
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">
                        Control Remapping (Jump Key)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Choose preferred key or click to rebind your runner jump
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-pink-400 uppercase bg-pink-950/50 px-2 py-0.5 rounded-md border border-pink-500/30">
                    {settings.jumpKey === 'Space' ? 'Spacebar' : settings.jumpKey === 'ArrowUp' ? 'UP Arrow' : 'W Key'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { key: 'Space' as JumpKeyOption, label: 'Spacebar', sub: 'Default' },
                    { key: 'ArrowUp' as JumpKeyOption, label: 'UP Arrow', sub: 'Arrow Keys' },
                    { key: 'KeyW' as JumpKeyOption, label: 'W Key', sub: 'WASD' }
                  ].map((item) => {
                    const isSelected = settings.jumpKey === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          soundManager.playLaneSwitch();
                          onUpdateSettings(prev => ({ ...prev, jumpKey: item.key }));
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-pink-500 bg-pink-950/60 text-white font-bold ring-1 ring-pink-400'
                            : 'border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-extrabold block">{item.label}</span>
                        <span className="text-[10px] text-slate-400">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Tweaks / Relaxed Jump Window */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Relaxed Reaction Speed
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Gives obstacles a slightly larger jump window in Story mode
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundManager.playLaneSwitch();
                    onUpdateSettings(prev => ({ ...prev, relaxedReaction: !prev.relaxedReaction }));
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                    settings.relaxedReaction
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.relaxedReaction ? 'Relaxed' : 'Normal'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 🖥️ VISUALS & PERFORMANCE */}
          {activeTab === 'visuals' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Glitch / Flash Effects Toggle */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-300">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Glitch & Flash Effects
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Reduce intense screen glitches, screen shakes & sudden flashes
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const next = !settings.reduceGlitches;
                    soundManager.playLaneSwitch();
                    onUpdateSettings(prev => ({ ...prev, reduceGlitches: next }));
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer shrink-0 ${
                    settings.reduceGlitches
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {settings.reduceGlitches ? "Reduced" : "Full Effects"}
                </button>
              </div>

              {/* Fullscreen Mode Toggle */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0">
                    {isFullscreenActive ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      Fullscreen Mode
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Toggle between windowed and native fullscreen display
                    </span>
                  </div>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase bg-sky-600 hover:bg-sky-500 text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {isFullscreenActive ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullscreenActive ? "Exit Fullscreen" : "Fullscreen"}</span>
                </button>
              </div>

              {/* Particle / Effects Detail */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-white text-xs sm:text-sm block">
                        Particle & Graphic Detail
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Lower graphic effects for smoother performance on slower devices
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 uppercase">
                    {settings.particleDetail} Detail
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {(['low', 'medium', 'high'] as ParticleDetail[]).map((detail) => {
                    const isSelected = settings.particleDetail === detail;
                    return (
                      <button
                        key={detail}
                        onClick={() => {
                          soundManager.playLaneSwitch();
                          onUpdateSettings(prev => ({ ...prev, particleDetail: detail }));
                        }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 text-white font-bold ring-1 ring-amber-400'
                            : 'border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="text-xs font-black uppercase block">
                          {detail}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {detail === 'low' ? 'Max FPS' : detail === 'medium' ? 'Balanced' : 'Full VFX'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 🏆 DIFFICULTY PROGRESSION & LEVELS */}
          {activeTab === 'levels' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    Select Active Difficulty
                  </span>
                  <span className="text-[11px] text-purple-300 font-mono">
                    {unlockedLevels.length} / 4 Unlocked
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(['story', 'medium', 'hard', 'pro'] as GameDifficulty[]).map((level) => {
                    const isUnlocked = unlockedLevels.includes(level);
                    const isSelected = currentDifficulty === level;

                    return (
                      <button
                        key={level}
                        disabled={!isUnlocked}
                        onClick={() => {
                          soundManager.playLaneSwitch();
                          onSelectDifficulty(level);
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          !isUnlocked
                            ? 'opacity-35 bg-slate-950/40 border-white/5 cursor-not-allowed'
                            : isSelected
                            ? 'border-purple-400 bg-purple-950/60 shadow-lg shadow-purple-900/40 ring-1 ring-purple-400 cursor-pointer'
                            : 'border-white/10 bg-slate-950/60 hover:border-white/20 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            {level}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {level === 'story' ? '100 cm · Normal speed' :
                           level === 'medium' ? '150 cm · Faster' :
                           level === 'hard' ? '200 cm · Rapid rocks' : '250 cm · Master runner'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone: Reset Progress */}
              <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-300 block">Reset Progression</span>
                  <span className="text-[10px] text-slate-400">Relock difficulties to Story mode</span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Reset all unlocked difficulties and start fresh from Story mode?")) {
                      onResetProgress();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: 🛡️ COMMUNITY RULES & SAFETY */}
          {activeTab === 'rules' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="bg-gradient-to-br from-amber-950/60 via-slate-950 to-rose-950/60 border border-amber-500/40 rounded-2xl p-3 md:p-4 space-y-2.5 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-black text-white">
                      Community Rules & Safety
                    </h3>
                    <span className="text-[10px] md:text-[11px] text-amber-300">
                      Applies to all Multiplayer Host Rooms & Lobby Chat
                    </span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-[11px] md:text-xs text-slate-200 bg-slate-950/60 border border-white/10 rounded-xl p-2.5 md:p-3">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-black">1.</span>
                    <span><strong>No Profanity, Hate Speech, or Harassment:</strong> Be kind and respectful to all players. Swearing, slurs, threats, and bullying are strictly prohibited.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-black">2.</span>
                    <span><strong>Protect Personal Info:</strong> Never share or ask for emails, phone numbers, home addresses, or passwords in chat.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-black">3.</span>
                    <span><strong>No Spam or Suspicious Links:</strong> Do not flood chat with repeated messages, character spam, or external website links.</span>
                  </li>
                </ul>

                <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-2.5 md:p-3 space-y-1">
                  <span className="text-[11px] md:text-xs font-black text-rose-300 uppercase tracking-wide block">
                    Automated Moderation & Ban Policy
                  </span>
                  <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed">
                    Every lobby chat message is automatically checked. Rule-breaking messages are blocked immediately:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] md:text-[11px] text-center font-bold">
                    <div className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-500/30 text-amber-200">
                      Strikes 1–2<br /><span className="font-normal text-amber-300/80">Warning</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-orange-950/70 border border-orange-500/30 text-orange-200">
                      Strikes 3–4<br /><span className="font-normal text-orange-300/80">5-Min Chat Ban</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200">
                      5+ Strikes<br /><span className="font-normal text-rose-300/80">Permanent Ban</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: 📩 SUPPORT & CREATOR INFO */}
          {activeTab === 'support' && (
            <div className="space-y-3.5 animate-fadeIn">
              {/* Developer Credits Card */}
              <div className="bg-gradient-to-br from-purple-950/80 via-slate-950 to-pink-950/80 border border-pink-500/30 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300">
                      🌸
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400 block">
                        Developer Credits
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Created & Developed by Jade Pinker
                      </h3>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[10px] font-bold">
                    Official
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed font-medium bg-slate-950/50 p-2.5 rounded-xl border border-white/5">
                  A heartfelt thank you to all players for playing <strong className="text-pink-300">Emma's Evil Run</strong>! Your journey through Emma's story, jealousy of White Lily's wand, and the sprint to recover the chest means everything to us.
                </p>
              </div>

              {/* Feedback & Bug Reporting */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsBugReportOpen(true)}
                  className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-rose-500/30 hover:border-rose-400/60 rounded-2xl text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-300">
                      <Bug className="w-3.5 h-3.5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-300 transition-colors" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-rose-300 transition-colors">
                      Report a Bug
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Submit visual glitches or issues
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-purple-500/30 hover:border-purple-400/60 rounded-2xl text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 transition-colors" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-purple-300 transition-colors">
                      Send Feedback
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Ideas & player suggestions
                    </span>
                  </div>
                </button>
              </div>

              {/* Help & Controls Guide */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Help & Controls Guide
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                    <strong className="text-amber-300 block font-bold">How to Play:</strong>
                    <ul className="text-slate-300 space-y-0.5 list-disc list-inside">
                      <li><strong>Space / Tap</strong>: Jump over rocks</li>
                      <li><strong>ESC Key</strong>: Pause the game</li>
                      <li><strong>Chest (100cm)</strong>: Tap 5x to collect!</li>
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                    <strong className="text-purple-300 block font-bold">FAQ & Story Hints:</strong>
                    <p className="text-slate-300 leading-tight">
                      Stuck? Beat Story mode to unlock Medium, then Hard, then Pro! Jump early on big morning rocks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Community & Social Links */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    My Community
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[200px] sm:max-w-none">
                    https://jade-community.carrd.co/
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href="https://jade-community.carrd.co/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all cursor-pointer"
                  >
                    <span>Visit Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* User Authentication & Account Status */}
              <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-sm">
                    {currentUser?.avatarUrl || '👤'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {currentUser ? `Account: @${currentUser.username}` : 'Not Signed In'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentUser ? 'Progress synced with user account' : 'Sign in with Username or Email to unlock Host Rooms'}
                    </span>
                  </div>
                </div>

                {onOpenAuth && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {currentUser ? 'Manage' : 'Sign In / Register'}
                  </button>
                )}
              </div>

              {/* Promo Redeem Code System */}
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 block">
                    🎁 Redeem Promo Code
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Try: "whitelilycookiewand" or "Happynewapps"
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => {
                      if (!promoInput.trim()) return;
                      const res = authService.redeemPromoCode(promoInput);
                      if (res.success) {
                        soundManager.playPowerup();
                        setPromoToast({ text: res.message, isError: false });
                        setPromoInput('');
                      } else {
                        soundManager.playCrash();
                        setPromoToast({ text: res.message, isError: true });
                      }
                      setTimeout(() => setPromoToast(null), 3000);
                    }}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Claim
                  </button>
                </div>

                {promoToast && (
                  <span className={`text-[11px] font-bold block ${promoToast.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {promoToast.text}
                  </span>
                )}
              </div>

              {/* Version & Updates */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Version: <strong className="text-slate-300 font-mono">1.0.0V</strong></span>
                <span>Season 1 · Episode 1 Jealousy Powerful Wand</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-500">
            Version 1.0.0V · Emma's Evil Run
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer active:scale-95"
          >
            Save & Close
          </button>
        </div>

        {/* Nested Modal: Report a Bug */}
        <AnimatePresence>
          {isBugReportOpen && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 md:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-rose-500/40 rounded-2xl md:rounded-3xl p-3.5 md:p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto space-y-2.5 md:space-y-3 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-rose-400" />
                    <h4 className="font-black text-white text-sm">Report a Bug</h4>
                  </div>
                  <button onClick={() => setIsBugReportOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {bugSuccessToast ? (
                  <div className="p-4 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-white">Thank you! Bug report submitted successfully.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitBug} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Issue Category</label>
                      <select
                        value={bugType}
                        onChange={(e) => setBugType(e.target.value as any)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                      >
                        <option value="visual_glitch">Visual Glitch / Texture</option>
                        <option value="bug">Gameplay Obstacle / Collision</option>
                        <option value="audio_issue">Audio / Sound issue</option>
                        <option value="gameplay">Cutscene / Story progression</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Brief Title</label>
                      <input
                        type="text"
                        required
                        value={bugTitle}
                        onChange={(e) => setBugTitle(e.target.value)}
                        placeholder="e.g. Rock hitbox felt too wide"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">What happened?</label>
                      <textarea
                        required
                        rows={3}
                        value={bugDesc}
                        onChange={(e) => setBugDesc(e.target.value)}
                        placeholder="Describe what you were doing when it occurred..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsBugReportOpen(false)}
                        className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Submit Bug
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Nested Modal: Send Feedback */}
        <AnimatePresence>
          {isFeedbackOpen && (
            <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 md:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-purple-500/40 rounded-2xl md:rounded-3xl p-3.5 md:p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto space-y-2.5 md:space-y-3 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    <h4 className="font-black text-white text-sm">Send Player Feedback</h4>
                  </div>
                  <button onClick={() => setIsFeedbackOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {feedbackSuccessToast ? (
                  <div className="p-4 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-white">Thank you for your feedback! Jade appreciates your suggestions.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Your Game Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${star <= feedbackRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Category</label>
                      <select
                        value={feedbackCategory}
                        onChange={(e) => setFeedbackCategory(e.target.value as any)}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                      >
                        <option value="gameplay">Gameplay & Runner speed</option>
                        <option value="story">Story & Dialogue</option>
                        <option value="sound">Music & Character Voices</option>
                        <option value="visuals">Art & Character Design</option>
                        <option value="suggestion">New feature suggestion</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Your Message or Suggestion</label>
                      <textarea
                        required
                        rows={3}
                        value={feedbackMsg}
                        onChange={(e) => setFeedbackMsg(e.target.value)}
                        placeholder="Tell Jade what you loved or what you want added next..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsFeedbackOpen(false)}
                        className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Send Feedback
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
