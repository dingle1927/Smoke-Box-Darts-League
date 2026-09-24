import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, X, ShieldAlert, Camera, Sliders, RefreshCw, Trophy, Flame, Scissors, Image as ImageIcon } from 'lucide-react';
import { Player, ScenarioPreset } from '../types/darts';
import { SCENARIO_PRESETS, buildScenarioPrompt } from '../utils/aiNewsGenerator';
import { ASSETS } from '../utils/assets';
import { BearAvatar } from './BearAvatar';
import {
  getPlayerFaceCutout,
  compositeFaceOntoActionScene,
  FaceCutoutResult,
} from '../utils/aiAvatarTransformer';

interface AIImageStudioModalProps {
  player: Player;
  initialPreset?: ScenarioPreset;
  isOpen: boolean;
  onClose: () => void;
  onApplyScenarioToPlayer?: (scenario: ScenarioPreset, shirtColors: { primary: string; secondary: string; collar: string }, bannerUrl?: string) => void;
}

const SHIRT_COLORS = [
  { name: 'Obsidian Black', hex: '#171717', text: 'Black' },
  { name: 'Crimson Red', hex: '#dc2626', text: 'Red' },
  { name: 'Cobalt Blue', hex: '#2563eb', text: 'Blue' },
  { name: 'Royal Purple', hex: '#7e22ce', text: 'Purple' },
  { name: 'Charcoal Gray', hex: '#374151', text: 'Charcoal' },
  { name: 'Championship Gold', hex: '#d97706', text: 'Gold' },
];

export const AIImageStudioModal: React.FC<AIImageStudioModalProps> = ({
  player,
  initialPreset = 'throwing',
  isOpen,
  onClose,
  onApplyScenarioToPlayer,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>(initialPreset);
  const [primaryColor, setPrimaryColor] = useState(player.customShirtColors?.primary || 'Crimson Red');
  const [secondaryColor, setSecondaryColor] = useState(player.customShirtColors?.secondary || 'Obsidian Black');
  const [collarColor, setCollarColor] = useState(player.customShirtColors?.collar || 'Obsidian Black');
  const [customContext, setCustomContext] = useState('');
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // Dynamic composited action scene state
  const [compositedSceneUrl, setCompositedSceneUrl] = useState<string>('');
  const [faceCutout, setFaceCutout] = useState<FaceCutoutResult | null>(null);
  const [isCompositing, setIsCompositing] = useState(false);

  // Load player face cutout and generate action scene composite
  useEffect(() => {
    let isMounted = true;
    const generateScene = async () => {
      setIsCompositing(true);
      try {
        const cutout = await getPlayerFaceCutout(player);
        if (!isMounted) return;
        setFaceCutout(cutout);

        if (cutout && cutout.cutoutCanvas) {
          const comp = await compositeFaceOntoActionScene(selectedPreset, cutout.cutoutCanvas);
          if (isMounted) {
            setCompositedSceneUrl(comp);
          }
        } else {
          if (isMounted) {
            setCompositedSceneUrl(ASSETS.scenarios[selectedPreset] || ASSETS.scenarios.throwing);
          }
        }
      } catch (e) {
        if (isMounted) {
          setCompositedSceneUrl(ASSETS.scenarios[selectedPreset] || ASSETS.scenarios.throwing);
        }
      } finally {
        if (isMounted) setIsCompositing(false);
      }
    };

    if (isOpen) {
      generateScene();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, player, selectedPreset]);

  if (!isOpen) return null;

  const getScenarioImage = (preset: ScenarioPreset) => {
    if (compositedSceneUrl && selectedPreset === preset) {
      return compositedSceneUrl;
    }
    switch (preset) {
      case 'cigarette':
        return ASSETS.scenarios.cigarette;
      case 'disappointment':
        return ASSETS.scenarios.disappointment;
      case 'celebration':
        return ASSETS.scenarios.celebration;
      case 'trophy':
        return ASSETS.scenarios.trophy;
      case 'throwing':
      default:
        return ASSETS.scenarios.throwing;
    }
  };

  const currentPrompt = buildScenarioPrompt(
    {
      ...player,
      customShirtColors: { primary: primaryColor, secondary: secondaryColor, collar: collarColor },
    },
    selectedPreset,
    customContext
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApply = () => {
    if (onApplyScenarioToPlayer) {
      onApplyScenarioToPlayer(
        selectedPreset,
        {
          primary: primaryColor,
          secondary: secondaryColor,
          collar: collarColor,
        },
        compositedSceneUrl
      );
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-red-400">
                  Dynamic AI News & Media Studio
                </span>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold">
                  Rule: Strictly No Green
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                {player.name} &mdash; Dynamic Action Scene Media
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Segregation Guarantee Banner */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-start gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-200 font-bold block mb-0.5">
                Dynamic Action Media Segregation Guarantee
              </strong>
              <p className="text-neutral-300 leading-relaxed">
                Action scenes composite your isolated face cutout into arena scenarios (throwing, celebrating in front of the crowd, hands on head) for news stories and profile banners. <strong>Your original uploaded avatar is strictly preserved and never overwritten.</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Dynamic Composited Scene (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl">
                <img
                  src={getScenarioImage(selectedPreset)}
                  alt="Action Scene"
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover object-center filter brightness-95 transition-opacity ${
                    isCompositing ? 'opacity-70' : 'opacity-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                {/* Scenario Title Badge */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-800 backdrop-blur-md">
                    {SCENARIO_PRESETS.find(s => s.id === selectedPreset)?.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-950/90 text-neutral-300 border border-neutral-800">
                    Smoke Box Arena
                  </span>
                </div>

                {/* Compositing Spinner */}
                {isCompositing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700 text-xs text-white font-mono flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                      <span>Compositing face cutout onto scene...</span>
                    </div>
                  </div>
                )}

                {/* Player Original Avatar Badge & Cutout Pill */}
                <div className="absolute bottom-3 left-3 right-3 bg-neutral-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-neutral-800 shadow-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BearAvatar player={player} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white truncate">{player.name}</span>
                        <span className="text-[11px] text-red-400 font-bold">"{player.nickname}"</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        Original Avatar (Untouched)
                      </div>
                    </div>
                  </div>

                  {/* Face cutout preview */}
                  {faceCutout && faceCutout.cutoutDataUrl && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="w-9 h-11 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800 flex items-center justify-center"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #1c1c1c 25%, transparent 25%), linear-gradient(-45deg, #1c1c1c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1c1c 75%), linear-gradient(-45deg, transparent 75%, #1c1c1c 75%)',
                          backgroundSize: '6px 6px',
                        }}
                        title="Isolated High-Res Face Cutout"
                      >
                        <img
                          src={faceCutout.cutoutDataUrl}
                          alt="Face Cutout"
                          className="w-full h-full object-contain filter drop-shadow"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase hidden sm:inline">
                        AI Cutout Active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Scenario Quick Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Select Action Scenario:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SCENARIO_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedPreset === preset.id
                          ? 'bg-red-950/70 border-red-600 text-white shadow-md'
                          : 'bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-bold text-xs leading-snug">{preset.title}</div>
                      <div className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                        {preset.badge}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Shirt Customizer & Prompt Details (6 Cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Custom Shirt Colors (No Green) */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-red-500" />
                    <span>Custom Darts Shirt Palette</span>
                  </h4>
                  <span className="text-[10px] font-mono text-red-400 font-bold uppercase">
                    Zero Green Safe
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                      Primary Jersey Color
                    </label>
                    <select
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                    >
                      {SHIRT_COLORS.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                      Secondary Accent Color
                    </label>
                    <select
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                    >
                      {SHIRT_COLORS.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                    Optional Match Context / Headline Note
                  </label>
                  <input
                    type="text"
                    value={customContext}
                    onChange={e => setCustomContext(e.target.value)}
                    placeholder="e.g. Celebrating 120 Shanghai checkout in Round 2"
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Exact AI Prompt Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Generated AI Prompt:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/90 font-mono text-xs text-neutral-300 leading-relaxed max-h-36 overflow-y-auto select-all">
                  {currentPrompt}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>{copied ? 'Copied!' : 'Copy AI Prompt'}</span>
                </button>

                {onApplyScenarioToPlayer && (
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>{applied ? 'Applied to Profile!' : 'Set as Profile Banner'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
