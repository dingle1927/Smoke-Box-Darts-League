import React from 'react';
import { CalendarCheck, Shield, Target, Award, ArrowRight, BookOpen } from 'lucide-react';
import { ASSETS } from '../utils/assets';
import { PlayerStats, MatchResult } from '../types/darts';

interface HeroBannerProps {
  onGoToGenerator: () => void;
  onGoToScorer: () => void;
  onGoToAdmin: () => void;
  onGoToRules?: () => void;
  totalPlayers: number;
  completedMatchesCount: number;
  totalFixturesCount: number;
  stats: PlayerStats[];
  allMatches: MatchResult[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onGoToGenerator,
  onGoToScorer,
  onGoToAdmin,
  onGoToRules,
  totalPlayers,
  completedMatchesCount,
  totalFixturesCount,
  stats,
  allMatches,
}) => {
  // Aggregate stats
  const total180s = stats.reduce((acc, s) => acc + s.total180s, 0);
  const highestCheckout = Math.max(0, ...stats.map(s => s.highestCheckout));
  const progressPercent = totalFixturesCount > 0 ? Math.round((completedMatchesCount / totalFixturesCount) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl mb-8">
      {/* Background Graphic with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.bearThrowing}
          alt="The Smoke Box Bear Mascot throwing darts"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-35 filter brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          {/* Rules / Specs kicker */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs uppercase tracking-widest font-semibold text-neutral-400">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/80 font-bold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Synced (Mobile & Desktop)
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-red-500 font-bold">Official Season</span>
            <span aria-hidden="true">·</span>
            <span>301 Double Out</span>
            <span aria-hidden="true">·</span>
            <span className="text-white font-bold">Fixed 4 Legs</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400 font-bold">3 Pts Win / 1 Pt Draw</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase font-sans leading-none mb-3">
            The Smoke <span className="text-red-600">Box</span> Darts League
          </h1>

          {/* Description */}
          <p className="text-neutral-300 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
            Welcome to the home of high checkouts, 180s, and intense head-to-head 301 battles. 
            All matches are fixed at 4 legs (3 pts for win, 1 pt for 2-2 draw). Generate session fixtures, record live scores, and track the official championship leaderboard.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={onGoToGenerator}
              className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Generate Session Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToScorer}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-100 font-semibold text-sm border border-neutral-700 transition-all hover:border-blue-500"
            >
              <Target className="w-4 h-4 text-blue-400" />
              <span>301 Live Scorer</span>
            </button>

            {onGoToRules && (
              <button
                onClick={onGoToRules}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 hover:text-white font-semibold text-sm border border-amber-900/40 hover:border-amber-700 transition-all"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Rules & Scoring</span>
              </button>
            )}

            <button
              onClick={onGoToAdmin}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white font-semibold text-sm border border-neutral-800 transition-all"
            >
              <Shield className="w-4 h-4 text-neutral-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

        {/* League Quick Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-neutral-800/80">
          <div className="bg-neutral-950/60 backdrop-blur rounded-xl p-3 border border-neutral-800/80">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block">
              Active Players
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {totalPlayers}
              <span className="text-xs font-normal text-neutral-500 ml-1">bears</span>
            </div>
          </div>

          <div className="bg-neutral-950/60 backdrop-blur rounded-xl p-3 border border-neutral-800/80">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block">
              League Progress
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {completedMatchesCount}
              <span className="text-xs font-normal text-neutral-500 ml-1">/ {totalFixturesCount} ({progressPercent}%)</span>
            </div>
          </div>

          <div className="bg-neutral-950/60 backdrop-blur rounded-xl p-3 border border-neutral-800/80">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block">
              Total 180s Thrown
            </span>
            <div className="text-2xl font-black text-red-500 mt-0.5 flex items-center gap-1.5">
              <span>{total180s}</span>
              <Award className="w-4 h-4 text-red-400" />
            </div>
          </div>

          <div className="bg-neutral-950/60 backdrop-blur rounded-xl p-3 border border-neutral-800/80">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium block">
              Highest Checkout
            </span>
            <div className="text-2xl font-black text-blue-400 mt-0.5">
              {highestCheckout > 0 ? highestCheckout : '—'}
              {highestCheckout === 170 && (
                <span className="text-xs font-bold text-amber-400 ml-1">Big Fish!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
