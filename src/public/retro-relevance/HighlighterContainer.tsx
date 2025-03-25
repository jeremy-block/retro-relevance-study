// src/components/ParagraphSelection/HighlighterContainer.tsx
import React, { useEffect, useState } from 'react';
import { TextSelection } from '../../types';
import HighlightComponent from './HighlightComponent';

interface HighlighterContainerProps {
  selections: TextSelection[];
  contentRef: React.RefObject<HTMLDivElement | null>;
  onSelectionClick: (selection: TextSelection) => void;
}

const HighlighterContainer: React.FC<HighlighterContainerProps> = ({
  selections,
  contentRef,
  onSelectionClick
}) => {
  // Force re-render when DOM changes or window resizes to reposition highlights
  const [updateCounter, setUpdateCounter] = useState(0);
  
    useEffect(() => {
    // Update on window resize
    const handleResize = () => {
      setUpdateCounter(prev => prev + 1);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Set up a mutation observer to watch for DOM or content changes
    if (contentRef.current) {
      const observer = new MutationObserver(() => {
        setUpdateCounter(prev => prev + 1);
      });
      
      observer.observe(contentRef.current, { 
        childList: true, 
        subtree: true,
        characterData: true 
      });
      
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    }, [contentRef]);
    
    // Trigger update when selections change
    useEffect(() => {
        setUpdateCounter(prev => prev + 1);
    }, [selections]);
  
  return (
    <div className="highlighter-container absolute top-0 left-0 w-full h-full p-4 pointer-events-none">
      {selections.map(selection => (
        <HighlightComponent
          key={`${selection.id}-${updateCounter}`}
          selection={selection}
          contentRef={contentRef}
          onClick={() => onSelectionClick(selection)}
        />
      ))}
    </div>
  );
};

export default HighlighterContainer;