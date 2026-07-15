import React from 'react';
import { FaDumbbell } from 'react-icons/fa';

const Logo = ({ 
  size = 'md', 
  withText = true, 
  className = '',
  variant = 'default',
  onClick = null,
}) => {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'text-xl', text: 'text-xl' },
    md: { container: 'w-12 h-12', icon: 'text-2xl', text: 'text-2xl' },
    lg: { container: 'w-16 h-16', icon: 'text-3xl', text: 'text-3xl' },
    xl: { container: 'w-24 h-24', icon: 'text-4xl', text: 'text-4xl' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div 
      className={`flex items-center gap-3 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="logo-wrapper">
        <img 
          src="/logo.png" 
          alt="I-Motion" 
          className={`${currentSize.container} object-contain logo-image`}
          style={{ width: '25%', height: '25%', margin: 'auto', display: 'block' }}
        />
        <div className="logo-ring"></div>
      </div>
      {withText && (
        <span 
          className={`${currentSize.text} font-display font-bold text-logo-gradient`}
          style={{ fontFamily: 'Monospace', fontStyle: 'italic' }}
        >
          I-Motion Club
        </span>
      )}
    </div>
  );
};

export default Logo;