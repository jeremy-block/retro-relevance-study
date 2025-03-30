// src/components/ParagraphSelection/ParagraphContentWithSelections.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import MarkdownRenderer from './MarkdownRenderer';
import SelectionContextMenu from './SelectionContextMenu';
import { Paragraph, TextSelection, SelectionToolParams, SelectionListState } from '../retro-types';
import { StimulusParams, StoredAnswer } from '../../../store/types';
import { useStoreSelector } from '../../../store/store';
import { current } from '@reduxjs/toolkit';
import { Button, Center, Pagination, Paper } from '@mantine/core';


const isTesting = true;


export function ParagraphContentWithSelections({
    parameters,
    setAnswer,
    provenanceState
}: StimulusParams<SelectionToolParams, SelectionListState>) {

    // set up a way to pull data from a Previous Stimuli
    const trialNameToPullResponseFrom = "AdminStart_0"
    const keyForSummary = "finishedSummary"
    const keyForID = "participantAssignedID"

    const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);

    // Determine source text - broken
    // const source = isTesting ? parameters.testingStimulusValue as Paragraph[]
    //     : answers[trialNameToPullResponseFrom].answer[keyForSummary] as Paragraph[]};
    const source = parameters.testingStimulusValue as Paragraph[];
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

    useEffect(() => {
        console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)
        if (provenanceState) {
            console.log("🚀 ~ useEffect ~ provenanceState Exists!:", provenanceState)
            setSelections(provenanceState.selections);
            setParagraphs(provenanceState.paragraphs);
            setfocusedParagraphIndex(provenanceState.focusedParagraphIndex);
        } else {
            console.log("🙈 ~ useEffect ~ provenanceState NOPE NOPE NOPE Need to make my own!:")
            setSelections(initialSelections)
            setParagraphs(initialParagraphs);
            setfocusedParagraphIndex(initialParagraphId)
        }
    }, [provenanceState]);

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

        if (existingSelectionIndex !== -1 && existingSelectionIndex !== undefined) {
            isExisting = true;
            const updatedSelections = [...selections];
            // Find and update the selection
            updatedSelections[existingSelectionIndex] = {
                ...updatedSelections[existingSelectionIndex],
                relevanceLevel,
            };
            setSelections(updatedSelections);

            // // Update existing selection  
            // if (isExistingSelection) {
            //     // Find the paragraph
            //     //todo try just using currentParagraphId?
            //     const parentParagraph = (paragraphs ?? []).find(p => p.id === currentParagraph.id);
            //     if (!paragraphs || !parentParagraph ) return;

            //     // const foundSelection = selections.find(s => s.id === pendingSelection.id);
            //     if (isExistingSelection) {
            //         isExistingSelection.relevanceLevel = relevanceLevel;
            //         setSelections([

            //             isExistingSelection
            //         ])
            //     }

        } else {

            // Add a selection for a specific paragraph

            // Check for overlapping selections
            const hasOverlap = selections.some(existingSelection =>
                pendingSelection.startIndex < existingSelection.endIndex &&
                pendingSelection.endIndex > existingSelection.startIndex
            );

            if (hasOverlap) {
                console.warn("Overlapping selection detected");
            }

            // Add the selection
            // create a new selection
            const newSelection: TextSelection = {
                ...pendingSelection,
                relevanceLevel,
                overlapsWithPriorSelection: hasOverlap,
                ParentParagraphID: currentParagraph.id,
            };

            const updatedSelections = [...selections, newSelection];
            setSelections(updatedSelections);
        }

        // Clear states
        clearSelection();

        const newState = {
            paragraphs,
            selections,
            focusedParagraphIndex,
        };
        console.log("🚀 ~ handleSentenceChange ~ newState:", newState)

        // Apply the change to Trrack
        isExisting ?
            trrack.apply('Update Selection', actions.updateSelection(newState)) :
            trrack.apply('Adding Selection', actions.addSelection(newState))


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


    }, [selections, pendingSelection, currentParagraph, trrack, actions, setAnswer, isTesting]);


    // Handler for selecting relevance level
    // const handleSelectRelevance = (relevanceLevel: string) => {
    //     if (!pendingSelection || !currentParagraph?.id) {
    //         clearSelection();
    //         return;
    //     }

    //     // Check if this is an existing selection or a new one
    //     const isExisting = selections?.find(s => s.id === pendingSelection.id);

    //     if (isExisting) {
    //         // Update existing selection
    //         // dispatch(updateSelection({
    //         //     id: pendingSelection.id,
    //         //     relevanceLevel,
    //         //     paragraphId: currentParagraph.id
    //         // }));

    //     } else {
    //         // Add new selection
    //         console.log("adding Selection!")
    //         // dispatch(addSelection({
    //         //     selection: {
    //         //         ...pendingSelection,
    //         //         relevanceLevel
    //         //     },
    //         //     paragraphId: currentParagraph.id
    //         // }));
    //     }

    //     // Clear states
    //     clearSelection();
    // };

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

            //todo set state to provenance graph and set answer.
        }

        // Clear states
        clearSelection();

        const newState = {
            paragraphs,
            selections,
            focusedParagraphIndex,
        };
        console.log("🚀 ~ handleSentenceChange ~ newState:", newState)

        // Apply the change to Trrack
        trrack.apply('Removing Selection', actions.removeSelection(selections));


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
            console.log("🚀 ~ handleSentenceChange ~ newState:", newState)

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
        return array.map(item => item[key]).join(':|:|:');
    }

    if (paragraphs.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No paragraphs available
            </div>
        );
    }

    return (
        <Paper shadow='sm' p='xl' radius='md'>
            {/* Paragraph Display and Navigation */}
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">
                    Paragraph {focusedParagraphIndex + 1} of {paragraphs.length}
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
                        <Center p={4}>

                        <Pagination total={paragraphs.length} size="md" siblings={1}
                            onNextPage={() => handleChangeParagraph(focusedParagraphIndex + 1)}
                            onPreviousPage={() => handleChangeParagraph(focusedParagraphIndex - 1)}
                            onChange={(indexx) => handleChangeParagraph(indexx-1)}
                            />
                            </Center>
                    </div>
                )}
                {focusedParagraphIndex === paragraphs.length - 1 && (
                    <p>You're done now.</p>)
                }
            </div>
        </Paper>
    );
};

export default ParagraphContentWithSelections;
