// // src/components/ParagraphSelection/ParagraphFooter.tsx
// import React from 'react';
// import { useSelector } from 'react-redux';
// import { useNavWLog } from '../../hooks/useNavWLog';
// import { RootState } from '../../store';
// import { useLogger } from '../../hooks/useLogger';

// const ParagraphFooter = () => {
//   const navigate = useNavWLog();
//   const { paragraphs } = useSelector((state: RootState) => state.content);
//   const [currentParagraphIndex, setCurrentParagraphIndex] = React.useState(0);
//   const logAction = useLogger();

//   const paragraphLength = (paragraphs?.length ?? 0)
  
//   // Handle next paragraph button
//   const handleNextParagraph = () => {
//     // Log completion of current paragraph
//     // logAction({
//     //   type: 'complete_paragraph',
//     //   paragraphID: paragraphs[currentParagraphIndex].id,
//     // });
    
//     if (currentParagraphIndex < paragraphLength - 1) {
//       setCurrentParagraphIndex(currentParagraphIndex + 1);
//     } else {
//       // End of study, navigate to ending page
//       logAction({
//         type: 'complete_phase',
//         phase: '5',
//       });
//       navigate('/ending');
//     }
//   };
  
//   return (
//     <div className="flex justify-end">
//       <button
//         className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//         onClick={handleNextParagraph}
//       >
//         {currentParagraphIndex < paragraphLength - 1 ? 'Next Paragraph' : 'Complete Study'}
//       </button>
//     </div>
//   );
// };

// export default ParagraphFooter;