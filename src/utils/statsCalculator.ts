import { Player, MatchResult, PlayerStats, HeadToHeadRecord } from '../types/darts';

export function calculatePlayerStats(players: Player[], matches: MatchResult[]): PlayerStats[] {
  const activePlayers = players.filter(p => p.active);

  // Initialize stats for each player
  const statsMap = new Map<string, {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    legsFor: number;
    legsAgainst: number;
    points: number;
    matchAverages: { avg: number; legs: number }[];
    highestAverage: number;
    total180s: number;
    highestCheckout: number;
    matches: MatchResult[];
  }>();

  activePlayers.forEach(p => {
    statsMap.set(p.id, {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      legsFor: 0,
      legsAgainst: 0,
      points: 0,
      matchAverages: [],
      highestAverage: 0,
      total180s: 0,
      highestCheckout: 0,
      matches: [],
    });
  });

  // Sort matches chronologically
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
  );

  sortedMatches.forEach(m => {
    const isP1Active = statsMap.has(m.player1Id);
    const isP2Active = statsMap.has(m.player2Id);
    const isDraw = m.player1Legs === m.player2Legs;
    const isP1Winner = !isDraw && (m.winnerId === m.player1Id || m.player1Legs > m.player2Legs);
    const isP2Winner = !isDraw && (m.winnerId === m.player2Id || m.player2Legs > m.player1Legs);

    if (isP1Active) {
      const s1 = statsMap.get(m.player1Id)!;
      s1.played += 1;
      s1.legsFor += m.player1Legs;
      s1.legsAgainst += m.player2Legs;
      s1.total180s += (m.player1180s || 0);
      s1.highestCheckout = Math.max(s1.highestCheckout, m.player1HighestCheckout || 0);
      if (m.player1Avg > 0) {
        s1.matchAverages.push({ avg: m.player1Avg, legs: m.player1Legs + m.player2Legs });
        s1.highestAverage = Math.max(s1.highestAverage, m.player1Avg);
      }
      if (isDraw) {
        s1.drawn += 1;
        s1.points += 1; // 1 point for draw (2-2)
      } else if (isP1Winner) {
        s1.won += 1;
        s1.points += 3; // 3 points for win
      } else {
        s1.lost += 1; // 0 points for loss
      }
      s1.matches.push(m);
    }

    if (isP2Active) {
      const s2 = statsMap.get(m.player2Id)!;
      s2.played += 1;
      s2.legsFor += m.player2Legs;
      s2.legsAgainst += m.player1Legs;
      s2.total180s += (m.player2180s || 0);
      s2.highestCheckout = Math.max(s2.highestCheckout, m.player2HighestCheckout || 0);
      if (m.player2Avg > 0) {
        s2.matchAverages.push({ avg: m.player2Avg, legs: m.player1Legs + m.player2Legs });
        s2.highestAverage = Math.max(s2.highestAverage, m.player2Avg);
      }
      if (isDraw) {
        s2.drawn += 1;
        s2.points += 1; // 1 point for draw (2-2)
      } else if (isP2Winner) {
        s2.won += 1;
        s2.points += 3; // 3 points for win
      } else {
        s2.lost += 1; // 0 points for loss
      }
      s2.matches.push(m);
    }
  });

  const result: PlayerStats[] = activePlayers.map(player => {
    const s = statsMap.get(player.id)!;
    const legDiff = s.legsFor - s.legsAgainst;
    const winRate = s.played > 0 ? Math.round((s.won / s.played) * 100) : 0;

    // Weighted average by total legs
    let overallAverage = 0;
    if (s.matchAverages.length > 0) {
      const totalLegs = s.matchAverages.reduce((acc, curr) => acc + curr.legs, 0);
      if (totalLegs > 0) {
        const weightedSum = s.matchAverages.reduce((acc, curr) => acc + (curr.avg * curr.legs), 0);
        overallAverage = Number((weightedSum / totalLegs).toFixed(1));
      } else {
        const sum = s.matchAverages.reduce((acc, curr) => acc + curr.avg, 0);
        overallAverage = Number((sum / s.matchAverages.length).toFixed(1));
      }
    }

    // Last 5 matches for form ('W' | 'D' | 'L')
    const form: ('W' | 'D' | 'L')[] = s.matches.slice(-5).map(m => {
      if (m.player1Legs === m.player2Legs) return 'D';
      const isWinner = m.winnerId === player.id || (m.player1Id === player.id ? m.player1Legs > m.player2Legs : m.player2Legs > m.player1Legs);
      return isWinner ? 'W' : 'L';
    });

    return {
      rank: 0,
      player,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      legsFor: s.legsFor,
      legsAgainst: s.legsAgainst,
      legDiff,
      points: s.points,
      winRate,
      overallAverage,
      highestAverage: s.highestAverage,
      total180s: s.total180s,
      highestCheckout: s.highestCheckout,
      form,
    };
  });

  // Sort standings:
  // 1. Points (desc)
  // 2. Leg Diff (desc)
  // 3. Legs For (desc)
  // 4. Overall 3-dart average (desc)
  // 5. Name (asc)
  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.legDiff !== a.legDiff) return b.legDiff - a.legDiff;
    if (b.legsFor !== a.legsFor) return b.legsFor - a.legsFor;
    if (b.overallAverage !== a.overallAverage) return b.overallAverage - a.overallAverage;
    return a.player.name.localeCompare(b.player.name);
  });

  // Assign ranks
  result.forEach((stat, idx) => {
    stat.rank = idx + 1;
  });

  return result;
}

export interface MatchLeaderboardRecord {
  player: Player;
  opponent: Player;
  average: number;
  score: string;
  playedAt: string;
  matchId: string;
}

export function getHighestMatchAverages(players: Player[], matches: MatchResult[], limit: number = 10): MatchLeaderboardRecord[] {
  const playerMap = new Map(players.map(p => [p.id, p]));
  const records: MatchLeaderboardRecord[] = [];

  matches.forEach(m => {
    const p1 = playerMap.get(m.player1Id);
    const p2 = playerMap.get(m.player2Id);
    if (!p1 || !p2) return;

    if (m.player1Avg > 0) {
      records.push({
        player: p1,
        opponent: p2,
        average: m.player1Avg,
        score: `${m.player1Legs}-${m.player2Legs}`,
        playedAt: m.playedAt,
        matchId: m.id,
      });
    }

    if (m.player2Avg > 0) {
      records.push({
        player: p2,
        opponent: p1,
        average: m.player2Avg,
        score: `${m.player2Legs}-${m.player1Legs}`,
        playedAt: m.playedAt,
        matchId: m.id,
      });
    }
  });

  return records.sort((a, b) => b.average - a.average).slice(0, limit);
}

export interface HighestCheckoutRecord {
  player: Player;
  opponent: Player;
  checkout: number;
  playedAt: string;
  matchId: string;
}

export function getHighestCheckouts(players: Player[], matches: MatchResult[], limit: number = 10): HighestCheckoutRecord[] {
  const playerMap = new Map(players.map(p => [p.id, p]));
  const records: HighestCheckoutRecord[] = [];

  matches.forEach(m => {
    const p1 = playerMap.get(m.player1Id);
    const p2 = playerMap.get(m.player2Id);
    if (!p1 || !p2) return;

    if (m.player1HighestCheckout > 0) {
      records.push({
        player: p1,
        opponent: p2,
        checkout: m.player1HighestCheckout,
        playedAt: m.playedAt,
        matchId: m.id,
      });
    }

    if (m.player2HighestCheckout > 0) {
      records.push({
        player: p2,
        opponent: p1,
        checkout: m.player2HighestCheckout,
        playedAt: m.playedAt,
        matchId: m.id,
      });
    }
  });

  return records.sort((a, b) => b.checkout - a.checkout).slice(0, limit);
}

export function getHeadToHeadRecords(
  playerId: string,
  players: Player[],
  matches: MatchResult[]
): HeadToHeadRecord[] {
  const otherPlayers = players.filter(p => p.id !== playerId && p.active);
  const playerMap = new Map(players.map(p => [p.id, p]));

  return otherPlayers.map(opponent => {
    const directMatches = matches.filter(
      m => (m.player1Id === playerId && m.player2Id === opponent.id) ||
           (m.player2Id === playerId && m.player1Id === opponent.id)
    );

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let legsFor = 0;
    let legsAgainst = 0;

    directMatches.forEach(m => {
      const isP1 = m.player1Id === playerId;
      const myLegs = isP1 ? m.player1Legs : m.player2Legs;
      const oppLegs = isP1 ? m.player2Legs : m.player1Legs;
      legsFor += myLegs;
      legsAgainst += oppLegs;

      if (myLegs === oppLegs) {
        draws += 1;
      } else if (myLegs > oppLegs) {
        wins += 1;
      } else {
        losses += 1;
      }
    });

    // In single round-robin, 1 match per pair
    const unplayedCount = Math.max(0, 1 - directMatches.length);

    return {
      opponent,
      played: directMatches.length,
      wins,
      draws,
      losses,
      legsFor,
      legsAgainst,
      matches: directMatches,
      unplayedCount,
    };
  });
}
