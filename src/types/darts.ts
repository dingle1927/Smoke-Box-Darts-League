export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatarSeed?: string;
  avatarBearType?: 'grizzly' | 'smoky' | 'polar' | 'kodiak' | 'bruin';
  active: boolean;
  joinedDate: string;
}

export interface MatchResult {
  id: string;
  fixtureId: string;
  round: 1 | 2;
  player1Id: string;
  player2Id: string;
  player1Legs: number; // 0 to 3 (best of 5)
  player2Legs: number; // 0 to 3
  winnerId: string;
  loserId: string;
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
  form: ('W' | 'L')[];
}

export interface HeadToHeadRecord {
  opponent: Player;
  played: number;
  wins: number;
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
