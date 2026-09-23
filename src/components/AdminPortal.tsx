import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Edit3, Save, X, RotateCcw, AlertTriangle, Key, Users, Trophy, Target } from 'lucide-react';
import { Player, MatchResult, Fixture } from '../types/darts';
import { BearAvatar } from './BearAvatar';

interface AdminPortalProps {
  players: Player[];
  fixtures: Fixture[];
  matches: MatchResult[];
  onSaveMatchResult: (match: MatchResult) => void;
  onDeleteMatchResult: (matchId: string) => void;
  onUpdatePlayers: (players: Player[]) => void;
  onDeletePlayer?: (playerId: string) => void;
  onResetData: () => void;
  onClearMatches: () => void;
  onClose: () => void;
  initialSelectedFixture?: { p1Id: string; p2Id: string; fixtureId: string; round: 1 | 2 } | null;
  editingMatch?: MatchResult | null;
  onClearEditingMatch?: () => void;
  adminPin: string;
  onUpdateAdminPin: (newPin: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  players,
  fixtures,
  matches,
  onSaveMatchResult,
  onDeleteMatchResult,
  onUpdatePlayers,
  onDeletePlayer,
  onResetData,
  onClearMatches,
  onClose,
  initialSelectedFixture,
  editingMatch,
  onClearEditingMatch,
  adminPin,
  onUpdateAdminPin,
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'history' | 'players' | 'settings'>(
    editingMatch ? 'score' : initialSelectedFixture ? 'score' : 'score'
  );

  // Form State for Score Entry
  const [player1Id, setPlayer1Id] = useState<string>(
    editingMatch?.player1Id || initialSelectedFixture?.p1Id || players[0]?.id || ''
  );
  const [player2Id, setPlayer2Id] = useState<string>(
    editingMatch?.player2Id || initialSelectedFixture?.p2Id || players[1]?.id || ''
  );
  const [round, setRound] = useState<1 | 2>(
    editingMatch?.round || initialSelectedFixture?.round || 1
  );

  const [p1Legs, setP1Legs] = useState<number>(editingMatch?.player1Legs ?? 3);
  const [p2Legs, setP2Legs] = useState<number>(editingMatch?.player2Legs ?? 1);
  const [p1Avg, setP1Avg] = useState<string>(editingMatch?.player1Avg?.toString() || '68.5');
  const [p2Avg, setP2Avg] = useState<string>(editingMatch?.player2Avg?.toString() || '62.0');
  const [p1180s, setP1180s] = useState<number>(editingMatch?.player1180s ?? 0);
  const [p2180s, setP2180s] = useState<number>(editingMatch?.player2180s ?? 0);
  const [p1Checkout, setP1Checkout] = useState<number>(editingMatch?.player1HighestCheckout ?? 0);
  const [p2Checkout, setP2Checkout] = useState<number>(editingMatch?.player2HighestCheckout ?? 0);
  const [notes, setNotes] = useState<string>(editingMatch?.notes || '');
  const [playedAt, setPlayedAt] = useState<string>(
    editingMatch?.playedAt ? editingMatch.playedAt.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Player Management State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNickname, setNewPlayerNickname] = useState('');
  const [newPlayerBearType, setNewPlayerBearType] = useState<'grizzly' | 'smoky' | 'polar' | 'kodiak' | 'bruin'>('grizzly');
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  // PIN settings state
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  // Sync if editingMatch or initialSelectedFixture updates
  useEffect(() => {
    if (editingMatch) {
      setPlayer1Id(editingMatch.player1Id);
      setPlayer2Id(editingMatch.player2Id);
      setRound(editingMatch.round);
      setP1Legs(editingMatch.player1Legs);
      setP2Legs(editingMatch.player2Legs);
      setP1Avg(editingMatch.player1Avg.toString());
      setP2Avg(editingMatch.player2Avg.toString());
      setP1180s(editingMatch.player1180s);
      setP2180s(editingMatch.player2180s);
      setP1Checkout(editingMatch.player1HighestCheckout);
      setP2Checkout(editingMatch.player2HighestCheckout);
      setNotes(editingMatch.notes || '');
      setPlayedAt(editingMatch.playedAt.split('T')[0]);
      setActiveTab('score');
    } else if (initialSelectedFixture) {
      setPlayer1Id(initialSelectedFixture.p1Id);
      setPlayer2Id(initialSelectedFixture.p2Id);
      setRound(initialSelectedFixture.round);
      setActiveTab('score');
    }
  }, [editingMatch, initialSelectedFixture]);

  // Set preset scores
  const applyPresetScore = (legs1: number, legs2: number) => {
    setP1Legs(legs1);
    setP2Legs(legs2);
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (player1Id === player2Id) {
      setFormError('Player 1 and Player 2 must be different.');
      return;
    }

    // Best of 5 legs rule: one must have 3, the other must have <= 2
    if (!((p1Legs === 3 && p2Legs >= 0 && p2Legs <= 2) || (p2Legs === 3 && p1Legs >= 0 && p1Legs <= 2))) {
      setFormError('Best of 5 format requires the winner to reach exactly 3 legs (e.g., 3-0, 3-1, 3-2, 0-3, 1-3, 2-3).');
      return;
    }

    const winnerId = p1Legs === 3 ? player1Id : player2Id;
    const loserId = p1Legs === 3 ? player2Id : player1Id;

    // Check checkout bounds
    if (p1Checkout > 170 || p2Checkout > 170) {
      setFormError('Maximum checkout in darts is 170 (The Big Fish).');
      return;
    }

    // Derive fixture ID
    const fixtureId = editingMatch
      ? editingMatch.fixtureId
      : round === 1
      ? `r1-${player1Id}-${player2Id}`
      : `r2-${player1Id}-${player2Id}`;

    const matchToSave: MatchResult = {
      id: editingMatch ? editingMatch.id : `m-${Date.now()}`,
      fixtureId,
      round,
      player1Id,
      player2Id,
      player1Legs: p1Legs,
      player2Legs: p2Legs,
      winnerId,
      loserId,
      player1Avg: Number(parseFloat(p1Avg) || 0),
      player2Avg: Number(parseFloat(p2Avg) || 0),
      player1180s: Number(p1180s) || 0,
      player2180s: Number(p2180s) || 0,
      player1HighestCheckout: Number(p1Checkout) || 0,
      player2HighestCheckout: Number(p2Checkout) || 0,
      playedAt: new Date(playedAt).toISOString(),
      notes: notes.trim() || undefined,
    };

    onSaveMatchResult(matchToSave);
    setSuccessMsg(editingMatch ? 'Match result successfully updated!' : 'Match result recorded & saved to standings!');
    setTimeout(() => setSuccessMsg(null), 3500);

    if (editingMatch && onClearEditingMatch) {
      onClearEditingMatch();
    }
  };

  // Add new player
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    if (players.length >= 15) {
      setFormError('Maximum 15 players allowed for this league.');
      setTimeout(() => setFormError(null), 3500);
      return;
    }

    const newP: Player = {
      id: `p-${Date.now()}`,
      name: newPlayerName.trim(),
      nickname: newPlayerNickname.trim() || 'The Bear',
      avatarBearType: newPlayerBearType,
      active: true,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    onUpdatePlayers([...players, newP]);
    setNewPlayerName('');
    setNewPlayerNickname('');
    setSuccessMsg(`Player "${newP.name}" added to the league!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Toggle active player
  const handleTogglePlayerActive = (id: string) => {
    const updated = players.map(p => (p.id === id ? { ...p, active: !p.active } : p));
    onUpdatePlayers(updated);
  };

  // Confirm delete player
  const handleConfirmDeletePlayer = (p: Player) => {
    if (onDeletePlayer) {
      onDeletePlayer(p.id);
    } else {
      // Fallback: update player roster and cascade delete related matches
      onUpdatePlayers(players.filter(pl => pl.id !== p.id));
      const relatedMatches = matches.filter(m => m.player1Id === p.id || m.player2Id === p.id);
      relatedMatches.forEach(m => onDeleteMatchResult(m.id));
    }

    // Reset player selection in form if it matched the deleted player
    const remaining = players.filter(pl => pl.id !== p.id);
    if (player1Id === p.id) {
      setPlayer1Id(remaining[0]?.id || '');
    }
    if (player2Id === p.id) {
      setPlayer2Id(remaining[1]?.id || remaining[0]?.id || '');
    }

    setSuccessMsg(`Player "${p.name}" has been removed from the roster.`);
    setTimeout(() => setSuccessMsg(null), 3500);
    setPlayerToDelete(null);
  };

  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinChangeMsg('PIN must be at least 4 characters.');
      return;
    }
    onUpdateAdminPin(newPin.trim());
    setPinChangeMsg('Admin PIN successfully changed!');
    setNewPin('');
    setTimeout(() => setPinChangeMsg(null), 3000);
  };

  const playerMap = new Map(players.map(p => [p.id, p]));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950 text-red-500 border border-red-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                League Admin Portal
              </h2>
              <p className="text-xs text-neutral-400">
                Score Entry · Match Reversals · Player Roster · League Settings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto">
          {[
            { id: 'score', label: editingMatch ? 'Edit Match Score' : 'Record Score', icon: Target },
            { id: 'history', label: `Match History & Undo (${matches.length})`, icon: RotateCcw },
            { id: 'players', label: `Roster (${players.length}/15)`, icon: Users },
            { id: 'settings', label: 'League Settings', icon: Key },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== 'score' && editingMatch && onClearEditingMatch) {
                    onClearEditingMatch();
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-red-600 text-white bg-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-500' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Messages */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SCORE ENTRY */}
          {activeTab === 'score' && (
            <form onSubmit={handleScoreSubmit} className="space-y-6">
              {editingMatch && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
                  <span>Currently editing past match record <strong>#{editingMatch.id}</strong>.</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearEditingMatch) onClearEditingMatch();
                    }}
                    className="underline text-amber-400 font-bold"
                  >
                    Cancel Edit & Record New Match
                  </button>
                </div>
              )}

              {/* Match Details: Players & Round */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
                {/* Player 1 Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Player 1 (Home)
                  </label>
                  <select
                    value={player1Id}
                    onChange={e => setPlayer1Id(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} "{p.nickname}"
                      </option>
                    ))}
                  </select>
                </div>

                {/* Player 2 Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Player 2 (Away)
                  </label>
                  <select
                    value={player2Id}
                    onChange={e => setPlayer2Id(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} "{p.nickname}"
                      </option>
                    ))}
                  </select>
                </div>

                {/* Round & Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Round
                    </label>
                    <select
                      value={round}
                      onChange={e => setRound(Number(e.target.value) as 1 | 2)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white font-mono"
                    >
                      <option value={1}>Round 1</option>
                      <option value={2}>Round 2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Match Date
                    </label>
                    <input
                      type="date"
                      value={playedAt}
                      onChange={e => setPlayedAt(e.target.value)}
                      className="w-full px-2.5 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Legs Result Section (Best of 5) */}
              <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Match Result (Best of 5 Legs — First to 3)
                  </span>
                  <span className="text-xs text-neutral-500">
                    Winner must have 3 legs
                  </span>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-neutral-400 font-semibold mr-1">Quick Select:</span>
                  {[
                    { l1: 3, l2: 0, label: '3 - 0' },
                    { l1: 3, l2: 1, label: '3 - 1' },
                    { l1: 3, l2: 2, label: '3 - 2' },
                    { l1: 2, l2: 3, label: '2 - 3' },
                    { l1: 1, l2: 3, label: '1 - 3' },
                    { l1: 0, l2: 3, label: '0 - 3' },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPresetScore(preset.l1, preset.l2)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-black transition-all ${
                        p1Legs === preset.l1 && p2Legs === preset.l2
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Number selectors */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 text-center">
                    <span className="text-xs text-neutral-400 block truncate font-semibold">
                      {playerMap.get(player1Id)?.name || 'Player 1'} Legs
                    </span>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      {[0, 1, 2, 3].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setP1Legs(n)}
                          className={`w-9 h-9 rounded-lg font-mono font-black text-sm transition-all ${
                            p1Legs === n
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 text-center">
                    <span className="text-xs text-neutral-400 block truncate font-semibold">
                      {playerMap.get(player2Id)?.name || 'Player 2'} Legs
                    </span>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      {[0, 1, 2, 3].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setP2Legs(n)}
                          className={`w-9 h-9 rounded-lg font-mono font-black text-sm transition-all ${
                            p2Legs === n
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Entry: 3-Dart Avg, 180s, Highest Checkout */}
              <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                  Match Statistics (Averages, 180s & Finishes)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Player 1 Stats */}
                  <div className="space-y-3 bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800/80">
                    <div className="font-bold text-sm text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span>{playerMap.get(player1Id)?.name || 'Player 1'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                          3-Dart Avg
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="167"
                          value={p1Avg}
                          onChange={e => setP1Avg(e.target.value)}
                          placeholder="68.4"
                          className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                          180s Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={p1180s}
                          onChange={e => setP1180s(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-red-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                          High Out (Max 170)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="170"
                          value={p1Checkout}
                          onChange={e => setP1Checkout(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-emerald-400 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Player 2 Stats */}
                  <div className="space-y-3 bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800/80">
                    <div className="font-bold text-sm text-neutral-100 flex items-center gap-2 border-b border-neutral-800 pb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>{playerMap.get(player2Id)?.name || 'Player 2'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                          3-Dart Avg
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="167"
                          value={p2Avg}
                          onChange={e => setP2Avg(e.target.value)}
                          placeholder="64.2"
                          className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                          180s Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={p2180s}
                          onChange={e => setP2180s(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-red-400 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                          High Out (Max 170)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="170"
                          value={p2Checkout}
                          onChange={e => setP2Checkout(Math.max(0, parseInt(e.target.value) || 0))}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-emerald-400 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Match Notes / Highlights (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Decider leg finish on D16, Marcus hit 180 in leg 2"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingMatch ? 'Update Match' : 'Save Match Result'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MATCH HISTORY & UNDO */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Recorded League Matches</h3>
                  <p className="text-xs text-neutral-400">
                    If a score was entered incorrectly, click "Edit" to modify stats or "Undo" to delete the result and restore fixture as unplayed.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {matches.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 text-neutral-500 text-xs">
                    No matches recorded yet this season.
                  </div>
                ) : (
                  [...matches]
                    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
                    .map(m => {
                      const p1 = playerMap.get(m.player1Id);
                      const p2 = playerMap.get(m.player2Id);

                      return (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-blue-400">R{m.round}</span>
                              <span className="text-neutral-500 font-mono">
                                {new Date(m.playedAt).toLocaleDateString()}
                              </span>
                              <span className="font-bold text-white">
                                {p1?.name} ({m.player1Legs}) vs {p2?.name} ({m.player2Legs})
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              Winner: <strong className="text-emerald-400">{playerMap.get(m.winnerId)?.name}</strong> · Avg: {m.player1Avg}/{m.player2Avg} · 180s: {(m.player1180s || 0) + (m.player2180s || 0)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMatchState(m);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Undo and delete match result between ${p1?.name} and ${p2?.name}? This cannot be undone.`)) {
                                  onDeleteMatchResult(m.id);
                                }
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-semibold border border-red-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Undo / Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ROSTER MANAGEMENT */}
          {activeTab === 'players' && (
            <div className="space-y-6">
              {/* Add player form */}
              <form onSubmit={handleAddPlayer} className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add League Player (10 to 15 Players)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={e => setNewPlayerName(e.target.value)}
                      placeholder="e.g. Wayne Mardle"
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={newPlayerNickname}
                      onChange={e => setNewPlayerNickname(e.target.value)}
                      placeholder="e.g. Hawaii 501"
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                      Bear Mascot Avatar
                    </label>
                    <select
                      value={newPlayerBearType}
                      onChange={e => setNewPlayerBearType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white"
                    >
                      <option value="grizzly">Grizzly Bear</option>
                      <option value="smoky">Smoky Black Bear</option>
                      <option value="kodiak">Kodiak Bear</option>
                      <option value="bruin">Boston Bruin</option>
                      <option value="polar">Polar Bear</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={players.length >= 15}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Player</span>
                  </button>
                </div>
              </form>

              {/* Player list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Current League Players ({players.length}/15):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {players.map(p => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <BearAvatar player={p} size="sm" />
                        <div>
                          <div className="font-bold text-sm text-white">{p.name}</div>
                          <div className="text-xs text-neutral-400">"{p.nickname}"</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePlayerActive(p.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            p.active
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                              : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                          }`}
                        >
                          {p.active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlayerToDelete(p)}
                          title={`Delete ${p.name} from roster`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-red-100 text-[11px] font-bold border border-red-800 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & DATA RESET */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Change Admin PIN */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Change Admin Access Password / PIN</span>
                </h4>
                <p className="text-xs text-neutral-400">
                  Default password is <code className="text-red-400 bg-neutral-900 px-1 py-0.5 rounded">smokebox</code>
                </p>

                {pinChangeMsg && (
                  <div className="text-xs text-emerald-400 font-medium">{pinChangeMsg}</div>
                )}

                <form onSubmit={handleUpdatePinSubmit} className="flex items-center gap-3">
                  <input
                    type="password"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    placeholder="Enter new PIN / password"
                    className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white w-64"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              {/* Tournament Management */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Tournament Data Management
                </h4>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear all recorded match scores? This resets standings to 0-0 for a brand new season.')) {
                        onClearMatches();
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold text-center transition-colors"
                  >
                    Clear All Match Scores (Fresh Season)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Restore sample tournament data with initial 12 players and completed matches?')) {
                        onResetData();
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold text-center transition-colors"
                  >
                    Restore Demo Tournament State
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Player Confirmation Prompt Modal */}
      {playerToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-neutral-900 border-2 border-red-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-red-950 text-red-400 border border-red-800 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Remove Player From Roster?
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Please review the details below before removing this player.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayerToDelete(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Player Card */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
              <BearAvatar player={playerToDelete} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">{playerToDelete.name}</div>
                <div className="text-xs text-red-400 font-medium">"{playerToDelete.nickname}"</div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Status: <span className={playerToDelete.active ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>{playerToDelete.active ? 'Active Player' : 'Inactive Player'}</span>
                </div>
              </div>
            </div>

            {/* Impact Analysis Warning */}
            {(() => {
              const affectedMatches = matches.filter(
                m => m.player1Id === playerToDelete.id || m.player2Id === playerToDelete.id
              );
              return (
                <div className={`p-3 rounded-xl text-xs space-y-1.5 ${
                  affectedMatches.length > 0
                    ? 'bg-amber-950/40 border border-amber-800/70 text-amber-200'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-300'
                }`}>
                  {affectedMatches.length > 0 ? (
                    <>
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Warning: {affectedMatches.length} Recorded Match(es) Found</span>
                      </div>
                      <p className="text-neutral-300 text-[11px] leading-relaxed">
                        Removing <strong>{playerToDelete.name}</strong> will also erase their {affectedMatches.length} recorded match results and automatically recalculate the standings and leaderboard statistics.
                      </p>
                    </>
                  ) : (
                    <p className="text-neutral-400 text-xs leading-relaxed">
                      This player has no recorded matches. They will be removed immediately from the roster and excluded from fixture generation.
                    </p>
                  )}
                </div>
              );
            })()}

            {players.length <= 2 && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                Caution: The league currently only has {players.length} players. Removing another player will leave fewer than 2 players.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlayerToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeletePlayer(playerToDelete)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Remove Player</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function setEditingMatchState(m: MatchResult) {
    setPlayer1Id(m.player1Id);
    setPlayer2Id(m.player2Id);
    setRound(m.round);
    setP1Legs(m.player1Legs);
    setP2Legs(m.player2Legs);
    setP1Avg(m.player1Avg.toString());
    setP2Avg(m.player2Avg.toString());
    setP1180s(m.player1180s);
    setP2180s(m.player2180s);
    setP1Checkout(m.player1HighestCheckout);
    setP2Checkout(m.player2HighestCheckout);
    setNotes(m.notes || '');
    setPlayedAt(m.playedAt.split('T')[0]);
    setActiveTab('score');
  }
};
