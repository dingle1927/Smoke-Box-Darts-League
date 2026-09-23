import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, Clock, Edit2, RotateCcw, Target } from 'lucide-react';
import { Player, MatchResult, Fixture } from '../types/darts';
import { BearAvatar } from './BearAvatar';

interface FixturesListProps {
  players: Player[];
  fixtures: Fixture[];
  matches: MatchResult[];
  onSelectPlayer: (playerId: string) => void;
  onOpenScoreEntry: (p1Id: string, p2Id: string, fixtureId: string, round: 1 | 2) => void;
  onEditMatch: (match: MatchResult) => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
}

export const FixturesList: React.FC<FixturesListProps> = ({
  players,
  fixtures,
  matches,
  onSelectPlayer,
  onOpenScoreEntry,
  onEditMatch,
  isAdmin,
  onOpenAdminModal,
}) => {
  const [roundFilter, setRoundFilter] = useState<'all' | '1' | '2'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'unplayed'>('all');
  const [playerFilter, setPlayerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);

  const filteredFixtures = useMemo(() => {
    return fixtures.filter(f => {
      // Round filter
      if (roundFilter !== 'all' && f.round !== Number(roundFilter)) return false;

      // Status filter
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;

      // Player filter
      if (playerFilter !== 'all' && f.player1Id !== playerFilter && f.player2Id !== playerFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const p1 = playerMap.get(f.player1Id);
        const p2 = playerMap.get(f.player2Id);
        const query = searchQuery.toLowerCase();
        const matchesP1 = p1 && (p1.name.toLowerCase().includes(query) || p1.nickname.toLowerCase().includes(query));
        const matchesP2 = p2 && (p2.name.toLowerCase().includes(query) || p2.nickname.toLowerCase().includes(query));
        if (!matchesP1 && !matchesP2) return false;
      }

      return true;
    });
  }, [fixtures, roundFilter, statusFilter, playerFilter, searchQuery, playerMap]);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              League Fixtures & Results
            </h2>
            <p className="text-xs text-neutral-400">
              Showing {filteredFixtures.length} of {fixtures.length} matches (Double Round-Robin)
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-800 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <span className="px-2 text-neutral-500 font-semibold">Status:</span>
            {(['all', 'completed', 'unplayed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Round Filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            <span className="px-2 text-neutral-500 font-semibold">Stage:</span>
            {(['all', '1', '2'] as const).map(rd => (
              <button
                key={rd}
                onClick={() => setRoundFilter(rd)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  roundFilter === rd
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {rd === 'all' ? 'All Rounds' : `Round ${rd}`}
              </button>
            ))}
          </div>

          {/* Filter by Specific Player */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1 rounded-lg border border-neutral-800 ml-auto">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={playerFilter}
              onChange={e => setPlayerFilter(e.target.value)}
              className="bg-transparent text-neutral-200 text-xs focus:outline-none"
            >
              <option value="all" className="bg-neutral-900 text-white">All Players</option>
              {players.map(p => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                  {p.name} ({p.nickname})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fixtures Grid / List */}
      {filteredFixtures.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/60 rounded-xl border border-neutral-800">
          <p className="text-neutral-400 font-bold">No fixtures match the selected filters</p>
          <button
            onClick={() => {
              setRoundFilter('all');
              setStatusFilter('all');
              setPlayerFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-red-400 hover:text-red-300 font-bold underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFixtures.map(fixture => {
            const p1 = playerMap.get(fixture.player1Id);
            const p2 = playerMap.get(fixture.player2Id);
            if (!p1 || !p2) return null;

            const res = fixture.matchResult;
            const isCompleted = fixture.status === 'completed' && res;

            return (
              <div
                key={fixture.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-neutral-900/90 border-neutral-800 shadow-md'
                    : 'bg-neutral-950/70 border-neutral-800/80 border-dashed hover:border-neutral-700'
                }`}
              >
                {/* Top header */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                        fixture.round === 1
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                      }`}
                    >
                      Round {fixture.round}
                    </span>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-neutral-500 font-medium text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>Unplayed</span>
                      </span>
                    )}
                  </div>

                  {isCompleted && (
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {new Date(res.playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Score / Players Bar */}
                <div className="space-y-2.5">
                  {/* Player 1 Row */}
                  <div
                    onClick={() => onSelectPlayer(p1.id)}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BearAvatar player={p1} size="xs" />
                      <div className="truncate">
                        <span className={`font-bold text-sm group-hover:text-red-400 transition-colors ${
                          isCompleted && res.winnerId === p1.id ? 'text-white' : 'text-neutral-300'
                        }`}>
                          {p1.name}
                        </span>
                        <span className="text-xs text-neutral-500 ml-1.5 hidden sm:inline">
                          "{p1.nickname}"
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <div className="text-right text-[11px] text-neutral-400 font-mono hidden sm:block">
                          <span>{res.player1Avg > 0 ? `${res.player1Avg} avg` : ''}</span>
                          {res.player1180s > 0 && <span className="text-red-400 ml-1.5">{res.player1180s}x 180</span>}
                        </div>
                      )}
                      <span className={`w-7 text-center font-mono font-black text-base rounded ${
                        isCompleted
                          ? res.winnerId === p1.id
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'text-neutral-500'
                          : 'text-neutral-600'
                      }`}>
                        {isCompleted ? res.player1Legs : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Player 2 Row */}
                  <div
                    onClick={() => onSelectPlayer(p2.id)}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BearAvatar player={p2} size="xs" />
                      <div className="truncate">
                        <span className={`font-bold text-sm group-hover:text-blue-400 transition-colors ${
                          isCompleted && res.winnerId === p2.id ? 'text-white' : 'text-neutral-300'
                        }`}>
                          {p2.name}
                        </span>
                        <span className="text-xs text-neutral-500 ml-1.5 hidden sm:inline">
                          "{p2.nickname}"
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <div className="text-right text-[11px] text-neutral-400 font-mono hidden sm:block">
                          <span>{res.player2Avg > 0 ? `${res.player2Avg} avg` : ''}</span>
                          {res.player2180s > 0 && <span className="text-red-400 ml-1.5">{res.player2180s}x 180</span>}
                        </div>
                      )}
                      <span className={`w-7 text-center font-mono font-black text-base rounded ${
                        isCompleted
                          ? res.winnerId === p2.id
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'text-neutral-500'
                          : 'text-neutral-600'
                      }`}>
                        {isCompleted ? res.player2Legs : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer notes or action */}
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  {isCompleted ? (
                    <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                      {res.notes || (
                        <span>
                          Checkouts: {res.player1HighestCheckout > 0 ? `${p1.name.split(' ')[0]} ${res.player1HighestCheckout}` : ''}
                          {res.player1HighestCheckout > 0 && res.player2HighestCheckout > 0 ? ' · ' : ''}
                          {res.player2HighestCheckout > 0 ? `${p2.name.split(' ')[0]} ${res.player2HighestCheckout}` : ''}
                          {res.player1HighestCheckout === 0 && res.player2HighestCheckout === 0 ? 'Best of 5 301' : ''}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-500">Unplayed league fixture</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      isAdmin && (
                        <button
                          onClick={() => onEditMatch(res)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-semibold border border-neutral-700 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit / Undo</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            onOpenAdminModal();
                          } else {
                            onOpenScoreEntry(p1.id, p2.id, fixture.id, fixture.round);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shadow transition-all"
                      >
                        <Target className="w-3 h-3" />
                        <span>Score Match</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
