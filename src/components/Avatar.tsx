import React, { useState, useEffect } from 'react';
import { getInitials } from '../lib/format';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-7 h-7 rounded-lg text-xs',
  sm: 'w-8 h-8 rounded-lg text-xs',
  md: 'w-9 h-9 rounded-xl text-xs',
  lg: 'w-10 h-10 rounded-xl text-sm',
  xl: 'w-14 h-14 rounded-2xl text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  color = '#6366f1',
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl) && !imgError;

  return (
    <div
      className={`${SIZE_CLASSES[size]} overflow-hidden flex items-center justify-center font-bold text-white shrink-0 shadow-sm ring-1 ring-white/10 select-none ${className}`}
      style={{ backgroundColor: showImage ? '#0f172a' : color }}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        getInitials(name || '?')
      )}
    </div>
  );
};
