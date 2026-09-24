export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatarSeed?: string;
  photoUrl?: string; // Standardized smart headshot (white shirt, blue tie, black blazer, clean gray background)
  smartAvatarUrl?: string; // Standardized smart avatar headshot stored in Supabase
  originalPhotoUrl?: string; // Original uploaded face photo before AI styling
  avatarBearType?: 'grizzly' | 'smoky' | 'polar' | 'kodiak' | 'bruin';
  active: boolean;
  joinedDate: string;
  customShirtColors?: {
    primary: string; // strictly never green
    secondary: string;
    collar: string;
  };
  preferredScenario?: 'throwing' | 'cigarette' | 'disappointment' | 'celebration';
}

export type ScenarioPreset = 'throwing' | 'cigarette' | 'disappointment' | 'celebration' | 'trophy';

export interface AINewsItem {
  id: string;
  headline: string;
  category: 'upset' | 'streak' | 'titlerace' | 'games_in_hand' | '180_barrage' | 'checkout' | 'draw_drama' | 'spotlight';
  summary: string;
  article: string;
  primaryPlayerId: string;
  secondaryPlayerId?: string;
  timestamp: string;
  matchId?: string;
  scenarioPreset: ScenarioPreset;
  scenarioTitle: string;
  customPrompt: string;
  importance: 'breaking' | 'high' | 'featured' | 'standard';
  newsCardImageUrl?: string; // Dynamic AI scene image generated specifically for this news story
  newsCardScenePrompt?: string; // Custom prompt used to generate this news scene
}


export interface MatchResult {
  id: string;
  fixtureId: string;
  round: 1 | 2;
  player1Id: string;
  player2Id: string;
  player1Legs: number; // 0 to 4 (fixed 4 legs per game)
  player2Legs: number; // 0 to 4
  winnerId: string | null; // null if draw (2-2)
  loserId: string | null; // null if draw (2-2)
  isDraw?: boolean;
  player1Avg: number; // 3-dart average
  player2Avg: number;
  player1180s: number;
  player2180s: number;
  player1HighestCheckout: number;
  player2HighestCheckout: number;
  playedAt: string; // ISO string
  notes?: string;
}

export interface Fixture {
  id: string;
  round: 1 | 2;
  player1Id: string;
  player2Id: string;
  status: 'unplayed' | 'completed';
  matchResult?: MatchResult;
}

export interface PlayerStats {
  rank: number;
  player: Player;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  legsFor: number;
  legsAgainst: number;
  legDiff: number;
  points: number;
  winRate: number; // percentage (0 - 100)
  overallAverage: number; // 3-dart overall average
  highestAverage: number;
  total180s: number;
  highestCheckout: number;
  form: ('W' | 'D' | 'L')[];
}

export interface HeadToHeadRecord {
  opponent: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  legsFor: number;
  legsAgainst: number;
  matches: MatchResult[];
  unplayedCount: number;
}

export interface SessionMatch {
  fixtureId: string;
  round: 1 | 2;
  player1Id: string;
  player2Id: string;
  order: number;
  boardNumber?: number;
  reason: string;
}
