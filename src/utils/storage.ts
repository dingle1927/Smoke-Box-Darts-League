import { Player, MatchResult, Fixture } from '../types/darts';
import { INITIAL_PLAYERS, INITIAL_MATCH_RESULTS, generateAllFixtures } from '../data/initialLeagueData';

const PLAYERS_KEY = 'smokebox_players_v1';
const MATCHES_KEY = 'smokebox_matches_v1';
const ADMIN_PIN_KEY = 'smokebox_admin_pin_v1';
const DEFAULT_PIN = 'smokebox';

export function getStoredPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load players from localStorage', e);
  }
  // Initialize with seed
  saveStoredPlayers(INITIAL_PLAYERS);
  return INITIAL_PLAYERS;
}

export function saveStoredPlayers(players: Player[]): void {
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch (e) {
    console.error('Failed to save players to localStorage', e);
  }
}

export function getStoredMatches(): MatchResult[] {
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load matches from localStorage', e);
  }
  // Initialize with seed
  saveStoredMatches(INITIAL_MATCH_RESULTS);
  return INITIAL_MATCH_RESULTS;
}

export function saveStoredMatches(matches: MatchResult[]): void {
  try {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  } catch (e) {
    console.error('Failed to save matches to localStorage', e);
  }
}

export function getStoredAdminPin(): string {
  try {
    return localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export function saveStoredAdminPin(pin: string): void {
  try {
    localStorage.setItem(ADMIN_PIN_KEY, pin);
  } catch (e) {
    console.error('Failed to save admin pin', e);
  }
}

export function getLeagueFixtures(players: Player[], matches: MatchResult[]): Fixture[] {
  const allFixtures = generateAllFixtures(players);
  const matchMap = new Map<string, MatchResult>();
  matches.forEach(m => matchMap.set(m.fixtureId, m));

  return allFixtures.map(fix => {
    const res = matchMap.get(fix.id);
    if (res) {
      return {
        ...fix,
        status: 'completed' as const,
        matchResult: res,
      };
    }
    return fix;
  });
}

export function resetToDemoData(): { players: Player[]; matches: MatchResult[] } {
  saveStoredPlayers(INITIAL_PLAYERS);
  saveStoredMatches(INITIAL_MATCH_RESULTS);
  return { players: INITIAL_PLAYERS, matches: INITIAL_MATCH_RESULTS };
}

export function clearAllMatches(): MatchResult[] {
  saveStoredMatches([]);
  return [];
}

export function exportLeagueData(): string {
  const data = {
    league: 'The Smoke Box Darts League',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    players: getStoredPlayers(),
    matches: getStoredMatches(),
  };
  return JSON.stringify(data, null, 2);
}

export function importLeagueData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (Array.isArray(data.players) && Array.isArray(data.matches)) {
      saveStoredPlayers(data.players);
      saveStoredMatches(data.matches);
      return true;
    }
  } catch (e) {
    console.error('Failed to import data', e);
  }
  return false;
}
