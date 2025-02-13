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
    <span className="relative group">
      <span
        className={`${RELEVANCE_COLORS[relevanceLevel]} relative inline-block`}
      >
        {text}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 
                   bg-white rounded-full p-0.5 shadow-sm 
                   hover:bg-gray-100 transition-opacity"
          aria-label="Remove selection"
        >
          X
        </button>
      </span>
    </span>
  );
};
