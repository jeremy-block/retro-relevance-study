// src/components/ParagraphSelection/ParagraphContentWithSelections.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Registry, TrrackEvents, initializeTrrack } from '@trrack/core';
import MarkdownRenderer from './MarkdownRenderer';
import SelectionContextMenu from './SelectionContextMenu';
import { Paragraph, TextSelection } from '../retro-types';
import { addEmptySelections } from '../utils/selectionUtils';

interface ParagraphContentWithSelectionsProps {
  parameters: any;
  initialParagraphs: Array<{
    id: string;
    text: string;
    selections: TextSelection[];
  }>;
  provenanceState?: {
    all: { paragraphs: Paragraph[], Selections: TextSelection[], paragraphId: string }
  };
  updateState?: (all: { paragraphs: Paragraph[], Selections: TextSelection[], paragraphId: string }) => void;
  setAnswer?: (answer: any) => void;
}

const ParagraphContentWithSelections: React.FC<ParagraphContentWithSelectionsProps> = ({
  parameters,
  //todo a function that pulls a random set of paragraph IDs randomly from another place. probably need to consider the await and async process for that.
  initialParagraphs = addEmptySelections(parameters.testingStimulusValue),
  provenanceState,
  updateState = () => null,
  setAnswer = () => null,
}) => {
  // Local state management
  const [paragraphs, setParagraphs] = useState(initialParagraphs);
  // console.log("🚀 ~ initialParagraphs:", initialParagraphs,paragraphs[0])
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<TextSelection | null>(null);
  
  // Current paragraph derived from state
  const currentParagraph = paragraphs[currentParagraphIndex];
  
  // Initialize Trrack
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();
    
    // Register actions for state modifications
    const addSelectionAction = reg.register('addSelection', (state, payload: {
      selection: TextSelection,
      paragraphId: string
    }) => {
      console.log("🚀 ~ const{actions,trrack}=useMemo ~ state:", state)
      console.log("🚀 ~ const{actions,trrack}=useMemo ~ payload:", payload)
      const updatedState = { ...state };
      const paragraphIndex = updatedState.paragraphs.findIndex((p: Paragraph) => {
        console.log("🚀 ~ paragraphIndex ~ p.id:", p.id, typeof(p.id), typeof(payload.paragraphId))
        console.log("🚀 ~ paragraphIndex ~ p.id === payload.paragraphId:", p.id === payload.paragraphId)
        return p.id === payload.paragraphId
      });
      console.log("🚀 ~ const{actions,trrack}=useMemo ~ updatedState:", updatedState)
      console.log("🚀 ~ const{actions,trrack}=useMemo ~ paragraphIndex:", paragraphIndex)
      
      if (paragraphIndex >= 0) {
        console.log(updatedState.paragraphs)
        updatedState.paragraphs[paragraphIndex] = {
          ...updatedState.paragraphs[paragraphIndex],
          selections: [
            ...updatedState.paragraphs[paragraphIndex].selections,
            payload.selection
          ]
        };
        console.log("🚀 ~ const{actions,trrack}=useMemo ~ updatedState:", updatedState)
      }
      
      return updatedState;
    });
    
    const updateSelectionAction = reg.register('updateSelection', (state, payload: {
      id: string,
      relevanceLevel: string,
      paragraphId: string
    }) => {
      const updatedState = { ...state };
      const paragraphIndex = updatedState.paragraphs.findIndex((p:Paragraph) => p.id === payload.paragraphId);
      
      if (paragraphIndex >= 0) {
        const selectionIndex = updatedState.paragraphs[paragraphIndex].selections.findIndex(
          (s:TextSelection) => s.id === payload.id
        );
        
        if (selectionIndex >= 0) {
          updatedState.paragraphs[paragraphIndex].selections[selectionIndex] = {
            ...updatedState.paragraphs[paragraphIndex].selections[selectionIndex],
            relevanceLevel: payload.relevanceLevel
          };
        }
      }
      
      return updatedState;
    });
    
    const removeSelectionAction = reg.register('removeSelection', (state, payload: {
      id: string,
      paragraphId: string
    }) => {
      const updatedState = { ...state };
      const paragraphIndex = updatedState.paragraphs.findIndex((p:Paragraph) => p.id === payload.paragraphId);
      
      if (paragraphIndex >= 0) {
        updatedState.paragraphs[paragraphIndex] = {
          ...updatedState.paragraphs[paragraphIndex],
          selections: updatedState.paragraphs[paragraphIndex].selections.filter(
            (s:TextSelection) => s.id !== payload.id
          )
        };
      }
      
      return updatedState;
    });
    
    const setParagraphIndexAction = reg.register('setParagraphIndex', (state, index: number) => {
      return {
        ...state,
        paragraphCurrentIndex: index
      };
    });
    
    // Initialize Trrack with initial state
    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: {
        paragraphs: initialParagraphs,
        paragraphCurrentIndex: 0
      }
    });
    
    return {
      actions: {
        addSelection: addSelectionAction,
        updateSelection: updateSelectionAction,
        removeSelection: removeSelectionAction,
        setParagraphIndex: setParagraphIndexAction
      },
      trrack: trrackInst
    };
  }, [initialParagraphs]);
  
  // Sync with provenanceState when it changes
  useEffect(() => {
    if (provenanceState) {
      setParagraphs(provenanceState.paragraphs || initialParagraphs);
      setCurrentParagraphIndex(provenanceState.paragraphCurrentIndex || 0);
    }
  }, [provenanceState, initialParagraphs]);
  
  // Handle new text selection
  const handleTextSelection = useCallback((selection: TextSelection) => {
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
    }
  }, []);
  
  // Handle click on an existing selection
  const handleSelectionClick = useCallback((selection: TextSelection) => {
    console.log("🚀 ~ handleTextSelection ~ selection:", selection)
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
  }, []);
  
  // Clear selection helper
  const clearSelection = () => {
    // Clear the browser's selection
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    
    // Clear component state
    setContextMenuPosition(null);
    setPendingSelection(null);
  };
  
  // Handler for selecting relevance level
  const handleSelectRelevance = useCallback((relevanceLevel: string) => {
    console.log("🚀 ~ handleSelectRelevance ~ relevanceLevel:", relevanceLevel)
    
    if (!pendingSelection || !currentParagraph?.id) {
      clearSelection();
      return;
    }
    
    // Check if this is an existing selection or a new one
    const isExisting = currentParagraph.selections?.find((s: TextSelection) => {
      console.log("🚀 ~ isExisting.find ~ s:", s)
      s.id === pendingSelection.id
    });
    console.log("🚀 ~ isExisting ~ isExisting:", (isExisting)?true:false)
    
    // let nextState = TrrackEvents
    console.log("🚀 ~ handleSelectRelevance ~ currentParagraph:", currentParagraph)
    
    if (isExisting) {
      // Update existing selection
      const newState = trrack.apply('Update Selection', actions.updateSelection({
        id: pendingSelection.id,
        relevanceLevel,
        paragraphId: currentParagraph.id
      }));
      console.log("🚀 ~ handleSelectRelevance ~ trrack:", trrack)
      
      // Update local state to match Trrack state
      // setParagraphs(newState.paragraphs);

      // nextState = { ...newState };
      
    } else {
      
      // Add new selection
      console.log("🚀 ~ handleSelectRelevance ~ pendingSelection:", { ...pendingSelection })
      const newState = trrack.apply('Add Selection', actions.addSelection({
        selection: {
          ...pendingSelection,
          relevanceLevel
        },
        paragraphId: currentParagraph.id
      }));
      
      // Update local state to match Trrack state
      // setParagraphs(newState.paragraphs);

      // nextState = { ...newState };
    }

    // Update parent state
    updateState(trrack.getState());

    // console.log(nextState)
    
    // Update answer if needed
    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {
        // ["test-selections_text"]:nextState
      }
    });
    
    // Clear states
    clearSelection();
  }, [pendingSelection, currentParagraph, actions, trrack, updateState, setAnswer]);
  
  // Handler for removing a selection
  const handleRemoveSelection = useCallback(() => {
    if (pendingSelection?.id && currentParagraph?.id) {
      // Remove the selection using Trrack
      const newState = trrack.apply('Remove Selection', actions.removeSelection({
        id: pendingSelection.id,
        paragraphId: currentParagraph.id,
      }));
      
      // Update local state to match Trrack state
      setParagraphs(newState.paragraphs);
      
      // Update parent state
      updateState(trrack.getState());
      
      // Update answer if needed
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {}
      });
    }
    
    // Clear states
    clearSelection();
  }, [pendingSelection, currentParagraph, actions, trrack, updateState, setAnswer]);
  
  // Handler for canceling selection
  const handleCancelSelection = useCallback(() => {
    clearSelection();
  }, []);
  
  // Handler for changing paragraph
  const handleChangeParagraph = useCallback((index: number) => {
    if (index >= 0 && index < paragraphs.length) {
      // Update paragraph index using Trrack
      const newState = trrack.apply('Change Paragraph', actions.setParagraphIndex(index));
      
      // Update local state to match Trrack state
      setCurrentParagraphIndex(newState.paragraphCurrentIndex);
      
      // Update parent state
      updateState(trrack.getState());
      
      // Update answer if needed
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {}
      });
    }
  }, [paragraphs, actions, trrack, updateState, setAnswer]);
  
  // Get the current selections for the paragraph
  const selections = currentParagraph?.selections || [];
  
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
              {paragraphs.map((item:Paragraph, index:number) => (
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
                  <p> done done done</p>
        //   <ParagraphFooter />
        )}
      </div>
    </div>
  );
};

export default ParagraphContentWithSelections;
