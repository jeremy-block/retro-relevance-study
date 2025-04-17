// src/components/ParagraphSelection/ParagraphContentWithSelections.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import MarkdownRenderer from './MarkdownRenderer';
import SelectionContextMenu from './SelectionContextMenu';
import { Paragraph, TextSelection, SelectionToolParams, SelectionListState } from '../retro-types';
import { StimulusParams, StoredAnswer } from '../../../store/types';
import { useStoreSelector } from '../../../store/store';
import { current } from '@reduxjs/toolkit';
import { Button, Center, Pagination, Paper, useMantineTheme } from '@mantine/core';


const isTesting = false;


export function ParagraphContentWithSelections({
    parameters,
    setAnswer,
    provenanceState
}: StimulusParams<SelectionToolParams, SelectionListState>) {

    // set up a way to pull data from a Previous Stimuli
    const trialNameToPullResponseFrom = "EditSummary_11"
    const keyForSummary = "finishedSummary"
    const keyForID = "participantAssignedID"

    const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);

    // Determine source text 
    // todo if we only have one paragraph does it still work?
    const source = isTesting 
        ? (parameters.testingStimulusValue as Paragraph[]) 
        : [{ 
            text: String(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] || ''), 
            id: String(answers[trialNameToPullResponseFrom]?.answer[keyForID] || null), 
            selections: [] 
        }];
    // console.log("🚀 ~ source:", source)
    const initialParagraphs = source;
    const initialParagraphId = 0;
    const initialSelections = [] as TextSelection[];

    const [paragraphs, setParagraphs] = useState<Paragraph[]>(
        provenanceState?.paragraphs || initialParagraphs
    );

    const [focusedParagraphIndex, setfocusedParagraphIndex] = useState<number>(
        provenanceState?.focusedParagraphIndex || initialParagraphId
    );

    const [selections, setSelections] = useState<TextSelection[]>(
        provenanceState?.selections || initialSelections
    )
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
    const [pendingSelection, setPendingSelection] = useState<TextSelection | null>(null);

    const currentParagraph = paragraphs[focusedParagraphIndex];
    const contentRef = useRef<HTMLDivElement | null>(null); //I don't know if this is needed
    const theme = useMantineTheme();

    useEffect(() => {
        console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)
        const selections = provenanceState?.selections || initialSelections;
        const paragraphs = provenanceState?.paragraphs || initialParagraphs;
        const focusedIndex = provenanceState?.focusedParagraphIndex || initialParagraphId;
        
        setSelections(selections);
        setParagraphs(paragraphs);
        setfocusedParagraphIndex(focusedIndex);
    }, [provenanceState]);

    // Original useEffect to set up provenance state
    // useEffect(() => {
    // console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)
    //     if (provenanceState) {
    //         console.log("🚀 ~ useEffect ~ provenanceState Exists!:", provenanceState)
    //         setSelections(provenanceState.selections);
    //         setParagraphs(provenanceState.paragraphs);
    //         setfocusedParagraphIndex(provenanceState.focusedParagraphIndex);
    //     } else {
    //         console.log("🙈 ~ useEffect ~ provenanceState NOPE NOPE NOPE Need to make my own!:")
    //         setSelections(initialSelections)
    //         setParagraphs(initialParagraphs);
    //         setfocusedParagraphIndex(initialParagraphId)
    //     }
    // }, [provenanceState]);

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
        const ParagraphID = isTesting ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID];
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
    }, [selections, pendingSelection, currentParagraph, trrack, actions, setAnswer, isTesting]);

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

            // Find the paragraph - Not needed if we are only using current Paragraph
            // const paragraph = (paragraphs ?? []).find((p: Paragraph) => p.id === currentParagraph);

            if (!currentParagraph || !selections) return;

            // Remove the selection
            const smallerSelections = selections.filter((s: TextSelection) => s.id !== pendingSelection.id);
            setSelections(smallerSelections)

            // Apply the change to Trrack
            trrack.apply('Removing Selection', actions.removeSelection(smallerSelections));
            // Set answer for tracking
            const ParagraphID = (isTesting) ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID]
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


    }, [selections, pendingSelection, currentParagraph, trrack, actions, setAnswer, isTesting]);

    // Handler for canceling selection
    const handleCancelSelection = () => {
        clearSelection();
    };

    // // Get the current selections for the paragraph
    // const selections = currentParagraph?.selections || [];

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
            const ParagraphID = (isTesting) ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID]
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
    }, [selections, pendingSelection, currentParagraph, trrack, actions, setAnswer, isTesting]);

    //utility for saving arrays of objects to text for response.
    function makeAnswerStringFromObjKey<T>(array: T[], key: keyof T): string {
        return array.reduce((acc, item) => `${acc}${item[key]}:|:|:`, '').slice(0, -5); // Remove trailing delimiter
    }

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
                            selections={selections}
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
