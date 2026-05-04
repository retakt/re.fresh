import { useRef, useState, useEffect } from 'react';

interface AnimatedLogoProps {
  animatedSrc: string;
  staticSrc?: string; // Optional separate static image
  width?: number;
  height?: number;
  className?: string;
}

export function AnimatedLogo({ 
  animatedSrc,
  staticSrc,
  width = 80, 
  height = 72,
  className = '' 
}: AnimatedLogoProps) {
  const [key, setKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [staticFrame, setStaticFrame] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract first frame from GIF and remove white background
  useEffect(() => {
    if (staticSrc) {
      // If a separate static image is provided, use it
      setStaticFrame(staticSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // Get image data to process pixels
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Remove white background (make white pixels transparent)
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // If pixel is white or near-white, make it transparent
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
          }
          
          // Put the modified image data back
          ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas to data URL
          setStaticFrame(canvas.toDataURL('image/png'));
        }
      }
    };
    img.src = animatedSrc;
  }, [animatedSrc, staticSrc]);

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
    <>
      {/* Hidden canvas for extracting first frame */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
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
          {/* Static first frame (shown when not animating) */}
          {!isAnimating && staticFrame && (
            <img
              src={staticFrame}
              alt="YouTube Logo"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
          )}
          
          {/* Animated GIF (shown during animation) */}
          {isAnimating && (
            <img
              key={key}
              src={animatedSrc}
              alt="YouTube Logo Animated"
              className="w-full h-full object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
          )}
        </div>
      </button>
    </>
  );
}
