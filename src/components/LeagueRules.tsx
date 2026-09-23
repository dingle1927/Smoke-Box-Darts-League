import React, { useState } from 'react';
import { 
  BookOpen, 
  Target, 
  Trophy, 
  CheckCircle, 
  HelpCircle, 
  Scale, 
  ShieldCheck, 
  Zap, 
  Calculator,
  ArrowRight
} from 'lucide-react';

interface LeagueRulesProps {
  onGoToStandings?: () => void;
  onGoToFixtures?: () => void;
  onGoToScorer?: () => void;
}

export const LeagueRules: React.FC<LeagueRulesProps> = ({
  onGoToStandings,
  onGoToFixtures,
  onGoToScorer,
}) => {
  const [calcLegsP1, setCalcLegsP1] = useState<number>(2);
  const [calcLegsP2, setCalcLegsP2] = useState<number>(2);

  const calcTotalLegs = calcLegsP1 + calcLegsP2;
  const isCalcValid = calcTotalLegs === 4;
  const isCalcDraw = calcLegsP1 === 2 && calcLegsP2 === 2;
  const calcP1Points = isCalcDraw ? 1 : calcLegsP1 > calcLegsP2 ? 3 : 0;
  const calcP2Points = isCalcDraw ? 1 : calcLegsP2 > calcLegsP1 ? 3 : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-red-950/40 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            Official Rulebook & Scoring Regulations
          </span>
          <span className="text-xs text-neutral-400 font-medium">
            Effective Season 2026
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight font-sans">
          League Rules & <span className="text-red-500">Scoring System</span>
        </h1>
        <p className="text-neutral-300 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
          The Smoke Box Darts Championship operates on a fixed 4-leg match format with a 3-point win / 1-point draw structure. Review the official scoring matrix, tie-breaker regulations, and 301 Double Out gameplay specifications below.
        </p>

        {/* Quick Summary Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-800">
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] uppercase font-bold text-neutral-400 block">Match Format</span>
            <span className="text-base font-black text-white font-mono">Fixed 4 Legs</span>
          </div>
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] uppercase font-bold text-neutral-400 block">Win Reward</span>
            <span className="text-base font-black text-emerald-400 font-mono">3 Points</span>
          </div>
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] uppercase font-bold text-neutral-400 block">Draw Split (2-2)</span>
            <span className="text-base font-black text-amber-400 font-mono">1 Point Each</span>
          </div>
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] uppercase font-bold text-neutral-400 block">Loss Reward</span>
            <span className="text-base font-black text-neutral-400 font-mono">0 Points</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: POINT SYSTEM & MATCH STRUCTURE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Win Card */}
        <div className="bg-neutral-900/80 border border-emerald-900/50 rounded-2xl p-6 relative overflow-hidden shadow-lg group hover:border-emerald-700/60 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60 font-black text-lg font-mono">
              3
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              Match Victory
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">3 Points for a Win</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Awarded when a player wins the match with a scoreline of <strong className="text-emerald-300">4 - 0</strong> or <strong className="text-emerald-300">3 - 1</strong>. The defeated player earns 0 points.
          </p>
        </div>

        {/* Draw Card */}
        <div className="bg-neutral-900/80 border border-amber-900/50 rounded-2xl p-6 relative overflow-hidden shadow-lg group hover:border-amber-700/60 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800/60 font-black text-lg font-mono">
              1
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
              Leg Split
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">1 Point for a Draw (2-2)</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            When a match finishes in a 2-2 leg deadlock, the spoils are shared. Both players are awarded <strong className="text-amber-300">1 championship point</strong> each in the standings table.
          </p>
        </div>

        {/* Loss Card */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-lg group hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-neutral-400 flex items-center justify-center border border-neutral-800 font-black text-lg font-mono">
              0
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
              Defeat
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">0 Points for a Loss</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Awarded when a player finishes with fewer legs (<strong className="text-neutral-300">1 - 3</strong> or <strong className="text-neutral-300">0 - 4</strong>). However, all legs won count toward total Leg Difference (+/-).
          </p>
        </div>
      </div>

      {/* SECTION 2: COMPLETE LEG SCORE MATRIX */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            All Possible 4-Leg Match Outcomes
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950 text-xs uppercase tracking-wider text-neutral-400 font-bold">
                <th className="py-3 px-4">Scoreline</th>
                <th className="py-3 px-4">Match Outcome</th>
                <th className="py-3 px-4 text-center">Player 1 Points</th>
                <th className="py-3 px-4 text-center">Player 2 Points</th>
                <th className="py-3 px-4">Leg Diff Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 font-mono text-xs">
              <tr className="hover:bg-neutral-800/40">
                <td className="py-3 px-4 font-bold text-emerald-400 text-sm">4 - 0</td>
                <td className="py-3 px-4 text-neutral-200 font-sans font-medium">Clean Sweep Victory for Player 1</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-emerald-950/20">3 pts</td>
                <td className="py-3 px-4 text-center text-neutral-500">0 pts</td>
                <td className="py-3 px-4 text-neutral-300">P1: +4 / P2: -4</td>
              </tr>
              <tr className="hover:bg-neutral-800/40">
                <td className="py-3 px-4 font-bold text-emerald-400 text-sm">3 - 1</td>
                <td className="py-3 px-4 text-neutral-200 font-sans font-medium">Win for Player 1</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-400 bg-emerald-950/20">3 pts</td>
                <td className="py-3 px-4 text-center text-neutral-500">0 pts</td>
                <td className="py-3 px-4 text-neutral-300">P1: +2 / P2: -2</td>
              </tr>
              <tr className="bg-amber-950/20 hover:bg-amber-950/30">
                <td className="py-3 px-4 font-bold text-amber-400 text-sm">2 - 2</td>
                <td className="py-3 px-4 text-amber-300 font-sans font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Honours Even Draw (Leg Split)
                </td>
                <td className="py-3 px-4 text-center font-bold text-amber-400 bg-amber-950/40">1 pt</td>
                <td className="py-3 px-4 text-center font-bold text-amber-400 bg-amber-950/40">1 pt</td>
                <td className="py-3 px-4 text-amber-300 font-bold">P1: 0 / P2: 0 (Even)</td>
              </tr>
              <tr className="hover:bg-neutral-800/40">
                <td className="py-3 px-4 font-bold text-blue-400 text-sm">1 - 3</td>
                <td className="py-3 px-4 text-neutral-200 font-sans font-medium">Win for Player 2</td>
                <td className="py-3 px-4 text-center text-neutral-500">0 pts</td>
                <td className="py-3 px-4 text-center font-bold text-blue-400 bg-blue-950/20">3 pts</td>
                <td className="py-3 px-4 text-neutral-300">P1: -2 / P2: +2</td>
              </tr>
              <tr className="hover:bg-neutral-800/40">
                <td className="py-3 px-4 font-bold text-blue-400 text-sm">0 - 4</td>
                <td className="py-3 px-4 text-neutral-200 font-sans font-medium">Clean Sweep Victory for Player 2</td>
                <td className="py-3 px-4 text-center text-neutral-500">0 pts</td>
                <td className="py-3 px-4 text-center font-bold text-blue-400 bg-blue-950/20">3 pts</td>
                <td className="py-3 px-4 text-neutral-300">P1: -4 / P2: +4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE SCORING SIMULATOR */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Interactive Match Points Simulator
          </h2>
        </div>
        <p className="text-xs text-neutral-400 mb-6">
          Test any leg combination to preview how points and outcomes are calculated:
        </p>

        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Player 1 selector */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              Player 1 Legs
            </span>
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setCalcLegsP1(num);
                    setCalcLegsP2(4 - num);
                  }}
                  className={`w-10 h-10 rounded-xl font-mono font-black text-sm transition-all ${
                    calcLegsP1 === num
                      ? 'bg-red-600 text-white shadow-lg shadow-red-950/50 scale-105'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="text-xs font-mono font-bold text-neutral-300 mt-2">
              Awarded: <span className="text-red-400">{calcP1Points} pts</span>
            </div>
          </div>

          {/* Central Outcome Display */}
          <div className="text-center py-4 px-3 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
            <div className="text-2xl font-mono font-black text-white">
              {calcLegsP1} — {calcLegsP2}
            </div>
            {isCalcDraw ? (
              <div>
                <span className="inline-block px-3 py-1 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono font-black text-xs uppercase">
                  2 - 2 Draw!
                </span>
                <p className="text-[11px] text-amber-400/90 mt-1 font-sans">
                  Each player is awarded 1 point
                </p>
              </div>
            ) : calcLegsP1 > calcLegsP2 ? (
              <div>
                <span className="inline-block px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-black text-xs uppercase">
                  Player 1 Victory
                </span>
                <p className="text-[11px] text-emerald-400/90 mt-1 font-sans">
                  3 points to Player 1 · 0 to Player 2
                </p>
              </div>
            ) : (
              <div>
                <span className="inline-block px-3 py-1 rounded bg-blue-950 text-blue-300 border border-blue-700 font-mono font-black text-xs uppercase">
                  Player 2 Victory
                </span>
                <p className="text-[11px] text-blue-400/90 mt-1 font-sans">
                  3 points to Player 2 · 0 to Player 1
                </p>
              </div>
            )}
          </div>

          {/* Player 2 selector */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              Player 2 Legs
            </span>
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setCalcLegsP2(num);
                    setCalcLegsP1(4 - num);
                  }}
                  className={`w-10 h-10 rounded-xl font-mono font-black text-sm transition-all ${
                    calcLegsP2 === num
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 scale-105'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="text-xs font-mono font-bold text-neutral-300 mt-2">
              Awarded: <span className="text-blue-400">{calcP2Points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TIE-BREAKERS & STANDINGS RANKING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Standings & Tie-Breaker Order
            </h2>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Players are ranked in the official table using the following strict hierarchy:
          </p>

          <ol className="space-y-3 font-mono text-xs">
            <li className="flex items-start gap-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="w-6 h-6 rounded bg-red-600 text-white font-black flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-white font-sans text-sm block">Total Points (PTS)</strong>
                <span className="text-neutral-400 font-sans">Accumulated points: 3 per win, 1 per draw (2-2).</span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="w-6 h-6 rounded bg-neutral-800 text-neutral-200 font-black flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-white font-sans text-sm block">Leg Difference (+/-)</strong>
                <span className="text-neutral-400 font-sans">Legs Won minus Legs Conceded across all matches.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="w-6 h-6 rounded bg-neutral-800 text-neutral-200 font-black flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-white font-sans text-sm block">Total Legs For (LF)</strong>
                <span className="text-neutral-400 font-sans">Highest total number of legs won in the season.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="w-6 h-6 rounded bg-neutral-800 text-neutral-200 font-black flex items-center justify-center shrink-0">4</span>
              <div>
                <strong className="text-white font-sans text-sm block">3-Dart Average (Avg)</strong>
                <span className="text-neutral-400 font-sans">Overall weighted scoring average per 3 darts thrown.</span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
              <span className="w-6 h-6 rounded bg-neutral-800 text-neutral-200 font-black flex items-center justify-center shrink-0">5</span>
              <div>
                <strong className="text-white font-sans text-sm block">Head-to-Head Result</strong>
                <span className="text-neutral-400 font-sans">Direct season clash outcome between tied players.</span>
              </div>
            </li>
          </ol>
        </div>

        {/* SECTION 5: 301 GAMEPLAY RULES */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              301 Double Out Rules
            </h2>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Every leg is contested under official 301 Double Out pub tournament regulations:
          </p>

          <div className="space-y-2.5 text-xs text-neutral-300">
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold">Starting Score:</strong> Each player starts each leg at exactly 301 points. Straight-in start (first dart does not require a double).
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold">Double Out Requirement:</strong> The leg must finish on an outer ring double (D1 to D20) or the 50-point red Bullseye.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold">Bust Rule:</strong> A turn is a BUST if a player scores more than remaining, lands on exactly 1, or reaches 0 without a double. Score reverts to turn start.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold">Maximum Checkout:</strong> 170 (Treble 20, Treble 20, Bullseye) is the maximum possible out-shot in darts.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold">Season Schedule:</strong> Single Round-Robin. Each player plays every other player once in the league season.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Quick Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
        <span className="text-xs text-neutral-400">
          Ready to play or check where your player stands?
        </span>
        <div className="flex items-center gap-3">
          {onGoToStandings && (
            <button
              onClick={onGoToStandings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition-colors"
            >
              <span>View Standings</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
          {onGoToFixtures && (
            <button
              onClick={onGoToFixtures}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition-colors"
            >
              <span>View Fixtures</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
          {onGoToScorer && (
            <button
              onClick={onGoToScorer}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Launch 301 Live Scorer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
