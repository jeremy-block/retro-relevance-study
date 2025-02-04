// Defines the core types for the study interface
export enum RelevanceLevel {
  HIGH = "high",
  RELEVANT = "relevant",
  SOMEWHAT_RELEVANT = "somewhat-relevant",
  UNMARKED = "unmarked",
  IRRELEVANT = "irrelevant",
  INCORRECT = "incorrect",
}

export interface TextSelection {
  id: string;
  paragraphId: string;
  startIndex: number;
  endIndex: number;
  text: string;
  relevanceLevel: RelevanceLevel;
  timestamp: number;
}

export interface ParagraphEdit {
  paragraphId: string;
  timestamp: number;
  originalText: string;
  newText: string;
  editType: "addition" | "removal" | "both";
  cursorPosition: number;
}

export interface Paragraph {
  id: string;
  content: string;
  initialSelections?: TextSelection[];
}

export interface StudyMode {
  isAuthoringMode: boolean;
  currentParagraphIndex: number;
}
