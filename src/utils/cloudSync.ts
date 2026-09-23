import { supabase } from './supabaseClient';
import { Player, MatchResult, PlayerStats } from '../types/darts';
import { INITIAL_PLAYERS, INITIAL_MATCH_RESULTS, generateAllFixtures } from '../data/initialLeagueData';
import { calculatePlayerStats } from './statsCalculator';

export interface RemoteLeagueState {
  players: Player[];
  matches: MatchResult[];
  adminPin: string;
  lastUpdated: string;
  storageType?: string;
  standings?: any[];
}

// Map database row to Player
function mapPlayerFromDb(row: any): Player {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    nickname: String(row.nickname || ''),
    avatarSeed: row.avatar_seed || undefined,
    avatarBearType: (row.avatar_bear_type as any) || 'smoky',
    active: row.active ?? true,
    joinedDate: row.joined_date || row.created_at || new Date().toISOString(),
  };
}

// Map Player to database row
function mapPlayerToDb(p: Partial<Player>) {
  return {
    id: p.id,
    name: p.name,
    nickname: p.nickname || '',
    avatar_seed: p.avatarSeed || '',
    avatar_bear_type: p.avatarBearType || 'smoky',
    active: p.active ?? true,
    joined_date: p.joinedDate || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Map database row to MatchResult
function mapMatchFromDb(row: any): MatchResult {
  const p1Legs = Number(row.player1_legs || 0);
  const p2Legs = Number(row.player2_legs || 0);
  const isDraw = row.is_draw ?? (p1Legs === 2 && p2Legs === 2);

  return {
    id: String(row.id),
    fixtureId: row.fixture_id || `r${row.round || 1}-${row.player1_id}-${row.player2_id}`,
    round: (row.round as 1 | 2) || 1,
    player1Id: String(row.player1_id),
    player2Id: String(row.player2_id),
    player1Legs: p1Legs,
    player2Legs: p2Legs,
    winnerId: isDraw ? null : (row.winner_id ? String(row.winner_id) : null),
    loserId: isDraw ? null : (row.loser_id ? String(row.loser_id) : null),
    isDraw,
    player1Avg: Number(row.player1_avg || 0),
    player2Avg: Number(row.player2_avg || 0),
    player1180s: Number(row.player1_180s || 0),
    player2180s: Number(row.player2_180s || 0),
    player1HighestCheckout: Number(row.player1_highest_checkout || 0),
    player2HighestCheckout: Number(row.player2_highest_checkout || 0),
    playedAt: row.played_at || row.created_at || new Date().toISOString(),
    notes: row.notes || undefined,
  };
}

// Map MatchResult to database row
function mapMatchToDb(m: MatchResult) {
  const p1Legs = Number(m.player1Legs || 0);
  const p2Legs = Number(m.player2Legs || 0);
  const isDraw = p1Legs === 2 && p2Legs === 2;

  return {
    id: m.id,
    fixture_id: m.fixtureId || null,
    round: m.round || 1,
    player1_id: m.player1Id,
    player2_id: m.player2Id,
    player1_legs: p1Legs,
    player2_legs: p2Legs,
    winner_id: isDraw ? null : (m.winnerId || null),
    loser_id: isDraw ? null : (m.loserId || null),
    player1_avg: Number(m.player1Avg || 0),
    player2_avg: Number(m.player2Avg || 0),
    player1_180s: Number(m.player1180s || 0),
    player2_180s: Number(m.player2180s || 0),
    player1_highest_checkout: Number(m.player1HighestCheckout || 0),
    player2_highest_checkout: Number(m.player2HighestCheckout || 0),
    played_at: m.playedAt || new Date().toISOString(),
    notes: m.notes || '',
  };
}

// Sync computed standings back into Supabase 'standings' table
export async function syncStandingsToSupabase(players: Player[], matches: MatchResult[]) {
  try {
    const stats: PlayerStats[] = calculatePlayerStats(players, matches);
    if (!stats || stats.length === 0) return;

    const rows = stats.map(s => ({
      player_id: s.player.id,
      rank: s.rank,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      legs_for: s.legsFor,
      legs_against: s.legsAgainst,
      leg_diff: s.legDiff,
      points: s.points,
      win_rate: s.winRate,
      overall_average: s.overallAverage,
      highest_average: s.highestAverage,
      total_180s: s.total180s,
      highest_checkout: s.highestCheckout,
      form: s.form,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from('standings').upsert(rows, { onConflict: 'player_id' });
  } catch (err) {
    console.warn('[Supabase] Warning syncing standings table:', err);
  }
}

// Ensure fixture exists in 'fixtures' table to satisfy foreign keys
async function ensureFixtureExists(fixtureId: string | null | undefined, p1Id: string, p2Id: string, round: number) {
  if (!fixtureId) return;
  try {
    await supabase.from('fixtures').upsert({
      id: fixtureId,
      round: round || 1,
      player1_id: p1Id,
      player2_id: p2Id,
      status: 'completed',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] ensureFixtureExists note:', err);
  }
}

// Initialize Supabase tables with initial league seed if database is empty
async function seedInitialSupabaseDataIfEmpty(): Promise<{ players: Player[]; matches: MatchResult[] }> {
  try {
    console.log('[Supabase] Seeding initial league players, fixtures, and matches to Supabase...');
    // 1. Seed Players
    const playerRows = INITIAL_PLAYERS.map(mapPlayerToDb);
    const { error: pErr } = await supabase.from('players').upsert(playerRows);
    if (pErr) console.warn('[Supabase] Error seeding players:', pErr.message);

    // 2. Seed Fixtures (so foreign keys in matches are valid)
    const fixtures = generateAllFixtures(INITIAL_PLAYERS);
    const fixtureRows = fixtures.map(f => ({
      id: f.id,
      round: f.round,
      player1_id: f.player1Id,
      player2_id: f.player2Id,
      status: INITIAL_MATCH_RESULTS.some(m => m.fixtureId === f.id) ? 'completed' : 'unplayed',
      updated_at: new Date().toISOString(),
    }));
    const { error: fErr } = await supabase.from('fixtures').upsert(fixtureRows);
    if (fErr) console.warn('[Supabase] Error seeding fixtures:', fErr.message);

    // 3. Seed Matches
    const matchRows = INITIAL_MATCH_RESULTS.map(mapMatchToDb);
    const { error: mErr } = await supabase.from('matches').upsert(matchRows);
    if (mErr) console.warn('[Supabase] Error seeding matches:', mErr.message);

    // 4. Seed Standings
    await syncStandingsToSupabase(INITIAL_PLAYERS, INITIAL_MATCH_RESULTS);

    return {
      players: INITIAL_PLAYERS,
      matches: INITIAL_MATCH_RESULTS,
    };
  } catch (err) {
    console.warn('[Supabase] Seeding fallback:', err);
    return {
      players: INITIAL_PLAYERS,
      matches: INITIAL_MATCH_RESULTS,
    };
  }
}

// Fetch the complete centralized remote database state directly from Supabase tables
export async function fetchRemoteState(): Promise<RemoteLeagueState | null> {
  try {
    // Direct concurrent queries to Supabase tables
    const [playersRes, matchesRes, pinRes] = await Promise.all([
      supabase.from('players').select('*').order('name', { ascending: true }),
      supabase.from('matches').select('*').order('played_at', { ascending: false }),
      supabase.from('smokebox_league_state').select('payload').eq('id', 'admin_config').maybeSingle(),
    ]);

    if (playersRes.error) {
      console.warn('[Supabase] Error querying players table:', playersRes.error.message);
      throw new Error(playersRes.error.message);
    }

    let players: Player[] = (playersRes.data || []).map(mapPlayerFromDb);
    let matches: MatchResult[] = (matchesRes.data || []).map(mapMatchFromDb);

    // If Supabase players table is empty on fresh database setup, auto-seed default championship roster
    if (players.length === 0) {
      const seeded = await seedInitialSupabaseDataIfEmpty();
      players = seeded.players;
      matches = seeded.matches;
    }

    // Admin PIN retrieval
    let adminPin = '1800';
    if (pinRes.data?.payload?.adminPin) {
      adminPin = String(pinRes.data.payload.adminPin);
    }

    // Opportunistically keep standings table updated
    syncStandingsToSupabase(players, matches).catch(() => {});

    return {
      players,
      matches,
      adminPin,
      lastUpdated: new Date().toISOString(),
      storageType: 'supabase-direct',
    };
  } catch (err) {
    console.warn('[Supabase] Failed to fetch remote state directly from Supabase:', err);
    return null;
  }
}

// Add a player directly in Supabase
export async function remoteAddPlayer(
  player: Partial<Player>
): Promise<{ players: Player[]; lastUpdated: string } | null> {
  try {
    const row = mapPlayerToDb(player);
    const { error } = await supabase.from('players').insert(row);
    if (error) {
      console.error('[Supabase] remoteAddPlayer error:', error.message);
      throw new Error(error.message);
    }

    const { data: allPlayers } = await supabase.from('players').select('*').order('name', { ascending: true });
    const mapped = (allPlayers || []).map(mapPlayerFromDb);
    return { players: mapped, lastUpdated: new Date().toISOString() };
  } catch (err) {
    console.error('[Supabase] remoteAddPlayer failed:', err);
    throw err;
  }
}

// Update the full player roster directly in Supabase
export async function remoteUpdatePlayers(
  players: Player[]
): Promise<{ players: Player[]; lastUpdated: string } | null> {
  try {
    const rows = players.map(mapPlayerToDb);
    const { error } = await supabase.from('players').upsert(rows);
    if (error) {
      console.error('[Supabase] remoteUpdatePlayers error:', error.message);
      throw new Error(error.message);
    }

    const { data: allPlayers } = await supabase.from('players').select('*').order('name', { ascending: true });
    const mapped = (allPlayers || []).map(mapPlayerFromDb);
    return { players: mapped, lastUpdated: new Date().toISOString() };
  } catch (err) {
    console.error('[Supabase] remoteUpdatePlayers failed:', err);
    return null;
  }
}

// Delete player directly from Supabase (with cascade match & standings removal)
export async function remoteDeletePlayer(
  playerId: string
): Promise<{ players: Player[]; matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    // Delete matches involving player first to prevent foreign key errors
    await supabase
      .from('matches')
      .delete()
      .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);

    // Delete standings row
    await supabase.from('standings').delete().eq('player_id', playerId);

    // Delete player record
    const { error } = await supabase.from('players').delete().eq('id', playerId);
    if (error) {
      console.error('[Supabase] remoteDeletePlayer error:', error.message);
      throw new Error(error.message);
    }

    const [playersRes, matchesRes] = await Promise.all([
      supabase.from('players').select('*').order('name', { ascending: true }),
      supabase.from('matches').select('*').order('played_at', { ascending: false }),
    ]);

    const updatedPlayers = (playersRes.data || []).map(mapPlayerFromDb);
    const updatedMatches = (matchesRes.data || []).map(mapMatchFromDb);

    syncStandingsToSupabase(updatedPlayers, updatedMatches).catch(() => {});

    return {
      players: updatedPlayers,
      matches: updatedMatches,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[Supabase] remoteDeletePlayer failed:', err);
    return null;
  }
}

// Record or edit match directly in Supabase
export async function remoteSaveMatch(
  match: MatchResult
): Promise<{ matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    // Ensure fixture exists before match insertion to satisfy foreign key
    if (match.fixtureId) {
      await ensureFixtureExists(match.fixtureId, match.player1Id, match.player2Id, match.round);
    }

    const row = mapMatchToDb(match);
    const { error } = await supabase.from('matches').upsert(row);
    if (error) {
      console.error('[Supabase] remoteSaveMatch error:', error.message);
      throw new Error(error.message);
    }

    const { data: allMatches } = await supabase.from('matches').select('*').order('played_at', { ascending: false });
    const mapped = (allMatches || []).map(mapMatchFromDb);

    // Refresh standings in background
    const { data: allPlayers } = await supabase.from('players').select('*');
    if (allPlayers) {
      syncStandingsToSupabase(allPlayers.map(mapPlayerFromDb), mapped).catch(() => {});
    }

    return { matches: mapped, lastUpdated: new Date().toISOString() };
  } catch (err) {
    console.error('[Supabase] remoteSaveMatch failed:', err);
    return null;
  }
}

// Delete match directly from Supabase
export async function remoteDeleteMatch(
  matchId: string
): Promise<{ matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (error) {
      console.error('[Supabase] remoteDeleteMatch error:', error.message);
      throw new Error(error.message);
    }

    const { data: allMatches } = await supabase.from('matches').select('*').order('played_at', { ascending: false });
    const mapped = (allMatches || []).map(mapMatchFromDb);

    // Refresh standings in background
    const { data: allPlayers } = await supabase.from('players').select('*');
    if (allPlayers) {
      syncStandingsToSupabase(allPlayers.map(mapPlayerFromDb), mapped).catch(() => {});
    }

    return { matches: mapped, lastUpdated: new Date().toISOString() };
  } catch (err) {
    console.error('[Supabase] remoteDeleteMatch failed:', err);
    return null;
  }
}

// Reset to demo data directly in Supabase
export async function remoteResetDemo(): Promise<{ players: Player[]; matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    // Clear all matches first
    await supabase.from('matches').delete().neq('id', '');
    // Clear fixtures
    await supabase.from('fixtures').delete().neq('id', '');
    // Clear all players
    await supabase.from('players').delete().neq('id', '');
    // Clear standings
    await supabase.from('standings').delete().neq('player_id', '');

    // Re-seed demo data
    const playerRows = INITIAL_PLAYERS.map(mapPlayerToDb);
    await supabase.from('players').insert(playerRows);

    const fixtures = generateAllFixtures(INITIAL_PLAYERS);
    const fixtureRows = fixtures.map(f => ({
      id: f.id,
      round: f.round,
      player1_id: f.player1Id,
      player2_id: f.player2Id,
      status: INITIAL_MATCH_RESULTS.some(m => m.fixtureId === f.id) ? 'completed' : 'unplayed',
      updated_at: new Date().toISOString(),
    }));
    await supabase.from('fixtures').insert(fixtureRows);

    const matchRows = INITIAL_MATCH_RESULTS.map(mapMatchToDb);
    await supabase.from('matches').insert(matchRows);

    await syncStandingsToSupabase(INITIAL_PLAYERS, INITIAL_MATCH_RESULTS);

    return {
      players: INITIAL_PLAYERS,
      matches: INITIAL_MATCH_RESULTS,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[Supabase] remoteResetDemo failed:', err);
    return null;
  }
}

// Clear all matches directly in Supabase
export async function remoteClearMatches(): Promise<{ matches: MatchResult[]; lastUpdated: string } | null> {
  try {
    const { error } = await supabase.from('matches').delete().neq('id', '');
    if (error) {
      console.error('[Supabase] remoteClearMatches error:', error.message);
      throw new Error(error.message);
    }

    // Refresh standings with 0 matches
    const { data: allPlayers } = await supabase.from('players').select('*');
    if (allPlayers) {
      syncStandingsToSupabase(allPlayers.map(mapPlayerFromDb), []).catch(() => {});
    }

    return { matches: [], lastUpdated: new Date().toISOString() };
  } catch (err) {
    console.error('[Supabase] remoteClearMatches failed:', err);
    return null;
  }
}

// Update admin PIN in Supabase
export async function remoteUpdatePin(pin: string): Promise<{ lastUpdated: string } | null> {
  try {
    await supabase.from('smokebox_league_state').upsert({
      id: 'admin_config',
      payload: { adminPin: pin },
      updated_at: new Date().toISOString(),
    });
    return { lastUpdated: new Date().toISOString() };
  } catch (err) {
    console.warn('[Supabase] remoteUpdatePin fallback:', err);
    return null;
  }
}

// Realtime subscription listener for multi-device sync (instant mobile & desktop updates)
export function subscribeToLeagueChanges(onChange: () => void): () => void {
  try {
    const channel = supabase
      .channel('smokebox-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'standings' },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[Supabase] Realtime subscription not available, relying on polling:', err);
    return () => {};
  }
}
