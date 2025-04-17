// ParagraphContentWithSelections.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import MarkdownRenderer from '../../retro-relevance/ParagraphSelection/MarkdownRenderer';
import SelectionContextMenu from  '../../retro-relevance/ParagraphSelection/SelectionContextMenu';
import { Paragraph, TextSelection, SelectionToolParams, SelectionListState } from '../../retro-relevance/retro-types';
import { StimulusParams, StoredAnswer } from '../../../store/types';
import { useStoreSelector } from '../../../store/store';
import { useParagraphData } from './useParagraphData';
import { Button, Center, Pagination, Paper, useMantineTheme } from '@mantine/core';

export function ParagraphContentWithSelections({
  parameters,
  setAnswer,
  provenanceState
}: StimulusParams<SelectionToolParams, SelectionListState>) {

  // Get previous stimulus data if needed
  const trialNameToPullResponseFrom = "EditSummary_11";
  const keyForSummary = "finishedSummary";
  const keyForID = "participantAssignedID";

  const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);

  // Use our paragraph data hook
  const {
    loading,
    error,
    initialParagraphs,
    fetchExperimentSequence,
    getParticipantId
  } = useParagraphData();

  // Initial values and state
  const initialParagraphId = 0;
  const initialSelections = [] as TextSelection[];

  const [paragraphs, setParagraphs] = useState<Paragraph[]>(
    provenanceState?.paragraphs || initialParagraphs
  );

  const [focusedParagraphIndex, setfocusedParagraphIndex] = useState<number>(
    provenanceState?.focusedParagraphIndex || initialParagraphId
  );
  const currentParagraph = paragraphs[focusedParagraphIndex];


  const [selections, setSelections] = useState<TextSelection[]>(
    provenanceState?.selections || initialSelections
  );

  const filteredSelections = useMemo(() => {
    if (!selections || !currentParagraph) return [];

    // Only show selections that belong to the current paragraph
    return selections.filter(selection =>
      selection.ParentParagraphID === currentParagraph.id
    );
  }, [selections, currentParagraph]);

  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<TextSelection | null>(null);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const theme = useMantineTheme();

  // Fetch paragraph sequence when component loads
  useEffect(() => {
    const loadParagraphs = async () => {
      // If parameters include a testingStimulusValue, use that instead of fetching
      // if (parameters.testingStimulusValue) {
      //   setParagraphs(parameters.testingStimulusValue as Paragraph[]);
      //   return;
      // }

      // Get the paragraph ID from previous trial if available
      const previousParagraphId = String(answers[trialNameToPullResponseFrom]?.answer[keyForID] || '');

      try {
        // Fetch paragraph sequence from the server
        const fetchedParagraphs = await fetchExperimentSequence(previousParagraphId || undefined);

        // If no paragraphs returned and we have a summary from a previous trial, use that
        if (fetchedParagraphs.length === 0 && answers[trialNameToPullResponseFrom]?.answer[keyForSummary]) {
          setParagraphs([{
            text: String(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] || ''),
            id: String(previousParagraphId || 'default-id'),
            selections: []
          }]);
        } else {
          setParagraphs(fetchedParagraphs);
        }
      } catch (err) {
        console.error("Error loading paragraphs:", err);

        // Fallback to the summary if API fails
        if (answers[trialNameToPullResponseFrom]?.answer[keyForSummary]) {
          setParagraphs([{
            text: String(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] || ''),
            id: String(answers[trialNameToPullResponseFrom]?.answer[keyForID] || 'default-id'),
            selections: []
          }]);
        }
      }
    };

    loadParagraphs();
  }, [parameters.testingStimulusValue, fetchExperimentSequence]);

  // Sync with provenance state when it changes
  useEffect(() => {
    console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)
    if (provenanceState) {
      const selections = provenanceState?.selections || initialSelections;
      const paragraphs = provenanceState?.paragraphs || initialParagraphs;
      const focusedIndex = provenanceState?.focusedParagraphIndex || initialParagraphId;

      setSelections(selections);
      setParagraphs(paragraphs);
      setfocusedParagraphIndex(focusedIndex);
    }
  }, [provenanceState, initialParagraphs]);

  // Initialize Trrack
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();

    const updateSelectionAction = reg.register('updateSelection', (state, payload: SelectionListState) => {
      console.log("🚀 ~ updateSelectionAction ~ payload:", payload)
      console.log("🚀 ~ updateSelectionAction ~ state:", state.sentences)
      state = payload;
      console.log("🚀 ~ updateSelectionAction ~ state:", state)
      return state;
    });
    const removeSelectionAction = reg.register('removeSelectionAction', (state, payload: TextSelection[]) => {
      state.selections = payload
      return state
    });
    const addSelectionAction = reg.register('addSelectionAction', (state, payload: SelectionListState) => {
      state = payload;
      return state
    });
    const setFocusedParagraphAction = reg.register('setFocusedParagraphAction', (state, payload: number) => {
      state.focusedParagraphIndex = payload;
      return state
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

  // Handle sentence text change
  const handleSelectRelevance = useCallback((relevanceLevel: string) => {
    if (!pendingSelection || !currentParagraph?.id) {
      clearSelection();
      return;
    }

    // Check if this is an existing selection or a new one
    const existingSelectionIndex = selections?.findIndex(s => s.id === pendingSelection.id);
    let isExisting = false;

    let updatedSelections = [...selections];

    if (existingSelectionIndex !== -1 && existingSelectionIndex !== undefined) {
      isExisting = true;
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
      selections: updatedSelections, // Use updatedSelections here
      focusedParagraphIndex,
    };
    console.log("🚀 ~ handleSelectRelevance ~ newState:", newState);

    // Apply the change to Trrack
    isExisting
      ? trrack.apply('Update Selection', actions.updateSelection(newState))
      : trrack.apply('Adding Selection', actions.addSelection(newState));

    // Set answer for tracking
    const ParagraphID = parameters.testingStimulusValue ?
      "12345" :
      answers[trialNameToPullResponseFrom]?.answer[keyForID] || currentParagraph.id;

    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {
        ["paragraphIDs"]: makeAnswerStringFromObjKey(updatedSelections, "ParentParagraphID"),
        ["selectionIDs"]: makeAnswerStringFromObjKey(updatedSelections, "id"),
        ["selectionStarts"]: makeAnswerStringFromObjKey(updatedSelections, "startIndex"),
        ["selectionEnds"]: makeAnswerStringFromObjKey(updatedSelections, "endIndex"),
        ["seletionTexts"]: makeAnswerStringFromObjKey(updatedSelections, "selectedText"),
        ["selectionRelevances"]: makeAnswerStringFromObjKey(updatedSelections, "relevanceLevel"),
        ["selectionTypes"]: updatedSelections.map(e => makeAnswerStringFromObjKey(e.elements ?? [], "nodeType")),
      },
    });
  }, [selections, pendingSelection, currentParagraph, trrack, actions, setAnswer, parameters.testingStimulusValue, answers]);

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
  const handleRemoveSelection = useCallback(() => {
    if (pendingSelection?.id && currentParagraph?.id) {
      // Remove the selection
      if (!currentParagraph || !selections) return;

      // Remove the selection
      const smallerSelections = selections.filter((s: TextSelection) => s.id !== pendingSelection.id);
      setSelections(smallerSelections)

      // Apply the change to Trrack
      trrack.apply('Removing Selection', actions.removeSelection(smallerSelections));
      // Set answer for tracking
      const ParagraphID = parameters.testingStimulusValue ?
        "12345" :
        answers[trialNameToPullResponseFrom]?.answer[keyForID] || currentParagraph.id;

      //make sure everything is output for the answer and the response is ready to accept everything
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {
          ["paragraphIDs"]: makeAnswerStringFromObjKey(smallerSelections, "ParentParagraphID"),
          ["selectionIDs"]: makeAnswerStringFromObjKey(smallerSelections, "id"),
          ["selectionStarts"]: makeAnswerStringFromObjKey(smallerSelections, "startIndex"),
          ["selectionEnds"]: makeAnswerStringFromObjKey(smallerSelections, "endIndex"),
          ["seletionTexts"]: makeAnswerStringFromObjKey(smallerSelections, "selectedText"),
          ["selectionRelevances"]: makeAnswerStringFromObjKey(smallerSelections, "relevanceLevel"),
          ["selectionTypes"]: smallerSelections.map(e => makeAnswerStringFromObjKey(e.elements ?? [], "nodeType"))
        }
      });
      const newState = {
        paragraphs,
        selections,
        focusedParagraphIndex,
      };
      console.log("🚀 ~ handleRemoveSelection ~ newState:", newState)
    }

    // Clear states
    clearSelection();
  }, [selections, pendingSelection, currentParagraph, trrack, actions, setAnswer, parameters.testingStimulusValue, answers]);

  // Handler for canceling selection
  const handleCancelSelection = () => {
    clearSelection();
  };

  // Handler for changing paragraph
  const handleChangeParagraph = useCallback((index: number) => {
    if (index >= 0 && index < paragraphs.length) {
      setfocusedParagraphIndex(index);

      //todo save state to provenance graph
      const newState = {
        paragraphs,
        selections,
        focusedParagraphIndex,
      };
      console.log("🚀 ~ handleChangeParagraph ~ newState:", newState)

      // Apply the change to Trrack
      trrack.apply('Changing Paragraph Shown', actions.setFocusedParagraph(focusedParagraphIndex));

      // Set answer for tracking
      const ParagraphID = parameters.testingStimulusValue ?
        "12345" :
        answers[trialNameToPullResponseFrom]?.answer[keyForID] || currentParagraph?.id;

      //make sure everything is output for the answer and the response is ready to accept everything
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {
          ["paragraphIDs"]: makeAnswerStringFromObjKey(selections, "ParentParagraphID"),
          ["selectionIDs"]: makeAnswerStringFromObjKey(selections, "id"),
          ["selectionStarts"]: makeAnswerStringFromObjKey(selections, "startIndex"),
          ["selectionEnds"]: makeAnswerStringFromObjKey(selections, "endIndex"),
          ["seletionTexts"]: makeAnswerStringFromObjKey(selections, "selectedText"),
          ["selectionRelevances"]: makeAnswerStringFromObjKey(selections, "relevanceLevel"),
          ["selectionTypes"]: selections.map(e => makeAnswerStringFromObjKey(e.elements ?? [], "nodeType"))
        }
      });
    }
  }, [selections, paragraphs, focusedParagraphIndex, pendingSelection, currentParagraph, trrack, actions, setAnswer, parameters.testingStimulusValue, answers]);

  //utility for saving arrays of objects to text for response.
  function makeAnswerStringFromObjKey<T>(array: T[], key: keyof T): string {
    return array.reduce((acc, item) => `${acc}${item[key]}:|:|:`, '').slice(0, -5); // Remove trailing delimiter
  }

  // Loading state
  if (loading && paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading paragraphs...
      </div>
    );
  }

  // Error state
  if (error && paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-red-500">
        Error loading paragraphs: {error}
        <button
          onClick={() => fetchExperimentSequence(String(answers[trialNameToPullResponseFrom]?.answer[keyForID] || undefined))}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No paragraphs available
      </div>
    );
  }

  return (
    <div>
      {/* Paragraph Display and Navigation */}
      <div className="mb-6">
        {/* Selection Interface with Markdown Renderer */}
        <h3 className="text-lg font-semibold mb-4">Select Relevant Text{paragraphs.length > 1 && (<span> :: Paragraph {focusedParagraphIndex + 1} of {paragraphs.length}</span>)}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please select the parts of {paragraphs.length > 1 ? (<span>these summaries</span>) : (<span>your summary</span>)} that you think {paragraphs.length > 1 ? (<span>are</span>) : (<span>will be</span>)} relevant to future investigators attempting to complete the investigation: <span>(i.e., What is relevant to someone who is attempting to identify <strong>Who</strong> committed the murder, <strong>What</strong> weapon was used, and <strong>Where</strong> it occured</span>).<br />
          <small style={{ color: theme.colors.gray[5] }}> (Click and drag to select text, and indicate how relevant you believe it would be to {paragraphs.length > 1 ? (<span>someone like you</span>) : (<span>someone new</span>)}.)</small>
        </p>

        {currentParagraph && (
          <div
            ref={contentRef}
            data-paragraph-id={currentParagraph.id}
            className="relative">
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
        onCancel={handleCancelSelection}
        showRemoveOption={!!pendingSelection?.id}
      />

      {/* Display paragraph navigation controls at bottom */}
      {paragraphs.length > 1 && (
        <Center p={4}>
          <Pagination total={paragraphs.length} size="md" siblings={1}
            onNextPage={() => handleChangeParagraph(focusedParagraphIndex + 1)}
            onPreviousPage={() => handleChangeParagraph(focusedParagraphIndex - 1)}
            onChange={(indexx) => handleChangeParagraph(indexx - 1)}
          />
        </Center>
      )}
    </div>
  );
};

export default ParagraphContentWithSelections;