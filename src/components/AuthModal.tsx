import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User, KeyRound, Mail, LogIn, UserPlus, LogOut, CheckCircle, Trophy, Gem } from 'lucide-react';
import { authService } from '../utils/authService';
import { UserProfile } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface AuthModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onUserChange?: (user: UserProfile | null) => void;
  promptMessage?: string | null;
  onSuccessRedirect?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onClose,
  onUserChange,
  promptMessage,
  onSuccessRedirect,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(currentUser ? 'login' : 'login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🌸');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const avatars = ['🌸', '✨', '⚡', '👑', '🔥', '🌙', '💎', '🗡️'];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const res = authService.login(identifier, password);
    if (res.success && res.user) {
      soundManager.playPowerup();
      setStatusMsg({ text: res.message, isError: false });
      if (onUserChange) onUserChange(res.user);
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect && res.user) onSuccessRedirect(res.user);
      }, 600);
    } else {
      soundManager.playCrash();
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const res = authService.register(identifier, password, email || undefined);
    if (res.success && res.user) {
      if (selectedAvatar) {
        authService.updateProfile({ avatarUrl: selectedAvatar });
      }
      soundManager.playPowerup();
      setStatusMsg({ text: res.message, isError: false });
      const current = authService.getCurrentUser();
      if (onUserChange) onUserChange(current);
      setTimeout(() => {
        onClose();
        if (onSuccessRedirect && current) onSuccessRedirect(current);
      }, 600);
    } else {
      soundManager.playCrash();
      setStatusMsg({ text: res.message, isError: true });
    }
  };

  const handleLogout = () => {
    authService.logout();
    soundManager.playLaneSwitch();
    if (onUserChange) onUserChange(null);
    setStatusMsg({ text: 'Signed out successfully.', isError: false });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 md:p-5 bg-slate-950/85 backdrop-blur-md font-sans select-none overflow-hidden overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-2xl md:rounded-3xl p-3.5 md:p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {currentUser ? 'Player Account' : 'User Authentication'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {currentUser ? `Signed in as @${currentUser.username}` : 'Sign in or create account with Username or Email'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Message Banner (e.g. Lobby invite / Host prompt) */}
        {promptMessage && (
          <div className="mt-3 p-3 rounded-2xl bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-purple-950/50">
            <span className="text-base">🎮</span>
            <span className="flex-1">{promptMessage}</span>
          </div>
        )}

        {/* Status Message Banner */}
        {statusMsg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMsg.isError
                ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Logged in state view */}
        {currentUser ? (
          <div className="space-y-4 my-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/50 border border-purple-400/50 flex items-center justify-center text-3xl shadow-inner">
                {currentUser.avatarUrl || '🌸'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-base truncate">
                    {currentUser.username}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                    {currentUser.role || 'Player'}
                  </span>
                </div>
                {currentUser.email && (
                  <span className="text-xs text-slate-400 block truncate">
                    {currentUser.email}
                  </span>
                )}
                <span className="text-[10px] text-slate-500">
                  Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Account Game Stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>High Score</span>
                </div>
                <span className="text-base font-black text-white font-mono">
                  {(currentUser.stats?.highScore || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Gem className="w-3.5 h-3.5 text-pink-400" />
                  <span>Total Coins</span>
                </div>
                <span className="text-base font-black text-amber-300 font-mono">
                  {(currentUser.stats?.coins || 0).toLocaleString()}c
                </span>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Not logged in: tabs for Login vs Register */
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 border border-white/10 rounded-2xl">
              <button
                onClick={() => {
                  soundManager.playLaneSwitch();
                  setMode('login');
                  setStatusMsg(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playLaneSwitch();
                  setMode('register');
                  setStatusMsg(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-400" />
                    <span>Username or Email</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. Jade or player@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-purple-400" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>SIGN IN</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-400" />
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Choose a player username"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-pink-400" />
                    <span>Email (Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@example.com (optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 4 chars)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* Avatar select */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 mb-1 block">
                    Profile Icon
                  </label>
                  <div className="flex gap-2">
                    {avatars.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center text-lg transition-all cursor-pointer ${
                          selectedAvatar === av
                            ? 'border-purple-400 bg-purple-900/60 ring-2 ring-purple-400 scale-105'
                            : 'border-white/10 bg-slate-950/60 hover:bg-slate-800'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>CREATE ACCOUNT & SAVE PROGRESS</span>
                </button>
              </form>
            )}

            <div className="pt-1 text-center">
              <span className="text-[11px] text-slate-400">
                Sign in or create an account to save progress and unlock Host Room multiplayer.
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
