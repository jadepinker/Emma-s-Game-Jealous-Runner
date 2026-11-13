import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, Volume2, VolumeX, ShoppingBag, Settings, Users
} from 'lucide-react';
import {
  GameScreen,
  PlayerStats,
  UpgradeLevels,
  UserSettings,
  DEFAULT_USER_SETTINGS,
  UserProfile,
  GameDifficulty,
  RunnerStageConfig,
} from './types/game';
import { StoryModeView } from './components/StoryModeView';
import { MultiplayerLobbyView } from './components/MultiplayerLobbyView';
import { AvatarVault } from './components/AvatarVault';
import { ProfileScreen } from './components/ProfileScreen';
import { RunnerCanvas } from './components/RunnerCanvas';
import { GameOverModal } from './components/GameOverModal';
import { ChestFoundCutscene } from './components/ChestFoundCutscene';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { CastCharacterSprite } from './components/StoryCharacters';
import { soundManager } from './audio/soundManager';
import { authService } from './utils/authService';
import { lobbyService } from './utils/lobbyService';

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('emma_runner_settings');
    if (saved) {
      try {
        return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return DEFAULT_USER_SETTINGS;
  });

  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [coins, setCoins] = useState<number>(() => authService.getLocalCoins());
  const [highScore, setHighScore] = useState<number>(0);
  const [totalCrystals, setTotalCrystals] = useState<number>(0);
  const [upgrades] = useState<UpgradeLevels>(DEFAULT_UPGRADES);
  const [unlockedLevels, setUnlockedLevels] = useState<GameDifficulty[]>(['story']);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('story');
  const [runnerStage, setRunnerStage] = useState<RunnerStageConfig>({
    difficulty: 'story',
    targetDistanceCm: 100,
    enableChestHunt: true,
    mapTheme: 'moonlit_meadow',
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [runnerKey, setRunnerKey] = useState<number>(1);
  const [finalStats, setFinalStats] = useState<PlayerStats | null>(null);

  // Multiplayer share link & room invitation states
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<{ roomCode: string; url: string } | null>(null);

  // Secret Easter Egg state: click portrait 5 times quickly
  const [easterEggClicks, setEasterEggClicks] = useState<number>(0);
  const [isEvilGlitchActive, setIsEvilGlitchActive] = useState<boolean>(false);

  // Subscribe to auth & coin changes
  useEffect(() => {
    return authService.subscribe((u) => {
      setCurrentUser(u);
      setCoins(authService.getLocalCoins());
    });
  }, []);

  // Check URL room param on mount e.g. ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        const code = roomParam.trim().toUpperCase();
        setPendingRoomCode(code);
        const user = authService.getCurrentUser();
        if (!user || authService.isGuest()) {
          setAuthPromptMessage(`You've been invited to join Lobby [${code}]! Please enter or log into your username before joining the lobby.`);
          setIsAuthOpen(true);
        } else {
          lobbyService.joinRoom(code, user.username, user.avatarUrl, user.wardrobe?.dyeColors);
          setCurrentScreen('MULTIPLAYER');
        }
      }
    }
  }, []);

  const handleHostRoom = () => {
    const user = authService.getCurrentUser();
    if (!user || authService.isGuest()) {
      soundManager.playLaneSwitch();
      setAuthPromptMessage("Please enter or log into your username to host a multiplayer room!");
      setIsAuthOpen(true);
      return;
    }

    soundManager.playPowerup();
    const room = lobbyService.createRoom(
      user.username,
      true,
      undefined,
      user.avatarUrl,
      user.wardrobe?.dyeColors
    );

    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room.room_code}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }

    setShareToast({ roomCode: room.room_code, url: shareUrl });
    setCurrentScreen('MULTIPLAYER');
  };

  // Track playtime periodically
  useEffect(() => {
    const timer = setInterval(() => {
      authService.addPlaytime(5);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Load persistence
  useEffect(() => {
    const savedHighScore = localStorage.getItem('emma_runner_highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10) || 0);

    const savedCrystals = localStorage.getItem('emma_runner_crystals');
    if (savedCrystals) setTotalCrystals(parseInt(savedCrystals, 10) || 0);

    const savedLevels = localStorage.getItem('emma_runner_unlocked_levels');
    if (savedLevels) {
      try {
        const parsed = JSON.parse(savedLevels);
        if (Array.isArray(parsed) && parsed.includes('story')) {
          setUnlockedLevels(parsed);
        }
      } catch {
        // fallback
      }
    }
  }, []);

  const handleUpdateSettings = (updater: (prev: UserSettings) => UserSettings) => {
    setSettings(prev => {
      const next = updater(prev);
      localStorage.setItem('emma_runner_settings', JSON.stringify(next));
      setIsMuted(next.isMuted);
      return next;
    });
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    handleUpdateSettings(prev => ({ ...prev, isMuted: muted }));
  };

  const handleUnlockDifficulty = (diff: GameDifficulty) => {
    setUnlockedLevels(prev => {
      if (!prev.includes(diff)) {
        const updated = [...prev, diff];
        localStorage.setItem('emma_runner_unlocked_levels', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Secret Easter Egg trigger: click avatar 5 times quickly
  const handleAvatarClick = () => {
    const nextCount = easterEggClicks + 1;
    setEasterEggClicks(nextCount);

    if (nextCount >= 5) {
      // Trigger Secret Glitched Evil effect!
      soundManager.playCrash();
      setIsEvilGlitchActive(true);
      setEasterEggClicks(0);
      setTimeout(() => {
        setIsEvilGlitchActive(false);
      }, 3500);
    } else {
      soundManager.playPowerup();
    }
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

    authService.addCoins(stats.coins || 15);
  }, []);

  const isSignedIn = Boolean(currentUser && !authService.isGuest());

  return (
    <div className={`relative w-screen h-screen overflow-hidden overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none ${
      isEvilGlitchActive ? 'filter invert-[15%] contrast-150 animate-pulse' : ''
    }`}>
      {/* Main View Area (Full-screen without any solid top dark bar) */}
      <main className="relative flex-1 w-full h-full overflow-hidden overflow-x-hidden">
        {/* 1. CLEAN, FULL-SCREEN MAIN MENU */}
        {currentScreen === 'MENU' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-2 md:p-6 bg-black overflow-x-hidden overflow-y-auto md:overflow-hidden select-none">
            {/* Floating Top-Right Glass Corner Pills (Coins, Settings, Sound Mute) */}
            <div className="absolute top-2.5 right-2.5 md:top-5 md:right-5 z-20 flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => {
                  soundManager.playLaneSwitch();
                  setCurrentScreen('VAULT');
                }}
                className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-amber-300 font-mono font-bold text-[11px] md:text-xs cursor-pointer transition-all"
                title="Open Vault & Shop"
              >
                <span>🪙 {coins.toLocaleString()}</span>
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 md:p-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white transition-all cursor-pointer"
                title="Settings, Community Rules & Support"
                aria-label="Open Settings"
              >
                <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-300" />
              </button>

              <button
                onClick={handleToggleMute}
                className="p-1.5 md:p-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-white transition-all cursor-pointer"
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Background Red Atmosphere */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
              isEvilGlitchActive
                ? 'bg-rose-950 opacity-90 animate-ping'
                : settings.reduceGlitches
                ? 'bg-[radial-gradient(circle_at_50%_45%,rgba(185,28,28,0.45)_0%,rgba(0,0,0,0.96)_75%)] opacity-70'
                : 'bg-[radial-gradient(circle_at_50%_45%,rgba(185,28,28,0.45)_0%,rgba(0,0,0,0.96)_75%)] animate-[pulse_2.2s_infinite]'
            }`} />

            {/* Blood mist vignette around edges */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(76,5,25,0.75)_100%)] pointer-events-none" />

            {/* Centered, Clean, Mobile-Friendly Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-md w-full my-auto px-2">
              {/* Emma's Portrait with 5-Tap Secret Easter Egg (no character shake) */}
              <div 
                className={`relative mb-1.5 md:mb-3 group cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${
                  isEvilGlitchActive ? 'filter drop-shadow-[0_0_40px_rgba(244,63,94,1)] scale-110' : ''
                }`} 
                onClick={handleAvatarClick}
                title="Tap 5 times for a secret surprise!"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-52 md:h-52 filter drop-shadow-[0_12px_35px_rgba(225,29,72,0.55)]">
                  <CastCharacterSprite
                    speaker="EMMA"
                    emotion={isEvilGlitchActive ? 'laughing' : 'normal'}
                    bowShake={false}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Clean Game Title */}
              <h1 className="text-xl sm:text-2xl md:text-5xl font-black tracking-tight text-white mb-2.5 md:mb-6 drop-shadow-[0_4px_20px_rgba(244,63,94,0.6)]">
                Emma's <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-purple-400">Jealous Dash</span>
              </h1>

              {/* PRIMARY ACTION BUTTONS */}
              <div className="w-full max-w-[260px] md:max-w-sm flex flex-col gap-2 md:gap-3">
                {/* PROMINENT STYLED "START GAME" BUTTON -> Opens Story Mode */}
                <button
                  onClick={() => {
                    soundManager.playPowerup();
                    setCurrentScreen('STORY');
                  }}
                  className="w-full px-3 py-2 md:py-4 md:px-8 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:via-pink-500 hover:to-purple-500 text-white font-black text-xs md:text-xl uppercase tracking-wider rounded-xl md:rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.65)] border border-pink-400/50 flex items-center justify-center gap-2 md:gap-3 active:scale-95 transition-all cursor-pointer group hover:scale-[1.02]"
                  title="Start Story Mode"
                >
                  <div className="w-5 h-5 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <Play className="w-3 h-3 md:w-6 md:h-6 fill-current text-white ml-0.5" />
                  </div>
                  <span>START GAME</span>
                </button>

                {/* HOST ROOM (hidden unless signed in) + "You" Profile Pill */}
                <div className="w-full flex items-center justify-center gap-2 md:gap-2.5">
                  {isSignedIn && (
                    <button
                      onClick={handleHostRoom}
                      className="flex-1 px-3 py-2 md:py-3.5 md:px-5 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-purple-400/40 hover:border-purple-300 text-purple-100 hover:text-white font-black text-xs md:text-base uppercase tracking-wider rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5 md:gap-2.5 active:scale-95 transition-all cursor-pointer group"
                      title="Host Room & Multiplayer"
                    >
                      <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-300" />
                      <span>HOST ROOM</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      soundManager.playLaneSwitch();
                      if (isSignedIn) {
                        setCurrentScreen('PROFILE');
                      } else {
                        setAuthPromptMessage('Sign in or create an account to unlock your Profile & Multiplayer Host Rooms!');
                        setIsAuthOpen(true);
                      }
                    }}
                    className={`${isSignedIn ? 'px-3 md:px-4' : 'w-full px-3 md:px-5'} py-2 md:py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-purple-400/35 hover:border-purple-300 text-purple-100 hover:text-white font-bold text-xs md:text-sm rounded-xl md:rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0`}
                    title={isSignedIn ? 'Open Player Profile' : 'Sign In or Register Account'}
                  >
                    <span className="text-sm md:text-base">{isSignedIn ? currentUser?.avatarUrl || '🌸' : '👤'}</span>
                    {isSignedIn ? (
                      <span className="max-w-[90px] md:max-w-[120px] truncate font-black">{currentUser?.username}</span>
                    ) : (
                      <span>
                        <strong className="font-black">You</strong>{' '}
                        <span className="text-slate-300 font-medium">(Not Signed In)</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom-Left Vault & Shop Button */}
            <button
              onClick={() => {
                soundManager.playLaneSwitch();
                setCurrentScreen('VAULT');
              }}
              className="absolute bottom-2.5 left-2.5 md:bottom-5 md:left-5 z-20 px-2.5 py-1.5 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-amber-400/40 text-amber-300 hover:text-amber-200 font-black text-[11px] md:text-sm flex items-center gap-1.5 md:gap-2 shadow-xl active:scale-95 transition-all cursor-pointer"
              title="Open Vault & Shop"
            >
              <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
              <span>Vault & Shop</span>
            </button>
          </div>
        )}

        {/* 2. VISUAL NOVEL STORY MODE (SEASON 1 - 10 EPISODES) */}
        {currentScreen === 'STORY' && (
          <StoryModeView
            settings={settings}
            unlockedLevels={unlockedLevels}
            onUpdateSettings={handleUpdateSettings}
            onUnlockDifficulty={handleUnlockDifficulty}
            onStartRunner={(config) => {
              setSelectedDifficulty(config.difficulty);
              setRunnerStage(config);
              setRunnerKey(prev => prev + 1);
              setCurrentScreen('RUNNER');
            }}
            onExitToMenu={() => setCurrentScreen('MENU')}
          />
        )}

        {/* 3. STORY EPISODE RUNNER STAGE (PROGRESSION & 3-CHEST HUNT FROM EP 5+) */}
        {currentScreen === 'RUNNER' && (
          <RunnerCanvas
            key={`runner_${runnerKey}`}
            difficulty={runnerStage.difficulty}
            episodeId={runnerStage.episodeId}
            targetDistanceCm={runnerStage.targetDistanceCm}
            enableChestHunt={runnerStage.enableChestHunt}
            mapTheme={runnerStage.mapTheme}
            settings={settings}
            upgrades={upgrades}
            onGameOver={handleGameOver}
            onChestFound={() => setCurrentScreen('CHEST_FOUND')}
            onAllChestsCollected={() => {
              soundManager.playVictoryFanfare();
              authService.addCoins(200);
            }}
            onReturnMenu={() => setCurrentScreen('MENU')}
          />
        )}

        {/* 5. MULTIPLAYER 2D INTERACTIVE WALKABLE LOBBY */}
        {currentScreen === 'MULTIPLAYER' && (
          <MultiplayerLobbyView
            onBackToMenu={() => setCurrentScreen('MENU')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onStartMatch={() => {
              setRunnerStage({
                difficulty: selectedDifficulty,
                targetDistanceCm: 150,
                enableChestHunt: true,
                mapTheme: 'shadow_woods',
              });
              setRunnerKey(prev => prev + 1);
              setCurrentScreen('RUNNER');
            }}
          />
        )}

        {/* 6. AVATAR VAULT & RGB COLOR DYE STATION */}
        {currentScreen === 'VAULT' && (
          <AvatarVault onBackToMenu={() => setCurrentScreen('MENU')} />
        )}

        {/* 7. "YOU" PLAYER PROFILE SCREEN */}
        {currentScreen === 'PROFILE' && (
          <ProfileScreen
            onBackToMenu={() => setCurrentScreen('MENU')}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* 8. CHEST FOUND / STAGE CLEAR CUTSCENE */}
        {currentScreen === 'CHEST_FOUND' && (
          <ChestFoundCutscene
            difficulty={runnerStage.difficulty}
            episodeId={runnerStage.episodeId}
            enableChestHunt={runnerStage.enableChestHunt}
            completedGoalCm={runnerStage.targetDistanceCm}
            onRestartStory={() => setCurrentScreen('STORY')}
            onContinueEndless={(nextLevel) => {
              const targetDiff = nextLevel || runnerStage.difficulty;
              if (nextLevel) setSelectedDifficulty(nextLevel);
              setRunnerStage(prev => ({
                difficulty: targetDiff,
                episodeId: prev.episodeId ? prev.episodeId + 1 : undefined,
                targetDistanceCm: prev.episodeId ? (prev.episodeId + 1) * 50 : (
                  targetDiff === 'pro' ? 250 :
                  targetDiff === 'hard' ? 200 :
                  targetDiff === 'medium' ? 150 : 100
                ),
                enableChestHunt: prev.episodeId ? (prev.episodeId + 1) >= 5 : true,
                mapTheme: prev.episodeId && prev.episodeId + 1 >= 5 ? 'shadow_woods' : prev.mapTheme,
              }));
              setRunnerKey(prev => prev + 1);
              setCurrentScreen('RUNNER');
            }}
            onUnlockNextDifficulty={handleUnlockDifficulty}
            onReturnMenu={() => setCurrentScreen('MENU')}
          />
        )}

        {/* 9. GAME OVER SCREEN */}
        {currentScreen === 'GAME_OVER' && finalStats && (
          <div className="relative w-full h-full">
            <GameOverModal
              stats={finalStats}
              highScore={highScore}
              totalCrystals={totalCrystals}
              onRestart={() => {
                setRunnerKey(prev => prev + 1);
                setCurrentScreen('RUNNER');
              }}
              onOpenShop={() => setCurrentScreen('VAULT')}
              onOpenStory={() => setCurrentScreen('STORY')}
              onReturnMenu={() => setCurrentScreen('MENU')}
            />
          </div>
        )}

        {/* SETTINGS MODAL (Audio, Controls, Visuals, Levels, Support Credits by Jade Pinker) */}
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            unlockedLevels={unlockedLevels}
            currentDifficulty={selectedDifficulty}
            onSelectDifficulty={setSelectedDifficulty}
            onResetProgress={() => {
              setUnlockedLevels(['story']);
              setSelectedDifficulty('story');
              localStorage.setItem('emma_runner_unlocked_levels', JSON.stringify(['story']));
              setIsSettingsOpen(false);
            }}
            onClose={() => setIsSettingsOpen(false)}
            onOpenAuth={() => setIsAuthOpen(true)}
            currentUser={currentUser}
          />
        )}

        {/* USER AUTHENTICATION MODAL */}
        {isAuthOpen && (
          <AuthModal
            currentUser={currentUser}
            promptMessage={authPromptMessage}
            onClose={() => {
              setIsAuthOpen(false);
              setAuthPromptMessage(null);
            }}
            onUserChange={(u) => {
              setCurrentUser(u);
              if (u && !authService.isGuest() && pendingRoomCode) {
                lobbyService.joinRoom(pendingRoomCode, u.username, u.avatarUrl, u.wardrobe?.dyeColors);
                setCurrentScreen('MULTIPLAYER');
                setPendingRoomCode(null);
                setAuthPromptMessage(null);
              }
            }}
            onSuccessRedirect={(u) => {
              if (pendingRoomCode) {
                lobbyService.joinRoom(pendingRoomCode, u.username, u.avatarUrl, u.wardrobe?.dyeColors);
                setCurrentScreen('MULTIPLAYER');
                setPendingRoomCode(null);
                setAuthPromptMessage(null);
              }
            }}
          />
        )}

        {/* Shareable Link Toast Notification */}
        {shareToast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-slate-900/95 border border-purple-500/60 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 text-white backdrop-blur-xl animate-bounce">
            <div className="min-w-0">
              <span className="text-[10px] text-purple-400 uppercase font-black tracking-wider block">Lobby Room Created!</span>
              <p className="text-xs font-bold truncate">Link copied! Share: <span className="text-amber-300 font-mono">?room={shareToast.roomCode}</span></p>
            </div>
            <button 
              onClick={() => setShareToast(null)}
              className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold shrink-0 cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
