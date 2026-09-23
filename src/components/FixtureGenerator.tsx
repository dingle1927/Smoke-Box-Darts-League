import React, { useState, useMemo } from 'react';
import { CalendarCheck, Users, Play, CheckSquare, Square, RotateCcw, Target, Shield, Copy, Check } from 'lucide-react';
import { Player, MatchResult } from '../types/darts';
import { generateSessionSchedule, GeneratedScheduleResult } from '../utils/fixtureGenerator';
import { BearAvatar } from './BearAvatar';

interface FixtureGeneratorProps {
  players: Player[];
  completedMatches: MatchResult[];
  onOpenScoreEntryForMatch: (p1Id: string, p2Id: string, fixtureId: string, round: 1 | 2) => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
}

export const FixtureGenerator: React.FC<FixtureGeneratorProps> = ({
  players,
  completedMatches,
  onOpenScoreEntryForMatch,
  isAdmin,
  onOpenAdminModal,
}) => {
  const activePlayers = useMemo(() => players.filter(p => p.active), [players]);

  // Default: select the first 6 players as present
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() =>
    activePlayers.slice(0, 6).map(p => p.id)
  );

  const [maxMatches, setMaxMatches] = useState<number>(8);
  const [boardCount, setBoardCount] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  // Toggle player selection
  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedPlayerIds(activePlayers.map(p => p.id));
  const deselectAll = () => setSelectedPlayerIds([]);

  // Generate the schedule
  const scheduleResult: GeneratedScheduleResult = useMemo(() => {
    return generateSessionSchedule(
      selectedPlayerIds,
      players,
      completedMatches,
      maxMatches,
      boardCount
    );
  }, [selectedPlayerIds, players, completedMatches, maxMatches, boardCount]);

  const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

  // Copy schedule text
  const handleCopySchedule = () => {
    if (scheduleResult.recommendedMatches.length === 0) return;
    const lines = [
      `🎯 THE SMOKE BOX DARTS LEAGUE — SESSION SCHEDULE`,
      `📅 Generated: ${new Date().toLocaleDateString()} (${selectedPlayerIds.length} players available)`,
      `----------------------------------------`,
    ];

    scheduleResult.recommendedMatches.forEach(m => {
      const p1 = playerMap.get(m.player1Id);
      const p2 = playerMap.get(m.player2Id);
      lines.push(
        `Match ${m.order} [${boardCount > 1 ? `Board ${m.boardNumber} · ` : ''}R${m.round}]: ${p1?.name} vs ${p2?.name}`
      );
    });

    lines.push(`----------------------------------------`);
    lines.push(`Best of 5 legs · 301 Double Out`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 mb-1">
              <CalendarCheck className="w-4 h-4" />
              <span>Dynamic Session Scheduler</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-sans">
              Availability Fixture Generator
            </h2>
            <p className="text-neutral-400 text-sm max-w-2xl mt-1">
              Check off which players are in attendance tonight. The engine searches all remaining unplayed league fixtures between them (each player plays each other once) and builds a balanced, rested match order.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-neutral-950 px-4 py-3 rounded-xl border border-neutral-800 text-center">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-bold">
                Present Tonight
              </span>
              <span className="text-2xl font-black text-white font-mono">
                {selectedPlayerIds.length} <span className="text-xs text-neutral-500 font-sans">/ {activePlayers.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Who is here tonight? (Availability Checklist) */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Step 1: Check Available Players</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Select at least 2 players to generate matchups
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Select All</span>
            </button>
            <button
              onClick={deselectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs font-bold border border-neutral-700 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {activePlayers.map(player => {
            const isSelected = selectedPlayerIds.includes(player.id);
            return (
              <div
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  isSelected
                    ? 'bg-neutral-800/90 border-blue-500/80 shadow-md shadow-blue-950/30 ring-1 ring-blue-500/40'
                    : 'bg-neutral-950/60 border-neutral-800/80 opacity-65 hover:opacity-100 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BearAvatar player={player} size="sm" />
                  <div className="min-w-0">
                    <div className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                      {player.name}
                    </div>
                    <div className="text-xs text-neutral-400 truncate">
                      "{player.nickname}"
                    </div>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                  isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-neutral-700 bg-neutral-900'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Session Parameters & Recommended Matches */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Play className="w-5 h-5 text-red-500" />
              <span>Step 2: Generated Match Schedule</span>
            </h3>
            <p className="text-xs text-neutral-400">
              {scheduleResult.totalAvailableMatches} remaining league matches found between selected players
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-xs text-neutral-400 font-semibold">Boards:</span>
              <select
                value={boardCount}
                onChange={e => setBoardCount(Number(e.target.value))}
                className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none"
              >
                <option value={1} className="bg-neutral-900 text-white">1 Board</option>
                <option value={2} className="bg-neutral-900 text-white">2 Boards</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
              <span className="text-xs text-neutral-400 font-semibold">Max Matches:</span>
              <select
                value={maxMatches}
                onChange={e => setMaxMatches(Number(e.target.value))}
                className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none"
              >
                <option value={4} className="bg-neutral-900 text-white">4 matches</option>
                <option value={6} className="bg-neutral-900 text-white">6 matches</option>
                <option value={8} className="bg-neutral-900 text-white">8 matches</option>
                <option value={12} className="bg-neutral-900 text-white">12 matches</option>
                <option value={20} className="bg-neutral-900 text-white">All available</option>
              </select>
            </div>

            {scheduleResult.recommendedMatches.length > 0 && (
              <button
                onClick={handleCopySchedule}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{copied ? 'Copied!' : 'Copy Schedule'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Schedule List */}
        {selectedPlayerIds.length < 2 ? (
          <div className="text-center py-12 px-4 bg-neutral-950/40 rounded-xl border border-dashed border-neutral-800">
            <Users className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-300 font-bold">Please select at least 2 available players</p>
            <p className="text-xs text-neutral-500 mt-1">Check the boxes in Step 1 to generate the matchups.</p>
          </div>
        ) : scheduleResult.recommendedMatches.length === 0 ? (
          <div className="text-center py-12 px-4 bg-neutral-950/40 rounded-xl border border-dashed border-neutral-800">
            <CheckSquare className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-neutral-200 font-bold">All league matches between these players have already been played!</p>
            <p className="text-xs text-neutral-400 mt-1">
              Select other players who still have unplayed fixtures, or review completed games in Fixtures & Results.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleResult.recommendedMatches.map((m, idx) => {
              const p1 = playerMap.get(m.player1Id);
              const p2 = playerMap.get(m.player2Id);
              if (!p1 || !p2) return null;

              return (
                <div
                  key={`${m.fixtureId}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/90 hover:border-neutral-700 transition-all shadow-md group"
                >
                  {/* Match Info & Order */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 shrink-0 font-mono">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">M</span>
                      <span className="text-sm font-black text-white">{m.order}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs mb-1">
                        <span className="px-2 py-0.5 rounded font-mono font-black text-[10px] uppercase bg-blue-950 text-blue-300 border border-blue-800">
                          League Match
                        </span>
                        {boardCount > 1 && (
                          <span className="text-neutral-400 font-mono text-[11px]">
                            Board {m.boardNumber}
                          </span>
                        )}
                        <span className="text-neutral-400 text-[11px]">· {m.reason}</span>
                      </div>

                      {/* Head to Head Display */}
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <BearAvatar player={p1} size="xs" />
                          <span className="font-bold text-white text-sm sm:text-base group-hover:text-red-400 transition-colors">
                            {p1.name}
                          </span>
                        </div>
                        <span className="text-xs font-black uppercase text-neutral-500 px-1 font-mono">
                          VS
                        </span>
                        <div className="flex items-center gap-2">
                          <BearAvatar player={p2} size="xs" />
                          <span className="font-bold text-white text-sm sm:text-base group-hover:text-blue-400 transition-colors">
                            {p2.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        if (!isAdmin) {
                          onOpenAdminModal();
                        } else {
                          onOpenScoreEntryForMatch(p1.id, p2.id, m.fixtureId, m.round);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-950/40 transition-all hover:scale-105 active:scale-95"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Score Match</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Player Session Workload Breakdown */}
        {selectedPlayerIds.length >= 2 && scheduleResult.recommendedMatches.length > 0 && (
          <div className="pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Games Allocated Per Player Tonight:
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedPlayerIds.map(id => {
                const p = playerMap.get(id);
                if (!p) return null;
                const count = scheduleResult.playerGameCounts[id] || 0;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 text-xs"
                  >
                    <span className="text-neutral-300 font-medium">{p.name}:</span>
                    <span className="font-mono font-bold text-blue-400">{count} games</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
