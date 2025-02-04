import React, { useRef, useState, useCallback, useMemo } from "react";
import { useStudyContext } from "./study-context";
import { v4 as uuidv4 } from "uuid";
import { RelevanceLevel, TextSelection } from "./types";

// Color mapping for relevance levels
const RELEVANCE_COLORS = {
  [RelevanceLevel.HIGH]: "bg-green-200",
  [RelevanceLevel.RELEVANT]: "bg-blue-200",
  [RelevanceLevel.SOMEWHAT_RELEVANT]: "bg-yellow-100",
  [RelevanceLevel.UNMARKED]: "bg-transparent",
  [RelevanceLevel.IRRELEVANT]: "bg-red-100",
  [RelevanceLevel.INCORRECT]: "bg-red-300",
};

export const ParagraphComponent: React.FC<{
  paragraphId: string;
  content: string;
}> = ({ paragraphId, content }) => {
  const { state, dispatch } = useStudyContext();
  const paragraphRef = useRef<HTMLDivElement>(null);
  const [localSelection, setLocalSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Text selection handler with robust error catching
  const handleTextSelection = useCallback(() => {
    if (!paragraphRef.current) return null;

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      const startNode = range.startContainer;
      const endNode = range.endContainer;

      // Validate selection boundaries
      if (
        !paragraphRef.current.contains(startNode) ||
        !paragraphRef.current.contains(endNode)
      ) {
        return null;
      }

      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      // Prevent zero-length selections
      if (startOffset === endOffset) return null;

      // Robust selection index calculation
      const selectedText = range.toString();

      return {
        start: Math.min(startOffset, endOffset),
        end: Math.max(startOffset, endOffset),
        text: selectedText,
      };
    } catch (error) {
      console.error("Text selection error:", error);
      return null;
    }
  }, []);

  // Relevance selection handler
  const handleRelevanceSelection = useCallback(
    (relevanceLevel: RelevanceLevel) => {
      if (!localSelection) return;

      const newSelection: TextSelection = {
        id: uuidv4(),
        paragraphId,
        startIndex: localSelection.start,
        endIndex: localSelection.end,
        text: content.slice(localSelection.start, localSelection.end),
        relevanceLevel,
        timestamp: Date.now(),
      };

      dispatch({
        type: "ADD_SELECTION",
        payload: newSelection,
      });

      setLocalSelection(null);
    },
    [localSelection, paragraphId, content, dispatch]
  );

  // Render selections with color coding
  const renderedContent = useMemo(() => {
    const selections = state.selections[paragraphId] || [];

    // Sort selections by start index to handle overlapping
    const sortedSelections = [...selections].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    let result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSelections.forEach((selection) => {
      // Add text before selection
      if (selection.startIndex > lastIndex) {
        result.push(content.slice(lastIndex, selection.startIndex));
      }

      // Add colored selection
      result.push(
        <span
          key={selection.id}
          className={`${RELEVANCE_COLORS[selection.relevanceLevel]}`}
        >
          {content.slice(selection.startIndex, selection.endIndex)}
        </span>
      );

      lastIndex = selection.endIndex;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return result;
  }, [content, state.selections, paragraphId]);

  return (
    <div
      ref={paragraphRef}
      onMouseUp={() => {
        const selection = handleTextSelection();
        if (selection) setLocalSelection(selection);
      }}
      className="p-4 bg-white border rounded cursor-text"
    >
      {renderedContent}

      {localSelection && (
        <div
          className="fixed z-50 bg-gray-100 p-2 border rounded shadow"
          // Position logic would be added here
        >
          {Object.values(RelevanceLevel)
            .filter((level) => level !== RelevanceLevel.UNMARKED)
            .map((level) => (
              <button
                key={level}
                onClick={() => handleRelevanceSelection(level)}
                className={`m-1 p-1 rounded ${RELEVANCE_COLORS[level]}`}
              >
                {level}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
