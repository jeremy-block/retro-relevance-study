// src/components/TextEditor/SentenceList.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import SentenceItem from './SentenceItem';
import { Sentence, SentenceListParams, SentenceListState } from './retro-types';
import { splitIntoSentences, splitIntoSentencesAndMetadata, splitIntoSentencesOld } from './utils/markdownUtils';
import { useStoreSelector } from '../../store/store';
import { StimulusParams, StoredAnswer } from '../../store/types';


//todo set isTesting to false once ready for participants.
const isTesting = false;

export function SentenceList({
    parameters,
    setAnswer,
    provenanceState,
    updateState = () => null,
}: StimulusParams<SentenceListParams, { all: SentenceListState }> & { updateState: (a: SentenceListState) => void }) {


    // console.log("🚀 ~ initialSentences=splitIntoSentencesOld ~ initialSentences:", initialSentences)
    // console.log("🚀 ~ provenanceState:", provenanceState)

    // set up a way to pull data from a Previous Stimuli
    const trialNameToPullResponseFrom = "AdminStart_0"
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

    const [localState, setLocalState] = useState<SentenceListState>(provenanceState ? (provenanceState.all) : {
        sentences: initialSentences,
        focusedSentenceId: initialFocus,
    });


    // Local state that will be applied to Trrack
    // // Sync local state with provenance state when it changes
    // useEffect(() => {
    //     if (provenanceState) {
    //         setSentences(provenanceState.all.sentences);
    //         setFocusedSentenceId(provenanceState.all.focusedSentenceId);
    //     }
    // }, [provenanceState]);

    useEffect(() => {
        console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)
        if (provenanceState) {
            console.log("🚀 ~ useEffect ~ provenanceState Exists!:", provenanceState)
            // setSentences(provenanceState.all.sentences);
            // setFocusedSentenceId(provenanceState.all.focusedSentenceId);
            setLocalState(provenanceState.all || provenanceState);
        } else {
            console.log("🚀 ~ useEffect ~ provenanceState NOPE NOPE NOPE Need to make my own!:")
            // setSentences(initialSentences);
            // setFocusedSentenceId(initialFocus)
            setLocalState({ sentences: initialSentences, focusedSentenceId: initialFocus })
        }
    }, [provenanceState]);

 

    const [sentences, setSentences] = useState<Sentence[]>(
        provenanceState?.all.sentences || initialSentences
    );

    const [focusedSentenceId, setFocusedSentenceId] = useState<string | null>(
        provenanceState?.all.focusedSentenceId || null
    );



    // Initialize Trrack
    const { actions, trrack } = useMemo(() => {
        const reg = Registry.create();

        const updateSentenceAction = reg.register('updateSentence', (state, payload: SentenceListState) => {
            console.log("🚀 ~ updateSentenceAction ~ payload:", payload)
            console.log("🚀 ~ updateSentenceAction ~ state:", state.all.sentences)
            state.all = { payload };
            console.log("🚀 ~ updateSentenceAction ~ state.all:", state.all)
            return state;
        });
        const removeSentenceAction = reg.register('removeSentenceAction', (state, payload: SentenceListState) => {
            state.all = { payload };
            return state
        });
        const addSentenceAction = reg.register('addSentenceAction', (state, payload: SentenceListState) => {
            state.all = { payload };
            return state
        });
        const setFocusedSentenceAction = reg.register('setFocusedSentenceAction', (state, payload: SentenceListState) => {
            state.all = { payload };
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
                removeSentence: removeSentenceAction,
                addSentence: addSentenceAction,
                setFocusedSentence: setFocusedSentenceAction
            },
            trrack: trrackInst
        };
    }, []);

    // Handle sentence text change
    const handleSentenceChange = useCallback((id: string, newText: string, oldText: string) => {
        const updatedSentences = localState.sentences.map((sentence: Sentence) => {
            return sentence.id === id ? { ...sentence, text: newText } : sentence;
        });
        console.log("🚀 ~ updatedSentences ~ localState:", localState)
        console.log("🚀 ~ handleSentenceChange ~ updatedSentences:", updatedSentences)

        setSentences(updatedSentences);
        setFocusedSentenceId(null);

        const newState = {
            ...localState,
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
    }, [sentences, trrack, actions, updateState, setAnswer, isTesting]);

    // Handle sentence removal
    const handleSentenceRemove = useCallback((id: string, text: string, reason: string) => {
        console.log("🚀 ~ removeSentenceAction ~ state:", { ...localState })

        //todo add in some way to capture reason.

        const updatedSentences = localState.sentences.filter((sentence: Sentence) =>
            sentence.id !== id
        );

        const newState = {
            ...localState,
            sentences: updatedSentences
        }

        setSentences(updatedSentences);

        // Apply the change to Trrack
        trrack.apply('Remove Sentence', actions.removeSentence(newState));

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
        return localState
    }, [sentences, focusedSentenceId, trrack, actions, updateState, setAnswer, isTesting]);

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
            someSentences = [...localState.sentences, newSentence];
        } else {
            someSentences = [];
            let added = false;

            for (const sentence of localState.sentences) {
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
            ...localState,
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
                ["updatedSummary"]: joinTextOfObjects(localState.sentences)
            }
        });
        return localState;
    }, [sentences, trrack, actions, updateState, setAnswer, isTesting]);

    const handleSentenceIdChange = useCallback((newFocus: string | null) => {
        console.log("Previous Focus:", localState.focusedSentenceId, "New Focus:", newFocus);

        // Update local state
        setFocusedSentenceId(newFocus);

        const newState = {
            ...localState,
            // sentences: updatedSentences,
            focusedSentenceId: newFocus
        };
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

