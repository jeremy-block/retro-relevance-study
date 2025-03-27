// src/types/index.ts

export interface SentenceListState {
  sentences: Sentence[];
  focusedSentenceId: string | null;
}

export interface SentenceListParams {
  testingStimulusValue: Sentence[]|string
  all: {
    original?: Paragraph;
    sentences: Sentence[];
    focusedSentenceId: string | null;
  }
}


export type AppState = {
  user: User;
  content: Content;
}

export type User = {
  userId: string;
  condition: string;
  phase: string;
};

export type Content = {
  paragraphs?: Paragraph[];
  paragraphCurrentIndex?: number;
  editMe?: Paragraph;
  sentences?: Sentence[];
  focusedSentenceId?: string | null;
  focusedIndex?: number;
  selections?: TextSelection[],
  selection?: TextSelection | null,
}

export type LogEntry = {
  time: number;
  type: string;
  state?: AppState;
  userId?: string;
  phase?: string;
  condition?: string;
  paragraphID?: string;
  sentenceID?: string;
  priorSentenceText?: string;
  newSentenceText?: string;
  diff?: string;
  allText?: string;
  startIndex?: number;
  endIndex?: number;
  relevanceLevel?: string;
  warn?: boolean;
  content?: string;
  payload?: any;
};

export type Sentence = {
  id: string;
  text: string;
};

export type possibleNewSentence = {
  id: string;
  text: string;
  metadata: {
    indentLevel: number;
    isListItem: boolean;
  };
}

// Represents a single DOM element that needs to be highlighted
export interface HighlightableElement {
  nodeRef: string;  // A unique reference to identify the node
  path: number[];   // Path to the node in the DOM tree (indices from root)
  isFullySelected: boolean;  // Whether the entire element is selected
  startOffset?: number;  // If partially selected, the start character position
  endOffset?: number;   // If partially selected, the end character position
}

export type TextSelection = {
  ParentParagraphID: string;
  id: string;
  startIndex: number;
  endIndex: number;
  relevanceLevel: string;
  selectedText: string;
  elements?: HighlightableElement[];  // The DOM elements this selection covers
};

export type Paragraph = {
  id: string | null;
  text: string;
  selections: TextSelection[];
};

export enum RelevanceLevel {
  HIGH = "high",
  RELEVANT = "relevant",
  SOMEWHAT_RELEVANT = "somewhat-relevant",
  UNMARKED = "unmarked",
  IRRELEVANT = "irrelevant",
  INCORRECT = "incorrect",
}
