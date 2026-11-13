import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X, Plus, Play, Music, Camera, Clock, Check, Eye } from 'lucide-react';
import { authService } from '../utils/authService';
import { soundManager } from '../audio/soundManager';

interface CreateStoryModalProps {
  onClose: () => void;
  onTestPlay?: (storyData: any) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onTestPlay }) => {
  const [title, setTitle] = useState('My Jealous Tale');
  const [bgScene, setBgScene] = useState<'castle' | 'village' | 'lair' | 'forest'>('forest');
  const [bgTrack, setBgTrack] = useState<'spooky' | 'upbeat' | 'battle'>('spooky');
  const [transition, setTransition] = useState<'fade' | 'glitch' | 'flash'>('fade');
  const [hasTimedChoice, setHasTimedChoice] = useState<boolean>(true);
  const [dialogueLines, setDialogueLines] = useState<Array<{ speaker: string; text: string; emotion: string }>>([
    { speaker: 'Emma [Jealous]', text: 'The ancient wand should have been mine!', emotion: 'jealous' },
    { speaker: 'The Stranger [Scared]', text: 'Please calm down, Emma!', emotion: 'scared' },
  ]);
  const [newLineText, setNewLineText] = useState('');
  const [newSpeaker, setNewSpeaker] = useState('Emma [Angry]');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddLine = () => {
    if (!newLineText.trim()) return;
    setDialogueLines([...dialogueLines, { speaker: newSpeaker, text: newLineText.trim(), emotion: 'shocked' }]);
    setNewLineText('');
    soundManager.playLaneSwitch();
  };

  const handleSaveStory = () => {
    soundManager.playPowerup();
    authService.addCoins(200);
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const badges = currentUser.earnedBadges || [];
      if (!badges.includes('Story Creator')) {
        authService.updateProfile({
          earnedBadges: [...badges, 'Story Creator'],
          titleBadge: 'Story Creator',
        });
      }
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md font-sans select-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-w-xl w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Expanded Story Creator Tools</h2>
              <span className="text-[11px] text-slate-400">Design custom chapters, dialogue & timed choices</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="flex-1 overflow-y-auto pr-1 my-3 space-y-4 custom-scrollbar text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Story Chapter Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold"
            />
          </div>

          {/* Background Scene Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Background Scene</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'forest', label: 'Enchanted Forest 🌲' },
                { id: 'castle', label: 'Haunted Castle 🏰' },
                { id: 'village', label: 'Sunny Village 🏡' },
                { id: 'lair', label: 'Dark Enchantress Lair 🌋' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBgScene(b.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    bgScene === b.id
                      ? 'border-purple-400 bg-purple-950/60 text-white font-bold'
                      : 'border-white/10 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* BGM & Camera Transition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">BGM Audio Track</label>
              <select
                value={bgTrack}
                onChange={(e) => setBgTrack(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
              >
                <option value="spooky">Spooky / Mystery</option>
                <option value="upbeat">Upbeat / Adventure</option>
                <option value="battle">Action / Battle Pace</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Scene Camera Transition</label>
              <select
                value={transition}
                onChange={(e) => setTransition(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white"
              >
                <option value="fade">Fade to Black</option>
                <option value="glitch">Glitch Distortion Effect</option>
                <option value="flash">Flash of Light</option>
              </select>
            </div>
          </div>

          {/* Timed Dialogue Choice Option */}
          <div className="p-3 bg-slate-950/70 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-bold text-white block">5-Second Timed Dialogue Choice</span>
                <span className="text-[10px] text-slate-400">High-stakes countdown timer for branching choices</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHasTimedChoice(!hasTimedChoice)}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                hasTimedChoice ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hasTimedChoice ? 'Enabled (5s)' : 'Disabled'}
            </button>
          </div>

          {/* Dialogue Lines Builder */}
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Dialogue Script</label>
            <div className="space-y-1.5 mb-2">
              {dialogueLines.map((line, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-300 block text-[10px]">{line.speaker}</span>
                    <span className="text-white text-xs">{line.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new line */}
            <div className="flex gap-2">
              <select
                value={newSpeaker}
                onChange={(e) => setNewSpeaker(e.target.value)}
                className="p-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs w-36"
              >
                <option value="Emma [Happy]">Emma [Happy]</option>
                <option value="Emma [Shocked]">Emma [Shocked]</option>
                <option value="Emma [Angry]">Emma [Angry]</option>
                <option value="Emma [Jealous]">Emma [Jealous]</option>
                <option value="Stranger [Scared]">Stranger [Scared]</option>
                <option value="White Lily [Calm]">White Lily [Calm]</option>
              </select>

              <input
                type="text"
                value={newLineText}
                onChange={(e) => setNewLineText(e.target.value)}
                placeholder="Enter character dialogue..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
              />

              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Saving unlocks the "Story Creator" badge & +200 Coins!
          </span>
          <button
            onClick={handleSaveStory}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer active:scale-95"
          >
            Save & Publish Story
          </button>
        </div>
      </motion.div>
    </div>
  );
};
