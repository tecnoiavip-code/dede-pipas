import React from 'react';

export const Kite = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Sombras e Reflexos para profundidade */}
    <path d="M12 2L4 10L12 21L20 10L12 2Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2L4 10L12 12V2Z" fill="currentColor" fillOpacity="0.4"/>
    <path d="M12 2L20 10L12 12V2Z" fill="currentColor" fillOpacity="0.7"/>
    {/* Rabiola moderna e curvada */}
    <path d="M12 21C12 21 8 23.5 12 26C16 28.5 12 31 12 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
