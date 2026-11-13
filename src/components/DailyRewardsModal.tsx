import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Award, Sparkles, X, Check, Coins, RotateCw, 
  CheckCircle2, Flame, Gift
} from 'lucide-react';
import { authService } from '../utils/authService';
import { DailyQuest, UserProfile } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface DailyRewardsModalProps {
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({ onClose }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'calendar' | 'wheel' | 'quests'>('calendar');
  const [quests, setQuests] = useState<DailyQuest[]>(authService.getQuests());

  // Wheel State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  const streakDays = currentUser?.loginStreak?.days || 1;

  const calendarDays = [
    { day: 1, reward: '50 Coins', coins: 50 },
    { day: 2, reward: '100 Coins', coins: 100 },
    { day: 3, reward: '200 Coins + Badge', coins: 200, badge: 'Pro Runner' },
    { day: 4, reward: '250 Coins', coins: 250 },
    { day: 5, reward: '300 Coins', coins: 300 },
    { day: 6, reward: '350 Coins', coins: 350 },
    { day: 7, reward: '500 Coins + Champion Badge', coins: 500, badge: 'Daily Champion' },
  ];

  const handleClaimQuest = (questId: string) => {
    soundManager.playPowerup();
    authService.claimQuest(questId);
    setQuests([...authService.getQuests()]);
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    soundManager.playLaneSwitch();

    const randomDeg = Math.floor(Math.random() * 360) + 1440; // 4 full rotations + random
    setWheelRotation(prev => prev + randomDeg);

    setTimeout(() => {
      setIsSpinning(false);
      const prizes = [
        { label: '50 Coins', coins: 50 },
        { label: '150 Coins', coins: 150 },
        { label: '300 Coins', coins: 300 },
        { label: 'Rare Hair Dye Pack', coins: 200 },
      ];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      setWonPrize(prize.label);
      authService.addCoins(prize.coins);
      soundManager.playPowerup();
    }, 3200);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md font-sans select-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-lg w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Daily Rewards & Fortune</h2>
              <span className="text-[11px] text-slate-400">Login streaks, lucky spins & quests</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-white/10 rounded-2xl my-3 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'calendar' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            7-Day Streak 🔥
          </button>
          <button
            onClick={() => setActiveTab('wheel')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'wheel' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lucky Wheel 🎡
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'quests' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Quests 📋
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 my-1 custom-scrollbar">
          {/* TAB 1: 7-DAY LOGIN CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3 bg-slate-950/70 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">
                    Current Login Streak: <strong className="text-amber-400">{streakDays} Day(s)</strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Resets if a day is missed</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {calendarDays.map((item) => {
                  const isClaimed = item.day < streakDays;
                  const isCurrent = item.day === streakDays;

                  return (
                    <div
                      key={item.day}
                      className={`p-3 rounded-2xl border text-center flex flex-col justify-between ${
                        item.day === 7 ? 'sm:col-span-2 bg-gradient-to-br from-amber-950/80 to-purple-950/80 border-amber-400/50' :
                        isCurrent ? 'border-amber-400 bg-amber-950/50 ring-1 ring-amber-400' :
                        isClaimed ? 'border-emerald-500/40 bg-slate-950/60 opacity-60' : 'border-white/10 bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">Day {item.day}</span>
                        {isClaimed && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-xl my-1">{item.day === 7 ? '👑' : '🪙'}</span>
                      <div>
                        <span className="text-xs font-black text-white block">{item.reward}</span>
                        {item.badge && (
                          <span className="text-[9px] text-amber-300 font-mono block mt-0.5">
                            +{item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LUCKY SPIN WHEEL */}
          {activeTab === 'wheel' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-fadeIn">
              {/* Spinning Wheel Graphic */}
              <div className="relative w-44 h-44 rounded-full border-4 border-amber-400 shadow-2xl flex items-center justify-center overflow-hidden bg-slate-950">
                <div
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning ? 'transform 3.2s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
                  }}
                  className="w-full h-full rounded-full grid grid-cols-2 grid-rows-2"
                >
                  <div className="bg-rose-900/60 border border-white/10 flex items-center justify-center text-xs font-black text-white">50c</div>
                  <div className="bg-purple-900/60 border border-white/10 flex items-center justify-center text-xs font-black text-amber-300">150c</div>
                  <div className="bg-amber-900/60 border border-white/10 flex items-center justify-center text-xs font-black text-white">300c</div>
                  <div className="bg-emerald-900/60 border border-white/10 flex items-center justify-center text-xs font-black text-pink-300">Dye Pack</div>
                </div>
                <div className="absolute w-8 h-8 rounded-full bg-white border-2 border-slate-900 shadow-xl flex items-center justify-center text-xs">
                  🎯
                </div>
              </div>

              {wonPrize && (
                <div className="px-4 py-2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-2xl animate-bounce">
                  🎉 You won: {wonPrize}! Added to your Vault.
                </div>
              )}

              <button
                disabled={isSpinning}
                onClick={handleSpinWheel}
                className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  isSpinning
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-xl shadow-amber-900/40 active:scale-95'
                }`}
              >
                {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
              </button>
            </div>
          )}

          {/* TAB 3: DAILY QUESTS */}
          {activeTab === 'quests' && (
            <div className="space-y-3 animate-fadeIn">
              {quests.map((q) => {
                const pct = Math.min(100, Math.round((q.progress / q.target) * 100));

                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-white">{q.title}</h4>
                        <span className="text-[11px] text-slate-400">{q.description}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        +{q.rewardCoins}c
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Progress: {q.progress} / {q.target}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full bg-amber-500 transition-all duration-300" />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      {q.claimed ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Claimed</span>
                        </span>
                      ) : (
                        <button
                          disabled={!q.completed}
                          onClick={() => handleClaimQuest(q.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            q.completed
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {q.completed ? 'Claim Reward' : 'In Progress'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
