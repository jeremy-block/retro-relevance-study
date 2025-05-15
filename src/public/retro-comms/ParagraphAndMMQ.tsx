import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoreSelector } from "../../store/store";
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams, StoredAnswer } from "../../store/types";
import { useMantineTheme, SimpleGrid, Paper, Title, Text } from '@mantine/core';
import { Paragraph, SelectionListState, SelectionToolParams, TextSelection } from "../retro-relevance/retro-types";
import { useParagraphData } from "./ParagraphSelection/useParagraphData";
import MarkdownRenderer from "../retro-relevance/ParagraphSelection/MarkdownRenderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ParagraphAndMMQ({ parameters,
    setAnswer,
    provenanceState }: StimulusParams<SelectionToolParams, SelectionListState>) {

    // Get previous stimulus data if needed
    const trialNameToPullResponseFrom = "ParagraphAndMMQ_0";
    const keyForSummary = "firstParagraphId";

    // Use our paragraph data hook
    const {
        loading,
        error,
        initialParagraphs,
        fetchParagraphById,
        fetchExperimentSequence,
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
    const participant_id = useStoreSelector((state): string => state.participantId)

    const contentRef = useRef<HTMLDivElement | null>(null);
    const theme = useMantineTheme();

    // Fetch paragraphs when component loads
    const loadParagraphs = async () => {
        // Get the paragraph ID from previous trial if available
        //todo check if we are getting a single paragraph or a whole sequence in the answer. I would rather just define the sequence on this page if we can.
        const previousParagraphId = String(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] || '');
        console.log("🚀 ~ participant_id:", participant_id)

        try {
            let startingParagraphSequence = [];
            if (previousParagraphId == '') {
                console.log("🚀 ~ loadParagraphs ~ previousParagraphId: NO Previous ID:", previousParagraphId)

                console.log("getting a new Paragraph");
                startingParagraphSequence = await fetchExperimentSequence(participant_id)
                console.log("Got a new Paragraph sequence", startingParagraphSequence);
            } else {
                let something = await fetchParagraphById(previousParagraphId)
                startingParagraphSequence.push(something)
            }
            console.log("🚀 ~ loadParagraphs ~ previousParagraphId:", previousParagraphId)
            console.log("🚀 ~ loadParagraph ~ startingParagraphSequence:", startingParagraphSequence)
            if (startingParagraphSequence && startingParagraphSequence.length > 0) {
                const filterdParagraphs = startingParagraphSequence.filter((p): p is Paragraph => p !== null)
                setParagraphs(filterdParagraphs);
                setfocusedParagraphIndex(0); // Set to the first paragraph by default
                return filterdParagraphs;
            }
        } catch (err) {
            console.error("Error loading paragraphs:", err);

            // Fallback to the summary if API fails
            if (answers[trialNameToPullResponseFrom]?.answer[keyForSummary]) {
                const lastSeenParagraph = await fetchParagraphById(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] as string);
                if (lastSeenParagraph) {
                    setParagraphs([lastSeenParagraph]);

                    // Auto-trigger the setParagraphId for fallback
                    setParagraphId(lastSeenParagraph.id);
                }
            }
        }
        return null;
    };
    // Add a separate useEffect for setting the paragraph ID after paragraphs state is set
    useEffect(() => {
        if (paragraphs.length > 0 && currentParagraph?.id) {
            // Only update if we haven't already set this paragraph ID
            const currentSavedId = answers[trialNameToPullResponseFrom]?.answer[keyForSummary];
            if (currentSavedId !== currentParagraph.id) {
                setParagraphId(currentParagraph.id);
            }
        }
    }, [paragraphs, currentParagraph]);
    // Fetch paragraph sequence when component loads
    useEffect(() => {
        loadParagraphs();
    }, [participant_id, fetchParagraphById, fetchExperimentSequence]);

    // const prop1Ref = useRef(provenanceState);
    // const prop2Ref = useRef(initialParagraphs);
    // console.log('prop1:', provenanceState, 'prevProp1:', prop1Ref.current, 'didChange: ', provenanceState !== prop1Ref.current);
    // console.log('prop2:', initialParagraphs, 'prevProp2:', prop2Ref.current, 'didChange: ', initialParagraphs !== prop2Ref.current);
    // useEffect(() => {
    //     console.log('Effect triggered');
    // }, [provenanceState, initialParagraphs]);
    // prop1Ref.current = provenanceState;
    // prop2Ref.current = initialParagraphs;

    // Sync with provenance state when it changes
    useEffect(() => {
        console.log("🧠🧠 ~ useEffect ~ provenanceState:", provenanceState)
        if (provenanceState) {
            const selections = provenanceState?.selections || initialSelections;
            const paragraphs = provenanceState?.paragraphs || initialParagraphs;
            const focusedIndex = provenanceState?.focusedParagraphIndex || initialParagraphId;
            // console.log("🚀 ~ useEffect ~ selections:", selections)
            // console.log("🚀 ~ useEffect ~ paragraphs:", paragraphs)
            // console.log("🚀 ~ useEffect ~ focusedInd:", focusedIndex)

            setSelections(selections);
            setParagraphs(paragraphs);
            setfocusedParagraphIndex(focusedIndex);
        }
    }, [provenanceState, initialParagraphs]);

    const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);
    // useEffect(() => {
    //     console.log("🚀 ~ Current answers state:", answers);
    // }, [answers]);
    const { actions, trrack } = useMemo(() => {
        const reg = Registry.create();

        const clickAction = reg.register('click', (state, payload: { click: boolean; paragraphId: string }) => {
            console.log("clicking", payload)
            state.clicked = payload.click;
            state.firstParagraphId = payload.paragraphId;
            return state;
        });

        const trrackInst = initializeTrrack({
            registry: reg,
            initialState: {
                clicked: false,
                firstParagraphId: "null"
            },
        });

        return {
            actions: {
                clickAction,
            },
            trrack: trrackInst,
        };
    }, []);

    // Function to set paragraph ID and update the answer
    const setParagraphId = useCallback((paragraphID: string | null) => {
        console.log("🚀 ~ setParagraphId ~ Attempting to setParagraphId to:", paragraphID)
        if (!paragraphID) return; // Don't proceed if no ID
        console.log("🚀 ~ setParagraphId ~ paragraphID:", paragraphID);

        // Apply trrack action
        trrack.apply('Clicked', actions.clickAction({ click: true, paragraphId: paragraphID }));

        // Set the answer
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
                ["clicked"]: String(true),
                ["firstParagraphId"]: paragraphID,
            },
        });
    }, [actions, setAnswer, trrack]);

    // Error state
    if (error && paragraphs.length === 0) {
        return (
            <div className="text-center py-10 text-red-500">
                Error loading paragraphs: {error}
                <button
                    onClick={() => loadParagraphs()}
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
            <h1>Case Handoff</h1>
            <p>You're collaborating with another analyst on a murder investigation.
                Please take <strong>
                a few minutes
                </strong> to review the following and <strong>plan your investigation</strong>.
            </p>
            <Text mt={2} className="mt-3 text-blue-600 italic">
                Based on the <strong>Premise</strong> and <strong>Summary</strong> below, write at least three specific people, places, things, or activities that you want to explore in the <strong>sidebar</strong> on the left. <br />
                Remember, your goal is to work with the prior participant's note to figure out <em>Who</em> committed the murder, <em>What</em> weapon was used, and <em>Where</em> it happened.
            </Text>
            <SimpleGrid
            cols={{ base: 1, md: 2 }}
            spacing="lg"
            >
                <Paper shadow="sm" p="md" withBorder>
                    <Text size="sm" style={{color: "gray"}} mt="sm" mb="sm">Here's the case overview the prior participant began with:</Text>
                    <Title order={3}>Premise</Title>
                    <Text mt="sm">Walter Boddy has been murdered at his estate. The police have named Mr. <strong>HENRY WADSWORTH</strong> as the primary suspect.</Text>
                    <Text mt="sm">Mr. <strong>WADSWORTH</strong> claims he did not do it and wants your help to solve the mystery and clear his name.</Text>
                    <Text mt="sm">You have asked a field reporter, Mr. <strong>HANS BRAUMAN</strong>, to collect evidence and track down the truth.</Text>
                    <Text mt="sm">Your goal is to use the <strong>notes from the prior analyst</strong> and the set of documents to identify:</Text>
                    <ul>
                        <li><strong>Who</strong> committed the murder,</li>
                        <li><strong>What</strong> weapon was used, and</li>
                        <li><strong>Where</strong> it occurred at the Boddy Estate.</li>
                    </ul>    
                    <hr/>
                    <Title order={3}>A note about the truth</Title>
                    <Text mt="sm">Only those involved in the murder may knowingly lie, while anyone might unknowingly provide false information.</Text>

                    <Text mt="sm">For example, if a John Doe is guilty of murder and says he never saw the victim that night, he is knowingly lying
                        (<strong>1st Degree lie</strong>).</Text>

                    <Text mt="sm">Now, if Jane Doe, who is innocent, says the victim left at 8 PM, but the victim actually left at 7 PM,
                        that's unknowingly providing false information because she wasn't there to see them leave
                        (<strong>2nd Degree lie</strong>).</Text>

                    <Text mt="sm">Only those directly involved with the murder will tell <strong>1st degree lies</strong>. Everyone else could provide
                        false information though.</Text>
                </Paper>
            
                {/* Paragraph Display*/}
                <Paper shadow="sm" p="md" withBorder>
                    {/* Selection Interface with Markdown Renderer */}
                    <Text size="sm" style={{ color: "gray" }} mt="sm" mb="sm">
                    After the prior analyst spent 15 minutes looking at evidence, they prepared the following summary of their work for you to use before beginning your investigation. What follows should be helpful.</Text>
                <Title order={3}>Prior Analyst Summary</Title>

                {loading && paragraphs.length === 0 && (
                        <Text style={{ textAlign: "center", color: "gray" }} py="md">
                            Loading Analyst notes...
                        </Text>
                )}
                {currentParagraph && (
                    <div
                        ref={contentRef}
                        data-paragraph-id={currentParagraph.id}
                            className="relative">
                        <MarkdownRenderer
                            markdownText={currentParagraph.text}
                            selections={filteredSelections}
                            onTextSelection={() => { return }}
                            onSelectionClick={() => { return }}
                            dataParagraphId={currentParagraph.id}
                            className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto"
                            aria-label="Paragraph content with selectable text"
                        />
                    </div>
                )}
                </Paper>
            </SimpleGrid>
            <Text mt={"sm"} style={{textAlign: "center", color:"gray"}}><em>A copy of this premise and summary will be available in the interface.</em></Text>
            <p className="mt-4">On the next page we will introduce to the investigation tool and the evidence.</p>
        </div>
    );
}

export default ParagraphAndMMQ;
