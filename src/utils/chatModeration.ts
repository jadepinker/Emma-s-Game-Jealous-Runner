/**
 * Multiplayer Chat Moderation & Rules Engine
 * Blocks profanity, harassment, hate speech, personal info (PII), spam, and suspicious links.
 * Applies escalating warnings -> temporary ban -> permanent ban.
 */

export interface ModerationRecord {
  strikes: number;
  tempBanUntil: number | null; // epoch ms
  permBanned: boolean;
  lastMessages: Array<{ text: string; ts: number }>;
  lastViolationReason?: string;
}

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  strikeCount?: number;
  isTempBanned?: boolean;
  isPermBanned?: boolean;
  banRemainingSeconds?: number;
}

const MODERATION_STORAGE_KEY = 'emma_runner_chat_moderation';

const PROHIBITED_TERMS = [
  // Profanity & explicit
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'cunt',
  'cock', 'whore', 'slut', 'motherfucker', 'bullshit', 'crap', 'damn',
  // Hate speech / slurs
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'tranny', 'chink', 'kike', 'spic',
  // Harassment / severe insults / self-harm
  'kys', 'kill yourself', 'go die', 'die in a fire', 'hope you die',
  'ugly loser', 'you suck', 'kill u', 'murder', 'rape',
];

function normalizeForModeration(input: string): string {
  return input
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[!|]/g, 'i')
    .replace(/(.)\1{2,}/g, '$1$1');
}

function getModerationMap(): Record<string, ModerationRecord> {
  try {
    const raw = localStorage.getItem(MODERATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveModerationMap(map: Record<string, ModerationRecord>) {
  try {
    localStorage.setItem(MODERATION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getModerationStatus(username: string): ModerationRecord {
  const key = username.trim().toLowerCase();
  const map = getModerationMap();
  const existing = map[key] || {
    strikes: 0,
    tempBanUntil: null,
    permBanned: false,
    lastMessages: [],
  };

  // Clear expired temporary ban automatically
  if (existing.tempBanUntil && Date.now() >= existing.tempBanUntil) {
    existing.tempBanUntil = null;
    map[key] = existing;
    saveModerationMap(map);
  }

  return existing;
}

function recordViolation(username: string, reason: string): ModerationResult {
  const key = username.trim().toLowerCase();
  const map = getModerationMap();
  const rec = getModerationStatus(username);

  rec.strikes += 1;
  rec.lastViolationReason = reason;

  if (rec.strikes >= 5) {
    rec.permBanned = true;
    rec.tempBanUntil = null;
  } else if (rec.strikes >= 3) {
    // Temporary 5-minute chat ban
    rec.tempBanUntil = Date.now() + 5 * 60 * 1000;
  }

  map[key] = rec;
  saveModerationMap(map);

  const remaining = rec.tempBanUntil
    ? Math.max(1, Math.ceil((rec.tempBanUntil - Date.now()) / 1000))
    : undefined;

  return {
    allowed: false,
    reason,
    strikeCount: rec.strikes,
    isTempBanned: Boolean(rec.tempBanUntil),
    isPermBanned: rec.permBanned,
    banRemainingSeconds: remaining,
  };
}

export function moderateChatMessage(username: string, rawText: string): ModerationResult {
  const text = rawText.trim();
  if (!text) {
    return { allowed: false, reason: 'Please enter a message before sending.' };
  }

  const status = getModerationStatus(username);
  if (status.permBanned) {
    return {
      allowed: false,
      reason: 'Your chat privileges have been permanently banned due to repeated rule violations.',
      strikeCount: status.strikes,
      isPermBanned: true,
    };
  }

  if (status.tempBanUntil && Date.now() < status.tempBanUntil) {
    const remaining = Math.max(1, Math.ceil((status.tempBanUntil - Date.now()) / 1000));
    return {
      allowed: false,
      reason: `You are temporarily banned from chatting (${remaining}s remaining).`,
      strikeCount: status.strikes,
      isTempBanned: true,
      banRemainingSeconds: remaining,
    };
  }

  // 1. Check prohibited words (profanity, hate speech, harassment)
  const normalized = normalizeForModeration(text);
  const compact = normalized.replace(/[^a-z\s]/g, ' ');
  for (const term of PROHIBITED_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
    if (regex.test(compact) || (term.length >= 5 && compact.replace(/\s+/g, '').includes(term.replace(/\s+/g, '')))) {
      return recordViolation(
        username,
        'Message blocked: Profanity, hate speech, or harassment violates Community Rules.'
      );
    }
  }

  // 2. Check Personal Info (emails, phone numbers, SSNs)
  const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
  if (emailRegex.test(text) || phoneRegex.test(text) || ssnRegex.test(text)) {
    return recordViolation(
      username,
      'Message blocked: Sharing personal info (emails, phone numbers, or addresses) is prohibited.'
    );
  }

  // 3. Check external links / phishing URLs
  const linkRegex = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|gg|io|xyz|co)\b)/i;
  if (linkRegex.test(text)) {
    return recordViolation(
      username,
      'Message blocked: External links and promo URLs are not allowed in lobby chat.'
    );
  }

  // 4. Check Spam (flooding > 4 msgs in 6s, duplicate repeats, excessive char spam)
  const now = Date.now();
  const recent = status.lastMessages.filter((m) => now - m.ts < 6000);
  if (recent.length >= 4) {
    return recordViolation(
      username,
      'Message blocked: Slow down! Sending too many messages rapidly counts as spam.'
    );
  }

  if (recent.some((m) => m.text.toLowerCase() === text.toLowerCase())) {
    return recordViolation(
      username,
      'Message blocked: Please do not repeat the exact same message (spam).'
    );
  }

  if (/(.)\1{9,}/.test(text) || text.length > 200) {
    return recordViolation(
      username,
      'Message blocked: Excessive character spam or message over 200 characters.'
    );
  }

  // Allowed: record message timestamp for flood protection
  const key = username.trim().toLowerCase();
  const map = getModerationMap();
  map[key] = {
    ...status,
    lastMessages: [...recent, { text, ts: now }],
  };
  saveModerationMap(map);

  return { allowed: true };
}
