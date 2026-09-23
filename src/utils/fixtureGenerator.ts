import { Player, MatchResult, Fixture, SessionMatch } from '../types/darts';
import { generateAllFixtures } from '../data/initialLeagueData';

export interface GeneratedScheduleResult {
  allEligibleUnplayed: {
    fixture: Fixture;
    p1: Player;
    p2: Player;
    round: 1 | 2;
    urgency: number;
  }[];
  recommendedMatches: SessionMatch[];
  playerGameCounts: Record<string, number>;
  totalAvailableMatches: number;
}

/**
 * Generates an optimized session schedule for the available players.
 * Respects unplayed fixtures in the double round-robin format.
 * Balances playing time and avoids consecutive matches for the same player when possible.
 */
export function generateSessionSchedule(
  availablePlayerIds: string[],
  allPlayers: Player[],
  completedMatches: MatchResult[],
  maxMatchesForSession: number = 10,
  boardCount: number = 1
): GeneratedScheduleResult {
  const playerMap = new Map(allPlayers.map(p => [p.id, p]));
  const availableSet = new Set(availablePlayerIds);

  // Generate full double round-robin
  const allFixtures = generateAllFixtures(allPlayers);
  const completedMap = new Map<string, MatchResult>();
  completedMatches.forEach(m => completedMap.set(m.fixtureId, m));

  // Filter to unplayed fixtures between ONLY available players
  const eligibleUnplayed: {
    fixture: Fixture;
    p1: Player;
    p2: Player;
    round: 1 | 2;
    urgency: number;
  }[] = [];

  allFixtures.forEach(fix => {
    // Check if both players are present
    if (availableSet.has(fix.player1Id) && availableSet.has(fix.player2Id)) {
      // Check if not yet completed
      if (!completedMap.has(fix.id)) {
        const p1 = playerMap.get(fix.player1Id);
        const p2 = playerMap.get(fix.player2Id);
        if (p1 && p2) {
          // Priority: Round 1 matches come first (urgency = 2), Round 2 comes second (urgency = 1)
          const urgency = fix.round === 1 ? 2 : 1;
          eligibleUnplayed.push({
            fixture: fix,
            p1,
            p2,
            round: fix.round,
            urgency,
          });
        }
      }
    }
  });

  // Sort eligible by round first (Round 1 prioritized)
  eligibleUnplayed.sort((a, b) => {
    if (b.urgency !== a.urgency) return b.urgency - a.urgency;
    return a.fixture.id.localeCompare(b.fixture.id);
  });

  // Scheduling algorithm: Greedy selection with rest constraints
  const pool = [...eligibleUnplayed];
  const recommendedMatches: SessionMatch[] = [];
  const playerGameCounts: Record<string, number> = {};
  availablePlayerIds.forEach(id => {
    playerGameCounts[id] = 0;
  });

  let lastP1 = '';
  let lastP2 = '';
  let lastP1Board2 = '';
  let lastP2Board2 = '';

  const targetCount = Math.min(pool.length, maxMatchesForSession);

  for (let step = 0; step < targetCount; step++) {
    if (pool.length === 0) break;

    // Score candidates based on:
    // 1. Neither player just played in previous match (avoid fatigue / give rest)
    // 2. Both players have played fewest matches so far (fair rotation)
    // 3. Round 1 priority
    let bestIndex = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const p1Id = candidate.p1.id;
      const p2Id = candidate.p2.id;

      let score = 100;

      // Penalize heavily if played immediately prior
      if (p1Id === lastP1 || p1Id === lastP2) score -= 45;
      if (p2Id === lastP1 || p2Id === lastP2) score -= 45;

      // Fair games count penalty: lower played = higher priority
      const countP1 = playerGameCounts[p1Id] || 0;
      const countP2 = playerGameCounts[p2Id] || 0;
      score -= (countP1 + countP2) * 15;

      // Round 1 priority bonus
      if (candidate.round === 1) score += 20;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex !== -1) {
      const selected = pool.splice(bestIndex, 1)[0];
      const p1Id = selected.p1.id;
      const p2Id = selected.p2.id;

      playerGameCounts[p1Id] = (playerGameCounts[p1Id] || 0) + 1;
      playerGameCounts[p2Id] = (playerGameCounts[p2Id] || 0) + 1;

      const boardNum = boardCount > 1 ? (step % boardCount) + 1 : 1;

      let reason = `Round ${selected.round} Fixture`;
      if (selected.round === 1) {
        reason = 'Round 1 Unplayed League Match';
      } else {
        reason = 'Round 2 Return Match';
      }

      recommendedMatches.push({
        fixtureId: selected.fixture.id,
        round: selected.round,
        player1Id: p1Id,
        player2Id: p2Id,
        order: step + 1,
        boardNumber: boardNum,
        reason,
      });

      lastP1 = p1Id;
      lastP2 = p2Id;
    }
  }

  return {
    allEligibleUnplayed: eligibleUnplayed,
    recommendedMatches,
    playerGameCounts,
    totalAvailableMatches: eligibleUnplayed.length,
  };
}
