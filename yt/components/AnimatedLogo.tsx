import { useState, useEffect, useRef } from 'react';

interface AnimatedLogoProps {
  staticSrc: string;
  animatedSrc: string;
  width?: number;
  height?: number;
  className?: string;
}

export function AnimatedLogo({ 
  staticSrc,
  animatedSrc,
  width = 84, 
  height = 64,
  className = '' 
}: AnimatedLogoProps) {
  const [key, setKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAnimation = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Always restart the animation by changing the key
    setKey(prev => prev + 1);
    setIsAnimating(true);

    // Set new timeout to stop animation
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      onClick={triggerAnimation}
      onTouchStart={triggerAnimation}
      className={`relative cursor-pointer ${className}`}
      aria-label="Animate logo"
    >
      {/* Logo container - rounded rectangle */}
      <div 
        className="relative rounded-lg bg-[#dc143c] border border-[#ff6b8a]/30 overflow-hidden shadow-lg shadow-[#dc143c]/20 transition-all active:scale-95"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Static PNG (default state) */}
        {!isAnimating && !imageError && (
          <img
            src={staticSrc}
            alt="YouTube Logo"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Fallback SVG if image fails to load */}
        {!isAnimating && imageError && (
          <div className="w-full h-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className="w-full h-full"
              fill="currentColor"
              style={{ color: '#1a1a1a' }}
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        )}
        
        {/* Animated APNG (shown during animation) */}
        {isAnimating && (
          <img
            key={key}
            src={animatedSrc}
            alt="YouTube Logo Animated"
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </button>
  );
}
