import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";
import {
  Paragraph,
  TextSelection,
  ParagraphEdit,
  RelevanceLevel,
  StudyMode,
} from "./types";

// Initial dummy data for testing
const INITIAL_PARAGRAPHS: Paragraph[] = [
  {
    id: "para1",
    content:
      "Machine learning algorithms have transformed various industries by enabling complex pattern recognition and predictive modeling across diverse domains such as healthcare, finance, and technology.",
  },
  {
    id: "para2",
    content:
      "Neural networks represent a sophisticated computational approach that mimics biological neural structures, allowing for intricate data processing and adaptive learning capabilities.",
  },
];

// Action types for reducer
type ActionType =
  | { type: "ADD_SELECTION"; payload: TextSelection }
  | {
      type: "REMOVE_SELECTION";
      payload: { paragraphId: string; selectionId: string };
    }
  | { type: "UPDATE_SELECTION"; payload: TextSelection }
  | { type: "ADD_PARAGRAPH_EDIT"; payload: ParagraphEdit }
  | {
      type: "UPDATE_PARAGRAPH_CONTENT";
      payload: { paragraphId: string; content: string };
    }
  | { type: "SET_STUDY_MODE"; payload: Partial<StudyMode> };

// Complex reducer to manage study state
function studyReducer(state: StudyState, action: ActionType): StudyState {
  switch (action.type) {
    case "ADD_SELECTION": {
      const { paragraphId } = action.payload;
      return {
        ...state,
        selections: {
          ...state.selections,
          [paragraphId]: [
            ...(state.selections[paragraphId] || []),
            action.payload,
          ],
        },
      };
    }
    case "REMOVE_SELECTION": {
      const { paragraphId, selectionId } = action.payload;
      return {
        ...state,
        selections: {
          ...state.selections,
          [paragraphId]: (state.selections[paragraphId] || []).filter(
            (selection) => selection.id !== selectionId
          ),
        },
      };
    }
    case "UPDATE_SELECTION": {
      const { paragraphId, id } = action.payload;
      return {
        ...state,
        selections: {
          ...state.selections,
          [paragraphId]: (state.selections[paragraphId] || []).map(
            (selection) => (selection.id === id ? action.payload : selection)
          ),
        },
      };
    }
    case "ADD_PARAGRAPH_EDIT": {
      return {
        ...state,
        paragraphEdits: [...state.paragraphEdits, action.payload],
      };
    }
    case "UPDATE_PARAGRAPH_CONTENT": {
      const { paragraphId, content } = action.payload;
      return {
        ...state,
        paragraphs: state.paragraphs.map((para) =>
          para.id === paragraphId ? { ...para, content } : para
        ),
      };
    }
    case "SET_STUDY_MODE": {
      return {
        ...state,
        studyMode: { ...state.studyMode, ...action.payload },
      };
    }
    default:
      return state;
  }
}

// Study state structure
interface StudyState {
  paragraphs: Paragraph[];
  selections: Record<string, TextSelection[]>;
  paragraphEdits: ParagraphEdit[];
  studyMode: StudyMode;
}

// Initial state
const initialState: StudyState = {
  paragraphs: INITIAL_PARAGRAPHS,
  selections: {},
  paragraphEdits: [],
  studyMode: {
    isAuthoringMode: true,
    currentParagraphIndex: 0,
  },
};

// Create context
const StudyContext = createContext<{
  state: StudyState;
  dispatch: React.Dispatch<ActionType>;
  exportData: () => void;
}>({
  state: initialState,
  dispatch: () => null,
  exportData: () => {},
});

// Context Provider Component
export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(studyReducer, initialState);

  // Data export utility
  const exportData = useCallback(() => {
    const exportPayload = {
      selections: state.selections,
      paragraphEdits: state.paragraphEdits,
      timestamp: Date.now(),
    };

    // In a real implementation, this would interact with a server endpoint
    const dataStr = JSON.stringify(exportPayload, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `study-data-${Date.now()}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, [state]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      exportData,
    }),
    [state, dispatch, exportData]
  );

  return (
    <StudyContext.Provider value={contextValue}>
      {children}
    </StudyContext.Provider>
  );
};

// Custom hook for using study context
export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudyContext must be used within a StudyProvider");
  }
  return context;
};
