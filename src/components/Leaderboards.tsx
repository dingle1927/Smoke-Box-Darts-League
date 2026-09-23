import React, { useState } from 'react';
import { Flame, Award, Target, Zap } from 'lucide-react';
import { Player, MatchResult, PlayerStats } from '../types/darts';
import { getHighestMatchAverages, getHighestCheckouts } from '../utils/statsCalculator';
import { BearAvatar } from './BearAvatar';
import { ASSETS } from '../utils/assets';

interface LeaderboardsProps {
  players: Player[];
  matches: MatchResult[];
  stats: PlayerStats[];
  onSelectPlayer: (playerId: string) => void;
}

export const Leaderboards: React.FC<LeaderboardsProps> = ({
  players,
  matches,
  stats,
  onSelectPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | '180s' | 'overallAvg' | 'matchAvg' | 'checkout'>('all');

  // Compute leaderboards
  // 1. Overall Tournament 3-Dart Average (min 1 match played)
  const overallAvgLeaderboard = [...stats]
    .filter(s => s.played > 0 && s.overallAverage > 0)
    .sort((a, b) => b.overallAverage - a.overallAverage);

  // 2. Highest Single Match Average
  const singleMatchAvgLeaderboard = getHighestMatchAverages(players, matches, 10);

  // 3. Total 180s
  const max180Leaderboard = [...stats]
    .filter(s => s.total180s > 0)
    .sort((a, b) => b.total180s - a.total180s);

  // 4. Highest Checkout
  const checkoutsLeaderboard = getHighestCheckouts(players, matches, 10);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="max-w-xl z-10">
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-1.5">
            <Flame className="w-4 h-4" />
            <span>The Smoke Box Hall of Fame</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-sans">
            League Leaders & High Marks
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Tracking every maximum 180, tournament 3-dart averages, clutch high checkouts, and single-match record performances.
          </p>
        </div>

        {/* Mascot Bear 180 Graphic */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden border-2 border-red-600/80 shadow-lg shadow-red-950/60">
          <img
            src={ASSETS.bearChampion}
            alt="Bear 180 Champion"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-neutral-950/90 text-center py-0.5 text-[10px] font-black uppercase text-red-400 tracking-wider">
            180 Club
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3">
        {[
          { id: 'all', label: 'All Leaderboards' },
          { id: '180s', label: 'Maximum 180s' },
          { id: 'overallAvg', label: 'Overall 3-Dart Avg' },
          { id: 'matchAvg', label: 'Match Record Avg' },
          { id: 'checkout', label: 'Highest Checkouts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 180s Leaderboard */}
        {(activeTab === 'all' || activeTab === '180s') && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-950/80 text-red-400 border border-red-800/60">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base uppercase tracking-wider">
                    Total 180s Thrown
                  </h3>
                  <p className="text-[11px] text-neutral-400">The Max-Makers Club</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-red-400">
                {max180Leaderboard.reduce((a, b) => a + b.total180s, 0)} Total
              </span>
            </div>

            <div className="p-2 divide-y divide-neutral-800/60">
              {max180Leaderboard.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No 180s recorded yet this season.
                </div>
              ) : (
                max180Leaderboard.slice(0, 5).map((stat, idx) => (
                  <div
                    key={stat.player.id}
                    onClick={() => onSelectPlayer(stat.player.id)}
                    className="flex items-center justify-between p-3 hover:bg-neutral-800/50 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono font-black text-xs ${idx === 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                        #{idx + 1}
                      </span>
                      <BearAvatar player={stat.player} size="sm" />
                      <div>
                        <div className="font-bold text-sm text-neutral-100 group-hover:text-red-400 transition-colors">
                          {stat.player.name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          "{stat.player.nickname}"
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl font-mono font-black text-red-500">
                        {stat.total180s}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-neutral-500">
                        max
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. Overall Tournament 3-Dart Average */}
        {(activeTab === 'all' || activeTab === 'overallAvg') && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/60">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base uppercase tracking-wider">
                    Overall Tournament Average
                  </h3>
                  <p className="text-[11px] text-neutral-400">3-Dart average across all legs played</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">Overall</span>
            </div>

            <div className="p-2 divide-y divide-neutral-800/60">
              {overallAvgLeaderboard.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No completed match averages yet.
                </div>
              ) : (
                overallAvgLeaderboard.slice(0, 5).map((stat, idx) => (
                  <div
                    key={stat.player.id}
                    onClick={() => onSelectPlayer(stat.player.id)}
                    className="flex items-center justify-between p-3 hover:bg-neutral-800/50 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono font-black text-xs ${idx === 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                        #{idx + 1}
                      </span>
                      <BearAvatar player={stat.player} size="sm" />
                      <div>
                        <div className="font-bold text-sm text-neutral-100 group-hover:text-blue-400 transition-colors">
                          {stat.player.name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {stat.played} matches played · {stat.legsFor + stat.legsAgainst} legs
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-mono font-black text-blue-400">
                        {stat.overallAverage.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. Highest Single Match Average */}
        {(activeTab === 'all' || activeTab === 'matchAvg') && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base uppercase tracking-wider">
                    Highest Single Match Average
                  </h3>
                  <p className="text-[11px] text-neutral-400">Peak single performance in a match</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">Record</span>
            </div>

            <div className="p-2 divide-y divide-neutral-800/60">
              {singleMatchAvgLeaderboard.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No match averages recorded.
                </div>
              ) : (
                singleMatchAvgLeaderboard.slice(0, 5).map((rec, idx) => (
                  <div
                    key={`${rec.matchId}-${rec.player.id}`}
                    onClick={() => onSelectPlayer(rec.player.id)}
                    className="flex items-center justify-between p-3 hover:bg-neutral-800/50 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono font-black text-xs ${idx === 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                        #{idx + 1}
                      </span>
                      <BearAvatar player={rec.player} size="sm" />
                      <div>
                        <div className="font-bold text-sm text-neutral-100 group-hover:text-amber-400 transition-colors">
                          {rec.player.name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          vs {rec.opponent.name} ({rec.score})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-mono font-black text-amber-400">
                        {rec.average.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {new Date(rec.playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. Highest Checkout */}
        {(activeTab === 'all' || activeTab === 'checkout') && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base uppercase tracking-wider">
                    Highest Checkouts
                  </h3>
                  <p className="text-[11px] text-neutral-400">Maximum possible 170 (The Big Fish)</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">Finish</span>
            </div>

            <div className="p-2 divide-y divide-neutral-800/60">
              {checkoutsLeaderboard.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  No checkouts recorded yet.
                </div>
              ) : (
                checkoutsLeaderboard.slice(0, 5).map((rec, idx) => (
                  <div
                    key={`${rec.matchId}-${rec.player.id}`}
                    onClick={() => onSelectPlayer(rec.player.id)}
                    className="flex items-center justify-between p-3 hover:bg-neutral-800/50 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 text-center font-mono font-black text-xs ${idx === 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                        #{idx + 1}
                      </span>
                      <BearAvatar player={rec.player} size="sm" />
                      <div>
                        <div className="font-bold text-sm text-neutral-100 group-hover:text-emerald-400 transition-colors">
                          {rec.player.name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          vs {rec.opponent.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-mono font-black text-emerald-400 flex items-center gap-1 justify-end">
                        <span>{rec.checkout}</span>
                        {rec.checkout === 170 && (
                          <span className="text-[10px] font-black uppercase px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            170
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {new Date(rec.playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
