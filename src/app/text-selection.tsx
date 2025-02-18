import React from "react";
import { RelevanceLevel } from "./types";

interface TextSelectionProps {
  id: string;
  text: string;
  relevanceLevel: RelevanceLevel;
  onRemove: (id: string) => void;
}

const RELEVANCE_COLORS = {
  [RelevanceLevel.HIGH]: "bg-green-200 hover:bg-green-300",
  [RelevanceLevel.RELEVANT]: "bg-blue-200 hover:bg-blue-300",
  [RelevanceLevel.SOMEWHAT_RELEVANT]: "bg-yellow-100 hover:bg-yellow-200",
  [RelevanceLevel.UNMARKED]: "bg-transparent",
  [RelevanceLevel.IRRELEVANT]: "bg-red-100 hover:bg-red-200",
  [RelevanceLevel.INCORRECT]: "bg-red-300 hover:bg-red-400",
};

export const TextSelection: React.FC<TextSelectionProps> = ({
  id,
  text,
  relevanceLevel,
  onRemove,
}) => {
  return (
    <span className={`${RELEVANCE_COLORS[relevanceLevel]} relative group`}>
      {text}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="absolute -top-5 -right-6 opacity-0 group-hover:opacity-100 
                   bg-white rounded-full border-2 border-solid border-gray-300 px-1.5 shadow-lg 
                   hover:bg-gray-200 transition-opacity"
        aria-label="Remove selection"
      >
        X
      </button>
    </span>
  );
};
