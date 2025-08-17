import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopProps {
  showAfter?: number; // Show button after scrolling this many pixels
  className?: string;
}

export const BackToTop: React.FC<BackToTopProps> = ({
  showAfter = 300,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener('scroll', toggleVisibility);
    
    // Check initial scroll position
    toggleVisibility();
    
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [showAfter]);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 
        bg-gradient-to-r from-primary-500 to-primary-600
        hover:from-primary-600 hover:to-primary-700
        text-white rounded-full
        shadow-lg hover:shadow-xl
        transform transition-all duration-300
        hover:scale-110 active:scale-95
        flex items-center justify-center
        group
        ${className}
      `}
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
    </button>
  );
};