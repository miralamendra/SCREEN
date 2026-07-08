import React, { useState } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: 'Miral' | 'Shalini' | 'Chathura';
  size?: AvatarSize;
  className?: string;
  showRing?: boolean;
}

/**
 * Real-photo avatar backed by the JPGs at the project root.
 *
 * - Renders the actual portrait image (miral.jpg / shalini.jpg / Chathura.jpg).
 * - Falls back to a subtle initial monogram if the image fails to load
 *   (e.g. when the user hasn't dropped the photos in yet) so the UI never
 *   breaks.
 * - Slightly soft ring + bottom hairline for a premium, Notion/Apple look.
 */
const PHOTO_URL: Record<'Miral' | 'Shalini' | 'Chathura', string> = {
  Miral: '/Miral.jpg',
  Shalini: '/shalini.jpg',
  Chathura: '/Chathura.jpg'
};

const FALLBACK_LETTER: Record<'Miral' | 'Shalini' | 'Chathura', string> = {
  Miral: 'M',
  Shalini: 'S',
  Chathura: 'C'
};

const FALLBACK_BG: Record<'Miral' | 'Shalini' | 'Chathura', string> = {
  Miral: 'linear-gradient(135deg, #1f4734 0%, #0f2a1f 100%)',
  Shalini: 'linear-gradient(135deg, #3a2a55 0%, #1f1530 100%)',
  Chathura: 'linear-gradient(135deg, #4a2e1a 0%, #251610 100%)'
};

const SIZE_MAP: Record<AvatarSize, { box: string; text: string }> = {
  xs: { box: 'w-5 h-5 rounded-[5px]', text: 'text-[10px]' },
  sm: { box: 'w-6 h-6 rounded-md', text: 'text-[11px]' },
  md: { box: 'w-8 h-8 rounded-lg', text: 'text-[13px]' },
  lg: { box: 'w-10 h-10 rounded-[10px]', text: 'text-[15px]' },
  xl: { box: 'w-14 h-14 rounded-[14px]', text: 'text-[20px]' },
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'sm',
  className = '',
  showRing = true
}) => {
  const sizing = SIZE_MAP[size];
  const [imgFailed, setImgFailed] = useState(false);
  const showFallback = imgFailed;

  return (
    <span
      aria-label={name}
      title={name}
      className={`relative inline-flex items-center justify-center select-none shrink-0 overflow-hidden ${sizing.box} ${className}`}
      style={{
        // Solid neutral base so the image (or fallback gradient) sits on a
        // consistent tone. The hairline ring + top sheen is added via
        // box-shadow for a single, cheap layer.
        background: showFallback ? FALLBACK_BG[name] : '#0d0d0d',
        boxShadow: showRing
          ? 'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 0 rgba(255,255,255,0.06)'
          : 'none'
      }}
    >
      {!showFallback ? (
        <img
          src={PHOTO_URL[name]}
          alt={name}
          draggable={false}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: 'block' }}
        />
      ) : (
        <span
          className={`relative font-semibold tracking-[-0.01em] ${sizing.text}`}
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {FALLBACK_LETTER[name]}
        </span>
      )}

      {/* Subtle top-left highlight to add depth without looking "designed". */}
      <span
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 60%)'
        }}
      />
    </span>
  );
};

export default Avatar;