import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Trophy, Clock, ArrowLeft, Camera, 
  Lock, ZoomOut, Award, LogOut
} from 'lucide-react';
import { UserProfile, MemoryCard, Achievement } from '../types/game';
import { authService, INITIAL_ACHIEVEMENTS } from '../utils/authService';
import { soundManager } from '../audio/soundManager';

interface ProfileScreenProps {
  onBackToMenu: () => void;
  onOpenAuth: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBackToMenu,
  onOpenAuth,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'gallery' | 'settings'>('stats');
  
  // Custom Avatar Crop & Zoom Modal
  const [cropperOpen, setCropperOpen] = useState<boolean>(false);
  const [avatarZoom, setAvatarZoom] = useState<number>(1);
  const [selectedAvatarEmoji, setSelectedAvatarEmoji] = useState<string>(currentUser?.avatarUrl || '🌸');

  // Memory Cards & Photo Decorator Modal
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(authService.getMemoryCards());
  const [decoratingCard, setDecoratingCard] = useState<MemoryCard | null>(null);
  const [activeFilter, setActiveFilter] = useState<'normal' | 'retro' | 'dark' | 'neon' | 'bw'>('normal');
  const [cardCaption, setCardCaption] = useState<string>('');
  const [savedDecoratedToast, setSavedDecoratedToast] = useState<boolean>(false);

  // Confirmations
  const [confirmModal, setConfirmModal] = useState<'reset_levels' | 'reset_data' | 'delete_account' | null>(null);
  const [deleteStep, setDeleteStep] = useState<number>(1);

  useEffect(() => {
    return authService.subscribe((u) => {
      setCurrentUser(u);
      setMemoryCards(authService.getMemoryCards());
    });
  }, []);

  const formatPlaytime = (secs: number = 0) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveAvatar = () => {
    soundManager.playPowerup();
    authService.updateProfile({ avatarUrl: selectedAvatarEmoji });
    setCropperOpen(false);
  };

  const handleSaveDecoratedCard = () => {
    if (!decoratingCard) return;
    soundManager.playPowerup();
    authService.updateMemoryCard(decoratingCard.id, {
      filter: activeFilter,
      caption: cardCaption,
    });
    setSavedDecoratedToast(true);
    setTimeout(() => {
      setSavedDecoratedToast(false);
      setDecoratingCard(null);
    }, 1500);
  };

  const handleResetLevels = () => {
    authService.resetLevelUnlocks();
    soundManager.playPowerup();
    setConfirmModal(null);
  };

  const handleResetData = () => {
    authService.resetAllData();
    soundManager.playPowerup();
    setConfirmModal(null);
  };

  const handleDeleteAccount = () => {
    authService.deleteAccount();
    soundManager.playLaneSwitch();
    setConfirmModal(null);
    onBackToMenu();
  };

  const isGuest = !currentUser || authService.isGuest();

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 font-sans select-none overflow-hidden overflow-x-hidden">
      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between px-2.5 md:px-6 py-2 md:py-3 bg-slate-950/90 border-b border-white/10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={onBackToMenu}
            className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
            <span>Menu</span>
          </button>
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <User className="w-4 h-4 md:w-5 md:h-5 text-purple-400 shrink-0" />
            <h2 className="text-xs md:text-base font-black text-white truncate">Player Profile</h2>
          </div>
        </div>

        {isGuest ? (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1 md:px-3.5 md:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 text-white text-[11px] md:text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shrink-0"
          >
            Sign In
          </button>
        ) : (
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <span className="text-[11px] md:text-xs font-mono text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 md:px-2.5 md:py-1 rounded-xl">
              @{currentUser?.username}
            </span>
            <button
              onClick={() => {
                authService.logout();
                soundManager.playLaneSwitch();
                onBackToMenu();
              }}
              className="px-2 py-1 md:px-2.5 md:py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-rose-300 hover:text-white text-[11px] md:text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Not Signed In Banner */}
      {isGuest && (
        <div className="relative z-10 p-2 md:p-3 bg-gradient-to-r from-purple-950 via-slate-900 to-pink-950 border-b border-purple-500/30 text-center flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] md:text-xs text-purple-200">
            Not signed in. Sign in or create an account to save progress and unlock Host Room multiplayer!
          </span>
          <button
            onClick={onOpenAuth}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[11px] md:text-xs font-bold rounded-lg cursor-pointer transition-all"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="relative z-10 px-2.5 md:px-6 pt-2 md:pt-3 flex items-center gap-1.5 md:gap-2 border-b border-white/10 shrink-0 text-[11px] md:text-xs font-bold overflow-x-auto">
        {[
          { id: 'stats', label: 'Overview 📊' },
          { id: 'achievements', label: 'Badges 🏆' },
          { id: 'gallery', label: 'Gallery 📸' },
          { id: 'settings', label: 'Account ⚙️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`py-1.5 px-2.5 md:py-2 md:px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-2.5 md:p-6 max-w-4xl mx-auto w-full space-y-3.5 md:space-y-5 custom-scrollbar">
        {/* TAB 1: OVERVIEW & STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-3 md:space-y-4 animate-fadeIn">
            {/* User Identity Card */}
            <div className="p-3 md:p-5 rounded-2xl md:rounded-3xl bg-slate-900/90 border border-purple-500/30 flex flex-col sm:flex-row items-center gap-3 md:gap-5 shadow-2xl">
              {/* Profile Avatar with Crop & Zoom Trigger */}
              <div className="relative group cursor-pointer" onClick={() => setCropperOpen(true)}>
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-purple-800 to-pink-600 border-2 border-purple-400 flex items-center justify-center text-2xl md:text-4xl shadow-xl overflow-hidden">
                  <span>{currentUser?.avatarUrl || '🌸'}</span>
                </div>
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                  <Camera className="w-4 h-4 md:w-5 md:h-5 text-purple-300" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-base md:text-xl font-black text-white">{currentUser?.username || 'Not Signed In'}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] md:text-xs font-bold">
                    {currentUser?.titleBadge || 'Offline'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  {currentUser?.email && currentUser.preferences.showEmailOnProfile ? currentUser.email : 'Public Profile'}
                </p>

                {/* Earned Badges Row */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {(currentUser?.earnedBadges || ['Newbie', 'Pro Runner']).map((b) => (
                    <span key={b} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-950 border border-white/10 text-amber-300 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setCropperOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Avatar</span>
              </button>
            </div>

            {/* Key Gameplay Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">High Score</span>
                <span className="text-xl font-black font-mono text-white">
                  {(currentUser?.stats.highScore || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Playtime</span>
                <span className="text-base font-black font-mono text-purple-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>{formatPlaytime(currentUser?.playtimeSeconds)}</span>
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Coins</span>
                <span className="text-xl font-black font-mono text-amber-300">
                  {(currentUser?.stats.coins || 0).toLocaleString()}c
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Season 1 Progress</span>
                <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>{currentUser?.stats.completedEpisodes?.length || 1} / 10 Eps</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="space-y-3 animate-fadeIn">
            {INITIAL_ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{ach.icon}</span>
                  <div>
                    <h4 className="text-sm font-black text-white">{ach.title}</h4>
                    <span className="text-xs text-slate-400 block">{ach.description}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-300 block">
                    +{ach.rewardCoins} Coins
                  </span>
                  <span className="text-[10px] font-mono text-purple-300">
                    Badge: {ach.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: STORY GALLERY & MEMORY CARDS */}
        {activeTab === 'gallery' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Unlock high-resolution snapshot cards by clearing key episodes! Open any card to customize with filters and stickers.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {memoryCards.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    c.unlocked
                      ? 'bg-slate-900 border-purple-500/40 shadow-xl'
                      : 'bg-slate-950/40 border-white/5 opacity-50'
                  }`}
                >
                  <div>
                    <div className="w-full h-32 rounded-xl bg-gradient-to-tr from-purple-950 via-slate-900 to-indigo-950 border border-white/10 flex flex-col items-center justify-center text-4xl mb-2 relative overflow-hidden">
                      {c.unlocked ? (
                        <>
                          <span>🌸✨</span>
                          {c.caption && (
                            <span className="absolute bottom-1 px-2 py-0.5 rounded bg-black/75 text-[10px] text-white font-bold max-w-[90%] truncate">
                              "{c.caption}"
                            </span>
                          )}
                        </>
                      ) : (
                        <Lock className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <h4 className="text-xs font-black text-white">{c.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 my-1">{c.description}</p>
                  </div>

                  {c.unlocked ? (
                    <button
                      onClick={() => {
                        setDecoratingCard(c);
                        setActiveFilter(c.filter || 'normal');
                        setCardCaption(c.caption || '');
                      }}
                      className="w-full py-1.5 mt-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Decorate & Save
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 mt-2 block text-center">
                      Unlocked at Episode {c.episodeId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ACCOUNT SETTINGS & RESET ACTIONS */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Profile Privacy & Theme */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Show Email on Profile</span>
                  <span className="text-[10px] text-slate-400">Display your email address to other players</span>
                </div>
                <button
                  onClick={() => {
                    authService.updateProfile({
                      preferences: {
                        ...currentUser!.preferences,
                        showEmailOnProfile: !currentUser?.preferences.showEmailOnProfile,
                      }
                    });
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    currentUser?.preferences.showEmailOnProfile
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentUser?.preferences.showEmailOnProfile ? 'Shown' : 'Hidden'}
                </button>
              </div>
            </div>

            {/* Reset Confirmations */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20 space-y-3">
              <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">
                Progression & Account Management
              </h4>

              {/* Reset All Level Unlocks */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="text-xs font-bold text-white block">Reset All Level Unlocks</span>
                  <span className="text-[10px] text-slate-400">Relock difficulties and episodes back to Episode 1</span>
                </div>
                <button
                  onClick={() => setConfirmModal('reset_levels')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset Levels
                </button>
              </div>

              {/* Reset Data */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <span className="text-xs font-bold text-white block">Reset Data</span>
                  <span className="text-[10px] text-slate-400">Wipe saved high score, crystals, and runner stats</span>
                </div>
                <button
                  onClick={() => setConfirmModal('reset_data')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset Data
                </button>
              </div>

              {/* Delete Account */}
              {!isGuest && (
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-bold text-rose-400 block">Delete Account</span>
                    <span className="text-[10px] text-slate-400">Permanently delete your profile and registered username</span>
                  </div>
                  <button
                    onClick={() => {
                      setDeleteStep(1);
                      setConfirmModal('delete_account');
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Avatar Crop & Zoom Modal */}
      <AnimatePresence>
        {cropperOpen && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-purple-500/40 rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-sm w-full text-center space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <h3 className="text-xs md:text-sm font-black text-white">Crop & Customize Profile Picture</h3>

              {/* Circular Preview Frame */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-purple-400 mx-auto overflow-hidden bg-slate-950 flex items-center justify-center text-4xl md:text-5xl shadow-2xl relative">
                <span style={{ transform: `scale(${avatarZoom})` }} className="transition-transform duration-100">
                  {selectedAvatarEmoji}
                </span>
              </div>

              {/* Zoom Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><ZoomOut className="w-3 h-3" /> Zoom</span>
                  <span>{Math.round(avatarZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.8"
                  step="0.05"
                  value={avatarZoom}
                  onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Emoji Avatar Picker */}
              <div className="flex justify-center gap-2 pt-1">
                {['🌸', '✨', '⚡', '👑', '🔥', '🌙', '💎', '🗡️'].map((em) => (
                  <button
                    key={em}
                    onClick={() => setSelectedAvatarEmoji(em)}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center text-lg cursor-pointer ${
                      selectedAvatarEmoji === em
                        ? 'border-purple-400 bg-purple-900/60 ring-1 ring-purple-400'
                        : 'border-white/10 bg-slate-950/60'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCropperOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvatar}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Save Picture
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmModal && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-rose-500/40 rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-sm w-full text-center space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-2xl mx-auto">
                ⚠️
              </div>

              {confirmModal === 'reset_levels' && (
                <>
                  <h3 className="text-base font-black text-white">Reset All Level Unlocks?</h3>
                  <p className="text-xs text-slate-300">
                    Are you sure? This will lock Medium, Hard, and Pro difficulties until you finish Story Mode again.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">Cancel</button>
                    <button onClick={handleResetLevels} className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl">Yes, Reset</button>
                  </div>
                </>
              )}

              {confirmModal === 'reset_data' && (
                <>
                  <h3 className="text-base font-black text-white">Wipe Saved Game Data?</h3>
                  <p className="text-xs text-slate-300">
                    Are you sure? This will reset all high scores, crystals, and start your runner stats fresh.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">Cancel</button>
                    <button onClick={handleResetData} className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl">Yes, Wipe Data</button>
                  </div>
                </>
              )}

              {confirmModal === 'delete_account' && (
                <>
                  <h3 className="text-base font-black text-rose-400">
                    {deleteStep === 1 ? 'Delete Player Account?' : 'Are you sure you want to permanently delete your account?'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {deleteStep === 1 
                      ? 'This will remove your username and profile from the database.'
                      : 'This action CANNOT be undone! Your high score, wardrobe items, and username will be erased.'}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl">Cancel</button>
                    {deleteStep === 1 ? (
                      <button onClick={() => setDeleteStep(2)} className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl">Continue...</button>
                    ) : (
                      <button onClick={handleDeleteAccount} className="flex-1 py-2 bg-rose-700 text-white text-xs font-bold rounded-xl">Permanently Delete</button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
