import React, { useState } from 'react';
import { Trophy, Search, ChevronRight, Info } from 'lucide-react';
import { PlayerStats } from '../types/darts';
import { BearAvatar } from './BearAvatar';

interface StandingsTableProps {
  stats: PlayerStats[];
  onSelectPlayer: (playerId: string) => void;
  onGoToRules?: () => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ stats, onSelectPlayer, onGoToRules }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStats = stats.filter(s =>
    s.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.player.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Table Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/90 p-4 rounded-xl border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              Official League Standings
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Single round-robin (each player plays once) · Fixed 4 legs per match · 3 pts Win · 1 pt Draw (2-2) · 0 pts Loss
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player or nickname..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/60 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
              <th className="py-3 px-3 w-12 text-center">Pos</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-2 text-center" title="Played">P</th>
              <th className="py-3 px-2 text-center text-emerald-400" title="Won (3 pts)">W</th>
              <th className="py-3 px-2 text-center text-amber-400" title="Drawn (1 pt, 2-2)">D</th>
              <th className="py-3 px-2 text-center text-neutral-400" title="Lost (0 pts)">L</th>
              <th className="py-3 px-2 text-center hidden md:table-cell" title="Legs For">LF</th>
              <th className="py-3 px-2 text-center hidden md:table-cell" title="Legs Against">LA</th>
              <th className="py-3 px-3 text-center" title="Leg Difference">+/-</th>
              <th className="py-3 px-3 text-center hidden sm:table-cell" title="3-Dart Average">Avg</th>
              <th className="py-3 px-2 text-center hidden lg:table-cell" title="180s Thrown">180s</th>
              <th className="py-3 px-3 text-center hidden md:table-cell" title="Last 5 Matches">Form</th>
              <th className="py-3 px-4 text-center font-black text-red-500 text-xs" title="Points (Win: 3, Draw: 1, Loss: 0)">PTS</th>
              <th className="py-3 px-2 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 font-sans">
            {filteredStats.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-neutral-500">
                  No players match "{searchQuery}"
                </td>
              </tr>
            ) : (
              filteredStats.map(s => {
                const isPlayoffSpot = s.rank <= 4;
                const isLeader = s.rank === 1;

                return (
                  <tr
                    key={s.player.id}
                    onClick={() => onSelectPlayer(s.player.id)}
                    className="hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                  >
                    {/* Position / Rank */}
                    <td className="py-3 px-3 text-center font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-mono font-black ${
                          isLeader
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : isPlayoffSpot
                            ? 'bg-blue-950/40 text-blue-300 border border-blue-800/50'
                            : 'text-neutral-500'
                        }`}
                      >
                        {s.rank}
                      </span>
                    </td>

                    {/* Player Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <BearAvatar player={s.player} size="sm" />
                        <div>
                          <div className="font-bold text-neutral-100 group-hover:text-red-400 transition-colors">
                            {s.player.name}
                          </div>
                          <div className="text-xs text-neutral-400 font-medium tracking-wide">
                            "{s.player.nickname}"
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Played */}
                    <td className="py-3 px-2 text-center font-mono font-medium text-neutral-300">
                      {s.played}
                    </td>

                    {/* Won */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-emerald-400">
                      {s.won}
                    </td>

                    {/* Drawn */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-amber-400">
                      {s.drawn}
                    </td>

                    {/* Lost */}
                    <td className="py-3 px-2 text-center font-mono text-neutral-400">
                      {s.lost}
                    </td>

                    {/* Legs For */}
                    <td className="py-3 px-2 text-center font-mono text-neutral-400 hidden md:table-cell">
                      {s.legsFor}
                    </td>

                    {/* Legs Against */}
                    <td className="py-3 px-2 text-center font-mono text-neutral-400 hidden md:table-cell">
                      {s.legsAgainst}
                    </td>

                    {/* Leg Difference */}
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      <span
                        className={`${
                          s.legDiff > 0
                            ? 'text-emerald-400'
                            : s.legDiff < 0
                            ? 'text-red-400'
                            : 'text-neutral-500'
                        }`}
                      >
                        {s.legDiff > 0 ? `+${s.legDiff}` : s.legDiff}
                      </span>
                    </td>

                    {/* 3-Dart Average */}
                    <td className="py-3 px-3 text-center font-mono text-neutral-300 hidden sm:table-cell">
                      {s.overallAverage > 0 ? s.overallAverage.toFixed(1) : '—'}
                    </td>

                    {/* 180s count */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-red-400 hidden lg:table-cell">
                      {s.total180s}
                    </td>

                    {/* Form */}
                    <td className="py-3 px-3 text-center hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {s.form.length === 0 ? (
                          <span className="text-neutral-600 text-xs">—</span>
                        ) : (
                          s.form.map((res, i) => (
                            <span
                              key={i}
                              className={`inline-block w-4 h-4 rounded text-[10px] font-black leading-4 text-center font-mono ${
                                res === 'W'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                  : res === 'D'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700/60'
                              }`}
                              title={res === 'W' ? 'Win (3 pts)' : res === 'D' ? 'Draw (1 pt)' : 'Loss (0 pts)'}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded bg-red-950/60 text-red-400 font-mono font-black text-sm border border-red-800/60">
                        {s.points}
                      </span>
                    </td>

                    {/* Arrow / Detail CTA */}
                    <td className="py-3 px-2 text-center text-neutral-600 group-hover:text-neutral-300 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend & Tie-Breaker Info */}
      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 px-2 py-1 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600/80"></span>
            <span>Championship Playoff Zone (Top 4)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80"></span>
            <span>League Leader</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-neutral-400 font-mono text-[11px]">
            <Info className="w-3.5 h-3.5 text-red-500" />
            <span>Scoring: Win = 3 pts · Draw (2-2) = 1 pt · Loss = 0 pts | Tie-breakers: PTS &gt; +/- &gt; LF &gt; 3-Dart Avg</span>
          </div>
          {onGoToRules && (
            <button
              onClick={onGoToRules}
              className="text-xs text-red-400 hover:text-red-300 underline font-semibold transition-colors"
            >
              Full Rules & Scoring &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
