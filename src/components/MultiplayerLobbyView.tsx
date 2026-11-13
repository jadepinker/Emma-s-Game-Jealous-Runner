import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Copy, Check, MessageSquare, Send, 
  Music, Eye, EyeOff, Play, ArrowLeft, Gamepad2, 
  Camera, Coffee, LogIn, Moon, ShieldAlert, Crown
} from 'lucide-react';
import { lobbyService } from '../utils/lobbyService';
import { authService } from '../utils/authService';
import { LobbyRoom, ChatMessage, LobbyPlayer, UserProfile } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { moderateChatMessage, getModerationStatus } from '../utils/chatModeration';

interface MultiplayerLobbyViewProps {
  onBackToMenu: () => void;
  onOpenAuth: () => void;
  onStartMatch: (roomCode: string) => void;
}

export const MultiplayerLobbyView: React.FC<MultiplayerLobbyViewProps> = ({
  onBackToMenu,
  onOpenAuth,
  onStartMatch,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [currentRoom, setCurrentRoom] = useState<LobbyRoom | null>(null);
  const [publicRooms, setPublicRooms] = useState<LobbyRoom[]>(lobbyService.getPublicRooms());
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [createIsPublic, setCreateIsPublic] = useState<boolean>(true);
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeWeather, setActiveWeather] = useState<'none' | 'rain' | 'cherry' | 'snow'>('cherry');

  // Mini Arcade in Corner state
  const [arcadeOpen, setArcadeOpen] = useState<boolean>(false);
  const [arcadeScore, setArcadeScore] = useState<number>(0);

  // Photo Booth state
  const [photoSavedToast, setPhotoSavedToast] = useState<boolean>(false);

  // Walkable character position
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 120, y: 160 });
  const [isAfkActive, setIsAfkActive] = useState<boolean>(false);

  // Chat Moderation Warning / Ban State
  const [chatWarning, setChatWarning] = useState<{ text: string; isBan: boolean } | null>(null);
  const [banTick, setBanTick] = useState<number>(0);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const activeRoomRef = useRef<{ code: string; username: string } | null>(null);

  // Sync auth & lobbies
  useEffect(() => {
    return authService.subscribe((u) => setCurrentUser(u));
  }, []);

  useEffect(() => {
    if (currentRoom && currentUser && !authService.isGuest()) {
      activeRoomRef.current = { code: currentRoom.room_code, username: currentUser.username };
    } else {
      activeRoomRef.current = null;
    }
  }, [currentRoom, currentUser]);

  // Automatic Owner Transfer on tab disconnect or unmount
  useEffect(() => {
    const handleUnload = () => {
      if (activeRoomRef.current) {
        lobbyService.leaveRoom(activeRoomRef.current.code, activeRoomRef.current.username);
        activeRoomRef.current = null;
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (activeRoomRef.current) {
        lobbyService.leaveRoom(activeRoomRef.current.code, activeRoomRef.current.username);
        activeRoomRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const unsub = lobbyService.subscribe(() => {
      setPublicRooms(lobbyService.getPublicRooms());
      if (currentRoom) {
        const updated = lobbyService.getRoom(currentRoom.room_code);
        setCurrentRoom({ ...updated });
        setMessages(lobbyService.getMessages(currentRoom.room_code));
      }
    });
    return unsub;
  }, [currentRoom]);

  // Refresh ban countdown if temporarily muted
  useEffect(() => {
    if (!currentUser) return;
    const status = getModerationStatus(currentUser.username);
    if (!status.tempBanUntil) return;
    const timer = setInterval(() => {
      setBanTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentUser, chatWarning, banTick]);

  // Check URL room param on mount e.g. ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      if (urlRoom && currentUser && !authService.isGuest()) {
        handleJoinRoom(urlRoom);
      }
    }
  }, [currentUser]);

  const moveAvatar = (dx: number, dy: number) => {
    if (!currentRoom) return;
    setPlayerPos((prev) => {
      const nextX = Math.max(30, Math.min(380, prev.x + dx));
      const nextY = Math.max(60, Math.min(270, prev.y + dy));
      if (currentUser) {
        lobbyService.movePlayer(currentRoom.room_code, currentUser.username, nextX, nextY);
      }
      return { x: nextX, y: nextY };
    });
  };

  // Handle keyboard walking in lobby
  useEffect(() => {
    if (!currentRoom) return;

    const handleWalkKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const step = 14;
      let dx = 0;
      let dy = 0;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') dy = -step;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') dy = step;
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') dx = -step;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') dx = step;
      else return;

      e.preventDefault();
      moveAvatar(dx, dy);
    };

    window.addEventListener('keydown', handleWalkKey);
    return () => window.removeEventListener('keydown', handleWalkKey);
  }, [currentRoom, currentUser]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCreateRoom = () => {
    if (!currentUser || authService.isGuest()) {
      onOpenAuth();
      return;
    }

    soundManager.playPowerup();
    const room = lobbyService.createRoom(
      currentUser.username,
      createIsPublic,
      undefined,
      currentUser.avatarUrl,
      currentUser.wardrobe?.dyeColors
    );
    setCurrentRoom(room);
    setMessages(lobbyService.getMessages(room.room_code));
  };

  const handleJoinRoom = (code: string) => {
    if (!currentUser || authService.isGuest()) {
      onOpenAuth();
      return;
    }

    if (!code.trim()) return;
    soundManager.playPowerup();
    const res = lobbyService.joinRoom(
      code,
      currentUser.username,
      currentUser.avatarUrl,
      currentUser.wardrobe?.dyeColors
    );
    if (res.success) {
      setCurrentRoom(res.room);
      setMessages(lobbyService.getMessages(res.room.room_code));
    }
  };

  const handleLeaveCurrentRoom = () => {
    if (currentRoom && currentUser) {
      soundManager.playLaneSwitch();
      lobbyService.leaveRoom(currentRoom.room_code, currentUser.username);
      activeRoomRef.current = null;
      setCurrentRoom(null);
      setChatWarning(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !currentUser) return;

    const modResult = moderateChatMessage(currentUser.username, chatInput);
    if (!modResult.allowed) {
      soundManager.playCrash();
      const strikeLabel = modResult.strikeCount ? ` (Strike ${modResult.strikeCount})` : '';
      setChatWarning({
        text: `${modResult.reason}${!modResult.isTempBanned && !modResult.isPermBanned ? strikeLabel : ''}`,
        isBan: Boolean(modResult.isTempBanned || modResult.isPermBanned),
      });
      return;
    }

    setChatWarning(null);
    soundManager.playLaneSwitch();
    const isOwner = currentRoom.host_username.toLowerCase() === currentUser.username.toLowerCase();
    const badge = currentUser.role === 'admin' ? 'Dev' : isOwner ? '👑 Owner' : undefined;
    lobbyService.sendMessage(
      currentRoom.room_code,
      currentUser.username,
      currentUser.avatarUrl,
      chatInput,
      badge
    );
    setChatInput('');
  };

  const handleCopyInviteLink = () => {
    if (!currentRoom) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${currentRoom.room_code}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    soundManager.playPowerup();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleAfk = () => {
    if (!currentRoom || !currentUser) return;
    soundManager.playLaneSwitch();
    const afk = lobbyService.toggleAfk(currentRoom.room_code, currentUser.username);
    setIsAfkActive(afk);
  };

  const handleTriggerEmote = (emote: LobbyPlayer['emote']) => {
    if (!currentRoom || !currentUser) return;
    soundManager.playPowerup();
    lobbyService.triggerEmote(currentRoom.room_code, currentUser.username, emote);
  };

  const handleCycleWeather = () => {
    if (!currentRoom) return;
    soundManager.playLaneSwitch();
    const next = activeWeather === 'none' ? 'rain' : activeWeather === 'rain' ? 'cherry' : activeWeather === 'cherry' ? 'snow' : 'none';
    setActiveWeather(next);
    lobbyService.setWeather(currentRoom.room_code, next);
  };

  const handleSavePhoto = () => {
    soundManager.playPowerup();
    setPhotoSavedToast(true);
    setTimeout(() => setPhotoSavedToast(false), 2000);
  };

  // If player is a guest, prompt login modal banner
  const isGuestUser = !currentUser || authService.isGuest();

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 font-sans select-none overflow-hidden overflow-x-hidden">
      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between px-3 md:px-6 py-2 md:py-3 bg-slate-950/90 border-b border-white/10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => {
              handleLeaveCurrentRoom();
              onBackToMenu();
            }}
            className="px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
            <span>Menu</span>
          </button>
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-400 shrink-0" />
            <h2 className="text-xs md:text-base font-black text-white truncate">Multiplayer Lobbies</h2>
          </div>
        </div>

        {isGuestUser ? (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1 md:px-3.5 md:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 text-white text-[11px] md:text-xs font-black uppercase flex items-center gap-1 shadow-md shadow-purple-900/30 cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] md:text-xs text-purple-300 font-bold bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 md:px-2.5 md:py-1 rounded-xl">
              @{currentUser?.username}
            </span>
          </div>
        )}
      </div>

      {/* Guest Lock Banner */}
      {isGuestUser && (
        <div className="relative z-20 p-2 md:p-2.5 bg-purple-950/80 border-b border-purple-500/40 text-center text-[11px] md:text-xs font-semibold text-purple-200 flex flex-wrap items-center justify-center gap-2">
          <span>🔒 Log in with Username or Email to host or join multiplayer lobbies!</span>
          <button
            onClick={onOpenAuth}
            className="underline font-bold text-white hover:text-purple-300 cursor-pointer"
          >
            Sign In Now
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden md:overflow-hidden p-2.5 md:p-5 flex flex-col md:flex-row gap-3 md:gap-4">
        {currentRoom ? (
          /* ROOM WAITING SCREEN & 2D WALKABLE LOBBY */
          <div className="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 h-full md:overflow-hidden">
            {/* Left: 2D Walkable Lobby Area */}
            <div className="flex-1 flex flex-col bg-slate-900/90 border border-purple-500/30 rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-2xl overflow-hidden relative min-h-[340px]">
              {/* Room Header & Share Link */}
              <div className="flex items-center justify-between pb-2 md:pb-3 border-b border-white/10 shrink-0 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                    <span className="text-[10px] md:text-xs uppercase font-extrabold text-purple-400">Room:</span>
                    <span className="text-xs md:text-lg font-black font-mono tracking-widest text-amber-300 bg-black/60 px-2 py-0.5 rounded-lg md:rounded-xl border border-amber-400/40">
                      {currentRoom.room_code}
                    </span>
                    <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${currentRoom.isPublic ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                      {currentRoom.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-300 mt-0.5 truncate">
                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-200 truncate">Owner: @{currentRoom.host_username}</span>
                    <span className="text-slate-500">·</span>
                    <span>{currentRoom.players.length} Players</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/40 text-purple-200 text-[10px] md:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Copy Shareable Link (?room=CODE)"
                  >
                    {copiedLink ? <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                  </button>

                  <button
                    onClick={handleLeaveCurrentRoom}
                    className="px-2 py-1 md:p-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 hover:text-white text-xs font-bold cursor-pointer"
                    title="Leave Room (transfers ownership automatically if you are Owner)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 2D Walkable Visual Space */}
              <div className="relative flex-1 my-3 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-white/10 overflow-hidden select-none">
                {/* Weather overlay */}
                {activeWeather === 'rain' && (
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.25),transparent)] animate-pulse" />
                )}
                {activeWeather === 'cherry' && (
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.25),transparent)]" />
                )}
                {activeWeather === 'snow' && (
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.2),transparent)]" />
                )}

                {/* Interactive Object 1: Jukebox in Top Left */}
                <button
                  onClick={() => soundManager.playLaneSwitch()}
                  className="absolute top-3 left-3 p-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 shadow-lg hover:scale-105 cursor-pointer z-10"
                >
                  <Music className="w-3.5 h-3.5 text-pink-400" />
                  <span>Jukebox 🎵</span>
                </button>

                {/* Interactive Object 2: AFK Lounge in Top Right */}
                <div 
                  onClick={handleToggleAfk}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-[10px] font-bold flex items-center gap-1.5 shadow-lg cursor-pointer z-10 hover:scale-105"
                  title="Walk here or click to toggle [AFK]"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>AFK Lounge 💤</span>
                </div>

                {/* Interactive Object 3: Mini Arcade in Bottom Left (shifted up above D-pad on mobile) */}
                <button
                  onClick={() => {
                    soundManager.playPowerup();
                    setArcadeOpen(true);
                  }}
                  className="absolute bottom-[4.5rem] left-2 md:bottom-3 md:left-3 p-1.5 md:p-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-lg hover:scale-105 cursor-pointer z-10"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mini Arcade 🕹️</span>
                </button>

                {/* Interactive Object 4: Photo Booth in Bottom Right */}
                <button
                  onClick={handleSavePhoto}
                  className="absolute bottom-2 right-2 md:bottom-3 md:right-3 p-1.5 md:p-2 rounded-xl bg-pink-950/80 border border-pink-500/50 text-pink-300 text-[10px] font-bold flex items-center gap-1 shadow-lg hover:scale-105 cursor-pointer z-10"
                >
                  <Camera className="w-3.5 h-3.5 text-pink-400" />
                  <span>Photo Booth 📸</span>
                </button>

                {/* COMPACT MOBILE MOVEMENT ARROWS (w-14 h-14 semi-transparent corner pad) */}
                <div className="md:hidden absolute bottom-2 left-2 z-20 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 grid grid-cols-3 grid-rows-3 place-items-center p-0.5 shadow-lg">
                  <div />
                  <button
                    type="button"
                    onClick={() => moveAvatar(0, -18)}
                    className="w-4 h-4 flex items-center justify-center text-[10px] text-white/90 hover:text-white active:scale-90 cursor-pointer"
                    aria-label="Move Up"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => moveAvatar(-18, 0)}
                    className="w-4 h-4 flex items-center justify-center text-[10px] text-white/90 hover:text-white active:scale-90 cursor-pointer"
                    aria-label="Move Left"
                  >
                    ◀
                  </button>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <button
                    type="button"
                    onClick={() => moveAvatar(18, 0)}
                    className="w-4 h-4 flex items-center justify-center text-[10px] text-white/90 hover:text-white active:scale-90 cursor-pointer"
                    aria-label="Move Right"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={() => moveAvatar(0, 18)}
                    className="w-4 h-4 flex items-center justify-center text-[10px] text-white/90 hover:text-white active:scale-90 cursor-pointer"
                    aria-label="Move Down"
                  >
                    ▼
                  </button>
                  <div />
                </div>

                {/* Walkable Avatars on Screen */}
                {currentRoom.players.map((item, idx) => {
                  const p: LobbyPlayer = typeof item === 'string'
                    ? { username: item, avatar: '🌸', isReady: true, isHost: item === currentRoom.host_username, isAfk: false }
                    : item;
                  const isCurrent = p.username === currentUser?.username;
                  const x = isCurrent ? playerPos.x : (p.x || (100 + idx * 45));
                  const y = isCurrent ? playerPos.y : (p.y || (140 + idx * 20));

                  return (
                    <div
                      key={p.username}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className={`absolute transition-all duration-150 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none ${
                        p.isAfk ? 'opacity-50 grayscale-[40%]' : ''
                      }`}
                    >
                      {/* Emote Bubble */}
                      {p.emote && (
                        <div className="px-2 py-0.5 rounded-full bg-white text-slate-900 text-[11px] font-bold mb-1 shadow-lg animate-bounce">
                          {p.emote === 'wave' ? '👋 Hello!' : p.emote === 'dance' ? '💃 Vibing!' : p.emote === 'cheer' ? '🎉 WOOOO!' : '😴 Zzz...'}
                        </div>
                      )}

                      {/* Avatar Sprite */}
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-tr from-purple-800 to-pink-600 border-2 flex items-center justify-center text-base md:text-xl shadow-xl relative ${
                        p.isHost || p.username.toLowerCase() === currentRoom.host_username.toLowerCase()
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : 'border-white/40'
                      }`}>
                        {p.avatar || '🌸'}
                        {(p.isHost || p.username.toLowerCase() === currentRoom.host_username.toLowerCase()) && (
                          <span className="absolute -top-2.5 text-xs drop-shadow" title="Room Owner">👑</span>
                        )}
                      </div>

                      {/* Name Tag with Crown / Owner Badge or [AFK] */}
                      <span className="text-[9px] md:text-[10px] font-black text-white bg-black/75 px-1.5 py-0.5 rounded-md mt-0.5 whitespace-nowrap flex items-center gap-1 shadow-md">
                        {(p.isHost || p.username.toLowerCase() === currentRoom.host_username.toLowerCase()) && (
                          <span className="text-amber-300 font-mono text-[8px] md:text-[9px]">👑 Owner</span>
                        )}
                        {!p.isHost && p.badge && p.badge !== 'Host' && p.badge !== '👑 Owner' && (
                          <span className="text-amber-400 font-mono text-[8px] md:text-[9px]">{p.badge}</span>
                        )}
                        <span>{p.username}</span>
                        {p.isAfk && <span className="text-rose-400 font-bold">[AFK]</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Lobby Interactive Control Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 shrink-0 text-xs">
                {/* Emote Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Emote:</span>
                  {(['wave', 'dance', 'cheer', 'sleep'] as LobbyPlayer['emote'][]).map((em) => (
                    <button
                      key={em}
                      onClick={() => handleTriggerEmote(em)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white cursor-pointer"
                    >
                      {em === 'wave' ? '👋' : em === 'dance' ? '💃' : em === 'cheer' ? '🎉' : '😴'}
                    </button>
                  ))}
                </div>

                {/* Weather & AFK Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCycleWeather}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Cycle Weather"
                  >
                    <span>Weather: {activeWeather.toUpperCase()}</span>
                  </button>

                  <button
                    onClick={handleToggleAfk}
                    className={`px-3 py-1 rounded-xl font-bold text-xs uppercase flex items-center gap-1 transition-all cursor-pointer ${
                      isAfkActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>{isAfkActive ? 'AFK Active' : 'Go AFK'}</span>
                  </button>
                </div>
              </div>

              {/* Host Start Game Action */}
              <div className="mt-2 md:mt-3 pt-2 flex flex-wrap items-center justify-between gap-2 md:gap-3">
                <span className="hidden md:inline text-[11px] text-slate-400">
                  Use WASD or Arrow Keys to move your avatar around the lobby!
                </span>

                {currentRoom.host_username === currentUser?.username ? (
                  <button
                    onClick={() => {
                      soundManager.playPowerup();
                      onStartMatch(currentRoom.room_code);
                    }}
                    className="px-4 py-2 md:px-6 md:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-95 flex items-center gap-1.5 md:gap-2"
                  >
                    <Play className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                    <span>Start Match</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-amber-300 animate-pulse">
                    Waiting for Host to start match...
                  </span>
                )}
              </div>
            </div>

            {/* Right: Live Chatbox UI with Strict Moderation */}
            <div className="w-full lg:w-80 bg-slate-900/90 border border-purple-500/30 rounded-2xl md:rounded-3xl p-2.5 md:p-4 shadow-2xl flex flex-col max-h-[42vh] lg:max-h-full lg:h-full overflow-hidden shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                  <h3 className="text-[11px] md:text-xs font-black uppercase text-white tracking-wider">
                    Live Lobby Chat
                  </h3>
                </div>
                <span className="text-[9px] md:text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Safe Chat
                </span>
              </div>

              {/* Message log */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto my-2 pr-1 space-y-1.5 text-[11px] md:text-xs custom-scrollbar min-h-[90px]">
                {messages.map((m) => (
                  <div key={m.id} className="p-1.5 md:p-2 rounded-xl bg-slate-950/70 border border-white/5 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 font-bold text-purple-300">
                        <span>{m.avatar}</span>
                        <span>{m.sender_username}</span>
                        {m.badge && (
                          <span className={`px-1 rounded text-[8px] uppercase font-black ${
                            m.badge.includes('Owner')
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-400/30'
                              : 'bg-purple-500/30 text-purple-200'
                          }`}>
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-mono text-[9px]">{m.created_at}</span>
                    </div>
                    <p className="text-slate-200 leading-snug break-words">{m.message}</p>
                  </div>
                ))}
              </div>

              {/* Moderation Warning / Temp or Permanent Ban Banner */}
              {(() => {
                const modStatus = currentUser ? getModerationStatus(currentUser.username) : null;
                const remainingSecs = modStatus?.tempBanUntil
                  ? Math.max(1, Math.ceil((modStatus.tempBanUntil - Date.now()) / 1000))
                  : 0;
                const activeBanner = modStatus?.permBanned
                  ? { text: 'Chat disabled: Permanently banned for repeated rule violations.', isBan: true }
                  : remainingSecs > 0
                  ? { text: `Temporary chat ban active (${remainingSecs}s remaining).`, isBan: true }
                  : chatWarning;

                return activeBanner ? (
                  <div className={`mb-2 p-2 rounded-xl border text-[10px] md:text-[11px] font-bold flex items-start gap-1.5 ${
                    activeBanner.isBan
                      ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                      : 'bg-amber-950/90 border-amber-500 text-amber-200'
                  }`}>
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{activeBanner.text}</span>
                  </div>
                ) : null;
              })()}

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex gap-1.5 md:gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={Boolean(
                    currentUser &&
                    (getModerationStatus(currentUser.username).permBanned ||
                      (getModerationStatus(currentUser.username).tempBanUntil || 0) > Date.now())
                  )}
                  placeholder="Be respectful (Rules apply)..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-400 disabled:opacity-40"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer active:scale-95 shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* LOBBY BROWSER & HOSTING PANEL */
          <div className="flex-1 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
            {/* Host or Enter Room Code */}
            <div className="w-full md:w-80 bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 shadow-2xl flex flex-col justify-between shrink-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Create a Room</h3>
                    <span className="text-[10px] text-slate-400">Generate a unique short code</span>
                  </div>
                </div>

                {/* Privacy toggle */}
                <div className="p-3 bg-slate-950/70 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {createIsPublic ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    <span className="text-xs font-bold text-white">
                      {createIsPublic ? 'Public Room (Browser)' : 'Private Room (Code Only)'}
                    </span>
                  </div>
                  <button
                    onClick={() => setCreateIsPublic(!createIsPublic)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      createIsPublic ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {createIsPublic ? 'Public' : 'Private'}
                  </button>
                </div>

                <button
                  onClick={handleCreateRoom}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Host New Room</span>
                </button>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Join with Room Code:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. DASH1"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-center font-bold text-sm tracking-widest uppercase focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => handleJoinRoom(roomCodeInput)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 text-[10px] text-slate-500 text-center">
                Multiplayer rooms support live chat, photo booth, and real-time runner dashes.
              </div>
            </div>

            {/* Public Rooms List */}
            <div className="flex-1 bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-black text-white">Public Lobby Browser</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {publicRooms.length} Active Lobbies
                </span>
              </div>

              <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2.5 custom-scrollbar">
                {publicRooms.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No active public lobbies found. Be the first to host one!
                  </div>
                ) : (
                  publicRooms.map((r) => (
                    <div
                      key={r.room_code}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 hover:border-purple-500/50 flex items-center justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-black text-amber-300 font-mono tracking-wider">
                            [{r.room_code}]
                          </span>
                          <span className="text-xs font-bold text-white">
                            Hosted by @{r.host_username}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {r.players.length} players waiting · Status: {r.status}
                        </span>
                      </div>

                      <button
                        onClick={() => handleJoinRoom(r.room_code)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-purple-900/30"
                      >
                        Join Room
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini Arcade Modal in Corner */}
      <AnimatePresence>
        {arcadeOpen && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-amber-400 rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-xs w-full text-center space-y-3 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="text-3xl">🕹️</div>
              <h3 className="text-lg font-black text-white">Lobby Jump Counter</h3>
              <p className="text-xs text-slate-400">
                Tap as fast as you can while waiting for the room host!
              </p>
              <div className="py-4 bg-slate-950 rounded-2xl border border-white/10">
                <span className="text-4xl font-black font-mono text-amber-400">{arcadeScore}</span>
                <span className="block text-[10px] text-slate-500 uppercase mt-1">Jumps Counted</span>
              </div>
              <button
                onClick={() => {
                  soundManager.playJump();
                  setArcadeScore(prev => prev + 1);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase rounded-xl active:scale-95 cursor-pointer"
              >
                JUMP!
              </button>
              <button
                onClick={() => setArcadeOpen(false)}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Close Arcade
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Photo Booth Toast */}
      {photoSavedToast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-pink-900/90 border border-pink-400 text-white text-xs font-bold rounded-2xl shadow-2xl animate-bounce">
          📸 Outfit Snapshot Saved to your Profile Photo Album!
        </div>
      )}
    </div>
  );
};
