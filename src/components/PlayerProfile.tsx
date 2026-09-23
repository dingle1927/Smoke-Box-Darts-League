import React, { useState } from 'react';
import { Trophy, ArrowLeft, Target, Award, Zap, CheckCircle, XCircle, Users } from 'lucide-react';
import { Player, MatchResult, PlayerStats } from '../types/darts';
import { getHeadToHeadRecords } from '../utils/statsCalculator';
import { BearAvatar } from './BearAvatar';

interface PlayerProfileProps {
  playerId: string;
  players: Player[];
  matches: MatchResult[];
  stats: PlayerStats[];
  onBack: () => void;
  onSelectOtherPlayer: (id: string) => void;
  onScoreMatchWith?: (opponentId: string) => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  playerId,
  players,
  matches,
  stats,
  onBack,
  onSelectOtherPlayer,
  onScoreMatchWith,
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'h2h'>('matches');

  const player = players.find(p => p.id === playerId);
  const playerStat = stats.find(s => s.player.id === playerId);

  if (!player || !playerStat) {
    return (
      <div className="text-center py-16 bg-neutral-900 rounded-xl border border-neutral-800">
        <p className="text-neutral-400">Player not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
        >
          Return to Standings
        </button>
      </div>
    );
  }

  // Matches involving this player
  const playerMatches = matches
    .filter(m => m.player1Id === playerId || m.player2Id === playerId)
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());

  // Head to head records
  const h2hRecords = getHeadToHeadRecords(playerId, players, matches);
  const playerMap = new Map(players.map(p => [p.id, p]));

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to League Standings</span>
      </button>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <BearAvatar player={player} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono font-black uppercase tracking-wider">
                  Rank #{playerStat.rank}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  Member since {player.joinedDate}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-1 font-sans">
                {player.name}
              </h1>
              <p className="text-base text-red-400 font-bold tracking-wide">
                "{player.nickname}"
              </p>

              {/* Form Bar */}
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-xs text-neutral-400 font-semibold mr-1">Recent Form:</span>
                {playerStat.form.length === 0 ? (
                  <span className="text-xs text-neutral-500">No games yet</span>
                ) : (
                  playerStat.form.map((res, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-black ${
                        res === 'W'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {res}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Points & Record Widget */}
          <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800 self-stretch sm:self-auto flex sm:flex-col items-center justify-between sm:justify-center text-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                League Points
              </span>
              <span className="text-3xl font-black text-red-500 font-mono">
                {playerStat.points}
              </span>
            </div>
            <div className="text-right sm:text-center">
              <span className="text-xs font-bold text-neutral-200">
                {playerStat.won}W - {playerStat.lost}L
              </span>
              <span className="text-[11px] text-neutral-400 block font-mono">
                {playerStat.winRate}% win rate
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-800">
          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>Overall 3-Dart Avg</span>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {playerStat.overallAverage > 0 ? playerStat.overallAverage.toFixed(1) : '—'}
            </div>
          </div>

          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Highest Match Avg</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {playerStat.highestAverage > 0 ? playerStat.highestAverage.toFixed(1) : '—'}
            </div>
          </div>

          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-red-400" />
              <span>Total 180s</span>
            </div>
            <div className="text-2xl font-black text-red-500 font-mono mt-1">
              {playerStat.total180s}
            </div>
          </div>

          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Highest Checkout</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {playerStat.highestCheckout > 0 ? playerStat.highestCheckout : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Match History vs Head-to-Head */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            activeTab === 'matches'
              ? 'bg-neutral-800 text-white border border-neutral-700 text-red-400'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 text-red-500" />
          <span>Match History ({playerMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('h2h')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            activeTab === 'h2h'
              ? 'bg-neutral-800 text-white border border-neutral-700 text-blue-400'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Head-to-Head Records ({h2hRecords.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Match History */}
      {activeTab === 'matches' && (
        <div className="space-y-3">
          {playerMatches.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/60 rounded-xl border border-neutral-800 text-neutral-400 text-sm">
              No completed matches on record for {player.name} yet.
            </div>
          ) : (
            playerMatches.map(m => {
              const isP1 = m.player1Id === playerId;
              const opponentId = isP1 ? m.player2Id : m.player1Id;
              const opponent = playerMap.get(opponentId);
              const won = m.winnerId === playerId;
              const myLegs = isP1 ? m.player1Legs : m.player2Legs;
              const oppLegs = isP1 ? m.player2Legs : m.player1Legs;
              const myAvg = isP1 ? m.player1Avg : m.player2Avg;
              const oppAvg = isP1 ? m.player2Avg : m.player1Avg;
              const my180s = isP1 ? m.player1180s : m.player2180s;
              const myCheckout = isP1 ? m.player1HighestCheckout : m.player2HighestCheckout;

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition-all ${
                    won
                      ? 'bg-neutral-900/90 border-emerald-900/40 shadow-sm'
                      : 'bg-neutral-950/80 border-neutral-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${won ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                        {won ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                            won ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-900 text-neutral-400'
                          }`}>
                            {won ? 'VICTORY' : 'DEFEAT'}
                          </span>
                          <span className="text-xs text-neutral-400">
                            Round {m.round} · {new Date(m.playedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-400 font-semibold">vs</span>
                          <button
                            onClick={() => opponent && onSelectOtherPlayer(opponent.id)}
                            className="font-bold text-white hover:text-red-400 transition-colors"
                          >
                            {opponent?.name} ("{opponent?.nickname}")
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right text-xs text-neutral-400 font-mono">
                        <div>Avg: <span className="text-white font-bold">{myAvg > 0 ? myAvg.toFixed(1) : '—'}</span></div>
                        {my180s > 0 && <div className="text-red-400">{my180s}x 180s</div>}
                        {myCheckout > 0 && <div className="text-emerald-400">High Out: {myCheckout}</div>}
                      </div>

                      <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 font-mono font-black text-lg">
                        <span className={won ? 'text-emerald-400' : 'text-neutral-400'}>{myLegs}</span>
                        <span className="text-neutral-600">-</span>
                        <span className={!won ? 'text-red-400' : 'text-neutral-400'}>{oppLegs}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 2: Head-to-Head Matrix */}
      {activeTab === 'h2h' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {h2hRecords.map(rec => {
            const opp = rec.opponent;
            const isDominating = rec.played > 0 && rec.wins > rec.losses;
            const isBehind = rec.played > 0 && rec.losses > rec.wins;

            return (
              <div
                key={opp.id}
                className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-colors shadow-md"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div
                    onClick={() => onSelectOtherPlayer(opp.id)}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <BearAvatar player={opp} size="xs" />
                    <div>
                      <div className="font-bold text-sm text-neutral-100 group-hover:text-red-400 transition-colors">
                        {opp.name}
                      </div>
                      <div className="text-[11px] text-neutral-400">"{opp.nickname}"</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isDominating
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : isBehind
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {rec.wins}W - {rec.losses}L
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
                  <span>
                    Legs: <strong className="text-white font-mono">{rec.legsFor}-{rec.legsAgainst}</strong>
                  </span>
                  <span>
                    {rec.unplayedCount > 0 ? (
                      <span className="text-blue-400 font-semibold">{rec.unplayedCount} unplayed remaining</span>
                    ) : (
                      <span className="text-neutral-500">Fixture completed</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
