import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import { Center, Pagination, useMantineTheme } from '@mantine/core';

import MarkdownRenderer from '../../retro-relevance/ParagraphSelection/MarkdownRenderer';
import SelectionContextMenu from '../../retro-relevance/ParagraphSelection/SelectionContextMenu';
import { 
  Paragraph, 
  TextSelection, 
  SelectionToolParams, 
  SelectionListState 
} from '../../retro-relevance/retro-types';
import { StimulusParams, StoredAnswer } from '../../../store/types';
import { useStoreSelector } from '../../../store/store';
import { useParagraphData } from './useParagraphData';

// Helper function to convert array of objects to delimited string for answer storage
function makeAnswerStringFromObjKey<T>(array: T[], key: keyof T): string {
  return array.reduce((acc, item) => `${acc}${item[key]}:|:|:`, '').slice(0, -5); // Remove trailing delimiter
}

export function ParagraphContentWithSelections({
  parameters,
  setAnswer,
  provenanceState
}: StimulusParams<SelectionToolParams, SelectionListState>) {
  // Constants
  const TRIAL_NAME_TO_PULL_RESPONSE_FROM = "sendToSensemakingTask_0";
  const KEY_FOR_SUMMARY = "finishedSummary";
  const KEY_FOR_ID = "firstParagraphId";
  
  // Store access
  const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);
  
  // Use paragraph data hook
  const {
    loading,
    error,
    initialParagraphs,
    fetchExperimentSequence,
  } = useParagraphData();
  
  // Initial values
  const initialParagraphId = 0;
  const initialSelections = [] as TextSelection[];
  
  // State management
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(
    provenanceState?.paragraphs || initialParagraphs
  );
  
  const [focusedParagraphIndex, setFocusedParagraphIndex] = useState<number>(
    provenanceState?.focusedParagraphIndex || initialParagraphId
  );
  
  const [selections, setSelections] = useState<TextSelection[]>(
    provenanceState?.selections || initialSelections
  );
  
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<TextSelection | null>(null);
  
  // Refs and theme
  const contentRef = useRef<HTMLDivElement | null>(null);
  const theme = useMantineTheme();
  
  // Derived state
  const currentParagraph = paragraphs[focusedParagraphIndex];
  
  const filteredSelections = useMemo(() => {
    if (!selections || !currentParagraph) return [];
    
    // Only show selections that belong to the current paragraph
    return selections.filter(selection => 
      selection.ParentParagraphID === currentParagraph.id
    );
  }, [selections, currentParagraph]);
  
  // Initialize Trrack
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();
    
    const updateSelectionAction = reg.register('updateSelection', (state, payload: SelectionListState) => {
      return payload;
    });
    
    const removeSelectionAction = reg.register('removeSelectionAction', (state, payload: TextSelection[]) => {
      state.selections = payload;
      return state;
    });
    
    const addSelectionAction = reg.register('addSelectionAction', (state, payload: SelectionListState) => {
      return payload;
    });
    
    const setFocusedParagraphAction = reg.register('setFocusedParagraphAction', (state, payload: number) => {
      state.focusedParagraphIndex = payload;
      return state;
    });
    
    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: {
        all: {
          sentences: [],
          focusedParagraphIndex: null
        }
      }
    });
    
    return {
      actions: {
        updateSelection: updateSelectionAction,
        removeSelection: removeSelectionAction,
        addSelection: addSelectionAction,
        setFocusedParagraph: setFocusedParagraphAction
      },
      trrack: trrackInst
    };
  }, []);
  
  // Fetch paragraph sequence when component loads
  useEffect(() => {
    const loadParagraphs = async () => {
      // Use testing value if provided in parameters
      // if (parameters.testingStimulusValue) {
      //   setParagraphs(parameters.testingStimulusValue as Paragraph[]);
      //   return;
      // }
      
      // Get the paragraph ID from previous trial if available
      const previousParagraphId = String(answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_ID] || '');
      
      try {
        // Fetch paragraph sequence from the server
        const fetchedParagraphs = await fetchExperimentSequence(previousParagraphId || undefined);
        
        // If no paragraphs returned and we have a summary from a previous trial, use that
        if (fetchedParagraphs.length === 0 && answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_SUMMARY]) {
          setParagraphs([{
            text: String(answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_SUMMARY] || ''),
            id: String(previousParagraphId || 'default-id'),
            selections: []
          }]);
        } else {
          setParagraphs(fetchedParagraphs);
        }
      } catch (err) {
        console.error("Error loading paragraphs:", err);
        
        // Fallback to the summary if API fails
        if (answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_SUMMARY]) {
          setParagraphs([{
            text: String(answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_SUMMARY] || ''),
            id: String(answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_ID] || 'default-id'),
            selections: []
          }]);
        }
      }
    };
    
    loadParagraphs();
  }, [parameters.testingStimulusValue, fetchExperimentSequence, answers]);
  
  // Sync with provenance state when it changes
  useEffect(() => {
    console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)

    if (provenanceState) {
      setSelections(provenanceState?.selections || initialSelections);
      setParagraphs(provenanceState?.paragraphs || initialParagraphs);
      setFocusedParagraphIndex(provenanceState?.focusedParagraphIndex || initialParagraphId);
    }
  }, [provenanceState, initialParagraphs]);
  
  // Helper: Clear the browser's selection and component selection state
  const clearSelection = useCallback(() => {
    // Clear the browser's selection
    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
    
    // Clear component state
    setContextMenuPosition(null);
    setPendingSelection(null);
  }, []);
  
  // Handle text selection
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
  
  // Update answer in store
  const updateAnswerInStore = useCallback((updatedSelections: TextSelection[]) => {
    const paragraphId = parameters.testingStimulusValue
      ? "12345"
      : answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_ID] || currentParagraph?.id;
    
    // Create a Set of paragraphs that have selections
    const paragraphsWithSelections = new Set(
      updatedSelections.map(selection => selection.ParentParagraphID)
    );

    // Check if all paragraphs have at least one selection
    const allParagraphsHaveSelections = paragraphs.every(paragraph => {
      return paragraphsWithSelections.has(String(paragraph.id || ''))
    })? "true" : []; // set it to a string so it can pass validations in the setAnswer backend function.

    
    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {
        paragraphIDs: makeAnswerStringFromObjKey(updatedSelections, "ParentParagraphID"),
        selectionIDs: makeAnswerStringFromObjKey(updatedSelections, "id"),
        selectionStarts: makeAnswerStringFromObjKey(updatedSelections, "startIndex"),
        selectionEnds: makeAnswerStringFromObjKey(updatedSelections, "endIndex"),
        selectionTexts: makeAnswerStringFromObjKey(updatedSelections, "selectedText"),
        selectionRelevances: makeAnswerStringFromObjKey(updatedSelections, "relevanceLevel"),
        selectionTypes: updatedSelections.map(e => makeAnswerStringFromObjKey(e.elements ?? [], "nodeType")),
        allSelected: allParagraphsHaveSelections, //makeAnswerStringFromObjKey([{"checker": allParagraphsHaveSelections}],"checker"), // Add the property inside the answers object
      },
    });
  }, [currentParagraph, parameters.testingStimulusValue, answers, setAnswer, trrack]);
  
  // Handle relevance selection
  const handleSelectRelevance = useCallback((relevanceLevel: string) => {
    if (!pendingSelection || !currentParagraph?.id) {
      clearSelection();
      return;
    }
    
    // Check if this is an existing selection or a new one
    const existingSelectionIndex = selections.findIndex(s => s.id === pendingSelection.id);
    const isExisting = existingSelectionIndex !== -1;
    
    let updatedSelections = [...selections];
    
    if (isExisting) {
      // Update the existing selection
      updatedSelections[existingSelectionIndex] = {
        ...updatedSelections[existingSelectionIndex],
        relevanceLevel,
      };
    } else {
      // Check for overlapping selections
      const hasOverlap = selections.some(existingSelection =>
        pendingSelection.startIndex < existingSelection.endIndex &&
        pendingSelection.endIndex > existingSelection.startIndex
      );
      
      if (hasOverlap) {
        console.warn("Overlapping selection detected");
      }
      
      // Add the new selection
      const newSelection: TextSelection = {
        ...pendingSelection,
        relevanceLevel,
        overlapsWithPriorSelection: hasOverlap,
        ParentParagraphID: currentParagraph.id,
      };
      
      updatedSelections = [...selections, newSelection];
    }
    
    // Update the selections state
    setSelections(updatedSelections);
    
    // Clear states
    clearSelection();
    
    const newState = {
      paragraphs,
      selections: updatedSelections,
      focusedParagraphIndex,
    };
    
    // Apply the change to Trrack
    const action = isExisting
      ? actions.updateSelection(newState)
      : actions.addSelection(newState);
    
    trrack.apply(isExisting ? 'Update Selection' : 'Adding Selection', action);
    
    // Set answer for tracking
    updateAnswerInStore(updatedSelections);
  }, [
    selections, 
    pendingSelection, 
    currentParagraph, 
    paragraphs, 
    focusedParagraphIndex, 
    clearSelection, 
    trrack, 
    actions, 
    updateAnswerInStore
  ]);
  
  // Handler for removing a selection
  const handleRemoveSelection = useCallback(() => {
    if (pendingSelection?.id && currentParagraph?.id) {
      // Remove the selection
      const updatedSelections = selections.filter(s => s.id !== pendingSelection.id);
      setSelections(updatedSelections);
      
      // Apply the change to Trrack
      trrack.apply('Removing Selection', actions.removeSelection(updatedSelections));
      
      // Set answer for tracking
      updateAnswerInStore(updatedSelections);
    }
    
    // Clear states
    clearSelection();
  }, [
    selections, 
    pendingSelection, 
    currentParagraph, 
    clearSelection, 
    trrack, 
    actions, 
    updateAnswerInStore
  ]);
  
  // Handler for changing paragraph
  const handleChangeParagraph = useCallback((index: number) => {
    if (index >= 0 && index < paragraphs.length) {
      setFocusedParagraphIndex(index);
      
      const newState = {
        paragraphs,
        selections,
        focusedParagraphIndex: index,
      };
      
      // Apply the change to Trrack
      trrack.apply('Changing Paragraph Shown', actions.setFocusedParagraph(index));
      
      // Set answer for tracking
      updateAnswerInStore(selections);
    }
  }, [paragraphs, selections, trrack, actions, updateAnswerInStore]);
  
  // Render loading state
  if (loading && paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading paragraphs...
      </div>
    );
  }
  
  // Render error state
  if (error && paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-red-500">
        Error loading paragraphs: {error}
        <button
          onClick={() => fetchExperimentSequence(
            String(answers[TRIAL_NAME_TO_PULL_RESPONSE_FROM]?.answer[KEY_FOR_ID] || undefined)
          )}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Render empty state
  if (paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No paragraphs available
      </div>
    );
  }
  
  // Main render
  return (
    <div>
      {/* Paragraph Display and Navigation */}
      <div className="mb-6">
        {/* Selection Interface with Markdown Renderer */}
        
        <p className="text-sm text-gray-600 mb-4">
          Please select the parts in each of these summaries that you think would be relevant to future investigators.
          <br />
          <small style={{ color: theme.colors.gray[5] }}>
            Click and drag to select text, and indicate how relevant (Critical, Helpful, Optional) you believe the text would be to someone joining the investigative team and helping solve the mystery.
          </small>
        </p>
        
        <h3 className="text-lg font-semibold mb-4">
          Select Relevant Text
          {paragraphs.length > 1 && (
            <span> :: Paragraph {focusedParagraphIndex + 1} of {paragraphs.length}</span>
          )}
        </h3>
        {currentParagraph && (
          <div
            ref={contentRef}
            data-paragraph-id={currentParagraph.id}
            className="relative"
          >
            <MarkdownRenderer
              markdownText={currentParagraph.text}
              selections={filteredSelections}
              onTextSelection={handleTextSelection}
              onSelectionClick={handleSelectionClick}
              dataParagraphId={currentParagraph.id}
              className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto"
              aria-label="Paragraph content with selectable text"
            />
          </div>
        )}
      </div>
      
      {/* Context Menu for Selection */}
      <SelectionContextMenu
        position={contextMenuPosition}
        onSelectRelevance={handleSelectRelevance}
        onRemove={handleRemoveSelection}
        onCancel={clearSelection}
        showRemoveOption={!!pendingSelection?.id}
      />
      
      {/* Display paragraph navigation controls at bottom */}
      {paragraphs.length > 1 && (
        <Center p={4}>
          <Pagination 
            total={paragraphs.length} 
            size="md" 
            siblings={1}
            onChange={(index) => handleChangeParagraph(index - 1)}
            value={focusedParagraphIndex + 1}
          />
        </Center>
      )}
      
      <p>
        Considering the paragraphs above, please rank how <strong>helpful</strong> each would be to a new investigator.
      </p>
    </div>
  );
}

export default ParagraphContentWithSelections;
