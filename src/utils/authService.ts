import { 
  UserProfile, UserSettings, DEFAULT_USER_SETTINGS, DEFAULT_DYE_COLORS, 
  BugReportItem, FeedbackItem, GameDifficulty, DailyQuest, Achievement, MemoryCard 
} from '../types/game';

const CURRENT_USER_KEY = 'emma_runner_current_user';
const LOCAL_COINS_KEY = 'emma_runner_local_coins';
const USERS_DB_KEY = 'emma_runner_users_db';
const BUG_REPORTS_KEY = 'emma_runner_bug_reports';
const FEEDBACK_KEY = 'emma_runner_feedback';
const QUESTS_KEY = 'emma_runner_daily_quests';
const MEMORY_CARDS_KEY = 'emma_runner_memory_cards';

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export const INITIAL_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest_jump_rocks',
    title: 'Rock Dodger',
    description: 'Jump over 15 rocks during Story Mode stages',
    rewardCoins: 100,
    progress: 0,
    target: 15,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_practice_dist',
    title: 'Trail Scout',
    description: 'Reach 50cm in a Story Mode stage',
    rewardCoins: 100,
    progress: 0,
    target: 50,
    completed: false,
    claimed: false,
  },
  {
    id: 'quest_complete_episode',
    title: 'Story Explorer',
    description: 'Complete 1 Story Episode in Season 1',
    rewardCoins: 150,
    progress: 0,
    target: 1,
    completed: false,
    claimed: false,
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_steps',
    title: 'First Steps',
    description: 'Complete your first Story Mode stage run',
    icon: '🏃',
    rewardCoins: 100,
    badge: 'Pro Runner',
    unlocked: false,
  },
  {
    id: 'ach_rock_dodger',
    title: 'Rock Dodger',
    description: 'Dodge 50 rocks without getting hit',
    icon: '🪨',
    rewardCoins: 250,
    badge: 'Agile Dasher',
    unlocked: false,
  },
  {
    id: 'ach_coin_hoarder',
    title: 'Coin Hoarder',
    description: 'Accumulate 1,000 total coins',
    icon: '💰',
    rewardCoins: 300,
    badge: 'Coin Collector',
    unlocked: false,
  },
  {
    id: 'ach_story_master',
    title: 'Story Master',
    description: 'Finish all 10 episodes of Season 1',
    icon: '📖',
    rewardCoins: 500,
    badge: 'Season 1 Victor',
    unlocked: false,
  },
  {
    id: 'ach_story_creator',
    title: 'Creative Mind',
    description: 'Create and play your own custom story',
    icon: '✨',
    rewardCoins: 200,
    badge: 'Story Creator',
    unlocked: false,
  },
];

export const INITIAL_MEMORY_CARDS: MemoryCard[] = [
  {
    id: 'card_1',
    episodeId: 1,
    title: "The Wand's Glow",
    description: "Emma gazes in bitter jealousy as White Lily Cookie displays her radiant ancient wand.",
    unlocked: true,
  },
  {
    id: 'card_2',
    episodeId: 3,
    title: "Shadow Encounter",
    description: "Emma ambushes the cute stranger in the shadows of the woods.",
    unlocked: false,
  },
  {
    id: 'card_3',
    episodeId: 5,
    title: "The First Chest",
    description: "A mysterious gilded lock-box uncovered along the winding morning trail.",
    unlocked: false,
  },
  {
    id: 'card_4',
    episodeId: 7,
    title: "White Lily's Secret",
    description: "The confrontation unfolds under the ominous glow of the enchanted sky.",
    unlocked: false,
  },
  {
    id: 'card_5',
    episodeId: 10,
    title: "Three Chests Reunited",
    description: "The final victory snapshot commemorating Season 1 completion!",
    unlocked: false,
  },
];

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Array<(user: UserProfile | null) => void> = [];
  private quests: DailyQuest[] = [];
  private memoryCards: MemoryCard[] = [];

  constructor() {
    this.loadSession();
    this.loadQuests();
    this.loadMemoryCards();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed && parsed.id && parsed.id !== 'guest_player') {
          this.currentUser = parsed;
          return;
        }
        // Clean up any legacy auto-guest session
        localStorage.removeItem(CURRENT_USER_KEY);
      }
      this.currentUser = null;
    } catch {
      this.currentUser = null;
    }
  }

  public getLocalCoins(): number {
    if (this.currentUser) {
      return this.currentUser.stats.coins || 0;
    }
    try {
      const saved = localStorage.getItem(LOCAL_COINS_KEY);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isGuest(): boolean {
    return !this.currentUser || this.currentUser.id === 'guest_player';
  }

  public subscribe(listener: (user: UserProfile | null) => void) {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  private getUsersDb(): StoredUser[] {
    try {
      const data = localStorage.getItem(USERS_DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveUsersDb(users: StoredUser[]) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  }

  // Register with Email or Username + Password
  public register(identifier: string, password: string, email?: string): { success: boolean; message: string; user?: UserProfile } {
    const trimmedId = identifier.trim();
    if (!trimmedId || trimmedId.length < 2) {
      return { success: false, message: 'Username must be at least 2 characters.' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const users = this.getUsersDb();
    const existing = users.find(
      u => u.username.toLowerCase() === trimmedId.toLowerCase() || (u.email && u.email.toLowerCase() === trimmedId.toLowerCase())
    );

    if (existing) {
      return { success: false, message: 'Username or Email is already registered. Please login.' };
    }

    const isEmail = trimmedId.includes('@') || (email && email.includes('@'));
    const chosenUsername = isEmail && !email ? trimmedId.split('@')[0] : trimmedId;
    const chosenEmail = email || (isEmail ? trimmedId : `${chosenUsername.toLowerCase()}@player.local`);

    // Carry over offline coins if earned before signing up
    const localOfflineCoins = this.getLocalCoins();
    const starterCoins = Math.max(250, localOfflineCoins + 50);

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: chosenUsername,
      email: chosenEmail,
      avatarUrl: '🌸',
      role: 'player',
      titleBadge: 'Registered Dasher',
      earnedBadges: ['Registered Dasher', 'Pro Runner'],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      playtimeSeconds: 0,
      stats: {
        highScore: 0,
        coins: starterCoins,
        gems: 10,
        totalDistance: 0,
        highestDifficultyUnlocked: 'story',
        runsPlayed: 0,
        chestsOpened: 0,
        season1Completed: false,
        completedEpisodes: [1],
      },
      wardrobe: this.currentUser?.wardrobe || {
        equippedOutfit: 'basic_tee',
        ownedItems: ['basic_tee'],
        dyeColors: { ...DEFAULT_DYE_COLORS },
      },
      loginStreak: {
        days: 1,
        lastClaimDate: new Date().toDateString(),
      },
      claimedPromos: this.currentUser?.claimedPromos || [],
      preferences: { ...DEFAULT_USER_SETTINGS },
      passwordHash: btoa(password),
    };

    users.push(newUser);
    this.saveUsersDb(users);

    const { passwordHash, ...cleanProfile } = newUser;
    this.currentUser = cleanProfile;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanProfile));
    this.notify();

    return { success: true, message: `Welcome, ${chosenUsername}! Account registered with 250 Coins.`, user: cleanProfile };
  }

  // Login with Email or Username + Password
  public login(identifier: string, password: string): { success: boolean; message: string; user?: UserProfile } {
    const trimmedId = identifier.trim().toLowerCase();
    if (!trimmedId || !password) {
      return { success: false, message: 'Please enter both username/email and password.' };
    }

    const users = this.getUsersDb();
    const user = users.find(
      u => u.username.toLowerCase() === trimmedId || (u.email && u.email.toLowerCase() === trimmedId)
    );

    if (!user) {
      return { success: false, message: 'Account not found. Please register first.' };
    }

    if (user.passwordHash !== btoa(password)) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    user.lastLoginAt = new Date().toISOString();
    this.saveUsersDb(users);

    const { passwordHash, ...cleanProfile } = user;
    this.currentUser = cleanProfile;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanProfile));
    this.notify();

    return { success: true, message: `Welcome back, ${user.username}!`, user: cleanProfile };
  }

  // Logout (no auto-guest fallback)
  public logout() {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    this.notify();
  }

  // Update profile
  public updateProfile(updates: Partial<UserProfile>) {
    if (!this.currentUser) return;

    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));

    if (!this.isGuest()) {
      const users = this.getUsersDb();
      const idx = users.findIndex(u => u.id === this.currentUser?.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        this.saveUsersDb(users);
      }
    }

    this.notify();
  }

  // Add coins (supports both signed-in and offline Story Mode runs)
  public addCoins(amount: number) {
    if (!this.currentUser) {
      const nextLocal = Math.max(0, this.getLocalCoins() + amount);
      try {
        localStorage.setItem(LOCAL_COINS_KEY, String(nextLocal));
      } catch {
        // ignore
      }
      this.progressQuest('quest_coin_hoarder', amount);
      this.notify();
      return;
    }
    const currentCoins = this.currentUser.stats.coins || 0;
    this.updateProfile({
      stats: {
        ...this.currentUser.stats,
        coins: Math.max(0, currentCoins + amount),
      }
    });
    this.progressQuest('quest_coin_hoarder', amount);
  }

  // Add gems
  public addGems(amount: number) {
    if (!this.currentUser) return;
    const currentGems = this.currentUser.stats.gems || 0;
    this.updateProfile({
      stats: {
        ...this.currentUser.stats,
        gems: Math.max(0, currentGems + amount),
      }
    });
  }

  // Promo code redeem
  public redeemPromoCode(code: string): { success: boolean; message: string; coinsAdded?: number } {
    if (!this.currentUser) return { success: false, message: 'User not initialized' };

    const cleanCode = code.trim().toLowerCase();
    const claimed = this.currentUser.claimedPromos || [];

    if (claimed.includes(cleanCode)) {
      return { success: false, message: 'Code already claimed by this player!' };
    }

    if (cleanCode === 'whitelilycookiewand') {
      this.addCoins(200);
      this.updateProfile({ claimedPromos: [...claimed, cleanCode] });
      return { success: true, message: 'Code Redeemed! +200 Coins Added!', coinsAdded: 200 };
    }

    if (cleanCode === 'happynewapps') {
      this.addCoins(150);
      this.updateProfile({ claimedPromos: [...claimed, cleanCode] });
      return { success: true, message: 'Code Redeemed! +150 Coins Added!', coinsAdded: 150 };
    }

    return { success: false, message: 'Invalid promo code. Please check spelling.' };
  }

  // Reset actions requested by user
  public resetLevelUnlocks() {
    if (!this.currentUser) return;
    this.updateProfile({
      stats: {
        ...this.currentUser.stats,
        highestDifficultyUnlocked: 'story',
        completedEpisodes: [1],
      }
    });
    localStorage.setItem('emma_runner_unlocked_levels', JSON.stringify(['story']));
  }

  public resetAllData() {
    localStorage.removeItem('emma_runner_highscore');
    localStorage.removeItem('emma_runner_crystals');
    localStorage.removeItem('emma_runner_upgrades');
    localStorage.removeItem('emma_runner_unlocked_levels');
    localStorage.removeItem(LOCAL_COINS_KEY);
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    this.notify();
  }

  public deleteAccount(): boolean {
    if (!this.currentUser || this.isGuest()) return false;
    const users = this.getUsersDb().filter(u => u.id !== this.currentUser?.id);
    this.saveUsersDb(users);
    this.logout();
    return true;
  }

  // Increment playtime
  public addPlaytime(seconds: number) {
    if (!this.currentUser) return;
    const current = this.currentUser.playtimeSeconds || 0;
    this.updateProfile({ playtimeSeconds: current + seconds });
  }

  // Daily Quests system
  private loadQuests() {
    try {
      const data = localStorage.getItem(QUESTS_KEY);
      this.quests = data ? JSON.parse(data) : INITIAL_DAILY_QUESTS;
    } catch {
      this.quests = INITIAL_DAILY_QUESTS;
    }
  }

  public getQuests(): DailyQuest[] {
    return this.quests;
  }

  public progressQuest(questIdOrType: string, amount: number = 1) {
    let changed = false;
    this.quests = this.quests.map(q => {
      if (q.id === questIdOrType || (questIdOrType === 'rock' && q.id === 'quest_jump_rocks')) {
        const next = Math.min(q.target, q.progress + amount);
        const comp = next >= q.target;
        changed = true;
        return { ...q, progress: next, completed: comp };
      }
      return q;
    });

    if (changed) {
      localStorage.setItem(QUESTS_KEY, JSON.stringify(this.quests));
    }
  }

  public claimQuest(questId: string): boolean {
    const q = this.quests.find(item => item.id === questId);
    if (!q || !q.completed || q.claimed) return false;

    q.claimed = true;
    this.addCoins(q.rewardCoins);
    localStorage.setItem(QUESTS_KEY, JSON.stringify(this.quests));
    return true;
  }

  // Memory Cards system
  private loadMemoryCards() {
    try {
      const data = localStorage.getItem(MEMORY_CARDS_KEY);
      this.memoryCards = data ? JSON.parse(data) : INITIAL_MEMORY_CARDS;
    } catch {
      this.memoryCards = INITIAL_MEMORY_CARDS;
    }
  }

  public getMemoryCards(): MemoryCard[] {
    return this.memoryCards;
  }

  public unlockMemoryCard(episodeId: number) {
    let changed = false;
    this.memoryCards = this.memoryCards.map(c => {
      if (c.episodeId === episodeId && !c.unlocked) {
        changed = true;
        return { ...c, unlocked: true };
      }
      return c;
    });

    if (changed) {
      localStorage.setItem(MEMORY_CARDS_KEY, JSON.stringify(this.memoryCards));
    }
  }

  public updateMemoryCard(cardId: string, updates: Partial<MemoryCard>) {
    this.memoryCards = this.memoryCards.map(c => c.id === cardId ? { ...c, ...updates } : c);
    localStorage.setItem(MEMORY_CARDS_KEY, JSON.stringify(this.memoryCards));
  }

  // Bug report & feedback
  public submitBugReport(type: BugReportItem['type'], title: string, description: string): BugReportItem {
    const report: BugReportItem = {
      id: `bug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: this.currentUser?.id || 'guest',
      type,
      title: title.trim() || 'Visual / Game Glitch Report',
      description: description.trim(),
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent} (${window.innerWidth}x${window.innerHeight})` : 'unknown',
      timestamp: new Date().toISOString(),
      status: 'submitted',
    };

    try {
      const existing = this.getBugReports();
      existing.unshift(report);
      localStorage.setItem(BUG_REPORTS_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch {
      // ignore
    }

    return report;
  }

  public getBugReports(): BugReportItem[] {
    try {
      const data = localStorage.getItem(BUG_REPORTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public submitFeedback(rating: number, category: FeedbackItem['category'], message: string): FeedbackItem {
    const feedback: FeedbackItem = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: this.currentUser?.id || 'guest',
      rating,
      category,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      const existing = this.getFeedback();
      existing.unshift(feedback);
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch {
      // ignore
    }

    return feedback;
  }

  public getFeedback(): FeedbackItem[] {
    try {
      const data = localStorage.getItem(FEEDBACK_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

export const authService = new AuthService();
