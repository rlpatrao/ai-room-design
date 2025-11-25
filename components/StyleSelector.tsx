import React from 'react';
import { DesignStyle } from '../types';

interface StyleSelectorProps {
  selectedStyle: string | null;
  onSelect: (style: string) => void;
  disabled: boolean;
}

const STYLES = Object.values(DesignStyle);

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect, disabled }) => {
  return (
    <div className="w-full overflow-x-auto py-2 scrollbar-hide">
      <div className="flex space-x-3">
        {STYLES.map((style) => (
          <button
            key={style}
            onClick={() => onSelect(style)}
            disabled={disabled}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
              ${selectedStyle === style 
                ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/25 scale-105' 
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
};