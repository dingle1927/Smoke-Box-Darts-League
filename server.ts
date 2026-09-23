import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Player, MatchResult } from './src/types/darts.js';
import { INITIAL_PLAYERS, INITIAL_MATCH_RESULTS } from './src/data/initialLeagueData.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'league_database.json');

app.use(express.json({ limit: '10mb' }));

// Supabase Client Setup (optional remote cloud database)
let supabase: SupabaseClient | null = null;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Initialized cloud connection to', supabaseUrl);
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err);
  }
}

interface LeagueState {
  players: Player[];
  matches: MatchResult[];
  adminPin: string;
  lastUpdated: string;
}

// In-Memory state
let leagueState: LeagueState = {
  players: INITIAL_PLAYERS,
  matches: INITIAL_MATCH_RESULTS,
  adminPin: 'smokebox',
  lastUpdated: new Date().toISOString(),
};

// Initialize disk storage
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveStateToDisk(state: LeagueState) {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Failed to save state to disk:', err);
  }
}

function loadStateFromDisk(): LeagueState | null {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.players) && Array.isArray(parsed.matches)) {
        return {
          players: parsed.players,
          matches: parsed.matches,
          adminPin: parsed.adminPin || 'smokebox',
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('[DB] Failed to load state from disk:', err);
  }
  return null;
}

// Sync with Supabase if configured
async function syncFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('smokebox_league_state')
      .select('*')
      .eq('id', 'primary')
      .single();

    if (!error && data && data.payload) {
      const cloudPayload = data.payload as LeagueState;
      if (
        !leagueState.lastUpdated ||
        new Date(cloudPayload.lastUpdated).getTime() > new Date(leagueState.lastUpdated).getTime()
      ) {
        leagueState = cloudPayload;
        saveStateToDisk(leagueState);
        console.log('[Supabase] Synced newer state from Supabase:', leagueState.lastUpdated);
      }
    }
  } catch (err) {
    console.warn('[Supabase] Sync read error (will use local cloud store):', err);
  }
}

async function persistToSupabase(state: LeagueState) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('smokebox_league_state').upsert({
      id: 'primary',
      payload: state,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('[Supabase] Upsert warning:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Error writing state to Supabase:', err);
  }
}

// Initialize state on startup
const diskState = loadStateFromDisk();
if (diskState) {
  leagueState = diskState;
  console.log('[DB] Loaded existing league state with', leagueState.players.length, 'players and', leagueState.matches.length, 'matches.');
} else {
  saveStateToDisk(leagueState);
  console.log('[DB] Initialized fresh league database with demo seed.');
}

// Initial async check to Supabase
if (supabase) {
  syncFromSupabase().catch(() => {});
}

function updateState(updater: (current: LeagueState) => Partial<LeagueState>) {
  const updates = updater(leagueState);
  leagueState = {
    ...leagueState,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  saveStateToDisk(leagueState);
  persistToSupabase(leagueState).catch(() => {});
  return leagueState;
}

// --- API ROUTES ---

// Health & Info
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    storage: supabase ? 'supabase' : 'cloud-json-endpoint',
    lastUpdated: leagueState.lastUpdated,
    playersCount: leagueState.players.length,
    matchesCount: leagueState.matches.length,
  });
});

// GET full league state
app.get('/api/league/state', async (_req: Request, res: Response) => {
  // If supabase is connected, opportunistically check for updates
  if (supabase) {
    await syncFromSupabase().catch(() => {});
  }
  res.json({
    ...leagueState,
    storageType: supabase ? 'supabase' : 'cloud-json',
  });
});

// POST new player
app.post('/api/league/players', (req: Request, res: Response) => {
  const newPlayer: Player = req.body;
  if (!newPlayer || !newPlayer.name) {
    res.status(400).json({ error: 'Player name is required' });
    return;
  }

  if (leagueState.players.length >= 30) {
    res.status(400).json({ error: 'Roster full (maximum 30 players)' });
    return;
  }

  const playerToAdd: Player = {
    id: newPlayer.id || `p-${Date.now()}`,
    name: newPlayer.name.trim(),
    nickname: newPlayer.nickname?.trim() || 'The Bear',
    avatarBearType: newPlayer.avatarBearType || 'grizzly',
    active: newPlayer.active !== undefined ? newPlayer.active : true,
    joinedDate: newPlayer.joinedDate || new Date().toISOString().split('T')[0],
  };

  const updated = updateState(prev => ({
    players: [...prev.players, playerToAdd],
  }));

  res.json({
    success: true,
    player: playerToAdd,
    players: updated.players,
    lastUpdated: updated.lastUpdated,
  });
});

// PUT update full players roster
app.put('/api/league/players', (req: Request, res: Response) => {
  const { players } = req.body;
  if (!Array.isArray(players)) {
    res.status(400).json({ error: 'players array is required' });
    return;
  }

  const updated = updateState(() => ({
    players,
  }));

  res.json({
    success: true,
    players: updated.players,
    lastUpdated: updated.lastUpdated,
  });
});

// DELETE player (with cascade match removal)
app.delete('/api/league/players/:id', (req: Request, res: Response) => {
  const playerId = req.params.id;
  if (!playerId) {
    res.status(400).json({ error: 'Player id is required' });
    return;
  }

  const updated = updateState(prev => ({
    players: prev.players.filter(p => p.id !== playerId),
    matches: prev.matches.filter(m => m.player1Id !== playerId && m.player2Id !== playerId),
  }));

  res.json({
    success: true,
    removedPlayerId: playerId,
    players: updated.players,
    matches: updated.matches,
    lastUpdated: updated.lastUpdated,
  });
});

// POST save / update match result
app.post('/api/league/matches', (req: Request, res: Response) => {
  const match: MatchResult = req.body;
  if (!match || !match.player1Id || !match.player2Id) {
    res.status(400).json({ error: 'Valid match result required' });
    return;
  }

  const updated = updateState(prev => {
    // Single round-robin: only one match per pair in the league season
    const existingIndex = prev.matches.findIndex(
      m =>
        m.id === match.id ||
        m.fixtureId === match.fixtureId ||
        (m.player1Id === match.player1Id && m.player2Id === match.player2Id) ||
        (m.player1Id === match.player2Id && m.player2Id === match.player1Id)
    );
    if (existingIndex >= 0) {
      const nextMatches = [...prev.matches];
      nextMatches[existingIndex] = match;
      return { matches: nextMatches };
    }
    return { matches: [...prev.matches, match] };
  });

  res.json({
    success: true,
    match,
    matches: updated.matches,
    lastUpdated: updated.lastUpdated,
  });
});

// DELETE match result
app.delete('/api/league/matches/:id', (req: Request, res: Response) => {
  const matchId = req.params.id;
  if (!matchId) {
    res.status(400).json({ error: 'Match id is required' });
    return;
  }

  const updated = updateState(prev => ({
    matches: prev.matches.filter(m => m.id !== matchId),
  }));

  res.json({
    success: true,
    removedMatchId: matchId,
    matches: updated.matches,
    lastUpdated: updated.lastUpdated,
  });
});

// POST reset demo data
app.post('/api/league/reset', (_req: Request, res: Response) => {
  const updated = updateState(() => ({
    players: INITIAL_PLAYERS,
    matches: INITIAL_MATCH_RESULTS,
  }));

  res.json({
    success: true,
    players: updated.players,
    matches: updated.matches,
    lastUpdated: updated.lastUpdated,
  });
});

// POST clear all matches
app.post('/api/league/clear-matches', (_req: Request, res: Response) => {
  const updated = updateState(() => ({
    matches: [],
  }));

  res.json({
    success: true,
    matches: [],
    lastUpdated: updated.lastUpdated,
  });
});

// POST update admin PIN
app.post('/api/league/pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    res.status(400).json({ error: 'Valid pin is required' });
    return;
  }

  const updated = updateState(() => ({
    adminPin: pin,
  }));

  res.json({
    success: true,
    lastUpdated: updated.lastUpdated,
  });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[The Smoke Box Server] Running at http://0.0.0.0:${PORT}`);
    console.log(`[Storage Mode] Centralized Cloud Endpoint + ${supabase ? 'Supabase' : 'Persistent Cloud JSON Storage'}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
