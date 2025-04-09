// ParagraphContentWithSelections.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import MarkdownRenderer from '../../retro-relevance/ParagraphSelection/MarkdownRenderer';
import SelectionContextMenu from  '../../retro-relevance/ParagraphSelection/SelectionContextMenu';
import { Paragraph, TextSelection, SelectionToolParams } from '../../retro-relevance/retro-types';
import { StimulusParams, StoredAnswer } from '../../../store/types';
import { useParagraphData } from './useParagraphData';

interface ParagraphContentProps {
  initialParagraphId?: string; // Optional ID of paragraph seen in previous task
  onComplete?: (selections: TextSelection[], paragraphs: Paragraph[]) => void;
}

const ParagraphContentWithSelections: React.FC<ParagraphContentProps> = ({
  initialParagraphId,
  onComplete
}) => {
  // Hook for API interactions
  const { 
    loading, 
    error, 
    paragraphData, 
    setParagraphData, 
    fetchExperimentSequence 
  } = useParagraphData();

  // Component state management
  const [selections, setSelections] = useState<TextSelection[]>([]);
  const [focusedParagraphIndex, setFocusedParagraphIndex] = useState<number>(0);

  // Initialize selections tracking state for each paragraph
  const paragraphSelections = useMemo(() => {
    if (!paragraphData) return {};
    
    return paragraphData.reduce((acc, paragraph) => {
      acc[paragraph.id] = paragraph.selections || [];
      return acc;
    }, {} as Record<string, TextSelection[]>);
  }, [paragraphData]);

  // Provenance (history tracking) setup
  const registry = useMemo(() => {
    return Registry.create({
      selections: Array<TextSelection>(),
      paragraphs: Array<Paragraph>(),
      focusedParagraphIndex: 0,
    });
  }, []);
  
  const trrackState = useMemo(() => {
    return initializeTrrack(registry, {
      selections: [],
      paragraphs: paragraphData || [],
      focusedParagraphIndex: 0,
    });
  }, [registry, paragraphData]);

  const provenanceState = trrackState.currentState;

  // Fetch the paragraph sequence when component mounts or initialParagraphId changes
  useEffect(() => {
    const loadExperimentSequence = async () => {
      // Store the initial paragraph ID for potential future session continuations
      if (initialParagraphId) {
        sessionStorage.setItem('previousParagraphId', initialParagraphId);
      }
      
      // Fetch the sequence using the initial ID or the stored ID
      const storedId = sessionStorage.getItem('previousParagraphId');
      await fetchExperimentSequence(storedId || initialParagraphId);
    };
    
    loadExperimentSequence();
  }, [initialParagraphId, fetchExperimentSequence]);

  // Sync component state with provenance state
  useEffect(() => {
    if (provenanceState) {
      const pSelections = provenanceState.selections || selections;
      const pParagraphs = provenanceState.paragraphs || paragraphData;
      const pFocusedIndex = provenanceState.focusedParagraphIndex || focusedParagraphIndex;
      
      setSelections(pSelections);
      if (pParagraphs?.length > 0) {
        setParagraphData(pParagraphs);
      }
      setFocusedParagraphIndex(pFocusedIndex);
    }
  }, [provenanceState, selections, paragraphData, focusedParagraphIndex]);

  // Handle text selection functionality
  const handleSelection = useCallback((selection: TextSelection) => {
    const updatedSelections = [...selections, selection];
    
    // Update the paragraph with this selection
    const updatedParagraphs = [...paragraphData];
    const paragraphIndex = updatedParagraphs.findIndex(p => p.id === selection.paragraphId);
    
    if (paragraphIndex >= 0) {
      updatedParagraphs[paragraphIndex] = {
        ...updatedParagraphs[paragraphIndex],
        selections: [
          ...(updatedParagraphs[paragraphIndex].selections || []),
          selection
        ]
      };
      
      setParagraphData(updatedParagraphs);
    }
    
    setSelections(updatedSelections);
    
    // Update provenance state
    trrackState.apply(
      trrackState.getAction("New selection").setLabel(`Selected text: ${selection.text.substring(0, 20)}...`)({
        selections: updatedSelections,
        paragraphs: updatedParagraphs,
        focusedParagraphIndex
      })
    );
  }, [selections, paragraphData, focusedParagraphIndex, setParagraphData, trrackState]);

  // Handle moving to next paragraph
  const handleNextParagraph = useCallback(() => {
    if (focusedParagraphIndex < paragraphData.length - 1) {
      const nextIndex = focusedParagraphIndex + 1;
      setFocusedParagraphIndex(nextIndex);
      
      // Update provenance state
      trrackState.apply(
        trrackState.getAction("Navigate to paragraph").setLabel(`Moved to paragraph ${nextIndex + 1}`)({
          selections,
          paragraphs: paragraphData,
          focusedParagraphIndex: nextIndex
        })
      );
    } else {
      // If we're at the last paragraph, call the onComplete callback
      if (onComplete) {
        onComplete(selections, paragraphData);
      }
    }
  }, [focusedParagraphIndex, paragraphData, selections, trrackState, onComplete]);

  // Handle moving to previous paragraph
  const handlePreviousParagraph = useCallback(() => {
    if (focusedParagraphIndex > 0) {
      const prevIndex = focusedParagraphIndex - 1;
      setFocusedParagraphIndex(prevIndex);
      
      // Update provenance state
      trrackState.apply(
        trrackState.getAction("Navigate to paragraph").setLabel(`Moved to paragraph ${prevIndex + 1}`)({
          selections,
          paragraphs: paragraphData,
          focusedParagraphIndex: prevIndex
        })
      );
    }
  }, [focusedParagraphIndex, paragraphData, selections, trrackState]);

  // Loading state
  if (loading) {
    return <div className="loading-container">Loading paragraphs...</div>;
  }

  // Error state
  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading paragraphs</h3>
        <p>{error}</p>
        <button onClick={() => fetchExperimentSequence(initialParagraphId)}>
          Retry
        </button>
      </div>
    );
  }

  // No paragraphs state
  if (!paragraphData || paragraphData.length === 0) {
    return (
      <div className="empty-container">
        <p>No paragraphs available. Please try again later.</p>
        <button onClick={() => fetchExperimentSequence(initialParagraphId)}>
          Retry
        </button>
      </div>
    );
  }

  const currentParagraph = paragraphData[focusedParagraphIndex];

  return (
    <div className="paragraph-content-container">
      <div className="paragraph-navigation">
        <span>Paragraph {focusedParagraphIndex + 1} of {paragraphData.length}</span>
        <div className="navigation-buttons">
          <button 
            onClick={handlePreviousParagraph}
            disabled={focusedParagraphIndex === 0}
          >
            Previous
          </button>
          <button 
            onClick={handleNextParagraph}
            disabled={focusedParagraphIndex === paragraphData.length - 1 && !onComplete}
          >
            {focusedParagraphIndex === paragraphData.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
      
      <div className="paragraph-content">
        <MarkdownRenderer 
          content={currentParagraph.content}
          paragraphId={currentParagraph.id}
          onSelection={handleSelection}
          existingSelections={currentParagraph.selections || []}
        />
      </div>

      <SelectionContextMenu 
        paragraph={currentParagraph}
        selections={currentParagraph.selections || []}
        onSelectionUpdate={(updatedSelections) => {
          // Update paragraph selections
          const updatedParagraphs = [...paragraphData];
          updatedParagraphs[focusedParagraphIndex] = {
            ...currentParagraph,
            selections: updatedSelections
          };
          
          setParagraphData(updatedParagraphs);
          
          // Update global selections list
          const allSelections = selections.filter(s => s.paragraphId !== currentParagraph.id);
          setSelections([...allSelections, ...updatedSelections]);
          
          // Update provenance
          trrackState.apply(
            trrackState.getAction("Update selections").setLabel("Modified selections")({
              selections: [...allSelections, ...updatedSelections],
              paragraphs: updatedParagraphs,
              focusedParagraphIndex
            })
          );
        }}
      />
    </div>
  );
};

export default ParagraphContentWithSelections;