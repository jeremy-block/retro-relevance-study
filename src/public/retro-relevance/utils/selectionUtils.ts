// src/utils/selectionUtils.ts

import { Paragraph } from "../retro-types"

export const addEmptySelections = (setOfPossibleParagraphs: { text: string; id: string }[]): Paragraph[] => {
    const setOfParagraphs = setOfPossibleParagraphs.map(paragraph => ({
        ...paragraph,
        selections: []
    }));
    
    return setOfParagraphs;
};