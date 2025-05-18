import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStoreSelector } from "../../store/store";
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams, StoredAnswer, StoreState } from "../../store/types";
import { Alert, Button, Divider, Group, Notification, Paper, SimpleGrid, Text, useMantineTheme } from "@mantine/core";
import { Paragraph, SelectionListState, SelectionToolParams, TextSelection } from "../retro-relevance/retro-types";
import { useParagraphData } from "./ParagraphSelection/useParagraphData";
import MarkdownRenderer from "../retro-relevance/ParagraphSelection/MarkdownRenderer";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SendToSensemakingTask({
    setAnswer,
    provenanceState }: StimulusParams<SelectionToolParams, SelectionListState>) {

    // Get previous stimulus data if needed
    const trialNameToPullResponseFrom = "PremiseAndParagraph_2";
    // const keyForSummary = "firstParagraphId";
    // const keyForID = "participantAssignedID";
    const minutes = 10; //How long will the user have to look at evidence?


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
        if (paragraphParam) {
            const queryParams = new URLSearchParams({
                p: paragraphParam || "",
                c: JSON.stringify(curriosities),
                t: String(minutes * 60 * 1000), // 15 minutes in milliseconds
            }).toString();
            window.open(`https://indie.cise.ufl.edu/MaverickMystery/?=5&${queryParams}`, "_blank");
        } else {
            window.open(`https://indie.cise.ufl.edu/MaverickMystery/?=5`, "_blank");
        }

        trrack.apply('Clicked', actions.clickAction({ click: true, paragraphParam: paragraphParam ?? '' }));


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
            <p>Using the tool you just learned about, on the next page, you will try to finish the investigation.</p>
            <Notification withCloseButton={false} style={{ "maxWidth": "700px" }} withBorder color="lime" radius="md">
                <em style={{ color: "gray" }}>The original <strong>context</strong> and your collaborator's <strong>summary</strong> will be available in the tool as documents.</em>
            </Notification>

            <Divider my="md" />

            <Alert variant="outline" color="blue" title="Timing and Tools" style={{
                justifySelf: "center",
            }}>
                <Text>You only have <strong>{minutes} minutes</strong> to look at evidence. ⏰ A timer will start when you open your first document, it will appear occasionally in the bottom right.</Text>
                <Text>You will <strong>not have enough time</strong> to read all the documents. <em>Stick to <strong>your plan</strong>.</em></Text>

                <Text>Right click to:</Text>
                <ol>
                    <li>📝 <strong>Note</strong> anything of interest,</li>
                    <li>🖊️ <strong>Highlight</strong> interesting text in <span style={{ backgroundColor: "#77F7A4" }}>Green</span>, and</li>
                    <li>🔎 <strong>Search</strong> to find documents (matches will be <span style={{ backgroundColor: "#ffea57" }}>Yellow</span>).</li>
                </ol>
            </Alert>
            <Divider my="md" />
            <SimpleGrid cols={2} spacing="xs" >


                <Alert variant="light" color="blue" title="Investigative goal" style={{ maxWidth: 600 }}>
                    Remember, your goal is to determine: <br /><Text span fw={700} >Who</Text> committed the murder, <br /><Text span fw={700} >What</Text> weapon was used, and <br /><Text span fw={700} >Where</Text> it occurred at the Boddy Estate.
                </Alert>
                <Alert variant="light" color="yellow" title="Your Plan">
                    <Text>Earlier, you made a plan to look into:</Text>

                    <Group
                        gap="xs"
                        justify="center"
                        mb="sm"
                        style={{
                            display: "flex",
                            // flexDirection: "column",
                            alignItems: "flex-start",
                        }}>
                        <Paper shadow="md" withBorder p="sm">
                            <Text fw={700} >
                                1. {answers[trialNameToPullResponseFrom]?.answer["Curiosity_1"] || "No curiostity provided"}
                            </Text>
                        </Paper>
                        <Paper shadow="md" withBorder p="sm">
                            <Text fw={700} >
                                2. {answers[trialNameToPullResponseFrom]?.answer["Curiosity_2"] || "No curiostity provided"}
                            </Text>
                        </Paper>
                        <Paper shadow="md" withBorder p="sm">
                            <Text span fw={700} >
                                3. {answers[trialNameToPullResponseFrom]?.answer["Curiosity_3"] || "No curiostity provided"}
                            </Text> 
                            <Text span fs="italic"> (if time allows)</Text>

                        </Paper>
                    </Group>
                </Alert>
            </SimpleGrid>

            <Alert variant="transparent" color="green" mt="xl" title="Are you ready to begin?" style={{
                justifySelf: "center",
            }}>
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
            </Alert>
        </div>
    );
}

export default SendToSensemakingTask;
