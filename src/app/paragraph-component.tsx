import React, { useRef, useState, useCallback, useMemo } from "react";
import { useStudyContext } from "./study-context";
import { v4 as uuidv4 } from "uuid";
import { RelevanceLevel, TextSelection as TextSelectionType } from "./types";
import { TextSelection } from "./text-selection";

interface RelevanceContextMenuProps {
  position: { x: number; y: number };
  onSelect: (level: RelevanceLevel) => void;
  onClose: () => void;
}

const RelevanceContextMenu: React.FC<RelevanceContextMenuProps> = ({
  position,
  onSelect,
  onClose,
}) => {
  // Use portal for better stacking context
  return (
    <div
      className="fixed z-50 bg-white p-2 border rounded shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      {Object.values(RelevanceLevel)
        .filter((level) => level !== RelevanceLevel.UNMARKED)
        .map((level) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
          >
            {level}
          </button>
        ))}
    </div>
  );
};

export const ParagraphComponent: React.FC<{
  paragraphId: string;
  content: string;
}> = ({ paragraphId, content }) => {
  const { state, dispatch } = useStudyContext();
  const paragraphRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);

  const handleTextSelection = useCallback((event: MouseEvent) => {
    if (!paragraphRef.current) return null;

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      const startNode = range.startContainer;
      const endNode = range.endContainer;

      if (
        !paragraphRef.current.contains(startNode) ||
        !paragraphRef.current.contains(endNode)
      ) {
        return null;
      }

      const selectedText = range.toString().trim();
      if (!selectedText) return null;

      // Calculate character offsets
      const textContent = paragraphRef.current.textContent || "";
      const startOffset = textContent.indexOf(selectedText);
      const endOffset = startOffset + selectedText.length;

      if (startOffset === -1) return null;

      return {
        start: startOffset,
        end: endOffset,
        text: selectedText,
      };
    } catch (error) {
      console.error("Text selection error:", error);
      return null;
    }
  }, []);

  const handleMouseUp = useCallback(
    (event: React.MouseEvent) => {
      const selection = handleTextSelection(event.nativeEvent);
      if (selection) {
        setCurrentSelection(selection);
        setMenuPosition({ x: event.clientX, y: event.clientY });
      }
    },
    [handleTextSelection]
  );

  const handleRelevanceSelect = useCallback(
    (level: RelevanceLevel) => {
      if (!currentSelection) return;

      const newSelection: TextSelectionType = {
        id: uuidv4(),
        paragraphId,
        startIndex: currentSelection.start,
        endIndex: currentSelection.end,
        text: currentSelection.text,
        relevanceLevel: level,
        timestamp: Date.now(),
      };

      dispatch({
        type: "ADD_SELECTION",
        payload: newSelection,
      });

      setCurrentSelection(null);
      setMenuPosition(null);
      window.getSelection()?.removeAllRanges();
    },
    [currentSelection, paragraphId, dispatch]
  );

  const handleRemoveSelection = useCallback(
    (selectionId: string) => {
      dispatch({
        type: "REMOVE_SELECTION",
        payload: { paragraphId, selectionId },
      });
    },
    [paragraphId, dispatch]
  );

  const renderedContent = useMemo(() => {
    const selections = state.selections[paragraphId] || [];
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

      // Add selection component
      result.push(
        <TextSelection
          key={selection.id}
          id={selection.id}
          text={selection.text}
          relevanceLevel={selection.relevanceLevel}
          onRemove={handleRemoveSelection}
        />
      );

      lastIndex = selection.endIndex;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return result;
  }, [content, state.selections, paragraphId, handleRemoveSelection]);

  return (
    <div
      ref={paragraphRef}
      onMouseUp={handleMouseUp}
      className="p-4 bg-white border rounded cursor-text relative"
    >
      {renderedContent}

      {menuPosition && (
        <RelevanceContextMenu
          position={menuPosition}
          onSelect={handleRelevanceSelect}
          onClose={() => {
            setMenuPosition(null);
            setCurrentSelection(null);
          }}
        />
      )}
    </div>
  );
};
