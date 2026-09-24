import React, { useState, useEffect } from 'react';
import { Newspaper, Zap, Trophy, Flame, Target, Sparkles, ChevronRight, AlertCircle, ArrowUpRight, Copy, Check, Wand2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Player, MatchResult, PlayerStats, AINewsItem } from '../types/darts';
import { generateLeagueNews } from '../utils/aiNewsGenerator';
import { BearAvatar } from './BearAvatar';
import { ASSETS } from '../utils/assets';
import { generateNewsSceneImage } from '../utils/aiAvatarTransformer';

interface AINewsFeedProps {
  players: Player[];
  matches: MatchResult[];
  stats: PlayerStats[];
  onSelectPlayer: (playerId: string) => void;
  onOpenImageStudio?: (player: Player, initialScenario?: string) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  titlerace: { label: 'Title Race Summit', bg: 'bg-red-950/80', text: 'text-red-400', border: 'border-red-800', icon: Trophy },
  upset: { label: 'Upset Alert', bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-800', icon: AlertCircle },
  streak: { label: 'Winning Streak', bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-800', icon: Flame },
  games_in_hand: { label: 'Games in Hand', bg: 'bg-blue-950/80', text: 'text-blue-400', border: 'border-blue-800', icon: Target },
  '180_barrage': { label: '180s Barrage', bg: 'bg-purple-950/80', text: 'text-purple-400', border: 'border-purple-800', icon: Zap },
  checkout: { label: 'Clutch Out-Shot', bg: 'bg-cyan-950/80', text: 'text-cyan-400', border: 'border-cyan-800', icon: Sparkles },
  draw_drama: { label: '2-2 Draw Thriller', bg: 'bg-neutral-900', text: 'text-amber-300', border: 'border-amber-700', icon: Target },
  spotlight: { label: 'Player Spotlight', bg: 'bg-neutral-900', text: 'text-neutral-300', border: 'border-neutral-700', icon: Newspaper },
};

export const AINewsFeed: React.FC<AINewsFeedProps> = ({
  players,
  matches,
  stats,
  onSelectPlayer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [newsSceneMap, setNewsSceneMap] = useState<Record<string, string>>({});
  const [generatingStoryId, setGeneratingStoryId] = useState<string | null>(null);
  const [generationNotification, setGenerationNotification] = useState<{ storyId: string; message: string } | null>(null);

  const newsItems = generateLeagueNews(players, matches, stats);
  const playerMap = new Map(players.map(p => [p.id, p]));

  // Load saved news scenes from backend
  useEffect(() => {
    fetch('/api/news/scenes')
      .then(res => res.json())
      .then(data => {
        if (data && data.scenes) {
          const map: Record<string, string> = {};
          Object.values(data.scenes).forEach((sc: any) => {
            if (sc.storyId && sc.imageUrl) {
              map[sc.storyId] = sc.imageUrl;
            }
          });
          setNewsSceneMap(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => {});
  }, []);

  const filteredNews = selectedCategory === 'all'
    ? newsItems
    : newsItems.filter(item => item.category === selectedCategory);

  const handleCopyPrompt = (item: AINewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.customPrompt);
    setCopiedPromptId(item.id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  const getScenarioImage = (item: AINewsItem) => {
    if (newsSceneMap[item.id]) {
      return newsSceneMap[item.id];
    }
    if (item.newsCardImageUrl) {
      return item.newsCardImageUrl;
    }
    switch (item.scenarioPreset) {
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

  const handleGenerateStoryScene = async (item: AINewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingStoryId(item.id);
    try {
      const result = await generateNewsSceneImage({
        storyId: item.id,
        playerId: item.primaryPlayerId,
        playerAvatarUrl: playerMap.get(item.primaryPlayerId)?.smartAvatarUrl,
        scenarioPreset: item.scenarioPreset as any,
        headline: item.headline,
        customPrompt: item.customPrompt,
      });

      setNewsSceneMap(prev => ({
        ...prev,
        [item.id]: result.newsCardImageUrl,
      }));

      setGenerationNotification({
        storyId: item.id,
        message: 'Dynamic Action Scene generated! Primary Player Avatar in Supabase strictly preserved.',
      });

      setTimeout(() => {
        setGenerationNotification(null);
      }, 3500);
    } catch (err) {
      console.error('Failed to generate news scene:', err);
    } finally {
      setGeneratingStoryId(null);
    }
  };

  if (newsItems.length === 0) {
    return null;
  }

  const featured = filteredNews[0];
  const sideArticles = filteredNews.slice(1, 7);

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-red-950/40 via-neutral-900/60 to-neutral-950 p-4 rounded-2xl border border-red-900/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500 shadow-inner">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-red-400">
                Live Supabase AI News Wire
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans flex items-center gap-2">
              League News & AI Headlines
            </h2>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            All Stories ({newsItems.length})
          </button>
          <button
            onClick={() => setSelectedCategory('titlerace')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'titlerace'
                ? 'bg-red-950 text-red-300 border border-red-700'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Title Race
          </button>
          <button
            onClick={() => setSelectedCategory('upset')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'upset'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Upsets
          </button>
          <button
            onClick={() => setSelectedCategory('games_in_hand')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'games_in_hand'
                ? 'bg-blue-950 text-blue-300 border border-blue-700'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Games in Hand
          </button>
        </div>
      </div>

      {/* Two Outputs Segregation Indicator Banner */}
      <div className="px-4 py-2 rounded-xl bg-neutral-950/90 border border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            <strong className="text-white">Dual Output Architecture:</strong> Dynamic action scenes on news cards never overwrite primary player avatar headshots in Supabase.
          </span>
        </div>
        <span className="hidden sm:inline font-mono text-[10px] text-neutral-500">
          Avatar Headshot (Suit) ≠ News Story Scene (Action)
        </span>
      </div>

      {/* News Grid: Lead Story + Sidebar Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Featured Top Story (7 Cols) */}
        {featured && (
          <div
            onClick={() => onSelectPlayer(featured.primaryPlayerId)}
            className="lg:col-span-7 group cursor-pointer relative overflow-hidden rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-red-600/60 transition-all duration-300 shadow-2xl flex flex-col justify-between"
          >
            {/* Background AI Scenario Artwork */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-950">
              <img
                src={getScenarioImage(featured)}
                alt={featured.headline}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

              {/* Category & AI Scenario Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg ${
                  CATEGORY_CONFIG[featured.category]?.bg || 'bg-red-950'
                } ${CATEGORY_CONFIG[featured.category]?.text || 'text-red-400'} border ${
                  CATEGORY_CONFIG[featured.category]?.border || 'border-red-800'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {CATEGORY_CONFIG[featured.category]?.label || 'Headline'}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-950/80 text-neutral-300 border border-neutral-700 backdrop-blur-md">
                    <span>Scene: {featured.scenarioTitle}</span>
                  </span>

                  {/* Generate Dynamic Action Scene Button */}
                  <button
                    type="button"
                    disabled={generatingStoryId === featured.id}
                    onClick={(e) => handleGenerateStoryScene(featured, e)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg backdrop-blur-md transition-colors disabled:opacity-50"
                    title="Generate action scene for this news headline without modifying player avatar"
                  >
                    {generatingStoryId === featured.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Rendering Scene...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        <span>Generate Scene</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Notification Banner */}
              {generationNotification?.storyId === featured.id && (
                <div className="absolute top-14 left-4 right-4 p-2 rounded-lg bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs font-semibold backdrop-blur-md flex items-center gap-2 shadow-lg animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{generationNotification.message}</span>
                </div>
              )}

              {/* Player Face Photo Floating Badge */}
              {playerMap.get(featured.primaryPlayerId) && (
                <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-neutral-950/90 backdrop-blur-md p-2 rounded-2xl border border-neutral-800/90 shadow-2xl group-hover:border-red-500/60 transition-colors">
                  <BearAvatar player={playerMap.get(featured.primaryPlayerId)!} size="lg" />
                  <div className="pr-2">
                    <div className="text-[10px] font-mono uppercase font-bold text-blue-400 flex items-center gap-1">
                      <span>Standard Smart Avatar</span>
                    </div>
                    <div className="text-sm font-black text-white leading-tight">
                      {playerMap.get(featured.primaryPlayerId)?.name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      "{playerMap.get(featured.primaryPlayerId)?.nickname}"
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Headline & Story Summary */}
            <div className="p-5 sm:p-6 space-y-3 bg-neutral-900/95 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-red-400 transition-colors font-sans leading-snug">
                  {featured.headline}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed mt-2 font-normal">
                  {featured.summary}
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed mt-2 border-t border-neutral-800/80 pt-2 hidden sm:block">
                  {featured.article}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800 text-xs">
                <span className="text-neutral-500 font-mono">
                  {new Date(featured.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCopyPrompt(featured, e)}
                    title="Copy AI Scenario Prompt"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold border border-neutral-700 transition-colors"
                  >
                    {copiedPromptId === featured.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>AI Prompt</span>
                      </>
                    )}
                  </button>

                  <span className="inline-flex items-center gap-1 font-bold text-red-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View Profile</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Stories Carousel / Grid (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {sideArticles.map(item => {
            const player = playerMap.get(item.primaryPlayerId);
            const secondaryPlayer = item.secondaryPlayerId ? playerMap.get(item.secondaryPlayerId) : null;
            const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.spotlight;
            const CatIcon = cat.icon;

            return (
              <div
                key={item.id}
                onClick={() => onSelectPlayer(item.primaryPlayerId)}
                className="group cursor-pointer p-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 transition-all flex items-start gap-3 shadow-md"
              >
                {/* Player Face Photo Headshot */}
                <div className="shrink-0 relative mt-0.5">
                  {player && <BearAvatar player={player} size="md" />}
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${cat.bg} ${cat.text} border ${cat.border}`}>
                    <CatIcon className="w-2.5 h-2.5" />
                  </span>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cat.bg} ${cat.text} border ${cat.border}`}>
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                    {item.headline}
                  </h4>

                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 pt-2 border-t border-neutral-800/60">
                    <span className="text-neutral-400 font-medium truncate">
                      {player?.name} {secondaryPlayer ? `vs ${secondaryPlayer.name}` : ''}
                    </span>
                    <span className="text-red-400 group-hover:underline flex items-center gap-0.5 font-semibold shrink-0">
                      Profile <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
