import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initializeTrrack, Registry } from '@trrack/core';
import { Divider, Grid, Paper, Title, Text, useMantineTheme } from '@mantine/core';

import { useStoreSelector } from "../../store/store";
import { StimulusParams, StoredAnswer } from "../../store/types";
import { 
  Paragraph, 
  SelectionListState, 
  SelectionToolParams, 
  TextSelection 
} from "../retro-relevance/retro-types";
import { useParagraphData } from "./ParagraphSelection/useParagraphData";
import MarkdownRenderer from "../retro-relevance/ParagraphSelection/MarkdownRenderer";

// Helper function to convert array of objects to delimited string for answer storage
function makeAnswerStringFromObjKey<T>(array: T[], key: keyof T): string {
  return array.reduce((acc, item) => `${acc}${item[key]}:|:|:`, '').slice(0, -5); // Remove trailing delimiter
}

function PremiseAndParagraph({ 
  parameters,
  setAnswer,
  provenanceState 
}: StimulusParams<SelectionToolParams, SelectionListState>) {
  // Constants
  const TRIAL_NAME = "PremiseAndParagraph_2";
  const KEY_FOR_PARAGRAPH_ID = "firstParagraphId";
  
  // Store access
  const answers = useStoreSelector((state): { [componentName: string]: StoredAnswer } => state.answers);
  const participantId = useStoreSelector((state): string => state.participantId);
  
  // Custom hook for paragraph data
  const {
    loading,
    error,
    initialParagraphs,
    fetchParagraphById,
    fetchExperimentSequence,
  } = useParagraphData();
  
  // Initial values
  const initialParagraphId = 0;
  const initialSelections = [] as TextSelection[];
  
  // Track if we've loaded data from the API
  const [hasLoadedFromApi, setHasLoadedFromApi] = useState(false);
  
  // State management
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(
    provenanceState?.paragraphs?.length ? provenanceState.paragraphs : initialParagraphs
  );
  
  const [focusedParagraphIndex, setFocusedParagraphIndex] = useState<number>(
    provenanceState?.focusedParagraphIndex ?? initialParagraphId
  );
  
  const [selections, setSelections] = useState<TextSelection[]>(
    provenanceState?.selections || initialSelections
  );
  
  // Refs and theme
  const contentRef = useRef<HTMLDivElement | null>(null);
  const theme = useMantineTheme();
  
  // Derived state
  const currentParagraph = paragraphs[focusedParagraphIndex];
  
  const filteredSelections = useMemo(() => {
    if (!selections || !currentParagraph) return [];
    
    // Only show selections that belong to the current paragraph
    return selections.filter(selection => 
      selection.ParentParagraphID === currentParagraph.id
    );
  }, [selections, currentParagraph]);
  
  // Initialize Trrack
  const { actions, trrack } = useMemo(() => {
    const reg = Registry.create();
    
    const clickAction = reg.register(
      'load', 
      (state, payload: { click: boolean; paragraphId: string, someParagraphs: Paragraph[] }) => {
        state.clicked = payload.click;
        state.firstParagraphId = payload.paragraphId;
        state.paragraphSequence = payload.someParagraphs;
        return state;
      }
    );
    
    const trrackInst = initializeTrrack({
      registry: reg,
      initialState: {
        clicked: false,
        firstParagraphId: "null",
        paragraphSequence: []
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
  const makeReactAnswer = useCallback((paragraphId: string | null, paragraphsToStore: Paragraph[] | null) => {
    if (!paragraphId || !paragraphsToStore) return;
    
    console.log("Making React Answer with paragraphId:", paragraphId, "and paragraphs:", paragraphsToStore);
    
    // Apply trrack action
    trrack.apply('load', actions.clickAction({ 
      click: true, 
      paragraphId, 
      someParagraphs: paragraphsToStore 
    }));
    
    // Set the answer
    setAnswer({
      status: true,
      provenanceGraph: trrack.graph.backend,
      answers: {
        clicked: String(true),
        firstParagraphId: paragraphId,
        paragraphSequenceIds: makeAnswerStringFromObjKey(paragraphsToStore, "id"),
        // ["paragraphSequenceSelections"]: makeAnswerStringFromObjKey(someParagraphs, "selections"),
        // ["paragraphSequenceText"]: makeAnswerStringFromObjKey(someParagraphs, "text"),
      },
    });
  }, [actions, setAnswer, trrack]);
  
  // Fetch paragraphs function
  const loadParagraphs = useCallback(async () => {
    console.log("🔄 loadParagraphs called");
    
    // Don't fetch if we already have paragraphs from provenanceState
    if ((provenanceState?.paragraphs ?? []).length > 0) {
      console.log("📦 Using paragraphs from provenanceState:", provenanceState?.paragraphs);
      return provenanceState?.paragraphs || [];
    }
    
    // Get the paragraph ID from previous trial if available
    const previousParagraphId = String(answers[TRIAL_NAME]?.answer[KEY_FOR_PARAGRAPH_ID] || '');
    console.log("🔍 Looking for previousParagraphId:", previousParagraphId);
    
    try {
      let paragraphSequence = [];
      
      if (previousParagraphId === '') {
        console.log("🆕 No previous ID found, fetching experiment sequence");
        paragraphSequence = await fetchExperimentSequence(participantId);
      } else {
        console.log("🔄 Found previous ID, fetching by ID:", previousParagraphId);
        const paragraph = await fetchParagraphById(previousParagraphId);
        if (paragraph) {
          paragraphSequence.push(paragraph);
        }
      }
      
      console.log("📥 Received paragraph sequence:", paragraphSequence);
      
      if (paragraphSequence && paragraphSequence.length > 0) {
        const filteredParagraphs = paragraphSequence.filter((p): p is Paragraph => p !== null);
        console.log("✅ Setting paragraphs with filtered data:", filteredParagraphs);
        setParagraphs(filteredParagraphs);
        setFocusedParagraphIndex(0);
        setHasLoadedFromApi(true);
        return filteredParagraphs;
      }
    } catch (err) {
      console.error("❌ Error loading paragraphs:", err);
      
      // Fallback to the summary if API fails
      if (answers[TRIAL_NAME]?.answer[KEY_FOR_PARAGRAPH_ID]) {
        try {
          console.log("🔄 Attempting fallback with saved ID");
          const lastSeenParagraph = await fetchParagraphById(
            answers[TRIAL_NAME]?.answer[KEY_FOR_PARAGRAPH_ID] as string
          );
          
          if (lastSeenParagraph) {
            console.log("✅ Fallback successful, setting paragraph:", lastSeenParagraph);
            setParagraphs([lastSeenParagraph]);
            setHasLoadedFromApi(true);
            // Don't auto-trigger makeReactAnswer here, let the useEffect handle it
            return [lastSeenParagraph];
          }
        } catch (fallbackError) {
          console.error("❌ Fallback error:", fallbackError);
        }
      }
    }
    return null;
  }, [
    provenanceState?.paragraphs,
    answers, 
    participantId, 
    fetchParagraphById, 
    fetchExperimentSequence
  ]);
  
  // First effect: Handle provenanceState changes
  // This effect should run first and has priority over API fetching
  useEffect(() => {
    console.log("🔄 provenanceState effect running, value:", provenanceState);
    
    if (provenanceState && Object.keys(provenanceState).length > 0) {
      // Check if provenanceState has usable data
      if (provenanceState.paragraphs?.length > 0) {
        console.log("📦 Setting data from provenanceState");
        setSelections(provenanceState.selections || initialSelections);
        setParagraphs(provenanceState.paragraphs);
        setFocusedParagraphIndex(provenanceState.focusedParagraphIndex || initialParagraphId);
        // Mark that we have data to prevent API loading
        setHasLoadedFromApi(true);
      } else {
        console.log("⚠️ provenanceState exists but has no paragraphs");
      }
    }
  }, [provenanceState, initialParagraphs, initialSelections]);
  
  // Second effect: Load from API if needed
  useEffect(() => {
    const shouldLoadFromApi = !hasLoadedFromApi && 
      (!provenanceState || !provenanceState.paragraphs?.length);
    
    console.log("🔄 API effect running, shouldLoadFromApi:", shouldLoadFromApi);
    
    if (shouldLoadFromApi) {
      console.log("🔄 Loading from API");
      loadParagraphs();
    }
  }, [loadParagraphs, hasLoadedFromApi, provenanceState]);
  
  // Third effect: Set paragraph ID after paragraphs state is set
  useEffect(() => {
    console.log("🔄 paragraph update effect running", {
      paragraphsLength: paragraphs.length,
      currentParagraphId: currentParagraph?.id,
      hasLoadedFromApi
    });
    
    if (paragraphs.length > 0 && currentParagraph?.id && hasLoadedFromApi) {
      // Only update if we haven't already set this paragraph ID
      const currentSavedId = answers[TRIAL_NAME]?.answer[KEY_FOR_PARAGRAPH_ID];
      console.log("🔄 Checking if answer needs update", {
        currentSavedId,
        newId: currentParagraph.id,
        needsUpdate: currentSavedId !== currentParagraph.id
      });
      
      if (currentSavedId !== currentParagraph.id) {
        console.log("💾 Updating answer with paragraph ID:", currentParagraph.id);
        makeReactAnswer(currentParagraph.id, paragraphs);
      }
    }
  }, [paragraphs, currentParagraph, answers, makeReactAnswer, hasLoadedFromApi]);
  
  // Render error state
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
  
  // Render loading state
  if (loading && paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading paragraphs...
      </div>
    );
  }
  
  // Render empty state
  if (!loading && paragraphs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No paragraphs available
      </div>
    );
  }
  
  return (
    <div>
      <h1>Case Handoff</h1>
      <p>
        You're joining a murder investigation. A previous analyst wrote a short summary of their investigation.
      </p>
      <p>
        Your job: <strong>Plan your follow-up investigation</strong>.
      </p>
      <Text mt={2} className="mt-3 text-blue-600 italic">
        Based on the <strong>Prior Analyst Summary</strong> below, please list at least <strong>3 people, places, things, or activities</strong> that you want to explore during your investigation.
        Write this list in the <strong>sidebar</strong> on the left.<br />
        {/* Go with your gut, your plan can change later once you start looking at evidence.<br/>  */}
      </Text>
      
      <Grid gutter="xs">
        {/* Premise Section */}
        <Grid.Col span={{ base: 12, md: 4 }}>

        <Paper shadow="sm" p="md" withBorder>
          <Text size="sm" style={{color: "gray"}} mt="sm" mb="sm">
            This is the case overview the prior analyst began with:
          </Text>
          
          <Title order={3}>Context</Title>
          <Text mt="sm">
            Walter Boddy has been murdered at his estate. The police have named 
            Mr. <strong>HENRY WADSWORTH</strong> as the primary suspect.
          </Text>
          <Text mt="sm">
            Mr. <strong>WADSWORTH</strong> claims he did not do it and wants your help 
            to solve the mystery and clear his name.
          </Text>
          <Text mt="sm">
            You have asked a field reporter, Mr. <strong>HANS BRAUMAN</strong>, to collect 
            evidence and track down the truth.
          </Text>
          <Text mt="sm">
            Your goal is to use the <strong>prior analyst's summary</strong> and the set 
            of documents to identify:
          </Text>
          
          <ul>
            <li><strong>Who</strong> committed the murder,</li>
            <li><strong>What</strong> weapon was used, and</li>
            <li><strong>Where</strong> it occurred at the Boddy Estate.</li>
          </ul>    
          <Divider pb={"lg"} />
          <Title order={3}>A note about the truth</Title>
          <Text mt="sm">
            Only those involved in the murder may knowingly lie, while anyone might
            accidentally provide false information.
          </Text>
          {/* <Text style={{color: "gray"}} mt="sm" mb="sm">Please read the prior analyst's summary too!</Text> */}
        </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>

        {/* Analyst Summary Section */}
        <Paper shadow="sm" p="md" withBorder>
          <Text size="sm" style={{ color: "gray" }} mt="sm" mb="sm">
            After spending 15 minutes looking at evidence, heres what your teammate prepared for you:
          </Text>
          
          <Title order={3}>Prior Analyst Summary</Title>
          
          {loading && !currentParagraph && (
            <Text style={{ textAlign: "center", color: "gray" }} py="md">
              Loading Analyst summary...
            </Text>
          )}
          
          {currentParagraph && (
            <div
            ref={contentRef}
            data-paragraph-id={currentParagraph.id}
            className="relative"
            >
              <MarkdownRenderer
                markdownText={currentParagraph.text}
                selections={filteredSelections}
                onTextSelection={() => {}} // No-op function
                onSelectionClick={() => {}} // No-op function
                dataParagraphId={currentParagraph.id}
                className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto"
                aria-label="Paragraph content with selectable text"
                />
            </div>
          )}
        </Paper>
          </Grid.Col>
      </Grid>
      
      <Text mt="sm" mb="md" style={{textAlign: "center", color:"gray"}}>
        <em>A copy of this context and summary will be available in the investigative tool.</em>
      </Text>
    </div>
  );
}

export default PremiseAndParagraph;
