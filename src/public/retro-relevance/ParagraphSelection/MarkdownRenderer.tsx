// src/components/ParagraphSelection/MarkdownRenderer.tsx
import React, { useRef, useState } from 'react';
import { parseMarkdownWithIds } from '../utils/markdownUtils';
import { TextSelection } from '../retro-types';
import HighlighterContainer from './HighlighterContainer';
import SelectionManager from './SelectionManager';
import { Box, Paper } from '@mantine/core';

interface MarkdownRendererProps {
  markdownText: string;
  selections: TextSelection[];
  onTextSelection: (selection: TextSelection) => void;
  onSelectionClick: (selection: TextSelection) => void;
  className?: string;
  readOnly?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  markdownText,
  selections,
  onTextSelection,
  onSelectionClick,
  className = '',
  readOnly = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
    // Parse the markdown to HTML
const html = parseMarkdownWithIds(markdownText);

  // Handle when selection starts
  const handleSelectionStart = () => {
    setIsSelecting(true);
  };
  
  // Handle when selection is completed
  const handleSelectionComplete = (selection: TextSelection) => {
    setIsSelecting(false);
    onTextSelection(selection);
  };
  
  // Handle when selection is cancelled
  const handleSelectionCancel = () => {
    setIsSelecting(false);
  };
  
  return (
    <Paper p='sm' m='lg' shadow='lg' style={{ position: 'relative', height: '500px', overflowY: 'scroll', paddingLeft: '1rem', paddingRight: '1rem' }} className={`markdown-renderer relative ${className} ${isSelecting ? 'selecting' : ''}`}>
      {/* The actual markdown content */}
      <Box 
        style={{
          position: 'relative',
          width: '100%',
          height: '500px', // Ensure the parent has a defined height
        }}
        ref={contentRef}
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {/* Selection manager - only if not read-only */}
      {!readOnly && (
        <SelectionManager
          contentRef={contentRef}
          onSelectionComplete={handleSelectionComplete}
          markdownText={markdownText}
          onSelectionStart={handleSelectionStart}
          onSelectionCancel={handleSelectionCancel}
        />
      )}
      
      {/* Highlighter container - shows all highlights */}
      <HighlighterContainer
        selections={selections}
        contentRef={contentRef}
        onSelectionClick={onSelectionClick}
      />
    </Paper>
  );
};

export default MarkdownRenderer;