import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoreSelector } from "../../store/store";
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams, StoredAnswer } from "../../store/types";
import { Button, useMantineTheme } from "@mantine/core";
import { Paragraph, SelectionListState, SelectionToolParams, TextSelection } from "../retro-relevance/retro-types";
import { useParagraphData } from "./ParagraphSelection/useParagraphData";
import MarkdownRenderer from "../retro-relevance/ParagraphSelection/MarkdownRenderer";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SendToSensemakingTask({ parameters,
    setAnswer,
    provenanceState }: StimulusParams<SelectionToolParams, SelectionListState>) {

    // Get previous stimulus data if needed
    const trialNameToPullResponseFrom = "sendToSensemakingTask_0";
    const keyForSummary = "firstParagraphId";
    // const keyForID = "participantAssignedID";


    // Use our paragraph data hook
    const {
        loading,
        error,
        initialParagraphs,
        fetchParagraphsByType,
        fetchParagraphById,
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

    // Fetch paragraphs when component loads

    const loadParagraphs = async () => {
        // If parameters include a testingStimulusValue, use that instead of fetching
        // if (parameters.testingStimulusValue) {
        //   setParagraphs(parameters.testingStimulusValue as Paragraph[]);
        //   return;
        // }

        // Get the paragraph ID from previous trial if available
        const previousParagraphId = String(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] || '');

        try {
            let startingParagraph = [];
            if (previousParagraphId == '') {
            console.log("🚀 ~ loadParagraphs ~ previousParagraphId: NO Previous ID:", previousParagraphId)

                const coinFlip = Math.random()
                if (coinFlip > 0.5) {
                    console.log("getting a new NARRATIVE Paragraph")
                    startingParagraph = await fetchParagraphsByType("narrative", 1)
                    console.log("🚀 ~ loadParagraphs ~ startingParagraph:", startingParagraph)
                } else {
                    console.log("getting a new LIST Paragraph")
                    startingParagraph = await fetchParagraphsByType("list", 1)
                    console.log("🚀 ~ loadParagraphs ~ startingParagraph:", startingParagraph)
                }
            } else {
                let something = await fetchParagraphById(previousParagraphId)
                startingParagraph.push(something)
            }
            console.log("🚀 ~ loadParagraphs ~ previousParagraphId:", previousParagraphId)
            console.log("🚀 ~ loadParagraph ~ startingParagraph:", startingParagraph)
            if (startingParagraph && startingParagraph.length > 0) {
                setParagraphs(startingParagraph.filter((p): p is Paragraph => p !== null));
                setfocusedParagraphIndex(0); // Set to the first paragraph by default
            }
            return startingParagraph;
        } catch (err) {
            console.error("Error loading paragraphs:", err);

            // Fallback to the summary if API fails
            if (answers[trialNameToPullResponseFrom]?.answer[keyForSummary]) {
                const lastSeenParagraph = await fetchParagraphById(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] as string);
                if (lastSeenParagraph) {
                    setParagraphs([lastSeenParagraph]);
                }
                //     {
                //     text: String(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] || ''),
                //     id: String(answers[trialNameToPullResponseFrom]?.answer[keyForSummary] || 'default-id'),
                //     selections: []
                // }]);
            }
        }
    };

    // Fetch paragraph sequence when component loads
    useEffect(() => {
        loadParagraphs();
    }, [parameters.testingStimulusValue, fetchParagraphsByType, fetchParagraphById]);

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

    const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);
    console.log("🚀 ~ test ~ answers:", answers)


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

    const clickCallback = useCallback((paragraphID: string | null) => {
        
        
        console.log("🚀 ~ clickCallback ~ paragraphID:", paragraphID)
        if (paragraphID) {
            window.open(`https://indie.cise.ufl.edu/MaverickMystery/?=5&p=${paragraphID}`, "_blank");
        } else {
            window.open(`https://indie.cise.ufl.edu/MaverickMystery/?=5`, "_blank");
        }
    
        trrack.apply('Clicked', actions.clickAction({ click: true, paragraphId: paragraphID ?? '' }));

        
        console.log(typeof(paragraphID ?? "null"))
    
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
              ["clicked"]: String(true),
              ["firstParagraphId"]: paragraphID ?? "null",
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
            {loading && paragraphs.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    Loading Analyst notes...
                </div>
            )}
            {}
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
                            onTextSelection={() => { return }}
                            onSelectionClick={() => { return }}
                            dataParagraphId={currentParagraph.id}
                            className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto"
                            aria-label="Paragraph content with selectable text"
                        />
                    </div>
                )}
            </div>
            <h1>Task</h1>
            <p>Using the tool you just learned about, here is the premise for your investigation.</p>

            <p><em>Please read the following aloud.</em></p>

            <h2>Premise</h2>
            <p>Walter Boddy has been murdered at his estate. The police have named Mr. <strong>HENRY WADSWORTH</strong> as the primary suspect.</p>
            <p>Mr. <strong>WADSWORTH</strong> claims he did not do it and wants your help to solve the mystery and clear his name.</p>
            <p>You have asked a field reporter, Mr. <strong>HANS BRAUMAN</strong>, to collect evidence and track down the truth.</p>
            <p>Your goal is to use the documents to identify:</p>
            <ul>
                <li><strong>Who</strong> committed the murder,</li>
                <li><strong>What</strong> weapon was used, and</li>
                <li><strong>Where</strong> it occurred at the Boddy Estate.</li>
            </ul>
            <p><em>A copy of this premise will be available in the interface.</em></p>

            <h2>Timing and Tools</h2>
            <p>You only have <strong>15 minutes</strong> to look at evidence.</p>
            <p><em>Be mindful about what you focus on.</em> You will <strong>not have enough time</strong> to read all the documents.</p>

            <p>Right click to access the:</p>
            <ol>
                <li>📝 <strong>Note tool</strong> to write down anything of interest,</li>
                <li>🖊️ <strong>Highlight tool</strong> to mark interesting content in <span style={{ backgroundColor: "#77F7A4" }}>Green</span>, and</li>
                <li>🔎 <strong>Search tool</strong> to find documents (matching content will be in <span style={{ backgroundColor: "#ffea57" }}>Yellow</span>).</li>
            </ol>

            <h3>A note about the truth</h3>
            <p>Only those involved in the murder may knowingly lie, while anyone might unknowingly provide false information.</p>

            <p>For example, if a John Doe is guilty of murder and says he never saw the victim that night, he is knowingly lying
                (<strong>1st Degree lie</strong>).</p>

            <p>Now, if Jane Doe, who is innocent, says the victim left at 8 PM, but the victim actually left at 7 PM,
                that's unknowingly providing false information because she wasn't there to see them leave
                (<strong>2nd Degree lie</strong>).</p>

            <p>Only those directly involved with the murder will tell <strong>1st degree lies</strong>. Everyone else could provide
                false information though.</p>

            <h3>Are you ready to begin?</h3>
            <Button
                variant="outline"
                color="green"
                onClick={() => {
                    if (currentParagraph?.id) {
                        clickCallback(currentParagraph.id); //use a click callback to trigger the setAnswer function and allow the user to continue after opening the document explorer.
                    } else {
                        console.error("Error: currentParagraph.id is null");
                        clickCallback(null)
                    }
                }}
            >
                Open Document Explorer
            </Button>
            <p>After this task, your interactions will be used to generate a summary of your investigation.</p>
        </div>
    );
}

export default SendToSensemakingTask;
