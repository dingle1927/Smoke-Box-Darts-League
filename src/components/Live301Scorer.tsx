import React, { useState } from 'react';
import { Target, RotateCcw, Award, CheckCircle, ArrowRight, Zap, ChevronRight } from 'lucide-react';
import { Player, MatchResult } from '../types/darts';
import { BearAvatar } from './BearAvatar';
import { getSuggestedCheckout } from '../utils/dartsCheckouts';

interface Live301ScorerProps {
  players: Player[];
  onCompleteMatch: (result: Partial<MatchResult>) => void;
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

  // Turn input
  const [turnInput, setTurnInput] = useState('');
  const [bustMessage, setBustMessage] = useState<string | null>(null);
  const [isMatchOver, setIsMatchOver] = useState(false);

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

        if (newLegs === 3) {
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

        if (newLegs === 3) {
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

  const handleQuickScore = (points: number) => {
    handleScoreSubmit(points, 3);
  };

  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(turnInput);
    if (isNaN(val) || val < 0 || val > 180) {
      setBustMessage('Score must be between 0 and 180');
      return;
    }
    handleScoreSubmit(val, 3);
  };

  const handleFinishMatch = () => {
    if (!p1 || !p2) return;
    onCompleteMatch({
      player1Id: p1.id,
      player2Id: p2.id,
      player1Legs: legsP1,
      player2Legs: legsP2,
      winnerId: legsP1 === 3 ? p1.id : p2.id,
      loserId: legsP1 === 3 ? p2.id : p1.id,
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

        <button
          onClick={resetEntireMatch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold border border-neutral-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Match</span>
        </button>
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

      {/* Match Victor Notice */}
      {isMatchOver && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/90 via-neutral-900 to-blue-950/90 border-2 border-red-500 text-center space-y-3 shadow-2xl animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-widest">
            <Award className="w-4 h-4" />
            <span>Match Concluded! (Best of 5)</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase font-sans">
            Winner: {legsP1 === 3 ? p1?.name : p2?.name} ({legsP1}-{legsP2})
          </h3>
          <p className="text-sm text-neutral-300">
            {p1?.name}: {p1Avg} avg · {p1180s}x 180s | {p2?.name}: {p2Avg} avg · {p2180s}x 180s
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={handleFinishMatch}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all hover:scale-105"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Submit to League Standings</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Double Board Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PLAYER 1 BOARD */}
        <div
          className={`p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${
            currentTurn === 'p1' && !isMatchOver
              ? 'bg-neutral-900 border-red-500 shadow-xl shadow-red-950/40 ring-2 ring-red-500/30'
              : 'bg-neutral-950/90 border-neutral-800'
          }`}
        >
          {currentTurn === 'p1' && !isMatchOver && (
            <div className="absolute top-0 right-0 px-3 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-lg">
              Throwing Now
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            {p1 && <BearAvatar player={p1} size="md" />}
            <div>
              <h3 className="font-bold text-lg text-white">{p1?.name}</h3>
              <p className="text-xs text-red-400">"{p1?.nickname}"</p>
            </div>
          </div>

          {/* Big Score Remaining */}
          <div className="text-center py-6 bg-neutral-950 rounded-xl border border-neutral-800/80 mb-4">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
              Remaining Points
            </span>
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white mt-1">
              {scoreP1}
            </div>

            {/* Checkout Hint */}
            <div className="mt-2 min-h-6">
              {p1CheckoutHint ? (
                <span className="inline-block text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                  Target: {p1CheckoutHint}
                </span>
              ) : (
                <span className="text-xs text-neutral-600">No double out available</span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Legs Won</span>
              <span className="text-xl font-mono font-black text-red-500">{legsP1} <span className="text-xs text-neutral-500">/ 3</span></span>
            </div>
            <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">3-Dart Avg</span>
              <span className="text-xl font-mono font-black text-white">{p1Avg}</span>
            </div>
            <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">180s Thrown</span>
              <span className="text-xl font-mono font-black text-red-400">{p1180s}</span>
            </div>
          </div>
        </div>

        {/* PLAYER 2 BOARD */}
        <div
          className={`p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${
            currentTurn === 'p2' && !isMatchOver
              ? 'bg-neutral-900 border-blue-500 shadow-xl shadow-blue-950/40 ring-2 ring-blue-500/30'
              : 'bg-neutral-950/90 border-neutral-800'
          }`}
        >
          {currentTurn === 'p2' && !isMatchOver && (
            <div className="absolute top-0 right-0 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-lg">
              Throwing Now
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            {p2 && <BearAvatar player={p2} size="md" />}
            <div>
              <h3 className="font-bold text-lg text-white">{p2?.name}</h3>
              <p className="text-xs text-blue-400">"{p2?.nickname}"</p>
            </div>
          </div>

          {/* Big Score Remaining */}
          <div className="text-center py-6 bg-neutral-950 rounded-xl border border-neutral-800/80 mb-4">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
              Remaining Points
            </span>
            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white mt-1">
              {scoreP2}
            </div>

            {/* Checkout Hint */}
            <div className="mt-2 min-h-6">
              {p2CheckoutHint ? (
                <span className="inline-block text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                  Target: {p2CheckoutHint}
                </span>
              ) : (
                <span className="text-xs text-neutral-600">No double out available</span>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Legs Won</span>
              <span className="text-xl font-mono font-black text-blue-500">{legsP2} <span className="text-xs text-neutral-500">/ 3</span></span>
            </div>
            <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">3-Dart Avg</span>
              <span className="text-xl font-mono font-black text-white">{p2Avg}</span>
            </div>
            <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">180s Thrown</span>
              <span className="text-xl font-mono font-black text-blue-400">{p2180s}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bust Notice */}
      {bustMessage && (
        <div className="p-3 rounded-xl bg-red-950/90 border border-red-800 text-center font-bold text-sm text-red-300 animate-bounce">
          {bustMessage}
        </div>
      )}

      {/* Keypad & Quick Turn Entry */}
      {!isMatchOver && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Record 3 Darts for {currentTurn === 'p1' ? p1?.name : p2?.name}:
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              Max turn: 180
            </span>
          </div>

          {/* Quick Score Buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[26, 41, 45, 60, 81, 85, 100, 140].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickScore(val)}
                className="py-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono font-bold text-sm transition-all hover:border-neutral-700"
              >
                {val}
              </button>
            ))}
          </div>

          {/* Big 180 and custom entry */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleQuickScore(180)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-950/60 transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>MAXIMUM 180!</span>
            </button>

            {/* Manual score input */}
            <form onSubmit={handleManualInputSubmit} className="flex-1 flex items-center gap-2 w-full">
              <input
                type="number"
                min="0"
                max="180"
                value={turnInput}
                onChange={e => setTurnInput(e.target.value)}
                placeholder="Enter exact score (0-180)..."
                className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-neutral-700"
              >
                Submit Turn
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
