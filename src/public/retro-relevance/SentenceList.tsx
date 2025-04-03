// src/components/TextEditor/SentenceList.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import SentenceItem from './SentenceItem';
import { Sentence, SentenceListParams, SentenceListState } from './retro-types';
import { splitIntoSentences, splitIntoSentencesAndMetadata, splitIntoSentencesOld } from './utils/markdownUtils';
import { useStoreSelector } from '../../store/store';
import { StimulusParams, StoredAnswer } from '../../store/types';
import { Button, Paper } from '@mantine/core';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type {
    DropResult,
    DroppableProvided,
    DraggableProvided,
} from '@hello-pangea/dnd';
import styled from '@emotion/styled';


//todo set isTesting to false once ready for participants.
const isTesting = false;

export interface Quote {
    id: string; content: string
}

export function SentenceList({
    parameters,
    setAnswer,
    provenanceState,
}: StimulusParams<SentenceListParams, SentenceListState>) {


    // console.log("🚀 ~ initialSentences=splitIntoSentencesOld ~ initialSentences:", initialSentences)
    // console.log("🚀 ~ provenanceState:", provenanceState)

    // set up a way to pull data from a Previous Stimuli
    const trialNameToPullResponseFrom = "AdminStart_10"
    const keyForSummary = "originalSummary"
    const keyForID = "participantAssignedID"

    const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);

    // Determine source text
    const source = isTesting
        ? parameters.testingStimulusValue as string
        : answers[trialNameToPullResponseFrom].answer[keyForSummary] as string;

    const initialSentences = splitIntoSentencesOld(source).map((text, index) => ({
        id: `sentence-${index}`,
        text,
    }));
    const initialFocus = null;
    // console.log("🚀 ~ answers:", answers)
    // (isTesting)?console.log("pulling from parameters, not from responses to",trialNameToPullResponseFrom):console.log("🚀 ~ ParagraphID:", answers[trialNameToPullResponseFrom].answer[keyForID])




    // function setLocalState(newState: { sentences: { id: string; text: string; }[]; focusedSentenceId: string | null }) {
    //     setSentences(newState.sentences);
    //     setFocusedSentenceId(newState.focusedSentenceId);
    // }

    // const [localState, setLocalState] = useState<SentenceListState>({
    //     sentences: initialSentences,
    //     focusedSentenceId: initialFocus,
    // });


    const [sentences, setSentences] = useState<Sentence[]>(
        provenanceState?.sentences || initialSentences
    );

    const [focusedSentenceId, setFocusedSentenceId] = useState<string | null>(
        provenanceState?.focusedSentenceId || null
    );



    // Local state that will be applied to Trrack
    // // Sync local state with provenance state when it changes
    // useEffect(() => {
    //     if (provenanceState) {
    //         setSentences(provenanceState.sentences);
    //         setFocusedSentenceId(provenanceState.focusedSentenceId);
    //     }
    // }, [provenanceState]);

    useEffect(() => {
        console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)
        if (provenanceState) {
            console.log("🚀 ~ useEffect ~ provenanceState Exists!:", provenanceState)
            setSentences(provenanceState.sentences);
            setFocusedSentenceId(provenanceState.focusedSentenceId);
            // setLocalState(provenanceState);
        } else {
            console.log("🙈 ~ useEffect ~ provenanceState NOPE NOPE NOPE Need to make my own!:")
            setSentences(initialSentences);
            setFocusedSentenceId(initialFocus)
            // setLocalState({ sentences: initialSentences, focusedSentenceId: initialFocus })
        }
    }, [provenanceState]);





    // Initialize Trrack
    const { actions, trrack } = useMemo(() => {
        const reg = Registry.create();

        const updateSentenceAction = reg.register('updateSentence', (state, payload: SentenceListState) => {
            console.log("🚀 ~ updateSentenceAction ~ payload:", payload)
            console.log("🚀 ~ updateSentenceAction ~ state:", state.sentences)
            state = payload;
            console.log("🚀 ~ updateSentenceAction ~ state:", state)
            return state;
        });
        const rearrangeSentencesAction = reg.register('rearangeSentence', (state, payload: SentenceListState) => {
            state = payload;
            return state;
        })
        const removeSentenceAction = reg.register('removeSentenceAction', (state, payload: Sentence[]) => {
            // state = { payload };
            state.sentences = payload
            return state
        });
        const addSentenceAction = reg.register('addSentenceAction', (state, payload: SentenceListState) => {
            state = payload;
            return state
        });
        const setFocusedSentenceAction = reg.register('setFocusedSentenceAction', (state, payload: String | null) => {
            state.focusedSentenceId = payload;
            return state
        });

        const trrackInst = initializeTrrack({
            registry: reg,
            initialState: {
                all: {
                    sentences: [],
                    focusedSentenceId: null
                }
            }
        });

        return {
            actions: {
                updateSentence: updateSentenceAction,
                rearrangeSentences: rearrangeSentencesAction,
                removeSentence: removeSentenceAction,
                addSentence: addSentenceAction,
                setFocusedSentence: setFocusedSentenceAction
            },
            trrack: trrackInst
        };
    }, []);

    // Handle sentence text change
    const handleSentenceChange = useCallback((id: string, newText: string, oldText: string) => {
        const updatedSentences = sentences.map((sentence: Sentence) => {
            return sentence.id === id ? { ...sentence, text: newText } : sentence;
        });
        // console.log("🚀 ~ updatedSentences ~ localState:", localState)
        console.log("🚀 ~ handleSentenceChange ~ updatedSentences:", updatedSentences)

        setSentences(updatedSentences);
        setFocusedSentenceId(null);

        const newState = {
            sentences: updatedSentences,
            focusedSentenceId: null
        };
        console.log("🚀 ~ handleSentenceChange ~ newState:", newState)

        // Apply the change to Trrack
        trrack.apply('Update Sentence', actions.updateSentence(newState));

        // Set answer for tracking
        const ParagraphID = (isTesting) ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID]
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, trrack, actions, setAnswer, isTesting]);

    // Handle sentence removal
    const handleSentenceRemove = useCallback((id: string, text: string, reason: string) => {
        console.log("🚀 ~ removeSentenceAction ~ state:", {})

        //todo add in some way to capture reason.

        const updatedSentences = sentences.filter((sentence: Sentence) =>
            sentence.id !== id
        );

        const newSentences = updatedSentences

        setSentences(updatedSentences);

        // Apply the change to Trrack
        trrack.apply('Remove Sentence', actions.removeSentence(newSentences));

        // Set answer for tracking
        const ParagraphID = (isTesting) ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID]
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, focusedSentenceId, trrack, actions, setAnswer, isTesting]);

    // Handle sentence addition
    const handleAddSentence = useCallback((afterId: string | null) => {

        // Create a new sentence
        const newSentence: Sentence = {
            id: `s${Date.now()}`, // Generate unique ID
            text: '',
            // Add any other properties needed for a Sentence
        };
        // const newSentence = { id: Date.now, text: '' };
        let someSentences: Sentence[];

        if (afterId === null) {
            someSentences = [...sentences, newSentence];
        } else {
            someSentences = [];
            let added = false;

            for (const sentence of sentences) {
                someSentences.push(sentence);
                if (sentence.id === afterId) {
                    someSentences.push(newSentence);
                    added = true;
                }
            }

            if (!added) {
                someSentences.push(newSentence);
            }
        }
        setSentences(someSentences);
        setFocusedSentenceId(newSentence.id);

        const newState = {
            sentences: someSentences,
            focusedSentenceId: newSentence.id
        };

        // Apply the change to Trrack
        trrack.apply('Add Sentence', actions.addSentence(newState));

        // Set answer for next component
        const ParagraphID = (isTesting) ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID]
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, trrack, actions, setAnswer, isTesting]);

    const handleSentenceIdChange = useCallback((newFocus: string | null) => {
        console.log("Previous Focus:", focusedSentenceId, "New Focus:", newFocus);

        // Update local state
        setFocusedSentenceId(newFocus);

        const newState = newFocus
        // Apply the change to Trrack
        trrack.apply('Set Focused Sentence', actions.setFocusedSentence(newState));

        console.log("🚀 ~ handleSentenceIdChange ~ newState:", newState)

        const ParagraphID = (isTesting) ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID]
        // Set answer for tracking
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, trrack, actions, setAnswer, isTesting]);


    const handleDragEnd = useCallback((result: DropResult) => {
        if (result.destination === null) {
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        const newOrderSentences = reorder(
            sentences,
            result.source.index,
            result.destination.index,
        ) as Sentence[];


        setSentences(newOrderSentences);

        const newState = {
            sentences: newOrderSentences,
            focusedSentenceId: focusedSentenceId,
        };

        // Apply the change to Trrack
        trrack.apply('Rearranging Sentences', actions.rearrangeSentences(newState));

        console.log("🚀 ~ handleDragEnd ~ newState:", newState)

        const ParagraphID = (isTesting) ? "12345" : answers[trialNameToPullResponseFrom].answer[keyForID]
        // Set answer for tracking
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, trrack, actions, setAnswer, isTesting])

    // Get all text combined
    const joinTextOfObjects = (currentSentences: Sentence[]): string => {
        return currentSentences.map(s => s.text).join(' ');
    };

    //todo Compute difference between texts and actually classify changes.
    const computeDiff = (oldText: string, newText: string): string => {
        return `removed: "${oldText}" added: "${newText}"`;
    };

    
    const grid = 10;
    const reorder = (list: Iterable<unknown> | ArrayLike<unknown>, startIndex: number, endIndex: number) => {
        console.log("🚀 ~ reorder ~ list:", list)
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        
        return result;
    };
    
    
    const List = styled.div`
    margin-left: ${grid * 2}px;
    `;

    // return <p>hello</p>
    console.log("🚀 ~ sentences:", sentences)
    
    return (
        <Paper shadow="xs" p="sm">
            {(sentences.length === 0) ? (<div>No sentences to your summaries... Try adding one with the button below.</div>) : null}
            <div className="space-y-1">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="droppable">
                        {(droppableProvided: DroppableProvided) => (
                            <List
                                ref={droppableProvided.innerRef}
                                {...droppableProvided.droppableProps}
                            >
                                {sentences.map((sentence: Sentence, index: number) => (
                                    <Draggable
                                        key={sentence.id}
                                        draggableId={sentence.id}
                                        index={index}
                                    >
                                        {(draggableProvided: DraggableProvided) => (
                                            <SentenceItem
                                                key={sentence.id}
                                                id={sentence.id}
                                                text={sentence.text}
                                                ref={draggableProvided.innerRef}
                                                provided={draggableProvided}
                                                focused={focusedSentenceId === sentence.id}
                                                onChange={handleSentenceChange}
                                                onRemove={handleSentenceRemove}
                                                onAddAfter={() => handleAddSentence(sentence.id)}
                                                onFocus={handleSentenceIdChange}
                                            />
                                        )}
                                    </Draggable>
                                ))}
                                {droppableProvided.placeholder}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
            <div className="mt-4">
                <Button size="compact-md"
                    // className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => handleAddSentence(null)}
                >
                    + Add Sentence
                </Button>
            </div>
        </Paper>
    );
};

export default SentenceList;

