import React from 'react';

// Exact user-uploaded character images
import emmaHeadImg from '../assets/story/emma_head.png';
import emmaWalkImg from '../assets/story/emma_walk.png';
import whiteLilyHappyImg from '../assets/story/white_lily_happy.webp';
import emmaShockedImg from '../assets/story/emma_shocked.png';
import emmaRunImg from '../assets/story/emma_run.png';
import whiteLilyConfusedImg from '../assets/story/white_lily_confused.webp';
import emmaEvilAfterImg from '../assets/story/emma_evil_after.png';

// Brand new custom art images created by user for Stranger
import strangerArtImg from '../assets/stranger/stranger_art.png';
import strangerRunImg from '../assets/stranger/stranger_run.png';
import strangerJumpImg from '../assets/stranger/stranger_jump.png';
import strangerKidnappedImg from '../assets/stranger/stranger_kidnapped.png';
import strangerWalkTreeImg from '../assets/stranger/stranger_walk_tree.png';

export interface CharacterProps {
  type: 
    | 'EMMA_HEAD_SHADOW'      // Start screen big head
    | 'EMMA_SHY_WALK'         // Walking animation
    | 'WHITE_LILY_HAPPY'      // White lily cookie smiling with wand
    | 'EMMA_SHOCKED'          // Shocked with dark forehead shadow
    | 'EMMA_RUN_SHADOW'       // Running away with darkened shadow face
    | 'WHITE_LILY_CONFUSED'   // White lily cookie confused
    | 'EMMA_EVIL_AFTER'       // Emma talking to Stranger
    | 'STRANGER_ART'          // User art stranger (https://ibb.co/V0tK4spv)
    | 'STRANGER_WALK_TREE'    // User art walking outside scene 6 (https://ibb.co/B5mqfGNv)
    | 'STRANGER_KIDNAPPED'    // User art kidnapped basement (https://ibb.co/211gWz4F)
    | 'STRANGER_RUN'          // User art running in runner (https://ibb.co/fYhJT5hL)
    | 'STRANGER_JUMP'         // User art jumping in runner (https://ibb.co/SXNwHy7X)
    | 'TREE_ANCIENT'          // Gnarled tree
    | 'CUTE_WHITE_STRANGER'   // Alias to STRANGER_ART
    | 'UNKNOWN_PERSON';       // Alias to STRANGER_ART
  className?: string;
  isWalking?: boolean;
  isFleeing?: boolean;
  expression?: 'happy' | 'surprised' | 'scared' | 'determined';
}

/**
 * Ancient Gnarled Tree for Scene 6
 * Optimized to sit down lower and closer as requested by user
 */
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

        {/* Tree Canopy Foliage */}
        <circle cx="200" cy="130" r="135" fill="url(#foliageGradClose)" opacity="0.95" />
        <circle cx="110" cy="140" r="85" fill="url(#foliageGradClose)" opacity="0.9" />
        <circle cx="290" cy="140" r="85" fill="url(#foliageGradClose)" opacity="0.9" />
        <circle cx="200" cy="70" r="95" fill="url(#foliageGradClose)" opacity="0.98" />

        {/* Lower Ground Roots - firmly rooted at the bottom edge */}
        <path
          d="M 90 440 Q 140 380 150 330 L 250 330 Q 260 380 310 440 Q 200 425 90 440 Z"
          fill="#130c07"
        />

        {/* Big Gnarled Trunk - closer and wider */}
        <path
          d="M 145 340 C 130 250 120 200 160 160 C 120 110 155 50 200 50 C 245 50 280 110 240 160 C 280 200 270 250 255 340 Z"
          fill="url(#trunkGradClose)"
          stroke="#090514"
          strokeWidth="4"
        />

        {/* Twisted Branches */}
        <path d="M 160 180 Q 70 160 40 100 Q 80 120 155 160" fill="#2c1e13" />
        <path d="M 240 180 Q 330 160 360 100 Q 320 120 245 160" fill="#2c1e13" />
        <path d="M 185 105 Q 155 45 120 25 Q 165 45 190 95" fill="#2c1e13" />
        <path d="M 215 105 Q 245 45 280 25 Q 235 45 210 95" fill="#2c1e13" />

        {/* Hollow Knothole for Emma to hide behind */}
        <ellipse cx="200" cy="235" rx="26" ry="40" fill="#020617" stroke="#3b0764" strokeWidth="3" />
        <circle cx="192" cy="230" r="3.5" fill="#c084fc" className="animate-pulse" />
        <circle cx="208" cy="230" r="3.5" fill="#c084fc" className="animate-pulse" />

        {/* Glowing floating fireflies */}
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
          src={whiteLilyHappyImg}
          alt="White Lily Cookie Happy"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>
    );
  }

  if (type === 'EMMA_SHOCKED') {
    return (
      <div className={`relative flex items-center justify-center ${className} animate-[pulse_1.2s_infinite]`}>
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
          src={whiteLilyConfusedImg}
          alt="White Lily Cookie Confused"
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
    // User art walking outside scene 6 (https://ibb.co/B5mqfGNv)
    return (
      <div className={`relative flex items-center justify-center ${className} ${walkClass}`}>
        <img
          src={strangerWalkTreeImg}
          alt="Stranger Walking Outside"
          className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(244,114,182,0.4)]"
        />
      </div>
    );
  }

  if (type === 'STRANGER_KIDNAPPED') {
    // User art after emma kidnapped stranger (https://ibb.co/211gWz4F)
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
    // User art in runner game when running (https://ibb.co/fYhJT5hL)
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
    // User art in runner game when jumping (https://ibb.co/SXNwHy7X)
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

  // Default Stranger Art (https://ibb.co/V0tK4spv)
  return (
    <div className={`relative flex items-center justify-center ${className} ${walkClass}`}>
      <img
        src={strangerArtImg}
        alt="Stranger Art"
        className="w-full h-full object-contain filter drop-shadow-[0_10px_30px_rgba(244,114,182,0.4)]"
      />
    </div>
  );
};
