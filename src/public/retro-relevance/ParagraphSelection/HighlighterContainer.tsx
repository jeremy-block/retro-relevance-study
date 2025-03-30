// src/components/ParagraphSelection/HighlighterContainer.tsx
import React, { useEffect, useState } from 'react';
import { TextSelection } from '../retro-types';
import HighlightComponent from './HighlightComponent';
import { Box } from '@mantine/core';

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
    <Box
      p={'sm'}
      style={{
        position: 'absolute',
      }}>
      {selections.map(selection => (
        <HighlightComponent
          key={`${selection.id}-${updateCounter}`}
          selection={selection}
          contentRef={contentRef}
          onClick={() => onSelectionClick(selection)}
        />
      ))}
    </Box>
  );
};

export default HighlighterContainer;