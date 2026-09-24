import React, { useState } from 'react';
import { Trophy, ArrowLeft, Target, Award, Zap, CheckCircle, XCircle, Users, Newspaper, Sparkles, Copy, Check, ShieldAlert, Sliders, Scissors } from 'lucide-react';
import { Player, MatchResult, PlayerStats, ScenarioPreset } from '../types/darts';
import { getHeadToHeadRecords } from '../utils/statsCalculator';
import { generateLeagueNews, getNewsForPlayer, SCENARIO_PRESETS, buildScenarioPrompt } from '../utils/aiNewsGenerator';
import { BearAvatar } from './BearAvatar';
import { ASSETS } from '../utils/assets';
import { AIImageStudioModal } from './AIImageStudioModal';
import { PlayerPhotoModal } from './PlayerPhotoModal';

interface PlayerProfileProps {
  playerId: string;
  players: Player[];
  matches: MatchResult[];
  stats: PlayerStats[];
  onBack: () => void;
  onSelectOtherPlayer: (id: string) => void;
  onScoreMatchWith?: (opponentId: string) => void;
  onUpdatePlayerPhotoAndShirt?: (playerId: string, photoUrl: string, shirtColors: any, preferredScenario: any) => Promise<void> | void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  playerId,
  players,
  matches,
  stats,
  onBack,
  onSelectOtherPlayer,
  onScoreMatchWith,
  onUpdatePlayerPhotoAndShirt,
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'h2h' | 'news'>('matches');
  const [activeScenario, setActiveScenario] = useState<ScenarioPreset>('throwing');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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

  // AI News items involving this player
  const allNews = generateLeagueNews(players, matches, stats);
  const playerNews = getNewsForPlayer(playerId, allNews);

  const getScenarioArtwork = (preset: ScenarioPreset) => {
    switch (preset) {
      case 'cigarette':
        return ASSETS.scenarios.cigarette;
      case 'disappointment':
        return ASSETS.scenarios.disappointment;
      case 'celebration':
        return ASSETS.scenarios.celebration;
      case 'throwing':
      default:
        return ASSETS.scenarios.throwing;
    }
  };

  const handleCopyPrompt = () => {
    const prompt = buildScenarioPrompt(player, activeScenario);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

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

      {/* Featured Profile Banner: High-impact hero section with dynamic AI background image */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl">
        {/* Dynamic AI Background Image */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-neutral-950">
          <img
            src={getScenarioArtwork(activeScenario)}
            alt={`${player.name} in action`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-75 contrast-110 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-neutral-950/80" />

          {/* Top Info Badges */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-950/50">
                Rank #{playerStat.rank} in League
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-900/90 text-amber-300 border border-neutral-700 backdrop-blur-md">
                ★ Custom Darts Shirt · Zero Green Safe
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPhotoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-600 backdrop-blur-md transition-all shadow-md"
                title="Upload photo, run AI face cutout, and style onto standardized uniform"
              >
                <Scissors className="w-3.5 h-3.5 text-blue-300" />
                <span>Upload & Cutout Headshot</span>
              </button>

              <button
                onClick={() => setIsStudioOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 backdrop-blur-md transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Media Studio</span>
              </button>
            </div>
          </div>

          {/* Bottom Hero Foreground: Player Face Photo Styled into Custom Darts Shirt */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6 bg-neutral-950/85 backdrop-blur-md p-4 rounded-2xl border border-neutral-800/90 shadow-2xl max-w-xl">
              <div
                className="relative cursor-pointer group"
                onClick={() => setIsPhotoModalOpen(true)}
                title="Click to run AI Face Cutout & style onto standardized uniform"
              >
                <BearAvatar player={player} size="xl" className="group-hover:ring-2 group-hover:ring-blue-500 transition-all" />
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-blue-600 text-[10px] font-mono font-black text-white shadow group-hover:bg-blue-500">
                  EDIT
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-mono">
                    Member since {player.joinedDate}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-sans truncate">
                  {player.name}
                </h1>
                <p className="text-base text-red-400 font-bold tracking-wide">
                  "{player.nickname}"
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-300">
                  <span className="text-neutral-400">Custom Apparel:</span>
                  <span className="font-semibold text-white">
                    {player.customShirtColors?.primary || 'Crimson Red'} & {player.customShirtColors?.secondary || 'Obsidian Black'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Standings Numbers */}
            <div className="bg-neutral-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-800/90 flex items-center gap-4 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Points
                </span>
                <span className="text-2xl sm:text-3xl font-black text-red-500 font-mono">
                  {playerStat.points}
                </span>
              </div>
              <div className="h-8 w-px bg-neutral-800" />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Record
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {playerStat.won}W - {playerStat.drawn}D - {playerStat.lost}L
                </span>
              </div>
              <div className="h-8 w-px bg-neutral-800" />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  Win Rate
                </span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {playerStat.winRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Scenario Switcher Bar */}
        <div className="p-3 sm:p-4 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-1 shrink-0">
              AI Scenario:
            </span>
            <button
              onClick={() => setActiveScenario('throwing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeScenario === 'throwing'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                  : 'bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              🎯 Precision Dart Throw
            </button>
            <button
              onClick={() => setActiveScenario('cigarette')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeScenario === 'cigarette'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                  : 'bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              🚬 Dart with Cigarette
            </button>
            <button
              onClick={() => setActiveScenario('disappointment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeScenario === 'disappointment'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                  : 'bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              🤦 Disappointment (Hands on Head)
            </button>
            <button
              onClick={() => setActiveScenario('celebration')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeScenario === 'celebration'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              🏆 Roaring Crowd Celebration
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 transition-colors"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy AI Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-neutral-950/50 border-t border-neutral-800">
          <div className="bg-neutral-900/80 rounded-xl p-3.5 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>Overall 3-Dart Avg</span>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {playerStat.overallAverage > 0 ? playerStat.overallAverage.toFixed(1) : '—'}
            </div>
          </div>

          <div className="bg-neutral-900/80 rounded-xl p-3.5 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Highest Match Avg</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {playerStat.highestAverage > 0 ? playerStat.highestAverage.toFixed(1) : '—'}
            </div>
          </div>

          <div className="bg-neutral-900/80 rounded-xl p-3.5 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-red-400" />
              <span>Total 180s</span>
            </div>
            <div className="text-2xl font-black text-red-500 font-mono mt-1">
              {playerStat.total180s}
            </div>
          </div>

          <div className="bg-neutral-900/80 rounded-xl p-3.5 border border-neutral-800/80">
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

      {/* Tabs: Match History vs Head-to-Head vs Past Player News */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'matches'
              ? 'bg-neutral-800 text-white border border-neutral-700 text-red-400 shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4 text-red-500" />
          <span>Match History ({playerMatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'news'
              ? 'bg-neutral-800 text-white border border-neutral-700 text-amber-400 shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4 text-amber-400" />
          <span>Past Player News ({playerNews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('h2h')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === 'h2h'
              ? 'bg-neutral-800 text-white border border-neutral-700 text-blue-400 shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Head-to-Head ({h2hRecords.length})</span>
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
              const isDraw = m.player1Legs === m.player2Legs;
              const won = !isDraw && (m.winnerId === playerId || (isP1 ? m.player1Legs > m.player2Legs : m.player2Legs > m.player1Legs));
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
                    isDraw
                      ? 'bg-neutral-900/90 border-amber-900/40 shadow-sm'
                      : won
                      ? 'bg-neutral-900/90 border-emerald-900/40 shadow-sm'
                      : 'bg-neutral-950/80 border-neutral-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        isDraw
                          ? 'bg-amber-950 text-amber-400'
                          : won
                          ? 'bg-emerald-950 text-emerald-400'
                          : 'bg-neutral-900 text-neutral-500'
                      }`}>
                        {isDraw ? (
                          <span className="font-mono font-black text-sm px-1">=</span>
                        ) : won ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-neutral-400">
                            Round {m.round}
                          </span>
                          <span className="text-neutral-500 text-xs">·</span>
                          <span className="text-xs text-neutral-500 font-mono">
                            {new Date(m.playedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                          <span>vs</span>
                          <button
                            type="button"
                            onClick={() => onSelectOtherPlayer(opponentId)}
                            className="hover:text-red-400 transition-colors underline decoration-dotted"
                          >
                            {opponent?.name || 'Unknown'}
                          </button>
                          <span className="text-xs text-neutral-400">"{opponent?.nickname}"</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-2xl font-black font-mono tracking-wider">
                          <span className={won ? 'text-emerald-400' : isDraw ? 'text-amber-400' : 'text-neutral-200'}>
                            {myLegs}
                          </span>
                          <span className="text-neutral-600 mx-1">-</span>
                          <span className={oppLegs > myLegs ? 'text-emerald-400' : 'text-neutral-500'}>
                            {oppLegs}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          Avg: {myAvg.toFixed(1)} vs {oppAvg.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 2: Past Player News Timeline (Archive of all AI news cards involving this player) */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-red-500" />
                <span>Historical AI News Timeline: {player.name}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Dynamic news stories, tactical breakthroughs, and scenario reports generated from live league statistics.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-2.5 py-1 rounded-full border border-red-800">
              {playerNews.length} Archive Articles
            </span>
          </div>

          {playerNews.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-neutral-800 text-neutral-400 text-sm">
              No news items recorded for {player.name} yet this season. Play matches to generate live AI coverage!
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-red-900/40 space-y-6">
              {playerNews.map((item, idx) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-red-600 border-4 border-neutral-950 group-hover:scale-125 transition-transform" />

                  <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-red-600/50 transition-all shadow-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-red-950 text-red-400 border border-red-800">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                          {new Date(item.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-950 text-neutral-300 border border-neutral-800">
                        Scenario: {item.scenarioTitle}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-white group-hover:text-red-400 transition-colors leading-snug">
                      {item.headline}
                    </h4>

                    <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                      {item.summary}
                    </p>

                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-400 leading-relaxed">
                      {item.article}
                    </div>

                    {/* AI Prompt Inspector for this news card */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Rule Verified: Zero Green Apparel
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.customPrompt);
                          alert('AI Scenario Prompt copied to clipboard!');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Story Prompt</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Head to Head */}
      {activeTab === 'h2h' && (
        <div className="space-y-3">
          {h2hRecords.map(rec => {
            const hasPlayed = rec.played > 0;
            return (
              <div
                key={rec.opponent.id}
                className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <BearAvatar player={rec.opponent} size="md" />
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectOtherPlayer(rec.opponent.id)}
                      className="font-bold text-base text-white hover:text-red-400 transition-colors text-left"
                    >
                      {rec.opponent.name}
                    </button>
                    <div className="text-xs text-neutral-400">"{rec.opponent.nickname}"</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono">
                      {hasPlayed ? (
                        <>
                          <span className="text-emerald-400">{rec.wins}W</span>
                          <span className="text-neutral-500"> - </span>
                          <span className="text-amber-400">{rec.draws}D</span>
                          <span className="text-neutral-500"> - </span>
                          <span className="text-red-400">{rec.losses}L</span>
                        </>
                      ) : (
                        <span className="text-neutral-500">Not played</span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Legs: {rec.legsFor} - {rec.legsAgainst}
                    </div>
                  </div>

                  {onScoreMatchWith && rec.unplayedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onScoreMatchWith(rec.opponent.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      Play Match
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Image Studio Modal */}
      <AIImageStudioModal
        player={player}
        isOpen={isStudioOpen}
        initialPreset={activeScenario}
        onClose={() => setIsStudioOpen(false)}
        onApplyScenarioToPlayer={async (scenario, shirtColors) => {
          setActiveScenario(scenario);
          if (onUpdatePlayerPhotoAndShirt) {
            await onUpdatePlayerPhotoAndShirt(
              player.id,
              player.photoUrl || player.avatarSeed || '',
              shirtColors,
              scenario
            );
          }
        }}
      />

      {/* AI Face Cutout & Standardized Uniform Studio Modal */}
      {isPhotoModalOpen && (
        <PlayerPhotoModal
          player={player}
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onSave={async (playerIdToSave, photoUrl, shirtColors, scenario) => {
            if (onUpdatePlayerPhotoAndShirt) {
              await onUpdatePlayerPhotoAndShirt(
                playerIdToSave,
                photoUrl,
                shirtColors,
                scenario
              );
            }
          }}
        />
      )}
    </div>
  );
};
