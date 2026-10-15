import React from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Shield, Zap, Check, ArrowRight } from 'lucide-react';
import { UpgradeLevels } from '../types/game';
import { soundManager } from '../audio/soundManager';
import emmaShyImg from '../assets/story/emma_walk.png';
import emmaEvilImg from '../assets/story/emma_evil_after.png';
import strangerArtImg from '../assets/stranger/stranger_art.png';

interface UpgradeShopProps {
  totalCrystals: number;
  upgrades: UpgradeLevels;
  onUpdateUpgrades: (newUpgrades: UpgradeLevels, remainingCrystals: number) => void;
  onClose: () => void;
}

export const UpgradeShop: React.FC<UpgradeShopProps> = ({
  totalCrystals,
  upgrades,
  onUpdateUpgrades,
  onClose,
}) => {
  const getUpgradeCost = (currentLevel: number) => {
    return currentLevel * 30;
  };

  const buyUpgrade = (key: 'magnetDuration' | 'shieldStrength' | 'boostDuration' | 'rageGain') => {
    const currentLvl = upgrades[key];
    if (currentLvl >= 5) return;
    const cost = getUpgradeCost(currentLvl);
    if (totalCrystals >= cost) {
      soundManager.playPowerup();
      const updated = {
        ...upgrades,
        [key]: currentLvl + 1
      };
      onUpdateUpgrades(updated, totalCrystals - cost);
    }
  };

  const selectSkin = (skin: 'unknown' | 'shy' | 'evil') => {
    soundManager.playLaneSwitch();
    onUpdateUpgrades({ ...upgrades, selectedSkin: skin }, totalCrystals);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-lg w-full bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-black text-white tracking-tight">Dark Vault & Upgrades</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close upgrades shop"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency balance display */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between mb-5">
          <span className="text-xs uppercase font-bold text-slate-400">Your Dark Shards</span>
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-black text-lg tabular-nums">
            <span>💎</span>
            <span>{totalCrystals}</span>
          </div>
        </div>

        {/* Character Skin Selection */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Choose Runner Character
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Cute Stranger Girl */}
            <button
              onClick={() => selectSkin('unknown')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                upgrades.selectedSkin === 'unknown'
                  ? 'border-pink-400 bg-pink-950/50 shadow-lg shadow-pink-900/40 ring-1 ring-pink-400'
                  : 'border-white/10 bg-slate-950/40 hover:border-white/20'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-pink-950/80 border border-pink-400/40 flex items-center justify-center overflow-hidden">
                <img
                  src={strangerArtImg}
                  alt="Stranger Art"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-full">
                <span className="text-xs font-bold text-white block truncate">Stranger</span>
                <span className="text-[10px] text-pink-400 font-semibold">Hero</span>
              </div>
            </button>

            {/* Shy Emma */}
            <button
              onClick={() => selectSkin('shy')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                upgrades.selectedSkin === 'shy'
                  ? 'border-teal-400 bg-teal-950/50 shadow-lg shadow-teal-900/40 ring-1 ring-teal-400'
                  : 'border-white/10 bg-slate-950/40 hover:border-white/20'
              }`}
            >
              <img
                src={emmaShyImg}
                alt="Shy Emma"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="w-full">
                <span className="text-xs font-bold text-white block truncate">Shy Emma</span>
                <span className="text-[10px] text-teal-400 font-semibold">Timid</span>
              </div>
            </button>

            {/* Evil Emma */}
            <button
              onClick={() => selectSkin('evil')}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
                upgrades.selectedSkin === 'evil'
                  ? 'border-purple-500 bg-purple-950/50 shadow-lg shadow-purple-900/40 ring-1 ring-purple-500'
                  : 'border-white/10 bg-slate-950/40 hover:border-white/20'
              }`}
            >
              <img
                src={emmaEvilImg}
                alt="Evil Emma"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="w-full">
                <span className="text-xs font-bold text-white block truncate">Evil Emma</span>
                <span className="text-[10px] text-purple-400 font-semibold">Villain</span>
              </div>
            </button>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Power-up Enhancements
          </h3>

          {/* Magnet Duration */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-500/40 flex items-center justify-center text-lg">
                🧲
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Dark Magnet</span>
                <span className="text-xs text-slate-400">
                  Lvl {upgrades.magnetDuration}/5 · +{upgrades.magnetDuration * 2}s duration
                </span>
              </div>
            </div>

            {upgrades.magnetDuration < 5 ? (
              <button
                disabled={totalCrystals < getUpgradeCost(upgrades.magnetDuration)}
                onClick={() => buyUpgrade('magnetDuration')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer"
              >
                💎 {getUpgradeCost(upgrades.magnetDuration)}
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-400">MAX</span>
            )}
          </div>

          {/* Shield Durability */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-lg">
                🛡️
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Shadow Shield</span>
                <span className="text-xs text-slate-400">
                  Lvl {upgrades.shieldStrength}/5 · {upgrades.shieldStrength >= 2 ? 'Starts run with shield!' : 'Absorbs 1 hit'}
                </span>
              </div>
            </div>

            {upgrades.shieldStrength < 5 ? (
              <button
                disabled={totalCrystals < getUpgradeCost(upgrades.shieldStrength)}
                onClick={() => buyUpgrade('shieldStrength')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer"
              >
                💎 {getUpgradeCost(upgrades.shieldStrength)}
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-400">MAX</span>
            )}
          </div>

          {/* Dark Frenzy Booster */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-950 border border-fuchsia-500/40 flex items-center justify-center text-lg">
                ⚡
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Frenzy Surge</span>
                <span className="text-xs text-slate-400">
                  Lvl {upgrades.boostDuration}/5 · +{(upgrades.boostDuration * 1.5).toFixed(1)}s boost duration
                </span>
              </div>
            </div>

            {upgrades.boostDuration < 5 ? (
              <button
                disabled={totalCrystals < getUpgradeCost(upgrades.boostDuration)}
                onClick={() => buyUpgrade('boostDuration')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer"
              >
                💎 {getUpgradeCost(upgrades.boostDuration)}
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-400">MAX</span>
            )}
          </div>

          {/* Rage Meter Gain */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Jealous Fury Rate</span>
                <span className="text-xs text-slate-400">
                  Lvl {upgrades.rageGain}/5 · +{upgrades.rageGain * 25}% rage per shard
                </span>
              </div>
            </div>

            {upgrades.rageGain < 5 ? (
              <button
                disabled={totalCrystals < getUpgradeCost(upgrades.rageGain)}
                onClick={() => buyUpgrade('rageGain')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all cursor-pointer"
              >
                💎 {getUpgradeCost(upgrades.rageGain)}
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-400">MAX</span>
            )}
          </div>
        </div>

        {/* Back to Game */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-white text-slate-950 font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
        >
          Return to Game
        </button>
      </motion.div>
    </div>
  );
};
