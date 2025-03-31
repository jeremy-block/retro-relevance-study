// // src/components/TextEditor/SentenceList.tsx
// import React, { useCallback, useMemo } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// // import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
// import SentenceItem from './SentenceItem';
// import { Sentence, Content } from './retro-types';
// import { useStoreSelector } from "../../store/store";
// import { initializeTrrack, Registry } from '@trrack/core';
// import { StimulusParams } from "../../store/types";
// import { v4 as myuuidv4 } from 'uuid';

// const initialSentenceListState: Content = {
// //   paragraphs: [],
// //   paragraphCurrentIndex: 0,
// //   selections: [],
// //   selection: null,
//   editMe: {
//     id: 'p1',
//     text: '',
//     selections: []
//   },
//   sentences: [{ id: "sentence1", text: "# testing for now." }, {id: "sentence2", text: "## something else\n might be going on **here**"}],
//   focusedSentenceId: null,
// };

// function SentenceList({ parameters, setAnswer }: StimulusParams<any>) {
//     const answers = useStoreSelector((state) => state.answers);
//     const { actions, trrack } = useMemo(() => {
//         const reg = Registry.create();
      
//         const updateSentence = reg.register('updateSentence', (state, payload: { id: string; text: string }) => {
//             const updatedState = { ...state };
//             const sentence = (updatedState.sentences ?? []).find(s => s.id === payload.id);
//             console.log("🚀 ~ updateSentence ~ updatedState:", updatedState)
//             if (sentence) {
//                 sentence.text = payload.text;
//             }
//             return updatedState;
//         });

//         const removeSentence = reg.register('removeSentence', (state, payload: { id: string; text: string; reason: string }) => {
//             const sentenceToRemove = (state.sentences ?? []).find(s => s.id === payload.id);
//             if (!sentenceToRemove) {
//                 console.log(sentenceToRemove, "not found!")
//                 return;
//             }
//             state.sentences = (state.sentences ?? []).filter(s => s.id !== payload.id);
//         });

//         const addSentence = reg.register("addSentence", (state, payload: { afterId: string | null }) => {
//             const newState = { ...state };
//             const newId = `sentence-${myuuidv4()}`;
//             console.log("🚀 ~ addSentence ~ newState:", newState)
//             const newSentence: Sentence = { id: newId, text: 'Awaiting text to be added to meee!' };

//             if (payload.afterId === null) {
//                 (newState.sentences ?? []).push(newSentence);
//             } else {
//                 const index = (newState.sentences ?? []).findIndex(s => s.id === payload.afterId);
//                 if (index !== -1) {
//                     (newState.sentences ?? []).splice(index + 1, 0, newSentence);
//                 } else {
//                     //todo Likely never hit this point.
//                     (newState.sentences ?? []).push(newSentence)
//                 }
//             }

//             newState.focusedSentenceId = newId;
//         });

//         const setFocusedSentence = reg.register('setFocusedSentence', (state, payload: { id: string | null }) => {
//             const newState = { ...state };
//             console.log("🚀 ~ setFocusedSentence ~ payload.id:", payload.id)
//             console.log("🚀 ~ setFocusedSentence ~ newState:", newState)
//             if (payload.id === null) {
                
//             }
//             newState.focusedSentenceId = payload.id;
//             return newState;
//         });

//         // //todo Make more slicers for data store
//         // const updateSentenceChild = reg.register('updateSentenceChild', (state, payload: { id: string; text: string }) => {
//         //     console.log("🚀 ~ updateSentenceChild ~ payload:", payload)
//         //     const newState = { ...state };
//         //     const sentence = (newState.sentences ?? []).find(s => s.id === payload.id);
//         //     if (sentence) {
//         //         sentence.text = payload.text;
//         //     }
//         // });
      
//         const trrackInst = initializeTrrack({
//             registry: reg,
//             initialState: {
//                 ...initialSentenceListState
//             },
//         });
      
//         return {
//             actions: {
//                 addSentence,
//                 setFocusedSentence,
//                 updateSentence,
//                 removeSentence,
//             },
//             trrack: trrackInst,
//         };
//     }, []);

//     const sentenceAddCallback = useCallback((action: { afterId: string | null }) => {
//         trrack.apply('adding sentence', actions.addSentence(action));
        
//         // const newAnswer = Math.random();
//         // setAnswer({
//         //     status: true,
//         //     provenanceGraph: trrack.graph.backend,
//         //     answers: { [parameters]: newAnswer },
//         // });
//     }, [actions, trrack]);

//         const sentenceUpdateCallback = useCallback((action: { id: string; text: string }) => {
//             console.log("🚀 ~ setFocused ~ payload:", action)
//         trrack.apply('update sentence', actions.updateSentence(action));
        
//         // const newAnswer = Math.random();
//         // setAnswer({
//         //     status: true,
//         //     provenanceGraph: trrack.graph.backend,
//         //     answers: { [parameters]: newAnswer },
//         // });
//     }, [actions, trrack]);

//         const sentenceRemoveCallback = useCallback((action: { id: string; text: string, reason: string }) => {
//         trrack.apply('remove sentence', actions.removeSentence(action));
        
//         // const newAnswer = Math.random();
//         // setAnswer({
//         //     status: true,
//         //     provenanceGraph: trrack.graph.backend,
//         //     answers: { [parameters]: newAnswer },
//         // });
//         }, [actions, trrack]);

    
//     const focusedSetCallback = useCallback((something: string | null) => {
//         console.log("🚀 ~ setFocused ~ something:", something)
//         trrack.apply('"setting ID"', actions.setFocusedSentence({ id: something }));
//     }, [actions, trrack]);




//   const sentences:Sentence[] = parameters.sentences;
//   const focusedSentenceId = parameters.focusedSentenceId;
  
  
//   //todo this may be why there are multiple dispach events for adding sentence. to be determined
//   // Handle sentence text change
//     const handleSentenceChange = (id: string, newText: string) => {
//         sentenceUpdateCallback({ id, text: newText });

//         // Log the edit
//         // logAction({
//         //   type: 'edit',
//         //   paragraphID: 'p1',
//         //   sentenceID: id,
//         //   priorSentenceText: oldText,
//         //   newSentenceText: newText,
//         //   diff: computeDiff(oldText, newText),
//         //   allText: getAllText((sentences ?? []).map(sentence => 
//         //     sentence.id === id ? { ...sentence, text: newText } : sentence
//         //   )),
//         // });
//     };
  
//   // Handle sentence removal
//   const handleSentenceRemove = (id: string, text: string,  reason: string) => {
//     sentenceRemoveCallback({ id, text, reason });

//     // // Log the removal
//     // logAction({
//     //   type: 'remove',
//     //   paragraphID: 'p1',
//     //   sentenceID: id,
//     //   priorSentenceText: text,
//     //   newSentenceText: '',
//     //   diff: `REMOVED: ${reason}`,
//     //   allText: getAllText((sentences ?? []).filter(sentence => sentence.id !== id)),
//     // });
//   };
  
//   //todo this may be why tehre are multiple dispach events for adding sentence. to be determined
//   // Handle sentence addition
//     const handleAddSentence = (afterId: string | null) => {
//         sentenceAddCallback({ afterId });
      
//       // // Log the addition
//       // logAction({
//       //   type: 'add',
//       //   paragraphID: 'p1',
//       //   sentenceID: newId,
//       //   priorSentenceText: '',
//       //   newSentenceText: '',
//       //   allText: getAllText([...sentences, newSentence]),
//       // });
//     };
//     const handleSetFocus = ( something: string|null) => {
//         focusedSetCallback(something)
//     }
  
//   // Handle drag and drop reordering
//   // const handleDragEnd = (result: DropResult) => {
//   //   if (!result.destination) return;
    
//   //   const sourceIndex = result.source.index;
//   //   const destinationIndex = result.destination.index;
    
//   //   if (sourceIndex === destinationIndex) return;
    
//   //   const reorderedSentences = Array.from(sentences);
//   //   const [removed] = reorderedSentences.splice(sourceIndex, 1);
//   //   reorderedSentences.splice(destinationIndex, 0, removed);
    
//   //   setSentences(reorderedSentences);
    
//   //   // Log the reordering
//   //   logAction({
//   //     type: 'reorder',
//   //     paragraphID: 'p1',
//   //     sentenceID: removed.id,
//   //     priorSentenceText: `position: ${sourceIndex}`,
//   //     newSentenceText: `position: ${destinationIndex}`,
//   //     allText: getAllText(reorderedSentences),
//   //   });
//   // };
  
//   // Get all text combined
//   const getAllText = (currentSentences: Sentence[]): string => {
//     return currentSentences.map(s => s.text).join(' ');
//   };
  
//   // Compute difference between texts
//   const computeDiff = (oldText: string, newText: string): string => {
//     return `removed: "${oldText}" added: "${newText}"`;
//   };
    
 

      
//   return (
//     <>
//       {(sentences?.length === 0) ? (<div>No sentences to your summaries... Try adding one with the button below.</div>) : null}
//       <div className="space-y-1">
//         {sentences?.map((sentence) => (
//           <SentenceItem
//             key={sentence.id}
//             id={sentence.id}
//                 text={sentence.text}
//             onClick={handleSetFocus}
//             onChange={handleSentenceChange}
//             onRemove={handleSentenceRemove}
//             onAddAfter={() => handleAddSentence(sentence.id)}
//             focused={focusedSentenceId === sentence.id}
//           />
//         ))}
//       </div>
//       <div className="mt-4">
//         <button
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//           onClick={() => handleAddSentence(null)}
//         >
//           + Add Sentence
//         </button>
//       </div>
//     </>
//   );
// };

// export default SentenceList

// function uuidv4() {
//     throw new Error('Function not implemented.');
// }
