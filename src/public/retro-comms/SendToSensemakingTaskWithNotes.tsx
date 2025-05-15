import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoreSelector } from "../../store/store";
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams, StoredAnswer, StoreState } from "../../store/types";
import { Button, useMantineTheme } from "@mantine/core";
import { Paragraph, SelectionListState, SelectionToolParams, TextSelection } from "../retro-relevance/retro-types";
import { useParagraphData } from "./ParagraphSelection/useParagraphData";
import MarkdownRenderer from "../retro-relevance/ParagraphSelection/MarkdownRenderer";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SendToSensemakingTask({
    setAnswer,
    provenanceState }: StimulusParams<SelectionToolParams, SelectionListState>) {

    // Get previous stimulus data if needed
    const trialNameToPullResponseFrom = "ParagraphAndMMQ_0";
    const keyForSummary = "firstParagraphId";
    // const keyForID = "participantAssignedID";


    // Use our paragraph data hook
    const {
        initialParagraphs,
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

    const contentRef = useRef<HTMLDivElement | null>(null);
    const theme = useMantineTheme();


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
    const participant_id = useStoreSelector((state): string => state.participantId)
    console.log("🚀 ~ participant_id:", participant_id)

    const { actions, trrack } = useMemo(() => {
        const reg = Registry.create();

        const clickAction = reg.register('click', (state, payload: { click: boolean; paragraphParam: string }) => {
            console.log("clicking", payload)
            state.clicked = payload.click;
            state.firstParagraphId = payload.paragraphParam;
            return state;
        });

        const trrackInst = initializeTrrack({
            registry: reg,
            initialState: {
                clicked: false,
                paragraphParam: "null"
            },
        });

        return {
            actions: {
                clickAction,
            },
            trrack: trrackInst,
        };
    }, []);

    const clickCallback = useCallback((paragraphParam: string | null) => {
        
        
        console.log("🚀 ~ clickCallback ~ paragraphID:", paragraphParam)
        const prior_answer = answers[trialNameToPullResponseFrom]?.answer

        const curriosities = {
            "c1": (prior_answer["Curiosity_1"] || ""),
            "c2": (prior_answer["Curiosity_2"] || ""),
            "c3": (prior_answer["Curiosity_3"] || "")
        }
        //todo set up the maveric tool to handle the curiosities and adding them to the personal notebook... I wonder if I need ot get this into a post request insteaed of direct in the url.
        //todo I set this to the userID and now need to adjust maveric to handle userID instead of a specific identifier
        if (paragraphParam) {
            const queryParams = new URLSearchParams({
                p: paragraphParam || "",
                c: JSON.stringify(curriosities),
                t: String(5000)
            }).toString();
            window.open(`https://indie.cise.ufl.edu/MaverickMystery/?=5&${queryParams}`, "_blank");
        } else {
            window.open(`https://indie.cise.ufl.edu/MaverickMystery/?=5`, "_blank");
        }
    
        trrack.apply('Clicked', actions.clickAction({ click: true, paragraphParam: paragraphParam ?? '' }));

        
        // console.log(typeof(paragraphParam ?? "null"))
    
        setAnswer({
            status: true,
            provenanceGraph: trrack.graph.backend,
            answers: {
              ["clicked"]: String(true),
          },
        });
    }, [actions, setAnswer, trrack]);

    return (
        <div>
            <h1>Task</h1>
            {participant_id}
            <p>Using the tool you just learned about, You will try to finish the investigation (i.e., <strong>Who</strong> committed the murder, <strong>What</strong> weapon was used, and <strong>Where</strong> it occurred at the Boddy Estate).</p>
            <p><em>The original <strong>premise</strong> and your collaborator's <strong>summary</strong> will be available in the tool as documents.</em></p>

            <h2>Timing and Tools</h2>
            <p>You only have <strong>7 minutes</strong> to look at evidence.</p>
            <p><em>Be mindful about what you focus on.</em> You will <strong>not have enough time</strong> to read all the documents. <em>Stick to your <strong>plan</strong>.</em></p>

            <p>Right click to access the:</p>
            <ol>
                <li>📝 <strong>Note tool</strong> to write down anything of interest,</li>
                <li>🖊️ <strong>Highlight tool</strong> to mark interesting content in <span style={{ backgroundColor: "#77F7A4" }}>Green</span>, and</li>
                <li>🔎 <strong>Search tool</strong> to find documents (matching content will be in <span style={{ backgroundColor: "#ffea57" }}>Yellow</span>).</li>
            </ol>

<hr/>
            <h3>Your Plan</h3><p>As a reminder the plan you made earlier is to look into:</p>
            <ol>
                <li>
                    <strong>
                        {answers[trialNameToPullResponseFrom]?.answer["Curiosity_1"] || "No curiostity provided"}
                    </strong>
                    </li>
                <li>
                    <strong>
                        {answers[trialNameToPullResponseFrom]?.answer["Curiosity_2"] || "No curiostity provided"}
                    </strong>
                    </li>
                <li>
                    <strong>
                        {answers[trialNameToPullResponseFrom]?.answer["Curiosity_3"] || "No curiostity provided"}
                    </strong> (if time allows)
                    </li>
            </ol>


            <h3>Are you ready to begin?</h3>
            <Button
                variant="outline"
                color="green"
                onClick={() => {
                    if (participant_id != "") {
                        clickCallback(participant_id); //use a click callback to trigger the setAnswer function and allow the user to continue after opening the document explorer.
                    } else {
                        console.error("Error: participantId is not defined in state.");
                        clickCallback(null)
                    }
                }}
            >
                Open Document Explorer
            </Button>
        </div>
    );
}

export default SendToSensemakingTask;
