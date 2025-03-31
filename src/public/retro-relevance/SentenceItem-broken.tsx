// // src/components/TextEditor/SentenceItem.tsx
// import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// import { markdownToHtml } from './utils/markdownUtils';
// // import { initializeTrrack, Registry } from '@trrack/core';
// // import { ProvenanceGraph } from '@trrack/core/graph/graph-slice';
// // import { StimulusParams } from "../../store/types";




// interface SentenceItemProps {
//   id: string
//   text: string;
//   //todo update the type of text to match the new structure
//   // sentenceItem: {
//   //   metadata: {id: string, isListItem: boolean, indentLevel: number }, text: string;
//     // }
//     onClick: (id: string) => void;
//   onChange: (id: string, newText: string) => void;
//   onRemove: (id: string, oldText: string, reason: string) => void;
//   onAddAfter: () => void;
//   focused: boolean;
// }

// function SentenceItem({
//     id,
//     text,
//     onClick,
//     onChange,
//     onRemove = () => {},
//     onAddAfter = ()=> {},
//     focused = true,
// }: SentenceItemProps) {
//     // const answers = parameters.testingStimulusValue
//     // const { key } = parameters
//     // console.log(parameters)
//     // const id = parameters.id;
//     // // console.log("🚀 ~ id:", id)
//     // const text = parameters.text;

    
//     const [editText, setEditText] = useState(text);
//     const editorRef = useRef<HTMLTextAreaElement>(null);
//     const [showRemoveDialog, setShowRemoveDialog] = useState(false);
//     //todo make sure to log remove reason into provenance trracker.
//     const [removeReason, setRemoveReason] = useState('');
//     // const { actions, trrack } = useMemo(() => {
//     //     const reg = Registry.create();

//     //     // const setFocusedSentence = reg.register('setFocusedSentence', (state, payload: { id: string | null }) => {
//     //     //     const newState = { ...state };
//     //     //     console.log("🚀 ~ setFocusedSentence ~ payload.id:", payload.id)
//     //     //     console.log("🚀 ~ setFocusedSentence ~ newState:", newState)
//     //     //     if (payload.id === null) {
                
//     //     //     }
//     //     //     newState.focusedSentenceId = payload.id;
//     //     //     return newState;
//     //     // });

//     //     // //todo Make more slicers for data store
//     //     // const updateSentenceChild = reg.register('updateSentenceChild', (state, payload: { id: string; text: string }) => {
//     //     //     console.log("🚀 ~ updateSentenceChild ~ payload:", payload)
//     //     //     const newState = { ...state };
//     //     //     const sentence = (newState.sentences ?? []).find(s => s.id === payload.id);
//     //     //     if (sentence) {
//     //     //         sentence.text = payload.text;
//     //     //     }
//     //     // });

//     //     const trrackInst = initializeTrrack({
//     //         registry: reg,
//     //         initialState: {
//     //             //todo set up initial store config
//     //             focusedSentenceId: null,
//     //             sentences: [null]
//     //         },
//     //     });

//     //     return {
//     //         actions: {
//     //             //todo list possible actions.
//     //             updateSentenceChild,
//     //             setFocusedSentence,
//     //         },
//     //         trrack: trrackInst,
//     //     };
//     // }, []);
    
//       // Handle key press
//       // todo handle up and down arrow keys for navigation (maybe with shift key)
//       const handleKeyDown = (e: React.KeyboardEvent) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//           e.preventDefault();
//           handleSave();
//           setTimeout(() => onAddAfter(), 0);
//         } else if (e.key === 'Escape') {
//           // setIsEditing(false);
//           setEditText(text);
//           focusedSetCallback(null); //Clear focus on cancel
    
//         }
//       };


//   // Ensure only one item is focused at a time
//   useEffect(() => {
//     if (focused && editorRef.current) {
//       editorRef.current.focus();
//     }
//   }, [focused]);

  
//   // Start editing
//     const handleStartEdit = () => {
//         console.log("this is getting clicked:",id)
//       onClick(id)
//     // focusedSetCallback(id); //Mark Item as focused
//   };
  
//          // Save changes
//       const handleSave = (givenID:string, thisText:string, newEditText:string) => {
//         if (thisText !== newEditText) {
//           onChange(id, newEditText, thisText);
//         }
//         onChange({ id: givenID, text: newEditText });
//         onClick(null); //Clear focus when done editing
//       };
      

//   // Confirm sentence removal
//   const handleRemoveConfirm = () => {
//     if (removeReason) {
//       onRemove(id, text, removeReason);
//       setShowRemoveDialog(false);
//       setRemoveReason('');
//     }
//   };
  
//   // Render HTML from markdown
//   const renderHtml = () => {
//     if(!text) return { __html: '<span class="text-gray-400 italic">Blank line - Please click to edit</span>' };
//     return { __html: markdownToHtml(text) };
//   };
  
//   return (
//       <div className="bg-white border rounded p-1 pl-6 hover:shadow-md relative group">
//           {/* <button onClick={() => focusedSetCallback(id)}>{text}</button> */}
//       {focused ? (
//         <div>
//           <textarea
//             ref={editorRef}
//             className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
//             value={editText}
//             onChange={(e) => setEditText(e.target.value)}
//             onBlur={handleSave}
//             onKeyDown={handleKeyDown}
//             rows={Math.max(2, editText.split('\n').length)}
//           />
//           <div className="flex justify-end mt-2 space-x-2">
//             <button
//               className="text-blue-500 hover:text-blue-700 text-sm font-medium"
//               onClick={handleSave}
//             >
//               Save
//             </button>
//           </div>
//         </div>
//       ) : (
//         <div 
//           onClick={handleStartEdit}
//           className="cursor-text markdown-content"
//           style={{ minHeight: '1.5rem' }}
//         >
//           <div 
//             className="prose prose-sm max-w-none" 
//             dangerouslySetInnerHTML={renderHtml()} 
//           />
//         </div>
//       )}
      
//       <div 
//         className="absolute top-0 left-0 w-6 h-6 bg-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-bl cursor-grab"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
//           <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
//         </svg>
//       </div>
      
//       <button
//         className="absolute top-0 right-0 w-6 h-6 bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-bl"
//         onClick={() => text.trim() ? setShowRemoveDialog(true) : onRemove(id, text, 'empty')}
//         title="Remove sentence"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
//           <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
//         </svg>
//       </button>
      
//       {showRemoveDialog && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
//             <h3 className="text-lg font-semibold mb-3">Why are you removing this sentence?</h3>
//             <div className="mb-4 space-y-2">
//               <label className="flex items-center">
//                 <input
//                   type="radio"
//                   name="removeReason"
//                   value="inaccurate"
//                   checked={removeReason === 'inaccurate'}
//                   onChange={() => setRemoveReason('inaccurate')}
//                   className="mr-2"
//                 />
//                 <span>Inaccurate</span>
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="radio"
//                   name="removeReason"
//                   value="irrelevant"
//                   checked={removeReason === 'irrelevant'}
//                   onChange={() => setRemoveReason('irrelevant')}
//                   className="mr-2"
//                 />
//                 <span>Irrelevant</span>
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="radio"
//                   name="removeReason"
//                   value="other"
//                   checked={removeReason === 'other'}
//                   onChange={() => setRemoveReason('other')}
//                   className="mr-2"
//                 />
//                 <span>Other</span>
//               </label>
//             </div>
//             <div className="flex justify-end space-x-2">
//               <button
//                 className="px-4 py-2 border rounded hover:bg-gray-100"
//                 onClick={() => {
//                   setShowRemoveDialog(false);
//                   setRemoveReason('');
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
//                 onClick={handleRemoveConfirm}
//                 disabled={!removeReason}
//               >
//                 Remove
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SentenceItem;
