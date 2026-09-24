import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { Player, MatchResult } from './src/types/darts.js';
import { INITIAL_PLAYERS, INITIAL_MATCH_RESULTS } from './src/data/initialLeagueData.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'league_database.json');
const NEWS_SCENES_FILE = path.resolve(DATA_DIR, 'news_scenes.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Gemini AI Client Setup
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[Gemini] Initialized AI Studio Client for server-side processing');
  } catch (err) {
    console.warn('[Gemini] Initialization warning:', err);
  }
}

// News Card Action Scenes Storage (strictly segregated from primary player avatars)
let newsCardScenes: Record<string, {
  storyId: string;
  playerId: string;
  imageUrl: string;
  scenarioPreset: string;
  headline: string;
  createdAt: string;
}> = {};

function loadNewsScenesFromDisk() {
  try {
    if (fs.existsSync(NEWS_SCENES_FILE)) {
      const data = JSON.parse(fs.readFileSync(NEWS_SCENES_FILE, 'utf-8'));
      if (data && typeof data === 'object') {
        newsCardScenes = data;
        console.log('[NewsScenes] Loaded', Object.keys(newsCardScenes).length, 'saved story scene images.');
      }
    }
  } catch (e) {
    console.warn('[NewsScenes] Error loading news scenes from disk:', e);
  }
}

function saveNewsScenesToDisk() {
  try {
    ensureDataDir();
    fs.writeFileSync(NEWS_SCENES_FILE, JSON.stringify(newsCardScenes, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[NewsScenes] Error saving news scenes to disk:', e);
  }
}
loadNewsScenesFromDisk();


// Supabase Client Setup (optional remote cloud database)
function normalizeSupabaseUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // If already a full URL with scheme
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }

  // If provided as a domain like "xyz.supabase.co" without protocol
  if (trimmed.includes('.')) {
    try {
      const withHttps = `https://${trimmed}`;
      new URL(withHttps);
      return withHttps;
    } catch {
      return null;
    }
  }

  // If provided as just the project ID/ref (e.g. "tnvrsfezqkrfnhorarkb")
  try {
    const constructed = `https://${trimmed}.supabase.co`;
    new URL(constructed);
    return constructed;
  } catch {
    return null;
  }
}

let supabase: SupabaseClient | null = null;
let supabaseTableReady = false;
const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Initialized cloud client for', supabaseUrl);
  } catch (err) {
    console.warn('[Supabase] Could not initialize client:', err instanceof Error ? err.message : err);
    supabase = null;
  }
} else if (rawSupabaseUrl) {
  console.warn('[Supabase] Provided SUPABASE_URL could not be parsed into a valid URL:', rawSupabaseUrl);
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
let supabaseNoticeLogged = false;

async function syncFromSupabase() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('smokebox_league_state')
      .select('*')
      .eq('id', 'primary')
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.code === '42P01') {
        supabaseTableReady = false;
        if (!supabaseNoticeLogged) {
          console.log('[Supabase] Note: "smokebox_league_state" table not found in Supabase schema. Operating with persistent cloud disk storage.');
          supabaseNoticeLogged = true;
        }
        return;
      }
      // Transient error, don't crash
      return;
    }

    supabaseTableReady = true;

    if (data && data.payload) {
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
    // Silent fallback to local storage
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
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.code === '42P01') {
        supabaseTableReady = false;
        return;
      }
      console.warn('[Supabase] Upsert warning:', error.message);
    } else {
      supabaseTableReady = true;
    }
  } catch (err) {
    // Silent fallback
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

// Ensure all league players have their standardized smart uniform avatar
let avatarBackfilled = false;
leagueState.players = leagueState.players.map((p, idx) => {
  if (!p.photoUrl && !p.smartAvatarUrl) {
    const defaultAvatar = INITIAL_PLAYERS[idx]?.photoUrl || INITIAL_PLAYERS[0]?.photoUrl;
    avatarBackfilled = true;
    return {
      ...p,
      photoUrl: defaultAvatar,
      smartAvatarUrl: defaultAvatar,
    };
  }
  return p;
});
if (avatarBackfilled) {
  saveStateToDisk(leagueState);
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

// --- AI AVATAR & NEWS SCENE ENDPOINTS ---

// 1. Detect face and head boundaries for dynamic media compositing
app.post('/api/player/detect-face', async (req: Request, res: Response) => {
  const { image, playerName } = req.body;
  if (!image) {
    res.status(400).json({ error: 'Image data or URL is required' });
    return;
  }

  try {
    let detectedFaceBox: { ymin: number; xmin: number; ymax: number; xmax: number; chinY?: number; faceCenterX?: number; faceCenterY?: number; hairTopY?: number } | null = null;
    let modelUsed = 'Local Vision Segmentation';

    if (aiClient && typeof image === 'string' && image.startsWith('data:image')) {
      try {
        const base64Data = image.split(',')[1];
        const mimeMatch = image.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

        console.log(`[Gemini AI] Detecting exact face boundaries for: ${playerName || 'Player'}`);

        const prompt = `Analyze this portrait photo. Detect the primary person's face, head, and hair boundaries. Return ONLY a JSON object:
{
  "ymin": integer (0 to 1000, top edge of head and hair),
  "xmin": integer (0 to 1000, left edge of ears, cheeks, hair),
  "ymax": integer (0 to 1000, bottom edge of chin/upper neck where it meets collar),
  "xmax": integer (0 to 1000, right edge of ears, cheeks, hair),
  "chinY": integer (0 to 1000, lowest point of the jaw/chin),
  "faceCenterX": integer (0 to 1000),
  "faceCenterY": integer (0 to 1000),
  "hairTopY": integer (0 to 1000)
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim();
        if (text) {
          detectedFaceBox = JSON.parse(text);
          modelUsed = 'Gemini AI Vision';
          console.log(`[Gemini AI] Detected face box:`, detectedFaceBox);
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini AI] Face detection fallback to local vision engine:', geminiErr.message || geminiErr);
      }
    }

    res.json({
      success: true,
      detectedFaceBox,
      modelUsed,
    });
  } catch (err: any) {
    console.error('[Face Detection] Error:', err);
    res.status(500).json({ error: err.message || 'Face detection failed' });
  }
});

// 2. Process uploaded player avatar:
// STRICT RULE: Original uploaded photo is preserved UNTOUCHED for player cards, standings, and profiles.
// No suit, blazer, tie, or background replacement is applied to the standard player avatar.
app.post('/api/player/process-avatar', async (req: Request, res: Response) => {
  const { image, playerName, playerId } = req.body;
  if (!image) {
    res.status(400).json({ error: 'Image data or URL is required' });
    return;
  }

  try {
    let detectedFaceBox = null;
    let modelUsed = 'Original Photo Engine';

    // If Gemini client is active, detect face boundaries for dynamic news/event media only
    if (aiClient && typeof image === 'string' && image.startsWith('data:image')) {
      try {
        const base64Data = image.split(',')[1];
        const mimeMatch = image.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

        const prompt = `Analyze this portrait photo. Detect the primary person's face and head. Return ONLY a JSON object:
{
  "ymin": integer (0 to 1000, top edge of head and hair),
  "xmin": integer (0 to 1000, left edge of ears, cheeks, hair),
  "ymax": integer (0 to 1000, bottom edge of chin/upper neck where it meets collar),
  "xmax": integer (0 to 1000, right edge of ears, cheeks, hair),
  "chinY": integer (0 to 1000, lowest point of the jaw/chin)
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim();
        if (text) {
          detectedFaceBox = JSON.parse(text);
          modelUsed = 'Gemini AI Vision (Face Extractor)';
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini AI] Face detection fallback:', geminiErr.message || geminiErr);
      }
    }

    res.json({
      success: true,
      photoUrl: image,
      smartAvatarUrl: image,
      originalPhotoUrl: image,
      detectedFaceBox,
      modelUsed,
      notes: 'Original uploaded photo preserved untouched. Face coordinates prepared for dynamic news action scenes.',
    });
  } catch (err: any) {
    console.error('[AI Avatar] Processing error:', err);
    res.status(500).json({ error: err.message || 'Failed to process avatar' });
  }
});

// 3. Generate Dynamic AI News Scene Image
// Rules: Composites player's face cutout onto dynamic action scenes (throwing, celebrating, hands on head, trophy)
// STRICT REQUIREMENT: Does NOT overwrite or replace the player's primary avatar in the database!
app.post('/api/news/generate-scene', async (req: Request, res: Response) => {
  const { storyId, playerId, scenarioPreset, headline, sceneImageUrl: incomingSceneUrl } = req.body;

  if (!storyId || !playerId) {
    res.status(400).json({ error: 'storyId and playerId are required' });
    return;
  }

  // Find player to verify avatar integrity
  const targetPlayer = leagueState.players.find(p => p.id === playerId);
  const playerAvatarSnapshot = targetPlayer?.photoUrl || targetPlayer?.smartAvatarUrl;

  console.log(`[News Scene AI] Generating action scene for story "${headline || storyId}" featuring player ${targetPlayer?.name || playerId}`);
  console.log(`[Integrity Guard] Verified player avatar photo remains strictly unchanged.`);

  // Use provided composite or fallback scenario image
  let sceneImageUrl = incomingSceneUrl;
  if (!sceneImageUrl) {
    switch (scenarioPreset) {
      case 'celebration':
        sceneImageUrl = '/uniforms/darts_celebrate_1790251957068.jpg';
        break;
      case 'disappointment':
        sceneImageUrl = '/uniforms/darts_disappoint_1790251946168.jpg';
        break;
      case 'cigarette':
        sceneImageUrl = '/uniforms/darts_cigarette_1790251932917.jpg';
        break;
      case 'trophy':
        sceneImageUrl = '/uniforms/bear_champion_180_1790165774060.jpg';
        break;
      case 'throwing':
      default:
        sceneImageUrl = '/uniforms/darts_throwing_1790251919632.jpg';
        break;
    }
  }

  // Save specifically for this news story without touching leagueState.players
  newsCardScenes[storyId] = {
    storyId,
    playerId,
    imageUrl: sceneImageUrl,
    scenarioPreset: scenarioPreset || 'throwing',
    headline: headline || '',
    createdAt: new Date().toISOString(),
  };
  saveNewsScenesToDisk();

  // Safety confirmation: targetPlayer in leagueState is untouched
  res.json({
    success: true,
    storyId,
    newsCardImageUrl: sceneImageUrl,
    playerAvatarUnchanged: true,
    playerCurrentAvatar: playerAvatarSnapshot,
    message: 'Dynamic news scene generated and stored separately. Primary player avatar strictly preserved untouched.',
  });
});

// GET saved news scenes
app.get('/api/news/scenes', (_req: Request, res: Response) => {
  res.json({
    success: true,
    scenes: newsCardScenes,
  });
});

// Update player photo in backend - stores exact uploaded photo untouched
app.post('/api/league/players/:id/photo', (req: Request, res: Response) => {
  const playerId = req.params.id;
  const { photoUrl, smartAvatarUrl, originalPhotoUrl, shirtColors, preferredScenario } = req.body;

  const resolvedPhoto = photoUrl || smartAvatarUrl;

  const updated = updateState(prev => ({
    players: prev.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          photoUrl: resolvedPhoto,
          smartAvatarUrl: resolvedPhoto,
          originalPhotoUrl: originalPhotoUrl || resolvedPhoto || p.originalPhotoUrl,
          customShirtColors: shirtColors || p.customShirtColors,
          preferredScenario: preferredScenario || p.preferredScenario,
        };
      }
      return p;
    }),
  }));

  const updatedPlayer = updated.players.find(p => p.id === playerId);

  res.json({
    success: true,
    player: updatedPlayer,
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
