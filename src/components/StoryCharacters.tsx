import React from 'react';
import { CharacterSpeaker, EmmaEmotion } from '../types/game';

// Legacy / Menu / Stranger Runner images
import emmaHeadImg from '../assets/story/emma_head.png';
import emmaWalkImg from '../assets/story/emma_walk.png';
import emmaRunImg from '../assets/story/emma_run.png';
import emmaEvilAfterImg from '../assets/story/emma_evil_after.png';

import strangerArtImg from '../assets/stranger/stranger_art.png';
import strangerRunImg from '../assets/stranger/stranger_run.png';
import strangerJumpImg from '../assets/stranger/stranger_jump.png';
import strangerKidnappedImg from '../assets/stranger/stranger_kidnapped.png';
import strangerWalkTreeImg from '../assets/stranger/stranger_walk_tree.png';

// EMMA VILE MALICE (13 COMPLETED SPRITES)
import emmaHappyClosedImg from '../assets/sprites/emma_happy_closed.png';
import emmaWorriedImg from '../assets/sprites/emma_worried.png';
import emmaSadImg from '../assets/sprites/emma_sad.png';
import emmaCryingImg from '../assets/sprites/emma_crying.png';
import emmaAngryImg from '../assets/sprites/emma_angry.png';
import emmaSad2Img from '../assets/sprites/emma_sad2.png';
import emmaShockedImg from '../assets/sprites/emma_shocked.png';
import emmaLaughingImg from '../assets/sprites/emma_laughing.png';
import emmaFearImg from '../assets/sprites/emma_fear.png';
import emmaHurtImg from '../assets/sprites/emma_hurt.png';
import emmaScreamingImg from '../assets/sprites/emma_screaming.png';
import emmaNormalImg from '../assets/sprites/emma_normal.png';
import emmaHappyImg from '../assets/sprites/emma_happy.png';

// OTHER CHARACTERS (WIP STANDING SPRITES)
import aylaNormalImg from '../assets/sprites/ayla_normal.png';
import rowanNormalImg from '../assets/sprites/rowan_normal.png';
import chloeNormalImg from '../assets/sprites/chloe_normal.png';
import leoNormalImg from '../assets/sprites/leo_normal.png';

export const EMMA_SPRITES: Record<string, string> = {
  happy_closed: emmaHappyClosedImg,
  worried: emmaWorriedImg,
  sad: emmaSadImg,
  crying: emmaCryingImg,
  angry: emmaAngryImg,
  sad2: emmaSad2Img,
  shocked: emmaShockedImg,
  laughing: emmaLaughingImg,
  fear: emmaFearImg,
  hurt: emmaHurtImg,
  screaming: emmaScreamingImg,
  normal: emmaNormalImg,
  happy: emmaHappyImg,
  // Legacy emotion aliases
  neutral: emmaNormalImg,
  jealous: emmaAngryImg,
  evil: emmaLaughingImg,
  scared: emmaFearImg,
};

export interface CharacterMetaInfo {
  name: string;
  pronouns: string;
  role: string;
  isWip: boolean;
  accentText: string;
  bubbleText: string;
  glowRgba: string;
}

export const CHARACTER_CAST_META: Record<CharacterSpeaker, CharacterMetaInfo> = {
  EMMA: {
    name: 'Emma',
    pronouns: 'She/Her',
    role: 'Vile Malice',
    isWip: false,
    accentText: 'text-rose-300',
    bubbleText: 'text-rose-600',
    glowRgba: 'rgba(244, 63, 94, 0.72)',
  },
  AYLA: {
    name: 'Ayla',
    pronouns: 'She/Her',
    role: 'Silver Wand Guardian',
    isWip: true,
    accentText: 'text-emerald-300',
    bubbleText: 'text-emerald-600',
    glowRgba: 'rgba(52, 211, 153, 0.68)',
  },
  CHLOE: {
    name: 'Chloe',
    pronouns: 'She/Her',
    role: 'Protective Best Friend',
    isWip: true,
    accentText: 'text-pink-300',
    bubbleText: 'text-pink-600',
    glowRgba: 'rgba(244, 114, 182, 0.65)',
  },
  ROWAN: {
    name: 'Rowan',
    pronouns: 'They/Them',
    role: 'Stranger 1',
    isWip: true,
    accentText: 'text-sky-300',
    bubbleText: 'text-sky-600',
    glowRgba: 'rgba(56, 189, 248, 0.65)',
  },
  LEO: {
    name: 'Leo',
    pronouns: 'He/Him',
    role: 'Stranger 3',
    isWip: true,
    accentText: 'text-amber-300',
    bubbleText: 'text-amber-600',
    glowRgba: 'rgba(251, 191, 36, 0.65)',
  },
  NARRATOR: {
    name: 'Narrator',
    pronouns: '',
    role: 'Storyteller',
    isWip: false,
    accentText: 'text-amber-300',
    bubbleText: 'text-amber-600',
    glowRgba: 'rgba(251, 191, 36, 0.45)',
  },
  WHITE_LILY: {
    name: 'Ayla',
    pronouns: 'She/Her',
    role: 'Silver Wand Guardian',
    isWip: true,
    accentText: 'text-emerald-300',
    bubbleText: 'text-emerald-600',
    glowRgba: 'rgba(52, 211, 153, 0.68)',
  },
  STRANGER: {
    name: 'Rowan',
    pronouns: 'They/Them',
    role: 'Stranger 1',
    isWip: true,
    accentText: 'text-sky-300',
    bubbleText: 'text-sky-600',
    glowRgba: 'rgba(56, 189, 248, 0.65)',
  },
};

export function getEmmaSpriteUrl(emotion?: EmmaEmotion): string {
  if (!emotion) return emmaNormalImg;
  return EMMA_SPRITES[emotion] || emmaNormalImg;
}

export function getCharacterSpriteUrl(speaker: CharacterSpeaker, emotion?: EmmaEmotion): string | null {
  switch (speaker) {
    case 'EMMA':
      return getEmmaSpriteUrl(emotion);
    case 'AYLA':
    case 'WHITE_LILY':
      return aylaNormalImg;
    case 'ROWAN':
    case 'STRANGER':
      return rowanNormalImg;
    case 'CHLOE':
      return chloeNormalImg;
    case 'LEO':
      return leoNormalImg;
    default:
      return null;
  }
}

export interface CastCharacterSpriteProps {
  speaker: CharacterSpeaker;
  emotion?: EmmaEmotion;
  bowShake?: boolean;
  isActive?: boolean;
  reduceGlitches?: boolean;
  className?: string;
}

/**
 * Renders any cast character sprite with emotion switching for Emma
 * and smooth gentle breathing/speaking motion (no shaking).
 */
export const CastCharacterSprite: React.FC<CastCharacterSpriteProps> = ({
  speaker,
  emotion = 'normal',
  isActive = true,
  className = 'w-40 h-52 sm:w-52 sm:h-68',
}) => {
  const spriteUrl = getCharacterSpriteUrl(speaker, emotion);
  const meta = CHARACTER_CAST_META[speaker];

  return (
    <div
      className={`relative flex items-end justify-center select-none transition-all duration-300 ${className} ${
        isActive ? 'opacity-100 scale-105 -translate-y-1.5' : 'opacity-60 scale-95'
      }`}
    >
      {spriteUrl && (
        <img
          src={spriteUrl}
          alt={`${meta.name} (${emotion})`}
          referrerPolicy="no-referrer"
          style={
            isActive
              ? { filter: `drop-shadow(0 0 22px ${meta.glowRgba})` }
              : undefined
          }
          className="relative z-10 w-full h-full object-contain transition-transform duration-300"
        />
      )}
    </div>
  );
};

export interface CharacterProps {
  type:
    | 'EMMA_HEAD_SHADOW'
    | 'EMMA_SHY_WALK'
    | 'WHITE_LILY_HAPPY'
    | 'EMMA_SHOCKED'
    | 'EMMA_RUN_SHADOW'
    | 'WHITE_LILY_CONFUSED'
    | 'EMMA_EVIL_AFTER'
    | 'STRANGER_ART'
    | 'STRANGER_WALK_TREE'
    | 'STRANGER_KIDNAPPED'
    | 'STRANGER_RUN'
    | 'STRANGER_JUMP'
    | 'TREE_ANCIENT'
    | 'CUTE_WHITE_STRANGER'
    | 'UNKNOWN_PERSON';
  className?: string;
  isWalking?: boolean;
  isFleeing?: boolean;
  expression?: 'happy' | 'surprised' | 'scared' | 'determined';
}

export const AncientTreeGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 400 450" className="w-full h-full drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]">
        <defs>
          <linearGradient id="trunkGradClose" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#18120c" />
            <stop offset="35%" stopColor="#3d2c1d" />
            <stop offset="65%" stopColor="#2c1e13" />
            <stop offset="100%" stopColor="#130c07" />
          </linearGradient>
          <radialGradient id="foliageGradClose" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6b21a8" />
            <stop offset="45%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#0f0728" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="130" r="135" fill="url(#foliageGradClose)" opacity="0.95" />
        <circle cx="110" cy="140" r="85" fill="url(#foliageGradClose)" opacity="0.9" />
        <circle cx="290" cy="140" r="85" fill="url(#foliageGradClose)" opacity="0.9" />
        <circle cx="200" cy="70" r="95" fill="url(#foliageGradClose)" opacity="0.98" />

        <path
          d="M 90 440 Q 140 380 150 330 L 250 330 Q 260 380 310 440 Q 200 425 90 440 Z"
          fill="#130c07"
        />

        <path
          d="M 145 340 C 130 250 120 200 160 160 C 120 110 155 50 200 50 C 245 50 280 110 240 160 C 280 200 270 250 255 340 Z"
          fill="url(#trunkGradClose)"
          stroke="#090514"
          strokeWidth="4"
        />

        <path d="M 160 180 Q 70 160 40 100 Q 80 120 155 160" fill="#2c1e13" />
        <path d="M 240 180 Q 330 160 360 100 Q 320 120 245 160" fill="#2c1e13" />
        <path d="M 185 105 Q 155 45 120 25 Q 165 45 190 95" fill="#2c1e13" />
        <path d="M 215 105 Q 245 45 280 25 Q 235 45 210 95" fill="#2c1e13" />

        <ellipse cx="200" cy="235" rx="26" ry="40" fill="#020617" stroke="#3b0764" strokeWidth="3" />
        <circle cx="192" cy="230" r="3.5" fill="#c084fc" className="animate-pulse" />
        <circle cx="208" cy="230" r="3.5" fill="#c084fc" className="animate-pulse" />

        <circle cx="80" cy="190" r="4" fill="#38bdf8" className="animate-ping" opacity="0.8" />
        <circle cx="320" cy="210" r="3.5" fill="#ec4899" className="animate-pulse" opacity="0.9" />
        <circle cx="150" cy="65" r="4" fill="#fbbf24" className="animate-pulse" opacity="0.8" />
      </svg>
    </div>
  );
};

export const StoryCharacter: React.FC<CharacterProps> = ({
  type,
  className = 'w-72 h-72',
  isWalking = false,
  isFleeing = false,
}) => {
  const walkClass = isWalking ? 'animate-[bounce_0.8s_infinite]' : '';
  const fleeClass = isFleeing ? 'animate-[pulse_0.4s_infinite]' : '';

  if (type === 'EMMA_HEAD_SHADOW') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src={emmaHeadImg}
          alt="Emma Big Head"
          className="w-full h-full object-contain filter drop-shadow-[0_15px_35px_rgba(168,85,247,0.4)]"
        />
      </div>
    );
  }

  if (type === 'EMMA_SHY_WALK') {
    return (
      <div className={`relative flex items-center justify-center ${className} ${walkClass}`}>
        <img
          src={emmaWalkImg}
          alt="Emma Walking"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>
    );
  }

  if (type === 'WHITE_LILY_HAPPY') {
    return (
      <div className={`relative flex items-center justify-center ${className} ${walkClass}`}>
        <img
          src={aylaNormalImg}
          alt="Ayla"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>
    );
  }

  if (type === 'EMMA_SHOCKED') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src={emmaShockedImg}
          alt="Emma Shocked"
          className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(244,63,94,0.35)]"
        />
      </div>
    );
  }

  if (type === 'EMMA_RUN_SHADOW') {
    return (
      <div className={`relative flex items-center justify-center ${className} ${fleeClass}`}>
        <img
          src={emmaRunImg}
          alt="Emma Running Away"
          className="w-full h-full object-contain filter drop-shadow-2xl"
        />
      </div>
    );
  }

  if (type === 'WHITE_LILY_CONFUSED') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src={aylaNormalImg}
          alt="Ayla"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>
    );
  }

  if (type === 'EMMA_EVIL_AFTER') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src={emmaEvilAfterImg}
          alt="Emma Evil"
          className="w-full h-full object-contain filter drop-shadow-[0_10px_30px_rgba(168,85,247,0.5)]"
        />
      </div>
    );
  }

  if (type === 'STRANGER_WALK_TREE') {
    return (
      <div className={`relative flex items-center justify-center ${className} ${walkClass}`}>
        <img
          src={strangerWalkTreeImg}
          alt="Rowan Walking Outside"
          className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(244,114,182,0.4)]"
        />
      </div>
    );
  }

  if (type === 'STRANGER_KIDNAPPED') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src={strangerKidnappedImg}
          alt="Kidnapped Stranger"
          className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(56,189,248,0.4)]"
        />
      </div>
    );
  }

  if (type === 'STRANGER_RUN') {
    return (
      <div className={`relative flex items-center justify-center ${className} ${walkClass}`}>
        <img
          src={strangerRunImg}
          alt="Stranger Running"
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>
    );
  }

  if (type === 'STRANGER_JUMP') {
    return (
      <div className={`relative flex items-center justify-center ${className} animate-[bounce_0.4s_infinite]`}>
        <img
          src={strangerJumpImg}
          alt="Stranger Jumping"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>
    );
  }

  if (type === 'TREE_ANCIENT') {
    return <AncientTreeGraphic className={className} />;
  }

  return (
    <div className={`relative flex items-center justify-center ${className} ${walkClass}`}>
      <img
        src={strangerArtImg}
        alt="Rowan"
        className="w-full h-full object-contain filter drop-shadow-[0_10px_30px_rgba(244,114,182,0.4)]"
      />
    </div>
  );
};
