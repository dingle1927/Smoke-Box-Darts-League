import { Player, MatchResult } from '../types/darts';

export interface RemoteLeagueState {
  players: Player[];
  matches: MatchResult[];
  adminPin: string;
  lastUpdated: string;
  storageType?: string;
}

const API_BASE = '/api/league';

// Fetch the complete centralized remote database state
export async function fetchRemoteState(): Promise<RemoteLeagueState | null> {
  try {
    const res = await fetch(`${API_BASE}/state`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (!res.ok) {
      throw new Error(`Remote API returned status ${res.status}`);
    }
    const data: RemoteLeagueState = await res.json();
    return data;
  } catch (err) {
    console.warn('[CloudSync] Failed to fetch remote state, checking fallback:', err);
    return null;
  }
}

// Add a player remotely
export async function remoteAddPlayer(player: Partial<Player>): Promise<{ players: Player[]; lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add player');
    }
    const data = await res.json();
    return { players: data.players, lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteAddPlayer error:', err);
    throw err;
  }
}

// Update the full player roster remotely
export async function remoteUpdatePlayers(players: Player[]): Promise<{ players: Player[]; lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/players`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players }),
    });
    if (!res.ok) {
      throw new Error('Failed to update players');
    }
    const data = await res.json();
    return { players: data.players, lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteUpdatePlayers error:', err);
    return null;
  }
}

// Delete player remotely (with cascade match removal)
export async function remoteDeletePlayer(
  playerId: string
): Promise<{ players: Player[]; matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/players/${encodeURIComponent(playerId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete player');
    }
    const data = await res.json();
    return { players: data.players, matches: data.matches, lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteDeletePlayer error:', err);
    return null;
  }
}

// Record or edit match remotely
export async function remoteSaveMatch(
  match: MatchResult
): Promise<{ matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(match),
    });
    if (!res.ok) {
      throw new Error('Failed to save match');
    }
    const data = await res.json();
    return { matches: data.matches, lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteSaveMatch error:', err);
    return null;
  }
}

// Undo/Delete match remotely
export async function remoteDeleteMatch(
  matchId: string
): Promise<{ matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(matchId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete match');
    }
    const data = await res.json();
    return { matches: data.matches, lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteDeleteMatch error:', err);
    return null;
  }
}

// Reset to demo data remotely
export async function remoteResetDemo(): Promise<{ players: Player[]; matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/reset`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Failed to reset demo');
    }
    const data = await res.json();
    return { players: data.players, matches: data.matches, lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteResetDemo error:', err);
    return null;
  }
}

// Clear all matches remotely
export async function remoteClearMatches(): Promise<{ matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/clear-matches`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Failed to clear matches');
    }
    const data = await res.json();
    return { matches: data.matches, lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteClearMatches error:', err);
    return null;
  }
}

// Update admin PIN remotely
export async function remoteUpdatePin(pin: string): Promise<{ lastUpdated: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      throw new Error('Failed to update pin');
    }
    const data = await res.json();
    return { lastUpdated: data.lastUpdated };
  } catch (err) {
    console.error('[CloudSync] remoteUpdatePin error:', err);
    return null;
  }
}
