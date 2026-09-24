import { Player, MatchResult, PlayerStats, AINewsItem, ScenarioPreset } from '../types/darts';

export interface ScenarioDetail {
  id: ScenarioPreset;
  title: string;
  description: string;
  badge: string;
  ruleTag: string;
}

export const SCENARIO_PRESETS: ScenarioDetail[] = [
  {
    id: 'throwing',
    title: 'Precision Dart Throw',
    description: 'Player focused at the oche aiming a tungsten dart under intense championship arena spotlighting.',
    badge: 'Focus & Stance',
    ruleTag: 'Custom Darts Shirt (Strictly No Green)',
  },
  {
    id: 'cigarette',
    title: 'Vintage Smoke Box Dart with Cigarette',
    description: 'Player throwing a dart with a cigarette hanging from their mouth through atmospheric pub smoke.',
    badge: 'Smoke Box Grit',
    ruleTag: 'Custom Darts Shirt (Strictly No Green)',
  },
  {
    id: 'disappointment',
    title: 'Disappointment (Hands on Head)',
    description: 'Player standing on the oche stage with hands on head in disbelief after missing the crucial double.',
    badge: 'Near Miss Heartbreak',
    ruleTag: 'Custom Darts Shirt (Strictly No Green)',
  },
  {
    id: 'celebration',
    title: 'Championship Roar & Victory Crowd',
    description: 'Player celebrating with clenched fists and roar of victory in front of a packed, cheering arena.',
    badge: 'Crowd Roar Celebration',
    ruleTag: 'Custom Darts Shirt (Strictly No Green)',
  },
];

/**
 * Builds a strict prompt complying with the rule:
 * CRITICAL RULE: Every player wears a customized darts shirt (Never include the color green in any darts shirt or image).
 */
export function buildScenarioPrompt(
  player: Player,
  preset: ScenarioPreset,
  contextNote?: string
): string {
  const shirtDesc = player.customShirtColors
    ? `customized tournament polo shirt in ${player.customShirtColors.primary} and ${player.customShirtColors.secondary} with ${player.customShirtColors.collar} collar`
    : `customized black and crimson red championship darts jersey with geometric sharp accents`;

  const strictRule = `CRITICAL RULE: STRICTLY NEVER INCLUDE ANY SHADE OF GREEN in any darts shirt, collar, embroidery, background, or lighting. Zero green tones.`;

  switch (preset) {
    case 'throwing':
      return `Professional sports photograph of darts player ${player.name} ("${player.nickname}") wearing a ${shirtDesc}. Standing poised at the tournament oche throwing a tungsten steel-tip dart toward the dartboard. Cinematic arena spotlighting, subtle smoke haze in the air, blurred crowd in the background. ${strictRule}. ${contextNote || ''}`;

    case 'cigarette':
      return `Atmospheric vintage darts portrait of player ${player.name} ("${player.nickname}") wearing a ${shirtDesc}. Throwing a dart with focused intensity while a lighted cigarette hangs naturally from the corner of their mouth with thin smoke curling upward. Moody darts pub arena lighting, authentic competition spirit. ${strictRule}. ${contextNote || ''}`;

    case 'disappointment':
      return `Emotional darts tournament photograph of player ${player.name} ("${player.nickname}") wearing a ${shirtDesc}. Standing on the stage oche with both hands on their head in stunned disappointment and agony after narrowly missing the decisive double wire. Dramatic overhead arena lighting, high contrast. ${strictRule}. ${contextNote || ''}`;

    case 'celebration':
      return `Triumphant championship photograph of darts player ${player.name} ("${player.nickname}") wearing a ${shirtDesc}. Ecstatically roaring with clenched fists in front of a massive cheering darts arena crowd with golden celebration confetti descending. Heroic, electrifying sports victory atmosphere. ${strictRule}. ${contextNote || ''}`;

    case 'trophy':
    default:
      return `Victorious championship photograph of darts player ${player.name} ("${player.nickname}") wearing a ${shirtDesc}. Lifting the prestigious darts league championship trophy high above their head under blazing golden arena spotlights. Packed arena crowd roaring in celebration. ${strictRule}. ${contextNote || ''}`;
  }
}

/**
 * Evaluates live Supabase player stats and recent match results to generate dynamic news cards.
 */
export function generateLeagueNews(
  players: Player[],
  matches: MatchResult[],
  stats: PlayerStats[]
): AINewsItem[] {
  if (!players || players.length === 0) return [];

  const news: AINewsItem[] = [];
  const playerMap = new Map(players.map(p => [p.id, p]));
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );

  // 1. Title Race & Leader Alert
  if (stats.length > 0 && stats[0].played > 0) {
    const leader = stats[0];
    const second = stats[1];
    const gap = second ? leader.points - second.points : leader.points;

    news.push({
      id: `news-titlerace-${leader.player.id}`,
      category: 'titlerace',
      headline: `${leader.player.name} Seizes Control of Smoke Box Summit!`,
      summary: `With ${leader.points} points on the board, "${leader.player.nickname}" commands 1st place in the standings with an average of ${leader.overallAverage.toFixed(1)}.`,
      article: `The battle at the top of The Smoke Box Darts League is heating up. ${leader.player.name} sits perched at Rank #1 with a record of ${leader.won} wins from ${leader.played} matches and a +${leader.legDiff} leg differential. ${
        second
          ? `Chasing hard in second is ${second.player.name} ("${second.player.nickname}") trailing by ${gap} point${gap === 1 ? '' : 's'}.`
          : ''
      } Every dart counts as the championship race intensifies.`,
      primaryPlayerId: leader.player.id,
      secondaryPlayerId: second?.player.id,
      timestamp: sortedMatches[0]?.playedAt || new Date().toISOString(),
      scenarioPreset: 'celebration',
      scenarioTitle: 'Summit Leader Celebration',
      customPrompt: buildScenarioPrompt(leader.player, 'celebration', 'Holding league summit at Rank 1.'),
      importance: 'breaking',
    });
  }

  // 2. Games in Hand Analysis (Players high up or dangerous with fewer matches played)
  const maxPlayed = Math.max(...stats.map(s => s.played), 0);
  const gamesInHandCandidate = stats.find(
    s => s.played > 0 && s.played <= maxPlayed - 1 && s.winRate >= 50
  );
  if (gamesInHandCandidate) {
    const p = gamesInHandCandidate;
    const gamesBehind = maxPlayed - p.played;
    const potentialPts = gamesBehind * 3;
    news.push({
      id: `news-gamesinhand-${p.player.id}`,
      category: 'games_in_hand',
      headline: `Dark Horse Alert: ${p.player.name} Looming With ${gamesBehind} Games in Hand!`,
      summary: `Currently at Rank #${p.rank}, "${p.player.nickname}" holds up to ${potentialPts} potential points in reserve to leapfrog the leaders.`,
      article: `Do not count out ${p.player.name}. Despite having completed fewer fixtures than the frontrunners (${p.played} played vs ${maxPlayed}), their clinical ${p.winRate}% win rate suggests a massive surge could overturn the standings when their makeup matches are contested.`,
      primaryPlayerId: p.player.id,
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      scenarioPreset: 'cigarette',
      scenarioTitle: 'Cool Under Pressure with Games in Hand',
      customPrompt: buildScenarioPrompt(p.player, 'cigarette', 'Quietly dangerous competitor calculating title surge.'),
      importance: 'featured',
    });
  }

  // 3. Match Specific Highlights (Upsets, 4-0 Whitewashes, 2-2 Draws, Big Checkouts)
  sortedMatches.slice(0, 8).forEach(m => {
    const p1 = playerMap.get(m.player1Id);
    const p2 = playerMap.get(m.player2Id);
    if (!p1 || !p2) return;

    const p1Stat = stats.find(s => s.player.id === p1.id);
    const p2Stat = stats.find(s => s.player.id === p2.id);

    // 2-2 Draw Thriller
    if (m.player1Legs === 2 && m.player2Legs === 2) {
      news.push({
        id: `news-match-draw-${m.id}`,
        category: 'draw_drama',
        headline: `Points Shared in 2-2 Stalemate: ${p1.name} vs ${p2.name}!`,
        summary: `Neither warrior yielded an inch in a gripping 4-leg standoff that ended with honors even at 2-2.`,
        article: `Round ${m.round} delivered an absolute barnburner between ${p1.name} ("${p1.nickname}") and ${p2.name} ("${p2.nickname}"). Leg for leg, darts flew in high tension until the final double sealed a 2-2 split. Both competitors bag 1 league point.`,
        primaryPlayerId: p1.id,
        secondaryPlayerId: p2.id,
        timestamp: m.playedAt,
        matchId: m.id,
        scenarioPreset: 'throwing',
        scenarioTitle: 'Tense 2-2 Oche Battle',
        customPrompt: buildScenarioPrompt(p1, 'throwing', `Gripping 2-2 draw duel against ${p2.name}.`),
        importance: 'high',
      });
      return;
    }

    const winner = m.player1Legs > m.player2Legs ? p1 : p2;
    const loser = m.player1Legs > m.player2Legs ? p2 : p1;
    const winLegs = Math.max(m.player1Legs, m.player2Legs);
    const loseLegs = Math.min(m.player1Legs, m.player2Legs);
    const winnerAvg = m.player1Legs > m.player2Legs ? m.player1Avg : m.player2Avg;
    const winnerStat = stats.find(s => s.player.id === winner.id);
    const loserStat = stats.find(s => s.player.id === loser.id);

    // Upset win: Winner had a lower pre-rank than loser
    const isUpset = winnerStat && loserStat && winnerStat.rank > loserStat.rank + 2;

    if (isUpset) {
      news.push({
        id: `news-match-upset-${m.id}`,
        category: 'upset',
        headline: `UPSET! ${winner.name} Topples High-Flying ${loser.name} ${winLegs}-${loseLegs}!`,
        summary: `The underdog roared as "${winner.nickname}" produced ice-cold doubles to stun #${loserStat.rank} ${loser.name}.`,
        article: `The league was rocked when ${winner.name} tore up the form book against ${loser.name}. Averaging ${winnerAvg > 0 ? winnerAvg.toFixed(1) : 'deadly scoring'}, ${winner.name} converted crucial match darts to claim 3 priceless league points.`,
        primaryPlayerId: winner.id,
        secondaryPlayerId: loser.id,
        timestamp: m.playedAt,
        matchId: m.id,
        scenarioPreset: 'celebration',
        scenarioTitle: 'Underdog Victory Celebration',
        customPrompt: buildScenarioPrompt(winner, 'celebration', `Massive upset victory over ${loser.name}.`),
        importance: 'breaking',
      });
    } else if (winLegs === 3 && loseLegs === 0) {
      // 3-0 Early Finish Rule Invoked
      news.push({
        id: `news-match-earlyfinish-${m.id}`,
        category: 'streak',
        headline: `3–0 Early Finish! ${winner.name} Blasts Past ${loser.name}!`,
        summary: `Invoking the league's Early Finish Rule, "${winner.nickname}" surged to an unassailable 3–0 shutout victory.`,
        article: `Relentless scoring from ${winner.name} triggered the Early Finish Rule in Round ${m.round}. By claiming all 3 opening legs, ${winner.name} sealed a maximum 3 points immediately without a 4th leg, leaving ${loser.name} empty-handed.`,
        primaryPlayerId: winner.id,
        secondaryPlayerId: loser.id,
        timestamp: m.playedAt,
        matchId: m.id,
        scenarioPreset: 'cigarette',
        scenarioTitle: 'Unstoppable 3-0 Early Finish',
        customPrompt: buildScenarioPrompt(winner, 'cigarette', `Early finish 3-0 lead shutout victory.`),
        importance: 'high',
      });
    } else if (winLegs === 4 && loseLegs === 0) {
      // 4-0 Whitewash
      news.push({
        id: `news-match-whitewash-${m.id}`,
        category: 'streak',
        headline: `Flawless Whitewash: ${winner.name} Sweeps ${loser.name} 4-0!`,
        summary: `Complete dominance on the oche as "${winner.nickname}" gave away zero legs in a masterclass performance.`,
        article: `There was no answer to ${winner.name}'s relentless pace in Round ${m.round}. A 4-0 clean sweep leaves ${loser.name} with hands on head in disbelief, while ${winner.name} charges forward in the league standings.`,
        primaryPlayerId: winner.id,
        secondaryPlayerId: loser.id,
        timestamp: m.playedAt,
        matchId: m.id,
        scenarioPreset: 'cigarette',
        scenarioTitle: 'Cold-Blooded 4-0 Clean Sweep',
        customPrompt: buildScenarioPrompt(winner, 'cigarette', `Complete 4-0 whitewash display.`),
        importance: 'high',
      });
    }

    // High Checkout alert in this match
    const highCheckout = Math.max(m.player1HighestCheckout || 0, m.player2HighestCheckout || 0);
    if (highCheckout >= 60) {
      const coPlayer = m.player1HighestCheckout >= (m.player2HighestCheckout || 0) ? p1 : p2;
      news.push({
        id: `news-co-${m.id}`,
        category: 'checkout',
        headline: `Bullseye Finish! ${coPlayer.name} Pins Huge ${highCheckout} Checkout!`,
        summary: `Ice running through veins as "${coPlayer.nickname}" cleans up ${highCheckout} under the glare of championship lights.`,
        article: `Spectators were on their feet as ${coPlayer.name} calculated and nailed an electric ${highCheckout} checkout in their fixture. A signature moment showcasing pure clutch precision.`,
        primaryPlayerId: coPlayer.id,
        timestamp: m.playedAt,
        matchId: m.id,
        scenarioPreset: 'throwing',
        scenarioTitle: 'Clutch Out-Shot Precision',
        customPrompt: buildScenarioPrompt(coPlayer, 'throwing', `Nailing a massive ${highCheckout} out-shot.`),
        importance: 'featured',
      });
    }
  });

  // 4. Maximum 180s Barrage
  const top180Player = [...stats].sort((a, b) => b.total180s - a.total180s)[0];
  if (top180Player && top180Player.total180s > 0) {
    news.push({
      id: `news-180s-${top180Player.player.id}`,
      category: '180_barrage',
      headline: `Maximum Firepower: ${top180Player.player.name} Dominates the 180s Leaderboard!`,
      summary: `With ${top180Player.total180s} maximum 180s hit, "${top180Player.player.nickname}" is pounding the treble-20 bed into submission.`,
      article: `The crowd holds its breath whenever ${top180Player.player.name} steps up. Leading the league with ${top180Player.total180s} maximums, the treble 20 has become a permanent home for this heavy-hitting warrior.`,
      primaryPlayerId: top180Player.player.id,
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      scenarioPreset: 'throwing',
      scenarioTitle: '180 Treble Hunter Throw',
      customPrompt: buildScenarioPrompt(top180Player.player, 'throwing', `Stacking three darts into the treble 20 for 180.`),
      importance: 'featured',
    });
  }

  // 5. Winning Streaks
  const streakPlayer = stats.find(
    s => s.form.length >= 2 && s.form.slice(-3).every(r => r === 'W')
  );
  if (streakPlayer) {
    news.push({
      id: `news-streak-${streakPlayer.player.id}`,
      category: 'streak',
      headline: `Unstoppable Momentum: ${streakPlayer.player.name} on ${streakPlayer.form.slice(-3).length}-Game Winning Tear!`,
      summary: `"${streakPlayer.player.nickname}" refuses to drop points, stringing consecutive victories together in formidable fashion.`,
      article: `Nobody wants to face ${streakPlayer.player.name} right now. With back-to-back dominant showings, the confidence is soaring as opponents scramble for answers at the oche.`,
      primaryPlayerId: streakPlayer.player.id,
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      scenarioPreset: 'celebration',
      scenarioTitle: 'Winning Streak Champion Celebration',
      customPrompt: buildScenarioPrompt(streakPlayer.player, 'celebration', `Celebrating an unstoppable winning streak.`),
      importance: 'high',
    });
  }

  // Deduplicate by headline and sort by timestamp (newest first)
  const seen = new Set<string>();
  const uniqueNews: AINewsItem[] = [];
  for (const item of news) {
    if (!seen.has(item.headline)) {
      seen.add(item.headline);
      uniqueNews.push(item);
    }
  }

  return uniqueNews.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Returns all news items involving a specific player.
 */
export function getNewsForPlayer(playerId: string, allNews: AINewsItem[]): AINewsItem[] {
  return allNews.filter(
    n => n.primaryPlayerId === playerId || n.secondaryPlayerId === playerId
  );
}
