// src/components/TextEditor/SentenceList.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
// import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { RootState } from '../../store';
import SentenceItem from './SentenceItem';
import { updateSentence, removeSentence, addSentence } from '../../store/slices/contentSlice';
import { useLogger } from '../../hooks/useLogger';
import { Sentence } from '../../types';

const SentenceList:  React.FC = () => {
  const dispatch = useDispatch();
  const sentences = useSelector((state: RootState) => state.content.sentences);
  const focusedSentenceId = useSelector((state: RootState) => state.content.focusedSentenceId);
  const logAction = useLogger();
  
  
  //todo this may be why tehre are multiple dispach events for adding sentence. to be determined
  // Handle sentence text change
  const handleSentenceChange = (id: string, newText: string, oldText: string) => {
    dispatch(updateSentence({ id, text: newText }));

    // Log the edit
    logAction({
      type: 'edit',
      paragraphID: 'p1',
      sentenceID: id,
      priorSentenceText: oldText,
      newSentenceText: newText,
      diff: computeDiff(oldText, newText),
      allText: getAllText((sentences ?? []).map(sentence => 
        sentence.id === id ? { ...sentence, text: newText } : sentence
      )),
    });
  };
  
  // Handle sentence removal
  const handleSentenceRemove = (id: string, text: string,  reason: string) => {
    dispatch(removeSentence({ id, text, reason }));

    // Log the removal
    logAction({
      type: 'remove',
      paragraphID: 'p1',
      sentenceID: id,
      priorSentenceText: text,
      newSentenceText: '',
      diff: `REMOVED: ${reason}`,
      allText: getAllText((sentences ?? []).filter(sentence => sentence.id !== id)),
    });
  };
  
  //todo this may be why tehre are multiple dispach events for adding sentence. to be determined
  // Handle sentence addition
  const handleAddSentence = (afterId: string | null) => {
      dispatch(addSentence({ afterId }));
      
      // // Log the addition
      // logAction({
      //   type: 'add',
      //   paragraphID: 'p1',
      //   sentenceID: newId,
      //   priorSentenceText: '',
      //   newSentenceText: '',
      //   allText: getAllText([...sentences, newSentence]),
      // });
  };
  
  // Handle drag and drop reordering
  // const handleDragEnd = (result: DropResult) => {
  //   if (!result.destination) return;
    
  //   const sourceIndex = result.source.index;
  //   const destinationIndex = result.destination.index;
    
  //   if (sourceIndex === destinationIndex) return;
    
  //   const reorderedSentences = Array.from(sentences);
  //   const [removed] = reorderedSentences.splice(sourceIndex, 1);
  //   reorderedSentences.splice(destinationIndex, 0, removed);
    
  //   setSentences(reorderedSentences);
    
  //   // Log the reordering
  //   logAction({
  //     type: 'reorder',
  //     paragraphID: 'p1',
  //     sentenceID: removed.id,
  //     priorSentenceText: `position: ${sourceIndex}`,
  //     newSentenceText: `position: ${destinationIndex}`,
  //     allText: getAllText(reorderedSentences),
  //   });
  // };
  
  // Get all text combined
  const getAllText = (currentSentences: Sentence[]): string => {
    return currentSentences.map(s => s.text).join(' ');
  };
  
  // Compute difference between texts
  const computeDiff = (oldText: string, newText: string): string => {
    return `removed: "${oldText}" added: "${newText}"`;
  };
  return (
    <>
      {(sentences?.length === 0) ? (<div>No sentences to your summaries... Try adding one with the button below.</div>) : null}
      <div className="space-y-1">
        {sentences?.map((sentence) => (
          <SentenceItem
            key={sentence.id}
            id={sentence.id}
            text={sentence.text}
            onChange={handleSentenceChange}
            onRemove={handleSentenceRemove}
            onAddAfter={() => handleAddSentence(sentence.id)}
            focused={focusedSentenceId === sentence.id}
          />
        ))}
      </div>
      <div className="mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => handleAddSentence(null)}
        >
          + Add Sentence
        </button>
      </div>
    </>
  );
};

export default SentenceList;