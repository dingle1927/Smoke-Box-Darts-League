import React, { useState } from 'react';
import { Target, RotateCcw, Award, CheckCircle, ArrowRight, Zap, ChevronRight, Undo2, Check, X } from 'lucide-react';
import { Player, MatchResult } from '../types/darts';
import { BearAvatar } from './BearAvatar';
import { getSuggestedCheckout } from '../utils/dartsCheckouts';

interface Live301ScorerProps {
  players: Player[];
  onCompleteMatch: (result: Partial<MatchResult>) => void;
}

interface MatchSnapshot {
  legsP1: number;
  legsP2: number;
  currentTurn: 'p1' | 'p2';
  scoreP1: number;
  scoreP2: number;
  p1TotalScore: number;
  p1DartsThrown: number;
  p2TotalScore: number;
  p2DartsThrown: number;
  p1180s: number;
  p2180s: number;
  p1HighCheckout: number;
  p2HighCheckout: number;
  isMatchOver: boolean;
  bustMessage: string | null;
  description: string;
}

export const Live301Scorer: React.FC<Live301ScorerProps> = ({ players, onCompleteMatch }) => {
  const activePlayers = players.filter(p => p.active);

  const [p1Id, setP1Id] = useState<string>(activePlayers[0]?.id || '');
  const [p2Id, setP2Id] = useState<string>(activePlayers[1]?.id || '');

  // Match state
  const [legsP1, setLegsP1] = useState(0);
  const [legsP2, setLegsP2] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<'p1' | 'p2'>('p1');
  const [scoreP1, setScoreP1] = useState(301);
  const [scoreP2, setScoreP2] = useState(301);

  // Statistics accumulators for match
  const [p1TotalScore, setP1TotalScore] = useState(0);
  const [p1DartsThrown, setP1DartsThrown] = useState(0);
  const [p2TotalScore, setP2TotalScore] = useState(0);
  const [p2DartsThrown, setP2DartsThrown] = useState(0);

  const [p1180s, setP1180s] = useState(0);
  const [p2180s, setP2180s] = useState(0);
  const [p1HighCheckout, setP1HighCheckout] = useState(0);
  const [p2HighCheckout, setP2HighCheckout] = useState(0);

  // Turn input & history
  const [turnInput, setTurnInput] = useState('');
  const [bustMessage, setBustMessage] = useState<string | null>(null);
  const [isMatchOver, setIsMatchOver] = useState(false);
  const [history, setHistory] = useState<MatchSnapshot[]>([]);

  const p1 = players.find(p => p.id === p1Id);
  const p2 = players.find(p => p.id === p2Id);

  // Computed averages
  const p1Avg = p1DartsThrown > 0 ? Number(((p1TotalScore / p1DartsThrown) * 3).toFixed(1)) : 0;
  const p2Avg = p2DartsThrown > 0 ? Number(((p2TotalScore / p2DartsThrown) * 3).toFixed(1)) : 0;

  // Checkout hints
  const p1CheckoutHint = getSuggestedCheckout(scoreP1);
  const p2CheckoutHint = getSuggestedCheckout(scoreP2);

  const resetLeg = () => {
    setScoreP1(301);
    setScoreP2(301);
    setBustMessage(null);
  };

  const resetEntireMatch = () => {
    setLegsP1(0);
    setLegsP2(0);
    setScoreP1(301);
    setScoreP2(301);
    setP1TotalScore(0);
    setP1DartsThrown(0);
    setP2TotalScore(0);
    setP2DartsThrown(0);
    setP1180s(0);
    setP2180s(0);
    setP1HighCheckout(0);
    setP2HighCheckout(0);
    setCurrentTurn('p1');
    setIsMatchOver(false);
    setBustMessage(null);
    setTurnInput('');
    setHistory([]);
  };

  const handleScoreSubmit = (points: number, dartsUsed: number = 3) => {
    if (isMatchOver) return;
    setBustMessage(null);

    const isP1 = currentTurn === 'p1';
    const currentScore = isP1 ? scoreP1 : scoreP2;
    const remaining = currentScore - points;

    // Check for 180
    if (points === 180) {
      if (isP1) setP1180s(prev => prev + 1);
      else setP2180s(prev => prev + 1);
    }

    // 301 Double Out Rules:
    // Remaining < 0 -> BUST
    // Remaining === 1 -> BUST (cannot finish on 1 with double)
    // Remaining === 0 -> LEG WON!
    if (remaining < 0 || remaining === 1) {
      // Bust: Score stays same, 3 darts counted
      setBustMessage(`BUST! ${isP1 ? p1?.name : p2?.name} remains at ${currentScore}`);
      if (isP1) {
        setP1DartsThrown(prev => prev + dartsUsed);
      } else {
        setP2DartsThrown(prev => prev + dartsUsed);
      }
      setCurrentTurn(isP1 ? 'p2' : 'p1');
      setTurnInput('');
      return;
    }

    if (remaining === 0) {
      // Leg Checkout!
      const finishScore = currentScore;
      if (isP1) {
        setP1TotalScore(prev => prev + points);
        setP1DartsThrown(prev => prev + dartsUsed);
        setP1HighCheckout(prev => Math.max(prev, finishScore));
        const newLegs = legsP1 + 1;
        setLegsP1(newLegs);

        // Check if 3-0 lead reached (Early Finish Rule) or fixed 4 legs reached:
        const isEarlyFinish3_0 = newLegs === 3 && legsP2 === 0;
        const isFull4Legs = newLegs + legsP2 === 4;

        if (isEarlyFinish3_0 || isFull4Legs) {
          setIsMatchOver(true);
        } else {
          resetLeg();
          setCurrentTurn('p2'); // alternate who starts next leg
        }
      } else {
        setP2TotalScore(prev => prev + points);
        setP2DartsThrown(prev => prev + dartsUsed);
        setP2HighCheckout(prev => Math.max(prev, finishScore));
        const newLegs = legsP2 + 1;
        setLegsP2(newLegs);

        // Check if 3-0 lead reached (Early Finish Rule) or fixed 4 legs reached:
        const isEarlyFinish3_0 = newLegs === 3 && legsP1 === 0;
        const isFull4Legs = newLegs + legsP1 === 4;

        if (isEarlyFinish3_0 || isFull4Legs) {
          setIsMatchOver(true);
        } else {
          resetLeg();
          setCurrentTurn('p1');
        }
      }
      setTurnInput('');
      return;
    }

    // Normal valid turn
    if (isP1) {
      setScoreP1(remaining);
      setP1TotalScore(prev => prev + points);
      setP1DartsThrown(prev => prev + dartsUsed);
      setCurrentTurn('p2');
    } else {
      setScoreP2(remaining);
      setP2TotalScore(prev => prev + points);
      setP2DartsThrown(prev => prev + dartsUsed);
      setCurrentTurn('p1');
    }

    setTurnInput('');
  };

  // Safe submission requiring explicit confirmation
  const handleConfirmScore = (valOverride?: number) => {
    if (isMatchOver) return;
    const rawVal = valOverride !== undefined ? valOverride : parseInt(turnInput.trim(), 10);
    if (isNaN(rawVal) || rawVal < 0 || rawVal > 180) {
      setBustMessage('Score must be a valid number between 0 and 180');
      return;
    }

    // Save snapshot to history stack before recording score
    const isP1 = currentTurn === 'p1';
    const thrower = isP1 ? (p1?.name || 'Player 1') : (p2?.name || 'Player 2');
    const currScore = isP1 ? scoreP1 : scoreP2;
    const newRemaining = currScore - rawVal;
    let turnOutcome = `${thrower}: ${rawVal} pts (${currScore} → ${Math.max(0, newRemaining)})`;
    if (newRemaining < 0 || newRemaining === 1) {
      turnOutcome = `${thrower}: ${rawVal} pts (BUST at ${currScore})`;
    } else if (newRemaining === 0) {
      turnOutcome = `${thrower}: CHECKOUT ${currScore}! (Leg Won)`;
    }

    const snapshot: MatchSnapshot = {
      legsP1,
      legsP2,
      currentTurn,
      scoreP1,
      scoreP2,
      p1TotalScore,
      p1DartsThrown,
      p2TotalScore,
      p2DartsThrown,
      p1180s,
      p2180s,
      p1HighCheckout,
      p2HighCheckout,
      isMatchOver,
      bustMessage,
      description: turnOutcome,
    };

    setHistory(prev => [...prev, snapshot]);
    handleScoreSubmit(rawVal, 3);
  };

  // Quick-Score button: stages the score for confirmation (does NOT submit immediately)
  const handleQuickScore = (points: number) => {
    setTurnInput(String(points));
    setBustMessage(null);
  };

  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConfirmScore();
  };

  // Revert last confirmed score and restore previous scores, leg counts, and averages
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastSnapshot = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    setLegsP1(lastSnapshot.legsP1);
    setLegsP2(lastSnapshot.legsP2);
    setCurrentTurn(lastSnapshot.currentTurn);
    setScoreP1(lastSnapshot.scoreP1);
    setScoreP2(lastSnapshot.scoreP2);
    setP1TotalScore(lastSnapshot.p1TotalScore);
    setP1DartsThrown(lastSnapshot.p1DartsThrown);
    setP2TotalScore(lastSnapshot.p2TotalScore);
    setP2DartsThrown(lastSnapshot.p2DartsThrown);
    setP1180s(lastSnapshot.p1180s);
    setP2180s(lastSnapshot.p2180s);
    setP1HighCheckout(lastSnapshot.p1HighCheckout);
    setP2HighCheckout(lastSnapshot.p2HighCheckout);
    setIsMatchOver(lastSnapshot.isMatchOver);
    setBustMessage(lastSnapshot.bustMessage);
    setTurnInput('');
  };

  const handleFinishMatch = () => {
    if (!p1 || !p2) return;
    const isDraw = legsP1 === 2 && legsP2 === 2;
    const winnerId = isDraw ? null : (legsP1 > legsP2 ? p1.id : p2.id);
    const loserId = isDraw ? null : (legsP1 > legsP2 ? p2.id : p1.id);

    onCompleteMatch({
      player1Id: p1.id,
      player2Id: p2.id,
      player1Legs: legsP1,
      player2Legs: legsP2,
      winnerId,
      loserId,
      isDraw,
      player1Avg: p1Avg,
      player2Avg: p2Avg,
      player1180s: p1180s,
      player2180s: p2180s,
      player1HighestCheckout: p1HighCheckout,
      player2HighestCheckout: p2HighCheckout,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Sticky Top Score Summary Bar
          Pinned to top when scrolling down.
          Shows player names, leg scores, remaining totals, and averages.
          Clean and compact: NO player headshots on this sticky bar per instructions. */}
      <div className="sticky top-[72px] z-30 bg-neutral-950/95 backdrop-blur-md border border-neutral-800/90 rounded-2xl shadow-2xl p-2.5 sm:px-4 transition-all">
        <div className="flex items-center justify-between gap-2 sm:gap-4 text-xs">
          {/* Player 1 summary */}
          <div className={`flex items-center gap-2 flex-1 min-w-0 ${currentTurn === 'p1' && !isMatchOver ? 'text-red-400 font-bold' : 'text-neutral-300'}`}>
            {currentTurn === 'p1' && !isMatchOver && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            )}
            <div className="truncate">
              <span className="font-black text-sm text-white truncate block sm:inline">
                {p1?.name || 'Player 1'}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono sm:ml-2">
                ({p1Avg.toFixed(1)} avg)
              </span>
            </div>
          </div>

          {/* Center Leg & Score Comparison */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 shadow-inner">
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-neutral-500 block leading-tight">
                Remaining
              </span>
              <span className="font-mono font-black text-sm sm:text-base text-white">
                <span className={currentTurn === 'p1' && !isMatchOver ? 'text-red-400 font-black' : ''}>
                  {scoreP1}
                </span>
                <span className="text-neutral-600 mx-1.5">:</span>
                <span className={currentTurn === 'p2' && !isMatchOver ? 'text-blue-400 font-black' : ''}>
                  {scoreP2}
                </span>
              </span>
            </div>

            <div className="h-6 w-px bg-neutral-800" />

            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-neutral-500 block leading-tight">
                Legs
              </span>
              <span className="font-mono font-black text-sm sm:text-base text-amber-400">
                {legsP1} - {legsP2}
                {isMatchOver && ((legsP1 === 3 && legsP2 === 0) || (legsP1 === 0 && legsP2 === 3)) && (
                  <span className="text-[9px] text-emerald-400 font-sans font-black ml-1 uppercase">
                    3-0 Win
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Player 2 summary */}
          <div className={`flex items-center justify-end gap-2 flex-1 min-w-0 text-right ${currentTurn === 'p2' && !isMatchOver ? 'text-blue-400 font-bold' : 'text-neutral-300'}`}>
            <div className="truncate">
              <span className="font-black text-sm text-white truncate block sm:inline">
                {p2?.name || 'Player 2'}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono sm:mr-2">
                ({p2Avg.toFixed(1)} avg)
              </span>
            </div>
            {currentTurn === 'p2' && !isMatchOver && (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 mb-1">
            <Target className="w-4 h-4" />
            <span>Interactive Oche Companion</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
            301 Double Out Live Chalkboard
          </h2>
          <p className="text-xs text-neutral-400">
            Real-time score deduction, double-out checkouts, bust detection, and instant stats calculation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleUndo}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/30 transition-all active:scale-95 shadow-sm"
              title="Undo last confirmed score and restore previous game state"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo ({history.length})</span>
            </button>
          )}

          <button
            onClick={resetEntireMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold border border-neutral-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Match</span>
          </button>
        </div>
      </div>

      {/* Player Selection (if match not started or want to change) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            Player 1 (Home)
          </label>
          <select
            value={p1Id}
            onChange={e => {
              setP1Id(e.target.value);
              resetEntireMatch();
            }}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-medium focus:border-red-500 focus:outline-none"
          >
            {activePlayers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} "{p.nickname}"
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            Player 2 (Away)
          </label>
          <select
            value={p2Id}
            onChange={e => {
              setP2Id(e.target.value);
              resetEntireMatch();
            }}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-white font-medium focus:border-blue-500 focus:outline-none"
          >
            {activePlayers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} "{p.nickname}"
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Match Victor / Draw Notice */}
      {isMatchOver && (() => {
        const isEarlyFinish = (legsP1 === 3 && legsP2 === 0) || (legsP1 === 0 && legsP2 === 3);
        const isDraw = legsP1 === 2 && legsP2 === 2;
        const winner = legsP1 > legsP2 ? p1 : p2;
        const winnerLegs = Math.max(legsP1, legsP2);
        const loserLegs = Math.min(legsP1, legsP2);

        return (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/90 via-neutral-900 to-blue-950/90 border-2 border-red-500 text-center space-y-3 shadow-2xl animate-in fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-widest">
              <Award className="w-4 h-4" />
              <span>
                {isEarlyFinish
                  ? 'Match Concluded! (Early Finish Rule: 3–0 Lead)'
                  : isDraw
                  ? 'Match Concluded! (Honours Even Split)'
                  : 'Match Concluded! (4 Legs Completed)'}
              </span>
            </div>

            {isDraw ? (
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-amber-400 uppercase font-sans">
                  2 - 2 Draw (Leg Split!)
                </h3>
                <p className="text-xs font-mono font-bold text-amber-300">
                  1 point awarded to {p1?.name} & 1 point awarded to {p2?.name}
                </p>
              </div>
            ) : isEarlyFinish ? (
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 uppercase font-sans">
                  Winner: {winner?.name} (3 - 0 Early Finish)
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-300">
                  ⚡ 3–0 Lead reached! Match immediately declared finished with a win.
                </p>
                <p className="text-xs text-neutral-300">
                  3 points awarded to {winner?.name} · 0 points to loser · All stats strictly finalized on the 3 legs played.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase font-sans">
                  Winner: {winner?.name} ({winnerLegs}-{loserLegs})
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-400">
                  3 points awarded to winner · 0 points to loser
                </p>
              </div>
            )}

            <p className="text-sm text-neutral-300 pt-1 border-t border-neutral-800/80">
              {p1?.name}: <span className="font-mono font-bold text-white">{p1Avg}</span> avg · <span className="font-mono font-bold text-red-400">{p1180s}x</span> 180s {p1HighCheckout > 0 ? `· ${p1HighCheckout} finish` : ''} | {p2?.name}: <span className="font-mono font-bold text-white">{p2Avg}</span> avg · <span className="font-mono font-bold text-blue-400">{p2180s}x</span> 180s {p2HighCheckout > 0 ? `· ${p2HighCheckout} finish` : ''}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                onClick={handleFinishMatch}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all hover:scale-105"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Submit to League Standings</span>
              </button>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 hover:text-white font-bold text-sm uppercase tracking-wider border border-neutral-700 transition-colors shadow-lg"
                  title="Undo the winning score/leg and resume the live match"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Undo Last Turn</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* 2. Main Double Board Scoreboard
          Displays uploaded player face photo directly beside each player's name and remaining score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PLAYER 1 BOARD */}
        <div
          className={`p-4 sm:p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${
            currentTurn === 'p1' && !isMatchOver
              ? 'bg-neutral-900 border-red-500 shadow-xl shadow-red-950/40 ring-2 ring-red-500/30'
              : 'bg-neutral-950/90 border-neutral-800'
          }`}
        >
          {currentTurn === 'p1' && !isMatchOver && (
            <div className="absolute top-0 right-0 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Throwing Now</span>
            </div>
          )}

          {/* Player Headshot Photo Directly Beside Name & Remaining Score */}
          <div className="p-4 sm:p-5 bg-neutral-950 rounded-2xl border border-neutral-800/90 mb-4 shadow-inner">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Uploaded Player Face Photo / Headshot */}
              <div className="relative shrink-0">
                {p1 && <BearAvatar player={p1} size="xl" className="ring-2 ring-red-500/40 shadow-xl" />}
                {currentTurn === 'p1' && !isMatchOver && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-red-600 text-white font-mono font-black text-[9px] shadow border border-neutral-950">
                    OCHÈ
                  </span>
                )}
              </div>

              {/* Directly Beside Face Photo: Player Name & Remaining Score */}
              <div className="flex-1 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-black text-lg sm:text-2xl text-white truncate leading-tight">
                    {p1?.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-red-400 truncate">
                    "{p1?.nickname}"
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                      Remaining
                    </span>
                    <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                      {scoreP1}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                      Double-Out
                    </span>
                    {p1CheckoutHint ? (
                      <span className="inline-block text-xs font-mono font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80">
                        {p1CheckoutHint}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-neutral-500">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Legs Won</span>
              <span className="text-xl font-mono font-black text-red-500">
                {legsP1} <span className="text-xs text-neutral-500">{legsP1 === 3 && legsP2 === 0 ? '(Early Win)' : '/ 4'}</span>
              </span>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">3-Dart Avg</span>
              <span className="text-xl font-mono font-black text-white">{p1Avg.toFixed(1)}</span>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">180s Thrown</span>
              <span className="text-xl font-mono font-black text-red-400">{p1180s}</span>
            </div>
          </div>
        </div>

        {/* PLAYER 2 BOARD */}
        <div
          className={`p-4 sm:p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${
            currentTurn === 'p2' && !isMatchOver
              ? 'bg-neutral-900 border-blue-500 shadow-xl shadow-blue-950/40 ring-2 ring-blue-500/30'
              : 'bg-neutral-950/90 border-neutral-800'
          }`}
        >
          {currentTurn === 'p2' && !isMatchOver && (
            <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-md flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Throwing Now</span>
            </div>
          )}

          {/* Player Headshot Photo Directly Beside Name & Remaining Score */}
          <div className="p-4 sm:p-5 bg-neutral-950 rounded-2xl border border-neutral-800/90 mb-4 shadow-inner">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Uploaded Player Face Photo / Headshot */}
              <div className="relative shrink-0">
                {p2 && <BearAvatar player={p2} size="xl" className="ring-2 ring-blue-500/40 shadow-xl" />}
                {currentTurn === 'p2' && !isMatchOver && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono font-black text-[9px] shadow border border-neutral-950">
                    OCHÈ
                  </span>
                )}
              </div>

              {/* Directly Beside Face Photo: Player Name & Remaining Score */}
              <div className="flex-1 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-black text-lg sm:text-2xl text-white truncate leading-tight">
                    {p2?.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-blue-400 truncate">
                    "{p2?.nickname}"
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                      Remaining
                    </span>
                    <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                      {scoreP2}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                      Double-Out
                    </span>
                    {p2CheckoutHint ? (
                      <span className="inline-block text-xs font-mono font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80">
                        {p2CheckoutHint}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-neutral-500">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">Legs Won</span>
              <span className="text-xl font-mono font-black text-blue-500">
                {legsP2} <span className="text-xs text-neutral-500">{legsP2 === 3 && legsP1 === 0 ? '(Early Win)' : '/ 4'}</span>
              </span>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">3-Dart Avg</span>
              <span className="text-xl font-mono font-black text-white">{p2Avg.toFixed(1)}</span>
            </div>
            <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
              <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">180s Thrown</span>
              <span className="text-xl font-mono font-black text-blue-400">{p2180s}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bust Notice */}
      {bustMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-800 text-center font-bold text-sm text-red-300 animate-bounce shadow-lg">
          {bustMessage}
        </div>
      )}

      {/* 3. Keypad & Quick Turn Entry
          Quick-Score buttons replaced with exactly: 0, 20, 26, 40, 60, 80, 180 directly above score input box */}
      {!isMatchOver && (() => {
        const isP1 = currentTurn === 'p1';
        const currentThrower = isP1 ? p1 : p2;
        const currentScore = isP1 ? scoreP1 : scoreP2;
        const parsedStaged = turnInput.trim() !== '' ? parseInt(turnInput.trim(), 10) : null;
        const isValidStaged = parsedStaged !== null && !isNaN(parsedStaged) && parsedStaged >= 0 && parsedStaged <= 180;
        const remainingAfterStaged = isValidStaged ? currentScore - parsedStaged : null;
        const isBustPreview = remainingAfterStaged !== null && (remainingAfterStaged < 0 || remainingAfterStaged === 1);
        const isCheckoutPreview = remainingAfterStaged === 0;

        return (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Header: Turn announcement + Undo button */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                <span>
                  Record Turn for <strong className="text-white">{currentThrower?.name || (isP1 ? 'Player 1' : 'Player 2')}</strong> ({isP1 ? 'Player 1' : 'Player 2'}):
                </span>
              </span>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    title={`Undo: ${history[history.length - 1].description}`}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo Last Score</span>
                  </button>
                )}
                <span className="text-xs text-neutral-400 font-mono">
                  3 Darts · Double-Out
                </span>
              </div>
            </div>

            {/* Quick-Score Preset Buttons: Exactly 0, 20, 26, 40, 60, 80, 180 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Quick-Score Presets (Tap to Stage, Then Confirm):
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Input safety: requires confirmation
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[0, 20, 26, 40, 60, 80, 180].map(val => {
                  const isStaged = turnInput.trim() === String(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickScore(val)}
                      className={`py-3 px-2 rounded-xl border font-mono font-black text-base sm:text-lg transition-all active:scale-95 shadow-md flex flex-col items-center justify-center relative ${
                        isStaged
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50 shadow-emerald-950/50 scale-105'
                          : val === 180
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-red-500 text-white shadow-red-950/60'
                          : val === 0
                          ? 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-white hover:border-neutral-600'
                      }`}
                    >
                      {isStaged && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <span>{val}</span>
                      <span className={`text-[9px] font-sans font-semibold mt-0.5 ${isStaged ? 'text-emerald-300' : 'text-neutral-400'}`}>
                        {val === 180 ? 'MAXIMUM' : val === 0 ? 'MISS / 0' : `${val} PTS`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Score Input Box */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Or Enter Custom 3-Dart Turn Score (0 - 180):
              </label>
              <form onSubmit={handleManualInputSubmit} className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={turnInput}
                  onChange={e => {
                    setTurnInput(e.target.value);
                    setBustMessage(null);
                  }}
                  placeholder="Type exact score (e.g. 45, 100, 140)..."
                  className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={!isValidStaged}
                  className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-lg ${
                    isValidStaged
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 ring-1 ring-emerald-400'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit / Confirm</span>
                </button>
              </form>
            </div>

            {/* Staged Score Confirmation Panel (Safety Guard Against Mis-clicks) */}
            {isValidStaged && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-neutral-900 to-neutral-900 border-2 border-emerald-500/80 shadow-xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Check className="w-4 h-4" /> Score Staged — Confirmation Required
                  </span>
                  <span className="text-neutral-400 text-xs">
                    Thrower: <strong className="text-white">{currentThrower?.name || (isP1 ? 'Player 1' : 'Player 2')}</strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-950/90 p-3 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-3 text-sm font-mono flex-wrap">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">Current</span>
                      <span className="text-lg font-black text-white">{currentScore}</span>
                    </div>
                    <span className="text-neutral-600 text-lg font-bold">−</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block font-sans">Deduct</span>
                      <span className="text-lg font-black text-emerald-400">{parsedStaged} pts</span>
                    </div>
                    <span className="text-neutral-600 text-lg font-bold">=</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block font-sans">Remaining</span>
                      <span className={`text-lg font-black ${
                        isBustPreview
                          ? 'text-red-400'
                          : isCheckoutPreview
                          ? 'text-amber-400 animate-pulse'
                          : 'text-white'
                      }`}>
                        {isBustPreview
                          ? `BUST (Score Stays at ${currentScore})`
                          : isCheckoutPreview
                          ? '0 🏆 CHECKOUT! (Leg Won)'
                          : `${remainingAfterStaged} remaining`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setTurnInput('')}
                      className="px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-neutral-700 flex items-center gap-1 transition-colors"
                      title="Clear staged score"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmScore()}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ring-2 ring-emerald-400/50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm & Submit Score ({parsedStaged} pts)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Last Confirmed Turn & Undo Action Strip */}
            {history.length > 0 && (
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80 font-mono">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-neutral-500">Last confirmed:</span>
                  <strong className="text-neutral-300 truncate">{history[history.length - 1].description}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleUndo}
                  className="text-amber-400 hover:text-amber-300 font-bold hover:underline shrink-0 ml-2 flex items-center gap-1"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo this score</span>
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
