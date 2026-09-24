import React, { useState } from 'react';
import { ASSETS } from '../utils/assets';
import { Player } from '../types/darts';

interface BearAvatarProps {
  player: Player;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showNickname?: boolean;
  className?: string;
}

const BEAR_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  grizzly: { bg: 'bg-gradient-to-br from-amber-950 to-neutral-900', text: 'text-amber-400', border: 'border-red-600' },
  smoky: { bg: 'bg-gradient-to-br from-neutral-800 to-neutral-950', text: 'text-neutral-300', border: 'border-blue-500' },
  polar: { bg: 'bg-gradient-to-br from-slate-700 to-neutral-950', text: 'text-cyan-300', border: 'border-cyan-500' },
  kodiak: { bg: 'bg-gradient-to-br from-orange-950 to-neutral-950', text: 'text-orange-400', border: 'border-red-500' },
  bruin: { bg: 'bg-gradient-to-br from-blue-950 to-neutral-950', text: 'text-blue-400', border: 'border-blue-600' },
};

export const BearAvatar: React.FC<BearAvatarProps> = ({
  player,
  size = 'md',
  showNickname = false,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const type = player.avatarBearType || 'grizzly';
  const colorScheme = BEAR_COLORS[type] || BEAR_COLORS.grizzly;

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs border',
    sm: 'w-9 h-9 text-sm border-2',
    md: 'w-11 h-11 text-base border-2',
    lg: 'w-14 h-14 text-lg border-2',
    xl: 'w-20 h-20 text-2xl border-3 shadow-lg shadow-red-950/40',
  };

  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const photoUrl = player.smartAvatarUrl || player.photoUrl || 
    (player.avatarSeed && (player.avatarSeed.startsWith('http') || player.avatarSeed.startsWith('data:image') || player.avatarSeed.startsWith('/')) ? player.avatarSeed : undefined);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`relative rounded-full flex items-center justify-center font-bold tracking-wider overflow-hidden shrink-0 ${sizeClasses[size]} ${colorScheme.bg} ${colorScheme.border} shadow-inner bg-neutral-900`}
        title={`${player.name} "${player.nickname}"`}
      >
        {photoUrl && !imageError ? (
          <img
            src={photoUrl}
            alt={player.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <>
            {/* Mascot watermark on larger avatars */}
            {(size === 'lg' || size === 'xl') && (
              <img
                src={ASSETS.mascotLogo}
                alt="Mascot emblem"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale contrast-200 pointer-events-none"
              />
            )}
            <span className={`relative z-10 ${colorScheme.text} font-mono font-black`}>
              {initials}
            </span>
          </>
        )}
      </div>
      {showNickname && (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-neutral-100 truncate text-sm">
            {player.name}
          </span>
          <span className="text-xs text-red-400 font-medium tracking-wide truncate">
            "{player.nickname}"
          </span>
        </div>
      )}
    </div>
  );
};

