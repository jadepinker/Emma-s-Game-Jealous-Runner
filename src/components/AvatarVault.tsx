import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Sparkles, Palette, Check, ArrowLeft, Gem, 
  Coins, Lock, Shield, Eye, Shirt, Crown, Flame, Zap
} from 'lucide-react';
import { WardrobeItem, DyeColors, DEFAULT_DYE_COLORS, UserProfile } from '../types/game';
import { authService } from '../utils/authService';
import { soundManager } from '../audio/soundManager';

interface AvatarVaultProps {
  onBackToMenu: () => void;
}

export const WARDROBE_CATALOG: WardrobeItem[] = [
  // Outfits
  { id: 'basic_tee', name: 'Basic Tee & Jeans', category: 'outfit', rarity: 'common', price: 0, currency: 'coins', icon: '👕', description: 'Comfortable casual starter outfit.' },
  { id: 'casual_hoodie', name: 'Casual Hoodie', category: 'outfit', rarity: 'common', price: 250, currency: 'coins', icon: '🧥', description: 'Cozy streetwear for running under chilly skies.' },
  { id: 'school_uniform', name: 'School Uniform', category: 'outfit', rarity: 'common', price: 300, currency: 'coins', icon: '🎒', description: 'Classic pleated skirt and neat blazer.' },
  { id: 'streetwear_jacket', name: 'Streetwear Jacket', category: 'outfit', rarity: 'rare', price: 550, currency: 'coins', icon: '🥼', description: 'Neon accents and reflective trim.' },
  { id: 'enchanted_robes', name: 'Enchanted Robes', category: 'outfit', rarity: 'rare', price: 700, currency: 'coins', icon: '👘', description: 'Silken robes that pulse with arcane light.' },
  { id: 'royal_armor', name: 'Royal Armor', category: 'outfit', rarity: 'epic', price: 1000, currency: 'coins', icon: '🛡️', description: 'Gilded plate armor crafted for champions.' },
  { id: 'dark_costume', name: 'Dark Enchantress Costume', category: 'outfit', rarity: 'legendary', price: 1500, currency: 'coins', icon: '😈', description: 'Emma’s ultimate corrupted jealous attire.' },

  // Headwear
  { id: 'cat_ears', name: 'Cat Ears', category: 'headwear', rarity: 'common', price: 150, currency: 'coins', icon: '🐱', description: 'Cute playful feline headband.' },
  { id: 'neon_headphones', name: 'Neon Headphones', category: 'headwear', rarity: 'rare', price: 350, currency: 'coins', icon: '🎧', description: 'Pumping bass directly into your run!' },
  { id: 'wizard_hat', name: 'Wizard Hat', category: 'headwear', rarity: 'rare', price: 450, currency: 'coins', icon: '🧙‍♀️', description: 'Pointy celestial sorceress hat.' },
  { id: 'golden_crown', name: 'Golden Crown', category: 'headwear', rarity: 'epic', price: 800, currency: 'coins', icon: '👑', description: 'Fit for the ruler of the ancient kingdom.' },

  // Eyewear
  { id: 'cute_bandages', name: 'Cute Bandages', category: 'eyewear', rarity: 'common', price: 100, currency: 'coins', icon: '🩹', description: 'Cheek adhesive showing you never give up.' },
  { id: 'star_glasses', name: 'Star Glasses', category: 'eyewear', rarity: 'rare', price: 250, currency: 'coins', icon: '⭐', description: 'Sparkling star-shaped frames.' },
  { id: 'sleek_visor', name: 'Sleek Visor', category: 'eyewear', rarity: 'rare', price: 400, currency: 'coins', icon: '🥽', description: 'Futuristic HUD display visor.' },
  { id: 'mysterious_mask', name: 'Mysterious Mask', category: 'eyewear', rarity: 'epic', price: 650, currency: 'coins', icon: '🎭', description: 'Conceals your expression from rivals.' },

  // Motion Trails & Auras
  { id: 'sparkle_aura', name: 'Sparkle Aura', category: 'aura', rarity: 'common', price: 200, currency: 'coins', icon: '✨', description: 'Glittering stardust surrounding Emma.' },
  { id: 'floating_hearts', name: 'Floating Hearts', category: 'aura', rarity: 'rare', price: 500, currency: 'coins', icon: '💖', description: 'Cute floating pastel heart embers.' },
  { id: 'rainbow_dust', name: 'Rainbow Dust Trail', category: 'aura', rarity: 'rare', price: 600, currency: 'coins', icon: '🌈', description: 'Vibrant chromatic sprint particles.' },
  { id: 'electric_lightning', name: 'Electric Lightning Trail', category: 'aura', rarity: 'epic', price: 850, currency: 'coins', icon: '⚡', description: 'Crackling blue voltage with each step.' },
  { id: 'angel_wings', name: 'Angel Wings', category: 'aura', rarity: 'epic', price: 900, currency: 'coins', icon: '🪽', description: 'Pure white radiant feathered wings.' },
  { id: 'dark_shadow', name: 'Dark Shadow Trail', category: 'aura', rarity: 'legendary', price: 1200, currency: 'coins', icon: '🌑', description: 'Ominous pitch-black smoke trail.' },
  { id: 'glitch_artifact', name: 'Glitch Artifact Trail', category: 'aura', rarity: 'legendary', price: 1200, currency: 'coins', icon: '👾', description: 'Reality-bending glitch distortions.' },
];

export const AvatarVault: React.FC<AvatarVaultProps> = ({ onBackToMenu }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'outfit' | 'headwear' | 'eyewear' | 'aura'>('all');
  const [activeTab, setActiveTab] = useState<'shop' | 'dye'>('shop');
  const [dyeColors, setDyeColors] = useState<DyeColors>(currentUser?.wardrobe?.dyeColors || DEFAULT_DYE_COLORS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    return authService.subscribe((u) => {
      setCurrentUser(u);
      if (u?.wardrobe?.dyeColors) setDyeColors(u.wardrobe.dyeColors);
    });
  }, []);

  const coins = currentUser?.stats.coins || 0;
  const gems = currentUser?.stats.gems || 0;
  const equipped: UserProfile['wardrobe'] = currentUser?.wardrobe || {
    equippedOutfit: 'basic_tee',
    ownedItems: ['basic_tee'],
    dyeColors: DEFAULT_DYE_COLORS,
  };
  const owned = equipped.ownedItems || ['basic_tee'];

  const handleBuy = (item: WardrobeItem) => {
    if (owned.includes(item.id)) return;

    if (coins < item.price) {
      soundManager.playCrash();
      showToast(`Not enough Coins! Need ${item.price - coins} more.`);
      return;
    }

    soundManager.playPowerup();
    authService.addCoins(-item.price);
    const updatedOwned = [...owned, item.id];
    authService.updateProfile({
      wardrobe: {
        ...equipped,
        ownedItems: updatedOwned,
      }
    });
    showToast(`Purchased ${item.name}!`);
  };

  const handleEquip = (item: WardrobeItem) => {
    soundManager.playLaneSwitch();
    const updated: UserProfile['wardrobe'] = { ...equipped };

    if (item.category === 'outfit') updated.equippedOutfit = item.id;
    else if (item.category === 'headwear') updated.equippedHeadwear = equipped.equippedHeadwear === item.id ? undefined : item.id;
    else if (item.category === 'eyewear') updated.equippedEyewear = equipped.equippedEyewear === item.id ? undefined : item.id;
    else if (item.category === 'aura') updated.equippedAura = equipped.equippedAura === item.id ? undefined : item.id;

    authService.updateProfile({
      wardrobe: updated,
    });
    showToast(`Equipped ${item.name}!`);
  };

  const handleApplyDye = () => {
    soundManager.playPowerup();
    authService.updateProfile({
      wardrobe: {
        ...equipped,
        dyeColors,
      }
    });
    showToast('Applied custom RGB color dyes to Emma!');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2200);
  };

  const filteredItems = selectedCategory === 'all' 
    ? WARDROBE_CATALOG 
    : WARDROBE_CATALOG.filter(i => i.category === selectedCategory);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 font-sans select-none overflow-hidden overflow-x-hidden">
      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between px-2.5 sm:px-6 py-2 sm:py-3 bg-slate-950/90 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={onBackToMenu}
            className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-[11px] md:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
            <span>Menu</span>
          </button>
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-amber-400 shrink-0" />
            <h2 className="text-xs sm:text-base font-black text-white truncate">Avatar Vault & Dye</h2>
          </div>
        </div>

        {/* Currency Display */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono font-bold text-[10px] md:text-xs">
            <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
            <span>{coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-xl bg-pink-950/60 border border-pink-500/40 text-pink-300 font-mono font-bold text-[10px] md:text-xs">
            <Gem className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-400" />
            <span>{gems.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Mode Tabs: Wardrobe Shop vs RGB Dye Station */}
      <div className="relative z-10 px-2.5 sm:px-6 pt-2 md:pt-3 flex items-center gap-1.5 md:gap-2 border-b border-white/10 shrink-0">
        <button
          onClick={() => setActiveTab('shop')}
          className={`py-1.5 px-2.5 md:py-2 md:px-4 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>Wardrobe Shop</span>
        </button>
        <button
          onClick={() => setActiveTab('dye')}
          className={`py-1.5 px-2.5 md:py-2 md:px-4 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'dye'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>RGB Dye Station</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto md:overflow-hidden p-2 sm:p-5 flex flex-col md:flex-row gap-2.5 md:gap-5">
        {/* Left Side: Live Character Avatar Preview with Equipped Gear & Dyes */}
        <div className="w-full md:w-72 bg-slate-900/90 border border-purple-500/30 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-2xl flex flex-col items-center justify-between shrink-0">
          <div className="w-full text-center">
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-purple-400 block mb-0.5 md:mb-1">
              Live Avatar Preview
            </span>
            <h3 className="text-xs md:text-sm font-black text-white">Emma's Active Look</h3>
          </div>

          {/* Styled Avatar Figure */}
          <div 
            style={{ boxShadow: `0 0 35px ${dyeColors.aura}66` }}
            className="w-24 h-28 md:w-40 md:h-52 rounded-2xl md:rounded-3xl bg-slate-950 border-2 border-purple-400/40 flex flex-col items-center justify-center p-2 md:p-3 relative my-1.5 md:my-3 overflow-hidden"
          >
            {/* Motion Aura glow */}
            <div 
              style={{ backgroundColor: dyeColors.aura }}
              className="absolute inset-0 opacity-20 filter blur-xl animate-pulse pointer-events-none" 
            />

            {/* Head & Hair */}
            <div 
              style={{ color: dyeColors.hair }}
              className="text-2xl md:text-4xl mb-0.5 md:mb-1 filter drop-shadow-md relative z-10"
            >
              {equipped.equippedHeadwear === 'golden_crown' ? '👑' :
               equipped.equippedHeadwear === 'cat_ears' ? '🐱' :
               equipped.equippedHeadwear === 'wizard_hat' ? '🧙‍♀️' : '🌸'}
            </div>

            {/* Glasses / Eyewear */}
            {equipped.equippedEyewear && (
              <span className="text-sm md:text-xl -mt-1 md:-mt-2 z-20">
                {equipped.equippedEyewear === 'star_glasses' ? '⭐' :
                 equipped.equippedEyewear === 'mysterious_mask' ? '🎭' : '👓'}
              </span>
            )}

            {/* Torso & Shirt with dynamic Dye Color */}
            <div 
              style={{ backgroundColor: dyeColors.shirt }}
              className="w-10 h-8 md:w-16 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center text-white text-[10px] md:text-xs font-bold shadow-md relative z-10 mt-0.5 md:mt-1"
            >
              {equipped.equippedOutfit === 'dark_costume' ? '😈' :
               equipped.equippedOutfit === 'royal_armor' ? '🛡️' : '👕'}
            </div>

            {/* Skirt / Pants with dynamic Dye Color */}
            <div 
              style={{ backgroundColor: dyeColors.skirt }}
              className="w-9 h-5 md:w-14 md:h-8 rounded-b-lg shadow-inner relative z-10" 
            />

            {/* Aura icon */}
            {equipped.equippedAura && (
              <span className="absolute bottom-1 md:bottom-2 text-[9px] md:text-xs text-amber-300 font-mono animate-bounce truncate max-w-full px-1">
                ✨ {equipped.equippedAura.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>

          <div className="w-full text-center space-y-0.5 md:space-y-1">
            <span className="text-[10px] md:text-[11px] font-bold text-slate-300 block">
              Outfit: {equipped.equippedOutfit.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-500">
              Owned Gear: {owned.length} items
            </span>
          </div>
        </div>

        {/* Right Side: Tab View */}
        {activeTab === 'shop' ? (
          <div className="flex-1 bg-slate-900/90 border border-purple-500/30 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-2xl flex flex-col md:overflow-hidden">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 pb-2 md:pb-3 border-b border-white/10 overflow-x-auto shrink-0 text-[11px] md:text-xs font-bold">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'outfit', label: 'Outfits 👕' },
                { id: 'headwear', label: 'Headwear 👑' },
                { id: 'eyewear', label: 'Eyewear 👓' },
                { id: 'aura', label: 'Auras & Trails ✨' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === c.id
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto my-2 md:my-3 pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 custom-scrollbar">
              {filteredItems.map((item) => {
                const isOwned = owned.includes(item.id);
                const isEquipped = 
                  item.id === equipped.equippedOutfit ||
                  item.id === equipped.equippedHeadwear ||
                  item.id === equipped.equippedEyewear ||
                  item.id === equipped.equippedAura;

                const rarityBorder = 
                  item.rarity === 'legendary' ? 'border-amber-400 bg-amber-950/20 shadow-amber-500/20' :
                  item.rarity === 'epic' ? 'border-purple-400 bg-purple-950/20' :
                  item.rarity === 'rare' ? 'border-sky-400 bg-sky-950/20' : 'border-white/10 bg-slate-950/70';

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border ${rarityBorder} shadow-lg flex flex-col justify-between transition-all`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl md:text-2xl">{item.icon}</span>
                        <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {item.rarity}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 leading-snug my-1">{item.description}</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      {isOwned ? (
                        <button
                          onClick={() => handleEquip(item)}
                          className={`w-full py-1.5 rounded-xl text-[11px] md:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isEquipped ? <Check className="w-3.5 h-3.5" /> : null}
                          <span>{isEquipped ? 'Equipped' : 'Equip'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-[11px] md:text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/30 cursor-pointer active:scale-95"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Buy for {item.price}c</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* LIVE RGB COLOR DYE STATION */
          <div className="flex-1 bg-slate-900/90 border border-pink-500/30 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-pink-400" />
                  <h3 className="text-sm font-black text-white">Live RGB Color Dye Station</h3>
                </div>
                <span className="text-xs text-slate-400">
                  Select custom HEX / RGB colors to dye Emma's shirt, skirt, hair, and aura in real time!
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shirt Dye Picker */}
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Shirt Dye Color</span>
                    <span className="text-[10px] text-slate-400 font-mono">{dyeColors.shirt}</span>
                  </div>
                  <input
                    type="color"
                    value={dyeColors.shirt}
                    onChange={(e) => setDyeColors({ ...dyeColors, shirt: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-none"
                  />
                </div>

                {/* Skirt Dye Picker */}
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Skirt / Jeans Dye</span>
                    <span className="text-[10px] text-slate-400 font-mono">{dyeColors.skirt}</span>
                  </div>
                  <input
                    type="color"
                    value={dyeColors.skirt}
                    onChange={(e) => setDyeColors({ ...dyeColors, skirt: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-none"
                  />
                </div>

                {/* Hair Dye Picker */}
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Hair Dye Tint</span>
                    <span className="text-[10px] text-slate-400 font-mono">{dyeColors.hair}</span>
                  </div>
                  <input
                    type="color"
                    value={dyeColors.hair}
                    onChange={(e) => setDyeColors({ ...dyeColors, hair: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-none"
                  />
                </div>

                {/* Aura Glow Color */}
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Motion Aura Glow</span>
                    <span className="text-[10px] text-slate-400 font-mono">{dyeColors.aura}</span>
                  </div>
                  <input
                    type="color"
                    value={dyeColors.aura}
                    onChange={(e) => setDyeColors({ ...dyeColors, aura: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => setDyeColors(DEFAULT_DYE_COLORS)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset Colors
              </button>

              <button
                onClick={handleApplyDye}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-900/40 cursor-pointer active:scale-95"
              >
                Save & Apply Dyes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Toast */}
      {toastMsg && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2 bg-purple-900/90 border border-purple-400 text-white text-xs font-bold rounded-2xl shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}
    </div>
  );
};
