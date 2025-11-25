import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface CompareSliderProps {
  originalImage: string;
  generatedImage: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ originalImage, generatedImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(percentage);
  };

  // Global mouse up to catch dragging outside component
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      document.body.style.cursor = 'default';
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="relative w-full h-[400px] md:h-[600px] rounded-xl overflow-hidden cursor-col-resize select-none border border-gray-700 shadow-2xl"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Background (Generated/After) */}
      <img 
        src={generatedImage} 
        alt="Redesigned Room" 
        className="absolute top-0 left-0 w-full h-full object-cover"
        draggable={false}
      />

      <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm pointer-events-none">
        After
      </div>

      {/* Foreground (Original/Before) - Clipped */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-brand-400 bg-gray-900"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={originalImage} 
          alt="Original Room" 
          className="absolute top-0 left-0 h-full max-w-none object-cover"
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
          draggable={false}
        />
         <div className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm pointer-events-none">
            Before
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-transparent cursor-col-resize flex items-center justify-center group"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white transform group-hover:scale-110 transition-transform">
          <MoveHorizontal size={16} className="text-white" />
        </div>
      </div>
    </div>
  );
};