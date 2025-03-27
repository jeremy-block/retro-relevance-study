// src/components/TextEditor/SentenceList.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import SentenceItem from './SentenceItem';
import { Sentence } from './retro-types';
import { splitIntoSentences, splitIntoSentencesAndMetadata, splitIntoSentencesOld } from './utils/markdownUtils';
import { useStoreSelector } from '../../store/store';

// Interface for SentenceList props
interface SentenceListProps {
    parameters: any; //I think this is always passed in.
    initialSentences?: Sentence[];
    provenanceState?: { all: { sentences: Sentence[], focusedSentenceId: string | null } };
    updateState?: (all: { sentences: Sentence[], focusedSentenceId: string | null }) => void;
    setAnswer?: (data: any) => void;
}
interface StoredAnswer {
    [key: string]: any; // Add specific properties if known, e.g., participantAssignedID?: string;
}

const SentenceList: React.FC<SentenceListProps> = ({
    parameters,
    initialSentences = splitIntoSentencesOld(parameters.testingStimulusValue).map((text, index) => ({
        id: `sentence-${index}`,
        text,
    })),
    provenanceState,
    updateState = () => null,
    setAnswer = () => null
}) => {
    // console.log("🚀 ~ initialSentences=splitIntoSentencesOld ~ initialSentences:", initialSentences)
    // console.log("🚀 ~ provenanceState:", provenanceState)

    // set up a way to pull data from a Previous Stimuli
    const trialNameToPullResponseFrom = "AdminStart_0"
    const keyForSummary = "originalSummary"
    const keyForID = "participantAssignedID"
    
    const answers = useStoreSelector((state): { [key: string]: StoredAnswer } => state.answers);
    
    //todo set isTesting to false once ready for participants.
    const isTesting = true;
    (isTesting)?console.log("pulling from parameters, not from responses to",trialNameToPullResponseFrom):console.log("🚀 ~ ParagraphID:", answers[trialNameToPullResponseFrom].answer[keyForID])

    
    // console.log("🚀 ~ answers:", answers)
    // Local state that will sync with Trrack
    const [sentences, setSentences] = useState<Sentence[]>(
        provenanceState?.all.sentences || initialSentences
    );

    const [focusedSentenceId, setFocusedSentenceId] = useState<string | null>(
        provenanceState?.all.focusedSentenceId || null
    );

    // Sync local state with provenance state when it changes
    useEffect(() => {
        if (provenanceState) {
            setSentences(provenanceState.all.sentences);
            setFocusedSentenceId(provenanceState.all.focusedSentenceId);
        }
    }, [provenanceState]);

    // Initialize Trrack
    const { actions, trrack } = useMemo(() => {
        const reg = Registry.create();

        // Register actions that can modify state
        const updateSentenceAction = reg.register('updateSentence', (state, payload: { id: string, text: string }) => {
            console.log("🚀 ~ updateSentenceAction ~ state:", payload)
            const updatedSentences = state.all.sentences.map((sentence: Sentence) => {
                sentence.id === payload.id ? { ...sentence, text: payload.text } : sentence
            }
            );

            state.all = {
                ...state.all,
                sentences: updatedSentences
            };
            return state;
        });

        const removeSentenceAction = reg.register('removeSentence', (state, payload: { id: string }) => {
            console.log("🚀 ~ removeSentenceAction ~ state:", { ...state.all })

            const updatedSentences = state.all.sentences.filter((sentence: Sentence) =>
                sentence.id !== payload.id
            );

            state.all = {
                ...state.all,
                sentences: updatedSentences
            };
            return state;
        });

        const addSentenceAction = reg.register('addSentence', (state, payload: {
            newSentence: Sentence,
            afterId: string | null
        }) => {
            let updatedSentences: Sentence[];

            if (payload.afterId === null) {
                updatedSentences = [...state.all.sentences, payload.newSentence];
            } else {
                updatedSentences = [];
                let added = false;

                for (const sentence of state.all.sentences) {
                    updatedSentences.push(sentence);
                    if (sentence.id === payload.afterId) {
                        updatedSentences.push(payload.newSentence);
                        added = true;
                    }
                }

                if (!added) {
                    updatedSentences.push(payload.newSentence);
                }
            }

            state.all = {
                ...state.all,
                sentences: updatedSentences,
                focusedSentenceId: payload.newSentence.id
            };
            return state;
        });

        const setFocusedSentenceAction = reg.register('setFocusedSentence', (state, newFocusedId: string | null) => {
            state.all = {
                ...state.all,
                focusedSentenceId: newFocusedId
            };
            return state;
        });

        const trrackInst = initializeTrrack({
            registry: reg,
            initialState: {
                all: {
                    sentences: initialSentences,
                    focusedSentenceId: null
                }
            }
        });

        return {
            actions: {
                updateSentence: updateSentenceAction,
                removeSentence: removeSentenceAction,
                addSentence: addSentenceAction,
                setFocusedSentence: setFocusedSentenceAction
            },
            trrack: trrackInst
        };
    }, [initialSentences]);

    // Handle sentence text change
    const handleSentenceChange = useCallback((id: string, newText: string, oldText: string) => {
        // Apply the change to Trrack
        trrack.apply('Update Sentence', actions.updateSentence({ id, text: newText }));

        // Update local state
        const updatedSentences = sentences.map(sentence =>
            sentence.id === id ? { ...sentence, text: newText } : sentence
        );
        setSentences(updatedSentences);

        // Notify parent component
        updateState({
            sentences: updatedSentences,
            focusedSentenceId
        });

        const ParagraphID = (isTesting)?"12345":answers[trialNameToPullResponseFrom].answer[keyForID]
        // Set answer for tracking
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, focusedSentenceId, trrack, actions, updateState, setAnswer, isTesting]);

    // Handle sentence removal
    const handleSentenceRemove = useCallback((id: string, text: string, reason: string) => {
        // Apply the change to Trrack
        trrack.apply('Remove Sentence', actions.removeSentence({ id }));

        // Update local state
        const updatedSentences = sentences.filter(sentence => sentence.id !== id);
        setSentences(updatedSentences);

        // Notify parent component
        updateState({
            sentences: updatedSentences,
            focusedSentenceId: focusedSentenceId === id ? null : focusedSentenceId
        });

        const ParagraphID = (isTesting)?"12345":answers[trialNameToPullResponseFrom].answer[keyForID]
        // Set answer for tracking
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, focusedSentenceId, trrack, actions, updateState, setAnswer, isTesting]);

    // Handle sentence addition
    const handleAddSentence = useCallback((afterId: string | null) => {
        // Create a new sentence
        const newSentence: Sentence = {
            id: `s${Date.now()}`, // Generate unique ID
            text: '',
            // Add any other properties needed for a Sentence
        };

        // Apply the change to Trrack
        trrack.apply('Add Sentence', actions.addSentence({
            newSentence,
            afterId
        }));

        // Update local state
        let updatedSentences: Sentence[];
        if (afterId === null) {
            updatedSentences = [...sentences, newSentence];
        } else {
            updatedSentences = [];
            let added = false;

            for (const sentence of sentences) {
                updatedSentences.push(sentence);
                if (sentence.id === afterId) {
                    updatedSentences.push(newSentence);
                    added = true;
                }
            }

            if (!added) {
                updatedSentences.push(newSentence);
            }
        }

        setSentences(updatedSentences);
        setFocusedSentenceId(newSentence.id);

        // Notify parent component
        updateState({
            sentences: updatedSentences,
            focusedSentenceId: newSentence.id
        });

        const ParagraphID = (isTesting)?"12345":answers[trialNameToPullResponseFrom].answer[keyForID]
        // Set answer for next component
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, trrack, actions, updateState, setAnswer, isTesting]);

    const handleSentenceIdChange = useCallback((newFocus: string | null) => {
        console.log("Previous Focus:", focusedSentenceId, "New Focus:", newFocus);

        // Apply the change to Trrack
        trrack.apply('Set Focused Sentence', actions.setFocusedSentence(newFocus));

        // Update local state
        setFocusedSentenceId(newFocus);

        // Notify parent component
        updateState({
            sentences,
            focusedSentenceId: newFocus
        });

        const ParagraphID = (isTesting)?"12345":answers[trialNameToPullResponseFrom].answer[keyForID]
        // Set answer for tracking
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["paragraphID"]: ParagraphID,
                ["updatedSummary"]: joinTextOfObjects(sentences)
            }
        });
    }, [sentences, trrack, actions, updateState, setAnswer, isTesting]);

    // Get all text combined
    const joinTextOfObjects = (currentSentences: Sentence[]): string => {
        return currentSentences.map(s => s.text).join(' ');
    };

    // Compute difference between texts
    const computeDiff = (oldText: string, newText: string): string => {
        return `removed: "${oldText}" added: "${newText}"`;
    };

    return (
        <>
            {(sentences.length === 0) ? (<div>No sentences to your summaries... Try adding one with the button below.</div>) : null}
            <div className="space-y-1">
                {sentences.map((sentence) => (
                    <SentenceItem
                        key={sentence.id}
                        id={sentence.id}
                        text={sentence.text}
                        focused={focusedSentenceId === sentence.id}
                        onChange={handleSentenceChange}
                        onRemove={handleSentenceRemove}
                        onAddAfter={() => handleAddSentence(sentence.id)}
                        onFocus={handleSentenceIdChange}
                    />
                ))}
            </div>
            <div className="mt-4">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => handleAddSentence(null)}
                >
                    + Add Sentence
                </button>
            </div>
        </>
    );
};

export default SentenceList;
