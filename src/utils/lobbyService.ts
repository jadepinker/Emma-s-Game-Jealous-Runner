import { LobbyRoom, ChatMessage, LobbyPlayer, DyeColors } from '../types/game';

const LOBBIES_STORAGE_KEY = 'emma_runner_lobbies_db';
const MESSAGES_STORAGE_KEY = 'emma_runner_messages_db';

class LobbyService {
  private rooms: LobbyRoom[] = [];
  private messages: ChatMessage[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadState();
    // Default public lobby so there is always a room to join!
    if (this.rooms.length === 0) {
      this.createRoom('Emma', true, 'DASH1');
    }
  }

  private loadState() {
    try {
      const storedRooms = localStorage.getItem(LOBBIES_STORAGE_KEY);
      if (storedRooms) {
        this.rooms = JSON.parse(storedRooms);
      }
      const storedMsgs = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (storedMsgs) {
        this.messages = JSON.parse(storedMsgs);
      }
    } catch {
      this.rooms = [];
      this.messages = [];
    }
  }

  private saveState() {
    try {
      localStorage.setItem(LOBBIES_STORAGE_KEY, JSON.stringify(this.rooms));
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(this.messages.slice(-100)));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create room with privacy toggle (prevents 404 crash)
  public createRoom(
    hostUsername: string, 
    isPublic: boolean = true, 
    forcedCode?: string,
    hostAvatar: string = '🌸',
    dyeColors?: DyeColors
  ): LobbyRoom {
    const code = forcedCode || this.generateRoomCode();
    
    // Check if room already exists
    const existingIdx = this.rooms.findIndex(r => r.room_code.toUpperCase() === code.toUpperCase());
    if (existingIdx !== -1) {
      return this.rooms[existingIdx];
    }

    const hostPlayer: LobbyPlayer = {
      username: hostUsername,
      avatar: hostAvatar,
      isReady: true,
      isHost: true,
      isAfk: false,
      badge: '👑 Owner',
      x: 120,
      y: 160,
      dyeColors,
    };

    const newRoom: LobbyRoom = {
      room_code: code.toUpperCase(),
      host_username: hostUsername,
      players: [hostPlayer],
      status: 'waiting',
      isPublic,
      createdAt: new Date().toISOString(),
      weather: 'cherry',
      musicTrack: 'cozy',
    };

    this.rooms.unshift(newRoom);
    this.saveState();

    // Add initial system message
    this.sendMessage(code, 'SYSTEM', '🤖', `Lobby [${code}] created by ${hostUsername}. Waiting for players!`);

    return newRoom;
  }

  // Get room by code (with automatic 404 recovery fallback)
  public getRoom(roomCode: string): LobbyRoom {
    const code = roomCode.trim().toUpperCase();
    const found = this.rooms.find(r => r.room_code.toUpperCase() === code);
    if (found) return found;

    // Fix Lobby 404 Entity Crash: Instantiate fresh valid room instead of throwing 404
    return this.createRoom('Host', true, code);
  }

  // Get all public rooms
  public getPublicRooms(): LobbyRoom[] {
    return this.rooms.filter(r => r.isPublic);
  }

  // Join a room
  public joinRoom(
    roomCode: string, 
    username: string, 
    avatar: string = '🌸',
    dyeColors?: DyeColors
  ): { success: boolean; room: LobbyRoom; message?: string } {
    const room = this.getRoom(roomCode);
    
    const existingPlayer = room.players.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (!existingPlayer) {
      const hasActiveHost = room.players.some(p => p.isHost);
      const isNowOwner = room.players.length === 0 || !hasActiveHost;
      const newPlayer: LobbyPlayer = {
        username,
        avatar,
        isReady: false,
        isHost: isNowOwner,
        isAfk: false,
        badge: isNowOwner ? '👑 Owner' : undefined,
        x: Math.floor(Math.random() * 200) + 80,
        y: Math.floor(Math.random() * 100) + 120,
        dyeColors,
      };
      if (isNowOwner) {
        room.host_username = username;
      }
      room.players.push(newPlayer);
      this.saveState();
      this.sendMessage(
        room.room_code,
        'SYSTEM',
        '✨',
        isNowOwner
          ? `${username} joined as the new 👑 Room Owner!`
          : `${username} joined the lobby!`
      );
    }

    return { success: true, room };
  }

  // Leave a room and automatically transfer Room Owner to a random remaining player
  public leaveRoom(roomCode: string, username: string): { transferredTo?: string } {
    const code = roomCode.trim().toUpperCase();
    const roomIdx = this.rooms.findIndex(r => r.room_code.toUpperCase() === code);
    if (roomIdx === -1) return {};

    const room = this.rooms[roomIdx];
    const leavingPlayer = room.players.find(p => p.username.toLowerCase() === username.toLowerCase());
    const wasOwner =
      room.host_username.toLowerCase() === username.toLowerCase() || Boolean(leavingPlayer?.isHost);

    room.players = room.players.filter(p => p.username.toLowerCase() !== username.toLowerCase());

    if (room.players.length === 0) {
      if (room.room_code === 'DASH1') {
        room.host_username = 'Awaiting Host';
      } else {
        this.rooms.splice(roomIdx, 1);
      }
      this.saveState();
      return {};
    }

    let transferredTo: string | undefined;
    if (wasOwner) {
      const randomIndex = Math.floor(Math.random() * room.players.length);
      const newOwner = room.players[randomIndex];
      room.players = room.players.map((p, idx) => ({
        ...p,
        isHost: idx === randomIndex,
        badge: idx === randomIndex ? '👑 Owner' : p.badge === '👑 Owner' || p.badge === 'Host' ? undefined : p.badge,
      }));
      room.host_username = newOwner.username;
      transferredTo = newOwner.username;

      this.saveState();
      this.sendMessage(
        room.room_code,
        'SYSTEM',
        '👑',
        `${username} left the room. ${newOwner.username} has been randomly chosen as the new 👑 Room Owner!`
      );
    } else {
      this.saveState();
      this.sendMessage(room.room_code, 'SYSTEM', '👋', `${username} left the lobby.`);
    }

    return { transferredTo };
  }

  // Toggle ready status
  public toggleReady(roomCode: string, username: string) {
    const room = this.getRoom(roomCode);
    const player = room.players.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (player) {
      player.isReady = !player.isReady;
      this.saveState();
    }
  }

  // Toggle AFK status
  public toggleAfk(roomCode: string, username: string): boolean {
    const room = this.getRoom(roomCode);
    const player = room.players.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (player) {
      player.isAfk = !player.isAfk;
      const statusText = player.isAfk ? 'is now [AFK] 💤' : 'returned from AFK 👋';
      this.sendMessage(roomCode, 'SYSTEM', '💤', `Player ${username} ${statusText}`);
      this.saveState();
      return player.isAfk;
    }
    return false;
  }

  // Move player in walkable 2D space
  public movePlayer(roomCode: string, username: string, x: number, y: number) {
    const room = this.getRoom(roomCode);
    const player = room.players.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (player) {
      player.x = Math.max(30, Math.min(360, x));
      player.y = Math.max(80, Math.min(260, y));

      // AFK lounge automatic trigger (zone around x: 300, y: 100)
      if (player.x > 280 && player.y < 130 && !player.isAfk) {
        this.toggleAfk(roomCode, username);
      }
      this.saveState();
    }
  }

  // Trigger emote
  public triggerEmote(roomCode: string, username: string, emote: LobbyPlayer['emote']) {
    const room = this.getRoom(roomCode);
    const player = room.players.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (player) {
      player.emote = emote;
      this.saveState();
      setTimeout(() => {
        if (player.emote === emote) {
          player.emote = null;
          this.saveState();
        }
      }, 3500);
    }
  }

  // Change weather
  public setWeather(roomCode: string, weather: LobbyRoom['weather']) {
    const room = this.getRoom(roomCode);
    room.weather = weather;
    this.saveState();
  }

  // Change music
  public setMusic(roomCode: string, track: LobbyRoom['musicTrack']) {
    const room = this.getRoom(roomCode);
    room.musicTrack = track;
    this.saveState();
  }

  // Send Chat message
  public sendMessage(roomCode: string, senderUsername: string, avatar: string, message: string, badge?: string): ChatMessage {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      room_code: roomCode.toUpperCase(),
      sender_username: senderUsername,
      avatar,
      message: message.trim(),
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      badge,
    };

    this.messages.push(msg);
    this.saveState();
    return msg;
  }

  // Get messages for room
  public getMessages(roomCode: string): ChatMessage[] {
    const code = roomCode.toUpperCase();
    return this.messages.filter(m => m.room_code === code);
  }
}

export const lobbyService = new LobbyService();
