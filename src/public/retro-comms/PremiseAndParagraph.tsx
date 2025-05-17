import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { initializeTrrack, Registry } from '@trrack/core';
import { useMantineTheme, SimpleGrid, Paper, Title, Text } from '@mantine/core';

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
        You're collaborating with another analyst on a murder investigation.
        Please take <strong>a few minutes</strong> to review the following and <strong>plan your investigation</strong>.
      </p>
      
      <Text mt={2} className="mt-3 text-blue-600 italic">
        Based on the <strong>Premise</strong> and <strong>Summary</strong> below, write at least 
        three specific people, places, things, or activities that you want to explore in 
        the <strong>sidebar</strong> on the left. <br />
        Remember, your goal is to work with the prior participant's note to figure out <em>Who</em> committed 
        the murder, <em>What</em> weapon was used, and <em>Where</em> it happened.
      </Text>
      
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Premise Section */}
        <Paper shadow="sm" p="md" withBorder>
          <Text size="sm" style={{color: "gray"}} mt="sm" mb="sm">
            Here's the case overview the prior participant began with:
          </Text>
          
          <Title order={3}>Premise</Title>
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
            Your goal is to use the <strong>notes from the prior analyst</strong> and the set 
            of documents to identify:
          </Text>
          
          <ul>
            <li><strong>Who</strong> committed the murder,</li>
            <li><strong>What</strong> weapon was used, and</li>
            <li><strong>Where</strong> it occurred at the Boddy Estate.</li>
          </ul>    
          
          <hr/>
          
          <Title order={3}>A note about the truth</Title>
          <Text mt="sm">
            Only those involved in the murder may knowingly lie, while anyone might 
            unknowingly provide false information.
          </Text>
          <Text mt="sm">
            For example, if a John Doe is guilty of murder and says he never saw the victim 
            that night, he is knowingly lying (<strong>1st Degree lie</strong>).
          </Text>
          <Text mt="sm">
            Now, if Jane Doe, who is innocent, says the victim left at 8 PM, but the victim 
            actually left at 7 PM, that's unknowingly providing false information because she 
            wasn't there to see them leave (<strong>2nd Degree lie</strong>).
          </Text>
          <Text mt="sm">
            Only those directly involved with the murder will tell <strong>1st degree lies</strong>. 
            Everyone else could provide false information though.
          </Text>
        </Paper>
      
        {/* Analyst Summary Section */}
        <Paper shadow="sm" p="md" withBorder>
          <Text size="sm" style={{ color: "gray" }} mt="sm" mb="sm">
            After the prior analyst spent 15 minutes looking at evidence, they prepared 
            the following summary of their work for you to use before beginning your 
            investigation. What follows should be helpful.
          </Text>
          
          <Title order={3}>Prior Analyst Summary</Title>
          
          {loading && !currentParagraph && (
            <Text style={{ textAlign: "center", color: "gray" }} py="md">
              Loading Analyst notes...
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
      </SimpleGrid>
      
      <Text mt="sm" style={{textAlign: "center", color:"gray"}}>
        <em>A copy of this premise and summary will be available in the interface.</em>
      </Text>
      
      <p className="mt-4">On the next page we will introduce to the investigation tool and the evidence.</p>
    </div>
  );
}

export default PremiseAndParagraph;
