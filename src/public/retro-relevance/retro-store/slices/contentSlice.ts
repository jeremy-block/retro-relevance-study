// // src/store/slices/contentSlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { splitIntoSentencesOld } from '../../markdownUtils';
// import { Paragraph, TextSelection, Sentence, Content } from '../../retro-types';
// import { v4 as uuidv4 } from 'uuid';



// const initialState: Content = {
//   paragraphs: [],
//   paragraphCurrentIndex: 0,
//   editMe: {
//     id: 'p1',
//     text: '',
//     selections: []
//   },
//   sentences: [{ id: "lala", text: "testing for now", id: "something", text: "# something else"}],
//   focusedSentenceId: null,
//   selections: [],
//   selection: null,
// };

// const contentSlice = createSlice({
//   name: 'content',
//   initialState,
//   reducers: {
//     setParagraphs(state, action: PayloadAction<Paragraph[]>) {
//       state.paragraphs = action.payload.map(p => ({
//         ...p,
//         selections: p.selections || []
//       }));
//     },
//     setParagraphIndex(state, action: PayloadAction<number>) {
//       state.paragraphCurrentIndex = action.payload;
//     },
//     setEditableParagraph(state, action: PayloadAction<Paragraph>) {
//       if (action.payload.id === null) {
//         const tempId = `p-${uuidv4()}`;
//         state.editMe = {
//           id: tempId,
//           text: action.payload.text,
//           selections: []
//         };
//       } else {
//         state.editMe = {
//           ...action.payload,
//           selections: action.payload.selections || []
//         };
//       }
//       // Split sentences when setting a new paragraph
//       state.sentences = splitIntoSentencesOld(action.payload.text).map((text, index) => ({
//         id: `sentence-${index}`,
//         text,
//       }));
//       // Add to paragraphs array if it doesn't exist
//       console.log(state.editMe, state.sentences)
//       if (!(state.paragraphs ?? []).find(p => p.id === (state.editMe?.id ?? ''))) {
//         (state.paragraphs ??= []).push(state.editMe);
//       }
//     },
//     removeSentence(state, action: PayloadAction<{ id: string; text: string; reason: string }>) {
//       const sentenceToRemove = (state.sentences ?? []).find(s => s.id === action.payload.id);
//       if (!sentenceToRemove) {
//         console.log(sentenceToRemove, "not found!")
//         return;
//       }
//       state.sentences = (state.sentences ?? []).filter(s => s.id !== action.payload.id);
//     },
//     updateSentence(state, action: PayloadAction<{ id: string; text: string }>) {
//       const sentence = (state.sentences ?? []).find(s => s.id === action.payload.id);
//       if (sentence) {
//         sentence.text = action.payload.text;
//       }
//     },
//     addSentence(state, action: PayloadAction<{ afterId: string | null }>) {
//       const newId = `sentence-${uuidv4()}`;
//       const newSentence: Sentence = { id: newId, text: '' };

//       if (action.payload.afterId === null) {
//         (state.sentences ?? []).push(newSentence);
//       } else {
//         const index = (state.sentences ?? []).findIndex(s => s.id === action.payload.afterId);
//         if (index !== -1) {
//           (state.sentences ?? []).splice(index + 1, 0, newSentence);
//         } else {
//           //todo Likely never hit this point.
//           (state.sentences ?? []).push(newSentence)
//         }
//       }

//       state.focusedSentenceId = newId;
//     },
//     setFocusedSentence(state, action: PayloadAction<string | null>) {
//       state.focusedSentenceId = action.payload;
//     },
//     // Add a selection for a specific paragraph
//     addSelection: (state, action: PayloadAction<{
//       selection: TextSelection;
//       paragraphId: string;
//     }>) => {
//       const { selection, paragraphId } = action.payload;
  
//       // Find the paragraph
//       const paragraph = (state.paragraphs ?? []).find(p => p.id === paragraphId);
//       if (!paragraph) return;
  
//       // Initialize selections array if it doesn't exist
//       if (!paragraph.selections) {
//         paragraph.selections = [];
//       }
  
//       // Check for overlapping selections
//       const hasOverlap = paragraph.selections.some(existingSelection =>
//         selection.startIndex < existingSelection.endIndex &&
//         selection.endIndex > existingSelection.startIndex
//       );
  
//       if (hasOverlap) {
//         console.warn("Overlapping selection detected");
//       }
  
//       // Add the selection
//       paragraph.selections.push(selection);
//     },
//     // Update an existing selection
//     updateSelection: (state, action: PayloadAction<{
//       id: string;
//       relevanceLevel: string;
//       paragraphId: string;
//     }>) => {
//       const { id, relevanceLevel, paragraphId } = action.payload;
  
//       // Find the paragraph
//       //todo try just using currentParagraphId?
//       const paragraph = (state.paragraphs ?? []).find(p => p.id === paragraphId);
//       if (!state.paragraphs || !paragraph || !paragraph.selections) return;
  
//       // Find and update the selection
//       const selection = paragraph.selections.find(s => s.id === id);
//       if (selection) {
//         selection.relevanceLevel = relevanceLevel;
//       }
//     },
//     // Remove a selection
//     removeSelection: (state, action: PayloadAction<{
//       id: string;
//       paragraphId: string;
//     }>) => {
//       const { id, paragraphId } = action.payload;
  
//       // Find the paragraph
//       const paragraph = (state.paragraphs ?? []).find(p => p.id === paragraphId);
//       if (!paragraph || !paragraph.selections) return;
  
//       // Remove the selection
//       paragraph.selections = paragraph.selections.filter(s => s.id !== id);
//     },

//     // queueLogEntry(state, action: PayloadAction<LogEntry>) {
//     //   state.pendingLogs.push(action.payload);
//     // },
    
//     // removePendingLog(state, action: PayloadAction<number>) {
//     //   state.pendingLogs = state.pendingLogs.filter((_, index) => index !== action.payload);
//     // },
    
//     // clearPendingLogs(state) {
//     //   state.pendingLogs = [];
//     // },
//   },
// });

// export const { 
//   setParagraphs,
//   setParagraphIndex,
//   setEditableParagraph,
//   addSelection,
//   updateSelection,
//   removeSelection,
//   removeSentence,
//   updateSentence,
//   addSentence,
//   setFocusedSentence,
// } =
//   contentSlice.actions;
// export default contentSlice.reducer;