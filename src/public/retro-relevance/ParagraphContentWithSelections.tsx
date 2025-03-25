// src/components/ParagraphSelection/ParagraphContentWithSelections.tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import MarkdownRenderer from './MarkdownRenderer';
import SelectionContextMenu from './SelectionContextMenu';
import { 
  addSelection, 
  updateSelection, 
  removeSelection, 
  setParagraphIndex 
} from '../../store/slices/contentSlice';
import { TextSelection } from '../../types';
import ParagraphFooter from './ParagraphFooter';

const ParagraphContentWithSelections: React.FC = () => {
  const dispatch = useDispatch();
  
  const paragraphs = useSelector((state: RootState) => state.content.paragraphs || []);
  const currentParagraphIndex = useSelector((state: RootState) => state.content.paragraphCurrentIndex || 0);
  const currentParagraph = paragraphs[currentParagraphIndex];
  
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<TextSelection | null>(null);
  
  // Handle new text selection
  const handleTextSelection = (selection: TextSelection) => {
    setPendingSelection(selection);
    
    // Calculate position for context menu near selection
  const selectionObj = window.getSelection();
  if (selectionObj && !selectionObj.isCollapsed) {
    const range = selectionObj.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setContextMenuPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.bottom + window.scrollY + 5,
    });
    
    // Important: Don't clear the selection yet!
    // It will be cleared after the user makes a choice from the context menu
  }
  };
  
  // Handle click on an existing selection
  const handleSelectionClick = (selection: TextSelection) => {
    setPendingSelection(selection);
    
    // Find the position of the selection in the DOM
    const element = document.querySelector(`[data-selection-id="${selection.id}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setContextMenuPosition({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.bottom + window.scrollY + 5,
      });
    }
  };
  
  // Handler for selecting relevance level
  const handleSelectRelevance = (relevanceLevel: string) => {
    if (!pendingSelection || !currentParagraph?.id) {
      clearSelection();
      return;
    }
    
    // Check if this is an existing selection or a new one
    const isExisting = selections?.find(s => s.id === pendingSelection.id);
    
    if (isExisting) {
      // Update existing selection
      dispatch(updateSelection({
        id: pendingSelection.id,
        relevanceLevel,
        paragraphId: currentParagraph.id
      }));
      
    } else {
      // Add new selection
      dispatch(addSelection({
        selection: {
          ...pendingSelection,
          relevanceLevel
        },
        paragraphId: currentParagraph.id
      }));
    }
    
    // Clear states
    clearSelection();
  };
  
  // Add a helper function to clear the browser's selection utility
const clearSelection = () => {
  // Clear the browser's selection
  const selection = window.getSelection();
  if (selection) selection.removeAllRanges();
  
  // Clear component state
  setContextMenuPosition(null);
  setPendingSelection(null);
};

  // Handler for removing a selection
  const handleRemoveSelection = () => {
    if (pendingSelection?.id && currentParagraph?.id) {
      // Remove the selection
      dispatch(removeSelection({
        id: pendingSelection.id,
        paragraphId: currentParagraph.id,
      }));
    }
    
    // Clear states
    clearSelection();
  };
  
  // Handler for canceling selection
  const handleCancelSelection = () => {
    clearSelection();
  };
  
  // Get the current selections for the paragraph
  const selections = currentParagraph?.selections || [];
  
  // Handler for changing paragraph
  const handleChangeParagraph = (index: number) => {
    if (index >= 0 && index < paragraphs.length) {
      dispatch(setParagraphIndex(index));
    }
  };
  
  if (paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No paragraphs available
      </div>
    );
  }
  
  return (
    <div className="paragraph-content p-4">
      {/* Paragraph Display and Navigation */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">
          Paragraph {currentParagraphIndex + 1} of {paragraphs.length}
        </h2>
      
        {/* Selection Interface with Markdown Renderer */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Select Relevant Text</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select text below to mark it as relevant. Click and drag to highlight text.
          </p>
      
          {currentParagraph && (
            <div className="relative">
              <MarkdownRenderer
                markdownText={currentParagraph.text}
                selections={selections}
                onTextSelection={handleTextSelection}
                onSelectionClick={handleSelectionClick}
                className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto"
              />
            </div>
          )}
        </div>
      
        {/* Context Menu for Selection */}
        <SelectionContextMenu
          position={contextMenuPosition}
          onSelectRelevance={handleSelectRelevance}
          onRemove={handleRemoveSelection}
          onCancel={handleCancelSelection}
          showRemoveOption={!!pendingSelection?.id}
        />
      
        {/* Display paragraph navigation controls at bottom */}
        {paragraphs.length > 1 && (
          <div className="flex justify-between mb-4 mt-6">
            <button
              onClick={() => handleChangeParagraph(currentParagraphIndex - 1)}
              disabled={currentParagraphIndex === 0}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                currentParagraphIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            {/* Dots navigation for paragraphs */}
            <div className="flex space-x-2 items-center">
              {paragraphs.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentParagraphIndex ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
                  } cursor-pointer`}
                  onClick={() => handleChangeParagraph(index)}
                  aria-label={`Go to paragraph ${index + 1}`}
                ></div>
              ))}
            </div>
            <button
              onClick={() => handleChangeParagraph(currentParagraphIndex + 1)}
              disabled={currentParagraphIndex === paragraphs.length - 1}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                currentParagraphIndex === paragraphs.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        )}
        {currentParagraphIndex === paragraphs.length - 1 && (
          <ParagraphFooter />)
        }
      </div>
    </div>
  );
};

export default ParagraphContentWithSelections;